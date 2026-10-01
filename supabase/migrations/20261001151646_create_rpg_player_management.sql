/*
# Create RPG Player Management Tables

## Overview
Creates the core tables for a tabletop RPG player management system.
Players log in with a pre-registered "alcunha" (nickname) that acts as an access key.
No auth system — the app uses the anon key directly.

## New Tables

### 1. `players`
Stores the 11 pre-registered alcunhas (nicknames) and their associated player info.
- `id` (uuid, primary key)
- `alcunha` (text, unique, not null) — the nickname used as access key
- `status` (text, not null, default 'espera') — either 'ativa' or 'espera'
- `player_name` (text, nullable) — the real name of the player
- `player_identifier` (text, nullable) — a short identifier for the player

### 2. `personal_notes`
Stores personal notes/reminders written by each player.
- `id` (uuid, primary key)
- `player_id` (uuid, foreign key to players.id, not null)
- `content` (text, not null)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3. `master_messages`
Stores messages from the game master to players.
- `id` (uuid, primary key)
- `player_id` (uuid, foreign key to players.id, not null)
- `content` (text, not null)
- `created_at` (timestamptz, default now())

### 4. `suggestions`
Stores feedback/suggestions sent by players.
- `id` (uuid, primary key)
- `player_id` (uuid, foreign key to players.id, not null)
- `content` (text, not null)
- `created_at` (timestamptz, default now())

## Security
- RLS enabled on all tables.
- Policies use `TO anon, authenticated` since there is no sign-in screen — the app uses the anon key.
- All CRUD operations are open (USING true / WITH CHECK true) because this is a shared, no-auth app where the alcunha itself is the access control.

## Initial Data
Inserts the 11 alcunhas. All are set to 'espera' except 'Vampire' which is 'ativa' with player_name 'Alfredo' and player_identifier 'alfredo'.

## Important Notes
1. The alcunha comparison in the app is case-insensitive and trims whitespace, so the stored values use canonical casing.
2. The `players` table is the access control mechanism — only alcunhas with status 'ativa' can enter the player page.
3. No auth.users integration — this is a no-auth app by design.
*/

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alcunha text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'espera' CHECK (status IN ('ativa', 'espera')),
  player_name text,
  player_identifier text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_players" ON players;
CREATE POLICY "anon_select_players" ON players FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_players" ON players;
CREATE POLICY "anon_insert_players" ON players FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_players" ON players;
CREATE POLICY "anon_update_players" ON players FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_players" ON players;
CREATE POLICY "anon_delete_players" ON players FOR DELETE
  TO anon, authenticated USING (true);

-- Personal notes table
CREATE TABLE IF NOT EXISTS personal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE personal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notes" ON personal_notes;
CREATE POLICY "anon_select_notes" ON personal_notes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notes" ON personal_notes;
CREATE POLICY "anon_insert_notes" ON personal_notes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notes" ON personal_notes;
CREATE POLICY "anon_update_notes" ON personal_notes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notes" ON personal_notes;
CREATE POLICY "anon_delete_notes" ON personal_notes FOR DELETE
  TO anon, authenticated USING (true);

-- Master messages table
CREATE TABLE IF NOT EXISTS master_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE master_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_master_messages" ON master_messages;
CREATE POLICY "anon_select_master_messages" ON master_messages FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_master_messages" ON master_messages;
CREATE POLICY "anon_insert_master_messages" ON master_messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_master_messages" ON master_messages;
CREATE POLICY "anon_update_master_messages" ON master_messages FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_master_messages" ON master_messages;
CREATE POLICY "anon_delete_master_messages" ON master_messages FOR DELETE
  TO anon, authenticated USING (true);

-- Suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_suggestions" ON suggestions;
CREATE POLICY "anon_select_suggestions" ON suggestions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_suggestions" ON suggestions;
CREATE POLICY "anon_insert_suggestions" ON suggestions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_suggestions" ON suggestions;
CREATE POLICY "anon_update_suggestions" ON suggestions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_suggestions" ON suggestions;
CREATE POLICY "anon_delete_suggestions" ON suggestions FOR DELETE
  TO anon, authenticated USING (true);

-- Insert initial 11 alcunhas
INSERT INTO players (alcunha, status, player_name, player_identifier) VALUES
  ('Dragon', 'espera', NULL, NULL),
  ('Beholder', 'espera', NULL, NULL),
  ('Lich', 'espera', NULL, NULL),
  ('Flayer', 'espera', NULL, NULL),
  ('Tarrasque', 'espera', NULL, NULL),
  ('Demogorgon', 'espera', NULL, NULL),
  ('Owlbear', 'espera', NULL, NULL),
  ('Kraken', 'espera', NULL, NULL),
  ('Vampire', 'ativa', 'Alfredo', 'alfredo'),
  ('Cube', 'espera', NULL, NULL),
  ('Mimic', 'espera', NULL, NULL)
ON CONFLICT (alcunha) DO NOTHING;
