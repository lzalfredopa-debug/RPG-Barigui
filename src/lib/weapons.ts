import type { Character, WeaponMaster } from '@/lib/supabase';

export type WeaponDamageResult = {
  proficiencyDeficit: number;
  isProficient: boolean;
  effectiveBaseDamage: number;
  grossDamage: number;
  finalDamage: number;
};

const effectiveAttribute = (character: Character, key: string | null) =>
  key ? (character.attributes?.[key] ?? 0) : 0;

const effectiveSkill = (character: Character, key: string | null) =>
  key ? (character.skills?.[key] ?? 0) : 0;

export function weaponProficiencyDeficit(character: Character, weapon: WeaponMaster) {
  const attributeDeficit = Math.max(
    0,
    weapon.requirement_attribute_min - effectiveAttribute(character, weapon.requirement_attribute),
  );
  const skillDeficit = Math.max(
    0,
    weapon.requirement_skill_min - effectiveSkill(character, weapon.requirement_skill),
  );
  return attributeDeficit + skillDeficit;
}

export function calculateWeaponDamage(
  character: Character,
  weapon: WeaponMaster,
  excessSuccesses = 0,
  armorAbsorption = 0,
): WeaponDamageResult {
  const proficiencyDeficit = weaponProficiencyDeficit(character, weapon);
  const effectiveBaseDamage = weapon.damage_base === 0
    ? 0
    : Math.max(1, weapon.damage_base - proficiencyDeficit);
  const grossDamage = effectiveBaseDamage + Math.max(0, excessSuccesses);
  const finalDamage = weapon.damage_base === 0
    ? 0
    : Math.max(1, grossDamage - Math.max(0, armorAbsorption));

  return {
    proficiencyDeficit,
    isProficient: proficiencyDeficit === 0,
    effectiveBaseDamage,
    grossDamage,
    finalDamage,
  };
}
