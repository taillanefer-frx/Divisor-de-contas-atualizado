-- Ciclo de vida explicito: open -> closed -> open, closed/open -> archived, archived/open/closed -> deleted por soft delete.
-- O schema original nao possui status deleted; por ora a exclusao segura e DELETE fisico com cascade para donos.

create or replace function public.close_table(p_table_id uuid)
returns public.tables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
begin
  if not public.is_table_owner(p_table_id) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  update public.tables
  set status = 'closed', closed_at = coalesce(closed_at, now()), updated_at = now()
  where id = p_table_id and status = 'open'
  returning * into v_table;

  if not found then raise exception 'invalid_table_lifecycle_transition' using errcode = '23514'; end if;
  return v_table;
end;
$$;

create or replace function public.reopen_table(p_table_id uuid)
returns public.tables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
begin
  if not public.is_table_owner(p_table_id) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  update public.tables
  set status = 'open', closed_at = null, updated_at = now()
  where id = p_table_id and status = 'closed'
  returning * into v_table;

  if not found then raise exception 'invalid_table_lifecycle_transition' using errcode = '23514'; end if;
  return v_table;
end;
$$;

create or replace function public.archive_table(p_table_id uuid)
returns public.tables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table public.tables%rowtype;
begin
  if not public.is_table_owner(p_table_id) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  update public.tables
  set status = 'archived', archived_at = coalesce(archived_at, now()), updated_at = now()
  where id = p_table_id and status in ('open', 'closed')
  returning * into v_table;

  if not found then raise exception 'invalid_table_lifecycle_transition' using errcode = '23514'; end if;
  return v_table;
end;
$$;

create or replace function public.delete_table(p_table_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_table_owner(p_table_id) then
    raise exception 'owner_required' using errcode = '42501';
  end if;

  delete from public.tables where id = p_table_id;
end;
$$;

grant execute on function public.close_table(uuid) to authenticated;
grant execute on function public.reopen_table(uuid) to authenticated;
grant execute on function public.archive_table(uuid) to authenticated;
grant execute on function public.delete_table(uuid) to authenticated;
