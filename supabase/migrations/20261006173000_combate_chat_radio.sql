-- ============================================================
-- TRILHA — 06/10/2026 — Combate oposto + Chat + Rádio
--
-- 1) Combate: alvo, Ataque x Defesa, reação, proficiência de
--    arma/escudo/armadura, sucessos excedentes e dano automático.
-- 2) Chat: suporte a /r com expressões de vários dados.
-- 3) Rádio: parada local para todos e avanço global pelo Mestre.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. RECURSOS DE TURNO DO PERSONAGEM
-- ------------------------------------------------------------
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS combat_action_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS combat_movement_available boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS combat_reaction_available boolean NOT NULL DEFAULT true;

-- ------------------------------------------------------------
-- 2. AÇÕES DE COMBATE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.combat_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  attacker_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  attacker_name text NOT NULL,
  target_character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  target_name text NOT NULL,
  weapon_id text REFERENCES public.weapons(id) ON DELETE SET NULL,
  weapon_name text NOT NULL,
  attack_attribute text NOT NULL,
  attack_skill text NOT NULL,
  attack_pool integer NOT NULL DEFAULT 0,
  attack_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  attack_explosion_count integer NOT NULL DEFAULT 0,
  attack_difficulty_penalty integer NOT NULL DEFAULT 0,
  weapon_effective_damage integer NOT NULL DEFAULT 0,

  defense_kind text CHECK (defense_kind IN ('evasion','block','passive')),
  defense_source text,
  defense_pool integer,
  defense_results jsonb,
  defense_explosion_count integer NOT NULL DEFAULT 0,
  defense_passive_successes integer,
  defense_difficulty_penalty integer NOT NULL DEFAULT 0,
  armor_effective_absorption integer NOT NULL DEFAULT 0,

  difficulty integer,
  attack_successes integer,
  defense_successes integer,
  excess_successes integer,
  damage_final integer,
  target_hp_before integer,
  target_hp_after integer,

  status text NOT NULL DEFAULT 'awaiting_defense'
    CHECK (status IN ('awaiting_defense','awaiting_master','resolved','void')),
  defender_reaction_spent boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS combat_actions_target_status_idx
  ON public.combat_actions(target_character_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS combat_actions_attacker_status_idx
  ON public.combat_actions(attacker_character_id, status, created_at DESC);

ALTER TABLE public.combat_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS combat_actions_select ON public.combat_actions;
CREATE POLICY combat_actions_select ON public.combat_actions
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.combat_actions TO anon, authenticated;

ALTER TABLE public.combat_actions REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='combat_actions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_actions;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. CAMPOS DO CHAT PARA COMBATE E ROLAGENS MÚLTIPLAS
-- ------------------------------------------------------------
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS roll_breakdown jsonb,
  ADD COLUMN IF NOT EXISTS combat_action_id uuid REFERENCES public.combat_actions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_character_name text,
  ADD COLUMN IF NOT EXISTS defense_kind text,
  ADD COLUMN IF NOT EXISTS defense_source text,
  ADD COLUMN IF NOT EXISTS defense_pool integer,
  ADD COLUMN IF NOT EXISTS defense_results jsonb,
  ADD COLUMN IF NOT EXISTS defense_explosion_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS defense_passive_successes integer,
  ADD COLUMN IF NOT EXISTS combat_difficulty integer,
  ADD COLUMN IF NOT EXISTS attack_successes integer,
  ADD COLUMN IF NOT EXISTS defense_successes integer,
  ADD COLUMN IF NOT EXISTS excess_successes integer,
  ADD COLUMN IF NOT EXISTS damage_final integer,
  ADD COLUMN IF NOT EXISTS target_hp_after integer,
  ADD COLUMN IF NOT EXISTS combat_status text;

CREATE INDEX IF NOT EXISTS chat_messages_combat_action_id_idx
  ON public.chat_messages(combat_action_id);

-- ------------------------------------------------------------
-- 4. UTILITÁRIOS INTERNOS DE DADOS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trilha_roll_d10_exploding(p_pool integer)
RETURNS TABLE(results integer[], explosions integer)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_results integer[] := ARRAY[]::integer[];
  v_roll integer;
  v_i integer;
  v_pending integer := LEAST(100, GREATEST(0, COALESCE(p_pool,0)));
  v_explosions integer := 0;
BEGIN
  IF v_pending > 0 THEN
    FOR v_i IN 1..v_pending LOOP
      v_roll := floor(random()*10)::integer + 1;
      v_results := array_append(v_results, v_roll);
    END LOOP;
  END IF;

  v_i := 1;
  WHILE v_i <= COALESCE(array_length(v_results,1),0) LOOP
    IF v_results[v_i] = 10 AND COALESCE(array_length(v_results,1),0) < 200 THEN
      v_roll := floor(random()*10)::integer + 1;
      v_results := array_append(v_results, v_roll);
      v_explosions := v_explosions + 1;
    END IF;
    v_i := v_i + 1;
  END LOOP;

  results := v_results;
  explosions := v_explosions;
  RETURN NEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.trilha_roll_d10_exploding(integer) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.trilha_count_successes(p_results jsonb, p_difficulty integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path=public
AS $$
  SELECT COALESCE(sum(
    CASE
      WHEN value::integer = 1 THEN -1
      WHEN value::integer > p_difficulty THEN 1
      ELSE 0
    END
  ),0)::integer
  FROM jsonb_array_elements_text(COALESCE(p_results,'[]'::jsonb));
$$;
REVOKE ALL ON FUNCTION public.trilha_count_successes(jsonb,integer) FROM PUBLIC;

-- ------------------------------------------------------------
-- 5. ALVOS PÚBLICOS DE COMBATE
--    Expõe somente o necessário para a seleção do alvo.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_combat_targets(p_character_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT c.id, c.name
  FROM public.characters c
  WHERE c.id <> p_character_id
    AND COALESCE(c.status,'vivo') = 'vivo'
    AND COALESCE(c.current_hp,
      15
      + (COALESCE((c.attributes->>'Vigor')::integer,0) + COALESCE((c.racial_attribute_bonus->>'Vigor')::integer,0)) * 5
      + (COALESCE(c.level,1)-1) * 2
    ) > 0
  ORDER BY lower(c.name), c.created_at;
$$;
REVOKE ALL ON FUNCTION public.get_combat_targets(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_combat_targets(uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 6. INÍCIO/CONTROLE DE TURNO
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_character_turn(p_player_id uuid, p_character_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_is_master boolean := false;
BEGIN
  SELECT COALESCE(p.player_identifier='Mestre',false)
  INTO v_is_master FROM public.players p WHERE p.id=p_player_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id=p_character_id AND (c.player_id=p_player_id OR v_is_master)
  ) THEN
    RAISE EXCEPTION 'Personagem não encontrado ou sem permissão.';
  END IF;

  UPDATE public.characters
  SET combat_action_available=true,
      combat_movement_available=true,
      combat_reaction_available=true
  WHERE id=p_character_id;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.start_character_turn(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_character_turn(uuid,uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.spend_character_movement(p_player_id uuid, p_character_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_is_master boolean := false;
BEGIN
  SELECT COALESCE(p.player_identifier='Mestre',false)
  INTO v_is_master FROM public.players p WHERE p.id=p_player_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.characters c
    WHERE c.id=p_character_id AND (c.player_id=p_player_id OR v_is_master)
  ) THEN
    RAISE EXCEPTION 'Personagem não encontrado ou sem permissão.';
  END IF;

  UPDATE public.characters
  SET combat_movement_available=false
  WHERE id=p_character_id AND combat_movement_available=true;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.spend_character_movement(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_character_movement(uuid,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 7. ATAQUE — substitui a versão inicial sem alvo
-- ------------------------------------------------------------
DROP FUNCTION IF EXISTS public.roll_character_attack(uuid,uuid);
CREATE OR REPLACE FUNCTION public.roll_character_attack(
  p_player_id uuid,
  p_character_id uuid,
  p_target_character_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_is_master boolean := false;
  v_player_name text;
  v_player_identifier text;
  v_character_name text;
  v_target_name text;
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
  v_total integer := 0;
  v_weapon_effective_damage integer := 0;
  v_attack_penalty integer := 0;
  v_action_id uuid;
BEGIN
  SELECT COALESCE(NULLIF(btrim(p.player_name),''),p.alcunha), p.player_identifier,
         COALESCE(p.player_identifier='Mestre',false)
  INTO v_player_name,v_player_identifier,v_is_master
  FROM public.players p WHERE p.id=p_player_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Jogador não encontrado.'; END IF;

  SELECT c.name,c.status,c.current_hp,c.combat_action_available,
         COALESCE(c.attributes,'{}'::jsonb),COALESCE(c.racial_attribute_bonus,'{}'::jsonb),
         COALESCE(c.skills,'{}'::jsonb),COALESCE(c.lineage_skill_bonuses,'{}'::jsonb)
  INTO v_character_name,v_character_status,v_current_hp,v_action_available,
       v_attributes,v_racial_bonus,v_skills,v_lineage_bonus
  FROM public.characters c
  WHERE c.id=p_character_id AND (c.player_id=p_player_id OR v_is_master);
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado ou sem permissão para atacar.'; END IF;

  IF COALESCE(v_character_status,'vivo') <> 'vivo' OR COALESCE(v_current_hp,1) <= 0 THEN
    RAISE EXCEPTION 'Este personagem não pode atacar no estado atual.';
  END IF;
  IF NOT COALESCE(v_action_available,true) THEN
    RAISE EXCEPTION 'A Ação deste turno já foi utilizada.';
  END IF;
  IF p_target_character_id=p_character_id THEN RAISE EXCEPTION 'Escolha outro personagem como alvo.'; END IF;

  SELECT c.name INTO v_target_name
  FROM public.characters c
  WHERE c.id=p_target_character_id
    AND COALESCE(c.status,'vivo')='vivo'
    AND COALESCE(c.current_hp,
      15 + (COALESCE((c.attributes->>'Vigor')::integer,0)+COALESCE((c.racial_attribute_bonus->>'Vigor')::integer,0))*5
      + (COALESCE(c.level,1)-1)*2
    ) > 0;
  IF NOT FOUND THEN RAISE EXCEPTION 'Alvo inválido ou incapaz de combater.'; END IF;

  IF EXISTS (
    SELECT 1 FROM public.combat_actions ca
    WHERE ca.attacker_character_id=p_character_id
      AND ca.status IN ('awaiting_defense','awaiting_master')
  ) THEN
    RAISE EXCEPTION 'Este personagem já possui um ataque aguardando resolução.';
  END IF;

  SELECT ci.id,ci.weapon_id,ci.durability_current,w.name,w.attack_attribute,w.attack_skill
  INTO v_weapon_item_id,v_weapon_id,v_durability,v_weapon_name,v_attack_attribute,v_attack_skill
  FROM public.character_items ci
  JOIN public.weapons w ON w.id=ci.weapon_id
  WHERE ci.character_id=p_character_id AND ci.equip_slot='weapon' AND ci.weapon_id IS NOT NULL
  ORDER BY ci.created_at LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Equipe uma arma antes de atacar.'; END IF;
  IF v_durability=0 THEN RAISE EXCEPTION 'A arma equipada está quebrada.'; END IF;

  SELECT COALESCE(eq.weapon_effective_damage,0)
  INTO v_weapon_effective_damage
  FROM public.get_character_combat_equipment_summary(p_character_id) eq;

  v_pool :=
      COALESCE((v_attributes->>v_attack_attribute)::integer,0)
    + COALESCE((v_racial_bonus->>v_attack_attribute)::integer,0)
    + COALESCE((v_skills->>v_attack_skill)::integer,0)
    + COALESCE((v_lineage_bonus->>v_attack_skill)::integer,0);
  v_pool := LEAST(100,GREATEST(1,COALESCE(v_pool,1)));

  SELECT r.results,r.explosions INTO v_results,v_explosions
  FROM public.trilha_roll_d10_exploding(v_pool) r;
  SELECT COALESCE(sum(r.x),0) INTO v_total FROM unnest(v_results) AS r(x);

  -- Item Danificado: +1 de dificuldade quando é essencial ao teste.
  IF v_durability=1 THEN v_attack_penalty := 1; END IF;

  INSERT INTO public.combat_actions(
    attacker_player_id,attacker_character_id,attacker_name,
    target_character_id,target_name,weapon_id,weapon_name,
    attack_attribute,attack_skill,attack_pool,attack_results,
    attack_explosion_count,attack_difficulty_penalty,weapon_effective_damage,
    status
  ) VALUES (
    p_player_id,p_character_id,v_character_name,
    p_target_character_id,v_target_name,v_weapon_id,v_weapon_name,
    v_attack_attribute,v_attack_skill,v_pool,to_jsonb(v_results),
    v_explosions,v_attack_penalty,v_weapon_effective_damage,
    'awaiting_defense'
  ) RETURNING id INTO v_action_id;

  INSERT INTO public.chat_messages(
    player_id,player_name,player_identifier,content,message_type,roll_kind,
    roll_notation,roll_results,roll_total,character_id,character_name,
    action_name,action_source,action_attribute,action_skill,roll_pool,
    roll_explosion_count,master_decision,combat_action_id,target_character_id,
    target_character_name,combat_status
  ) VALUES (
    p_player_id,v_player_name,v_player_identifier,'','roll','combat',
    v_pool::text||'d10',to_jsonb(v_results),v_total,p_character_id,v_character_name,
    'Atacar',v_weapon_name,v_attack_attribute,v_attack_skill,v_pool,
    v_explosions,'pending',v_action_id,p_target_character_id,
    v_target_name,'awaiting_defense'
  );

  UPDATE public.characters SET combat_action_available=false WHERE id=p_character_id;
  RETURN v_action_id;
END;
$$;
REVOKE ALL ON FUNCTION public.roll_character_attack(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_character_attack(uuid,uuid,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 8. DEFESA DO ALVO
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.defend_combat_action(
  p_player_id uuid,
  p_character_id uuid,
  p_combat_action_id uuid,
  p_defense_kind text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_is_master boolean := false;
  v_action public.combat_actions%ROWTYPE;
  v_reaction_available boolean;
  v_attributes jsonb;
  v_racial_bonus jsonb;
  v_skills jsonb;
  v_lineage_bonus jsonb;
  v_defense_skill integer := 0;
  v_agility integer := 0;
  v_block_attribute text := 'Força';
  v_block_attribute_value integer := 0;
  v_pool integer := 0;
  v_results integer[] := ARRAY[]::integer[];
  v_explosions integer := 0;
  v_passive integer := 0;
  v_source text;
  v_armor_absorption integer := 0;
  v_armor_evasion_penalty integer := 0;
  v_shield_bonus integer := 0;
  v_shield_evasion_penalty integer := 0;
  v_shield_item_id uuid;
  v_shield_durability integer;
  v_defense_penalty integer := 0;
BEGIN
  IF p_defense_kind NOT IN ('evasion','block','passive') THEN
    RAISE EXCEPTION 'Defesa inválida.';
  END IF;

  SELECT COALESCE(p.player_identifier='Mestre',false)
  INTO v_is_master FROM public.players p WHERE p.id=p_player_id;

  SELECT * INTO v_action FROM public.combat_actions ca
  WHERE ca.id=p_combat_action_id FOR UPDATE;
  IF NOT FOUND OR v_action.status<>'awaiting_defense' THEN
    RAISE EXCEPTION 'Este ataque não está aguardando defesa.';
  END IF;
  IF v_action.target_character_id<>p_character_id THEN
    RAISE EXCEPTION 'Este ataque não tem o personagem selecionado como alvo.';
  END IF;

  SELECT c.combat_reaction_available,
         COALESCE(c.attributes,'{}'::jsonb),COALESCE(c.racial_attribute_bonus,'{}'::jsonb),
         COALESCE(c.skills,'{}'::jsonb),COALESCE(c.lineage_skill_bonuses,'{}'::jsonb)
  INTO v_reaction_available,v_attributes,v_racial_bonus,v_skills,v_lineage_bonus
  FROM public.characters c
  WHERE c.id=p_character_id AND (c.player_id=p_player_id OR v_is_master);
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado ou sem permissão para defender.'; END IF;

  v_defense_skill := COALESCE((v_skills->>'Defesa')::integer,0)+COALESCE((v_lineage_bonus->>'Defesa')::integer,0);

  SELECT
    COALESCE(eq.armor_effective_absorption,0),COALESCE(eq.armor_evasion_penalty,0),
    COALESCE(eq.shield_effective_bonus,0),COALESCE(eq.shield_evasion_penalty,0),
    eq.shield_block_attribute,eq.shield_item_id,eq.shield_name
  INTO
    v_armor_absorption,v_armor_evasion_penalty,v_shield_bonus,v_shield_evasion_penalty,
    v_block_attribute,v_shield_item_id,v_source
  FROM public.get_character_combat_equipment_summary(p_character_id) eq;

  IF p_defense_kind IN ('evasion','block') AND NOT COALESCE(v_reaction_available,true) THEN
    RAISE EXCEPTION 'A Reação deste personagem já foi utilizada. Use Defesa Passiva.';
  END IF;

  IF p_defense_kind='passive' THEN
    v_source := NULL;
    v_passive := GREATEST(0,floor(v_defense_skill::numeric/2)::integer);
  ELSIF p_defense_kind='evasion' THEN
    v_agility :=
      COALESCE((v_attributes->>'Agilidade')::integer,0)
      + COALESCE((v_racial_bonus->>'Agilidade')::integer,0);
    v_pool := LEAST(100,GREATEST(0,v_agility+v_defense_skill-v_armor_evasion_penalty-v_shield_evasion_penalty));
    SELECT r.results,r.explosions INTO v_results,v_explosions
    FROM public.trilha_roll_d10_exploding(v_pool) r;
    v_source := NULL;
    UPDATE public.characters SET combat_reaction_available=false WHERE id=p_character_id;
  ELSE
    IF v_shield_item_id IS NULL THEN RAISE EXCEPTION 'Equipe um escudo para Bloquear.'; END IF;
    SELECT ci.durability_current INTO v_shield_durability
    FROM public.character_items ci WHERE ci.id=v_shield_item_id;
    IF v_shield_durability=0 THEN RAISE EXCEPTION 'O escudo equipado está quebrado.'; END IF;
    IF v_shield_durability=1 THEN v_defense_penalty:=1; END IF;

    v_block_attribute := COALESCE(v_block_attribute,'Força');
    v_block_attribute_value :=
      COALESCE((v_attributes->>v_block_attribute)::integer,0)
      + COALESCE((v_racial_bonus->>v_block_attribute)::integer,0);
    v_pool := LEAST(100,GREATEST(0,v_block_attribute_value+v_defense_skill+v_shield_bonus));
    SELECT r.results,r.explosions INTO v_results,v_explosions
    FROM public.trilha_roll_d10_exploding(v_pool) r;
    UPDATE public.characters SET combat_reaction_available=false WHERE id=p_character_id;
  END IF;

  UPDATE public.combat_actions
  SET defense_kind=p_defense_kind,
      defense_source=v_source,
      defense_pool=CASE WHEN p_defense_kind='passive' THEN NULL ELSE v_pool END,
      defense_results=CASE WHEN p_defense_kind='passive' THEN NULL ELSE to_jsonb(v_results) END,
      defense_explosion_count=v_explosions,
      defense_passive_successes=CASE WHEN p_defense_kind='passive' THEN v_passive ELSE NULL END,
      defense_difficulty_penalty=v_defense_penalty,
      armor_effective_absorption=v_armor_absorption,
      defender_reaction_spent=(p_defense_kind IN ('evasion','block')),
      status='awaiting_master',
      updated_at=now()
  WHERE id=p_combat_action_id;

  UPDATE public.chat_messages
  SET defense_kind=p_defense_kind,
      defense_source=v_source,
      defense_pool=CASE WHEN p_defense_kind='passive' THEN NULL ELSE v_pool END,
      defense_results=CASE WHEN p_defense_kind='passive' THEN NULL ELSE to_jsonb(v_results) END,
      defense_explosion_count=v_explosions,
      defense_passive_successes=CASE WHEN p_defense_kind='passive' THEN v_passive ELSE NULL END,
      combat_status='awaiting_master'
  WHERE combat_action_id=p_combat_action_id;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.defend_combat_action(uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.defend_combat_action(uuid,uuid,uuid,text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 9. RESOLUÇÃO PELO MESTRE: ELE DEFINE A DIFICULDADE;
--    O RESULTADO E O DANO SÃO CALCULADOS PELO SISTEMA.
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
  IF p_difficulty < 2 OR p_difficulty > 9 THEN
    RAISE EXCEPTION 'A dificuldade deve estar entre 2 e 9.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id=p_player_id AND p.player_identifier='Mestre'
  ) THEN
    RAISE EXCEPTION 'Somente o Mestre pode resolver o Teste Oposto.';
  END IF;

  SELECT * INTO v_action FROM public.combat_actions ca
  WHERE ca.id=p_combat_action_id FOR UPDATE;
  IF NOT FOUND OR v_action.status<>'awaiting_master' THEN
    RAISE EXCEPTION 'Este combate não está aguardando resolução.';
  END IF;

  v_attack_diff := LEAST(10,p_difficulty+COALESCE(v_action.attack_difficulty_penalty,0));
  v_defense_diff := LEAST(10,p_difficulty+COALESCE(v_action.defense_difficulty_penalty,0));

  v_attack_successes := public.trilha_count_successes(v_action.attack_results,v_attack_diff);
  IF v_action.defense_kind='passive' THEN
    v_defense_successes := COALESCE(v_action.defense_passive_successes,0);
  ELSE
    v_defense_successes := public.trilha_count_successes(v_action.defense_results,v_defense_diff);
  END IF;

  -- Ataque precisa ter ao menos 1 sucesso e SUPERAR a defesa. Empate defende.
  v_hit := v_attack_successes>0 AND v_attack_successes>v_defense_successes;
  IF v_hit THEN
    v_excess := GREATEST(0,v_attack_successes-GREATEST(0,v_defense_successes));
    IF COALESCE(v_action.weapon_effective_damage,0) <= 0 THEN
      v_damage := 0;
    ELSE
      v_damage := GREATEST(1,
        COALESCE(v_action.weapon_effective_damage,0)
        + v_excess
        - COALESCE(v_action.armor_effective_absorption,0)
      );
    END IF;

    SELECT COALESCE(c.current_hp,
      15 + (COALESCE((c.attributes->>'Vigor')::integer,0)+COALESCE((c.racial_attribute_bonus->>'Vigor')::integer,0))*5
      + (COALESCE(c.level,1)-1)*2
    ) INTO v_hp_before
    FROM public.characters c WHERE c.id=v_action.target_character_id FOR UPDATE;

    v_hp_after := GREATEST(0,v_hp_before-v_damage);
    UPDATE public.characters SET current_hp=v_hp_after WHERE id=v_action.target_character_id;

    IF v_hp_after=0 AND NOT EXISTS (
      SELECT 1 FROM public.character_conditions cc
      WHERE cc.character_id=v_action.target_character_id AND lower(cc.condition)='inconsciente'
    ) THEN
      INSERT INTO public.character_conditions(character_id,condition,intensity,duration,notes,source)
      VALUES(v_action.target_character_id,'Inconsciente',1,NULL,'PV chegou a 0.','combat');
    END IF;
  ELSE
    SELECT COALESCE(c.current_hp,
      15 + (COALESCE((c.attributes->>'Vigor')::integer,0)+COALESCE((c.racial_attribute_bonus->>'Vigor')::integer,0))*5
      + (COALESCE(c.level,1)-1)*2
    ) INTO v_hp_before
    FROM public.characters c WHERE c.id=v_action.target_character_id;
    v_hp_after := v_hp_before;
  END IF;

  UPDATE public.combat_actions
  SET difficulty=p_difficulty,
      attack_successes=v_attack_successes,
      defense_successes=v_defense_successes,
      excess_successes=v_excess,
      damage_final=v_damage,
      target_hp_before=v_hp_before,
      target_hp_after=v_hp_after,
      status='resolved',resolved_by=p_player_id,resolved_at=now(),updated_at=now()
  WHERE id=p_combat_action_id;

  UPDATE public.chat_messages
  SET combat_difficulty=p_difficulty,
      attack_successes=v_attack_successes,
      defense_successes=v_defense_successes,
      excess_successes=v_excess,
      damage_final=v_damage,
      target_hp_after=v_hp_after,
      combat_status='resolved',
      master_decision=CASE WHEN v_hit THEN 'success' ELSE 'failure' END,
      master_decision_by=p_player_id,
      master_decision_at=now()
  WHERE combat_action_id=p_combat_action_id;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.resolve_combat_action(uuid,uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_combat_action(uuid,uuid,integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.void_combat_action(
  p_player_id uuid,
  p_combat_action_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_action public.combat_actions%ROWTYPE;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id=p_player_id AND p.player_identifier='Mestre'
  ) THEN
    RAISE EXCEPTION 'Somente o Mestre pode anular um combate.';
  END IF;

  SELECT * INTO v_action FROM public.combat_actions ca
  WHERE ca.id=p_combat_action_id FOR UPDATE;
  IF NOT FOUND OR v_action.status NOT IN ('awaiting_defense','awaiting_master') THEN
    RAISE EXCEPTION 'Somente combates ainda não resolvidos podem ser anulados.';
  END IF;

  UPDATE public.characters SET combat_action_available=true
  WHERE id=v_action.attacker_character_id;

  IF v_action.defender_reaction_spent THEN
    UPDATE public.characters SET combat_reaction_available=true
    WHERE id=v_action.target_character_id;
  END IF;

  UPDATE public.combat_actions
  SET status='void',resolved_by=p_player_id,resolved_at=now(),updated_at=now()
  WHERE id=p_combat_action_id;

  UPDATE public.chat_messages
  SET combat_status='void',master_decision='void',master_decision_by=p_player_id,master_decision_at=now()
  WHERE combat_action_id=p_combat_action_id;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.void_combat_action(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.void_combat_action(uuid,uuid) TO anon, authenticated;

-- ------------------------------------------------------------
-- 10. RÁDIO — ESTADO GLOBAL DE AVANÇO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.radio_room_state (
  id text PRIMARY KEY DEFAULT 'main',
  skip_offset_seconds double precision NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.radio_room_state(id) VALUES('main') ON CONFLICT(id) DO NOTHING;

ALTER TABLE public.radio_room_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS radio_room_state_select ON public.radio_room_state;
CREATE POLICY radio_room_state_select ON public.radio_room_state
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.radio_room_state TO anon, authenticated;

ALTER TABLE public.radio_room_state REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='radio_room_state'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.radio_room_state;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.skip_radio_track(
  p_player_id uuid,
  p_skip_seconds double precision
)
RETURNS double precision
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  v_new double precision;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.players p
    WHERE p.id=p_player_id AND p.player_identifier='Mestre'
  ) THEN
    RAISE EXCEPTION 'Somente o Mestre pode pular a música.';
  END IF;
  IF p_skip_seconds IS NULL OR p_skip_seconds<0 OR p_skip_seconds>86400 THEN
    RAISE EXCEPTION 'Avanço de rádio inválido.';
  END IF;

  UPDATE public.radio_room_state
  SET skip_offset_seconds=skip_offset_seconds+p_skip_seconds,
      updated_by=p_player_id,updated_at=now()
  WHERE id='main'
  RETURNING skip_offset_seconds INTO v_new;
  RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.skip_radio_track(uuid,double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.skip_radio_track(uuid,double precision) TO anon, authenticated;

COMMIT;
