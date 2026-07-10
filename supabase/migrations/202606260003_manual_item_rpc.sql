-- Transactional RPCs for manual item creation/editing and voiding.
-- Review and execute manually in Supabase after approval.

begin;

create or replace function public.upsert_manual_item_with_participants(
  p_table_id uuid,
  p_item_id uuid,
  p_name text,
  p_amount_cents integer,
  p_quantity integer,
  p_consumed_at timestamptz,
  p_notes text,
  p_participants jsonb
)
returns table (
  id uuid,
  table_id uuid,
  name text,
  amount_cents integer,
  quantity numeric,
  consumed_at timestamptz,
  source text,
  status text,
  receipt_scan_id uuid,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  participants jsonb
)
language plpgsql
as $$
declare
  saved_item public.items%rowtype;
  participant_entry jsonb;
  participant_id_value uuid;
  assignment_type_value text;
begin
  if not exists (select 1 from public.tables t where t.id = p_table_id and t.status = 'open') then
    raise exception 'table must exist and be open' using errcode = '22023';
  end if;

  if trim(coalesce(p_name, '')) = '' or char_length(trim(p_name)) > 140 then
    raise exception 'item name must have between 1 and 140 characters' using errcode = '22023';
  end if;

  if p_amount_cents is null or p_amount_cents < 0 then
    raise exception 'amount_cents must be greater than or equal to zero' using errcode = '22023';
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 9999 then
    raise exception 'quantity must be between 1 and 9999' using errcode = '22023';
  end if;

  if p_consumed_at is null then
    raise exception 'consumed_at is required' using errcode = '22023';
  end if;

  if p_participants is null or jsonb_typeof(p_participants) <> 'array' then
    raise exception 'participants must be a json array' using errcode = '22023';
  end if;

  if p_item_id is null then
    insert into public.items (
      table_id,
      name,
      amount_cents,
      quantity,
      consumed_at,
      source,
      status,
      notes
    ) values (
      p_table_id,
      trim(p_name),
      p_amount_cents,
      p_quantity,
      p_consumed_at,
      'manual',
      'active',
      nullif(trim(coalesce(p_notes, '')), '')
    ) returning * into saved_item;
  else
    update public.items
    set
      name = trim(p_name),
      amount_cents = p_amount_cents,
      quantity = p_quantity,
      consumed_at = p_consumed_at,
      notes = nullif(trim(coalesce(p_notes, '')), '')
    where public.items.id = p_item_id
      and public.items.table_id = p_table_id
      and public.items.source = 'manual'
      and public.items.status = 'active'
    returning * into saved_item;

    if saved_item.id is null then
      raise exception 'manual active item not found' using errcode = 'P0002';
    end if;

    delete from public.item_participants
    where item_id = saved_item.id
      and table_id = p_table_id;
  end if;

  for participant_entry in select * from jsonb_array_elements(p_participants)
  loop
    participant_id_value := (participant_entry ->> 'participant_id')::uuid;
    assignment_type_value := coalesce(participant_entry ->> 'assignment_type', 'manual');

    if assignment_type_value not in ('manual', 'suggested') then
      raise exception 'invalid assignment_type for reviewed manual flow' using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.participants p
      where p.id = participant_id_value and p.table_id = p_table_id
    ) then
      raise exception 'participant must belong to the same table' using errcode = '22023';
    end if;

    insert into public.item_participants (
      table_id,
      item_id,
      participant_id,
      assignment_type,
      share_weight
    ) values (
      p_table_id,
      saved_item.id,
      participant_id_value,
      assignment_type_value,
      1
    );
  end loop;

  return query
  select
    i.id,
    i.table_id,
    i.name,
    i.amount_cents,
    i.quantity,
    i.consumed_at,
    i.source,
    i.status,
    i.receipt_scan_id,
    i.notes,
    i.created_at,
    i.updated_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ip.id,
          'participant_id', ip.participant_id,
          'assignment_type', ip.assignment_type,
          'share_weight', ip.share_weight,
          'created_at', ip.created_at
        ) order by ip.created_at
      ) filter (where ip.id is not null),
      '[]'::jsonb
    ) as participants
  from public.items i
  left join public.item_participants ip on ip.item_id = i.id and ip.table_id = i.table_id
  where i.id = saved_item.id
  group by i.id;
end;
$$;

create or replace function public.void_manual_item(
  p_table_id uuid,
  p_item_id uuid
)
returns public.items
language plpgsql
as $$
declare
  voided_item public.items%rowtype;
begin
  if not exists (select 1 from public.tables t where t.id = p_table_id and t.status = 'open') then
    raise exception 'table must exist and be open' using errcode = '22023';
  end if;

  update public.items
  set status = 'void'
  where id = p_item_id
    and table_id = p_table_id
    and source = 'manual'
    and status = 'active'
  returning * into voided_item;

  if voided_item.id is null then
    raise exception 'manual active item not found' using errcode = 'P0002';
  end if;

  return voided_item;
end;
$$;

grant execute on function public.upsert_manual_item_with_participants(uuid, uuid, text, integer, integer, timestamptz, text, jsonb) to anon, authenticated;
grant execute on function public.void_manual_item(uuid, uuid) to anon, authenticated;

commit;
