-- Etapa 9/10 - Bucket privado para fotos de notas e Realtime para OCR.
-- As policies finais do Storage ficam em 202606290004_receipt_storage_policies_rls.sql, apos criar memberships/RLS.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-images',
  'receipt-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 8388608,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

alter table public.receipt_scans replica identity full;
alter table public.receipt_scan_items replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.receipt_scans;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.receipt_scan_items;
exception when duplicate_object then null;
end $$;

commit;
