# Security Notes

Use somente a chave publica/publishable do Supabase no frontend.

Nao publique antes de aplicar migrations, ativar RLS e provar isolamento entre mesas.

Segredos de backend, senhas de banco e chaves administrativas nunca devem entrar em arquivos do app ou documentacao com valores reais.
