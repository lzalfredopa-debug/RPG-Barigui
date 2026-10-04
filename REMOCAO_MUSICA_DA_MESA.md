# TRILHA — remoção da Música da Mesa

A interface de música/Spotify foi removida desta versão do projeto.

Foram retirados:
- botão e janela flutuante de Música da Mesa;
- Spotify Embed;
- login Spotify / Web Playback SDK;
- callback e variáveis de ambiente do Spotify;
- migration local da tabela `music_room_settings`.

O Chat da Mesa e as demais funcionalidades do TRILHA foram mantidos.

Se a migration da Música da Mesa já tiver sido executada no Supabase, a tabela `music_room_settings` pode permanecer no banco sem afetar o site.
