-- Patch 003 - Cardapio compartilhado da mesa
-- Objetivo:
-- - Persistir itens de cardapio vinculados a uma mesa no Supabase.
-- - Permitir que todos os membros da mesa vejam o mesmo cardapio ao entrar por link/QR.
-- - Manter bares favoritos locais apenas como origem opcional para copiar itens.
--
-- Como aplicar:
-- 1. Validar primeiro em projeto Supabase de teste.
-- 2. Aplicar depois das migrations principais, especialmente depois de production_access_rls.
-- 3. Nao aplicar diretamente em producao sem backup.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
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

create table if not exists public.table_menu_items (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references public.tables(id) on delete cascade,
  consumption_type text not null default 'Outros',
  name text not null,
  amount_cents integer not null,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint table_menu_items_consumption_type_check
    check (consumption_type in ('Bebida', 'Comida', 'Petisco', 'Sobremesa', 'Drinks', 'Outros')),
  constraint table_menu_items_name_length
    check (char_length(trim(name)) between 1 and 140),
  constraint table_menu_items_amount_positive
    check (amount_cents >= 0 and amount_cents <= 99999999),
  constraint table_menu_items_source_check
    check (source in ('manual', 'saved_bar', 'menu_scan'))
);

create index if not exists idx_table_menu_items_table_id
on public.table_menu_items (table_id, created_at);

create unique index if not exists idx_table_menu_items_unique_name_type_amount
on public.table_menu_items (table_id, name, consumption_type, amount_cents);

drop trigger if exists set_table_menu_items_updated_at on public.table_menu_items;
create trigger set_table_menu_items_updated_at
before update on public.table_menu_items
for each row execute function public.set_updated_at();

drop trigger if exists prevent_table_menu_items_table_id_change on public.table_menu_items;
create trigger prevent_table_menu_items_table_id_change
before update on public.table_menu_items
for each row execute function public.prevent_table_id_change();

alter table public.table_menu_items enable row level security;

drop policy if exists table_menu_items_select_member on public.table_menu_items;
create policy table_menu_items_select_member
on public.table_menu_items for select to authenticated
using (public.is_table_member(table_id));

drop policy if exists table_menu_items_insert_member on public.table_menu_items;
create policy table_menu_items_insert_member
on public.table_menu_items for insert to authenticated
with check (public.is_table_member(table_id));

drop policy if exists table_menu_items_update_member on public.table_menu_items;
create policy table_menu_items_update_member
on public.table_menu_items for update to authenticated
using (public.is_table_member(table_id))
with check (public.is_table_member(table_id));

drop policy if exists table_menu_items_delete_owner on public.table_menu_items;
create policy table_menu_items_delete_owner
on public.table_menu_items for delete to authenticated
using (public.is_table_owner(table_id));

grant select, insert, update, delete on public.table_menu_items to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.table_menu_items;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
