# Segurança

## Modelo de acesso

O MVP usa Supabase Anonymous Auth. Cada sessão autenticada entra na mesa por RPC segura e recebe uma linha em `table_memberships`.

`share_token` localiza a mesa, mas não é autorização permanente. A autorização real fica em RLS usando `auth.uid()`.

## RLS

A migration `202606290003_production_access_rls.sql` ativa RLS em todas as tabelas de dados e cria policies por tabela.

## Storage

No fluxo padrão, fotos de notas ficam somente no navegador do usuário. O banco salva apenas dados reconhecidos e revisados. Storage privado é legado/opt-in e não deve ser usado sem revisão de RLS.

## Segredos

Segredos proibidos no frontend: service_role, senha do banco, segredo OCR, Secret Key de fornecedor e tokens manuais.

## Edge Functions

Edge Functions devem validar JWT, membership da mesa, método HTTP, payload e origem CORS. Não retornar stack trace nem resposta bruta de fornecedor.

## Reporte

Para vulnerabilidades, registre o problema com passos de reprodução, impacto e evidência mínima, sem expor dados sensíveis reais.

## Riscos conhecidos

- OCR externo ainda pendente de fornecedor.
- Rate limiting robusto depende de configuração adicional de infraestrutura.
- Publicação só deve ocorrer após validação real de RLS, Storage e isolamento entre mesas no Supabase.
