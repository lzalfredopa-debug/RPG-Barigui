-- ============================================================
-- TRILHA 1.5 — 08/10/2026
-- Criador de encontros + Bestiário + Combate do Mestre
-- Compatível com o combate existente de personagens.
-- ============================================================
BEGIN;

DO $$ BEGIN
  IF to_regclass('public.players') IS NULL OR to_regclass('public.characters') IS NULL OR to_regclass('public.combat_actions') IS NULL THEN
    RAISE EXCEPTION 'Base TRILHA incompleta: players, characters e combat_actions são obrigatórias.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1. BESTIÁRIO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bestiary_monsters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Outros',
  threat integer NOT NULL DEFAULT 1 CHECK (threat >= 1 AND threat <= 20),
  max_hp integer NOT NULL DEFAULT 10 CHECK (max_hp >= 1),
  attack_pool integer NOT NULL DEFAULT 3 CHECK (attack_pool >= 0),
  defense_pool integer NOT NULL DEFAULT 2 CHECK (defense_pool >= 0),
  damage integer NOT NULL DEFAULT 2 CHECK (damage >= 0),
  absorption integer NOT NULL DEFAULT 0 CHECK (absorption >= 0),
  initiative integer NOT NULL DEFAULT 3 CHECK (initiative >= 0),
  movement integer NOT NULL DEFAULT 8 CHECK (movement >= 0),
  image_url text,
  description text,
  public_description text,
  abilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. ENCONTROS, INIMIGOS INSTANCIADOS E INICIATIVA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.combat_encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  difficulty text NOT NULL DEFAULT 'moderado' CHECK (difficulty IN ('facil','moderado','dificil','mortal')),
  status text NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing','active','ended')),
  round integer NOT NULL DEFAULT 1 CHECK (round >= 1),
  current_turn_index integer NOT NULL DEFAULT 0 CHECK (current_turn_index >= 0),
  budget numeric NOT NULL DEFAULT 0,
  effective_threat numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  started_at timestamptz,
  ended_at timestamptz,
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combat_enemies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
  monster_id uuid REFERENCES public.bestiary_monsters(id) ON DELETE SET NULL,
  name text NOT NULL,
  max_hp integer NOT NULL CHECK (max_hp >= 1),
  current_hp integer NOT NULL CHECK (current_hp >= 0),
  attack_pool integer NOT NULL DEFAULT 3 CHECK (attack_pool >= 0),
  defense_pool integer NOT NULL DEFAULT 2 CHECK (defense_pool >= 0),
  damage integer NOT NULL DEFAULT 2 CHECK (damage >= 0),
  absorption integer NOT NULL DEFAULT 0 CHECK (absorption >= 0),
  initiative integer NOT NULL DEFAULT 3 CHECK (initiative >= 0),
  movement integer NOT NULL DEFAULT 8 CHECK (movement >= 0),
  image_url text,
  state text NOT NULL DEFAULT 'ativo',
  action_available boolean NOT NULL DEFAULT true,
  movement_available boolean NOT NULL DEFAULT true,
  reaction_available boolean NOT NULL DEFAULT true,
  target_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.combat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
  participant_type text NOT NULL CHECK (participant_type IN ('character','enemy')),
  character_id uuid REFERENCES public.characters(id) ON DELETE CASCADE,
  enemy_id uuid REFERENCES public.combat_enemies(id) ON DELETE CASCADE,
  initiative integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (participant_type='character' AND character_id IS NOT NULL AND enemy_id IS NULL)
    OR
    (participant_type='enemy' AND enemy_id IS NOT NULL AND character_id IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS combat_participant_character_unique
  ON public.combat_participants(encounter_id, character_id) WHERE character_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS combat_participant_enemy_unique
  ON public.combat_participants(encounter_id, enemy_id) WHERE enemy_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS combat_enemies_encounter_idx ON public.combat_enemies(encounter_id, sort_order);
CREATE INDEX IF NOT EXISTS combat_encounters_status_idx ON public.combat_encounters(status, started_at DESC);

CREATE TABLE IF NOT EXISTS public.combat_encounter_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  difficulty text NOT NULL DEFAULT 'moderado' CHECK (difficulty IN ('facil','moderado','dificil','mortal')),
  selection jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. COMBAT_ACTIONS PASSA A ACEITAR PERSONAGEM OU INIMIGO
-- ------------------------------------------------------------
ALTER TABLE public.combat_actions
  ALTER COLUMN attacker_character_id DROP NOT NULL,
  ALTER COLUMN target_character_id DROP NOT NULL;

ALTER TABLE public.combat_actions
  ADD COLUMN IF NOT EXISTS attacker_enemy_id uuid REFERENCES public.combat_enemies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS target_enemy_id uuid REFERENCES public.combat_enemies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS combat_actions_attacker_enemy_idx ON public.combat_actions(attacker_enemy_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS combat_actions_target_enemy_idx ON public.combat_actions(target_enemy_id, status, created_at DESC);

-- ------------------------------------------------------------
-- 4. POLÍTICAS — mantém o modelo atual do TRILHA (anon app)
-- ------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bestiary_monsters','combat_encounters','combat_enemies','combat_participants','combat_encounter_templates'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t||'_delete', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t||'_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t||'_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t||'_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO anon, authenticated USING (true)', t||'_delete', t);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO anon, authenticated', t);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 5. ALVOS: personagens + inimigos do encontro ativo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_combat_targets_v15(p_character_id uuid)
RETURNS TABLE(id uuid, name text, target_type text, state text)
LANGUAGE sql
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT targets.id, targets.name, targets.target_type, targets.state
  FROM (
    SELECT
      c.id AS id,
      c.name AS name,
      'character'::text AS target_type,
      NULL::text AS state
    FROM public.characters c
    WHERE c.id <> p_character_id
      AND COALESCE(c.status,'vivo')='vivo'
      AND COALESCE(c.current_hp,
        15 + COALESCE((c.attributes->>'Vigor')::integer,0)*5 + (COALESCE(c.level,1)-1)*2
      ) > 0

    UNION ALL

    SELECT
      ce.id AS id,
      ce.name AS name,
      'enemy'::text AS target_type,
      CASE
        WHEN ce.current_hp <= 0 THEN 'Derrotado'
        WHEN ce.current_hp::numeric / NULLIF(ce.max_hp,0) <= .25 THEN 'Gravemente ferido'
        WHEN ce.current_hp::numeric / NULLIF(ce.max_hp,0) <= .55 THEN 'Ferido'
        ELSE 'Saudável'
      END AS state
    FROM public.combat_enemies ce
    JOIN public.combat_encounters e
      ON e.id=ce.encounter_id AND e.status='active'
    WHERE ce.current_hp > 0
  ) AS targets
  ORDER BY targets.target_type, targets.name;
$$;
REVOKE ALL ON FUNCTION public.get_combat_targets_v15(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_combat_targets_v15(uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 6. PERSONAGEM ATACA PERSONAGEM OU INIMIGO
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.roll_character_attack_target(
  p_player_id uuid,
  p_character_id uuid,
  p_target_type text,
  p_target_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_is_master boolean := false;
  v_character_name text;
  v_character_status text;
  v_current_hp integer;
  v_action_available boolean;
  v_attributes jsonb;
  v_racial_bonus jsonb;
  v_skills jsonb;
  v_lineage_bonus jsonb;
  v_weapon_item_id uuid;
  v_weapon_id text;
  v_weapon_name text;
  v_attack_attribute text;
  v_attack_skill text;
  v_durability integer;
  v_pool integer;
  v_results integer[];
  v_explosions integer;
  v_weapon_effective_damage integer := 0;
  v_attack_penalty integer := 0;
  v_action_id uuid;
  v_enemy public.combat_enemies%ROWTYPE;
  v_defense_results integer[];
  v_defense_explosions integer := 0;
BEGIN
  IF p_target_type='character' THEN
    RETURN public.roll_character_attack(p_player_id,p_character_id,p_target_id);
  END IF;
  IF p_target_type <> 'enemy' THEN RAISE EXCEPTION 'Tipo de alvo inválido.'; END IF;

  SELECT COALESCE(p.player_identifier='Mestre',false) INTO v_is_master FROM public.players p WHERE p.id=p_player_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jogador não encontrado.'; END IF;

  SELECT c.name,c.status,c.current_hp,c.combat_action_available,
         COALESCE(c.attributes,'{}'::jsonb),COALESCE(c.racial_attribute_bonus,'{}'::jsonb),
         COALESCE(c.skills,'{}'::jsonb),COALESCE(c.lineage_skill_bonuses,'{}'::jsonb)
  INTO v_character_name,v_character_status,v_current_hp,v_action_available,
       v_attributes,v_racial_bonus,v_skills,v_lineage_bonus
  FROM public.characters c
  WHERE c.id=p_character_id AND (c.player_id=p_player_id OR v_is_master);
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado ou sem permissão para atacar.'; END IF;
  IF COALESCE(v_character_status,'vivo') <> 'vivo' OR COALESCE(v_current_hp,1)<=0 THEN RAISE EXCEPTION 'Este personagem não pode atacar.'; END IF;
  IF NOT COALESCE(v_action_available,true) THEN RAISE EXCEPTION 'A Ação deste turno já foi utilizada.'; END IF;

  SELECT ce.* INTO v_enemy
  FROM public.combat_enemies ce
  JOIN public.combat_encounters e ON e.id=ce.encounter_id AND e.status='active'
  WHERE ce.id=p_target_id AND ce.current_hp>0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Inimigo inválido ou derrotado.'; END IF;

  IF EXISTS (SELECT 1 FROM public.combat_actions ca WHERE ca.attacker_character_id=p_character_id AND ca.status IN ('awaiting_defense','awaiting_master')) THEN
    RAISE EXCEPTION 'Este personagem já possui um ataque aguardando resolução.';
  END IF;

  SELECT ci.id,ci.weapon_id,ci.durability_current,w.name,w.attack_attribute,w.attack_skill
  INTO v_weapon_item_id,v_weapon_id,v_durability,v_weapon_name,v_attack_attribute,v_attack_skill
  FROM public.character_items ci JOIN public.weapons w ON w.id=ci.weapon_id
  WHERE ci.character_id=p_character_id AND ci.equip_slot='weapon' AND ci.weapon_id IS NOT NULL
  ORDER BY ci.created_at LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipe uma arma antes de atacar.'; END IF;
  IF v_durability=0 THEN RAISE EXCEPTION 'A arma equipada está quebrada.'; END IF;

  SELECT COALESCE(eq.weapon_effective_damage,0) INTO v_weapon_effective_damage
  FROM public.get_character_combat_equipment_summary(p_character_id) eq;

  v_pool := LEAST(100,GREATEST(1,
    COALESCE((v_attributes->>v_attack_attribute)::integer,0)+COALESCE((v_racial_bonus->>v_attack_attribute)::integer,0)+
    COALESCE((v_skills->>v_attack_skill)::integer,0)+COALESCE((v_lineage_bonus->>v_attack_skill)::integer,0)
  ));
  SELECT r.results,r.explosions INTO v_results,v_explosions FROM public.trilha_roll_d10_exploding(v_pool) r;
  IF v_durability=1 THEN v_attack_penalty:=1; END IF;
  SELECT r.results,r.explosions INTO v_defense_results,v_defense_explosions FROM public.trilha_roll_d10_exploding(v_enemy.defense_pool) r;

  INSERT INTO public.combat_actions(
    attacker_player_id,attacker_character_id,attacker_name,target_enemy_id,target_name,
    weapon_id,weapon_name,attack_attribute,attack_skill,attack_pool,attack_results,
    attack_explosion_count,attack_difficulty_penalty,weapon_effective_damage,
    defense_kind,defense_source,defense_pool,defense_results,defense_explosion_count,
    defense_difficulty_penalty,armor_effective_absorption,status
  ) VALUES (
    p_player_id,p_character_id,v_character_name,v_enemy.id,v_enemy.name,
    v_weapon_id,v_weapon_name,v_attack_attribute,v_attack_skill,v_pool,to_jsonb(v_results),
    v_explosions,v_attack_penalty,v_weapon_effective_damage,
    'evasion','Defesa do inimigo',v_enemy.defense_pool,to_jsonb(v_defense_results),v_defense_explosions,
    0,v_enemy.absorption,'awaiting_master'
  ) RETURNING id INTO v_action_id;

  UPDATE public.characters SET combat_action_available=false WHERE id=p_character_id;
  RETURN v_action_id;
END;
$$;
REVOKE ALL ON FUNCTION public.roll_character_attack_target(uuid,uuid,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_character_attack_target(uuid,uuid,text,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 7. INIMIGO ATACA PERSONAGEM
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.master_enemy_attack(
  p_master_player_id uuid,
  p_enemy_id uuid,
  p_target_character_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_enemy public.combat_enemies%ROWTYPE;
  v_target_name text;
  v_results integer[];
  v_explosions integer;
  v_action_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.players p WHERE p.id=p_master_player_id AND p.player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Somente o Mestre pode comandar inimigos.';
  END IF;
  SELECT ce.* INTO v_enemy FROM public.combat_enemies ce JOIN public.combat_encounters e ON e.id=ce.encounter_id AND e.status='active' WHERE ce.id=p_enemy_id FOR UPDATE;
  IF NOT FOUND OR v_enemy.current_hp<=0 THEN RAISE EXCEPTION 'Inimigo indisponível.'; END IF;
  IF NOT v_enemy.action_available THEN RAISE EXCEPTION 'A Ação deste inimigo já foi utilizada.'; END IF;
  SELECT c.name INTO v_target_name FROM public.characters c WHERE c.id=p_target_character_id AND COALESCE(c.status,'vivo')='vivo' AND COALESCE(c.current_hp,1)>0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem-alvo inválido.'; END IF;
  IF EXISTS (SELECT 1 FROM public.combat_actions ca WHERE ca.attacker_enemy_id=p_enemy_id AND ca.status IN ('awaiting_defense','awaiting_master')) THEN
    RAISE EXCEPTION 'Este inimigo já possui um ataque aguardando resolução.';
  END IF;
  SELECT r.results,r.explosions INTO v_results,v_explosions FROM public.trilha_roll_d10_exploding(v_enemy.attack_pool) r;
  INSERT INTO public.combat_actions(
    attacker_player_id,attacker_enemy_id,attacker_name,target_character_id,target_name,
    weapon_name,attack_attribute,attack_skill,attack_pool,attack_results,attack_explosion_count,
    attack_difficulty_penalty,weapon_effective_damage,status
  ) VALUES (
    p_master_player_id,v_enemy.id,v_enemy.name,p_target_character_id,v_target_name,
    'Ataque natural','—','—',v_enemy.attack_pool,to_jsonb(v_results),v_explosions,
    0,v_enemy.damage,'awaiting_defense'
  ) RETURNING id INTO v_action_id;
  UPDATE public.combat_enemies SET action_available=false,target_character_id=p_target_character_id,updated_at=now() WHERE id=p_enemy_id;
  RETURN v_action_id;
END;
$$;
REVOKE ALL ON FUNCTION public.master_enemy_attack(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_enemy_attack(uuid,uuid,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 8. RESOLUÇÃO: agora também aplica dano em inimigos
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_combat_action(
  p_player_id uuid,
  p_combat_action_id uuid,
  p_difficulty integer DEFAULT 6
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_action public.combat_actions%ROWTYPE;
  v_attack_diff integer;
  v_defense_diff integer;
  v_attack_successes integer;
  v_defense_successes integer;
  v_excess integer := 0;
  v_damage integer := 0;
  v_hit boolean := false;
  v_hp_before integer;
  v_hp_after integer;
BEGIN
  IF p_difficulty < 2 OR p_difficulty > 9 THEN RAISE EXCEPTION 'A dificuldade deve estar entre 2 e 9.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') THEN RAISE EXCEPTION 'Somente o Mestre pode resolver o Teste Oposto.'; END IF;
  SELECT * INTO v_action FROM public.combat_actions ca WHERE ca.id=p_combat_action_id FOR UPDATE;
  IF NOT FOUND OR v_action.status<>'awaiting_master' THEN RAISE EXCEPTION 'Este combate não está aguardando resolução.'; END IF;

  v_attack_diff := LEAST(10,p_difficulty+COALESCE(v_action.attack_difficulty_penalty,0));
  v_defense_diff := LEAST(10,p_difficulty+COALESCE(v_action.defense_difficulty_penalty,0));
  v_attack_successes := public.trilha_count_successes(v_action.attack_results,v_attack_diff);
  IF v_action.defense_kind='passive' THEN v_defense_successes:=COALESCE(v_action.defense_passive_successes,0);
  ELSE v_defense_successes:=public.trilha_count_successes(v_action.defense_results,v_defense_diff); END IF;
  v_hit := v_attack_successes>0 AND v_attack_successes>v_defense_successes;

  IF v_hit THEN
    v_excess:=GREATEST(0,v_attack_successes-GREATEST(0,v_defense_successes));
    IF COALESCE(v_action.weapon_effective_damage,0)<=0 THEN v_damage:=0;
    ELSE v_damage:=GREATEST(1,COALESCE(v_action.weapon_effective_damage,0)+v_excess-COALESCE(v_action.armor_effective_absorption,0)); END IF;
  END IF;

  IF v_action.target_enemy_id IS NOT NULL THEN
    SELECT ce.current_hp INTO v_hp_before FROM public.combat_enemies ce WHERE ce.id=v_action.target_enemy_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Inimigo-alvo não encontrado.'; END IF;
    v_hp_after:=CASE WHEN v_hit THEN GREATEST(0,v_hp_before-v_damage) ELSE v_hp_before END;
    UPDATE public.combat_enemies SET current_hp=v_hp_after,
      state=CASE WHEN v_hp_after=0 THEN 'derrotado' ELSE state END, updated_at=now()
    WHERE id=v_action.target_enemy_id;
  ELSE
    SELECT COALESCE(c.current_hp,15+COALESCE((c.attributes->>'Vigor')::integer,0)*5+(COALESCE(c.level,1)-1)*2)
    INTO v_hp_before FROM public.characters c WHERE c.id=v_action.target_character_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Personagem-alvo não encontrado.'; END IF;
    v_hp_after:=CASE WHEN v_hit THEN GREATEST(0,v_hp_before-v_damage) ELSE v_hp_before END;
    IF v_hit THEN
      UPDATE public.characters SET current_hp=v_hp_after WHERE id=v_action.target_character_id;
      IF v_hp_after=0 AND NOT EXISTS (SELECT 1 FROM public.character_conditions cc WHERE cc.character_id=v_action.target_character_id AND lower(cc.condition)='inconsciente') THEN
        INSERT INTO public.character_conditions(character_id,condition,intensity,duration,notes,source)
        VALUES(v_action.target_character_id,'Inconsciente',1,NULL,'PV chegou a 0.','combat');
      END IF;
    END IF;
  END IF;

  UPDATE public.combat_actions SET difficulty=p_difficulty,attack_successes=v_attack_successes,defense_successes=v_defense_successes,
    excess_successes=v_excess,damage_final=v_damage,target_hp_before=v_hp_before,target_hp_after=v_hp_after,
    status='resolved',resolved_by=p_player_id,resolved_at=now(),updated_at=now()
  WHERE id=p_combat_action_id;

  UPDATE public.chat_messages SET combat_difficulty=p_difficulty,attack_successes=v_attack_successes,defense_successes=v_defense_successes,
    excess_successes=v_excess,damage_final=v_damage,target_hp_after=v_hp_after,combat_status='resolved',
    master_decision=CASE WHEN v_hit THEN 'success' ELSE 'failure' END,master_decision_by=p_player_id,master_decision_at=now()
  WHERE combat_action_id=p_combat_action_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_combat_action(uuid,uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_combat_action(uuid,uuid,integer) TO anon, authenticated;

-- ------------------------------------------------------------
-- 9. ANULAR AÇÃO: restaura personagem ou inimigo
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.void_combat_action(p_player_id uuid,p_combat_action_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE v_action public.combat_actions%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') THEN RAISE EXCEPTION 'Somente o Mestre pode anular um combate.'; END IF;
  SELECT * INTO v_action FROM public.combat_actions ca WHERE ca.id=p_combat_action_id FOR UPDATE;
  IF NOT FOUND OR v_action.status NOT IN ('awaiting_defense','awaiting_master') THEN RAISE EXCEPTION 'Somente combates ainda não resolvidos podem ser anulados.'; END IF;
  IF v_action.attacker_character_id IS NOT NULL THEN UPDATE public.characters SET combat_action_available=true WHERE id=v_action.attacker_character_id; END IF;
  IF v_action.attacker_enemy_id IS NOT NULL THEN UPDATE public.combat_enemies SET action_available=true WHERE id=v_action.attacker_enemy_id; END IF;
  IF v_action.defender_reaction_spent AND v_action.target_character_id IS NOT NULL THEN UPDATE public.characters SET combat_reaction_available=true WHERE id=v_action.target_character_id; END IF;
  UPDATE public.combat_actions SET status='void',resolved_by=p_player_id,resolved_at=now(),updated_at=now() WHERE id=p_combat_action_id;
  UPDATE public.chat_messages SET combat_status='void',master_decision='void',master_decision_by=p_player_id,master_decision_at=now() WHERE combat_action_id=p_combat_action_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.void_combat_action(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_combat_action(uuid,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 10. BESTIÁRIO INICIAL — exemplos editáveis/removíveis
-- ------------------------------------------------------------
INSERT INTO public.bestiary_monsters(name,category,threat,max_hp,attack_pool,defense_pool,damage,absorption,initiative,movement,public_description,description)
SELECT * FROM (VALUES
  ('Rato Gigante','Bestas',1,6,3,2,2,0,4,9,'Uma fera pequena, rápida e agressiva.','Modelo inicial de ameaça baixa.'),
  ('Bandido','Humanoides',2,12,4,3,3,0,4,8,'Um combatente oportunista e pouco disciplinado.','Modelo humanoide comum.'),
  ('Goblin Saqueador','Humanoides',2,10,4,3,3,0,5,9,'Pequeno, inquieto e perigoso em grupo.','Funciona bem em grupos.'),
  ('Lobo Cinzento','Bestas',2,11,4,4,3,0,6,11,'Predador ágil que prefere cercar a presa.','Boa mobilidade e defesa.'),
  ('Esqueleto Guerreiro','Mortos-vivos',3,16,5,3,4,1,3,7,'Restos animados de um antigo guerreiro.','Absorção leve.'),
  ('Ogro','Monstruosidades',6,38,7,3,7,2,3,7,'Uma massa brutal de força e resistência.','Elite física.'),
  ('Espectro','Espíritos',6,28,7,6,5,1,8,10,'Uma presença incorpórea e difícil de atingir.','Defesa elevada.'),
  ('Guardião Dracônico','Dragões',8,52,8,6,8,3,7,10,'Uma criatura ancestral feita para dominar o campo de batalha.','Chefe inicial de referência.')
) AS v(name,category,threat,max_hp,attack_pool,defense_pool,damage,absorption,initiative,movement,public_description,description)
WHERE NOT EXISTS (SELECT 1 FROM public.bestiary_monsters b WHERE lower(b.name)=lower(v.name));

-- ------------------------------------------------------------
-- 11. REALTIME
-- ------------------------------------------------------------
ALTER TABLE public.combat_encounters REPLICA IDENTITY FULL;
ALTER TABLE public.combat_enemies REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='combat_encounters') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_encounters; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='combat_enemies') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_enemies; END IF;
END $$;

COMMIT;
