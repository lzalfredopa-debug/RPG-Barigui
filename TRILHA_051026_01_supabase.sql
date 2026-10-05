-- TRILHA — Atualização 051026.01
-- Tarefas 1–5: catálogo unificado, inventário organizado, peso/carga,
-- consumo por porções e suporte ao novo Modo Mestre.

-- ============================================================
-- 1) CATÁLOGO: peso, porções e compartimentos
-- ============================================================
ALTER TABLE item_catalog
  ADD COLUMN IF NOT EXISTS weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS consumption_kind text CHECK (consumption_kind IS NULL OR consumption_kind IN ('food','water')),
  ADD COLUMN IF NOT EXISTS portion_amount numeric CHECK (portion_amount IS NULL OR portion_amount > 0),
  ADD COLUMN IF NOT EXISTS restore_points integer NOT NULL DEFAULT 1 CHECK (restore_points >= 0),
  ADD COLUMN IF NOT EXISTS carry_slot_kind text CHECK (carry_slot_kind IS NULL OR carry_slot_kind IN ('main','auxiliary')),
  ADD COLUMN IF NOT EXISTS carry_bonus_kg numeric NOT NULL DEFAULT 0 CHECK (carry_bonus_kg >= 0),
  ADD COLUMN IF NOT EXISTS body_weightless boolean NOT NULL DEFAULT false;

ALTER TABLE item_catalog ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE weapons ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE armors ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE shields ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Todo alimento usa a mesma porção mecânica: 400 g = +1 Fome.
UPDATE item_catalog
SET consumption_kind='food', portion_amount=400, restore_points=1
WHERE category IN ('Alimentos secos e duráveis','Carnes e pescados conservados','Laticínios','Alimentos frescos')
  AND unit='g';

-- Itens de transporte corporal: o recipiente em si não pesa; o conteúdo continua pesando.
UPDATE item_catalog SET body_weightless=true, weight_kg=0, carry_slot_kind='main', carry_bonus_kg=10 WHERE id='mochila';
UPDATE item_catalog SET body_weightless=true, weight_kg=0, carry_slot_kind='main', carry_bonus_kg=5 WHERE id='bolsa';
UPDATE item_catalog SET body_weightless=true, weight_kg=0, carry_slot_kind='main', carry_bonus_kg=0 WHERE id IN ('odre-grande');
UPDATE item_catalog SET body_weightless=true, weight_kg=0, carry_slot_kind='auxiliary', carry_bonus_kg=0 WHERE id IN ('odre','cantil','cantil-grande');

-- Nova subclasse de Itens comuns + itens de transporte citados na atualização.
INSERT INTO item_catalog
(id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes,weight_kg,consumption_kind,portion_amount,restore_points,carry_slot_kind,carry_bonus_kg,body_weightless)
VALUES
('pochete','Pochete','Itens variados',23,1,false,false,true,true,'un',1,NULL,NULL,3,true,'Compartimento auxiliar preso ao corpo.',0,NULL,NULL,1,'auxiliary',2,true),
('aljava','Aljava','Itens variados',23,2,false,false,true,true,'un',1,NULL,NULL,3,true,'Compartimento auxiliar para flechas, virotes e projéteis.',0,NULL,NULL,1,'auxiliary',2,true),
('agua','Água','Água e recipientes',6,11,true,false,false,false,'ml',1000,NULL,NULL,NULL,false,'1 porção = 250 ml e recupera 1 ponto de Sede.',1,'water',250,1,NULL,0,false)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, category_order=EXCLUDED.category_order,
  sort_order=EXCLUDED.sort_order, is_consumable=EXCLUDED.is_consumable,
  is_perishable=EXCLUDED.is_perishable, is_container=EXCLUDED.is_container,
  is_durable=EXCLUDED.is_durable, unit=EXCLUDED.unit, default_amount=EXCLUDED.default_amount,
  capacity_ml=EXCLUDED.capacity_ml, shelf_life_minutes=EXCLUDED.shelf_life_minutes,
  durability_max=EXCLUDED.durability_max, repairable=EXCLUDED.repairable,
  notes=EXCLUDED.notes, weight_kg=EXCLUDED.weight_kg,
  consumption_kind=EXCLUDED.consumption_kind, portion_amount=EXCLUDED.portion_amount,
  restore_points=EXCLUDED.restore_points, carry_slot_kind=EXCLUDED.carry_slot_kind,
  carry_bonus_kg=EXCLUDED.carry_bonus_kg, body_weightless=EXCLUDED.body_weightless, is_active=true,
  updated_at=now();

-- Peso inicial do catálogo. Valores são deliberadamente simples e podem ser ajustados pelo Mestre.
UPDATE item_catalog
SET weight_kg = CASE
  WHEN body_weightless THEN 0
  WHEN unit='g' THEN default_amount / 1000.0
  WHEN unit='ml' THEN default_amount / 1000.0
  WHEN id='barraca' THEN 2.5
  WHEN id='lona' THEN 2.0
  WHEN id='manta' THEN 1.5
  WHEN id='esteira' THEN 1.0
  WHEN id='capa-de-viagem' THEN 1.0
  WHEN id='saco-de-lona' THEN 0.4
  WHEN id='cesta' THEN 0.8
  WHEN id='bau' THEN 8.0
  WHEN id='frasco-pequeno' THEN 0.05
  WHEN id='garrafa' THEN 0.25
  WHEN id='jarro' THEN 0.8
  WHEN id='balde' THEN 1.0
  WHEN id='barrilete' THEN 5.0
  WHEN id='barril' THEN 10.0
  WHEN id='corda' THEN 2.0
  WHEN id='cordame-fino' THEN 0.5
  WHEN id='gancho-de-escalada' THEN 0.7
  WHEN id='pitao' THEN 0.15
  WHEN id='escada-de-corda' THEN 4.0
  WHEN id='pe-de-cabra' THEN 2.0
  WHEN id='gazuas' THEN 0.2
  WHEN id='corrente' THEN 3.0
  WHEN id='cadeado' THEN 0.5
  WHEN id='martelo' THEN 0.8
  WHEN id='marreta' THEN 3.5
  WHEN id='cinzel' THEN 0.3
  WHEN id='machadinha' THEN 0.8
  WHEN id='machado' THEN 1.5
  WHEN id='pa' THEN 1.8
  WHEN id='picareta' THEN 2.5
  WHEN id='enxada' THEN 1.7
  WHEN id='serrote' THEN 0.8
  WHEN id='alicate' THEN 0.4
  WHEN id='caixa-de-ferramentas' THEN 4.0
  WHEN id='panela' THEN 1.2
  WHEN id='frigideira' THEN 1.0
  WHEN id='grelha-pequena' THEN 1.2
  WHEN id='rede' THEN 1.5
  WHEN id='faca-de-caca' THEN 0.4
  WHEN id='instrumento-musical' THEN 1.5
  WHEN id='sela' THEN 5.0
  WHEN id='arreios' THEN 2.0
  WHEN id='alforje' THEN 1.0
  WHEN weight_kg IS NULL THEN 0.25
  ELSE weight_kg
END;

-- ============================================================
-- 2) ARMAS / ARMADURAS / ESCUDOS: peso e durabilidade no mesmo catálogo lógico
-- ============================================================
ALTER TABLE weapons
  ADD COLUMN IF NOT EXISTS weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS durability_max integer CHECK (durability_max IS NULL OR durability_max BETWEEN 1 AND 5);
ALTER TABLE armors
  ADD COLUMN IF NOT EXISTS weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS durability_max integer CHECK (durability_max IS NULL OR durability_max BETWEEN 1 AND 5);
ALTER TABLE shields
  ADD COLUMN IF NOT EXISTS weight_kg numeric CHECK (weight_kg IS NULL OR weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS durability_max integer CHECK (durability_max IS NULL OR durability_max BETWEEN 1 AND 5);

UPDATE weapons SET
  durability_max=COALESCE(durability_max,4),
  weight_kg=COALESCE(weight_kg, CASE
    WHEN family ILIKE '%Besta%' THEN 2.5
    WHEN family ILIKE '%Arco%' THEN 1.2
    WHEN family ILIKE '%Haste%' OR family ILIKE '%Lança%' THEN 2.2
    WHEN family ILIKE '%Machad%' THEN 1.6
    WHEN family ILIKE '%Martelo%' OR family ILIKE '%Maça%' THEN 1.8
    WHEN family ILIKE '%Espada%' THEN 1.4
    WHEN name ILIKE '%Rede%' THEN 1.5
    WHEN name ILIKE '%Dardo%' THEN 0.25
    WHEN name ILIKE '%Funda%' THEN 0.2
    WHEN name ILIKE '%Zarabatana%' THEN 0.5
    WHEN name ILIKE '%Boleadeira%' THEN 0.8
    ELSE 1.0 END);

UPDATE armors SET durability_max=COALESCE(durability_max,4), weight_kg=COALESCE(weight_kg, CASE
  WHEN category='Leve' THEN 6
  WHEN category='Média' THEN 12
  ELSE 20 END);
UPDATE shields SET durability_max=COALESCE(durability_max,4), weight_kg=COALESCE(weight_kg, CASE id
  WHEN 'broquel' THEN 1.0 WHEN 'escudo-leve' THEN 2.0 WHEN 'escudo-medio' THEN 4.0
  WHEN 'escudo-grande' THEN 6.0 WHEN 'escudo-torre' THEN 9.0 ELSE 3.0 END);

CREATE OR REPLACE VIEW item_catalog_public AS
SELECT id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,
       unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes,
       weight_kg,consumption_kind,portion_amount,restore_points,carry_slot_kind,carry_bonus_kg,body_weightless
FROM item_catalog WHERE is_active ORDER BY category_order,sort_order,name;
GRANT SELECT ON item_catalog_public TO anon, authenticated;

CREATE OR REPLACE VIEW weapon_catalog_public AS
SELECT id,name,family,weight_kg,durability_max FROM weapons WHERE is_active ORDER BY sort_order,name;
CREATE OR REPLACE VIEW armor_catalog_public AS
SELECT id,name,category,weight_kg,durability_max FROM armors WHERE is_active ORDER BY sort_order,name;
CREATE OR REPLACE VIEW shield_catalog_public AS
SELECT id,name,weight_kg,durability_max FROM shields WHERE is_active ORDER BY sort_order,name;
GRANT SELECT ON weapon_catalog_public,armor_catalog_public,shield_catalog_public TO anon,authenticated;

-- ============================================================
-- 3) INVENTÁRIO: peso personalizado e compartimento ativo
-- ============================================================
ALTER TABLE character_items
  ADD COLUMN IF NOT EXISTS custom_weight_kg numeric CHECK (custom_weight_kg IS NULL OR custom_weight_kg >= 0),
  ADD COLUMN IF NOT EXISTS custom_subcategory text,
  ADD COLUMN IF NOT EXISTS carry_slot text CHECK (carry_slot IS NULL OR carry_slot IN ('main','auxiliary'));

CREATE INDEX IF NOT EXISTS character_items_carry_slot_idx ON character_items(character_id,carry_slot);

-- Itens pesados/medidos passam a guardar o total do lote na coluna amount.
UPDATE character_items
SET amount=amount*quantity, quantity=1
WHERE catalog_item_id IS NOT NULL AND unit IN ('g','ml') AND quantity>1;

-- Snapshot de classe/subclasse para preservar itens já possuídos caso um catálogo seja removido.
UPDATE character_items ci SET properties=COALESCE(ci.properties,'{}'::jsonb) || jsonb_build_object(
  'item_class','Itens comuns','catalog_category',ic.category,
  'weight_kg_snapshot',CASE WHEN ic.body_weightless THEN 0 ELSE ic.weight_kg END,
  'body_weightless_snapshot',ic.body_weightless,'default_amount_snapshot',ic.default_amount,
  'carry_slot_kind_snapshot',ic.carry_slot_kind,'carry_bonus_kg_snapshot',ic.carry_bonus_kg
) FROM item_catalog ic WHERE ci.catalog_item_id=ic.id;
UPDATE character_items ci SET properties=COALESCE(ci.properties,'{}'::jsonb) || jsonb_build_object(
  'item_class','Armas','catalog_category',w.family,'weight_kg_snapshot',w.weight_kg
) FROM weapons w WHERE ci.weapon_id=w.id;
UPDATE character_items ci SET properties=COALESCE(ci.properties,'{}'::jsonb) || jsonb_build_object(
  'item_class','Armaduras','catalog_category',a.category,'weight_kg_snapshot',a.weight_kg
) FROM armors a WHERE ci.armor_id=a.id;
UPDATE character_items ci SET properties=COALESCE(ci.properties,'{}'::jsonb) || jsonb_build_object(
  'item_class','Escudos','catalog_category','Escudos','weight_kg_snapshot',s.weight_kg
) FROM shields s WHERE ci.shield_id=s.id;
UPDATE character_items SET custom_subcategory=COALESCE(custom_subcategory,'Itens variados')
WHERE catalog_item_id IS NULL AND weapon_id IS NULL AND armor_id IS NULL AND shield_id IS NULL;

-- ============================================================
-- 4) FUNÇÕES DE CATÁLOGO DO MESTRE (CRUD)
-- ============================================================
CREATE OR REPLACE FUNCTION master_save_common_catalog_item(
  p_master_player_id uuid, p_id text, p_name text, p_category text, p_category_order integer,
  p_sort_order integer, p_is_consumable boolean, p_is_perishable boolean, p_is_container boolean,
  p_is_durable boolean, p_unit text, p_default_amount numeric, p_capacity_ml integer,
  p_shelf_life_minutes bigint, p_durability_max integer, p_repairable boolean, p_notes text,
  p_weight_kg numeric, p_consumption_kind text, p_portion_amount numeric, p_restore_points integer,
  p_carry_slot_kind text, p_carry_bonus_kg numeric, p_body_weightless boolean
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar o catálogo.'; END IF;
  INSERT INTO item_catalog(id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes,weight_kg,consumption_kind,portion_amount,restore_points,carry_slot_kind,carry_bonus_kg,body_weightless,updated_at)
  VALUES(lower(trim(p_id)),trim(p_name),trim(p_category),GREATEST(1,p_category_order),GREATEST(0,p_sort_order),COALESCE(p_is_consumable,false),COALESCE(p_is_perishable,false),COALESCE(p_is_container,false),COALESCE(p_is_durable,false),COALESCE(NULLIF(trim(p_unit),''),'un'),GREATEST(0.001,COALESCE(p_default_amount,1)),p_capacity_ml,p_shelf_life_minutes,p_durability_max,COALESCE(p_repairable,false),NULLIF(trim(p_notes),''),GREATEST(0,COALESCE(p_weight_kg,0)),NULLIF(p_consumption_kind,''),p_portion_amount,GREATEST(0,COALESCE(p_restore_points,1)),NULLIF(p_carry_slot_kind,''),GREATEST(0,COALESCE(p_carry_bonus_kg,0)),COALESCE(p_body_weightless,false),now())
  ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,category_order=EXCLUDED.category_order,sort_order=EXCLUDED.sort_order,is_consumable=EXCLUDED.is_consumable,is_perishable=EXCLUDED.is_perishable,is_container=EXCLUDED.is_container,is_durable=EXCLUDED.is_durable,unit=EXCLUDED.unit,default_amount=EXCLUDED.default_amount,capacity_ml=EXCLUDED.capacity_ml,shelf_life_minutes=EXCLUDED.shelf_life_minutes,durability_max=EXCLUDED.durability_max,repairable=EXCLUDED.repairable,notes=EXCLUDED.notes,weight_kg=EXCLUDED.weight_kg,consumption_kind=EXCLUDED.consumption_kind,portion_amount=EXCLUDED.portion_amount,restore_points=EXCLUDED.restore_points,carry_slot_kind=EXCLUDED.carry_slot_kind,carry_bonus_kg=EXCLUDED.carry_bonus_kg,body_weightless=EXCLUDED.body_weightless,updated_at=now();
  UPDATE item_catalog SET is_active=true WHERE id=lower(trim(p_id));
END $$;
REVOKE ALL ON FUNCTION master_save_common_catalog_item(uuid,text,text,text,integer,integer,boolean,boolean,boolean,boolean,text,numeric,integer,bigint,integer,boolean,text,numeric,text,numeric,integer,text,numeric,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_save_common_catalog_item(uuid,text,text,text,integer,integer,boolean,boolean,boolean,boolean,text,numeric,integer,bigint,integer,boolean,text,numeric,text,numeric,integer,text,numeric,boolean) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_delete_common_catalog_item(p_master_player_id uuid,p_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode remover itens.'; END IF;
 UPDATE item_catalog SET is_active=false,updated_at=now() WHERE id=p_id;
END $$;
REVOKE ALL ON FUNCTION master_delete_common_catalog_item(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_delete_common_catalog_item(uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_save_weapon_catalog_item(
 p_master_player_id uuid,p_id text,p_name text,p_family text,p_damage_base integer,p_damage_type text,
 p_attack_attribute text,p_attack_skill text,p_requirement_attribute text,p_requirement_attribute_min integer,
 p_requirement_skill text,p_requirement_skill_min integer,p_hands integer,p_range_label text,p_special_rule text,
 p_sort_order integer,p_weight_kg numeric,p_durability_max integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar armas.'; END IF;
 INSERT INTO weapons(id,name,family,damage_base,damage_type,attack_attribute,attack_skill,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,hands,range_label,special_rule,sort_order,weight_kg,durability_max,updated_at)
 VALUES(lower(trim(p_id)),trim(p_name),trim(p_family),GREATEST(0,p_damage_base),trim(p_damage_type),trim(p_attack_attribute),trim(p_attack_skill),NULLIF(trim(p_requirement_attribute),''),GREATEST(0,p_requirement_attribute_min),NULLIF(trim(p_requirement_skill),''),GREATEST(0,p_requirement_skill_min),GREATEST(1,p_hands),COALESCE(NULLIF(trim(p_range_label),''),'Corpo a corpo'),NULLIF(trim(p_special_rule),''),GREATEST(0,p_sort_order),GREATEST(0,COALESCE(p_weight_kg,0)),LEAST(5,GREATEST(1,COALESCE(p_durability_max,4))),now())
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,family=EXCLUDED.family,damage_base=EXCLUDED.damage_base,damage_type=EXCLUDED.damage_type,attack_attribute=EXCLUDED.attack_attribute,attack_skill=EXCLUDED.attack_skill,requirement_attribute=EXCLUDED.requirement_attribute,requirement_attribute_min=EXCLUDED.requirement_attribute_min,requirement_skill=EXCLUDED.requirement_skill,requirement_skill_min=EXCLUDED.requirement_skill_min,hands=EXCLUDED.hands,range_label=EXCLUDED.range_label,special_rule=EXCLUDED.special_rule,sort_order=EXCLUDED.sort_order,weight_kg=EXCLUDED.weight_kg,durability_max=EXCLUDED.durability_max,updated_at=now();
 UPDATE weapons SET is_active=true WHERE id=lower(trim(p_id));
END $$;
REVOKE ALL ON FUNCTION master_save_weapon_catalog_item(uuid,text,text,text,integer,text,text,text,text,integer,text,integer,integer,text,text,integer,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_save_weapon_catalog_item(uuid,text,text,text,integer,text,text,text,text,integer,text,integer,integer,text,text,integer,numeric,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_delete_weapon_catalog_item(p_master_player_id uuid,p_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode remover armas.'; END IF; UPDATE weapons SET is_active=false,updated_at=now() WHERE id=p_id; END $$;
REVOKE ALL ON FUNCTION master_delete_weapon_catalog_item(uuid,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION master_delete_weapon_catalog_item(uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_save_armor_catalog_item(
 p_master_player_id uuid,p_id text,p_name text,p_category text,p_absorption integer,p_requirement_attribute text,
 p_requirement_attribute_min integer,p_requirement_skill text,p_requirement_skill_min integer,p_evasion_penalty integer,
 p_movement_penalty integer,p_sort_order integer,p_weight_kg numeric,p_durability_max integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar armaduras.'; END IF;
 INSERT INTO armors(id,name,category,absorption,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,evasion_penalty,movement_penalty,sort_order,weight_kg,durability_max,updated_at)
 VALUES(lower(trim(p_id)),trim(p_name),p_category,GREATEST(0,p_absorption),NULLIF(trim(p_requirement_attribute),''),GREATEST(0,p_requirement_attribute_min),NULLIF(trim(p_requirement_skill),''),GREATEST(0,p_requirement_skill_min),GREATEST(0,p_evasion_penalty),GREATEST(0,p_movement_penalty),GREATEST(0,p_sort_order),GREATEST(0,COALESCE(p_weight_kg,0)),LEAST(5,GREATEST(1,COALESCE(p_durability_max,4))),now())
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,absorption=EXCLUDED.absorption,requirement_attribute=EXCLUDED.requirement_attribute,requirement_attribute_min=EXCLUDED.requirement_attribute_min,requirement_skill=EXCLUDED.requirement_skill,requirement_skill_min=EXCLUDED.requirement_skill_min,evasion_penalty=EXCLUDED.evasion_penalty,movement_penalty=EXCLUDED.movement_penalty,sort_order=EXCLUDED.sort_order,weight_kg=EXCLUDED.weight_kg,durability_max=EXCLUDED.durability_max,updated_at=now();
 UPDATE armors SET is_active=true WHERE id=lower(trim(p_id));
END $$;
REVOKE ALL ON FUNCTION master_save_armor_catalog_item(uuid,text,text,text,integer,text,integer,text,integer,integer,integer,integer,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_save_armor_catalog_item(uuid,text,text,text,integer,text,integer,text,integer,integer,integer,integer,numeric,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_delete_armor_catalog_item(p_master_player_id uuid,p_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode remover armaduras.'; END IF; UPDATE armors SET is_active=false,updated_at=now() WHERE id=p_id; END $$;
REVOKE ALL ON FUNCTION master_delete_armor_catalog_item(uuid,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION master_delete_armor_catalog_item(uuid,text) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_save_shield_catalog_item(
 p_master_player_id uuid,p_id text,p_name text,p_block_attribute text,p_block_bonus integer,p_requirement_attribute text,
 p_requirement_attribute_min integer,p_requirement_skill text,p_requirement_skill_min integer,p_evasion_penalty integer,
 p_movement_penalty integer,p_sort_order integer,p_weight_kg numeric,p_durability_max integer
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar escudos.'; END IF;
 INSERT INTO shields(id,name,block_attribute,block_bonus,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,evasion_penalty,movement_penalty,sort_order,weight_kg,durability_max,updated_at)
 VALUES(lower(trim(p_id)),trim(p_name),trim(p_block_attribute),GREATEST(0,p_block_bonus),NULLIF(trim(p_requirement_attribute),''),GREATEST(0,p_requirement_attribute_min),NULLIF(trim(p_requirement_skill),''),GREATEST(0,p_requirement_skill_min),GREATEST(0,p_evasion_penalty),GREATEST(0,p_movement_penalty),GREATEST(0,p_sort_order),GREATEST(0,COALESCE(p_weight_kg,0)),LEAST(5,GREATEST(1,COALESCE(p_durability_max,4))),now())
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,block_attribute=EXCLUDED.block_attribute,block_bonus=EXCLUDED.block_bonus,requirement_attribute=EXCLUDED.requirement_attribute,requirement_attribute_min=EXCLUDED.requirement_attribute_min,requirement_skill=EXCLUDED.requirement_skill,requirement_skill_min=EXCLUDED.requirement_skill_min,evasion_penalty=EXCLUDED.evasion_penalty,movement_penalty=EXCLUDED.movement_penalty,sort_order=EXCLUDED.sort_order,weight_kg=EXCLUDED.weight_kg,durability_max=EXCLUDED.durability_max,updated_at=now();
 UPDATE shields SET is_active=true WHERE id=lower(trim(p_id));
END $$;
REVOKE ALL ON FUNCTION master_save_shield_catalog_item(uuid,text,text,text,integer,text,integer,text,integer,integer,integer,integer,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_save_shield_catalog_item(uuid,text,text,text,integer,text,integer,text,integer,integer,integer,integer,numeric,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_delete_shield_catalog_item(p_master_player_id uuid,p_id text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode remover escudos.'; END IF; UPDATE shields SET is_active=false,updated_at=now() WHERE id=p_id; END $$;
REVOKE ALL ON FUNCTION master_delete_shield_catalog_item(uuid,text) FROM PUBLIC; GRANT EXECUTE ON FUNCTION master_delete_shield_catalog_item(uuid,text) TO anon,authenticated;

-- ============================================================
-- 5) ADIÇÃO/EDIÇÃO DE ITENS NA FICHA
-- ============================================================
CREATE OR REPLACE FUNCTION master_add_catalog_item(
  p_master_player_id uuid,p_character_id uuid,p_catalog_item_id text,p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,p_shelf_life_multiplier numeric DEFAULT 1
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v item_catalog%ROWTYPE; v_qty integer; v_amount numeric;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.'; END IF;
  SELECT * INTO v FROM item_catalog WHERE id=p_catalog_item_id; IF NOT FOUND THEN RAISE EXCEPTION 'Item do catálogo não encontrado.'; END IF;
  v_qty:=GREATEST(1,COALESCE(p_quantity,1));
  IF v.unit IN ('g','ml') THEN v_amount:=v.default_amount*v_qty; v_qty:=1; ELSE v_amount:=v.default_amount; END IF;
  INSERT INTO character_items(character_id,name,type,quantity,equipped,description,equip_slot,properties,catalog_item_id,unit,amount,capacity_ml,durability_current,durability_max,freshness_minutes_remaining,shelf_life_multiplier,carry_slot)
  VALUES(p_character_id,v.name,CASE WHEN v.is_perishable THEN 'perecível' WHEN v.is_consumable THEN 'consumível' WHEN v.is_container THEN 'recipiente' ELSE 'comum' END,v_qty,false,COALESCE(p_description,v.notes),NULL,
   jsonb_build_object('consumable',v.is_consumable,'perishable',v.is_perishable,'container',v.is_container,'durable',v.is_durable,'repairable',v.repairable,'shelf_life_minutes',v.shelf_life_minutes,'item_class','Itens comuns','catalog_category',v.category,'consumption_kind',v.consumption_kind,'portion_amount',v.portion_amount,'restore_points',v.restore_points,
    'weight_kg_snapshot',CASE WHEN v.body_weightless THEN 0 ELSE v.weight_kg END,'body_weightless_snapshot',v.body_weightless,'default_amount_snapshot',v.default_amount,
    'carry_slot_kind_snapshot',v.carry_slot_kind,'carry_bonus_kg_snapshot',v.carry_bonus_kg),
   v.id,v.unit,v_amount,v.capacity_ml,v.durability_max,v.durability_max,v.shelf_life_minutes,GREATEST(0.1,COALESCE(p_shelf_life_multiplier,1)),NULL)
  RETURNING id INTO v_id; RETURN v_id;
END $$;

-- Recria a função de equipamento para usar a durabilidade definida no catálogo correspondente.
CREATE OR REPLACE FUNCTION master_add_character_item(
  p_master_player_id uuid,p_character_id uuid,p_name text DEFAULT NULL,p_type text DEFAULT 'comum',p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,p_weapon_id text DEFAULT NULL,p_armor_id text DEFAULT NULL,p_shield_id text DEFAULT NULL,
  p_hunger_restore integer DEFAULT 0,p_thirst_restore integer DEFAULT 0
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v_name text; v_type text; v_durability integer; v_class text; v_sub text; v_weight numeric;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.'; END IF;
 IF p_weapon_id IS NOT NULL THEN SELECT name,durability_max,family,weight_kg INTO v_name,v_durability,v_sub,v_weight FROM weapons WHERE id=p_weapon_id; v_type:='arma';v_class:='Armas';
 ELSIF p_armor_id IS NOT NULL THEN SELECT name,durability_max,category,weight_kg INTO v_name,v_durability,v_sub,v_weight FROM armors WHERE id=p_armor_id; v_type:='armadura';v_class:='Armaduras';
 ELSIF p_shield_id IS NOT NULL THEN SELECT name,durability_max,weight_kg INTO v_name,v_durability,v_weight FROM shields WHERE id=p_shield_id; v_type:='escudo';v_class:='Escudos';v_sub:='Escudos';
 ELSE v_name:=NULLIF(trim(p_name),'');v_type:=COALESCE(NULLIF(trim(p_type),''),'comum');v_durability:=NULL;v_class:='Itens comuns';v_sub:='Itens variados'; END IF;
 IF v_name IS NULL THEN RAISE EXCEPTION 'Item inválido.'; END IF;
 INSERT INTO character_items(character_id,name,type,quantity,equipped,description,weapon_id,armor_id,shield_id,equip_slot,properties,durability_current,durability_max,custom_subcategory)
 VALUES(p_character_id,v_name,v_type,GREATEST(1,COALESCE(p_quantity,1)),false,p_description,p_weapon_id,p_armor_id,p_shield_id,NULL,
  jsonb_build_object('hunger_restore',GREATEST(0,COALESCE(p_hunger_restore,0)),'thirst_restore',GREATEST(0,COALESCE(p_thirst_restore,0)),'durable',v_durability IS NOT NULL,'repairable',v_durability IS NOT NULL,'item_class',v_class,'catalog_category',v_sub,'weight_kg_snapshot',v_weight),
  v_durability,v_durability,CASE WHEN v_class='Itens comuns' THEN v_sub ELSE NULL END)
 RETURNING id INTO v_id; RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION master_add_custom_character_item(
 p_master_player_id uuid,p_character_id uuid,p_name text,p_subcategory text,p_quantity integer DEFAULT 1,
 p_description text DEFAULT NULL,p_weight_kg numeric DEFAULT NULL,p_durability_max integer DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.'; END IF;
 INSERT INTO character_items(character_id,name,type,quantity,equipped,description,properties,custom_weight_kg,custom_subcategory,durability_current,durability_max)
 VALUES(p_character_id,trim(p_name),'comum',GREATEST(1,p_quantity),false,p_description,jsonb_build_object('item_class','Itens comuns','catalog_category',COALESCE(NULLIF(trim(p_subcategory),''),'Itens variados')),p_weight_kg,COALESCE(NULLIF(trim(p_subcategory),''),'Itens variados'),p_durability_max,p_durability_max)
 RETURNING id INTO v_id; RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_custom_character_item(uuid,uuid,text,text,integer,text,numeric,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_custom_character_item(uuid,uuid,text,text,integer,text,numeric,integer) TO anon,authenticated;

CREATE OR REPLACE FUNCTION master_update_character_item_051026(
 p_master_player_id uuid,p_item_id uuid,p_name text,p_quantity integer,p_description text,p_amount numeric,
 p_custom_weight_kg numeric,p_custom_subcategory text,p_durability_current integer,p_shelf_life_multiplier numeric
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v character_items%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode editar itens.'; END IF;
 SELECT * INTO v FROM character_items WHERE id=p_item_id FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
 UPDATE character_items SET name=COALESCE(NULLIF(trim(p_name),''),name),quantity=GREATEST(0,COALESCE(p_quantity,quantity)),description=p_description,
  amount=CASE WHEN amount IS NULL THEN NULL ELSE GREATEST(0,COALESCE(p_amount,amount)) END,
  custom_weight_kg=CASE WHEN catalog_item_id IS NULL AND weapon_id IS NULL AND armor_id IS NULL AND shield_id IS NULL THEN p_custom_weight_kg ELSE custom_weight_kg END,
  custom_subcategory=CASE WHEN catalog_item_id IS NULL AND weapon_id IS NULL AND armor_id IS NULL AND shield_id IS NULL THEN COALESCE(NULLIF(trim(p_custom_subcategory),''),'Itens variados') ELSE custom_subcategory END,
  durability_current=CASE WHEN durability_max IS NULL THEN NULL ELSE LEAST(durability_max,GREATEST(0,COALESCE(p_durability_current,durability_current))) END,
  shelf_life_multiplier=CASE WHEN freshness_minutes_remaining IS NULL THEN shelf_life_multiplier ELSE GREATEST(0.1,COALESCE(p_shelf_life_multiplier,shelf_life_multiplier)) END
 WHERE id=p_item_id;
 UPDATE character_items SET equip_slot=NULL,equipped=false WHERE id=p_item_id AND durability_current=0;
END $$;
REVOKE ALL ON FUNCTION master_update_character_item_051026(uuid,uuid,text,integer,text,numeric,numeric,text,integer,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_update_character_item_051026(uuid,uuid,text,integer,text,numeric,numeric,text,integer,numeric) TO anon,authenticated;

-- Um personagem só pode usar um compartimento principal e um auxiliar de cada vez.
CREATE OR REPLACE FUNCTION set_character_carry_slot(p_player_id uuid,p_character_id uuid,p_item_id uuid,p_slot text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_is_master boolean; v_allowed text; v_item character_items%ROWTYPE;
BEGIN
 SELECT EXISTS(SELECT 1 FROM players WHERE id=p_player_id AND player_identifier='Mestre') INTO v_is_master;
 IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters WHERE id=p_character_id AND player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
 SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id; IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
 IF p_slot IS NULL OR trim(p_slot)='' THEN UPDATE character_items SET carry_slot=NULL WHERE id=p_item_id; RETURN; END IF;
 IF p_slot NOT IN ('main','auxiliary') THEN RAISE EXCEPTION 'Compartimento inválido.'; END IF;
 SELECT carry_slot_kind INTO v_allowed FROM item_catalog WHERE id=v_item.catalog_item_id;
 IF v_allowed IS NULL OR v_allowed<>p_slot THEN RAISE EXCEPTION 'Este item não pode ser usado nesse tipo de compartimento.'; END IF;
 UPDATE character_items SET carry_slot=NULL WHERE character_id=p_character_id AND carry_slot=p_slot AND id<>p_item_id;
 UPDATE character_items SET carry_slot=p_slot WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION set_character_carry_slot(uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_character_carry_slot(uuid,uuid,uuid,text) TO anon,authenticated;

-- ============================================================
-- 6) CONSUMO POR PORÇÃO
-- ============================================================
CREATE OR REPLACE FUNCTION consume_character_item(p_player_id uuid,p_character_id uuid,p_item_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_catalog item_catalog%ROWTYPE; v_is_master boolean;
        v_kind text; v_portion numeric; v_restore integer; v_hunger_max integer; v_hunger integer; v_thirst integer;
        v_legacy_hunger integer; v_legacy_thirst integer;
BEGIN
 SELECT EXISTS(SELECT 1 FROM players WHERE id=p_player_id AND player_identifier='Mestre') INTO v_is_master;
 IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters WHERE id=p_character_id AND player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
 SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id FOR UPDATE;
 IF NOT FOUND OR v_item.quantity<=0 THEN RAISE EXCEPTION 'Consumível indisponível.'; END IF;
 IF v_item.freshness_minutes_remaining IS NOT NULL AND v_item.freshness_minutes_remaining<=0 THEN RAISE EXCEPTION 'Este alimento está estragado. O Mestre decide os efeitos de consumi-lo.'; END IF;
 IF v_item.catalog_item_id IS NOT NULL THEN SELECT * INTO v_catalog FROM item_catalog WHERE id=v_item.catalog_item_id; END IF;
 v_kind:=COALESCE(v_catalog.consumption_kind,v_item.properties->>'consumption_kind');
 v_portion:=COALESCE(v_catalog.portion_amount,NULLIF(v_item.properties->>'portion_amount','')::numeric);
 v_restore:=GREATEST(0,COALESCE(v_catalog.restore_points,NULLIF(v_item.properties->>'restore_points','')::integer,1));
 SELECT GREATEST(1,9-(COALESCE((attributes->>'Vigor')::integer,0)+COALESCE((racial_attribute_bonus->>'Vigor')::integer,0))),COALESCE(current_hunger,0),COALESCE(current_thirst,0)
 INTO v_hunger_max,v_hunger,v_thirst FROM characters WHERE id=p_character_id FOR UPDATE;
 IF v_kind IN ('food','water') AND v_portion IS NOT NULL THEN
   IF v_item.amount IS NULL OR v_item.amount<v_portion THEN RAISE EXCEPTION 'Não há uma porção completa disponível.'; END IF;
   IF v_kind='food' THEN v_hunger:=LEAST(v_hunger_max,v_hunger+v_restore); ELSE v_thirst:=LEAST(6,v_thirst+v_restore); END IF;
   UPDATE characters SET current_hunger=v_hunger,current_thirst=v_thirst WHERE id=p_character_id;
   IF v_item.amount-v_portion<=0 THEN DELETE FROM character_items WHERE id=p_item_id;
   ELSE UPDATE character_items SET amount=amount-v_portion WHERE id=p_item_id; END IF;
   RETURN;
 END IF;
 -- Compatibilidade com consumíveis personalizados antigos.
 v_legacy_hunger:=GREATEST(0,COALESCE((v_item.properties->>'hunger_restore')::integer,0));
 v_legacy_thirst:=GREATEST(0,COALESCE((v_item.properties->>'thirst_restore')::integer,0));
 IF v_legacy_hunger=0 AND v_legacy_thirst=0 THEN RAISE EXCEPTION 'Este item não possui uma porção consumível configurada.'; END IF;
 UPDATE characters SET current_hunger=LEAST(v_hunger_max,v_hunger+v_legacy_hunger),current_thirst=LEAST(6,v_thirst+v_legacy_thirst) WHERE id=p_character_id;
 IF v_item.quantity<=1 THEN DELETE FROM character_items WHERE id=p_item_id; ELSE UPDATE character_items SET quantity=quantity-1 WHERE id=p_item_id; END IF;
END $$;
REVOKE ALL ON FUNCTION consume_character_item(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_character_item(uuid,uuid,uuid) TO anon,authenticated;
