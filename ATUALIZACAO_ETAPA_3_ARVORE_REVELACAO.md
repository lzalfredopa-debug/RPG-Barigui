# TRILHA — Etapa 3: Árvore de descoberta

Esta etapa adiciona a árvore completa de classes à ficha do jogador e o controle de revelação individual ao Painel do Mestre.

## Jogador
- Nova aba **Classes** na ficha do personagem.
- A estrutura completa das 12 árvores é visível.
- Cada casa começa **oculta**.
- Casas ocultas não mostram nome, requisito ou conteúdo.
- Quando o Mestre revela uma casa, o personagem passa a ver nome, estágio, faixa de nível e requisito.
- O jogador pode atualizar a visualização pelo botão **Atualizar**.

## Mestre
- A aba **Classes** continua mostrando toda a árvore sem ocultação.
- Novo seletor **Revelação da árvore por personagem**.
- Cada casa possui um controle individual **Oculta para o personagem / Revelada ao personagem**.
- Também é possível revelar/ocultar a classe atualmente selecionada no painel de detalhes.
- As revelações são independentes para cada personagem.

## Supabase
Execute a migration:

`supabase/migrations/20261003223000_class_reveals_stage3.sql`

Ela cria a tabela `character_class_reveals`.

## Escopo
Esta atualização implementa somente a Etapa 3 funcional. O refinamento visual/heráldico completo da árvore permanece para a Etapa 4.
