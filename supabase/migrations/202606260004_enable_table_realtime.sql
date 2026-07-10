-- Enables Supabase Realtime only for the tables used by the current table screen.
-- Review and execute manually in Supabase after approval.
-- The frontend filters by table id, but this is not a production security boundary.

begin;

alter table public.tables replica identity full;
alter table public.table_settings replica identity full;
alter table public.participants replica identity full;
alter table public.items replica identity full;
alter table public.item_participants replica identity full;

do $$
declare
  realtime_publication_exists boolean;
begin
  select exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) into realtime_publication_exists;

  if not realtime_publication_exists then
    raise exception 'Publication supabase_realtime does not exist in this project.';
  end if;
end;
$$;

do $$
declare
  table_names text[] := array['tables', 'table_settings', 'participants', 'items', 'item_participants'];
  table_name text;
begin
  foreach table_name in array table_names loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;

comment on table public.tables is 'Shared bill/table created by a group. MVP Realtime enabled. Frontend filtering by table id is not sufficient for production security; RLS remains required before publication.';
comment on table public.item_participants is 'MVP Realtime enabled for table screen synchronization. Future policy: allow access only when request context contains a valid table share token/session for the parent table.';

commit;
