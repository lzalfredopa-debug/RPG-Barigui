# TRILHA 1.5 — Tarefa 0108 + Progressão de Aprendiz

## Progressão
- Criação: Atributos e Habilidades continuam com máximo 2.
- Nível 2: +2 pontos de Habilidade.
- Nível 3: +1 ponto de Atributo e +1 ponto de Habilidade.
- A primeira ramificação de um Atributo é revelada ao atingir Atributo 3.
- Os cinco caminhos do ramo revelado ficam visíveis para planejamento.
- A escolha da primeira classe começa no nível 4.
- Requisito das 60 classes iniciais: Atributo 3 + Habilidade 2.
- Pontos de Aprendiz podem ser aplicados na aba Progressão; Atributos ficam limitados a 3 e Habilidades a 2 com estes pontos.

## Tarefa 0108
- Na criação: “Como você prefere que se refiram ao personagem?”
  - Ela/Dela
  - Ele/Dele
  - Linguagem neutra
  - Prefiro não responder
- Contraste padronizado:
  - fundo #9d8e70 / cáqui / oliva desbotado -> texto cobre/vermelho;
  - fundo #5f5340 -> texto amarelo/dourado.
- Rádio ligada ao Supabase Storage:
  - bucket `radio-trilha`;
  - pasta `musicas/`;
  - Mestre pode enviar músicas diretamente pela janela da Rádio;
  - formatos aceitos no app: mp3, ogg, wav, m4a e aac;
  - limite do app por arquivo: 30 MB.

## Compatibilidade
A migration desta atualização também reaplica de forma idempotente as mudanças de Povos/Vertentes e Recados da rodada anterior, caso o SQL anterior não tenha sido executado.
