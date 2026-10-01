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
};


export type Character = {
  id: string;
  player_id: string;
  name: string;
  nickname: string | null;
  age: number;
  gender: string | null;
  race: string;
  lineage: string;
  level: number;
  class_name: string;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  created_at: string;
};
