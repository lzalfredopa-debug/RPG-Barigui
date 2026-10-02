-- RPG Barigui — Painel do Mestre
-- Acrescenta fluxo de acompanhamento das sugestões e garante CRUD das tabelas
-- que o Mestre administra pela interface atual baseada em alcunha.

ALTER TABLE suggestions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nova';
DO $$ BEGIN
  ALTER TABLE suggestions ADD CONSTRAINT suggestions_status_check CHECK (status IN ('nova','lida','resolvida'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Condições e efeitos passam a poder ser administrados pelo painel/ficha do Mestre.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['character_conditions','character_effects']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true)', t || '_delete', t);
  END LOOP;
END $$;
