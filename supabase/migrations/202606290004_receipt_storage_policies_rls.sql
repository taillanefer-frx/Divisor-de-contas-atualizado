-- Etapa 10 - Policies finais de Storage para o bucket privado receipt-images.
-- Depende de 202606290003_production_access_rls.sql.

begin;

drop policy if exists "receipt images insert only registered paths" on storage.objects;
drop policy if exists "receipt images read only registered paths" on storage.objects;
drop policy if exists "receipt images update only registered paths" on storage.objects;
drop policy if exists "receipt images delete only registered paths" on storage.objects;
drop policy if exists "receipt images insert only registered member paths" on storage.objects;
drop policy if exists "receipt images read only member paths" on storage.objects;
drop policy if exists "receipt images update only owner paths" on storage.objects;
drop policy if exists "receipt images delete only owner paths" on storage.objects;

create policy "receipt images insert only registered member paths"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipt-images'
  and (storage.foldername(storage.objects.name))[1] = 'tables'
  and (storage.foldername(storage.objects.name))[3] = 'receipts'
  and public.is_table_member(((storage.foldername(storage.objects.name))[2])::uuid)
  and exists (
    select 1 from public.receipt_scans rs
    where rs.storage_path = storage.objects.name
      and rs.table_id::text = (storage.foldername(storage.objects.name))[2]
  )
);

create policy "receipt images read only member paths"
on storage.objects for select to authenticated
using (
  bucket_id = 'receipt-images'
  and public.is_table_member(((storage.foldername(storage.objects.name))[2])::uuid)
  and exists (
    select 1 from public.receipt_scans rs
    where rs.storage_path = storage.objects.name
      and rs.table_id::text = (storage.foldername(storage.objects.name))[2]
  )
);

create policy "receipt images update only owner paths"
on storage.objects for update to authenticated
using (
  bucket_id = 'receipt-images'
  and public.is_table_owner(((storage.foldername(storage.objects.name))[2])::uuid)
  and exists (
    select 1 from public.receipt_scans rs
    where rs.storage_path = storage.objects.name
      and rs.table_id::text = (storage.foldername(storage.objects.name))[2]
  )
)
with check (
  bucket_id = 'receipt-images'
  and public.is_table_owner(((storage.foldername(storage.objects.name))[2])::uuid)
  and exists (
    select 1 from public.receipt_scans rs
    where rs.storage_path = storage.objects.name
      and rs.table_id::text = (storage.foldername(storage.objects.name))[2]
  )
);

create policy "receipt images delete only owner paths"
on storage.objects for delete to authenticated
using (
  bucket_id = 'receipt-images'
  and public.is_table_owner(((storage.foldername(storage.objects.name))[2])::uuid)
  and exists (
    select 1 from public.receipt_scans rs
    where rs.storage_path = storage.objects.name
      and rs.table_id::text = (storage.foldername(storage.objects.name))[2]
  )
);

commit;
