-- SCHEMA CONSOLIDADO POS-ETAPA 10 (LOCAL)
-- Fonte da verdade operacional: migrations em supabase/migrations aplicadas em ordem.
-- Este arquivo foi atualizado para remover a obrigatoriedade de Storage no fluxo padrao OCR.
-- NAO publicar antes de aplicar/testar migrations, ativar RLS e provar isolamento multi-mesa.

-- Divisor de Contas - Supabase/PostgreSQL schema
-- MVP scope: public tables with RLS disabled.
-- Future security step: enable RLS and replace broad grants with share-token/session scoped policies.

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create or replace function public.validate_table_relationships()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'items' and new.receipt_scan_id is not null then
    if not exists (
      select 1 from public.receipt_scans rs
      where rs.id = new.receipt_scan_id and rs.table_id = new.table_id
    ) then
      raise exception 'receipt_scan_id must belong to the same table as item';
    end if;
  end if;

  if tg_table_name = 'receipt_scan_items' and new.matched_item_id is not null then
    if not exists (
      select 1 from public.items i
      where i.id = new.matched_item_id and i.table_id = new.table_id
    ) then
      raise exception 'matched_item_id must belong to the same table as receipt scan item';
    end if;
  end if;

  if tg_table_name = 'audit_logs' and new.table_id is not null and new.participant_id is not null then
    if not exists (
      select 1 from public.participants p
      where p.id = new.participant_id and p.table_id = new.table_id
    ) then
      raise exception 'audit log participant_id must belong to the same table';
    end if;
  end if;

  return new;
end;
$$;

create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  share_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'open' check (status in ('open', 'closed', 'archived')),
  receipt_total_cents integer check (receipt_total_cents is null or receipt_total_cents >= 0),
  totals_compared_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tables_closed_at_required check (status <> 'closed' or closed_at is not null),
  constraint tables_archived_at_required check (status <> 'archived' or archived_at is not null)
);

comment on table public.tables is 'Shared bill/table created by a group. Access is currently by share_token; RLS is disabled for MVP and must be enabled before production.';
comment on column public.tables.share_token is 'Long random token used for shared links and QR Codes. Do not expose table listing endpoints.';
comment on column public.tables.receipt_total_cents is 'Total read from receipt/OCR or typed by the user, in cents.';


create or replace function public.create_default_table_settings()
returns trigger
language plpgsql
as $$
begin
  insert into public.table_settings (table_id) values (new.id)
  on conflict (table_id) do nothing;
  return new;
end;
$$;

create table if not exists public.table_settings (
  table_id uuid primary key references public.tables(id) on delete cascade,
  service_fee_percent numeric(5,2) not null default 0 check (service_fee_percent >= 0 and service_fee_percent <= 100),
  cover_charge_cents integer not null default 0 check (cover_charge_cents >= 0),
  minimum_consumption_cents integer not null default 0 check (minimum_consumption_cents >= 0),
  rounding_strategy text not null default 'largest_remainder' check (rounding_strategy in ('largest_remainder', 'first_participant', 'manual_adjustment')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.table_settings is 'Bill-level settings: service fee, cover charge, minimum consumption and rounding behavior.';

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  arrival_at timestamptz not null,
  departure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, table_id),
  constraint participants_departure_after_arrival check (departure_at is null or departure_at >= arrival_at)
);

comment on table public.participants is 'LGPD-minimal participant data: display name and table participation times only.';
comment on column public.participants.arrival_at is 'Used to exclude late arrivals from earlier items.';
comment on column public.participants.departure_at is 'Optional. Used to exclude participants from items consumed after leaving.';

create table if not exists public.receipt_scans (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  storage_path text,
  original_file_name text,
  mime_type text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'canceled')),
  receipt_total_cents integer check (receipt_total_cents is null or receipt_total_cents >= 0),
  raw_ocr_text text,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, table_id)
);

comment on table public.receipt_scans is 'Receipt image scan metadata. The image itself lives in Supabase Storage.';
comment on column public.receipt_scans.raw_ocr_text is 'Raw OCR output for review/debugging. Avoid storing personal data beyond receipt content.';

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 140),
  amount_cents integer not null check (amount_cents >= 0),
  quantity numeric(10,3) not null default 1 check (quantity > 0),
  consumed_at timestamptz not null,
  source text not null default 'manual' check (source in ('manual', 'ocr')),
  status text not null default 'active' check (status in ('active', 'void')),
  receipt_scan_id uuid references public.receipt_scans(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, table_id)
);

comment on table public.items is 'Bill items, either manually created or accepted from OCR review.';
comment on column public.items.consumed_at is 'Timestamp used with participant arrival/departure to suggest eligible participants.';

create table if not exists public.item_participants (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  item_id uuid not null,
  participant_id uuid not null,
  assignment_type text not null default 'manual' check (assignment_type in ('manual', 'automatic', 'suggested')),
  share_weight numeric(10,4) not null default 1 check (share_weight > 0),
  created_at timestamptz not null default now(),
  foreign key (item_id, table_id) references public.items(id, table_id) on delete cascade,
  foreign key (participant_id, table_id) references public.participants(id, table_id) on delete cascade,
  unique (item_id, participant_id)
);

comment on table public.item_participants is 'Many-to-many relationship between bill items and participants sharing each item.';

create table if not exists public.receipt_scan_items (
  id uuid primary key default gen_random_uuid(),
  receipt_scan_id uuid not null,
  table_id uuid not null references public.tables(id) on delete cascade,
  line_index integer not null check (line_index >= 0),
  raw_text text not null,
  recognized_name text,
  recognized_amount_cents integer check (recognized_amount_cents is null or recognized_amount_cents >= 0),
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  review_status text not null default 'pending' check (review_status in ('pending', 'accepted', 'ignored', 'edited')),
  matched_item_id uuid references public.items(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (receipt_scan_id, table_id) references public.receipt_scans(id, table_id) on delete cascade,
  unique (receipt_scan_id, line_index)
);

comment on table public.receipt_scan_items is 'OCR-recognized receipt lines waiting for user review and optional conversion into items.';

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  participant_id uuid not null,
  amount_cents integer not null check (amount_cents > 0),
  payment_type text not null check (payment_type in ('partial', 'total')),
  status text not null default 'registered' check (status in ('registered', 'canceled')),
  paid_at timestamptz not null default now(),
  canceled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (participant_id, table_id) references public.participants(id, table_id) on delete cascade,
  constraint payments_canceled_at_required check (status <> 'canceled' or canceled_at is not null)
);

comment on table public.payments is 'Payment records. Multiple partial payments are allowed; total marks a participant as fully paid at application level.';

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  participant_id uuid,
  terms_version text not null check (char_length(trim(terms_version)) between 1 and 40),
  privacy_version text not null check (char_length(trim(privacy_version)) between 1 and 40),
  accepted_at timestamptz not null default now(),
  user_agent text,
  created_at timestamptz not null default now(),
  foreign key (participant_id, table_id) references public.participants(id, table_id) on delete cascade
);

comment on table public.consent_logs is 'LGPD consent audit. Stores terms/privacy versions accepted by each participant without CPF, phone, address or sensitive data.';

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.tables(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  event_type text not null check (char_length(trim(event_type)) between 1 and 80),
  entity_type text check (entity_type is null or entity_type in ('table', 'participant', 'item', 'payment', 'receipt_scan', 'receipt_scan_item', 'settings', 'consent')),
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Operational audit log for important table events. Keep metadata free of sensitive personal data.';

create index if not exists idx_tables_share_token on public.tables (share_token);
create index if not exists idx_tables_status_created_at on public.tables (status, created_at desc);

create index if not exists idx_participants_table_id on public.participants (table_id);
create index if not exists idx_participants_table_arrival on public.participants (table_id, arrival_at);
create unique index if not exists idx_participants_unique_name_per_table
on public.participants (table_id, lower(trim(display_name)));

create index if not exists idx_items_table_id on public.items (table_id);
create index if not exists idx_items_table_consumed_at on public.items (table_id, consumed_at);
create index if not exists idx_items_receipt_scan_id on public.items (receipt_scan_id);
create index if not exists idx_items_status on public.items (status);

create index if not exists idx_item_participants_table_id on public.item_participants (table_id);
create index if not exists idx_item_participants_item_id on public.item_participants (item_id);
create index if not exists idx_item_participants_participant_id on public.item_participants (participant_id);

create index if not exists idx_payments_table_id on public.payments (table_id);
create index if not exists idx_payments_participant_id on public.payments (participant_id);
create index if not exists idx_payments_table_status on public.payments (table_id, status);

create index if not exists idx_receipt_scans_table_id on public.receipt_scans (table_id);
create index if not exists idx_receipt_scans_status on public.receipt_scans (status);

create index if not exists idx_receipt_scan_items_scan_id on public.receipt_scan_items (receipt_scan_id);
create index if not exists idx_receipt_scan_items_table_status on public.receipt_scan_items (table_id, review_status);
create index if not exists idx_receipt_scan_items_matched_item_id on public.receipt_scan_items (matched_item_id);

create index if not exists idx_consent_logs_table_id on public.consent_logs (table_id);
create index if not exists idx_consent_logs_participant_id on public.consent_logs (participant_id);

create index if not exists idx_audit_logs_table_created_at on public.audit_logs (table_id, created_at desc);
create index if not exists idx_audit_logs_event_type on public.audit_logs (event_type);
create index if not exists idx_audit_logs_metadata_gin on public.audit_logs using gin (metadata);

drop trigger if exists create_default_table_settings on public.tables;
create trigger create_default_table_settings
after insert on public.tables
for each row execute function public.create_default_table_settings();

drop trigger if exists set_tables_updated_at on public.tables;
create trigger set_tables_updated_at
before update on public.tables
for each row execute function public.set_updated_at();

drop trigger if exists set_table_settings_updated_at on public.table_settings;
create trigger set_table_settings_updated_at
before update on public.table_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_participants_updated_at on public.participants;
create trigger set_participants_updated_at
before update on public.participants
for each row execute function public.set_updated_at();

drop trigger if exists set_receipt_scans_updated_at on public.receipt_scans;
create trigger set_receipt_scans_updated_at
before update on public.receipt_scans
for each row execute function public.set_updated_at();

drop trigger if exists set_items_updated_at on public.items;
create trigger set_items_updated_at
before update on public.items
for each row execute function public.set_updated_at();

drop trigger if exists set_receipt_scan_items_updated_at on public.receipt_scan_items;
create trigger set_receipt_scan_items_updated_at
before update on public.receipt_scan_items
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();


drop trigger if exists validate_items_table_relationships on public.items;
create trigger validate_items_table_relationships
before insert or update on public.items
for each row execute function public.validate_table_relationships();

drop trigger if exists validate_receipt_scan_items_table_relationships on public.receipt_scan_items;
create trigger validate_receipt_scan_items_table_relationships
before insert or update on public.receipt_scan_items
for each row execute function public.validate_table_relationships();

drop trigger if exists validate_audit_logs_table_relationships on public.audit_logs;
create trigger validate_audit_logs_table_relationships
before insert or update on public.audit_logs
for each row execute function public.validate_table_relationships();

alter table public.tables disable row level security;
alter table public.table_settings disable row level security;
alter table public.participants disable row level security;
alter table public.items disable row level security;
alter table public.item_participants disable row level security;
alter table public.payments disable row level security;
alter table public.receipt_scans disable row level security;
alter table public.receipt_scan_items disable row level security;
alter table public.consent_logs disable row level security;
alter table public.audit_logs disable row level security;

comment on table public.item_participants is 'MVP RLS disabled. Future policy: allow access only when request context contains a valid table share token/session for the parent item table.';
comment on table public.payments is 'MVP RLS disabled. Future policy: restrict reads/writes to the payment table share token and participant session.';

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.tables to anon, authenticated;
grant select, insert, update, delete on public.table_settings to anon, authenticated;
grant select, insert, update, delete on public.participants to anon, authenticated;
grant select, insert, update, delete on public.items to anon, authenticated;
grant select, insert, update, delete on public.item_participants to anon, authenticated;
grant select, insert, update, delete on public.payments to anon, authenticated;
grant select, insert, update, delete on public.receipt_scans to anon, authenticated;
grant select, insert, update, delete on public.receipt_scan_items to anon, authenticated;
grant select, insert on public.consent_logs to anon, authenticated;
grant select, insert on public.audit_logs to anon, authenticated;

-- Future RLS checklist:
-- 1. Enable RLS on every table before production.
-- 2. Store the active table share token/session in a transaction-scoped setting or use RPC functions.
-- 3. Replace broad table grants with RPC grants for create/join/update flows.
-- 4. Keep receipt Storage private and authorize access by table/session.
-- 5. Avoid policies that allow global table listing.

commit;
