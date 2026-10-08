import type { Character } from '@/lib/supabase';

export const HUNGER_MAX = 9;
export const THIRST_MAX = 6;
export const HUNGER_INTERVAL_HOURS = 8;
export const THIRST_INTERVAL_HOURS = 6;

type AttributeCarrier = Pick<Character, 'attributes'>;
type SkillCarrier = Pick<Character, 'skills'>;

export function attributeValue(character: AttributeCarrier, key: string): number {
  return Number(character.attributes?.[key] ?? 0);
}

export function skillValue(character: SkillCarrier, key: string): number {
  return Number(character.skills?.[key] ?? 0);
}

export function characterMaxHp(character: Pick<Character, 'attributes' | 'level'>): number {
  return 15 + attributeValue(character, 'Vigor') * 5 + (Math.max(1, Number(character.level || 1)) - 1) * 2;
}

export function characterMaxMp(character: Pick<Character, 'attributes' | 'skills' | 'level'>): number {
  const mental = Math.max(...['Inteligência', 'Raciocínio', 'Sabedoria', 'Percepção'].map(key => attributeValue(character, key)));
  const mystical = Math.max(...['Arcanismo', 'Ocultismo', 'Teologia'].map(key => skillValue(character, key)));
  return mystical > 0 ? 5 + mental * 2 + mystical * 2 + Math.max(1, Number(character.level || 1)) : 0;
}

export function characterHungerMax(_character?: Partial<Character>): number {
  return HUNGER_MAX;
}

export function characterInitiative(character: AttributeCarrier): number {
  return attributeValue(character, 'Percepção') + attributeValue(character, 'Raciocínio');
}
