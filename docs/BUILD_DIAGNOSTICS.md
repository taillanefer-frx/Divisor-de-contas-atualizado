# Build Diagnostics

O build anterior falhou com `spawn EPERM` ao acionar ferramentas externas como esbuild/Vite neste ambiente local.

Isso nao prova erro de codigo por si so, mas bloqueia classificacao GO. O criterio permanece: build precisa passar em uma maquina/CI onde os binarios Node possam ser executados.
