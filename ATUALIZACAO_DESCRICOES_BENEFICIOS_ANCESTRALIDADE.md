# Atualização — benefícios nas descrições de Raças e Linhagens

- As descrições de Raça na criação agora exibem automaticamente o bônus de Atributo permitido.
- Os cartões de Linhagem exibem automaticamente as duas categorias de Habilidades que podem receber +1.
- Quando as duas categorias são iguais, a interface informa que devem ser escolhidas duas Habilidades diferentes.
- O Painel do Mestre de Raças/Linhagens também mostra o benefício mecânico ao lado da descrição, mas mantém o benefício fora do texto editável.
- Nenhuma migration SQL nova é necessária: os textos são derivados de `attribute_mode`, `fixed_attribute`, `skill_group_1` e `skill_group_2` já existentes.
