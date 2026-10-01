/*
  Character records created at the end of the creation flow.
  The player UI only SELECTs and INSERTs these records: it exposes no UPDATE or DELETE action.
*/
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  name text NOT NULL,
  nickname text,
  age integer NOT NULL CHECK (age >= 0),
  gender text,
  race text NOT NULL,
  lineage text NOT NULL,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  class_name text NOT NULL DEFAULT 'Aprendiz',
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  skills jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS characters_player_id_idx ON characters(player_id);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_characters" ON characters;
CREATE POLICY "anon_select_characters" ON characters
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_characters" ON characters;
CREATE POLICY "anon_insert_characters" ON characters
  FOR INSERT TO anon, authenticated WITH CHECK (true);

/* Intentionally no UPDATE or DELETE policies for characters. */
