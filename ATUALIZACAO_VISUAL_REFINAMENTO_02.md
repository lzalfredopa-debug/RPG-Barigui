# TRILHA — Refinamento visual 02

Segunda passada da padronização visual iniciada após a 051026.01.

## Escopo

- Catálogo
- Inventário
- Controle do Mestre
- Modo Mestre / editor de personagem

## Ajustes realizados

- Padronização dos estados de botão: primário, neutro e destrutivo.
- Abas de Catálogo, Controle e Modo Mestre com estado ativo unificado.
- Ações de editar/remover transformadas em botões de ícone consistentes.
- Catálogo com cartões mais próximos do estilo da ficha e hierarquia visual mais clara.
- Inventário com botões de equipar, carregar e consumir no mesmo padrão visual.
- Tags de durabilidade, validade e bônus de carga em formato discreto e consistente.
- Barra de carga utilizando a paleta cobre → ouro e estado de sobrecarga sem vermelho saturado.
- Cartões dos personagens no Controle com destaque de alerta em cobre, sem depender de amarelo/vermelho genéricos.
- Barra de navegação do Controle mais compacta e com destaque ativo coerente.
- Modo Mestre com navegação por seções, botões de salvar/cancelar/excluir claramente diferenciados.
- Ajustes responsivos para navegação do Controle e indicadores de recursos.

## Validação

- `npm run typecheck`: aprovado sem erros.
- O build do Vite continua impedido no ambiente de validação pela dependência opcional Linux do Rollup ausente no `node_modules` fornecido; não é um erro introduzido por esta atualização.

Não há alterações de banco de dados nesta etapa.
