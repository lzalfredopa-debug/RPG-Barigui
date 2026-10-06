# TRILHA — 06/10/2026 — Correção de integração

- `roll_character_attack`: mantém a versão atual com alvo obrigatório e adiciona uma assinatura de diagnóstico para navegador antigo, além de forçar `pgrst` a recarregar o schema.
- Chat da Mesa: posicionamento inicial no fim agora ocorre somente depois que as mensagens renderizam, usando duas passagens de `requestAnimationFrame`.
- Rádio TRILHA: controles Parar/Retomar e Pular para todos ficaram visualmente destacados.

## Como verificar a versão correta
Na aba Combate deve existir o seletor **Alvo** acima de **Atacar**. Na Rádio TRILHA aberta deve aparecer a seção **Controles** com **Parar música** e, para o Mestre, **Pular música para todos**.
