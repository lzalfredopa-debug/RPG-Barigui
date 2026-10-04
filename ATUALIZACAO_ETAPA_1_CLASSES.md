# TRILHA — Etapa 1: Base de Classes + Painel do Mestre

Esta versão implementa somente a Etapa 1 combinada.

## O que foi adicionado

- Tabela `class_nodes` no Supabase com a árvore completa de 180 classes/evoluções.
- Distribuição cadastrada:
  - 12 Iniciantes (níveis 5–8)
  - 24 Competentes (níveis 9–12)
  - 48 Proficientes (níveis 13–16)
  - 96 Especialistas (níveis 17–20)
- Requisitos estruturados em JSONB, além do texto legível, para preparar o motor de desbloqueio futuro.
- Nova aba **Classes** no Painel do Mestre.
- Consulta por árvore inicial, busca global e detalhes de cada classe.
- Exibição de classe-pai, faixa de níveis, atributos-base, habilidades, temas e requisito.

## Supabase

Execute no SQL Editor:

`supabase/migrations/20261003213000_class_tree_stage1.sql`

A migration é idempotente para os registros da árvore: se executada novamente, atualiza os dados existentes pelos IDs internos.

Nesta etapa o frontend possui somente permissão de leitura da árvore. Não há edição, desbloqueio, revelação ou bônus de classe ainda.

## O que NÃO foi implementado nesta etapa

- Contagem misteriosa de caminhos desbloqueados na ficha do jogador.
- Motor automático de desbloqueio de classes.
- Painel do Mestre com possibilidades abertas por personagem.
- Árvore do jogador com casas ocultas/reveladas.
- Controle do Mestre para revelar casas.
- Visual final ornamental da árvore.

Esses itens permanecem para as próximas etapas.
