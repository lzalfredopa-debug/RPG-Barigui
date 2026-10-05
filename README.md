# RPG-Barigui

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-dfnbfual)

## Atualização — Controle e catálogo universal

Para a versão com as Tarefas 2 e 3, a migration também está em `supabase/migrations/20261005010000_trilha_tarefas_2_3_controle_itens.sql`. Se você estiver aplicando o banco manualmente pelo SQL Editor, execute `TRILHA_tarefas_2_3_supabase.sql` depois de `TRILHA_equipamentos_sobrevivencia_supabase.sql`.

Detalhes: `ATUALIZACAO_TAREFAS_2_E_3_CONTROLE_ITENS.md`.

## Atualização 051026.01 — 05/10/2026
Catálogo unificado, inventário por classe/subclasse, peso e carga, consumo por porções e redesign do Modo Mestre. Consulte `ATUALIZACAO_051026_01.md` e aplique `supabase/migrations/20261005130000_atualizacao_051026_01.sql` após a migration das Tarefas 2 e 3.
