# TRILHA 1.5 — atualização 08/10/2026

## Revisão visual
- Paleta consolidada: pergaminho, cáqui, marrom profundo, cobre e dourado.
- Hierarquia visual de página → seção → card.
- Botões, abas, campos e cards padronizados.
- Controle do Mestre recebeu contraste e leitura mais claros.
- Mantida a identidade existente; não houve troca de linguagem visual.

## Controle → Combate
- Nova aba `Combate` no Controle do Mestre.
- Criador de encontros com dificuldades Fácil, Moderado, Difícil e Mortal.
- Orçamento calculado automaticamente a partir do grupo ativo.
- Multiplicador por quantidade de inimigos para representar economia de ações.
- Montagem automática de encontro.
- Bestiário com criação e remoção de modelos.
- Ameaça sugerida automaticamente ao criar um monstro, com ajuste manual do Mestre.
- Enviar encontro para combate cria instâncias independentes de cada inimigo.
- Ordem de iniciativa, rodada e turno atual.
- Passar e voltar marcador de turno.
- Controle de Ação, Movimento e Reação para jogadores e inimigos.
- Inimigos podem atacar personagens; personagens podem selecionar inimigos como alvo.
- Ataques continuam aguardando resolução do Mestre.
- Estados públicos de inimigos: Saudável, Ferido, Gravemente ferido e Derrotado.
- Painel de atenção do Mestre.
- Modelos de encontro reutilizáveis.
- Histórico de encontros encerrados.

## Rádio
- Caminho oficial mantido em `radio-trilha/musicas/`.
- Exibe quantidade de faixas encontradas/carregadas.
- Botão `Atualizar biblioteca`.
- Lista resumida da biblioteca.
- Arquivos que falharem na leitura de metadados aparecem como aviso, em vez de sumirem silenciosamente.

## Banco de dados
Execute `TRILHA15_COMBATE_ENCONTROS_IDENTIDADE_081026.sql` uma vez no SQL Editor do Supabase antes de usar a nova aba de Combate.
