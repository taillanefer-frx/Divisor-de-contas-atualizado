-- Enables Supabase Realtime for payments used by the table screen.
-- Review and execute manually in Supabase after approval.
-- The frontend filters by table_id, but this is not a production security boundary.

begin;

alter table public.payments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication where pubname = 'supabase_realtime'
  ) then
    raise exception 'Publication supabase_realtime does not exist in this project.';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;
end;
$$;

comment on table public.payments is 'Payment records. MVP Realtime enabled. Registered payments count toward paid totals; canceled payments remain in history and are excluded from calculations.';

commit;
