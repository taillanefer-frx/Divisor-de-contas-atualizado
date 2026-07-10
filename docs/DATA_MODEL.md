# Data Model

Fonte principal: `supabase/migrations` em ordem cronologica. `supabase/schema.sql` e um snapshot local consolidado e deve ser regenerado apos aplicar migrations em um projeto limpo.

Tabelas do MVP: `tables`, `table_settings`, `participants`, `items`, `item_participants`, `payments`, `receipt_scans`, `receipt_scan_items`, `consent_logs`, `audit_logs`.

Tabelas de seguranca preparadas na Etapa 10: `table_memberships` e `table_owner_recovery_codes`.

`receipt_scans.storage_path` e opcional. O fluxo padrao de custo zero nao usa Storage.

Os estados financeiros e totais calculados nao sao duplicados em colunas persistidas; a aplicacao calcula esses valores a partir dos itens, regras financeiras e pagamentos registrados.
