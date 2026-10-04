-- TRILHA — Etapa 3: revelação individual da árvore de classes
-- Cada registro indica que uma casa da árvore foi revelada para um personagem específico.

CREATE TABLE IF NOT EXISTS character_class_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  class_node_id text NOT NULL REFERENCES class_nodes(id) ON DELETE CASCADE,
  revealed_at timestamptz NOT NULL DEFAULT now(),
  revealed_by text NOT NULL DEFAULT 'Mestre',
  UNIQUE (character_id, class_node_id)
);

CREATE INDEX IF NOT EXISTS character_class_reveals_character_idx
  ON character_class_reveals(character_id);

CREATE INDEX IF NOT EXISTS character_class_reveals_node_idx
  ON character_class_reveals(class_node_id);

ALTER TABLE character_class_reveals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS character_class_reveals_select ON character_class_reveals;
CREATE POLICY character_class_reveals_select
ON character_class_reveals
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS character_class_reveals_insert ON character_class_reveals;
CREATE POLICY character_class_reveals_insert
ON character_class_reveals
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS character_class_reveals_delete ON character_class_reveals;
CREATE POLICY character_class_reveals_delete
ON character_class_reveals
FOR DELETE
TO anon, authenticated
USING (true);
