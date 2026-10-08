# TRILHA 1.5 — Base funcional

Esta atualização parte da última TRILHA 1 recuperada e mantém sua identidade visual. O foco é combinar a riqueza funcional da v1 com regras e organização consolidadas na v2, sem reduzir recursos.

## O que muda

- 12 Atributos, organizados em Físicos, Sociais e Mentais.
- 42 Habilidades, organizadas em Ação & Exploração, Sociedade & Vivência e Conhecimento & Técnica.
- Níveis 1–3 usam o título Aprendiz de [Atributo]; empates geram Aprendiz Versátil.
- 60 classes iniciais: cinco caminhos para cada Atributo dominante, com requisito padrão Atributo 2 + Habilidade 1.
- Povo e Vertente são narrativos e não concedem bônus mecânicos.
- Personagens híbridos podem registrar dois Povos e uma Vertente de cada.
- Fome máxima fixa em 9 e Sede máxima fixa em 6.
- Arcanismo, Ocultismo e Teologia são as Habilidades místicas oficiais usadas para PM.
- Catálogo e Inventário preservam a riqueza da v1 e ganham grupos recolhíveis com preferência local persistente.
- Chat e Rádio continuam no sistema e podem permanecer minimizados; o estado é lembrado localmente.
- Progressão antiga deixa de ser apresentada pela interface principal; a árvore avançada será desenvolvida em etapa posterior.

## O que não muda nesta rodada

- Identidade visual da TRILHA 1.
- Catálogo rico, durabilidade, peso, recipientes, perecibilidade, Fome/Sede, Tempo/Descanso/Desfazer.
- Fluxo completo de Combate com decisão final do Mestre.
- Chat e Rádio.
- Login por alcunha da TRILHA 1. A migração de autenticação, se adotada, deve ser feita separadamente para não arriscar a base restaurada.

## Banco

Execute `TRILHA15_ATUALIZACAO_BASE.sql` somente depois da reconstrução segura da TRILHA 1. A migration correspondente também está em `supabase/migrations/20261008030000_trilha15_base.sql`.

A migration é transacional: em caso de erro, o PostgreSQL reverte a atualização inteira.
