# Atualização — Raças, Linhagens e características raciais

## Antes de testar
Execute no SQL Editor do Supabase o conteúdo de:
`supabase/migrations/20261003193000_races_lineages.sql`

## Implementado
- Painel do Mestre > Raças: editar nome, imagem e descrição.
- Painel do Mestre > Linhagens: editar nome, imagem e descrição, organizadas por raça.
- Imagens novas usam o bucket público `ancestry-images`.
- Criação: raça concede +1 Atributo (fixo ou escolha conforme a raça).
- Criação: linhagem concede +1 em duas Habilidades escolhidas nas duas categorias definidas.
- Se as duas categorias forem iguais, as duas Habilidades precisam ser diferentes.
- Bônus raciais/linhagem não consomem os pontos normais de criação.
- O personagem salva os valores efetivos em `attributes`/`skills` e também registra a origem dos bônus em `racial_attribute_bonus` e `lineage_skill_bonuses`.
