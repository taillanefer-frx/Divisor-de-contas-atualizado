# Publicação

## Ordem segura

1. Criar backup do banco.
2. Aplicar migrations em ambiente de teste, na ordem dos arquivos.
3. Habilitar Anonymous Auth no Supabase.
4. Validar RLS com duas sessões anônimas.
5. Validar Realtime com RLS.
6. Validar Storage privado.
7. Deploy da Edge Function `process-receipt-scan`.
8. Configurar Secrets da Edge Function.
9. Configurar domínio e `VITE_APP_URL`.
10. Configurar SPA rewrite para `index.html`.
11. Rodar checklist pós-publicação.

## Supabase

Configurar Site URL, Redirect URLs, Anonymous Auth, Realtime publication, bucket `receipt-images`, Edge Function Secrets, `ALLOWED_ORIGINS` e backups.

## Hospedagem Vite

Build command: `npm run build`. Diretório de saída: `dist`.

Configure rewrite de SPA para rotas como `/mesa/:shareToken`.

## Rollback

Frontend: voltar para deploy anterior. Edge Function: redeploy da versão anterior. Banco: restaurar backup para mudanças destrutivas. Migrations de RLS podem ser revertidas com cuidado, mas nunca desative RLS em produção sem avaliar exposição.
