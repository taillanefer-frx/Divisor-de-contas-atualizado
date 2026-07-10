-- Etapa 9 - Confirmacao transacional e idempotente de linhas OCR revisadas.
-- Execute somente apos revisar no Supabase.

begin;

alter table public.receipt_scans drop constraint if exists receipt_scans_status_check;
alter table public.receipt_scans add constraint receipt_scans_status_check
check (status in ('pending', 'processing', 'completed', 'failed', 'canceled', 'confirmed'));

create or replace function public.confirm_receipt_scan_import(
  p_table_id uuid,
  p_receipt_scan_id uuid,
  p_lines jsonb
)
returns setof public.items
language plpgsql
set search_path = public
as $$
declare
  scan_record public.receipt_scans%rowtype;
  line_payload jsonb;
  scan_line public.receipt_scan_items%rowtype;
  created_item public.items%rowtype;
  selected_count integer := 0;
  participant_payload jsonb;
begin
  if jsonb_typeof(p_lines) <> 'array' then
    raise exception 'p_lines must be an array';
  end if;

  select * into scan_record
  from public.receipt_scans
  where id = p_receipt_scan_id and table_id = p_table_id
  for update;

  if not found then
    raise exception 'receipt scan not found';
  end if;

  if not exists (select 1 from public.tables t where t.id = p_table_id and t.status = 'open') then
    raise exception 'table must be open to import receipt items';
  end if;

  if scan_record.status = 'confirmed' then
    return query
    select i.* from public.items i
    where i.table_id = p_table_id and i.receipt_scan_id = p_receipt_scan_id
    order by i.created_at;
    return;
  end if;

  for line_payload in select * from jsonb_array_elements(p_lines)
  loop
    selected_count := selected_count + 1;

    select * into scan_line
    from public.receipt_scan_items
    where id = (line_payload->>'receipt_scan_item_id')::uuid
      and receipt_scan_id = p_receipt_scan_id
      and table_id = p_table_id
    for update;

    if not found then
      raise exception 'receipt scan item not found';
    end if;

    if scan_line.matched_item_id is not null then
      continue;
    end if;

    insert into public.items (
      table_id,
      name,
      amount_cents,
      quantity,
      consumed_at,
      source,
      status,
      receipt_scan_id,
      notes
    ) values (
      p_table_id,
      nullif(trim(line_payload->>'name'), ''),
      (line_payload->>'amount_cents')::integer,
      coalesce((line_payload->>'quantity')::numeric, 1),
      (line_payload->>'consumed_at')::timestamptz,
      'ocr',
      'active',
      p_receipt_scan_id,
      'Criado apos revisao humana da nota.'
    )
    returning * into created_item;

    for participant_payload in select * from jsonb_array_elements(coalesce(line_payload->'participants', '[]'::jsonb))
    loop
      insert into public.item_participants (
        table_id,
        item_id,
        participant_id,
        assignment_type,
        share_weight
      ) values (
        p_table_id,
        created_item.id,
        (participant_payload->>'participant_id')::uuid,
        coalesce(nullif(participant_payload->>'assignment_type', ''), 'manual'),
        1
      )
      on conflict (item_id, participant_id) do nothing;
    end loop;

    update public.receipt_scan_items
    set matched_item_id = created_item.id,
        review_status = case when review_status = 'ignored' then 'ignored' else 'accepted' end
    where id = scan_line.id;
  end loop;

  if selected_count = 0 then
    raise exception 'no receipt lines selected';
  end if;

  update public.receipt_scan_items
  set review_status = 'ignored'
  where receipt_scan_id = p_receipt_scan_id
    and table_id = p_table_id
    and matched_item_id is null
    and review_status <> 'ignored';

  update public.receipt_scans
  set status = 'confirmed', processed_at = coalesce(processed_at, now()), error_message = null
  where id = p_receipt_scan_id and table_id = p_table_id;

  return query
  select i.* from public.items i
  where i.table_id = p_table_id and i.receipt_scan_id = p_receipt_scan_id
  order by i.created_at;
end;
$$;

grant execute on function public.confirm_receipt_scan_import(uuid, uuid, jsonb) to authenticated;

commit;
