-- Limites do plano gratuito alinhados com src/config/freePlanLimits.ts.

alter table public.tables drop constraint if exists tables_name_length;
alter table public.tables add constraint tables_name_length check (char_length(trim(name)) between 1 and 80);

alter table public.items drop constraint if exists items_notes_length;
alter table public.items add constraint items_notes_length check (notes is null or char_length(notes) <= 300);

alter table public.receipt_scan_items drop constraint if exists receipt_scan_items_raw_text_length;
alter table public.receipt_scan_items add constraint receipt_scan_items_raw_text_length check (char_length(raw_text) <= 500);

create or replace function public.enforce_table_child_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
begin
  if tg_table_name = 'participants' then
    v_limit := 30;
  elsif tg_table_name = 'items' then
    v_limit := 300;
  elsif tg_table_name = 'payments' then
    v_limit := 500;
  elsif tg_table_name = 'receipt_scans' then
    v_limit := 20;
  else
    return new;
  end if;

  execute format('select count(*) from public.%I where table_id = $1', tg_table_name) into v_count using new.table_id;
  if v_count >= v_limit then
    raise exception 'free_plan_limit_reached:%', tg_table_name using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limit_participants on public.participants;
create trigger trg_limit_participants before insert on public.participants for each row execute function public.enforce_table_child_limit();

drop trigger if exists trg_limit_items on public.items;
create trigger trg_limit_items before insert on public.items for each row execute function public.enforce_table_child_limit();

drop trigger if exists trg_limit_payments on public.payments;
create trigger trg_limit_payments before insert on public.payments for each row execute function public.enforce_table_child_limit();

drop trigger if exists trg_limit_receipt_scans on public.receipt_scans;
create trigger trg_limit_receipt_scans before insert on public.receipt_scans for each row execute function public.enforce_table_child_limit();

create or replace function public.enforce_receipt_scan_item_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*) into v_count from public.receipt_scan_items where receipt_scan_id = new.receipt_scan_id;
  if v_count >= 120 then
    raise exception 'free_plan_limit_reached:receipt_scan_items' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_limit_receipt_scan_items on public.receipt_scan_items;
create trigger trg_limit_receipt_scan_items before insert on public.receipt_scan_items for each row execute function public.enforce_receipt_scan_item_limit();
