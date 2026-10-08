import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Player = {
  id: string;
  alcunha: string;
  status: 'ativa' | 'espera';
  player_name: string | null;
  player_identifier: string | null;
  character_creation_allowed?: boolean;
};

export type PersonalNote = {
  id: string;
  player_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type MasterMessage = {
  id: string;
  player_id: string;
  content: string;
  created_at: string;
};

export type PlayerMessage = {
  id: string;
  player_id: string;
  content: string;
  created_at: string;
};

export type Suggestion = {
  id: string;
  player_id: string;
  content: string;
  created_at: string;
  status?: 'nova' | 'lida' | 'resolvida';
};




export type WeaponPublic = {
  id: string;
  name: string;
  family: string;
  weight_kg: number | null;
  durability_max: number | null;
};

export type WeaponMaster = WeaponPublic & {
  damage_base: number;
  damage_type: string;
  attack_attribute: string;
  attack_skill: string;
  requirement_attribute: string | null;
  requirement_attribute_min: number;
  requirement_skill: string | null;
  requirement_skill_min: number;
  hands: number;
  range_label: string;
  special_rule: string | null;
  sort_order: number;
};


export type ArmorPublic = {
  id: string;
  name: string;
  category: 'Leve' | 'Média' | 'Pesada';
  weight_kg: number | null;
  durability_max: number | null;
};

export type ArmorMaster = ArmorPublic & {
  absorption: number;
  requirement_attribute: string | null;
  requirement_attribute_min: number;
  requirement_skill: string | null;
  requirement_skill_min: number;
  evasion_penalty: number;
  movement_penalty: number;
  sort_order: number;
};

export type ShieldPublic = {
  id: string;
  name: string;
  weight_kg: number | null;
  durability_max: number | null;
};

export type ShieldMaster = ShieldPublic & {
  block_attribute: string;
  block_bonus: number;
  requirement_attribute: string | null;
  requirement_attribute_min: number;
  requirement_skill: string | null;
  requirement_skill_min: number;
  evasion_penalty: number;
  movement_penalty: number;
  sort_order: number;
};

export type CombatEquipmentSummary = {
  weapon_item_id: string | null;
  weapon_name: string | null;
  weapon_effective_damage: number | null;
  weapon_is_proficient: boolean | null;
  armor_item_id: string | null;
  armor_name: string | null;
  armor_effective_absorption: number;
  armor_is_proficient: boolean | null;
  armor_evasion_penalty: number;
  armor_movement_penalty: number;
  shield_item_id: string | null;
  shield_name: string | null;
  shield_effective_bonus: number;
  shield_is_proficient: boolean | null;
  shield_block_attribute: string;
  shield_evasion_penalty: number;
  shield_movement_penalty: number;
  hand1_item_id: string | null;
  hand1_name: string | null;
  hand2_item_id: string | null;
  hand2_name: string | null;
};


export type CombatTarget = {
  id: string;
  name: string;
  target_type?: 'character' | 'enemy';
  state?: string | null;
};

export type CombatAction = {
  id: string;
  attacker_player_id: string | null;
  attacker_character_id: string | null;
  attacker_enemy_id?: string | null;
  attacker_name: string;
  target_character_id: string | null;
  target_enemy_id?: string | null;
  target_name: string;
  weapon_name: string;
  attack_attribute: string;
  attack_skill: string;
  attack_pool: number;
  attack_results: number[];
  attack_explosion_count: number;
  defense_kind: 'evasion' | 'block' | 'passive' | null;
  defense_source: string | null;
  defense_pool: number | null;
  defense_results: number[] | null;
  defense_explosion_count: number;
  defense_passive_successes: number | null;
  difficulty: number | null;
  attack_successes: number | null;
  defense_successes: number | null;
  excess_successes: number | null;
  damage_final: number | null;
  target_hp_after: number | null;
  status: 'awaiting_defense' | 'awaiting_master' | 'resolved' | 'void';
  created_at: string;
  updated_at: string;
};

export type ClassNode = {
  id: string;
  root_class: string;
  stage: 'Iniciante' | 'Competente' | 'Proficiente' | 'Especialista';
  stage_order: number;
  level_min: number;
  level_max: number;
  name: string;
  description: string;
  parent_id: string | null;
  parent_name: string | null;
  attribute_fixed: string | null;
  attribute_alternative_a: string | null;
  attribute_alternative_b: string | null;
  attributes_base: string | null;
  primary_skill: string | null;
  secondary_skill: string | null;
  primary_theme: string | null;
  secondary_theme: string | null;
  requirement_text: string;
  requirements: Record<string, unknown>;
  requirement_status: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type Character = {
  id: string;
  player_id: string;

  // Identidade
  name: string;
  nickname: string | null;
  age: number;
  gender: string | null;
  race: string;
  lineage: string;
  is_hybrid?: boolean;
  secondary_race?: string | null;
  secondary_lineage?: string | null;
  height: string | null;
  weight: string | null;
  appearance: string | null;
  distinctive_marks: string | null;
  origin: string | null;
  previous_occupation: string | null;

  // Personalidade & História
  personality: string | null;
  ideals: string | null;
  motivation: string | null;
  important_bond: string | null;
  brief_history: string | null;
  additional_characteristics: string | null;

  // Progressão
  level: number;
  class_name: string | null;
  specialization: string | null;
  v15_attribute_points_spent?: number;
  v15_skill_points_spent?: number;

  // Atributos e Habilidades
  attributes: Record<string, number>;
  skills: Record<string, number>;
  racial_attribute_bonus?: Record<string, number>;
  lineage_skill_bonuses?: Record<string, number>;

  // Recursos atuais
  current_hp: number | null;
  current_mp: number | null;
  current_hunger?: number | null;
  current_thirst?: number | null;
  combat_action_available?: boolean;
  combat_movement_available?: boolean;
  combat_reaction_available?: boolean;
  hunger_hours_remainder?: number;
  thirst_hours_remainder?: number;
  currency_obolos?: number;
  currency_dracmas?: number;
  currency_estaters?: number;

  // Estado e apresentação
  status: 'vivo' | 'morto' | 'desaparecido';
  thumbnail_url: string | null;

  created_at: string;
};

export type ItemCatalogPublic = {
  id: string;
  name: string;
  category: string;
  category_order: number;
  sort_order: number;
  is_consumable: boolean;
  is_perishable: boolean;
  is_container: boolean;
  is_durable: boolean;
  unit: string;
  default_amount: number;
  capacity_ml: number | null;
  shelf_life_minutes: number | null;
  durability_max: number | null;
  repairable: boolean;
  notes: string | null;
  weight_kg: number | null;
  consumption_kind: 'food' | 'water' | null;
  portion_amount: number | null;
  restore_points: number;
  carry_slot_kind: 'main' | 'auxiliary' | null;
  carry_bonus_kg: number;
  body_weightless: boolean;
};

export type TimeAdvanceCharacterChange = {
  id: string;
  name: string;
  hunger_before: number;
  hunger_after: number;
  thirst_before: number;
  thirst_after: number;
  hp_before: number;
  hp_after: number;
  mp_before: number;
  mp_after: number;
};

export type TimeAdvanceSummary = {
  event_id: string;
  minutes: number;
  rest_type: 'short' | 'long' | null;
  characters: TimeAdvanceCharacterChange[];
  effects_expired: number;
  items_spoiled: number;
  elapsed_minutes: number;
};
