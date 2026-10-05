# TRILHA — Equipamentos, sobrevivência e resumo inicial

Esta atualização adiciona:

- Catálogo de 5 escudos, incluindo Broquel com Destreza + Defesa.
- Catálogo de 10 armaduras escolhidas para o sistema.
- Proficiência por déficit:
  - armas perdem Dano efetivo;
  - armaduras perdem Absorção efetiva;
  - escudos perdem bônus efetivo de Bloqueio.
- Penalidades de armaduras/escudos continuam valendo mesmo sem proficiência.
- Armas, armaduras e escudos passam a ser administrados na aba Combate do jogador.
- Somente o Mestre adiciona, edita ou remove itens da ficha.
- O jogador pode equipar/desequipar equipamentos recebidos e organizar itens nas mãos.
- Consumíveis definidos pelo Mestre podem recuperar Fome e/ou Sede.
- Fome: máximo = 9 − Vigor efetivo (mínimo 1), perde 1 ponto a cada 8h.
- Sede: máximo 6, perde 1 ponto a cada 6h.
- Passagem do tempo do Mestre: +4h, +8h ou valor manual; sobras de horas são preservadas.
- Ao chegar a 0 de Fome ou Sede, o sistema adiciona a condição Desmaiado.
- Resumo inicial da ficha com Vida, Mana, Fome, Sede, Bloqueio, Evasão, Defesa Passiva, Iniciativa, Movimento, Absorção, equipamentos, itens à mão, condições e moedas.
- Moedas na ordem: Óbolos → Dracmas → Estaters.

## Supabase

Execute `TRILHA_equipamentos_sobrevivencia_supabase.sql` depois das migrations anteriores.

## Observação de segurança

O projeto continua usando o modelo atual de acesso por alcunha, sem autenticação individual do Supabase. As funções desta atualização verificam o identificador do Mestre no banco e retiram escrita direta de `character_items` do cliente, mas a segurança forte por usuário exigiria autenticação real no futuro.
