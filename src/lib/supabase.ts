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

  // Atributos e Habilidades
  attributes: Record<string, number>;
  skills: Record<string, number>;
  racial_attribute_bonus?: Record<string, number>;
  lineage_skill_bonuses?: Record<string, number>;

  // Recursos atuais
  current_hp: number | null;
  current_mp: number | null;

  // Estado e apresentação
  status: 'vivo' | 'morto' | 'desaparecido';
  thumbnail_url: string | null;

  created_at: string;
};
