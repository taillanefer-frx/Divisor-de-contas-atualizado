-- Etapa 10 correcao local: OCR padrao roda no navegador e nao envia imagem para Storage.
-- Esta migracao permite registrar somente os dados revisados da nota.

alter table public.receipt_scans
  alter column storage_path drop not null;

comment on column public.receipt_scans.storage_path is
  'Opcional. Usado apenas em fluxo legado/opt-in com Supabase Storage. O fluxo padrao de custo zero mantem a imagem local no navegador.';
