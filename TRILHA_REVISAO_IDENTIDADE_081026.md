# TRILHA 1.5 — Revisão oficial de identidade e contraste — 08/10/2026

Esta revisão é exclusivamente visual. Não altera regras, cálculos, banco de dados ou fluxo funcional.

## Aplicado

- Paleta reduzida às cores oficiais do TRILHA.
- Todas as cores HEX usadas em `src/` foram normalizadas para a paleta aprovada.
- Variações antigas de dourado, cobre, bege e marrom foram eliminadas.
- Valores RGB/RGBA antigos foram normalizados para bases oficiais, preservando transparência.
- `tailwind.config.js` agora aponta apenas para a paleta oficial.
- Aliases antigos `khaki` e `forest` foram preservados para compatibilidade, mas agora resolvem para cores oficiais.
- Removida a regra antiga e contraditória da Tarefa 0108 que fazia o mesmo fundo `#5F5340` receber dois tratamentos incompatíveis.
- Fundo marrom médio agora usa texto claro; dourado fica reservado a títulos/destaques.
- Cards claros usam texto escuro e títulos em cobre escuro.
- Botões de cobre usam texto branco.
- Botões dourados usam texto escuro.
- Card de personagem do Controle foi ajustado para semântica de superfície clara.
- O bloco `Recursos do turno` na página Combate agora possui fundo marrom escuro explícito, evitando dourado sobre fundo parecido.
- Rádio recebeu correções de contraste nos textos auxiliares.
- Adicionado `TRILHA_PADRAO_OFICIAL_CORES.md` como referência permanente dentro do projeto.

## Paleta oficial

- Dourado `#D4B15A`
- Dourado claro `#E3C56F`
- Cobre `#8B4A3A`
- Cobre escuro `#6F392E`
- Texto escuro `#2C241E`
- Pergaminho `#E7D8BC`
- Card claro `#EFE4CF`
- Fundo escuro `#231B16`
- Marrom escuro `#4A4032`
- Marrom médio `#5F5340`
- Branco `#FFFFFF` apenas para contraste em fundos de cobre

## Validação estática

- Nenhuma cor HEX fora da paleta oficial permanece em `src/`.
- Nenhum valor RGB inválido foi encontrado.
- Balanceamento de chaves do CSS validado.
- `tailwind.config.js` validado pelo Node.

O build completo não foi executado neste ambiente porque o ZIP não inclui `node_modules`.
