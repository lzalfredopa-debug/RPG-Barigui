# Atualização — novas tarefas 1 e 2

## Tarefa 1 — controle de PV e PM
- Controles numéricos foram substituídos por contador atual/máximo.
- Setas diminuem/aumentam 1 ponto por clique.
- Barra visual acompanha a proporção atual/máxima.
- Limites: 0 até o máximo calculado.
- Cada clique persiste `current_hp` ou `current_mp` no Supabase.
- Personagens novos já são criados com PV/PM cheios pela lógica existente de criação.

## Tarefa 2 — habilidades na Ficha
- A aba separada Habilidades foi removida.
- As 48 habilidades agora aparecem na aba Ficha, abaixo dos atributos.
- Habilidades de valor 0 continuam visíveis e os tooltips foram preservados.

Nenhuma migração SQL nova é necessária para estas duas mudanças; elas usam as colunas `current_hp` e `current_mp` já existentes.
