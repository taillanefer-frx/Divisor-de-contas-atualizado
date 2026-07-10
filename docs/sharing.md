# Compartilhamento de mesa

O link publico da mesa usa somente `tables.share_token` no formato `/mesa/:shareToken`. O ID interno da mesa nao deve aparecer em URL, QR Code, texto compartilhado ou logs de interface.

A origem do link e resolvida por `VITE_APP_URL` quando existir. Em desenvolvimento, a aplicacao usa `window.location.origin` como fallback para evitar dominio fixo no codigo.

O QR Code e gerado localmente no frontend com `qrcode.react`. Nenhum servico externo de QR Code deve receber o link da mesa.

Para publicar como PWA hospedada, configure fallback de SPA no provedor de hospedagem para que rotas como `/mesa/:shareToken` sejam entregues ao `index.html`. Antes de publicacao real, a etapa final de seguranca precisa ativar e validar RLS no Supabase.
