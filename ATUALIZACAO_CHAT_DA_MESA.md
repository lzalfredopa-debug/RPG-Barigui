# Chat da Mesa — TRILHA

Implementação adicionada:

- janela flutuante em todas as páginas após o login;
- presença online via Supabase Realtime Presence;
- mensagens gerais persistentes em tempo real;
- contador de mensagens não lidas;
- identificação visual do Mestre;
- Mestre pode apagar mensagens;
- Mestre pode destacar e remover destaque de qualquer mensagem;
- rolador rápido para d2, d4, d6, d8, d10, d12 e d20;
- comandos `/r 3d10` e `/roll 1d20`;
- resultados de rolagem ficam registrados no chat.

## SQL

Executar no SQL Editor do Supabase:

`supabase/migrations/20261003233500_chat_da_mesa.sql`

A migration cria `chat_messages`, políticas RLS compatíveis com o modelo atual do projeto e adiciona a tabela à publicação `supabase_realtime`.

## Observação de segurança

O projeto usa alcunha/chave de acesso própria, e não Supabase Auth. Por isso as policies do banco seguem o padrão permissivo já adotado pelo projeto. Os controles de apagar/destacar ficam restritos ao Mestre na interface, mas não constituem autorização forte no banco. Caso o projeto migre para Supabase Auth no futuro, as policies devem ser endurecidas.
