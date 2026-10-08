-- TRILHA 1.5 — ajustes de UX e conteúdo
-- 1) texto curto editável de Povos/Vertentes
-- 2) recados de jogadores para o Mestre

BEGIN;

ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'Povo narrativo e cultural';

ALTER TABLE public.lineages
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'Vertente narrativa e cultural';

UPDATE public.races
SET tagline = 'Povo narrativo e cultural'
WHERE trim(COALESCE(tagline, '')) = '';

UPDATE public.lineages
SET tagline = 'Vertente narrativa e cultural'
WHERE trim(COALESCE(tagline, '')) = '';

CREATE TABLE IF NOT EXISTS public.player_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_messages_player_created_idx
  ON public.player_messages(player_id, created_at DESC);

ALTER TABLE public.player_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS anon_select_player_messages ON public.player_messages;
CREATE POLICY anon_select_player_messages ON public.player_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS anon_insert_player_messages ON public.player_messages;
CREATE POLICY anon_insert_player_messages ON public.player_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS anon_update_player_messages ON public.player_messages;
CREATE POLICY anon_update_player_messages ON public.player_messages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_delete_player_messages ON public.player_messages;
CREATE POLICY anon_delete_player_messages ON public.player_messages
  FOR DELETE TO anon, authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.races, public.lineages TO anon, authenticated;

COMMIT;
