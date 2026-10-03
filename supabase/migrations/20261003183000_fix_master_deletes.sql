-- TRILHA — corrige exclusões usadas pelo Painel do Mestre.
-- O projeto usa acesso por alcunha e o frontend opera com a role anon.

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS characters_delete ON characters;
DROP POLICY IF EXISTS anon_delete_characters ON characters;
CREATE POLICY characters_delete ON characters
FOR DELETE TO anon, authenticated
USING (true);

ALTER TABLE master_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_delete_master_messages ON master_messages;
DROP POLICY IF EXISTS master_messages_delete ON master_messages;
CREATE POLICY master_messages_delete ON master_messages
FOR DELETE TO anon, authenticated
USING (true);
