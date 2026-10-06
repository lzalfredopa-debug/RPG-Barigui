# TRILHA — Rolagens automáticas de combate

Atualização iniciada em 06/10/2026.

## Primeira etapa implementada

- A aba **Combate** ganhou o botão **Atacar** na arma atualmente equipada.
- O jogador não informa manualmente a quantidade de dados.
- O Supabase calcula a parada usando **Atributo de ataque + Habilidade de ataque** definidos pela arma, incluindo bônus raciais e de linhagem já registrados na ficha.
- Personagens mortos, inconscientes ou com condição **Desmaiado/Inconsciente** não podem iniciar o ataque.
- Arma quebrada também bloqueia o ataque.
- A rolagem usa d10 e aplica a regra de **10 explosivo**: cada 10 gera +1d10, e um novo 10 pode explodir novamente.
- A rolagem é inserida no **Chat da Mesa** e distribuída pelo Supabase Realtime.
- Todos os usuários conectados veem os dados caírem sobre a área central da tela, sem trocar de página e sem abrir uma mesa/modal separado.
- A animação é somente a apresentação: o resultado oficial é o registro persistente do chat.
- No Chat da Mesa a ação mostra personagem, arma, combinação de Atributo + Habilidade, parada e resultados individuais. Resultados 1 e 10 recebem destaque visual e dados explosivos são identificados.
- Até o Mestre decidir, a ação permanece como **Aguardando decisão do Mestre**.
- Somente na interface do Mestre aparecem as ações **Sucesso**, **Fracasso** e **Anular**.
- A decisão atualiza a mesma mensagem em tempo real para todos os jogadores.
- Nesta primeira etapa, **defesa, alvo e dano não são resolvidos automaticamente**. Isso fica separado para uma etapa posterior.

## Banco de dados

Aplicar:

`supabase/migrations/20261006120000_rolagens_acoes_combate.sql`

ou, pelo SQL Editor do Supabase:

`TRILHA_061026_ROLAGENS_COMBATE_supabase.sql`
