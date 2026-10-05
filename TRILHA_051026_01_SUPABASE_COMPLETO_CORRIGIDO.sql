-- ============================================================
-- TRILHA — 051026.01 — SUPABASE COMPLETO CORRIGIDO
-- Compatibilidade: pode ser executado sobre uma base já parcialmente atualizada.
-- Reúne as dependências de catálogo/equipamentos + Tarefas 2–3 + 051026.01.
-- ============================================================
BEGIN;

-- TRILHA — Catálogo de armas, proficiência e cálculo de dano
-- Especificações completas são consultadas pelo Painel do Mestre.
-- Jogadores recebem apenas nomes/famílias e o estado de proficiência.

CREATE TABLE IF NOT EXISTS weapons (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  family text NOT NULL,
  damage_base integer NOT NULL CHECK (damage_base >= 0),
  damage_type text NOT NULL,
  attack_attribute text NOT NULL,
  attack_skill text NOT NULL,
  requirement_attribute text,
  requirement_attribute_min integer NOT NULL DEFAULT 0 CHECK (requirement_attribute_min >= 0),
  requirement_skill text,
  requirement_skill_min integer NOT NULL DEFAULT 0 CHECK (requirement_skill_min >= 0),
  hands integer NOT NULL CHECK (hands IN (1,2)),
  range_label text NOT NULL DEFAULT 'Corpo a corpo',
  special_rule text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weapons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE weapons FROM anon, authenticated;
-- Sem SELECT direto para anon/authenticated: o app usa as interfaces controladas abaixo.
DROP POLICY IF EXISTS weapons_select ON weapons;
DROP POLICY IF EXISTS weapons_insert ON weapons;
DROP POLICY IF EXISTS weapons_update ON weapons;
DROP POLICY IF EXISTS weapons_delete ON weapons;

INSERT INTO weapons
(id,name,family,damage_base,damage_type,attack_attribute,attack_skill,requirement_attribute,requirement_attribute_min,requirement_skill,requirement_skill_min,hands,range_label,special_rule,sort_order)
VALUES
('adaga','Adaga','Lâminas',3,'Perfurante','Destreza','Esgrima','Destreza',1,'Esgrima',1,1,'Corpo a corpo / 10 m',NULL,1),
('kukri','Kukri','Lâminas',4,'Cortante','Destreza','Esgrima','Destreza',1,'Esgrima',1,1,'Corpo a corpo',NULL,2),
('gladius','Gladius','Lâminas',4,'Perfurante','Força','Esgrima','Força',1,'Esgrima',1,1,'Corpo a corpo',NULL,3),
('espada-curta','Espada Curta','Lâminas',4,'Perfurante','Destreza','Esgrima','Destreza',1,'Esgrima',1,1,'Corpo a corpo',NULL,4),
('rapieira','Rapieira','Lâminas',5,'Perfurante','Destreza','Esgrima','Destreza',2,'Esgrima',2,1,'Corpo a corpo',NULL,5),
('estoque','Estoque','Lâminas',5,'Perfurante','Destreza','Esgrima','Destreza',2,'Esgrima',2,1,'Corpo a corpo',NULL,6),
('sabre','Sabre','Lâminas',5,'Cortante','Destreza','Esgrima','Destreza',2,'Esgrima',1,1,'Corpo a corpo',NULL,7),
('cimitarra','Cimitarra','Lâminas',5,'Cortante','Destreza','Esgrima','Destreza',2,'Esgrima',1,1,'Corpo a corpo',NULL,8),
('falcata','Falcata','Lâminas',5,'Cortante','Força','Esgrima','Força',2,'Esgrima',1,1,'Corpo a corpo',NULL,9),
('khopesh','Khopesh','Lâminas',5,'Cortante','Força','Esgrima','Força',2,'Esgrima',2,1,'Corpo a corpo',NULL,10),
('katana','Katana','Lâminas',6,'Cortante','Destreza','Esgrima','Força',2,'Esgrima',2,2,'Corpo a corpo',NULL,11),
('espada-longa','Espada Longa','Lâminas',6,'Cortante','Força','Esgrima','Força',2,'Esgrima',1,1,'Corpo a corpo',NULL,12),
('espada-grande','Espada Grande','Lâminas',7,'Cortante','Força','Esgrima','Força',3,'Esgrima',2,2,'Corpo a corpo',NULL,13),

('machado-de-mao','Machado de Mão','Machados',4,'Cortante','Força','Luta','Força',1,'Luta',1,1,'Corpo a corpo / 10 m',NULL,14),
('machado-de-batalha','Machado de Batalha','Machados',6,'Cortante','Força','Luta','Força',2,'Luta',1,1,'Corpo a corpo',NULL,15),
('machado-grande','Machado Grande','Machados',7,'Cortante','Força','Luta','Força',3,'Luta',2,2,'Corpo a corpo',NULL,16),

('clava','Clava','Impacto',3,'Impacto','Força','Luta','Força',1,NULL,0,1,'Corpo a corpo',NULL,17),
('clava-grande','Clava Grande','Impacto',5,'Impacto','Força','Luta','Força',2,'Luta',1,2,'Corpo a corpo',NULL,18),
('martelo-leve','Martelo Leve','Impacto',4,'Impacto','Força','Luta','Força',1,'Luta',1,1,'Corpo a corpo / 10 m',NULL,19),
('maca','Maça','Impacto',5,'Impacto','Força','Luta','Força',2,'Luta',1,1,'Corpo a corpo',NULL,20),
('mangual','Mangual','Impacto',5,'Impacto','Força','Luta','Força',2,'Luta',2,1,'Corpo a corpo',NULL,21),
('malho-de-guerra','Malho de Guerra','Impacto',7,'Impacto','Força','Luta','Força',3,'Luta',2,2,'Corpo a corpo',NULL,22),
('estrela-da-manha','Estrela-da-Manhã','Impacto',6,'Impacto/Perfurante','Força','Luta','Força',2,'Luta',2,1,'Corpo a corpo',NULL,23),
('picareta-de-guerra','Picareta de Guerra','Impacto',6,'Perfurante','Força','Luta','Força',2,'Luta',2,1,'Corpo a corpo',NULL,24),
('martelo-de-guerra','Martelo de Guerra','Impacto',6,'Impacto','Força','Luta','Força',2,'Luta',1,1,'Corpo a corpo',NULL,25),

('bordao','Bordão','Hastes',4,'Impacto','Força','Luta','Força',1,'Luta',1,2,'Corpo a corpo',NULL,26),
('lanca','Lança','Hastes',5,'Perfurante','Força','Luta','Força',1,'Luta',1,1,'Corpo a corpo / 15 m',NULL,27),
('azagaia','Azagaia','Hastes',4,'Perfurante','Força','Tiro','Força',1,'Tiro',1,1,'30 m',NULL,28),
('tridente','Tridente','Hastes',5,'Perfurante','Força','Luta','Força',2,'Luta',1,1,'Corpo a corpo / 15 m',NULL,29),
('glaive','Glaive','Hastes',6,'Cortante','Destreza','Esgrima','Força',2,'Esgrima',2,2,'3 m',NULL,30),
('alabarda','Alabarda','Hastes',7,'Cortante','Força','Luta','Força',3,'Luta',2,2,'3 m',NULL,31),
('pique','Pique','Hastes',6,'Perfurante','Força','Luta','Força',2,'Luta',2,2,'3 m',NULL,32),
('lanca-de-cavalaria','Lança de Cavalaria','Hastes',7,'Perfurante','Força','Cavalaria','Força',2,'Cavalaria',2,1,'3 m','Quando usada a pé, pode ser tratada como Força + Luta e Dano Base 5. A regra de modo de uso será refinada na etapa de ações de combate.',33),
('naginata','Naginata','Hastes',6,'Cortante','Destreza','Esgrima','Força',2,'Esgrima',2,2,'3 m',NULL,34),

('foice-de-mao','Foice de Mão','Outras corpo a corpo',3,'Cortante','Destreza','Esgrima','Destreza',1,'Esgrima',1,1,'Corpo a corpo',NULL,35),
('chicote','Chicote','Outras corpo a corpo',3,'Cortante','Destreza','Esgrima','Destreza',2,'Esgrima',1,1,'3 m','Dano baixo intencional; poderá receber manobras de controle em atualização futura.',36),

('arco-curto','Arco Curto','Arcos',4,'Perfurante','Destreza','Tiro','Destreza',1,'Tiro',1,2,'30 m',NULL,37),
('arco-recurvo','Arco Recurvo','Arcos',5,'Perfurante','Destreza','Tiro','Destreza',2,'Tiro',1,2,'45 m',NULL,38),
('arco-longo','Arco Longo','Arcos',6,'Perfurante','Destreza','Tiro','Força',2,'Tiro',2,2,'60 m',NULL,39),

('besta-de-mao','Besta de Mão','Bestas',4,'Perfurante','Destreza','Tiro','Destreza',1,'Tiro',1,1,'20 m',NULL,40),
('besta-leve','Besta Leve','Bestas',5,'Perfurante','Destreza','Tiro','Destreza',1,'Tiro',1,2,'40 m',NULL,41),
('besta-pesada','Besta Pesada','Bestas',7,'Perfurante','Destreza','Tiro','Força',2,'Tiro',1,2,'60 m','A recarga ainda será definida quando a economia de ações do combate for fechada.',42),

('dardo','Dardo','Projéteis e controle',3,'Perfurante','Destreza','Tiro','Destreza',1,NULL,0,1,'15 m',NULL,43),
('funda','Funda','Projéteis e controle',3,'Impacto','Destreza','Tiro','Destreza',1,'Tiro',1,1,'30 m',NULL,44),
('zarabatana','Zarabatana','Projéteis e controle',1,'Perfurante','Destreza','Tiro','Destreza',1,'Tiro',1,2,'20 m','Projetada para receber venenos, sedativos ou outros preparados em atualização futura.',45),
('boleadeira','Boleadeira','Projéteis e controle',1,'Impacto','Destreza','Tiro','Destreza',1,'Tiro',1,1,'15 m','Projetada para controle e derrubada; a manobra será definida em atualização futura.',46),
('rede','Rede','Projéteis e controle',0,'—','Destreza','Tiro','Destreza',1,'Tiro',1,1,'5 m','Não causa dano. Sua função será controle/imobilização em atualização futura.',47)
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name,
  family=EXCLUDED.family,
  damage_base=EXCLUDED.damage_base,
  damage_type=EXCLUDED.damage_type,
  attack_attribute=EXCLUDED.attack_attribute,
  attack_skill=EXCLUDED.attack_skill,
  requirement_attribute=EXCLUDED.requirement_attribute,
  requirement_attribute_min=EXCLUDED.requirement_attribute_min,
  requirement_skill=EXCLUDED.requirement_skill,
  requirement_skill_min=EXCLUDED.requirement_skill_min,
  hands=EXCLUDED.hands,
  range_label=EXCLUDED.range_label,
  special_rule=EXCLUDED.special_rule,
  sort_order=EXCLUDED.sort_order,
  updated_at=now();

ALTER TABLE IF EXISTS character_items
  ADD COLUMN IF NOT EXISTS weapon_id text REFERENCES weapons(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS character_items_weapon_id_idx ON character_items(weapon_id);

-- Catálogo visível ao jogador: somente identidade da arma, nunca requisitos/dano.
CREATE OR REPLACE VIEW weapon_catalog_public AS
SELECT id, name, family
FROM weapons
ORDER BY sort_order, name;
GRANT SELECT ON weapon_catalog_public TO anon, authenticated;

-- Catálogo completo do Mestre. O app informa o UUID do jogador atualmente logado.
CREATE OR REPLACE FUNCTION get_master_weapon_catalog(p_player_id uuid)
RETURNS TABLE (
  id text,
  name text,
  family text,
  damage_base integer,
  damage_type text,
  attack_attribute text,
  attack_skill text,
  requirement_attribute text,
  requirement_attribute_min integer,
  requirement_skill text,
  requirement_skill_min integer,
  hands integer,
  range_label text,
  special_rule text,
  sort_order integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.id,w.name,w.family,w.damage_base,w.damage_type,w.attack_attribute,w.attack_skill,
         w.requirement_attribute,w.requirement_attribute_min,w.requirement_skill,w.requirement_skill_min,
         w.hands,w.range_label,w.special_rule,w.sort_order
  FROM weapons w
  WHERE EXISTS (
    SELECT 1 FROM players p
    WHERE p.id = p_player_id AND p.player_identifier = 'Mestre'
  )
  ORDER BY w.sort_order,w.name;
$$;
REVOKE ALL ON FUNCTION get_master_weapon_catalog(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_master_weapon_catalog(uuid) TO anon, authenticated;

-- Retorna ao jogador somente se ele já cumpre os requisitos de cada arma.
-- Bônus raciais/de linhagem contam para manejo, conforme regra oficial do TRILHA.
CREATE OR REPLACE FUNCTION get_character_weapon_proficiency(p_character_id uuid)
RETURNS TABLE (weapon_id text, is_proficient boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id,
    (
      GREATEST(
        0,
        w.requirement_attribute_min - CASE
          WHEN w.requirement_attribute IS NULL THEN 0
          ELSE COALESCE((c.attributes ->> w.requirement_attribute)::integer,0)
             + COALESCE((c.racial_attribute_bonus ->> w.requirement_attribute)::integer,0)
        END
      )
      +
      GREATEST(
        0,
        w.requirement_skill_min - CASE
          WHEN w.requirement_skill IS NULL THEN 0
          ELSE COALESCE((c.skills ->> w.requirement_skill)::integer,0)
             + COALESCE((c.lineage_skill_bonuses ->> w.requirement_skill)::integer,0)
        END
      )
    ) = 0 AS is_proficient
  FROM characters c
  CROSS JOIN weapons w
  WHERE c.id = p_character_id
  ORDER BY w.sort_order;
$$;
REVOKE ALL ON FUNCTION get_character_weapon_proficiency(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_character_weapon_proficiency(uuid) TO anon, authenticated;

-- Cálculo preparado para a futura tela de combate.
-- Dano Efetivo = Dano Base - déficit de requisito (mínimo 1, exceto armas de dano 0).
-- Dano Bruto = Dano Efetivo + Sucessos Excedentes.
-- Dano Final = Dano Bruto - Absorção (mínimo 1 quando a arma causa dano e o golpe acerta).
CREATE OR REPLACE FUNCTION calculate_weapon_damage(
  p_character_id uuid,
  p_weapon_id text,
  p_excess_successes integer DEFAULT 0,
  p_armor_absorption integer DEFAULT 0
)
RETURNS TABLE (
  weapon_id text,
  proficiency_deficit integer,
  is_proficient boolean,
  effective_base_damage integer,
  gross_damage integer,
  final_damage integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH calc AS (
    SELECT
      w.id AS weapon_id,
      w.damage_base,
      GREATEST(0,w.requirement_attribute_min - CASE
        WHEN w.requirement_attribute IS NULL THEN 0
        ELSE COALESCE((c.attributes ->> w.requirement_attribute)::integer,0)
           + COALESCE((c.racial_attribute_bonus ->> w.requirement_attribute)::integer,0)
      END)
      + GREATEST(0,w.requirement_skill_min - CASE
        WHEN w.requirement_skill IS NULL THEN 0
        ELSE COALESCE((c.skills ->> w.requirement_skill)::integer,0)
           + COALESCE((c.lineage_skill_bonuses ->> w.requirement_skill)::integer,0)
      END) AS deficit
    FROM characters c
    JOIN weapons w ON w.id = p_weapon_id
    WHERE c.id = p_character_id
  ), dmg AS (
    SELECT *,
      CASE WHEN damage_base = 0 THEN 0 ELSE GREATEST(1,damage_base-deficit) END AS effective_base
    FROM calc
  ), gross AS (
    SELECT *, effective_base + GREATEST(0,COALESCE(p_excess_successes,0)) AS gross_value
    FROM dmg
  )
  SELECT
    weapon_id,
    deficit,
    deficit = 0,
    effective_base,
    gross_value,
    CASE
      WHEN damage_base = 0 THEN 0
      ELSE GREATEST(1,gross_value-GREATEST(0,COALESCE(p_armor_absorption,0)))
    END
  FROM gross;
$$;
REVOKE ALL ON FUNCTION calculate_weapon_damage(uuid,text,integer,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION calculate_weapon_damage(uuid,text,integer,integer) FROM anon, authenticated;
-- A função fica pronta no banco, mas sem acesso do cliente até a futura interface de combate.


-- ===== DEPENDÊNCIA: ARMADURAS / ESCUDOS / SOBREVIVÊNCIA =====
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


-- ===== TAREFAS 2–3 =====
-- TRILHA — Tarefas 2 e 3: Controle do Mestre, relógio, descansos e catálogo universal de itens
-- Execute DEPOIS de TRILHA_equipamentos_sobrevivencia_supabase.sql.
-- Esta migration é idempotente: pode ser executada novamente para atualizar o catálogo e as funções.

-- ============================================================
-- 1) CATÁLOGO UNIVERSAL DE ITENS
-- ============================================================
CREATE TABLE IF NOT EXISTS item_catalog (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  category_order integer NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_consumable boolean NOT NULL DEFAULT false,
  is_perishable boolean NOT NULL DEFAULT false,
  is_container boolean NOT NULL DEFAULT false,
  is_durable boolean NOT NULL DEFAULT false,
  unit text NOT NULL DEFAULT 'un',
  default_amount numeric NOT NULL DEFAULT 1 CHECK (default_amount > 0),
  capacity_ml integer CHECK (capacity_ml IS NULL OR capacity_ml > 0),
  shelf_life_minutes bigint CHECK (shelf_life_minutes IS NULL OR shelf_life_minutes > 0),
  durability_max integer CHECK (durability_max IS NULL OR durability_max BETWEEN 1 AND 5),
  repairable boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE item_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE item_catalog FROM anon, authenticated;

INSERT INTO item_catalog
(id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes)
VALUES
('tocha','Tocha','Iluminação e fogo',1,1,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('lanterna','Lanterna','Iluminação e fogo',1,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('vela','Vela','Iluminação e fogo',1,3,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('oleo-de-iluminacao','Óleo de iluminação','Iluminação e fogo',1,4,true,false,false,false,'ml',500,NULL,NULL,NULL,false,NULL),
('pederneira-e-aco','Pederneira e aço','Iluminação e fogo',1,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('isca-seca','Isca seca','Iluminação e fogo',1,6,true,false,false,false,'porção',1,NULL,NULL,NULL,false,NULL),
('pavio','Pavio','Iluminação e fogo',1,7,true,false,false,false,'m',1,NULL,NULL,NULL,false,NULL),
('corda','Corda','Cordas, escalada e acesso',2,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('cordame-fino','Cordame fino','Cordas, escalada e acesso',2,2,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('gancho-de-escalada','Gancho de escalada','Cordas, escalada e acesso',2,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pitao','Pitão','Cordas, escalada e acesso',2,4,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('escada-de-corda','Escada de corda','Cordas, escalada e acesso',2,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('pe-de-cabra','Pé-de-cabra','Cordas, escalada e acesso',2,6,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('gazuas','Gazuas','Cordas, escalada e acesso',2,7,false,false,false,true,'conjunto',1,NULL,NULL,2,true,NULL),
('corrente','Corrente','Cordas, escalada e acesso',2,8,false,false,false,true,'un',1,NULL,NULL,5,true,NULL),
('cadeado','Cadeado','Cordas, escalada e acesso',2,9,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('cunha','Cunha','Cordas, escalada e acesso',2,10,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('martelo','Martelo','Ferramentas e construção',3,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('marreta','Marreta','Ferramentas e construção',3,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('cinzel','Cinzel','Ferramentas e construção',3,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('machadinha','Machadinha','Ferramentas e construção',3,4,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('machado','Machado','Ferramentas e construção',3,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pa','Pá','Ferramentas e construção',3,6,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('picareta','Picareta','Ferramentas e construção',3,7,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('enxada','Enxada','Ferramentas e construção',3,8,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('serrote','Serrote','Ferramentas e construção',3,9,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('alicate','Alicate','Ferramentas e construção',3,10,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pregos','Pregos','Ferramentas e construção',3,11,true,false,false,false,'un',20,NULL,NULL,NULL,false,NULL),
('caixa-de-ferramentas','Caixa de ferramentas','Ferramentas e construção',3,12,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('pedra-de-amolar','Pedra de amolar','Ferramentas e construção',3,13,false,false,false,true,'un',1,NULL,NULL,3,false,NULL),
('oleo-de-manutencao','Óleo de manutenção','Ferramentas e construção',3,14,true,false,false,false,'ml',250,NULL,NULL,NULL,false,NULL),
('mapa','Mapa','Exploração e orientação',4,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('bussola','Bússola','Exploração e orientação',4,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('ampulheta','Ampulheta','Exploração e orientação',4,3,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('giz','Giz','Exploração e orientação',4,4,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('carvao','Carvão','Exploração e orientação',4,5,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('vara-de-exploracao','Vara de exploração','Exploração e orientação',4,6,false,false,false,true,'un',1,NULL,NULL,3,true,'Sondar profundidade, terreno instável, buracos, armadilhas simples e travessias.'),
('barraca','Barraca','Acampamento e viagem',5,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('lona','Lona','Acampamento e viagem',5,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('manta','Manta','Acampamento e viagem',5,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('esteira','Esteira','Acampamento e viagem',5,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('capa-de-viagem','Capa de viagem','Acampamento e viagem',5,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('mochila','Mochila','Acampamento e viagem',5,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('bolsa','Bolsa','Acampamento e viagem',5,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('saco-de-lona','Saco de lona','Acampamento e viagem',5,8,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('cesta','Cesta','Acampamento e viagem',5,9,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('bau','Baú','Acampamento e viagem',5,10,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frasco-pequeno','Frasco pequeno','Água e recipientes',6,1,false,false,true,true,'un',1,100,NULL,2,false,NULL),
('garrafa','Garrafa','Água e recipientes',6,2,false,false,true,true,'un',1,500,NULL,2,false,NULL),
('cantil','Cantil','Água e recipientes',6,3,false,false,true,true,'un',1,1000,NULL,3,true,NULL),
('cantil-grande','Cantil grande','Água e recipientes',6,4,false,false,true,true,'un',1,2000,NULL,3,true,NULL),
('odre','Odre','Água e recipientes',6,5,false,false,true,true,'un',1,4000,NULL,3,true,NULL),
('odre-grande','Odre grande','Água e recipientes',6,6,false,false,true,true,'un',1,8000,NULL,3,true,NULL),
('jarro','Jarro','Água e recipientes',6,7,false,false,true,true,'un',1,2000,NULL,2,true,NULL),
('balde','Balde','Água e recipientes',6,8,false,false,true,true,'un',1,10000,NULL,4,true,NULL),
('barrilete','Barrilete','Água e recipientes',6,9,false,false,true,true,'un',1,20000,NULL,4,true,NULL),
('barril','Barril','Água e recipientes',6,10,false,false,true,true,'un',1,50000,NULL,5,true,NULL),
('pao-seco','Pão seco','Alimentos secos e duráveis',7,1,true,true,false,false,'g',500,NULL,20160,NULL,false,NULL),
('biscoito-de-viagem','Biscoito de viagem','Alimentos secos e duráveis',7,2,true,true,false,false,'g',500,NULL,129600,NULL,false,NULL),
('frutas-secas','Frutas secas','Alimentos secos e duráveis',7,3,true,true,false,false,'g',250,NULL,86400,NULL,false,NULL),
('nozes-e-castanhas','Nozes e castanhas','Alimentos secos e duráveis',7,4,true,true,false,false,'g',250,NULL,43200,NULL,false,NULL),
('graos-secos','Grãos secos','Alimentos secos e duráveis',7,5,true,true,false,false,'g',500,NULL,259200,NULL,false,NULL),
('leguminosas-secas','Leguminosas secas','Alimentos secos e duráveis',7,6,true,true,false,false,'g',500,NULL,259200,NULL,false,NULL),
('farinha','Farinha','Alimentos secos e duráveis',7,7,true,true,false,false,'g',1000,NULL,129600,NULL,false,NULL),
('sal','Sal','Alimentos secos e duráveis',7,8,true,false,false,false,'g',250,NULL,NULL,NULL,false,'Não estraga em condições normais.'),
('mel','Mel','Alimentos secos e duráveis',7,9,true,false,false,false,'g',250,NULL,NULL,NULL,false,'Não estraga em condições normais.'),
('carne-seca','Carne seca','Carnes e pescados conservados',8,1,true,true,false,false,'g',500,NULL,86400,NULL,false,NULL),
('carne-salgada','Carne salgada','Carnes e pescados conservados',8,2,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('carne-defumada','Carne defumada','Carnes e pescados conservados',8,3,true,true,false,false,'g',500,NULL,28800,NULL,false,NULL),
('linguica-curada','Linguiça curada','Carnes e pescados conservados',8,4,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('peixe-seco','Peixe seco','Carnes e pescados conservados',8,5,true,true,false,false,'g',500,NULL,64800,NULL,false,NULL),
('peixe-salgado','Peixe salgado','Carnes e pescados conservados',8,6,true,true,false,false,'g',500,NULL,28800,NULL,false,NULL),
('peixe-defumado','Peixe defumado','Carnes e pescados conservados',8,7,true,true,false,false,'g',500,NULL,14400,NULL,false,NULL),
('queijo-fresco','Queijo fresco','Laticínios',9,1,true,true,false,false,'g',500,NULL,4320,NULL,false,NULL),
('queijo-curado','Queijo curado','Laticínios',9,2,true,true,false,false,'g',500,NULL,43200,NULL,false,NULL),
('queijo-duro','Queijo duro','Laticínios',9,3,true,true,false,false,'g',500,NULL,86400,NULL,false,NULL),
('manteiga','Manteiga','Laticínios',9,4,true,true,false,false,'g',250,NULL,10080,NULL,false,NULL),
('manteiga-clarificada','Manteiga clarificada','Laticínios',9,5,true,true,false,false,'g',250,NULL,43200,NULL,false,NULL),
('frutas-frescas','Frutas frescas','Alimentos frescos',10,1,true,true,false,false,'g',500,NULL,7200,NULL,false,NULL),
('legumes','Legumes','Alimentos frescos',10,2,true,true,false,false,'g',500,NULL,10080,NULL,false,NULL),
('verduras','Verduras','Alimentos frescos',10,3,true,true,false,false,'g',500,NULL,4320,NULL,false,NULL),
('raizes-e-tuberculos','Raízes e tubérculos','Alimentos frescos',10,4,true,true,false,false,'g',1000,NULL,20160,NULL,false,NULL),
('cogumelos','Cogumelos','Alimentos frescos',10,5,true,true,false,false,'g',250,NULL,2880,NULL,false,NULL),
('ovos','Ovos','Alimentos frescos',10,6,true,true,false,false,'un',6,NULL,20160,NULL,false,NULL),
('panela','Panela','Cozinha',11,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frigideira','Frigideira','Cozinha',11,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('caneca','Caneca','Cozinha',11,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('tigela','Tigela','Cozinha',11,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('colher','Colher','Cozinha',11,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('faca-utilitaria','Faca utilitária','Cozinha',11,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('espeto','Espeto','Cozinha',11,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('grelha-pequena','Grelha pequena','Cozinha',11,8,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('rede','Rede','Caça, pesca e coleta',12,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('armadilha-pequena','Armadilha pequena','Caça, pesca e coleta',12,2,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('linha-de-pesca','Linha de pesca','Caça, pesca e coleta',12,3,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('anzol','Anzol','Caça, pesca e coleta',12,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('faca-de-caca','Faca de caça','Caça, pesca e coleta',12,5,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('saco-de-coleta','Saco de coleta','Caça, pesca e coleta',12,6,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('ataduras','Ataduras','Medicina',13,1,true,false,false,false,'un',5,NULL,NULL,NULL,false,NULL),
('tala','Tala','Medicina',13,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pano-limpo','Pano limpo','Medicina',13,3,true,false,false,false,'un',5,NULL,NULL,NULL,false,NULL),
('instrumentos-cirurgicos','Instrumentos cirúrgicos','Medicina',13,4,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('alcool-medicinal','Álcool medicinal','Medicina',13,5,true,false,false,false,'ml',250,NULL,NULL,NULL,false,NULL),
('sabao','Sabão','Medicina',13,6,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('agulha-e-linha','Agulha e linha','Medicina',13,7,true,false,false,false,'conjunto',1,NULL,NULL,NULL,false,NULL),
('almofariz-e-pilao','Almofariz e pilão','Alquimia',14,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('frasco','Frasco','Alquimia',14,2,false,false,true,true,'un',1,250,NULL,2,false,NULL),
('tubo-de-vidro','Tubo de vidro','Alquimia',14,3,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('funil','Funil','Alquimia',14,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('alambique-portatil','Alambique portátil','Alquimia',14,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('balanca-de-precisao','Balança de precisão','Alquimia',14,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('colher-de-medida','Colher de medida','Alquimia',14,7,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('recipiente-de-mistura','Recipiente de mistura','Alquimia',14,8,false,false,true,true,'un',1,1000,NULL,3,true,NULL),
('pena','Pena','Escrita e registro',15,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('tinteiro','Tinteiro','Escrita e registro',15,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pergaminho','Pergaminho','Escrita e registro',15,3,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('papel','Papel','Escrita e registro',15,4,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('caderno','Caderno','Escrita e registro',15,5,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('codice','Códice','Escrita e registro',15,6,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('lacre','Lacre','Escrita e registro',15,7,false,false,false,true,'un',1,NULL,NULL,3,false,NULL),
('cera-de-selo','Cera de selo','Escrita e registro',15,8,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('balanca-mercantil','Balança mercantil','Comércio e administração',16,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('pesos-de-medida','Pesos de medida','Comércio e administração',16,2,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('abaco','Ábaco','Comércio e administração',16,3,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('bolsa-de-moedas','Bolsa de moedas','Comércio e administração',16,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('livro-caixa','Livro-caixa','Comércio e administração',16,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('baralho','Baralho','Trapaça, jogos e prestidigitação',17,1,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('dados','Dados','Trapaça, jogos e prestidigitação',17,2,false,false,false,true,'conjunto',1,NULL,NULL,3,false,NULL),
('copo-de-dados','Copo de dados','Trapaça, jogos e prestidigitação',17,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('moeda-manipulavel','Moeda manipulável','Trapaça, jogos e prestidigitação',17,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('lenco','Lenço','Trapaça, jogos e prestidigitação',17,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('pequenas-bolas-de-prestidigitacao','Pequenas bolas de prestidigitação','Trapaça, jogos e prestidigitação',17,6,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('kit-de-maquiagem-cenica','Kit de maquiagem cênica','Disfarce, etiqueta e interpretação',18,1,true,false,false,false,'kit',1,NULL,NULL,NULL,false,NULL),
('peruca','Peruca','Disfarce, etiqueta e interpretação',18,2,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('mascara','Máscara','Disfarce, etiqueta e interpretação',18,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('disfarce','Disfarce','Disfarce, etiqueta e interpretação',18,4,false,false,false,true,'conjunto',1,NULL,NULL,2,true,NULL),
('traje-comum','Traje comum','Disfarce, etiqueta e interpretação',18,5,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('traje-refinado','Traje refinado','Disfarce, etiqueta e interpretação',18,6,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('traje-cerimonial','Traje cerimonial','Disfarce, etiqueta e interpretação',18,7,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('instrumento-musical','Instrumento musical','Arte e expressão',19,1,false,false,false,true,'un',1,NULL,NULL,3,true,'Defina o instrumento na descrição: flauta, alaúde, tambor, lira etc.'),
('tela','Tela','Arte e expressão',19,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pergaminho-para-desenho','Pergaminho para desenho','Arte e expressão',19,3,true,false,false,false,'folha',1,NULL,NULL,NULL,false,NULL),
('pinceis','Pincéis','Arte e expressão',19,4,false,false,false,true,'conjunto',1,NULL,NULL,3,true,NULL),
('pigmentos','Pigmentos','Arte e expressão',19,5,true,false,false,false,'conjunto',1,NULL,NULL,NULL,false,NULL),
('carvao-artistico','Carvão artístico','Arte e expressão',19,6,true,false,false,false,'un',10,NULL,NULL,NULL,false,NULL),
('material-de-escultura','Material de escultura','Arte e expressão',19,7,true,false,false,false,'porção',1,NULL,NULL,NULL,false,NULL),
('sela','Sela','Cavalaria e animais',20,1,false,false,false,true,'un',1,NULL,NULL,4,true,NULL),
('redeas','Rédeas','Cavalaria e animais',20,2,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('arreios','Arreios','Cavalaria e animais',20,3,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('alforje','Alforje','Cavalaria e animais',20,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('ferraduras','Ferraduras','Cavalaria e animais',20,5,false,false,false,true,'conjunto',1,NULL,NULL,4,true,NULL),
('escova-para-animal','Escova para animal','Cavalaria e animais',20,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('racao-animal','Ração animal','Cavalaria e animais',20,7,true,true,false,false,'kg',1,NULL,129600,NULL,false,NULL),
('corda-de-conducao','Corda de condução','Cavalaria e animais',20,8,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('sino-para-animal','Sino para animal','Cavalaria e animais',20,9,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('sino','Sino','Sinalização e comunicação',21,1,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('espelho-de-sinalizacao','Espelho de sinalização','Sinalização e comunicação',21,2,false,false,false,true,'un',1,NULL,NULL,2,false,NULL),
('bandeira','Bandeira','Sinalização e comunicação',21,3,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('corneta','Corneta','Sinalização e comunicação',21,4,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('apito','Apito','Sinalização e comunicação',21,5,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('barbante','Barbante','Itens gerais e pequenos',22,1,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('cera','Cera','Itens gerais e pequenos',22,2,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('cola','Cola','Itens gerais e pequenos',22,3,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('pano','Pano','Itens gerais e pequenos',22,4,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('saco-pequeno','Saco pequeno','Itens gerais e pequenos',22,5,false,false,false,true,'un',1,NULL,NULL,2,true,NULL),
('caixa-pequena','Caixa pequena','Itens gerais e pequenos',22,6,false,false,false,true,'un',1,NULL,NULL,3,true,NULL),
('agulha','Agulha','Itens gerais e pequenos',22,7,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('linha','Linha','Itens gerais e pequenos',22,8,true,false,false,false,'m',10,NULL,NULL,NULL,false,NULL),
('rolha','Rolha','Itens gerais e pequenos',22,9,true,false,false,false,'un',1,NULL,NULL,NULL,false,NULL),
('correia-de-couro','Correia de couro','Itens gerais e pequenos',22,10,false,false,false,true,'un',1,NULL,NULL,3,true,NULL)
ON CONFLICT (id) DO UPDATE SET
 name=EXCLUDED.name, category=EXCLUDED.category, category_order=EXCLUDED.category_order,
 sort_order=EXCLUDED.sort_order, is_consumable=EXCLUDED.is_consumable,
 is_perishable=EXCLUDED.is_perishable, is_container=EXCLUDED.is_container,
 is_durable=EXCLUDED.is_durable, unit=EXCLUDED.unit, default_amount=EXCLUDED.default_amount,
 capacity_ml=EXCLUDED.capacity_ml, shelf_life_minutes=EXCLUDED.shelf_life_minutes,
 durability_max=EXCLUDED.durability_max, repairable=EXCLUDED.repairable,
 notes=EXCLUDED.notes, updated_at=now();

CREATE OR REPLACE VIEW item_catalog_public AS
SELECT id,name,category,category_order,sort_order,is_consumable,is_perishable,is_container,is_durable,
       unit,default_amount,capacity_ml,shelf_life_minutes,durability_max,repairable,notes
FROM item_catalog ORDER BY category_order,sort_order,name;
GRANT SELECT ON item_catalog_public TO anon, authenticated;

-- ============================================================
-- 2) INSTÂNCIAS / LOTES NO INVENTÁRIO
-- ============================================================
ALTER TABLE character_items
  ADD COLUMN IF NOT EXISTS catalog_item_id text REFERENCES item_catalog(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS capacity_ml integer,
  ADD COLUMN IF NOT EXISTS durability_current integer,
  ADD COLUMN IF NOT EXISTS durability_max integer,
  ADD COLUMN IF NOT EXISTS freshness_minutes_remaining bigint,
  ADD COLUMN IF NOT EXISTS shelf_life_multiplier numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acquired_at timestamptz NOT NULL DEFAULT now();

-- Equipamentos oficiais também participam da durabilidade universal.
UPDATE character_items SET
  durability_max=COALESCE(durability_max,4),
  durability_current=COALESCE(durability_current,4),
  properties=COALESCE(properties,'{}'::jsonb)||jsonb_build_object('durable',true,'repairable',true)
WHERE weapon_id IS NOT NULL OR armor_id IS NOT NULL OR shield_id IS NOT NULL;

-- Recria a inclusão manual/oficial para que novas armas, armaduras e escudos já nasçam com durabilidade 4/4.
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
DECLARE v_id uuid; v_name text; v_type text; v_durability integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.'; END IF;
  IF p_weapon_id IS NOT NULL THEN SELECT name INTO v_name FROM weapons WHERE id=p_weapon_id; v_type:='arma'; v_durability:=4;
  ELSIF p_armor_id IS NOT NULL THEN SELECT name INTO v_name FROM armors WHERE id=p_armor_id; v_type:='armadura'; v_durability:=4;
  ELSIF p_shield_id IS NOT NULL THEN SELECT name INTO v_name FROM shields WHERE id=p_shield_id; v_type:='escudo'; v_durability:=4;
  ELSE v_name:=NULLIF(trim(p_name),''); v_type:=COALESCE(NULLIF(trim(p_type),''),'comum'); v_durability:=NULL; END IF;
  IF v_name IS NULL THEN RAISE EXCEPTION 'Item inválido.'; END IF;
  INSERT INTO character_items(character_id,name,type,quantity,equipped,description,weapon_id,armor_id,shield_id,equip_slot,properties,durability_current,durability_max)
  VALUES(p_character_id,v_name,v_type,GREATEST(1,COALESCE(p_quantity,1)),false,p_description,p_weapon_id,p_armor_id,p_shield_id,NULL,
    jsonb_build_object('hunger_restore',GREATEST(0,COALESCE(p_hunger_restore,0)),'thirst_restore',GREATEST(0,COALESCE(p_thirst_restore,0)),'durable',v_durability IS NOT NULL,'repairable',v_durability IS NOT NULL),
    v_durability,v_durability)
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_character_item(uuid,uuid,text,text,integer,text,text,text,text,integer,integer) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS character_items_catalog_item_idx ON character_items(catalog_item_id);
ALTER TABLE character_items DROP CONSTRAINT IF EXISTS character_items_shelf_life_multiplier_check;
ALTER TABLE character_items ADD CONSTRAINT character_items_shelf_life_multiplier_check CHECK (shelf_life_multiplier > 0);
ALTER TABLE character_items DROP CONSTRAINT IF EXISTS character_items_durability_current_check;
ALTER TABLE character_items ADD CONSTRAINT character_items_durability_current_check CHECK (durability_current IS NULL OR durability_current >= 0);

-- Cada chamada cria uma nova linha: perecíveis de datas diferentes permanecem como lotes distintos.
CREATE OR REPLACE FUNCTION master_add_catalog_item(
  p_master_player_id uuid,
  p_character_id uuid,
  p_catalog_item_id text,
  p_quantity integer DEFAULT 1,
  p_description text DEFAULT NULL,
  p_shelf_life_multiplier numeric DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid; v item_catalog%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Apenas o Mestre pode adicionar itens.';
  END IF;
  SELECT * INTO v FROM item_catalog WHERE id=p_catalog_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item do catálogo não encontrado.'; END IF;
  INSERT INTO character_items(
    character_id,name,type,quantity,equipped,description,equip_slot,properties,
    catalog_item_id,unit,amount,capacity_ml,durability_current,durability_max,
    freshness_minutes_remaining,shelf_life_multiplier
  ) VALUES (
    p_character_id,v.name,
    CASE WHEN v.is_perishable THEN 'perecível' WHEN v.is_consumable THEN 'consumível' WHEN v.is_container THEN 'recipiente' ELSE 'comum' END,
    GREATEST(1,COALESCE(p_quantity,1)),false,COALESCE(p_description,v.notes),NULL,
    jsonb_build_object(
      'consumable',v.is_consumable,'perishable',v.is_perishable,'container',v.is_container,'durable',v.is_durable,
      'repairable',v.repairable,'shelf_life_minutes',v.shelf_life_minutes,'hunger_restore',0,'thirst_restore',0
    ),
    v.id,v.unit,v.default_amount,v.capacity_ml,v.durability_max,v.durability_max,
    v.shelf_life_minutes,GREATEST(0.1,COALESCE(p_shelf_life_multiplier,1))
  ) RETURNING id INTO v_id;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION master_add_catalog_item(uuid,uuid,text,integer,text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_add_catalog_item(uuid,uuid,text,integer,text,numeric) TO anon, authenticated;

CREATE OR REPLACE FUNCTION master_update_character_item_state(
  p_master_player_id uuid,
  p_item_id uuid,
  p_quantity integer DEFAULT NULL,
  p_durability_current integer DEFAULT NULL,
  p_shelf_life_multiplier numeric DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v character_items%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN
    RAISE EXCEPTION 'Apenas o Mestre pode editar itens.';
  END IF;
  SELECT * INTO v FROM character_items WHERE id=p_item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
  UPDATE character_items SET
    quantity=CASE WHEN p_quantity IS NULL THEN quantity ELSE GREATEST(0,p_quantity) END,
    durability_current=CASE WHEN durability_max IS NULL THEN NULL WHEN p_durability_current IS NULL THEN durability_current ELSE LEAST(durability_max,GREATEST(0,p_durability_current)) END,
    shelf_life_multiplier=CASE WHEN p_shelf_life_multiplier IS NULL THEN shelf_life_multiplier ELSE GREATEST(0.1,p_shelf_life_multiplier) END,
    description=COALESCE(p_description,description)
  WHERE id=p_item_id;
  UPDATE character_items SET equip_slot=NULL,equipped=false WHERE id=p_item_id AND durability_current=0;
END $$;
REVOKE ALL ON FUNCTION master_update_character_item_state(uuid,uuid,integer,integer,numeric,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_update_character_item_state(uuid,uuid,integer,integer,numeric,text) TO anon, authenticated;

-- Não permite equipar um objeto quebrado.
CREATE OR REPLACE FUNCTION set_character_item_slot(p_player_id uuid,p_character_id uuid,p_item_id uuid,p_slot text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_is_master boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado.'; END IF;
  IF COALESCE(v_item.durability_current,1)=0 THEN RAISE EXCEPTION 'Este item está quebrado.'; END IF;
  IF p_slot IS NOT NULL AND p_slot NOT IN ('weapon','armor','shield','hand1','hand2') THEN RAISE EXCEPTION 'Slot inválido.'; END IF;
  IF p_slot='weapon' AND v_item.weapon_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma arma do catálogo.'; END IF;
  IF p_slot='armor' AND v_item.armor_id IS NULL THEN RAISE EXCEPTION 'Este item não é uma armadura do catálogo.'; END IF;
  IF p_slot='shield' AND v_item.shield_id IS NULL THEN RAISE EXCEPTION 'Este item não é um escudo do catálogo.'; END IF;
  IF p_slot IS NOT NULL THEN UPDATE character_items SET equip_slot=NULL,equipped=false WHERE character_id=p_character_id AND equip_slot=p_slot AND id<>p_item_id; END IF;
  UPDATE character_items SET equip_slot=p_slot,equipped=(p_slot IS NOT NULL) WHERE id=p_item_id;
END $$;
REVOKE ALL ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_character_item_slot(uuid,uuid,uuid,text) TO anon, authenticated;

-- ============================================================
-- 3) RELÓGIO CENTRAL, FOME/SEDE EM MINUTOS E EFEITOS TEMPORÁRIOS
-- ============================================================
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS hunger_minutes_remainder integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thirst_minutes_remainder integer NOT NULL DEFAULT 0;
UPDATE characters SET
  hunger_minutes_remainder=GREATEST(hunger_minutes_remainder,COALESCE(hunger_hours_remainder,0)*60),
  thirst_minutes_remainder=GREATEST(thirst_minutes_remainder,COALESCE(thirst_hours_remainder,0)*60);

ALTER TABLE character_conditions ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE character_effects
  ADD COLUMN IF NOT EXISTS remaining_minutes bigint,
  ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS trilha_world_clock (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id=1),
  elapsed_minutes bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO trilha_world_clock(id,elapsed_minutes) VALUES(1,0) ON CONFLICT(id) DO NOTHING;
GRANT SELECT ON trilha_world_clock TO anon, authenticated;

CREATE TABLE IF NOT EXISTS trilha_time_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_player_id uuid NOT NULL,
  minutes integer NOT NULL CHECK (minutes>0),
  rest_type text CHECK (rest_type IS NULL OR rest_type IN ('short','long')),
  snapshot jsonb NOT NULL,
  undone boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE trilha_time_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON trilha_time_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION trilha_sync_survival_condition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.status='vivo' AND (COALESCE(NEW.current_hunger,0)=0 OR COALESCE(NEW.current_thirst,0)=0) THEN
    IF NOT EXISTS(SELECT 1 FROM character_conditions WHERE character_id=NEW.id AND source='survival') THEN
      INSERT INTO character_conditions(character_id,condition,intensity,duration,notes,source)
      VALUES(NEW.id,'Desmaiado',NULL,'Até ser recuperado',
        CASE WHEN COALESCE(NEW.current_hunger,0)=0 AND COALESCE(NEW.current_thirst,0)=0 THEN 'Fome e sede chegaram a 0.' WHEN COALESCE(NEW.current_hunger,0)=0 THEN 'Fome chegou a 0.' ELSE 'Sede chegou a 0.' END,
        'survival');
    ELSE
      UPDATE character_conditions SET notes=CASE WHEN COALESCE(NEW.current_hunger,0)=0 AND COALESCE(NEW.current_thirst,0)=0 THEN 'Fome e sede chegaram a 0.' WHEN COALESCE(NEW.current_hunger,0)=0 THEN 'Fome chegou a 0.' ELSE 'Sede chegou a 0.' END WHERE character_id=NEW.id AND source='survival';
    END IF;
  ELSE
    DELETE FROM character_conditions WHERE character_id=NEW.id AND source='survival';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_trilha_survival_condition ON characters;
CREATE TRIGGER trg_trilha_survival_condition AFTER INSERT OR UPDATE OF current_hunger,current_thirst,status ON characters
FOR EACH ROW EXECUTE FUNCTION trilha_sync_survival_condition();

CREATE OR REPLACE FUNCTION master_advance_time(p_master_player_id uuid,p_minutes integer,p_rest_type text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  r record; v_hunger_max integer; v_hunger integer; v_thirst integer; v_ht integer; v_tt integer;
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
    v_vigor:=COALESCE((r.attributes->>'Vigor')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Vigor')::integer,0);
    v_hunger_max:=GREATEST(1,9-v_vigor);
    v_before_hunger:=LEAST(COALESCE(r.current_hunger,v_hunger_max),v_hunger_max);
    v_before_thirst:=LEAST(COALESCE(r.current_thirst,6),6);
    v_before_hp:=COALESCE(r.current_hp,15+v_vigor*5+(GREATEST(1,r.level)-1)*2);

    v_mental:=GREATEST(
      COALESCE((r.attributes->>'Inteligência')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Inteligência')::integer,0),
      COALESCE((r.attributes->>'Raciocínio')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Raciocínio')::integer,0),
      COALESCE((r.attributes->>'Sabedoria')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Sabedoria')::integer,0),
      COALESCE((r.attributes->>'Percepção')::integer,0)+COALESCE((r.racial_attribute_bonus->>'Percepção')::integer,0)
    );
    v_mystical:=GREATEST(
      COALESCE((r.skills->>'Elementalismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Elementalismo')::integer,0),
      COALESCE((r.skills->>'Arcanismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Arcanismo')::integer,0),
      COALESCE((r.skills->>'Ritualismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Ritualismo')::integer,0),
      COALESCE((r.skills->>'Manipulação Arcana')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Manipulação Arcana')::integer,0),
      COALESCE((r.skills->>'Teologia')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Teologia')::integer,0),
      COALESCE((r.skills->>'Espiritualismo')::integer,0)+COALESCE((r.lineage_skill_bonuses->>'Espiritualismo')::integer,0)
    );
    v_hpmax:=15+v_vigor*5+(GREATEST(1,r.level)-1)*2;
    v_mpmax:=CASE WHEN v_mystical>0 THEN 5+v_mental*2+v_mystical*2+GREATEST(1,r.level) ELSE 0 END;
    v_before_mp:=COALESCE(r.current_mp,v_mpmax);

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

  UPDATE character_effects SET
    remaining_minutes=GREATEST(0,remaining_minutes-p_minutes),
    active=(remaining_minutes-p_minutes)>0
  WHERE active=true AND is_permanent=false AND remaining_minutes IS NOT NULL;
  SELECT count(*) INTO v_effects_expired FROM character_effects WHERE active=false AND is_permanent=false AND remaining_minutes=0 AND id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'effects') x WHERE COALESCE((x->>'active')::boolean,false)=true);

  UPDATE character_items SET freshness_minutes_remaining=GREATEST(0,
    freshness_minutes_remaining-CEIL(p_minutes/GREATEST(0.1,shelf_life_multiplier))::bigint)
  WHERE freshness_minutes_remaining IS NOT NULL AND freshness_minutes_remaining>0;
  SELECT count(*) INTO v_items_spoiled FROM character_items ci
    WHERE ci.freshness_minutes_remaining=0 AND ci.id IN (SELECT (x->>'id')::uuid FROM jsonb_array_elements(v_snapshot->'items') x WHERE COALESCE((x->>'freshness_minutes_remaining')::bigint,0)>0);

  UPDATE trilha_world_clock SET elapsed_minutes=elapsed_minutes+p_minutes,updated_at=now() WHERE id=1;
  INSERT INTO trilha_time_events(master_player_id,minutes,rest_type,snapshot) VALUES(p_master_player_id,p_minutes,p_rest_type,v_snapshot) RETURNING id INTO v_event_id;

  RETURN jsonb_build_object('event_id',v_event_id,'minutes',p_minutes,'rest_type',p_rest_type,'characters',v_characters,'effects_expired',v_effects_expired,'items_spoiled',v_items_spoiled,'elapsed_minutes',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1));
END $$;
REVOKE ALL ON FUNCTION master_advance_time(uuid,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION master_advance_time(uuid,integer,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION undo_last_time_advance(p_master_player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e trilha_time_events%ROWTYPE; x jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id=p_master_player_id AND player_identifier='Mestre') THEN RAISE EXCEPTION 'Apenas o Mestre pode desfazer o tempo.'; END IF;
  SELECT * INTO e FROM trilha_time_events WHERE undone=false ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Não há avanço de tempo para desfazer.'; END IF;

  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'characters') LOOP
    UPDATE characters SET current_hp=(x->>'current_hp')::integer,current_mp=(x->>'current_mp')::integer,
      current_hunger=(x->>'current_hunger')::integer,current_thirst=(x->>'current_thirst')::integer,
      hunger_minutes_remainder=COALESCE((x->>'hunger_minutes_remainder')::integer,0),thirst_minutes_remainder=COALESCE((x->>'thirst_minutes_remainder')::integer,0),
      hunger_hours_remainder=COALESCE((x->>'hunger_hours_remainder')::integer,0),thirst_hours_remainder=COALESCE((x->>'thirst_hours_remainder')::integer,0)
    WHERE id=(x->>'id')::uuid;
  END LOOP;
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'effects') LOOP
    UPDATE character_effects SET remaining_minutes=NULLIF(x->>'remaining_minutes','')::bigint,active=COALESCE((x->>'active')::boolean,true) WHERE id=(x->>'id')::uuid;
  END LOOP;
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'items') LOOP
    UPDATE character_items SET freshness_minutes_remaining=NULLIF(x->>'freshness_minutes_remaining','')::bigint WHERE id=(x->>'id')::uuid;
  END LOOP;
  DELETE FROM character_conditions WHERE source='survival';
  FOR x IN SELECT * FROM jsonb_array_elements(e.snapshot->'survival_conditions') LOOP
    INSERT INTO character_conditions(character_id,condition,intensity,duration,notes,source)
    VALUES((x->>'character_id')::uuid,x->>'condition',NULLIF(x->>'intensity','')::integer,x->>'duration',x->>'notes',x->>'source');
  END LOOP;
  UPDATE trilha_world_clock SET elapsed_minutes=GREATEST(0,COALESCE((e.snapshot->>'clock')::bigint,0)),updated_at=now() WHERE id=1;
  UPDATE trilha_time_events SET undone=true WHERE id=e.id;
  RETURN jsonb_build_object('event_id',e.id,'minutes',e.minutes,'rest_type',e.rest_type,'elapsed_minutes',(SELECT elapsed_minutes FROM trilha_world_clock WHERE id=1));
END $$;
REVOKE ALL ON FUNCTION undo_last_time_advance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION undo_last_time_advance(uuid) TO anon, authenticated;

-- Consumir item estragado não concede recuperação automática; pode ser tratado narrativamente pelo Mestre.
CREATE OR REPLACE FUNCTION consume_character_item(p_player_id uuid,p_character_id uuid,p_item_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_item character_items%ROWTYPE; v_hunger_restore integer; v_thirst_restore integer; v_hunger_max integer; v_is_master boolean; v_new_hunger integer; v_new_thirst integer;
BEGIN
  SELECT EXISTS(SELECT 1 FROM players p WHERE p.id=p_player_id AND p.player_identifier='Mestre') INTO v_is_master;
  IF NOT v_is_master AND NOT EXISTS(SELECT 1 FROM characters c WHERE c.id=p_character_id AND c.player_id=p_player_id) THEN RAISE EXCEPTION 'Personagem não pertence ao jogador.'; END IF;
  SELECT * INTO v_item FROM character_items WHERE id=p_item_id AND character_id=p_character_id FOR UPDATE;
  IF NOT FOUND OR v_item.quantity<=0 THEN RAISE EXCEPTION 'Consumível indisponível.'; END IF;
  IF v_item.freshness_minutes_remaining IS NOT NULL AND v_item.freshness_minutes_remaining<=0 THEN RAISE EXCEPTION 'Este alimento está estragado. O Mestre decide os efeitos de consumi-lo.'; END IF;
  v_hunger_restore:=GREATEST(0,COALESCE((v_item.properties->>'hunger_restore')::integer,0));
  v_thirst_restore:=GREATEST(0,COALESCE((v_item.properties->>'thirst_restore')::integer,0));
  IF v_hunger_restore=0 AND v_thirst_restore=0 THEN RAISE EXCEPTION 'Este item ainda não possui recuperação de Fome ou Sede definida.'; END IF;
  SELECT GREATEST(1,9-(COALESCE((attributes->>'Vigor')::integer,0)+COALESCE((racial_attribute_bonus->>'Vigor')::integer,0))),COALESCE(current_hunger,0),COALESCE(current_thirst,0)
    INTO v_hunger_max,v_new_hunger,v_new_thirst FROM characters WHERE id=p_character_id FOR UPDATE;
  v_new_hunger:=LEAST(v_hunger_max,v_new_hunger+v_hunger_restore); v_new_thirst:=LEAST(6,v_new_thirst+v_thirst_restore);
  UPDATE characters SET current_hunger=v_new_hunger,current_thirst=v_new_thirst WHERE id=p_character_id;
  IF v_item.quantity<=1 THEN DELETE FROM character_items WHERE id=p_item_id; ELSE UPDATE character_items SET quantity=quantity-1 WHERE id=p_item_id; END IF;
END $$;
REVOKE ALL ON FUNCTION consume_character_item(uuid,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_character_item(uuid,uuid,uuid) TO anon, authenticated;


-- ===== ATUALIZAÇÃO 051026.01 =====
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


COMMIT;
