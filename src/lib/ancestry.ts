export type LineageDefinition = {
  id: string;
  race_id: string;
  name: string;
  description: string;
  tagline?: string;
  image_url: string;
  // Campos legados permanecem no banco apenas por compatibilidade da TRILHA 1.
  // Na TRILHA 1.5 não concedem bônus mecânicos.
  skill_group_1: string;
  skill_group_2: string;
};

export type RaceDefinition = {
  id: string;
  name: string;
  description: string;
  tagline?: string;
  image_url: string;
  // Campos legados permanecem no banco apenas por compatibilidade.
  // Povo e Vertente são escolhas narrativas/culturais na TRILHA 1.5.
  attribute_mode: 'any' | 'physical' | 'mental' | 'social' | 'fixed';
  fixed_attribute: string | null;
  lineages: LineageDefinition[];
};
