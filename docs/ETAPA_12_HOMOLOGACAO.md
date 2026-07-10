# Etapa 12 - Plano de Homologacao em Supabase Novo e Vazio

Este plano deve ser executado somente depois da validacao local. Nao execute automaticamente em ambiente de producao.

## Objetivo

Validar o banco, RLS, Realtime, RPCs e isolamento em um projeto Supabase novo e vazio.

## Preparacao

- [ ] Criar um projeto Supabase novo e vazio para homologacao.
- [ ] Nao usar dados reais de clientes.
- [ ] Nao usar CPF, telefone, endereco ou dados sensiveis.
- [ ] Guardar chaves em local seguro e nunca enviar por e-mail.
- [ ] Configurar apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` no frontend.
- [ ] Nunca usar `service_role` no frontend.

## Aplicacao do Banco

- [ ] Revisar `supabase/schema.sql` e migrations antes de executar.
- [ ] Confirmar a fonte da verdade: migrations em ordem cronologica.
- [ ] Aplicar migrations em ordem cronologica no projeto vazio.
- [ ] Confirmar que as tabelas principais foram criadas.
- [ ] Confirmar que tabelas auxiliares de seguranca foram criadas quando aplicavel.
- [ ] Confirmar que `receipt_scans.storage_path` aceita valor nulo.
- [ ] Confirmar que RLS esta ativo nas tabelas protegidas.
- [ ] Confirmar que permissoes diretas para anon nao ficaram amplas em producao.

## Ordem Cronologica Esperada das Migrations

- [ ] `202606260001_create_table_with_consent_rpc.sql`
- [ ] `202606260002_items_quantity_integer.sql`
- [ ] `202606260003_manual_item_rpc.sql`
- [ ] `202606260004_enable_table_realtime.sql`
- [ ] `202606260005_enable_payments_realtime.sql`
- [ ] `202606290001_receipt_storage_realtime.sql`
- [ ] `202606290002_confirm_receipt_scan_import_rpc.sql`
- [ ] `202606290003_production_access_rls.sql`
- [ ] `202606290004_receipt_storage_policies_rls.sql`
- [ ] `202606290005_receipt_scan_storage_optional.sql`
- [ ] `202606290006_owner_recovery_codes.sql`
- [ ] `202606290007_free_plan_limits.sql`
- [ ] `202606290008_table_lifecycle_rpcs.sql`

## Teste Funcional

- [ ] Criar mesa pelo app.
- [ ] Registrar aceite de termos.
- [ ] Entrar na mesa por link em outro navegador/celular.
- [ ] Adicionar participantes.
- [ ] Adicionar itens manuais.
- [ ] Associar participantes aos itens.
- [ ] Registrar pagamento parcial.
- [ ] Registrar pagamento total.
- [ ] Cancelar pagamento.
- [ ] Conferir resumo final por participante.
- [ ] Exportar resumo.

## Teste Realtime

- [ ] Abrir a mesma mesa em dois celulares ou navegadores.
- [ ] Confirmar atualizacao de participantes nos dois lados.
- [ ] Confirmar atualizacao de itens nos dois lados.
- [ ] Confirmar atualizacao de pagamentos nos dois lados.
- [ ] Confirmar que uma mesa nao recebe eventos de outra mesa.

## Teste de Isolamento e RLS

- [ ] Criar mesa A com usuario/sessao A.
- [ ] Criar mesa B com usuario/sessao B.
- [ ] Confirmar que A nao consegue listar dados de B diretamente.
- [ ] Confirmar que B nao consegue listar dados de A diretamente.
- [ ] Confirmar que entrada por share token cria membership esperado.
- [ ] Confirmar que funcoes de dono exigem dono.
- [ ] Confirmar que recuperacao de dono usa codigo valido, hash e expiracao.

## OCR Local

- [ ] Confirmar que OCR local funciona com `tesseract.js` instalado.
- [ ] Confirmar que imagem nao vai para Storage no fluxo padrao.
- [ ] Confirmar que dados revisados sao persistidos.
- [ ] Confirmar que itens so sao criados apos confirmacao humana.

## Criterio de Saida

- [ ] Build local aprovado.
- [ ] Todas as migrations aplicadas em projeto vazio.
- [ ] RLS ativo e testado.
- [ ] Isolamento entre mesas provado.
- [ ] OCR local validado ou desabilitado com fallback manual claro.
- [ ] Nenhum segredo exposto em codigo, docs, logs ou Git.

Enquanto qualquer item critico estiver pendente, o status permanece NO-GO.
