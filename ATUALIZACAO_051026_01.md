# TRILHA — Atualização 051026.01

Data: 05/10/2026

## Tarefa 1 — Catálogo
- Nova página **Catálogo** entre **Classes** e **Regras** na ficha.
- Catálogo unificado de **Itens comuns, Armas, Armaduras e Escudos**.
- **Itens variados** é uma subclasse de **Itens comuns**.
- No Controle do Mestre, o Catálogo permite criar, editar e remover entradas.
- Campos mecânicos incluem peso, durabilidade, unidade/quantidade, validade, consumo, recipientes e compartimentos.
- Remover uma entrada a oculta do catálogo sem apagar os exemplares já entregues aos personagens.

## Tarefa 2 — Inventário organizado
- Inventário agrupado por classe principal e subclasse.
- Classes: Armas, Armaduras, Escudos e Itens comuns.
- Subclasses vazias não aparecem; itens são ordenados alfabeticamente.
- Seções principais podem ser recolhidas.

## Tarefa 3 — Peso e carga
- Peso unitário no catálogo e cálculo automático da carga do personagem.
- Capacidade natural: **10 kg + Força × 5 kg + Vigor × 2,5 kg**.
- Um compartimento principal e um auxiliar podem aumentar a capacidade quando ativos.
- Mochila, bolsa, pochete, aljava, cantis e odres corporais têm peso próprio ignorado; o conteúdo continua contando.
- Moedas não entram no cálculo.
- Itens sem peso contam como 0 e geram aviso visual.

## Tarefa 4 — Consumo por porções
- **400 g de alimento = +1 Fome**.
- **250 ml de água = +1 Sede**.
- Um clique em **Consumir** gasta uma porção, reduz a quantidade/peso e atualiza a ficha.
- O botão é bloqueado quando não há uma porção completa ou o lote está estragado.

## Tarefa 5 — Redesign do Controle / Modo Mestre
- Edição dividida em **Resumo, Atributos, Habilidades, Inventário, Condições & efeitos, Identidade e Jornada**.
- Resumo com controles rápidos de PV, PM, Fome e Sede.
- Aviso de alterações não salvas e ações de salvar/cancelar sempre acessíveis.
- Inventário do Mestre organizado pela mesma lógica do jogador.
- Cartões do Controle mostram PV, PM, Fome e Sede para leitura rápida.

## Banco de dados
Aplicar, nesta ordem, caso ainda não tenham sido aplicadas:
1. `supabase/migrations/20261005010000_trilha_tarefas_2_3_controle_itens.sql`
2. `supabase/migrations/20261005130000_atualizacao_051026_01.sql`

A migration desta atualização também está copiada na raiz como `TRILHA_051026_01_supabase.sql` para uso no SQL Editor do Supabase.
