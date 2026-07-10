-- Etapa 10 - Modelo de acesso de producao com Anonymous Auth, memberships e RLS.
-- Nao execute remotamente sem backup e validacao em ambiente controlado.

begin;

create table if not exists public.table_memberships (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (table_id, user_id)
);

comment on table public.table_memberships is 'Anonymous/authenticated Supabase users linked to tables. Required for production RLS isolation.';
comment on column public.table_memberships.role is 'Minimal MVP role: owner creates the table; member joins by share token.';

create index if not exists idx_table_memberships_user_id on public.table_memberships (user_id);
create index if not exists idx_table_memberships_table_role on public.table_memberships (table_id, role);

create or replace function public.is_table_member(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_memberships tm
    where tm.table_id = p_table_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_table_owner(p_table_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.table_memberships tm
    where tm.table_id = p_table_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
  );
$$;

create or replace function public.current_table_role(p_table_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tm.role
  from public.table_memberships tm
  where tm.table_id = p_table_id
    and tm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.create_table_with_consent(
  p_table_name text,
  p_terms_version text,
  p_privacy_version text,
  p_user_agent text default null
)
returns table (
  id uuid,
  share_token text,
  name text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  created_table public.tables%rowtype;
  normalized_table_name text;
  current_user uuid;
begin
  current_user := auth.uid();
  if current_user is null then
    raise exception 'authenticated session required' using errcode = '42501';
  end if;

  normalized_table_name := trim(p_table_name);

  if normalized_table_name is null or char_length(normalized_table_name) < 1 or char_length(normalized_table_name) > 120 then
    raise exception 'table name must have between 1 and 120 characters' using errcode = '22023';
  end if;

  if trim(p_terms_version) = '' or trim(p_privacy_version) = '' then
    raise exception 'terms and privacy versions are required' using errcode = '22023';
  end if;

  insert into public.tables (name)
  values (normalized_table_name)
  returning * into created_table;

  insert into public.table_memberships (table_id, user_id, role)
  values (created_table.id, current_user, 'owner')
  on conflict (table_id, user_id) do update
  set role = 'owner', last_seen_at = now();

  insert into public.consent_logs (
    table_id,
    participant_id,
    terms_version,
    privacy_version,
    user_agent
  ) values (
    created_table.id,
    null,
    trim(p_terms_version),
    trim(p_privacy_version),
    nullif(trim(coalesce(p_user_agent, '')), '')
  );

  insert into public.audit_logs (table_id, event_type, entity_type, entity_id, metadata)
  values (created_table.id, 'table_created', 'table', created_table.id, jsonb_build_object('role', 'owner'));

  return query
  select
    created_table.id,
    created_table.share_token,
    created_table.name,
    created_table.status,
    created_table.created_at;
end;
$$;

create or replace function public.join_table_by_share_token(p_share_token text)
returns table (
  id uuid,
  share_token text,
  name text,
  status text,
  receipt_total_cents integer,
  totals_compared_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  role text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  found_table public.tables%rowtype;
  current_user uuid;
  normalized_token text;
  membership_role text;
begin
  current_user := auth.uid();
  if current_user is null then
    raise exception 'authenticated session required' using errcode = '42501';
  end if;

  normalized_token := trim(coalesce(p_share_token, ''));
  if normalized_token = '' then
    raise exception 'share token is required' using errcode = '22023';
  end if;

  select * into found_table
  from public.tables t
  where t.share_token = normalized_token;

  if not found then
    raise exception 'table not found' using errcode = 'P0002';
  end if;

  if found_table.status = 'archived' then
    raise exception 'archived table cannot be joined by share link' using errcode = '42501';
  end if;

  insert into public.table_memberships (table_id, user_id, role)
  values (found_table.id, current_user, 'member')
  on conflict (table_id, user_id) do update
  set last_seen_at = now()
  returning public.table_memberships.role into membership_role;

  return query
  select
    found_table.id,
    found_table.share_token,
    found_table.name,
    found_table.status,
    found_table.receipt_total_cents,
    found_table.totals_compared_at,
    found_table.closed_at,
    found_table.archived_at,
    found_table.created_at,
    found_table.updated_at,
    membership_role;
end;
$$;

create or replace function public.prevent_table_id_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.table_id is distinct from new.table_id then
    raise exception 'table_id cannot be changed after creation' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_participants_table_id_change on public.participants;
create trigger prevent_participants_table_id_change
before update on public.participants
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_items_table_id_change on public.items;
create trigger prevent_items_table_id_change
before update on public.items
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_item_participants_table_id_change on public.item_participants;
create trigger prevent_item_participants_table_id_change
before update on public.item_participants
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_payments_table_id_change on public.payments;
create trigger prevent_payments_table_id_change
before update on public.payments
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_receipt_scans_table_id_change on public.receipt_scans;
create trigger prevent_receipt_scans_table_id_change
before update on public.receipt_scans
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_receipt_scan_items_table_id_change on public.receipt_scan_items;
create trigger prevent_receipt_scan_items_table_id_change
before update on public.receipt_scan_items
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_consent_logs_table_id_change on public.consent_logs;
create trigger prevent_consent_logs_table_id_change
before update on public.consent_logs
for each row execute function public.prevent_table_id_change();

drop trigger if exists prevent_audit_logs_table_id_change on public.audit_logs;
create trigger prevent_audit_logs_table_id_change
before update on public.audit_logs
for each row execute function public.prevent_table_id_change();

alter table public.tables enable row level security;
alter table public.table_settings enable row level security;
alter table public.participants enable row level security;
alter table public.items enable row level security;
alter table public.item_participants enable row level security;
alter table public.payments enable row level security;
alter table public.receipt_scans enable row level security;
alter table public.receipt_scan_items enable row level security;
alter table public.consent_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.table_memberships enable row level security;

-- Drop old/future policies if rerun.
do $$
declare policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('tables', 'table_settings', 'participants', 'items', 'item_participants', 'payments', 'receipt_scans', 'receipt_scan_items', 'consent_logs', 'audit_logs', 'table_memberships')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  end loop;
end $$;

create policy table_memberships_select_own_or_owner
on public.table_memberships for select to authenticated
using (user_id = auth.uid() or public.is_table_owner(table_id));

create policy tables_select_member
on public.tables for select to authenticated
using (public.is_table_member(id));

create policy tables_update_owner
on public.tables for update to authenticated
using (public.is_table_owner(id))
with check (public.is_table_owner(id));

create policy table_settings_select_member
on public.table_settings for select to authenticated
using (public.is_table_member(table_id));

create policy table_settings_update_owner
on public.table_settings for update to authenticated
using (public.is_table_owner(table_id))
with check (public.is_table_owner(table_id));

create policy participants_select_member
on public.participants for select to authenticated
using (public.is_table_member(table_id));

create policy participants_insert_member
on public.participants for insert to authenticated
with check (public.is_table_member(table_id));

create policy participants_update_member
on public.participants for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy participants_delete_member
on public.participants for delete to authenticated
using (public.is_table_member(table_id));

create policy items_select_member
on public.items for select to authenticated
using (public.is_table_member(table_id));

create policy items_insert_member
on public.items for insert to authenticated
with check (public.is_table_member(table_id));

create policy items_update_member
on public.items for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy items_delete_member
on public.items for delete to authenticated
using (public.is_table_member(table_id));

create policy item_participants_select_member
on public.item_participants for select to authenticated
using (public.is_table_member(table_id));

create policy item_participants_insert_member
on public.item_participants for insert to authenticated
with check (public.is_table_member(table_id));

create policy item_participants_update_member
on public.item_participants for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy item_participants_delete_member
on public.item_participants for delete to authenticated
using (public.is_table_member(table_id));

create policy payments_select_member
on public.payments for select to authenticated
using (public.is_table_member(table_id));

create policy payments_insert_member
on public.payments for insert to authenticated
with check (public.is_table_member(table_id));

create policy payments_update_member
on public.payments for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy payments_delete_owner
on public.payments for delete to authenticated
using (public.is_table_owner(table_id));

create policy receipt_scans_select_member
on public.receipt_scans for select to authenticated
using (public.is_table_member(table_id));

create policy receipt_scans_insert_member
on public.receipt_scans for insert to authenticated
with check (public.is_table_member(table_id));

create policy receipt_scans_update_member
on public.receipt_scans for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy receipt_scans_delete_owner
on public.receipt_scans for delete to authenticated
using (public.is_table_owner(table_id));

create policy receipt_scan_items_select_member
on public.receipt_scan_items for select to authenticated
using (public.is_table_member(table_id));

create policy receipt_scan_items_insert_member
on public.receipt_scan_items for insert to authenticated
with check (public.is_table_member(table_id));

create policy receipt_scan_items_update_member
on public.receipt_scan_items for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

create policy receipt_scan_items_delete_owner
on public.receipt_scan_items for delete to authenticated
using (public.is_table_owner(table_id));

create policy consent_logs_select_owner
on public.consent_logs for select to authenticated
using (public.is_table_owner(table_id));

create policy consent_logs_insert_member
on public.consent_logs for insert to authenticated
with check (public.is_table_member(table_id));

create policy audit_logs_select_owner
on public.audit_logs for select to authenticated
using (public.is_table_owner(table_id));

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

grant select on public.tables to authenticated;
grant update on public.tables to authenticated;

grant select, update on public.table_settings to authenticated;
grant select, insert, update, delete on public.participants to authenticated;
grant select, insert, update, delete on public.items to authenticated;
grant select, insert, update, delete on public.item_participants to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.receipt_scans to authenticated;
grant select, insert, update, delete on public.receipt_scan_items to authenticated;
grant select, insert on public.consent_logs to authenticated;
grant select on public.audit_logs to authenticated;
grant select on public.table_memberships to authenticated;

grant execute on function public.create_table_with_consent(text, text, text, text) to authenticated;
grant execute on function public.is_table_member(uuid) to authenticated;
grant execute on function public.is_table_owner(uuid) to authenticated;
grant execute on function public.current_table_role(uuid) to authenticated;
grant execute on function public.join_table_by_share_token(text) to authenticated;
grant execute on function public.upsert_manual_item_with_participants(uuid, uuid, text, integer, integer, timestamptz, text, jsonb) to authenticated;
grant execute on function public.void_manual_item(uuid, uuid) to authenticated;
grant execute on function public.confirm_receipt_scan_import(uuid, uuid, jsonb) to authenticated;

commit;
