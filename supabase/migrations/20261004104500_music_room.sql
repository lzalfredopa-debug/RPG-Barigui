-- TRILHA — Música da Mesa
-- Guarda o conteúdo Spotify compartilhado pelo Mestre e o replica em tempo real.

CREATE TABLE IF NOT EXISTS public.music_room_settings (
  id text PRIMARY KEY DEFAULT 'main',
  spotify_url text NOT NULL DEFAULT '',
  updated_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT music_room_settings_singleton CHECK (id = 'main'),
  CONSTRAINT music_room_settings_url_length CHECK (char_length(spotify_url) <= 1000)
);

ALTER TABLE public.music_room_settings
  ADD COLUMN IF NOT EXISTS spotify_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

INSERT INTO public.music_room_settings (id, spotify_url)
VALUES ('main', '')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.music_room_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS music_room_settings_select ON public.music_room_settings;
CREATE POLICY music_room_settings_select
ON public.music_room_settings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS music_room_settings_insert ON public.music_room_settings;
CREATE POLICY music_room_settings_insert
ON public.music_room_settings FOR INSERT
TO anon, authenticated
WITH CHECK (id = 'main');

DROP POLICY IF EXISTS music_room_settings_update ON public.music_room_settings;
CREATE POLICY music_room_settings_update
ON public.music_room_settings FOR UPDATE
TO anon, authenticated
USING (id = 'main')
WITH CHECK (id = 'main');

ALTER TABLE public.music_room_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'music_room_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.music_room_settings;
  END IF;
END $$;
