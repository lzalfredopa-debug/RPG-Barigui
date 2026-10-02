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

  // Recursos atuais
  current_hp: number | null;
  current_mp: number | null;

  // Estado e apresentação
  status: 'vivo' | 'morto' | 'desaparecido';
  thumbnail_url: string | null;

  created_at: string;
};
