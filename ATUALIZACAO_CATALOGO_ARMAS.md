# Atualização — Catálogo de Armas do TRILHA

## Implementado
- Catálogo com 47 armas oficiais.
- Especificações completas (dano, tipo, ataque, requisitos, mãos, alcance e observações) disponíveis no Painel do Mestre.
- Jogadores veem apenas nome/família no seletor de armas e o estado de proficiência na própria ficha.
- Quando o personagem não cumpre o requisito da arma, a ficha mostra: **“Você ainda não é proficiente com essa arma.”**
- Itens de inventário podem ser vinculados a uma arma oficial por `weapon_id`.
- Bônus raciais e de linhagem contam para requisitos de manejo.
- Requisitos acima do necessário não aumentam o dano.

## Regra de proficiência
Para cada ponto faltante no Atributo e/ou Habilidade exigidos pela arma, o Dano Base cai em 1.

## Cálculo preparado para futuras atualizações
A migration inclui a função `calculate_weapon_damage`:

- Dano Efetivo = Dano Base − déficit de requisitos (mínimo 1; armas de dano 0 permanecem 0).
- Dano Bruto = Dano Efetivo + Sucessos Excedentes.
- Dano Final = Dano Bruto − Absorção (mínimo 1 quando a arma causa dano e o golpe acerta).

Também existe o helper TypeScript `src/lib/weapons.ts` com a mesma regra, pronto para a futura tela de ataque/dano.

## Observação de segurança
O TRILHA continua sem Supabase Auth real. A ocultação segue o mesmo modelo do restante do projeto: a interface do jogador não consulta nem exibe as especificações completas; o Painel do Mestre usa uma função específica que verifica o identificador `Mestre`.
