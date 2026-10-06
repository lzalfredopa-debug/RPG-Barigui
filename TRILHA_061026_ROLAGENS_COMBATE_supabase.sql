-- TRILHA — Rolagens automáticas de ações de combate
-- 06/10/2026
-- Ataque automático pela arma equipada, d10 explosivo, registro no Chat da Mesa
-- e decisão final do Mestre (Sucesso / Fracasso / Anular).

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS roll_kind text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS character_id uuid REFERENCES public.characters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS character_name text,
  ADD COLUMN IF NOT EXISTS action_name text,
  ADD COLUMN IF NOT EXISTS action_source text,
  ADD COLUMN IF NOT EXISTS action_attribute text,
  ADD COLUMN IF NOT EXISTS action_skill text,
  ADD COLUMN IF NOT EXISTS roll_pool integer,
  ADD COLUMN IF NOT EXISTS roll_explosion_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS master_decision text,
  ADD COLUMN IF NOT EXISTS master_decision_by uuid REFERENCES public.players(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS master_decision_at timestamptz;

CREATE INDEX IF NOT EXISTS chat_messages_roll_kind_idx
  ON public.chat_messages(roll_kind, created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_character_id_idx
  ON public.chat_messages(character_id, created_at DESC);

-- O próprio banco monta a parada e sorteia os dados. Isso evita que o botão
-- de ataque dependa de valores enviados pelo navegador.
CREATE OR REPLACE FUNCTION public.roll_character_attack(
  p_player_id uuid,
  p_character_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_master boolean := false;
  v_player_name text;
  v_player_identifier text;
  v_character_name text;
  v_character_status text;
  v_current_hp integer;
  v_attributes jsonb;
  v_racial_bonus jsonb;
  v_skills jsonb;
  v_lineage_bonus jsonb;
  v_weapon_item_id uuid;
  v_weapon_name text;
  v_attack_attribute text;
  v_attack_skill text;
  v_durability integer;
  v_pool integer;
  v_results integer[] := ARRAY[]::integer[];
  v_roll integer;
  v_i integer;
  v_explosions integer := 0;
  v_total integer := 0;
  v_message_id uuid;
BEGIN
  SELECT
    COALESCE(NULLIF(btrim(p.player_name), ''), p.alcunha),
    p.player_identifier,
    (p.player_identifier = 'Mestre')
  INTO v_player_name, v_player_identifier, v_is_master
  FROM public.players p
  WHERE p.id = p_player_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Jogador não encontrado.';
  END IF;

  SELECT
    c.name,
    c.status,
    c.current_hp,
    COALESCE(c.attributes, '{}'::jsonb),
    COALESCE(c.racial_attribute_bonus, '{}'::jsonb),
    COALESCE(c.skills, '{}'::jsonb),
    COALESCE(c.lineage_skill_bonuses, '{}'::jsonb)
  INTO
    v_character_name,
    v_character_status,
    v_current_hp,
    v_attributes,
    v_racial_bonus,
    v_skills,
    v_lineage_bonus
  FROM public.characters c
  WHERE c.id = p_character_id
    AND (c.player_id = p_player_id OR v_is_master);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Personagem não encontrado ou sem permissão para esta ação.';
  END IF;

  IF COALESCE(v_character_status, 'vivo') <> 'vivo' THEN
    RAISE EXCEPTION 'Este personagem não pode atacar no estado atual.';
  END IF;

  IF v_current_hp IS NOT NULL AND v_current_hp <= 0 THEN
    RAISE EXCEPTION 'O personagem está inconsciente e não pode atacar.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.character_conditions cc
    WHERE cc.character_id = p_character_id
      AND lower(cc.condition) IN ('desmaiado', 'inconsciente')
  ) THEN
    RAISE EXCEPTION 'O personagem está incapacitado e não pode atacar.';
  END IF;

  SELECT
    ci.id,
    ci.durability_current,
    w.name,
    w.attack_attribute,
    w.attack_skill
  INTO
    v_weapon_item_id,
    v_durability,
    v_weapon_name,
    v_attack_attribute,
    v_attack_skill
  FROM public.character_items ci
  JOIN public.weapons w ON w.id = ci.weapon_id
  WHERE ci.character_id = p_character_id
    AND ci.equip_slot = 'weapon'
    AND ci.weapon_id IS NOT NULL
  ORDER BY ci.created_at
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Equipe uma arma antes de atacar.';
  END IF;

  IF v_durability = 0 THEN
    RAISE EXCEPTION 'A arma equipada está quebrada.';
  END IF;

  v_pool :=
      COALESCE((v_attributes ->> v_attack_attribute)::integer, 0)
    + COALESCE((v_racial_bonus ->> v_attack_attribute)::integer, 0)
    + COALESCE((v_skills ->> v_attack_skill)::integer, 0)
    + COALESCE((v_lineage_bonus ->> v_attack_skill)::integer, 0);

  -- Segurança para dados antigos/incompletos. A parada normal continua sendo
  -- exatamente Atributo + Habilidade, incluindo bônus de povo/linhagem.
  v_pool := LEAST(100, GREATEST(1, COALESCE(v_pool, 1)));

  FOR v_i IN 1..v_pool LOOP
    v_roll := floor(random() * 10)::integer + 1;
    v_results := array_append(v_results, v_roll);
  END LOOP;

  -- Cada 10 gera +1d10. O dado novo também pode gerar outro 10.
  v_i := 1;
  WHILE v_i <= COALESCE(array_length(v_results, 1), 0) LOOP
    IF v_results[v_i] = 10 AND COALESCE(array_length(v_results, 1), 0) < 200 THEN
      v_roll := floor(random() * 10)::integer + 1;
      v_results := array_append(v_results, v_roll);
      v_explosions := v_explosions + 1;
    END IF;
    v_i := v_i + 1;
  END LOOP;

  SELECT COALESCE(sum(r.x), 0) INTO v_total FROM unnest(v_results) AS r(x);

  INSERT INTO public.chat_messages (
    player_id,
    player_name,
    player_identifier,
    content,
    message_type,
    roll_kind,
    roll_notation,
    roll_results,
    roll_total,
    character_id,
    character_name,
    action_name,
    action_source,
    action_attribute,
    action_skill,
    roll_pool,
    roll_explosion_count,
    master_decision
  ) VALUES (
    p_player_id,
    v_player_name,
    v_player_identifier,
    '',
    'roll',
    'action',
    v_pool::text || 'd10',
    to_jsonb(v_results),
    v_total,
    p_character_id,
    v_character_name,
    'Atacar',
    v_weapon_name,
    v_attack_attribute,
    v_attack_skill,
    v_pool,
    v_explosions,
    'pending'
  )
  RETURNING id INTO v_message_id;

  RETURN v_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.roll_character_attack(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.roll_character_attack(uuid, uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.decide_action_roll(
  p_player_id uuid,
  p_message_id uuid,
  p_decision text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  IF p_decision NOT IN ('success', 'failure', 'void') THEN
    RAISE EXCEPTION 'Decisão inválida.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.players p
    WHERE p.id = p_player_id
      AND p.player_identifier = 'Mestre'
  ) THEN
    RAISE EXCEPTION 'Somente o Mestre pode definir o resultado da ação.';
  END IF;

  UPDATE public.chat_messages
  SET
    master_decision = p_decision,
    master_decision_by = p_player_id,
    master_decision_at = now()
  WHERE id = p_message_id
    AND message_type = 'roll'
    AND roll_kind = 'action';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.decide_action_roll(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_action_roll(uuid, uuid, text) TO anon, authenticated;
