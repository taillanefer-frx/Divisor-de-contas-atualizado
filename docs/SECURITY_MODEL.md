# Security Model

Frontend usa somente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. E proibido usar service_role, senha de banco ou segredo de fornecedor no navegador.

RLS deve estar ativo antes de publicar. A etapa local prepara policies e RPCs, mas ainda exige aplicacao e teste real no Supabase.

LGPD: coletar somente nome do participante e dados da mesa. Nao coletar CPF, telefone, endereco ou dados sensiveis.

Recuperacao de dono: codigo e gerado no banco, armazenado apenas como hash e expira em 24 horas.
