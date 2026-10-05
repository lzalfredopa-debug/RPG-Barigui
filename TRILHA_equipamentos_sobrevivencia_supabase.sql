-- TRILHA — Escudos, Armaduras, Equipamentos de Combate, Fome/Sede e Recursos
-- Execute depois das migrations anteriores (incluindo catálogo de armas).

-- ============================================================
-- 1) CATÁLOGO DE ESCUDOS
-- ============================================================
CREATE TABLE IF NOT EXISTS shields (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  block_attribute text NOT NULL,
  block_bonus integer NOT NULL CHECK (block_bonus >= 0),
  requirement_attribute text,
  requirement_attribute_min integer NOT NULL DEFAULT 0 CHECK (requirement_attribute_min >= 0),
  requirement_skill text,
  requirement_skill_min integer NOT NULL DEFAULT 0 CHECK (requirement_skill_min >= 0),
  evasion_penalty integer NOT NULL DEFAULT 0 CHECK (evasion_penalty >= 0),
  movement_penalty integer NOT NULL DEFAULT 0 CHECK (movement_penalty >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shields ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE shields FROM anon, authenticated;

INSERT INTO shields
(id,name,block_attribute,block_bonus,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,evasion_penalty,movement_penalty,sort_order)
VALUES
('broquel','Broquel','Destreza',1,'Destreza',1,'Defesa',1,0,0,1),
('escudo-leve','Escudo Leve','Força',1,'Força',1,'Defesa',1,0,0,2),
('escudo-medio','Escudo Médio','Força',2,'Força',2,'Defesa',1,0,0,3),
('escudo-grande','Escudo Grande','Força',3,'Força',2,'Defesa',2,1,0,4),
('escudo-torre','Escudo de Torre','Força',4,'Força',3,'Defesa',2,2,1,5)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  block_attribute=EXCLUDED.block_attribute,
  block_bonus=EXCLUDED.block_bonus,
  requirement_attribute=EXCLUDED.requirement_attribute,
  requirement_attribute_min=EXCLUDED.requirement_attribute_min,
  requirement_skill=EXCLUDED.requirement_skill,
  requirement_skill_min=EXCLUDED.requirement_skill_min,
  evasion_penalty=EXCLUDED.evasion_penalty,
  movement_penalty=EXCLUDED.movement_penalty,
  sort_order=EXCLUDED.sort_order,
  updated_at=now();

-- ============================================================
-- 2) CATÁLOGO DE ARMADURAS
-- ============================================================
CREATE TABLE IF NOT EXISTS armors (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('Leve','Média','Pesada')),
  absorption integer NOT NULL CHECK (absorption >= 0),
  requirement_attribute text,
  requirement_attribute_min integer NOT NULL DEFAULT 0 CHECK (requirement_attribute_min >= 0),
  requirement_skill text,
  requirement_skill_min integer NOT NULL DEFAULT 0 CHECK (requirement_skill_min >= 0),
  evasion_penalty integer NOT NULL DEFAULT 0 CHECK (evasion_penalty >= 0),
  movement_penalty integer NOT NULL DEFAULT 0 CHECK (movement_penalty >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE armors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE armors FROM anon, authenticated;

INSERT INTO armors
(id,name,category,absorption,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,evasion_penalty,movement_penalty,sort_order)
VALUES
('gambeson','Gambeson / Armadura Acolchoada','Leve',1,'Vigor',1,NULL,0,0,0,1),
('armadura-couro','Armadura de Couro','Leve',1,'Vigor',1,'Armaduras',1,0,0,2),
('couro-fervido','Couro Fervido / Cuir Bouilli','Leve',2,'Vigor',1,'Armaduras',2,0,0,3),
('cota-malha','Cota de Malha','Média',2,'Vigor',2,'Armaduras',1,1,0,4),
('lamelar','Armadura Lamelar','Média',2,'Vigor',2,'Armaduras',2,1,0,5),
('lorica-segmentata','Lorica Segmentata','Média',3,'Vigor',2,'Armaduras',2,1,0,6),
('do-maru','Dō-maru','Média',3,'Vigor',2,'Armaduras',2,1,0,7),
('cota-placas','Cota de Placas','Pesada',3,'Vigor',3,'Armaduras',1,2,0,8),
('armadura-placas','Armadura de Placas','Pesada',4,'Vigor',3,'Armaduras',2,2,1,9),
('armadura-gotica','Armadura Gótica','Pesada',4,'Vigor',3,'Armaduras',3,2,1,10)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  category=EXCLUDED.category,
  absorption=EXCLUDED.absorption,
  requirement_attribute=EXCLUDED.requirement_attribute,
  requirement_attribute_min=EXCLUDED.requirement_attribute_min,
  requirement_skill=EXCLUDED.requirement_skill,
  requirement_skill_min=EXCLUDED.requirement_skill_min,
  evasion_penalty=EXCLUDED.evasion_penalty,
  movement_penalty=EXCLUDED.movement_penalty,
  sort_order=EXCLUDED.sort_order,
  updated_at=now();

-- Catálogos públicos contêm somente identidade; especificações ficam reservadas ao Mestre/RPCs calculadas.
CREATE OR REPLACE VIEW armor_catalog_public AS
SELECT id,name,category FROM armors ORDER BY sort_order,name;
CREATE OR REPLACE VIEW shield_catalog_public AS
SELECT id,name FROM shields ORDER BY sort_order,name;
GRANT SELECT ON armor_catalog_public, shield_catalog_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_master_armor_catalog(p_player_id uuid)
RETURNS SETOF armors
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT a.* FROM armors a
  WHERE EXISTS (SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre')
  ORDER BY a.sort_order,a.name;
$$;
REVOKE ALL ON FUNCTION get_master_armor_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_master_armor_catalog(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION get_master_shield_catalog(p_player_id uuid)
RETURNS SETOF shields
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT s.* FROM shields s
  WHERE EXISTS (SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre')
  ORDER BY s.sort_order,s.name;
$$;
REVOKE ALL ON FUNCTION get_master_shield_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_master_shield_catalog(uuid) TO anon, authenticated;

-- ============================================================
-- 3) INVENTÁRIO / EQUIPAMENTO
-- ============================================================
ALTER TABLE IF EXISTS character_items
  ADD COLUMN IF NOT EXISTS properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS armor_id text REFERENCES armors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shield_id text REFERENCES shields(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equip_slot text;

CREATE INDEX IF NOT EXISTS character_items_armor_id_idx ON character_items(armor_id);
CREATE INDEX IF NOT EXISTS character_items_shield_id_idx ON character_items(shield_id);
CREATE INDEX IF NOT EXISTS character_items_equip_slot_idx ON character_items(character_id,equip_slot);

-- Preserva itens antigos já marcados como equipados quando for possível inferir o slot.
UPDATE character_items SET equip_slot='weapon'
WHERE equipped=true AND weapon_id IS NOT NULL AND equip_slot IS NULL;
UPDATE character_items SET equip_slot='armor'
WHERE equipped=true AND armor_id IS NOT NULL AND equip_slot IS NULL;
UPDATE character_items SET equip_slot='shield'
WHERE equipped=true AND shield_id IS NOT NULL AND equip_slot IS NULL;

-- Apenas leitura direta. Toda alteração de item passa por funções controladas abaixo.
GRANT SELECT ON character_items TO anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON character_items FROM anon, authenticated;

CREATE OR REPLACE FUNCTION master_add_character_item(
  p_master_player_id uuid,
  p_character_id uuid,
  p_name text DEFAULT NULL,
  p_type text DEFAULT 'comum',
  p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,
  p_weapon_id text DEFAULT NULL,
  p_armor_id text DEFAULT NULL,
  p_shield_id text DEFAULT NULL,
  p_hunger_restore integer DEFAULT 0,
  p_thirst_restore integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_name text; v_type text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.';
  END IF;
  IF p_weapon_id IS NOT NULL THEN SELECT name INTO v_name FROM weapons WHERE id=p_weapon_id; v_type:='arma';
  ELSIF p_armor_id IS NOT NULL THEN SELECT name INTO v_name FROM armors WHERE id=p_armor_id; v_type:='armadura';
  ELSIF p_shield_id IS NOT NULL THEN SELECT name INTO v_name FROM shields WHERE id=p_shield_id; v_type:='escudo';
  ELSE v_name:=NULLIF(trim(p_name),''); v_type:=COALESCE(NULLIF(trim(p_type),''),'comum'); END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Item inválido.'; END IF;
  INSERT INTO character_items(character_id,name,type,quantity,equipped,description,weapon_id,armor_id,shield_id,equip_slot,properties)
  VALUES(p_character_id,v_name,v_type,GREATEST(1,COALESCE(p_quantity,1)),false,p_description,p_weapon_id,p_armor_id,p_shield_id,NULL,jsonb_build_object('hunger_restore',GREATEST(0,COALESCE(p_hunger_restore,0)),'thirst_restore',GREATEST(0,COALESCE(p_thirst_restore,0))))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION master_update_character_item(
  p_master_player_id uuid,
  p_item_id uuid,
  p_name text,
  p_type text,
  p_quantity integer,
  p_description text,
  p_hunger_restore integer DEFAULT 0,
  p_thirst_restore integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar itens.'; END IF;
  UPDATE character_items SET
    name=COALESCE(NULLIF(trim(p_name),''),name),
    type=COALESCE(NULLIF(trim(p_type),''),type),
    quantity=GREATEST(0,COALESCE(p_quantity,quantity)),
    description=p_description,
    properties=COALESCE(properties,'{}'::jsonb)||jsonb_build_object('hunger_restore',GREATEST(0,COALESCE(p_hunger_restore,0)),'thirst_restore',GREATEST(0,COALESCE(p_thirst_restore,0)))
  WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION master_update_character_item(uuid,uuid,text,text,integer,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_update_character_item(uuid,uuid,text,text,integer,text,integer,integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION master_delete_character_item(p_master_player_id uuid,p_item_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode remover itens.'; END IF;
  DELETE FROM character_items WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION master_delete_character_item(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_delete_character_item(uuid,uuid) TO anon, authenticated;

-- Jogadores só podem equipar/desequipar itens que já pertencem ao próprio personagem.
-- Slots: weapon, armor, shield, hand1, hand2. NULL = desequipado.
CREATE OR REPLACE FUNCTION set_character_item_slot(
  p_player_id uuid,
  p_character_id uuid,
  p_item_id uuid,
  p_slot text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN
    RAISE EXCEPTION 'Personagem não pertence ao jogador.';
  END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
  IF p_slot IS NOT NULL AND p_slot NOT IN ('weapon','armor','shield','hand1','hand2') THEN RAISE EXCEPTION 'Slot inválido.'; END IF;
  IF p_slot='weapon' AND v_item.weapon_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma arma do catálogo.'; END IF;
  IF p_slot='armor' AND v_item.armor_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma armadura do catálogo.'; END IF;
  IF p_slot='shield' AND v_item.shield_id IS NULL THEN RAISE EXCEPTION 'Este item não é um escudo do catálogo.'; END IF;
  IF p_slot IS NOT NULL THEN
    UPDATE character_items SET equip_slot=NULL,equipped=false WHERE character_id=p_character_id AND equip_slot=p_slot AND id<>p_item_id;
  END IF;
  UPDATE character_items SET equip_slot=p_slot,equipped=(p_slot IS NOT NULL) WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) TO anon, authenticated;

-- Consumíveis podem recuperar Fome/Sede, mas não podem ser criados pelo jogador.
CREATE OR REPLACE FUNCTION consume_character_item(p_player_id uuid,p_character_id uuid,p_item_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_hunger_restore integer; v_thirst_restore integer; v_hunger_max integer; v_is_master boolean; v_new_hunger integer; v_new_thirst integer;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id FOR UPDATE;
  IF NOT FOUND OR v_item.quantity<=0 THEN RAISE EXCEPTION 'Consumível indisponível.'; END IF;
  v_hunger_restore:=GREATEST(0,COALESCE((v_item.properties->>'hunger_restore')::integer,0));
  v_thirst_restore:=GREATEST(0,COALESCE((v_item.properties->>'thirst_restore')::integer,0));
  IF v_hunger_restore=0 AND v_thirst_restore=0 THEN RAISE EXCEPTION 'Este item não recupera Fome ou Sede.'; END IF;
  SELECT GREATEST(1,9-(COALESCE((attributes->>'Vigor')::integer,0)+COALESCE((racial_attribute_bonus->>'Vigor')::integer,0))),COALESCE(current_hunger,0),COALESCE(current_thirst,0)
    INTO v_hunger_max,v_new_hunger,v_new_thirst FROM characters WHERE id=p_character_id FOR UPDATE;
  v_new_hunger:=LEAST(v_hunger_max,v_new_hunger+v_hunger_restore);
  v_new_thirst:=LEAST(6,v_new_thirst+v_thirst_restore);
  UPDATE characters SET current_hunger=v_new_hunger,current_thirst=v_new_thirst WHERE id=p_character_id;
  IF v_item.quantity<=1 THEN DELETE FROM character_items WHERE id=p_item_id; ELSE UPDATE character_items SET quantity=quantity-1 WHERE id=p_item_id; END IF;
  IF v_new_hunger>0 AND v_new_thirst>0 THEN DELETE FROM character_conditions WHERE character_id=p_character_id AND lower(condition)=lower('Desmaiado') AND notes='Fome ou sede chegou a 0.'; END IF;
END $$;
REVOKE ALL ON FUNCTION consume_character_item(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_character_item(uuid,uuid,uuid) TO anon, authenticated;

-- ============================================================
-- 4) FOME, SEDE E MOEDAS
-- ============================================================
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS current_hunger integer,
  ADD COLUMN IF NOT EXISTS current_thirst integer,
  ADD COLUMN IF NOT EXISTS hunger_hours_remainder integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thirst_hours_remainder integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_obolos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_dracmas integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency_estaters integer NOT NULL DEFAULT 0;

-- Fome máxima = 9 − Vigor efetivo (mínimo 1). Sede máxima = 6.
UPDATE characters c SET
  current_hunger = COALESCE(c.current_hunger, GREATEST(1,9-(COALESCE((c.attributes->>'Vigor')::integer,0)+COALESCE((c.racial_attribute_bonus->>'Vigor')::integer,0)))),
  current_thirst = COALESCE(c.current_thirst,6);

CREATE OR REPLACE FUNCTION trilha_sync_survival_caps()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_hunger_max integer;
BEGIN
  v_hunger_max:=GREATEST(1,9-(COALESCE((NEW.attributes->>'Vigor')::integer,0)+COALESCE((NEW.racial_attribute_bonus->>'Vigor')::integer,0)));
  NEW.current_hunger:=LEAST(COALESCE(NEW.current_hunger,v_hunger_max),v_hunger_max);
  NEW.current_thirst:=LEAST(COALESCE(NEW.current_thirst,6),6);
  NEW.hunger_hours_remainder:=GREATEST(0,COALESCE(NEW.hunger_hours_remainder,0));
  NEW.thirst_hours_remainder:=GREATEST(0,COALESCE(NEW.thirst_hours_remainder,0));
  NEW.currency_obolos:=GREATEST(0,COALESCE(NEW.currency_obolos,0));
  NEW.currency_dracmas:=GREATEST(0,COALESCE(NEW.currency_dracmas,0));
  NEW.currency_estaters:=GREATEST(0,COALESCE(NEW.currency_estaters,0));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_trilha_survival_caps ON characters;
CREATE TRIGGER trg_trilha_survival_caps BEFORE INSERT OR UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION trilha_sync_survival_caps();

-- Descanso curto = 4h; descanso longo = 8h.
-- A função aceita qualquer quantidade positiva de horas para futuras expansões.
-- Fome: -1 a cada 8h. Sede: -1 a cada 6h. Sobras são preservadas.
CREATE OR REPLACE FUNCTION advance_table_time(p_master_player_id uuid,p_hours integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record; v_hunger_max integer; v_hunger integer; v_thirst integer; v_hunger_total integer; v_thirst_total integer; v_count integer:=0;
BEGIN
  IF p_hours IS NULL OR p_hours<=0 THEN RAISE EXCEPTION 'Informe uma passagem de tempo positiva.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre controla a passagem do tempo.'; END IF;

  FOR r IN SELECT * FROM characters WHERE status='vivo' LOOP
    v_hunger_max:=GREATEST(1,9-(COALESCE((r.attributes->>'Vigor')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Vigor')::integer,0)));
    v_hunger_total:=COALESCE(r.hunger_hours_remainder,0)+p_hours;
    v_thirst_total:=COALESCE(r.thirst_hours_remainder,0)+p_hours;
    v_hunger:=GREATEST(0,LEAST(COALESCE(r.current_hunger,v_hunger_max),v_hunger_max)-(v_hunger_total/8));
    v_thirst:=GREATEST(0,LEAST(COALESCE(r.current_thirst,6),6)-(v_thirst_total/6));

    UPDATE characters SET
      current_hunger=v_hunger,
      current_thirst=v_thirst,
      hunger_hours_remainder=MOD(v_hunger_total,8),
      thirst_hours_remainder=MOD(v_thirst_total,6)
    WHERE id=r.id;

    IF (v_hunger=0 OR v_thirst=0) AND NOT EXISTS(
      SELECT 1 FROM character_conditions cc WHERE cc.character_id=r.id AND lower(cc.condition)=lower('Desmaiado')
    ) THEN
      INSERT INTO character_conditions(character_id,condition,intensity,duration,notes)
      VALUES(r.id,'Desmaiado',NULL,'Até ser recuperado','Fome ou sede chegou a 0.');
    END IF;
    v_count:=v_count+1;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION advance_table_time(uuid,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION advance_table_time(uuid,integer) TO anon, authenticated;

-- ============================================================
-- 5) RESUMO SEGURO DE EQUIPAMENTOS PARA A FICHA DO JOGADOR
-- ============================================================
CREATE OR REPLACE FUNCTION get_character_combat_equipment_summary(p_character_id uuid)
RETURNS TABLE (
  weapon_item_id uuid, weapon_name text, weapon_effective_damage integer, weapon_is_proficient boolean,
  armor_item_id uuid, armor_name text, armor_effective_absorption integer, armor_is_proficient boolean, armor_evasion_penalty integer, armor_movement_penalty integer,
  shield_item_id uuid, shield_name text, shield_effective_bonus integer, shield_is_proficient boolean, shield_block_attribute text, shield_evasion_penalty integer, shield_movement_penalty integer,
  hand1_item_id uuid, hand1_name text, hand2_item_id uuid, hand2_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
WITH c AS (SELECT * FROM characters WHERE id=p_character_id),
witem AS (SELECT ci.id AS item_id,w.* FROM character_items ci JOIN weapons w ON w.id=ci.weapon_id WHERE ci.character_id=p_character_id AND ci.equip_slot='weapon' LIMIT 1),
aitem AS (SELECT ci.id AS item_id,a.* FROM character_items ci JOIN armors a ON a.id=ci.armor_id WHERE ci.character_id=p_character_id AND ci.equip_slot='armor' LIMIT 1),
sitem AS (SELECT ci.id AS item_id,s.* FROM character_items ci JOIN shields s ON s.id=ci.shield_id WHERE ci.character_id=p_character_id AND ci.equip_slot='shield' LIMIT 1),
h1 AS (SELECT id,name FROM character_items WHERE character_id=p_character_id AND equip_slot='hand1' LIMIT 1),
h2 AS (SELECT id,name FROM character_items WHERE character_id=p_character_id AND equip_slot='hand2' LIMIT 1),
calc AS (
 SELECT
  (SELECT item_id FROM witem) AS weapon_item_id,
  (SELECT name FROM witem) AS weapon_name,
  CASE WHEN (SELECT damage_base FROM witem) IS NULL THEN NULL
       WHEN (SELECT damage_base FROM witem)=0 THEN 0
       ELSE GREATEST(1,(SELECT damage_base FROM witem)-(
         GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM witem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM witem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM witem))::integer,0))+
         GREATEST(0,COALESCE((SELECT requirement_skill_min FROM witem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM witem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM witem))::integer,0))
       )) END AS weapon_effective_damage,
  CASE WHEN (SELECT item_id FROM witem) IS NULL THEN NULL ELSE (
    GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM witem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM witem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM witem))::integer,0))+
    GREATEST(0,COALESCE((SELECT requirement_skill_min FROM witem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM witem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM witem))::integer,0))
  )=0 END AS weapon_is_proficient,

  (SELECT item_id FROM aitem) AS armor_item_id,
  (SELECT name FROM aitem) AS armor_name,
  CASE WHEN (SELECT item_id FROM aitem) IS NULL THEN 0 ELSE GREATEST(0,(SELECT absorption FROM aitem)-(
    GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM aitem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM aitem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM aitem))::integer,0))+
    GREATEST(0,COALESCE((SELECT requirement_skill_min FROM aitem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM aitem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM aitem))::integer,0))
  )) END AS armor_effective_absorption,
  CASE WHEN (SELECT item_id FROM aitem) IS NULL THEN NULL ELSE (
    GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM aitem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM aitem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM aitem))::integer,0))+
    GREATEST(0,COALESCE((SELECT requirement_skill_min FROM aitem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM aitem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM aitem))::integer,0))
  )=0 END AS armor_is_proficient,
  COALESCE((SELECT evasion_penalty FROM aitem),0) AS armor_evasion_penalty,
  COALESCE((SELECT movement_penalty FROM aitem),0) AS armor_movement_penalty,

  (SELECT item_id FROM sitem) AS shield_item_id,
  (SELECT name FROM sitem) AS shield_name,
  CASE WHEN (SELECT item_id FROM sitem) IS NULL THEN 0 ELSE GREATEST(0,(SELECT block_bonus FROM sitem)-(
    GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM sitem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM sitem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM sitem))::integer,0))+
    GREATEST(0,COALESCE((SELECT requirement_skill_min FROM sitem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM sitem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM sitem))::integer,0))
  )) END AS shield_effective_bonus,
  CASE WHEN (SELECT item_id FROM sitem) IS NULL THEN NULL ELSE (
    GREATEST(0,COALESCE((SELECT requirement_attribute_min FROM sitem),0)-COALESCE((c.attributes->>(SELECT requirement_attribute FROM sitem))::integer,0)-COALESCE((c.racial_attribute_bonus->>(SELECT requirement_attribute FROM sitem))::integer,0))+
    GREATEST(0,COALESCE((SELECT requirement_skill_min FROM sitem),0)-COALESCE((c.skills->>(SELECT requirement_skill FROM sitem))::integer,0)-COALESCE((c.lineage_skill_bonuses->>(SELECT requirement_skill FROM sitem))::integer,0))
  )=0 END AS shield_is_proficient,
  COALESCE((SELECT block_attribute FROM sitem),'Força') AS shield_block_attribute,
  COALESCE((SELECT evasion_penalty FROM sitem),0) AS shield_evasion_penalty,
  COALESCE((SELECT movement_penalty FROM sitem),0) AS shield_movement_penalty,
  (SELECT id FROM h1) AS hand1_item_id,(SELECT name FROM h1) AS hand1_name,
  (SELECT id FROM h2) AS hand2_item_id,(SELECT name FROM h2) AS hand2_name
 FROM c
)
SELECT * FROM calc;
$$;
REVOKE ALL ON FUNCTION get_character_combat_equipment_summary(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_character_combat_equipment_summary(uuid) TO anon, authenticated;
