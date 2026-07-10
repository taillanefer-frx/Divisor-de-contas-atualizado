# Etapa 11 - Checklist Local no Computador de Casa

Use este checklist quando estiver em um ambiente onde seja possivel instalar dependencias e executar comandos locais.

## Preparacao

- [ ] Confirmar que estou na pasta correta do projeto.
- [ ] Confirmar que `.env.local` existe, sem copiar valores para chats, e-mails ou prints.
- [ ] Confirmar que `.env.local` continua protegido pelo `.gitignore`.
- [ ] Conferir se existe apenas um lockfile depois da instalacao.
- [ ] Definir ou documentar a versao recomendada do Node.

## Dependencias

- [ ] Executar instalacao com o gerenciador escolhido.
- [ ] Confirmar que `tesseract.js` foi instalado em `node_modules`.
- [ ] Confirmar que foi gerado um lockfile unico e consistente.
- [ ] Verificar se nao surgiram SDKs pagos de OCR ou dependencias duplicadas.

## Diagnostico do `spawn EPERM`

- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm run build`.
- [ ] Se aparecer `spawn EPERM`, verificar antivirus/Defender bloqueando binarios em `node_modules`.
- [ ] Se aparecer `spawn EPERM`, apagar `node_modules` e reinstalar dependencias.
- [ ] Se aparecer `spawn EPERM`, testar em PowerShell normal, PowerShell como usuario comum e terminal do VS Code.
- [ ] Se aparecer `spawn EPERM`, verificar se o projeto esta em pasta sincronizada, protegida ou com permissao restrita.
- [ ] Se aparecer `spawn EPERM`, testar executar novamente apos reiniciar o computador.

## Testes Locais

- [ ] Rodar `npm run test:billing`.
- [ ] Rodar `npm run test:payments`.
- [ ] Rodar `npm run test:realtime`.
- [ ] Rodar `npm run test:sharing`.
- [ ] Rodar `npm run test:receipt-ocr`.
- [ ] Rodar `npm run typecheck`.
- [ ] Rodar `npm run build`.
- [ ] Abrir o app localmente com `npm run dev`.

## OCR Local

- [ ] Testar selecionar uma imagem pequena e valida de nota.
- [ ] Confirmar que a imagem nao e enviada por padrao para Storage.
- [ ] Confirmar que o OCR mostra progresso.
- [ ] Confirmar que o cancelamento funciona.
- [ ] Confirmar que nenhuma linha vira item automaticamente.
- [ ] Confirmar que a revisao humana continua obrigatoria.
- [ ] Confirmar que uma falha no OCR ainda permite cadastro manual.

## Exportacao

- [ ] Testar copiar resumo.
- [ ] Testar compartilhar resumo no celular, quando disponivel.
- [ ] Testar baixar CSV.
- [ ] Confirmar que o CSV nao contem token da mesa, UUID interno ou segredo.

## Resultado

- [ ] Marcar como aprovado localmente apenas se typecheck, testes e build passarem.
- [ ] Manter status NO-GO se build, OCR, migrations, RLS ou isolamento nao forem testados de verdade.
