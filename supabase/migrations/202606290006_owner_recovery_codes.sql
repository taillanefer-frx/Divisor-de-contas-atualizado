-- Recuperacao segura de dono por codigo gerado no backend.
-- Nao retorna hash, nao armazena codigo puro e permite resgate somente por usuario autenticado anonimo Supabase.

create table if not exists public.table_owner_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  attempts integer not null default 0 check (attempts >= 0 and attempts <= 5),
  created_at timestamptz not null default now()
);

create index if not exists idx_owner_recovery_codes_table_active
  on public.table_owner_recovery_codes(table_id, expires_at)
  where used_at is null;

alter table public.table_owner_recovery_codes enable row level security;

create policy owner_recovery_codes_no_direct_select
  on public.table_owner_recovery_codes for select
  using (false);

create policy owner_recovery_codes_no_direct_write
  on public.table_owner_recovery_codes for all
  using (false)
  with check (false);

create or replace function public.create_owner_recovery_code(p_table_id uuid)
returns table(recovery_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_code text := encode(gen_random_bytes(18), 'hex');
  v_expires_at timestamptz := now() + interval '24 hours';
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  if not public.is_table_owner(p_table_id) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  insert into public.table_owner_recovery_codes(table_id, code_hash, expires_at)
  values (p_table_id, encode(digest(p_table_id::text || ':' || v_code, 'sha256'), 'hex'), v_expires_at);

  return query select v_code, v_expires_at;
end;
$$;

create or replace function public.recover_table_owner(p_share_token text, p_recovery_code text)
returns public.tables
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_table public.tables%rowtype;
  v_code public.table_owner_recovery_codes%rowtype;
  v_hash text;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '42501';
  end if;

  select * into v_table from public.tables where share_token = p_share_token and status <> 'archived';
  if not found then
    raise exception 'table_not_found' using errcode = 'P0002';
  end if;

  v_hash := encode(digest(v_table.id::text || ':' || trim(p_recovery_code), 'sha256'), 'hex');

  select * into v_code
  from public.table_owner_recovery_codes
  where table_id = v_table.id
    and used_at is null
    and expires_at > now()
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'recovery_code_not_found' using errcode = 'P0002';
  end if;

  if v_code.attempts >= 5 then
    raise exception 'recovery_code_locked' using errcode = '42501';
  end if;

  if v_code.code_hash <> v_hash then
    update public.table_owner_recovery_codes set attempts = attempts + 1 where id = v_code.id;
    raise exception 'invalid_recovery_code' using errcode = '42501';
  end if;

  insert into public.table_memberships(table_id, user_id, role)
  values (v_table.id, v_user_id, 'owner')
  on conflict (table_id, user_id) do update set role = 'owner', last_seen_at = now();

  update public.table_owner_recovery_codes set used_at = now() where id = v_code.id;
  return v_table;
end;
$$;

revoke all on public.table_owner_recovery_codes from anon, authenticated;
grant execute on function public.create_owner_recovery_code(uuid) to authenticated;
grant execute on function public.recover_table_owner(text, text) to authenticated;
