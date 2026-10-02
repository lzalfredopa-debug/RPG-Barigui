# Ficha completa — alterações

- Classe inicial agora é nula; Aprendiz é Estágio.
- Criação ganhou os campos narrativos completos de Identidade e Personalidade & História.
- PV/PM atuais são inicializados na criação; máximos são calculados na ficha.
- Ficha em abas: Ficha, Habilidades, Combate, Inventário, História, Jornada e Diário.
- Todos os 12 atributos e todas as 48 habilidades permanecem visíveis.
- Tooltips explicam atributos, habilidades e cálculos derivados.
- Cálculos implementados: estágio, PV máximo, PM máximo, Evasão, Bloqueio, Defesa Passiva, Iniciativa, Deslocamento e Reação Defensiva base.
- Leitura conectada às tabelas de itens, condições, efeitos, contatos, facções, reputações, objetivos e acontecimentos.
- Diário conectado ao Supabase com criação e exclusão de entradas.
- A ficha continua sem edição livre de progressão/equipamentos pelo jogador.

## Atenção ao ambiente local
O `.env` recebido no ZIP continua apontando para o projeto Supabase de teste (`ojacoid...`). Ele não foi trocado porque a chave pública do Supabase oficial (`hdcapqbf...`) não estava no projeto enviado. Para testar localmente contra o banco oficial, atualize `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do projeto oficial.
