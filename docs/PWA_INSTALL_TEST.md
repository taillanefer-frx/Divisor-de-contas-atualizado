# PWA Install Test

Este projeto foi preparado para PWA, mas a PWA so deve ser considerada validada depois de instalacao de dependencias, build real e teste em celular.

## 1. Instalar dependencias

```bash
npm install
```

Confirme que `vite-plugin-pwa` foi instalado e que existe apenas um lockfile.

## 2. Executar verificacoes locais

```bash
npm run typecheck
npm run build
```

Se o build falhar com `spawn EPERM`, verifique antivirus/Defender, permissoes da pasta, pasta sincronizada e reinstale `node_modules`.

## 3. Testar o manifest

Depois do build, abra a previa local:

```bash
npm run preview
```

No Chrome DevTools, confira em Application > Manifest:

- name: Divisor de Contas
- short_name: Divisor
- start_url: /
- scope: /
- display: standalone
- orientation: portrait
- theme_color: #b9dfcb
- background_color: #f7f3ea
- icones 192x192, 512x512 e maskable

## 4. Testar o service worker

No Chrome DevTools, confira em Application > Service Workers:

- se existe service worker registrado em producao;
- se o app carrega normalmente mesmo antes do service worker controlar a pagina;
- se uma nova build aciona atualizacao automatica segura.

## 5. Publicar a pasta dist

Publique somente a pasta `dist` gerada pelo build.

No Netlify, confirme:

- build command: `npm run build`;
- publish directory: `dist`;
- arquivo `_redirects` presente com `/* /index.html 200`.

## 6. Instalar no Android

1. Abra o site publicado no Chrome Android.
2. Abra o menu do Chrome.
3. Toque em `Instalar app` ou `Adicionar a tela inicial`.
4. Confirme se o icone aparece na tela inicial.
5. Abra pelo icone e confirme se abre em modo standalone, sem a barra normal do navegador.

## 7. Remover a PWA do celular

1. Pressione o icone do app na tela inicial.
2. Toque em remover/desinstalar.
3. Opcionalmente, limpe dados do site no Chrome se precisar repetir o teste do zero.

## 8. Atualizar uma versao instalada

1. Gere uma nova build.
2. Publique a nova pasta `dist`.
3. Abra a PWA instalada.
4. Feche e abra novamente se necessario.
5. Confirme se a nova versao aparece sem quebrar dados ou tela inicial.

## Criterio

Nao marque PWA como aprovada enquanto build real, manifest, service worker e instalacao em Android nao forem testados.
