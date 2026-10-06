# TRILHA — 06/10/2026 — Animação de dados V2

Esta revisão altera somente a apresentação visual das rolagens de ação já implementadas.

## Alterações
- Dados deixam de pousar alinhados e passam a se distribuir naturalmente na área central.
- Novo desenho visual do d10 com formato decagonal e facetas sutis.
- Queda com rotação, impacto, pequeno quique e assentamento.
- Sombra individual para dar profundidade sem criar uma mesa/modal separado.
- Resultado numérico aparece apenas quando o dado está quase parando.
- Resultado 10 recebe tratamento dourado discreto; resultado 1 usa cobre/vermelho escuro.
- Dados explosivos entram depois da parada inicial e recebem um pequeno marcador `+`.
- Animação responsiva para telas menores.
- Respeito a `prefers-reduced-motion`.

## Não alterado
- Regras de rolagem.
- Cálculo da parada.
- Explosão do resultado 10.
- Chat da Mesa.
- Decisão Sucesso / Fracasso / Anular do Mestre.
- Banco de dados e migrations Supabase.
