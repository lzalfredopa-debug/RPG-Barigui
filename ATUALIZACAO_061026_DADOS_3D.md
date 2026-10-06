# TRILHA — 06/10/2026 — Dados 3D

- Substituída a animação CSS/pseudo-3D das rolagens de combate por renderização 3D real.
- A camada visual usa `@3d-dice/dice-box-threejs` 0.0.12 via ESM CDN.
- O resultado continua sendo definido no Supabase; a biblioteca recebe resultados predeterminados com a notação `Nd10@...` e apenas os reproduz visualmente.
- O chat, o cálculo de ataque, a explosão de 10 e a decisão do Mestre permanecem inalterados.
- Caso a biblioteca 3D não carregue, existe um fallback visual simples com os mesmos resultados, sem bloquear a sessão.
- Não há alteração de banco nesta atualização.
