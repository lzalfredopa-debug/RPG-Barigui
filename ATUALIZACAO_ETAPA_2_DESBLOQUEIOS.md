# TRILHA — Etapa 2: Motor de desbloqueio de classes

Esta atualização implementa somente a Etapa 2 combinada após a Etapa 1 de Classes.

## Jogadores

- O sistema calcula automaticamente quais classes/evoluções o personagem já pode acessar.
- No cartão do personagem e no cabeçalho da ficha aparecem apenas símbolos `✦`, um por possibilidade aberta.
- O jogador não vê o nome da classe, o caminho ou os requisitos por esse indicador.
- Se nenhuma possibilidade estiver aberta, o indicador não aparece.

## Mestre

Na aba **Classes**, a área **Possibilidades de evolução abertas** mostra somente possibilidades realmente desbloqueadas e informa:

- jogador;
- personagem;
- classe disponível;
- caminho da árvore;
- requisito textual;
- requisitos que foram alcançados e seus valores atuais.

## Regra usada pelo motor

- O personagem precisa atingir o nível mínimo da classe.
- Se ainda não possui classe, são avaliadas as 12 classes Iniciantes.
- Se já possui classe, são avaliados somente os filhos imediatos da classe atual.
- Quando `class_name` e `specialization` contêm nomes válidos da árvore, o motor considera o mais avançado deles como posição atual.
- Requisitos de Atributos usam somente `characters.attributes` (valor-base).
- Requisitos de Habilidades usam somente `characters.skills` (Nível de Habilidade-base).
- Bônus raciais e de linhagem melhoram a ficha, mas NÃO contam para desbloquear classes.

## Banco de dados

Nenhuma migration adicional é necessária nesta etapa. A Etapa 2 usa a tabela `class_nodes` criada na Etapa 1.

## Ainda não implementado

- árvore de classes na página dos jogadores;
- controle do Mestre para revelar/ocultar casas individualmente;
- visual final da árvore de descoberta.

Esses itens pertencem às próximas etapas.
