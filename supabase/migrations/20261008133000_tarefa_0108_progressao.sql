-- ============================================================
-- TRILHA 1.5 — TAREFA 0108 + NOVA REGRA DE PROGRESSÃO
-- Incremental e idempotente. Não recria nem apaga personagens.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.players') IS NULL
     OR to_regclass('public.characters') IS NULL
     OR to_regclass('public.trilha_initial_classes_v15') IS NULL
     OR to_regclass('public.races') IS NULL
     OR to_regclass('public.lineages') IS NULL
     OR to_regclass('public.radio_room_state') IS NULL THEN
    RAISE EXCEPTION 'Base TRILHA 1.5 incompleta. Não aplique esta migration antes da base 1.5.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1) Compatibilidade com a atualização UX anterior
-- ------------------------------------------------------------
ALTER TABLE public.races
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'Povo narrativo e cultural';

ALTER TABLE public.lineages
  ADD COLUMN IF NOT EXISTS tagline text NOT NULL DEFAULT 'Vertente narrativa e cultural';

UPDATE public.races
SET tagline='Povo narrativo e cultural'
WHERE trim(COALESCE(tagline,''))='';

UPDATE public.lineages
SET tagline='Vertente narrativa e cultural'
WHERE trim(COALESCE(tagline,''))='';

CREATE TABLE IF NOT EXISTS public.player_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_messages_player_created_idx
  ON public.player_messages(player_id,created_at DESC);

ALTER TABLE public.player_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS anon_select_player_messages ON public.player_messages;
CREATE POLICY anon_select_player_messages ON public.player_messages FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS anon_insert_player_messages ON public.player_messages;
CREATE POLICY anon_insert_player_messages ON public.player_messages FOR INSERT TO anon,authenticated WITH CHECK (true);
DROP POLICY IF EXISTS anon_update_player_messages ON public.player_messages;
CREATE POLICY anon_update_player_messages ON public.player_messages FOR UPDATE TO anon,authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS anon_delete_player_messages ON public.player_messages;
CREATE POLICY anon_delete_player_messages ON public.player_messages FOR DELETE TO anon,authenticated USING (true);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.player_messages TO anon,authenticated;
GRANT SELECT,UPDATE ON public.races,public.lineages TO anon,authenticated;

-- ------------------------------------------------------------
-- 2) Pontos recebidos durante o período de Aprendiz
-- Nível 2: +2 Habilidade
-- Nível 3: +1 Atributo e +1 Habilidade
-- ------------------------------------------------------------
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS v15_attribute_points_spent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS v15_skill_points_spent integer NOT NULL DEFAULT 0;

ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_v15_attribute_points_spent_nonnegative;
ALTER TABLE public.characters ADD CONSTRAINT characters_v15_attribute_points_spent_nonnegative
  CHECK (v15_attribute_points_spent >= 0);
ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_v15_skill_points_spent_nonnegative;
ALTER TABLE public.characters ADD CONSTRAINT characters_v15_skill_points_spent_nonnegative
  CHECK (v15_skill_points_spent >= 0);

CREATE OR REPLACE FUNCTION public.spend_v15_attribute_point(
  p_player_id uuid,
  p_character_id uuid,
  p_attribute text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public AS $$
DECLARE
  c public.characters%ROWTYPE;
  v_is_master boolean;
  v_earned integer;
  v_current integer;
BEGIN
  SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado.'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.players WHERE id=p_player_id AND player_identifier='Mestre') INTO v_is_master;
  IF c.player_id<>p_player_id AND NOT v_is_master THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;

  IF NOT (p_attribute = ANY(ARRAY['Força','Vigor','Agilidade','Destreza','Presença','Carisma','Manipulação','Empatia','Percepção','Raciocínio','Inteligência','Sabedoria']::text[])) THEN
    RAISE EXCEPTION 'Atributo inválido.';
  END IF;

  v_earned:=CASE WHEN c.level>=3 THEN 1 ELSE 0 END;
  IF COALESCE(c.v15_attribute_points_spent,0)>=v_earned THEN
    RAISE EXCEPTION 'Nenhum ponto de Atributo de Aprendiz disponível.';
  END IF;

  v_current:=COALESCE((c.attributes->>p_attribute)::integer,1);
  IF v_current>=3 THEN RAISE EXCEPTION 'Durante o período de Aprendiz, este ponto não pode elevar um Atributo acima de 3.'; END IF;

  UPDATE public.characters
  SET attributes=jsonb_set(COALESCE(attributes,'{}'::jsonb),ARRAY[p_attribute],to_jsonb(v_current+1),true),
      v15_attribute_points_spent=COALESCE(v15_attribute_points_spent,0)+1
  WHERE id=p_character_id;
END $$;

REVOKE ALL ON FUNCTION public.spend_v15_attribute_point(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_v15_attribute_point(uuid,uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.spend_v15_skill_point(
  p_player_id uuid,
  p_character_id uuid,
  p_skill text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public AS $$
DECLARE
  c public.characters%ROWTYPE;
  v_is_master boolean;
  v_earned integer;
  v_current integer;
BEGIN
  SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado.'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.players WHERE id=p_player_id AND player_identifier='Mestre') INTO v_is_master;
  IF c.player_id<>p_player_id AND NOT v_is_master THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;

  IF NOT (p_skill = ANY(ARRAY[
    'Atletismo','Acrobacia','Furtividade','Prestidigitação','Luta','Esgrima','Tiro','Defesa','Emboscada','Sobrevivência','Exploração','Navegação','Condução','Trato Animal',
    'Persuasão','Enganação','Intimidação','Negociação','Mediação','Etiqueta','Liderança','Intuição','Expressão','Linguística','Tradições','Submundo','Política','Avaliação',
    'Investigação','História','Natureza','Medicina','Culinária','Ofícios','Engenharia','Alquimia','Finanças','Tática','Estratégia','Arcanismo','Ocultismo','Teologia'
  ]::text[])) THEN
    RAISE EXCEPTION 'Habilidade inválida.';
  END IF;

  v_earned:=CASE WHEN c.level>=3 THEN 3 WHEN c.level>=2 THEN 2 ELSE 0 END;
  IF COALESCE(c.v15_skill_points_spent,0)>=v_earned THEN
    RAISE EXCEPTION 'Nenhum ponto de Habilidade de Aprendiz disponível.';
  END IF;

  v_current:=COALESCE((c.skills->>p_skill)::integer,0);
  IF v_current>=2 THEN RAISE EXCEPTION 'Durante o período de Aprendiz, estes pontos não podem elevar uma Habilidade acima de 2.'; END IF;

  UPDATE public.characters
  SET skills=jsonb_set(COALESCE(skills,'{}'::jsonb),ARRAY[p_skill],to_jsonb(v_current+1),true),
      v15_skill_points_spent=COALESCE(v15_skill_points_spent,0)+1
  WHERE id=p_character_id;
END $$;

REVOKE ALL ON FUNCTION public.spend_v15_skill_point(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spend_v15_skill_point(uuid,uuid,text) TO anon,authenticated;

-- ------------------------------------------------------------
-- 3) Primeira ramificação e requisito das 60 classes
-- Ramificação: Atributo 3
-- Classe: nível 4 + Atributo 3 + Habilidade 2
-- ------------------------------------------------------------
ALTER TABLE public.trilha_initial_classes_v15
  ALTER COLUMN required_attribute_min SET DEFAULT 3,
  ALTER COLUMN required_skill_min SET DEFAULT 2;

UPDATE public.trilha_initial_classes_v15
SET required_attribute_min=3,
    required_skill_min=2,
    updated_at=now();

CREATE OR REPLACE FUNCTION public.set_v15_initial_class(
  p_player_id uuid,
  p_character_id uuid,
  p_class_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public AS $$
DECLARE
  c public.characters%ROWTYPE;
  p public.trilha_initial_classes_v15%ROWTYPE;
  v_primary integer;
  v_skill integer;
  v_is_master boolean;
BEGIN
  SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado.'; END IF;

  SELECT EXISTS(SELECT 1 FROM public.players WHERE id=p_player_id AND player_identifier='Mestre') INTO v_is_master;
  IF c.player_id<>p_player_id AND NOT v_is_master THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;

  IF c.level<4 THEN RAISE EXCEPTION 'A classe inicial só pode ser definida a partir do nível 4.'; END IF;

  SELECT * INTO p FROM public.trilha_initial_classes_v15 WHERE id=p_class_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Caminho inicial não encontrado.'; END IF;

  v_primary:=COALESCE((c.attributes->>p.primary_attribute)::integer,0);
  v_skill:=COALESCE((c.skills->>p.required_skill)::integer,0);

  IF v_primary<3 THEN
    RAISE EXCEPTION 'A ramificação deste Atributo ainda não foi revelada. São necessários 3 pontos.';
  END IF;
  IF v_primary<p.required_attribute_min OR v_skill<p.required_skill_min THEN
    RAISE EXCEPTION 'O personagem ainda não cumpre os requisitos deste caminho: Atributo 3 + Habilidade 2.';
  END IF;

  UPDATE public.characters SET class_name=p.name,specialization=NULL WHERE id=c.id;
END $$;

REVOKE ALL ON FUNCTION public.set_v15_initial_class(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_v15_initial_class(uuid,uuid,text) TO anon,authenticated;

-- ------------------------------------------------------------
-- 4) Rádio TRILHA no Supabase Storage
-- Bucket público: radio-trilha
-- Pasta usada pelo app: musicas/
-- ------------------------------------------------------------
INSERT INTO storage.buckets(id,name,public)
VALUES('radio-trilha','radio-trilha',true)
ON CONFLICT(id) DO UPDATE SET public=true;

DROP POLICY IF EXISTS radio_trilha_select ON storage.objects;
CREATE POLICY radio_trilha_select ON storage.objects
  FOR SELECT TO anon,authenticated
  USING (bucket_id='radio-trilha');

DROP POLICY IF EXISTS radio_trilha_insert ON storage.objects;
CREATE POLICY radio_trilha_insert ON storage.objects
  FOR INSERT TO anon,authenticated
  WITH CHECK (bucket_id='radio-trilha');

DROP POLICY IF EXISTS radio_trilha_update ON storage.objects;
CREATE POLICY radio_trilha_update ON storage.objects
  FOR UPDATE TO anon,authenticated
  USING (bucket_id='radio-trilha')
  WITH CHECK (bucket_id='radio-trilha');

DROP POLICY IF EXISTS radio_trilha_delete ON storage.objects;
CREATE POLICY radio_trilha_delete ON storage.objects
  FOR DELETE TO anon,authenticated
  USING (bucket_id='radio-trilha');

-- ------------------------------------------------------------
-- 5) Marcador de regras
-- ------------------------------------------------------------
INSERT INTO public.trilha_system_meta(key,value,updated_at)
VALUES (
  'rules_version',
  '{"name":"TRILHA 1.5","progression":"v15-aprendiz-0108","attributes":12,"skills":42,"initial_classes":60,"level2":{"skill_points":2},"level3":{"attribute_points":1,"skill_points":1},"branch_attribute":3,"initial_class_level":4,"initial_class_attribute":3,"initial_class_skill":2,"radio_storage":"radio-trilha/musicas"}'::jsonb,
  now()
)
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now();

-- Validação final
DO $$
BEGIN
  IF (SELECT count(*) FROM public.trilha_initial_classes_v15)<>60 THEN
    RAISE EXCEPTION 'Validação falhou: a tabela de classes iniciais não possui 60 caminhos.';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM storage.buckets WHERE id='radio-trilha' AND public=true) THEN
    RAISE EXCEPTION 'Validação falhou: bucket radio-trilha não foi criado.';
  END IF;
END $$;

COMMIT;
