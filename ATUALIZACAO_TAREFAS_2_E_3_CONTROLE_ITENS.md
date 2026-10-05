# TRILHA — Atualização das Tarefas 2 e 3

## Tarefa 2 — Controle do Mestre

- A página principal do Mestre agora se chama **Controle**.
- Ao abrir um personagem pelo Controle, o Mestre vê primeiro **a mesma ficha e a mesma estrutura visual usada pelo jogador**, identificada como **Modo Mestre**.
- O botão **Editar como Mestre** abre o editor administrativo completo da ficha.
- O editor permite alterar identidade, progressão, PV/PM, Fome/Sede, moedas, atributos, habilidades, inventário, condições, efeitos, jornada e diário.
- O relógio da mesa aceita **minutos, horas ou dias**.
- **Descanso curto** avança 4 horas e recupera `Vigor × 2` PV e `Maior Atributo Mental × 2` PM.
- **Descanso longo** avança 8 horas e recupera PV/PM até o máximo.
- Fome perde 1 ponto a cada 8 horas; Sede perde 1 ponto a cada 6 horas. Restos inferiores aos intervalos são preservados em minutos.
- Efeitos temporários usam duração em minutos, horas ou dias e expiram com o relógio. Efeitos permanentes não são alterados.
- A condição **Desmaiado** causada por Fome/Sede é identificada com origem `survival` para não remover condições homônimas de outras fontes.
- O Controle mostra um resumo após avançar o tempo.
- **Desfazer último avanço** restaura PV/PM, Fome/Sede, restos de tempo, efeitos temporários e validade dos lotes.

## Tarefa 3 — Catálogo universal de itens

- Criado `item_catalog` com as **22 categorias** definidas no projeto e **170 entradas**.
- O Mestre pode adicionar diretamente qualquer item do catálogo ao inventário de um personagem.
- Itens possuem comportamentos independentes: consumível, perecível, recipiente e durável.
- Recipientes guardam sua capacidade em ml.
- Alimentos guardam quantidade/unidade padrão e validade-base.
- Cada inclusão perecível cria uma linha independente de inventário, funcionando como **lote**.
- Conservação usa multiplicador: `2` frio, `1` normal e `0,5` quente/úmido.
- Estados de validade: **Bom**, **Próximo de estragar** (25% ou menos da validade restante) e **Estragado**.
- Itens estragados não desaparecem automaticamente e não concedem recuperação automática de Fome/Sede.
- Durabilidade usa escala de 2 a 5 conforme o item.
- Estados: **Íntegro**, **Gasto**, **Danificado** e **Quebrado**.
- Em 1 ponto de durabilidade o item fica **Danificado** e recebe indicação de `+1 dificuldade` quando for essencial ao teste.
- Em 0 o item fica **Quebrado** e é desequipado automaticamente.
- Armas, armaduras e escudos oficiais entram no sistema com durabilidade **4/4**.
- O Mestre pode alterar durabilidade e condição de conservação pelo editor de inventário.

## Banco de dados

A migration foi incluída em:

`supabase/migrations/20261005010000_trilha_tarefas_2_3_controle_itens.sql`

Para aplicação manual no SQL Editor do Supabase, use a cópia na raiz:

`TRILHA_tarefas_2_3_supabase.sql`

Ela foi escrita para ser reaplicável e atualiza também personagens/equipamentos já existentes quando necessário.

## Validação

`npm run typecheck` executado sem erros após esta atualização.
