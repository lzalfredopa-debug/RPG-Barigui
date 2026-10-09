# TRILHA 1.5 — Povos e Vertentes

## Biblioteca do jogador

A janela mantém apenas o cabeçalho já existente:

- Biblioteca do jogador
- Povos e Vertentes

Na abertura, aparecem somente os dez botões dos Povos.

Ao selecionar um Povo, a mesma janela apresenta:

- Povo anterior
- nome do Povo atual
- próximo Povo
- imagem horizontal de cabeçalho
- descrição do Povo

Clicar no nome central do Povo retorna à lista completa.

## Controle do Mestre

As antigas abas separadas `Povos` e `Vertentes` foram reunidas em `Povos e Vertentes`.
Dentro da página há um seletor entre os dois tipos.

O Mestre pode:

- editar o nome;
- editar o texto;
- enviar uma nova imagem;
- remover a referência da imagem atual.

### Tamanhos recomendados

**Povos / cabeçalhos**
- 1600 × 500 px
- proporção 16:5
- WEBP ou JPG preferencialmente
- idealmente abaixo de 1 MB

**Vertentes**
- 1200 × 800 px
- proporção 3:2
- WEBP ou JPG preferencialmente
- idealmente abaixo de 1 MB

## Imagens antigas

As 30 imagens locais antigas de Povos/Vertentes foram removidas do projeto.
A migration `TRILHA15_POVOS_VERTENTES_REDESIGN_091026.sql` limpa também os campos `image_url` no banco para que nenhuma imagem antiga continue aparecendo.

A migration não exclui objetos físicos antigos do Supabase Storage.
