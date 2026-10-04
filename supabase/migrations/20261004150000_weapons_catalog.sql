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
