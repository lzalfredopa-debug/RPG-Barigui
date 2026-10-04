# Música da Mesa — TRILHA

Implementação de um player Spotify compartilhado pela mesa.

## Funcionamento

- Todos os jogadores logados veem o botão flutuante **Música da Mesa**.
- O Mestre pode colar um link do Spotify e compartilhá-lo com todos.
- O conteúdo aceito inclui faixa, álbum, playlist, artista, podcast/show, episódio e audiobook.
- O player utiliza o embed oficial do Spotify.
- Alterações feitas pelo Mestre chegam aos clientes em tempo real via Supabase Realtime.
- Recolher a janela mantém o iframe montado, evitando recriar o player desnecessariamente.
- O navegador/Spotify pode exigir interação manual antes de iniciar a reprodução; não há autoplay forçado.

## Banco de dados

Executar a migration:

`supabase/migrations/20261004104500_music_room.sql`

Ela cria a tabela singleton `music_room_settings` e a adiciona ao Supabase Realtime.

## Observação de segurança

Como o projeto atual utiliza uma chave simples de jogador em vez de Supabase Auth, a exclusividade do controle do Mestre é garantida pela interface do aplicativo, seguindo o mesmo modelo das demais funções administrativas existentes.
