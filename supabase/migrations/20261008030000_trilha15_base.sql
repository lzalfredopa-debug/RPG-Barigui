-- ============================================================
-- TRILHA 1.5 — BASE DE REGRAS E PROGRESSÃO
-- Execute APENAS depois da reconstrução segura da TRILHA 1.
-- Esta migration não apaga personagens, inventários, chat ou rádio.
-- ============================================================

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.players') IS NULL OR to_regclass('public.characters') IS NULL THEN
    RAISE EXCEPTION 'TRILHA 1 não encontrada. Rode primeiro a reconstrução segura da base.';
  END IF;
  IF to_regclass('public.item_catalog') IS NULL OR to_regclass('public.chat_messages') IS NULL OR to_regclass('public.radio_room_state') IS NULL THEN
    RAISE EXCEPTION 'A restauração da TRILHA 1 parece incompleta. Não aplique a 1.5 ainda.';
  END IF;
END $$;

-- ------------------------------------------------------------
-- 1) POVO / VERTENTE + HÍBRIDOS
-- ------------------------------------------------------------
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS is_hybrid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS secondary_race text,
  ADD COLUMN IF NOT EXISTS secondary_lineage text;

ALTER TABLE public.characters DROP CONSTRAINT IF EXISTS characters_hybrid_consistency;
ALTER TABLE public.characters ADD CONSTRAINT characters_hybrid_consistency CHECK (
  (is_hybrid = false AND secondary_race IS NULL AND secondary_lineage IS NULL)
  OR
  (is_hybrid = true
    AND NULLIF(trim(race),'') IS NOT NULL
    AND NULLIF(trim(lineage),'') IS NOT NULL
    AND NULLIF(trim(secondary_race),'') IS NOT NULL
    AND NULLIF(trim(secondary_lineage),'') IS NOT NULL
    AND lower(trim(secondary_race)) <> lower(trim(race)))
);

-- Povo e Vertente passam a ser narrativos. Mantemos as colunas antigas
-- somente por compatibilidade com funções legadas, sempre vazias.
UPDATE public.characters
SET racial_attribute_bonus='{}'::jsonb,
    lineage_skill_bonuses='{}'::jsonb;

UPDATE public.races
SET attribute_mode='any', fixed_attribute=NULL;

UPDATE public.races SET name='Fúngicos' WHERE id='povo-fungico';
UPDATE public.races SET name='Feras' WHERE id='povo-fera';

-- ------------------------------------------------------------
-- 2) 60 CAMINHOS INICIAIS — TRILHA 1.5
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trilha_initial_classes_v15 (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  primary_attribute text NOT NULL,
  required_skill text NOT NULL,
  required_attribute_min integer NOT NULL DEFAULT 2 CHECK (required_attribute_min >= 0),
  required_skill_min integer NOT NULL DEFAULT 1 CHECK (required_skill_min >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trilha_initial_classes_v15 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trilha_initial_classes_v15_select ON public.trilha_initial_classes_v15;
CREATE POLICY trilha_initial_classes_v15_select ON public.trilha_initial_classes_v15
  FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.trilha_initial_classes_v15
(id,name,primary_attribute,required_skill,required_attribute_min,required_skill_min,sort_order)
VALUES
('forca-combatente','Combatente','Força','Esgrima',2,1,1),
('forca-brigao','Brigão','Força','Luta',2,1,2),
('forca-atleta','Atleta','Força','Atletismo',2,1,3),
('forca-valentao','Valentão','Força','Intimidação',2,1,4),
('forca-oficial-de-oficio','Oficial de Ofício','Força','Ofícios',2,1,5),
('vigor-protetor','Protetor','Vigor','Defesa',2,1,6),
('vigor-mateiro','Mateiro','Vigor','Sobrevivência',2,1,7),
('vigor-escudeiro','Escudeiro','Vigor','Tática',2,1,8),
('vigor-condutor','Condutor','Vigor','Condução',2,1,9),
('vigor-cozinheiro-de-campo','Cozinheiro de Campo','Vigor','Culinária',2,1,10),
('agilidade-acrobata','Acrobata','Agilidade','Acrobacia',2,1,11),
('agilidade-batedor','Batedor','Agilidade','Exploração',2,1,12),
('agilidade-escaramucador','Escaramuçador','Agilidade','Emboscada',2,1,13),
('agilidade-mensageiro','Mensageiro','Agilidade','Navegação',2,1,14),
('agilidade-cavaleiro-ligeiro','Cavaleiro Ligeiro','Agilidade','Trato Animal',2,1,15),
('destreza-ladino','Ladino','Destreza','Furtividade',2,1,16),
('destreza-espadachim','Espadachim','Destreza','Esgrima',2,1,17),
('destreza-arqueiro','Arqueiro','Destreza','Tiro',2,1,18),
('destreza-trombadinha','Trombadinha','Destreza','Prestidigitação',2,1,19),
('destreza-sabotador','Sabotador','Destreza','Engenharia',2,1,20),
('presenca-porta-voz','Porta-Voz','Presença','Expressão',2,1,21),
('presenca-porta-estandarte','Porta-Estandarte','Presença','Liderança',2,1,22),
('presenca-cortesao','Cortesão','Presença','Etiqueta',2,1,23),
('presenca-orador','Orador','Presença','Persuasão',2,1,24),
('presenca-provocador','Provocador','Presença','Intimidação',2,1,25),
('carisma-emissario','Emissário','Carisma','Persuasão',2,1,26),
('carisma-artista','Artista','Carisma','Expressão',2,1,27),
('carisma-conciliador','Conciliador','Carisma','Mediação',2,1,28),
('carisma-anfitriao','Anfitrião','Carisma','Liderança',2,1,29),
('carisma-confidente','Confidente','Carisma','Intuição',2,1,30),
('manipulacao-charlatao','Charlatão','Manipulação','Enganação',2,1,31),
('manipulacao-intermediario','Intermediário','Manipulação','Submundo',2,1,32),
('manipulacao-intrigante','Intrigante','Manipulação','Política',2,1,33),
('manipulacao-barganhador','Barganhador','Manipulação','Negociação',2,1,34),
('manipulacao-avaliador','Avaliador','Manipulação','Avaliação',2,1,35),
('empatia-conselheiro','Conselheiro','Empatia','Intuição',2,1,36),
('empatia-socorrista','Socorrista','Empatia','Medicina',2,1,37),
('empatia-tratador','Tratador','Empatia','Trato Animal',2,1,38),
('empatia-mediador','Mediador','Empatia','Mediação',2,1,39),
('empatia-costumeiro','Costumeiro','Empatia','Tradições',2,1,40),
('percepcao-investigador','Investigador','Percepção','Investigação',2,1,41),
('percepcao-cacador','Caçador','Percepção','Tiro',2,1,42),
('percepcao-rastreador','Rastreador','Percepção','Sobrevivência',2,1,43),
('percepcao-vigia','Vigia','Percepção','Exploração',2,1,44),
('percepcao-tocaiador','Tocaiador','Percepção','Emboscada',2,1,45),
('raciocinio-planejador','Planejador','Raciocínio','Estratégia',2,1,46),
('raciocinio-tatico','Tático','Raciocínio','Tática',2,1,47),
('raciocinio-projetista','Projetista','Raciocínio','Engenharia',2,1,48),
('raciocinio-guarda-livros','Guarda-Livros','Raciocínio','Finanças',2,1,49),
('raciocinio-perito','Perito','Raciocínio','Avaliação',2,1,50),
('inteligencia-iniciado-arcano','Iniciado Arcano','Inteligência','Arcanismo',2,1,51),
('inteligencia-preparador','Preparador','Inteligência','Alquimia',2,1,52),
('inteligencia-estudioso','Estudioso','Inteligência','História',2,1,53),
('inteligencia-naturalista','Naturalista','Inteligência','Natureza',2,1,54),
('inteligencia-interprete','Intérprete','Inteligência','Linguística',2,1,55),
('sabedoria-novico','Noviço','Sabedoria','Teologia',2,1,56),
('sabedoria-iniciado-do-oculto','Iniciado do Oculto','Sabedoria','Ocultismo',2,1,57),
('sabedoria-curandeiro','Curandeiro','Sabedoria','Medicina',2,1,58),
('sabedoria-andarilho','Andarilho','Sabedoria','Tradições',2,1,59),
('sabedoria-cronista','Cronista','Sabedoria','História',2,1,60)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  primary_attribute=EXCLUDED.primary_attribute,
  required_skill=EXCLUDED.required_skill,
  required_attribute_min=EXCLUDED.required_attribute_min,
  required_skill_min=EXCLUDED.required_skill_min,
  sort_order=EXCLUDED.sort_order,
  updated_at=now();

REVOKE INSERT, UPDATE, DELETE ON public.trilha_initial_classes_v15 FROM anon, authenticated;
GRANT SELECT ON public.trilha_initial_classes_v15 TO anon, authenticated;

-- A seleção da primeira classe valida proprietário/Mestre, nível, ramo e requisitos.
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
  v_highest integer;
  v_primary integer;
  v_skill integer;
  v_is_master boolean;
BEGIN
  SELECT * INTO c FROM public.characters WHERE id=p_character_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não encontrado.'; END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.players
    WHERE id=p_player_id AND player_identifier='Mestre'
  ) INTO v_is_master;

  IF c.player_id<>p_player_id AND NOT v_is_master THEN
    RAISE EXCEPTION 'Personagem não pertence ao jogador.';
  END IF;

  IF c.level < 4 THEN
    RAISE EXCEPTION 'A classe inicial só pode ser definida a partir do nível 4.';
  END IF;

  SELECT * INTO p FROM public.trilha_initial_classes_v15 WHERE id=p_class_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Caminho inicial não encontrado.'; END IF;

  v_highest:=GREATEST(
    COALESCE((c.attributes->>'Força')::integer,0),
    COALESCE((c.attributes->>'Vigor')::integer,0),
    COALESCE((c.attributes->>'Agilidade')::integer,0),
    COALESCE((c.attributes->>'Destreza')::integer,0),
    COALESCE((c.attributes->>'Presença')::integer,0),
    COALESCE((c.attributes->>'Carisma')::integer,0),
    COALESCE((c.attributes->>'Manipulação')::integer,0),
    COALESCE((c.attributes->>'Empatia')::integer,0),
    COALESCE((c.attributes->>'Percepção')::integer,0),
    COALESCE((c.attributes->>'Raciocínio')::integer,0),
    COALESCE((c.attributes->>'Inteligência')::integer,0),
    COALESCE((c.attributes->>'Sabedoria')::integer,0)
  );

  v_primary:=COALESCE((c.attributes->>p.primary_attribute)::integer,0);
  v_skill:=COALESCE((c.skills->>p.required_skill)::integer,0);

  IF v_primary<>v_highest THEN
    RAISE EXCEPTION 'Este caminho não pertence a um dos maiores Atributos do personagem.';
  END IF;
  IF v_primary<p.required_attribute_min OR v_skill<p.required_skill_min THEN
    RAISE EXCEPTION 'O personagem ainda não cumpre os requisitos deste caminho.';
  END IF;

  UPDATE public.characters
  SET class_name=p.name, specialization=NULL
  WHERE id=c.id;
END $$;
REVOKE ALL ON FUNCTION public.set_v15_initial_class(uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_v15_initial_class(uuid,uuid,text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 3) CATÁLOGO: REQUISITOS QUE USAVAM HABILIDADES REMOVIDAS
-- ------------------------------------------------------------
UPDATE public.weapons
SET attack_skill='Trato Animal', requirement_skill='Trato Animal'
WHERE id='lanca-de-cavalaria';

UPDATE public.armors
SET requirement_skill='Defesa'
WHERE requirement_skill='Armaduras';

-- ------------------------------------------------------------
-- 4) FOME/SEDE FIXAS E POVO SEM BÔNUS MECÂNICO
-- ------------------------------------------------------------
UPDATE public.characters
SET current_hunger=LEAST(9,COALESCE(current_hunger,9)),
    current_thirst=LEAST(6,COALESCE(current_thirst,6));

CREATE OR REPLACE FUNCTION public.trilha_sync_survival_caps()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.current_hunger:=LEAST(9,GREATEST(0,COALESCE(NEW.current_hunger,9)));
  NEW.current_thirst:=LEAST(6,GREATEST(0,COALESCE(NEW.current_thirst,6)));
  NEW.hunger_hours_remainder:=GREATEST(0,COALESCE(NEW.hunger_hours_remainder,0));
  NEW.thirst_hours_remainder:=GREATEST(0,COALESCE(NEW.thirst_hours_remainder,0));
  NEW.hunger_minutes_remainder:=GREATEST(0,COALESCE(NEW.hunger_minutes_remainder,0));
  NEW.thirst_minutes_remainder:=GREATEST(0,COALESCE(NEW.thirst_minutes_remainder,0));
  NEW.currency_obolos:=GREATEST(0,COALESCE(NEW.currency_obolos,0));
  NEW.currency_dracmas:=GREATEST(0,COALESCE(NEW.currency_dracmas,0));
  NEW.currency_estaters:=GREATEST(0,COALESCE(NEW.currency_estaters,0));
  -- Compatibilidade: bônus de Povo/Vertente são sempre neutros.
  NEW.racial_attribute_bonus:='{}'::jsonb;
  NEW.lineage_skill_bonuses:='{}'::jsonb;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_trilha_survival_caps ON public.characters;
CREATE TRIGGER trg_trilha_survival_caps
BEFORE INSERT OR UPDATE ON public.characters
FOR EACH ROW EXECUTE FUNCTION public.trilha_sync_survival_caps();

-- Função legada, mantida para compatibilidade com versões antigas da UI.
CREATE OR REPLACE FUNCTION public.advance_table_time(p_master_player_id uuid,p_hours integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; v_hunger integer; v_thirst integer; v_hunger_total integer; v_thirst_total integer; v_count integer:=0;
BEGIN
  IF p_hours IS NULL OR p_hours<=0 THEN RAISE EXCEPTION 'Informe uma passagem de tempo positiva.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre controla a passagem do tempo.'; END IF;
  FOR r IN SELECT * FROM characters WHERE status='vivo' LOOP
    v_hunger_total:=COALESCE(r.hunger_hours_remainder,0)+p_hours;
    v_thirst_total:=COALESCE(r.thirst_hours_remainder,0)+p_hours;
    v_hunger:=GREATEST(0,LEAST(COALESCE(r.current_hunger,9),9)-(v_hunger_total/8));
    v_thirst:=GREATEST(0,LEAST(COALESCE(r.current_thirst,6),6)-(v_thirst_total/6));
    UPDATE characters SET current_hunger=v_hunger,current_thirst=v_thirst,
      hunger_hours_remainder=MOD(v_hunger_total,8),thirst_hours_remainder=MOD(v_thirst_total,6)
    WHERE id=r.id;
    v_count:=v_count+1;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.advance_table_time(uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_table_time(uuid,integer) TO anon, authenticated;

-- Relógio principal da versão final: Fome 9, Sede 6 e PM pelas três Habilidades místicas oficiais.
CREATE OR REPLACE FUNCTION public.master_advance_time(p_master_player_id uuid,p_minutes integer,p_rest_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r record; v_hunger integer; v_thirst integer; v_ht integer; v_tt integer;
  v_vigor integer; v_mental integer; v_mystical integer; v_hpmax integer; v_mpmax integer; v_hp integer; v_mp integer;
  v_before_hunger integer; v_before_thirst integer; v_before_hp integer; v_before_mp integer;
  v_characters jsonb:='[]'::jsonb; v_snapshot jsonb; v_effects_expired integer:=0; v_items_spoiled integer:=0; v_event_id uuid;
BEGIN
  IF p_minutes IS NULL OR p_minutes<=0 THEN RAISE EXCEPTION 'Informe uma passagem de tempo positiva.'; END IF;
  IF p_rest_type IS NOT NULL AND p_rest_type NOT IN ('short','long') THEN RAISE EXCEPTION 'Tipo de descanso inválido.'; END IF;
  IF p_rest_type='short' AND p_minutes<>240 THEN RAISE EXCEPTION 'Descanso curto deve avançar 4 horas.'; END IF;
  IF p_rest_type='long' AND p_minutes<>480 THEN RAISE EXCEPTION 'Descanso longo deve avançar 8 horas.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre controla a passagem do tempo.'; END IF;

  SELECT jsonb_build_object(
    'clock',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1),
    'characters',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'current_hp',current_hp,'current_mp',current_mp,'current_hunger',current_hunger,'current_thirst',current_thirst,'hunger_minutes_remainder',hunger_minutes_remainder,'thirst_minutes_remainder',thirst_minutes_remainder,'hunger_hours_remainder',hunger_hours_remainder,'thirst_hours_remainder',thirst_hours_remainder)),'[]'::jsonb) FROM characters WHERE status='vivo'),
    'effects',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'remaining_minutes',remaining_minutes,'active',active)),'[]'::jsonb) FROM character_effects WHERE active=true),
    'items',(SELECT COALESCE(jsonb_agg(jsonb_build_object('id',id,'freshness_minutes_remaining',freshness_minutes_remaining)),'[]'::jsonb) FROM character_items WHERE freshness_minutes_remaining IS NOT NULL),
    'survival_conditions',(SELECT COALESCE(jsonb_agg(jsonb_build_object('character_id',character_id,'condition',condition,'intensity',intensity,'duration',duration,'notes',notes,'source',source)),'[]'::jsonb) FROM character_conditions WHERE source='survival')
  ) INTO v_snapshot;

  FOR r IN SELECT * FROM characters WHERE status='vivo' FOR UPDATE LOOP
    v_vigor:=COALESCE((r.attributes->>'Vigor')::integer,0);
    v_before_hunger:=LEAST(COALESCE(r.current_hunger,9),9);
    v_before_thirst:=LEAST(COALESCE(r.current_thirst,6),6);
    v_before_hp:=COALESCE(r.current_hp,15+v_vigor*5+(GREATEST(1,r.level)-1)*2);

    v_mental:=GREATEST(
      COALESCE((r.attributes->>'Inteligência')::integer,0),
      COALESCE((r.attributes->>'Raciocínio')::integer,0),
      COALESCE((r.attributes->>'Sabedoria')::integer,0),
      COALESCE((r.attributes->>'Percepção')::integer,0)
    );
    v_mystical:=GREATEST(
      COALESCE((r.skills->>'Arcanismo')::integer,0),
      COALESCE((r.skills->>'Ocultismo')::integer,0),
      COALESCE((r.skills->>'Teologia')::integer,0)
    );
    v_hpmax:=15+v_vigor*5+(GREATEST(1,r.level)-1)*2;
    v_mpmax:=CASE WHEN v_mystical>0 THEN 5+v_mental*2+v_mystical*2+GREATEST(1,r.level) ELSE 0 END;
    v_before_mp:=LEAST(COALESCE(r.current_mp,v_mpmax),v_mpmax);

    v_ht:=COALESCE(r.hunger_minutes_remainder,COALESCE(r.hunger_hours_remainder,0)*60)+p_minutes;
    v_tt:=COALESCE(r.thirst_minutes_remainder,COALESCE(r.thirst_hours_remainder,0)*60)+p_minutes;
    v_hunger:=GREATEST(0,v_before_hunger-(v_ht/480));
    v_thirst:=GREATEST(0,v_before_thirst-(v_tt/360));
    v_hp:=v_before_hp; v_mp:=v_before_mp;
    IF p_rest_type='short' THEN
      v_hp:=LEAST(v_hpmax,v_hp+v_vigor*2);
      v_mp:=LEAST(v_mpmax,v_mp+v_mental*2);
    ELSIF p_rest_type='long' THEN
      v_hp:=v_hpmax; v_mp:=v_mpmax;
    END IF;

    UPDATE characters SET current_hunger=v_hunger,current_thirst=v_thirst,
      hunger_minutes_remainder=MOD(v_ht,480),thirst_minutes_remainder=MOD(v_tt,360),
      hunger_hours_remainder=MOD(v_ht,480)/60,thirst_hours_remainder=MOD(v_tt,360)/60,
      current_hp=v_hp,current_mp=v_mp WHERE id=r.id;

    v_characters:=v_characters||jsonb_build_array(jsonb_build_object(
      'id',r.id,'name',r.name,'hunger_before',v_before_hunger,'hunger_after',v_hunger,
      'thirst_before',v_before_thirst,'thirst_after',v_thirst,'hp_before',v_before_hp,'hp_after',v_hp,
      'mp_before',v_before_mp,'mp_after',v_mp
    ));
  END LOOP;

  UPDATE character_effects SET remaining_minutes=GREATEST(0,remaining_minutes-p_minutes),active=(remaining_minutes-p_minutes)>0
  WHERE active=true AND is_permanent=false AND remaining_minutes IS NOT NULL;
  SELECT count(*) INTO v_effects_expired FROM character_effects WHERE active=false AND is_permanent=false AND remaining_minutes=0
    AND id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'effects') x WHERE COALESCE((x->>'active')::boolean,false)=true);

  UPDATE character_items SET freshness_minutes_remaining=GREATEST(0,
    freshness_minutes_remaining-CEIL(p_minutes/GREATEST(0.1,shelf_life_multiplier))::bigint)
  WHERE freshness_minutes_remaining IS NOT NULL AND freshness_minutes_remaining>0;
  SELECT count(*) INTO v_items_spoiled FROM character_items ci WHERE ci.freshness_minutes_remaining=0
    AND ci.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'items') x WHERE COALESCE((x->>'freshness_minutes_remaining')::bigint,0)>0);

  UPDATE trilha_world_clock SET elapsed_minutes=elapsed_minutes+p_minutes,updated_at=now() WHERE id=1;
  INSERT INTO trilha_time_events(master_player_id,minutes,rest_type,snapshot) VALUES(p_master_player_id,p_minutes,p_rest_type,v_snapshot) RETURNING id INTO v_event_id;
  RETURN jsonb_build_object('event_id',v_event_id,'minutes',p_minutes,'rest_type',p_rest_type,'characters',v_characters,'effects_expired',v_effects_expired,'items_spoiled',v_items_spoiled,'elapsed_minutes',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1));
END $$;
REVOKE ALL ON FUNCTION public.master_advance_time(uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_advance_time(uuid,integer,text) TO anon, authenticated;

-- Consumo por porção, com Fome máxima fixa em 9.
CREATE OR REPLACE FUNCTION public.consume_character_item(p_player_id uuid,p_character_id uuid,p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_catalog item_catalog%ROWTYPE; v_is_master boolean;
        v_kind text; v_portion numeric; v_restore integer; v_hunger integer; v_thirst integer;
        v_legacy_hunger integer; v_legacy_thirst integer;
BEGIN
 SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
 IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
 SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR v_item.quantity<=0 THEN RAISE EXCEPTION 'Consumível indisponível.'; END IF;
 IF v_item.freshness_minutes_remaining IS NOT NULL AND v_item.freshness_minutes_remaining<=0 THEN RAISE EXCEPTION 'Este alimento está estragado. O Mestre decide os efeitos de consumi-lo.'; END IF;
 IF v_item.catalog_item_id IS NOT NULL THEN SELECT * INTO v_catalog FROM item_catalog WHERE id=v_item.catalog_item_id; END IF;
 v_kind:=COALESCE(v_catalog.consumption_kind,v_item.properties->>'consumption_kind');
 v_portion:=COALESCE(v_catalog.portion_amount,NULLIF(v_item.properties->>'portion_amount','')::numeric);
 v_restore:=GREATEST(0,COALESCE(v_catalog.restore_points,NULLIF(v_item.properties->>'restore_points','')::integer,1));
 SELECT LEAST(9,COALESCE(current_hunger,9)),LEAST(6,COALESCE(current_thirst,6))
 INTO v_hunger,v_thirst FROM characters WHERE id=p_character_id FOR UPDATE;
 IF v_kind IN ('food','water') AND v_portion IS NOT NULL THEN
   IF v_item.amount IS NULL OR v_item.amount<v_portion THEN RAISE EXCEPTION 'Não há uma porção completa disponível.'; END IF;
   IF v_kind='food' THEN v_hunger:=LEAST(9,v_hunger+v_restore); ELSE v_thirst:=LEAST(6,v_thirst+v_restore); END IF;
   UPDATE characters SET current_hunger=v_hunger,current_thirst=v_thirst WHERE id=p_character_id;
   IF v_item.amount-v_portion<=0 THEN DELETE FROM character_items WHERE id=p_item_id;
   ELSE UPDATE character_items SET amount=amount-v_portion WHERE id=p_item_id; END IF;
   RETURN;
 END IF;
 v_legacy_hunger:=GREATEST(0,COALESCE((v_item.properties->>'hunger_restore')::integer,0));
 v_legacy_thirst:=GREATEST(0,COALESCE((v_item.properties->>'thirst_restore')::integer,0));
 IF v_legacy_hunger=0 AND v_legacy_thirst=0 THEN RAISE EXCEPTION 'Este item não possui uma porção consumível configurada.'; END IF;
 UPDATE characters SET current_hunger=LEAST(9,v_hunger+v_legacy_hunger),current_thirst=LEAST(6,v_thirst+v_legacy_thirst) WHERE id=p_character_id;
 IF v_item.quantity<=1 THEN DELETE FROM character_items WHERE id=p_item_id; ELSE UPDATE character_items SET quantity=quantity-1 WHERE id=p_item_id; END IF;
END $$;
REVOKE ALL ON FUNCTION public.consume_character_item(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_character_item(uuid,uuid,uuid) TO anon,authenticated;

-- ------------------------------------------------------------
-- 5) MARCADOR DE VERSÃO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trilha_system_meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trilha_system_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS trilha_system_meta_select ON public.trilha_system_meta;
CREATE POLICY trilha_system_meta_select ON public.trilha_system_meta FOR SELECT TO anon,authenticated USING (true);
INSERT INTO public.trilha_system_meta(key,value,updated_at)
VALUES ('rules_version','{"name":"TRILHA 1.5","progression":"v15","attributes":12,"skills":42,"initial_classes":60}'::jsonb,now())
ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now();
GRANT SELECT ON public.trilha_system_meta TO anon,authenticated;

COMMIT;
