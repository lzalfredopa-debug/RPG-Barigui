-- TRILHA — exclusão de personagens pelo fluxo do Painel do Mestre.
-- A aplicação usa acesso por alcunha (sem Supabase Auth); portanto a exclusividade
-- é aplicada na interface do Mestre. Esta policy apenas permite que a operação
-- enviada pelo painel alcance a tabela. Relações com ON DELETE CASCADE são removidas junto.
DROP POLICY IF EXISTS characters_delete ON characters;
CREATE POLICY characters_delete ON characters
FOR DELETE TO anon, authenticated
USING (true);
