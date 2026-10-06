# TRILHA — Atualização 06/10/2026 — Combate, Chat e Rádio

## Combate automatizado

- A arma equipada mantém o botão **Atacar** na aba Combate.
- Antes do ataque, o jogador seleciona um alvo entre os personagens vivos disponíveis.
- O ataque consome a **Ação** do turno.
- O alvo recebe as opções **Evadir**, **Bloquear** ou **Defesa Passiva**.
- Evasão e Bloqueio consomem a **Reação**; Defesa Passiva não consome reação.
- **Evasão:** Agilidade + Defesa − penalidades de armadura/escudo.
- **Bloqueio:** atributo do escudo + Defesa + bônus efetivo do escudo.
- **Defesa Passiva:** ⌊Defesa ÷ 2⌋ sucessos automáticos.
- O Mestre informa a **Dificuldade** do Teste Oposto depois que a defesa é registrada.
- O sistema calcula automaticamente os sucessos do ataque e da defesa. Empates favorecem o defensor.
- Se o ataque acertar, sucessos excedentes aumentam o dano.
- Dano final: dano efetivo da arma + sucessos excedentes − absorção efetiva da armadura; mínimo 1 PV em um acerto.
- Falta de proficiência reduz o benefício do equipamento: dano da arma, bônus do escudo ou absorção da armadura.
- Item danificado usado diretamente no teste recebe +1 de Dificuldade.
- O Mestre pode anular um ataque ainda não resolvido; nesse caso os recursos gastos por aquela ação são devolvidos.
- O botão **Iniciar / renovar turno** restaura Ação, Movimento e Reação.

## Chat da Mesa

- O chat abre já na mensagem mais recente.
- Mensagens novas acompanham automaticamente somente quando o usuário já está no fim do chat.
- Se o usuário estiver lendo o histórico, aparece o botão **Nova mensagem** em vez de forçar a rolagem para baixo.
- Ao chegar ao topo, mensagens anteriores são carregadas progressivamente.
- O comando `/r` aceita múltiplos grupos e modificadores, por exemplo:
  - `/r 3d10 + 4d20`
  - `/r 2d8 + 5`
  - `/r 4d10 - 2`
  - `/r 2d6 + 1d12 + 3`
- O chat mostra os resultados separados por grupo e o total final.

## Rádio TRILHA

- Todos os usuários possuem **Parar** e **Retomar** locais. Parar afeta apenas o navegador daquele usuário.
- O Mestre possui **Pular para todos**, que avança a programação globalmente para a próxima faixa.
- O avanço global é salvo no Supabase e chega em tempo real aos jogadores.

## Banco de dados

Execute `TRILHA_061026_COMBATE_CHAT_RADIO_supabase.sql` antes de testar esta atualização.
