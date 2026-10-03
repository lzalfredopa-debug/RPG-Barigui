# TRILHA — tarefas pendentes implementadas

- Exclusão de personagem pelo Painel do Mestre, com confirmação forte. Requer a migration `20261003154500_master_character_delete.sql`.
- Criação de personagem pelo Mestre: em Personagens, escolha o jogador em “+ Criar personagem para...”. Usa o fluxo normal sem consumir a autorização de personagem adicional do jogador.
- Linguagem dinâmica: `src/lib/characterLanguage.ts` oferece textos de sistema com `{nome}`, `{ele}`, `{dele}`, `{mesmo}`, `{afetado}`, `{protegido}` e `{preparado}`. Gênero neutro/“não faz diferença” prioriza construções sem flexão. Condições e efeitos já passam por esse renderizador na ficha.
- Painel do Mestre: Gênero/Pronomes, Raça, Linhagem e Status usam seletores; Linhagem é filtrada pela Raça. Classe e Especialização usam as opções já existentes nos personagens cadastrados, sem inventar opções ainda não definidas no sistema. Atributos e Habilidades permanecem numéricos.
- Regra do d10: página Regras já documenta 10 explosivo. `src/lib/dice.ts` implementa a regra para qualquer rolagem automatizada futura: 10 = 1 sucesso + novo d10; novos 10 explodem; 1 cancela sucesso; sucesso exige resultado maior que a dificuldade.
