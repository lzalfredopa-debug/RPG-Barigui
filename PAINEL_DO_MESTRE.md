# Painel do Mestre

Acesso: qualquer registro em `players` cujo `player_identifier` seja exatamente `Mestre` abre o Painel do Mestre após a alcunha ser validada.

Incluído nesta versão:
- lista de todos os personagens e identificação do jogador;
- edição de identidade, história, progressão, status, PV/PM atuais, atributos e habilidades;
- administração de inventário, condições, efeitos, contatos, facções, reputações, objetivos, acontecimentos e diário;
- gerenciamento de jogadores: ativo/em espera e autorização de personagem adicional;
- envio e histórico de recados;
- caixa de sugestões com Nova/Lida/Resolvida e exclusão.

## Banco de dados
Execute `supabase/migrations/20261002123000_master_panel.sql` no SQL Editor do Supabase oficial antes de usar a página de sugestões/condições/efeitos.

## Nota de segurança
O projeto continua usando alcunha + chave anon, sem Supabase Auth. O identificador `Mestre` controla a interface, mas não constitui autenticação forte no banco. Para segurança real contra chamadas diretas ao Supabase, será necessário migrar para Supabase Auth ou uma função de servidor com credenciais administrativas.
