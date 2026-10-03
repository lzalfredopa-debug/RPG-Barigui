import type { Character } from '@/lib/supabase';

type Gender = 'ele' | 'ela' | 'elu' | 'neutro' | string | null;

export function characterWords(character: Pick<Character, 'name' | 'gender'>) {
  const g: Gender = character.gender;
  if (g === 'ela') return { nome: character.name, ele: 'ela', dele: 'dela', mesmo: 'mesma', afetado: 'afetada', protegido: 'protegida', preparado: 'preparada' };
  if (g === 'ele') return { nome: character.name, ele: 'ele', dele: 'dele', mesmo: 'mesmo', afetado: 'afetado', protegido: 'protegido', preparado: 'preparado' };
  if (g === 'elu') return { nome: character.name, ele: 'elu', dele: 'delu', mesmo: 'a própria pessoa', afetado: 'sob o efeito', protegido: 'sob proteção', preparado: 'com preparo' };
  return { nome: character.name, ele: character.name, dele: `de ${character.name}`, mesmo: 'a própria pessoa', afetado: 'sob o efeito', protegido: 'sob proteção', preparado: 'com preparo' };
}

/**
 * Textos de sistema podem usar: {nome}, {ele}, {dele}, {mesmo},
 * {afetado}, {protegido} e {preparado}. Para gênero neutro, a função
 * prefere construções sem flexão sempre que possível.
 */
export function renderCharacterText(text: string | null | undefined, character: Pick<Character, 'name' | 'gender'>) {
  if (!text) return '';
  const words = characterWords(character) as Record<string, string>;
  return text.replace(/\{(nome|ele|dele|mesmo|afetado|protegido|preparado)\}/g, (_, key: string) => words[key] ?? _);
}
