/*
# Create missing base tables for character sheet, inventory, conditions, effects, and master panel background data

These tables are referenced by later migrations (ALTER TABLE ADD COLUMN, RLS policies, trigger functions)
but their CREATE TABLE statements were missing from the applied migrations. This migration creates them
with the columns inferred from usage in those later migrations.

## New Tables

1. character_items — Inventory items belonging to a character (weapons, armor, shields, consumables, etc.)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - name (text, NOT NULL)
   - type (text — 'arma','armadura','escudo','comum','consumível','perecível','recipiente')
   - quantity (integer, NOT NULL, default 1)
   - equipped (boolean, NOT NULL, default false)
   - description (text, nullable)
   - created_at (timestamptz, default now())

2. character_conditions — Active conditions affecting a character (e.g. 'Desmaiado','Inconsciente')
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - condition (text, NOT NULL)
   - intensity (integer, nullable)
   - duration (text, nullable)
   - notes (text, nullable)

3. character_effects — Temporary or permanent effects on a character
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - name (text)
   - description (text)
   - intensity (integer)
   - created_at (timestamptz, default now())

4. character_contacts — Contacts in a character's background (master-managed)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - name (text, NOT NULL)
   - relationship (text)
   - notes (text)
   - created_at (timestamptz, default now())

5. character_factions — Faction memberships for a character (master-managed)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - faction_name (text, NOT NULL)
   - role (text)
   - notes (text)
   - created_at (timestamptz, default now())

6. character_reputations — Reputation entries for a character (master-managed)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - faction_name (text, NOT NULL)
   - reputation_level (integer)
   - notes (text)
   - created_at (timestamptz, default now())

7. character_objectives — Objectives/goals for a character (master-managed)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - objective (text, NOT NULL)
   - status (text, default 'ativo')
   - notes (text)
   - created_at (timestamptz, default now())

8. character_events — Notable events in a character's history (master-managed)
   - id (uuid PK)
   - character_id (uuid FK → characters, ON DELETE CASCADE)
   - event_title (text, NOT NULL)
   - event_description (text)
   - event_date (text)
   - created_at (timestamptz, default now())

## Security

- RLS enabled on every new table.
- SELECT policy (TO anon, authenticated USING true) — the app uses alcunha-based access control,
  not Supabase Auth. Data is intentionally shared among table participants.
- No auth system is used, so all policies use TO anon, authenticated.
*/

-- 1. character_items
CREATE TABLE IF NOT EXISTS character_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'comum',
  quantity integer NOT NULL DEFAULT 1,
  equipped boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_items_character_id_idx ON character_items(character_id);
ALTER TABLE character_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_items_select ON character_items;
CREATE POLICY character_items_select ON character_items FOR SELECT TO anon, authenticated USING (true);

-- 2. character_conditions
CREATE TABLE IF NOT EXISTS character_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  condition text NOT NULL,
  intensity integer,
  duration text,
  notes text
);
CREATE INDEX IF NOT EXISTS character_conditions_character_id_idx ON character_conditions(character_id);
ALTER TABLE character_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_conditions_select ON character_conditions;
CREATE POLICY character_conditions_select ON character_conditions FOR SELECT TO anon, authenticated USING (true);

-- 3. character_effects
CREATE TABLE IF NOT EXISTS character_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name text,
  description text,
  intensity integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_effects_character_id_idx ON character_effects(character_id);
ALTER TABLE character_effects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_effects_select ON character_effects;
CREATE POLICY character_effects_select ON character_effects FOR SELECT TO anon, authenticated USING (true);

-- 4. character_contacts
CREATE TABLE IF NOT EXISTS character_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  relationship text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_contacts_character_id_idx ON character_contacts(character_id);
ALTER TABLE character_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_contacts_select ON character_contacts;
CREATE POLICY character_contacts_select ON character_contacts FOR SELECT TO anon, authenticated USING (true);

-- 5. character_factions
CREATE TABLE IF NOT EXISTS character_factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  faction_name text NOT NULL,
  role text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_factions_character_id_idx ON character_factions(character_id);
ALTER TABLE character_factions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_factions_select ON character_factions;
CREATE POLICY character_factions_select ON character_factions FOR SELECT TO anon, authenticated USING (true);

-- 6. character_reputations
CREATE TABLE IF NOT EXISTS character_reputations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  faction_name text NOT NULL,
  reputation_level integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_reputations_character_id_idx ON character_reputations(character_id);
ALTER TABLE character_reputations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_reputations_select ON character_reputations;
CREATE POLICY character_reputations_select ON character_reputations FOR SELECT TO anon, authenticated USING (true);

-- 7. character_objectives
CREATE TABLE IF NOT EXISTS character_objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  objective text NOT NULL,
  status text NOT NULL DEFAULT 'ativo',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_objectives_character_id_idx ON character_objectives(character_id);
ALTER TABLE character_objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_objectives_select ON character_objectives;
CREATE POLICY character_objectives_select ON character_objectives FOR SELECT TO anon, authenticated USING (true);

-- 8. character_events
CREATE TABLE IF NOT EXISTS character_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  event_title text NOT NULL,
  event_description text,
  event_date text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS character_events_character_id_idx ON character_events(character_id);
ALTER TABLE character_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS character_events_select ON character_events;
CREATE POLICY character_events_select ON character_events FOR SELECT TO anon, authenticated USING (true);