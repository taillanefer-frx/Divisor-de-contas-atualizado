# Divisor de Contas

MVP profissional para grupos dividirem contas em bares, restaurantes, churrascos, viagens e eventos.

## Stack

React, TypeScript, Vite, Tailwind, Supabase, PostgreSQL, Supabase Realtime, Supabase Storage, Edge Functions e PWA.

## Requisitos

- Node.js compatível com Vite.
- Projeto Supabase.
- Anonymous Auth habilitado no Supabase.
- Migrations aplicadas em ordem.
- Variáveis locais em `.env.local` sem commitar credenciais.

## Variáveis

Frontend:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_APP_URL=
```

Edge Function:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
ALLOWED_ORIGINS=
```

Não use `service_role`, senha do banco ou segredo OCR no frontend.

## Execução local

```bash
npm install
npm run typecheck
npm run build
```

Testes disponíveis:

```bash
npm run test:billing
npm run test:payments
npm run test:realtime
npm run test:sharing
npm run test:receipt-ocr
```

## Supabase

A segurança de produção usa Supabase Anonymous Auth e `table_memberships`. O link da mesa usa `share_token` apenas para entrada controlada; depois disso, RLS isola cada mesa por `auth.uid()`.

Aplique migrations em ordem e valide em ambiente de teste antes de produção.

## PWA

O service worker só faz cache do shell/arquivos estáticos. Dados privados do Supabase, Edge Functions, Storage, imagens e URLs assinadas devem ir pela rede.

## Limitações conhecidas

- OCR real depende de fornecedor e secrets configurados.
- Testes E2E/browser reais ainda precisam rodar em ambiente com build/dev server liberado.
- Revisão jurídica LGPD ainda é recomendada antes de publicação pública.
