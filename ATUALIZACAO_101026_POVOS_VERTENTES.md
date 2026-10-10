# TRILHA — Biblioteca: Povos e Vertentes (10/10/2026)

Implementação: `src/components/AncestryBrowser.tsx` (interface compartilhada) e `src/components/AncestryAdmin.tsx` (acesso do Mestre).

- Escolha inicial dos dez povos; ao escolher, imagem panorâmica, descrição e três cards de vertentes.
- Ao selecionar uma vertente, imagem quadrada à esquerda e descrição à direita (empilhadas em celular).
- Modo Mestre usa o mesmo layout com botão Editar, edição de nome e descrição, upload e remoção de imagem, salvar e cancelar.
- Dimensões recomendadas: 1600 × 500 (povo); 700 × 700 (vertente).
- Textos e imagens continuam armazenados no Supabase; esta atualização não executa SQL nem altera dados existentes.
- O upload de imagem envia primeiro ao Storage e a associação com o registro é feita ao clicar em Salvar.
- O arquivo ZIP original tinha modificações preexistentes em MasterPage.tsx e na migração 20261008024737; ambas foram preservadas sem alteração.

## Verificação

A instalação de dependências (`npm ci`) não terminou no ambiente de preparação. Por isso, não foi possível validar build, typecheck ou navegação em navegador. Executar `npm ci && npm run build && npm run typecheck` em ambiente com npm funcional antes da publicação, e testar a edição e o salvamento com uma conta Mestre.
