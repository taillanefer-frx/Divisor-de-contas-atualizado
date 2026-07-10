# Receipt OCR

O fluxo padrao usa OCR local no navegador com Tesseract.js. A foto nao e enviada por padrao e nao e gravada no Storage.

Regras obrigatorias: uma imagem por vez, progresso visivel, cancelamento, revisao humana obrigatoria e nenhuma criacao automatica de item.

Se `tesseract.js` nao estiver instalado, a interface deve informar que o OCR local esta indisponivel e manter o cadastro/revisao manual.

Edge Function e Storage sao considerados legado/opt-in e nao devem ser publicados sem revisao de RLS.
