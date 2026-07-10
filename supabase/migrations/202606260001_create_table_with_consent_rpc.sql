-- Creates a transactional RPC for creating a table and registering legal consent together.
-- Do not execute automatically from the frontend. Apply this in Supabase after review/approval.

begin;

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
as $$
declare
  created_table public.tables%rowtype;
  normalized_table_name text;
begin
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

  -- public.create_default_table_settings runs after the insert above and creates table_settings.
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

  return query
  select
    created_table.id,
    created_table.share_token,
    created_table.name,
    created_table.status,
    created_table.created_at;
end;
$$;

grant execute on function public.create_table_with_consent(text, text, text, text) to anon, authenticated;

commit;
