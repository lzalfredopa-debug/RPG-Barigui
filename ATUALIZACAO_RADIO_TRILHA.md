# Rádio TRILHA

Implementação simples de uma playlist contínua hospedada no Supabase Storage.

## Como funciona

- O bucket público se chama `radio-trilha`.
- O site lista automaticamente os arquivos de áudio na raiz do bucket.
- A ordem é alfabética; use prefixos `01 -`, `02 -`, `03 -` para definir a programação.
- O navegador lê a duração das faixas e calcula qual música e qual ponto deveriam estar tocando naquele instante.
- Quem entra depois é levado ao ponto atual da programação, em vez de começar do início.
- Ao terminar a última faixa, a programação volta para a primeira automaticamente.
- Não existe play, pause, avançar ou trocar faixa. O único controle do jogador é volume.
- O volume fica salvo no próprio navegador.
- Por regra dos navegadores, se o autoplay for bloqueado a rádio começa automaticamente na primeira interação do jogador com a página.

## Formatos aceitos

MP3, OGG, WAV, M4A/MP4 Audio e AAC, conforme suporte do navegador.

## Instalação

1. Execute `TRILHA_radio_supabase.sql` no SQL Editor do Supabase.
2. Abra Storage > `radio-trilha`.
3. Envie os arquivos de áudio na raiz do bucket.
4. Use nomes numerados para fixar a ordem, por exemplo:
   - `01 - Taverna.mp3`
   - `02 - Floresta.mp3`
   - `03 - Combate.mp3`
5. Publique o site normalmente.

Não é necessário cadastrar as faixas em uma tabela do banco.
