-- RPG Barigui — tarefas 1–7 (estrutura e permissões)
ALTER TABLE players ADD COLUMN IF NOT EXISTS character_creation_allowed boolean NOT NULL DEFAULT false;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'vivo',
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

DO $$ BEGIN
  ALTER TABLE characters ADD CONSTRAINT characters_status_check CHECK (status IN ('vivo','morto','desaparecido'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE characters SET status = 'vivo' WHERE status IS NULL;

-- O app usa alcunha, sem Supabase Auth. Estas policies dão suporte às edições da interface.
-- O controle jogador/mestre continua sendo feito pela aplicação, como no restante do projeto.
DROP POLICY IF EXISTS "characters_update" ON characters;
CREATE POLICY "characters_update" ON characters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "players_update" ON players;
CREATE POLICY "players_update" ON players FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['character_items','character_contacts','character_factions','character_reputations','character_objectives','character_events']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_insert', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_update', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_delete', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO anon, authenticated USING (true)', t || '_delete', t);
  END LOOP;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('character-thumbnails', 'character-thumbnails', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "character_thumbnails_select" ON storage.objects;
CREATE POLICY "character_thumbnails_select" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'character-thumbnails');
DROP POLICY IF EXISTS "character_thumbnails_insert" ON storage.objects;
CREATE POLICY "character_thumbnails_insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'character-thumbnails');
DROP POLICY IF EXISTS "character_thumbnails_update" ON storage.objects;
CREATE POLICY "character_thumbnails_update" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'character-thumbnails') WITH CHECK (bucket_id = 'character-thumbnails');
DROP POLICY IF EXISTS "character_thumbnails_delete" ON storage.objects;
CREATE POLICY "character_thumbnails_delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'character-thumbnails');
