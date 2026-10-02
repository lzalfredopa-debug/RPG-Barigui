# Atualização — tarefas 1 a 7

Implementado:
1. Tooltips renderizados em portal com z-index global para não ficarem atrás dos cards/abas.
2. Novo personagem bloqueado quando o jogador já possui um; nova criação depende da autorização do Mestre. O Mestre ganhou painel para autorizar/revogar.
3. Upload de Miniatura do personagem via Supabase Storage (`character-thumbnails`).
4. Jogador pode editar Inventário, História, Jornada e Diário.
5. Jogador pode alterar PV/PM atuais, limitados entre 0 e o máximo calculado.
6. Status do personagem: Vivo, Morto, Desaparecido; padrão Vivo; alteração no Painel do Mestre.
7. Cards em Meus Personagens mostram Estágio (ex.: Aprendiz) e Status.

## IMPORTANTE — Supabase
Antes de usar as novas funções, execute no SQL Editor do Supabase oficial o conteúdo de:
`supabase/migrations/20261002110000_player_editing_status_thumbnail.sql`

A migração adiciona colunas, policies necessárias e cria o bucket público das miniaturas.

## Verificação
`npm run typecheck` passou sem erros no código atualizado.
O build completo no ambiente de empacotamento não foi concluído porque o `node_modules` do ZIP veio de Windows e o Rollup nativo de Linux não estava presente. Isso não é erro TypeScript do projeto; no Windows, use `npm install` se necessário antes de `npm run dev`.
