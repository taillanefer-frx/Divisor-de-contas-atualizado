# Zero Cost

O MVP deve operar sem dependencia paga obrigatoria.

OCR padrao: Tesseract.js no navegador, carregado sob demanda, uma imagem por vez, idioma portugues, com cancelamento e progresso.

Storage e Edge Function de OCR nao fazem parte do fluxo padrao. Se forem reativados, devem passar por revisao de seguranca e RLS.

Limites gratuitos estao centralizados em `src/config/freePlanLimits.ts` e espelhados em migration SQL.
