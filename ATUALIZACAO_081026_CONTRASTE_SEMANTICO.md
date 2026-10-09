# TRILHA 1.5 — Correção semântica de cores e contraste — 08/10/2026

Atualização exclusivamente visual. Não altera regras, cálculos, banco de dados ou comportamento do sistema.

## Corrigido

- A paleta oficial continua sendo a única paleta do projeto.
- O problema de contraste passou a ser tratado pelo **tipo de superfície**, e não apenas pelo nome da classe de cor.
- A aba clara da ficha não repinta mais módulos escuros internos.
- A tela de Progressão foi corrigida:
  - painel principal `#231B16` com títulos dourados e texto pergaminho;
  - “Pontos de Aprendiz” e “Caminhos iniciais” em `#5F5340`, título `#E3C56F` e texto `#EFE4CF`;
  - cards internos escuros preservam texto claro e dourado;
  - opacidades que apagavam títulos foram removidas nos módulos escuros.
- `CollapsibleSection` passa a obedecer o padrão oficial de card marrom médio.
- Cards de personagem do Controle voltam a ser superfície marrom escura e o nome volta a respeitar `text-gold-bright` como dourado claro.
- “Recursos do turno” no Combate permanece em fundo marrom escuro com dourado legível.
- Botões de cobre usam branco; botões dourados usam texto escuro.
- Mantida compatibilidade com classes antigas sem introduzir novas tonalidades.

## Regra aplicada

- `#231B16`: títulos `#D4B15A`, texto `#E7D8BC`, destaque `#E3C56F`.
- `#4A4032`: títulos `#E3C56F`, texto `#EFE4CF`.
- `#5F5340`: títulos `#E3C56F`, texto `#EFE4CF`.
- `#E7D8BC`: títulos/texto `#2C241E`, subtítulos `#6F392E`.
- `#EFE4CF`: títulos `#6F392E`, texto `#2C241E`, secundário `#5F5340`.
- Cobre `#8B4A3A` / `#6F392E`: texto branco quando usado como fundo.
