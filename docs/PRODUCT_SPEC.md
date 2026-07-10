# Product Spec - Divisor de Contas

MVP mobile-first para dividir contas de mesa entre amigos em bares, restaurantes, churrascos, viagens e eventos.

Funcionalidades atuais preparadas: criar e acessar mesa por link, participantes com chegada/saida, itens manuais, pagamentos, resumo financeiro, compartilhamento, OCR local com revisao humana, PWA e sincronizacao Supabase Realtime.

Fluxo OCR: a imagem fica local no navegador; somente linhas reconhecidas/revisadas e valores corrigidos sao persistidos. Nenhum item e criado automaticamente.

Estado de publicacao: NO-GO ate validar migrations no Supabase remoto, RLS ativo, isolamento entre mesas e build de producao sem EPERM.
