export type LineageDefinition = { id:string; race_id:string; name:string; description:string; image_url:string; skill_group_1:string; skill_group_2:string };
export type RaceDefinition = { id:string; name:string; description:string; image_url:string; attribute_mode:'any'|'physical'|'mental'|'social'|'fixed'; fixed_attribute:string|null; lineages:LineageDefinition[] };

export const LINEAGE_GROUPS: Record<string,[string,string]> = {
  'humanos-terrano':['Campo & Ofício','Conhecimento & Doutrina'], 'humanos-altaneiro':['Marcial','Campo & Ofício'], 'humanos-maritimo':['Campo & Ofício','Sociedade, Cultura & Expressão'],
  'elfos-silvestre':['Campo & Ofício','Marcial'], 'elfos-astral':['Conhecimento & Doutrina','Conhecimento & Doutrina'], 'elfos-profundo':['Sociedade, Cultura & Expressão','Conhecimento & Doutrina'],
  'anoes-granitico':['Marcial','Campo & Ofício'], 'anoes-igneo':['Campo & Ofício','Campo & Ofício'], 'anoes-cristalino':['Sociedade, Cultura & Expressão','Conhecimento & Doutrina'],
  'orcs-colossal':['Marcial','Marcial'], 'orcs-glacial':['Marcial','Campo & Ofício'], 'orcs-rubro':['Marcial','Sociedade, Cultura & Expressão'],
  'pequeninos-campestre':['Campo & Ofício','Conhecimento & Doutrina'], 'pequeninos-brumoso':['Campo & Ofício','Sociedade, Cultura & Expressão'], 'pequeninos-ribeirinho':['Campo & Ofício','Campo & Ofício'],
  'goblins-cavernicola':['Marcial','Campo & Ofício'], 'goblins-arboricola':['Campo & Ofício','Campo & Ofício'], 'goblins-ferruginoso':['Campo & Ofício','Conhecimento & Doutrina'],
  'tiferinos-infernal':['Sociedade, Cultura & Expressão','Conhecimento & Doutrina'], 'tiferinos-abissal':['Conhecimento & Doutrina','Conhecimento & Doutrina'], 'tiferinos-umbratico':['Campo & Ofício','Conhecimento & Doutrina'],
  'povo-fungico-micelar':['Conhecimento & Doutrina','Sociedade, Cultura & Expressão'], 'povo-fungico-chapeleiro':['Campo & Ofício','Conhecimento & Doutrina'], 'povo-fungico-luminescente':['Conhecimento & Doutrina','Conhecimento & Doutrina'],
  'draconatos-metalico':['Marcial','Sociedade, Cultura & Expressão'], 'draconatos-cromatico':['Marcial','Conhecimento & Doutrina'], 'draconatos-gematico':['Conhecimento & Doutrina','Sociedade, Cultura & Expressão'],
  'povo-fera-felino':['Marcial','Campo & Ofício'], 'povo-fera-canideo':['Campo & Ofício','Sociedade, Cultura & Expressão'], 'povo-fera-aviano':['Campo & Ofício','Conhecimento & Doutrina'],
};
export const RACE_RULES: Record<string,{mode:RaceDefinition['attribute_mode'];fixed:string|null}> = {
  humanos:{mode:'any',fixed:null}, elfos:{mode:'mental',fixed:null}, anoes:{mode:'fixed',fixed:'Vigor'}, orcs:{mode:'fixed',fixed:'Força'}, pequeninos:{mode:'fixed',fixed:'Agilidade'}, goblins:{mode:'fixed',fixed:'Destreza'}, tiferinos:{mode:'social',fixed:null}, 'povo-fungico':{mode:'fixed',fixed:'Sabedoria'}, draconatos:{mode:'fixed',fixed:'Presença'}, 'povo-fera':{mode:'physical',fixed:null},
};
export const attributeChoices=(mode:RaceDefinition['attribute_mode'], all:string[])=> mode==='any'?all:mode==='physical'?['Força','Vigor','Agilidade','Destreza']:mode==='mental'?['Inteligência','Raciocínio','Sabedoria','Percepção']:mode==='social'?['Carisma','Presença','Manipulação','Empatia']:[];

export const raceBenefitText=(race:Partial<RaceDefinition> & {id?:string})=>{
  const rule=(race.id&&RACE_RULES[race.id])||{mode:race.attribute_mode||'fixed',fixed:race.fixed_attribute||null};
  if(rule.mode==='fixed') return rule.fixed ? `+1 ${rule.fixed}` : '+1 em um Atributo definido pela raça';
  if(rule.mode==='physical') return '+1 em um Atributo Físico à escolha (Força, Vigor, Agilidade ou Destreza)';
  if(rule.mode==='mental') return '+1 em um Atributo Mental à escolha (Inteligência, Raciocínio, Sabedoria ou Percepção)';
  if(rule.mode==='social') return '+1 em um Atributo Social à escolha (Carisma, Presença, Manipulação ou Empatia)';
  return '+1 em qualquer Atributo à escolha';
};

export const lineageBenefitText=(lineage:Partial<LineageDefinition> & {id?:string})=>{
  const fallback=(lineage.id&&LINEAGE_GROUPS[lineage.id])||['',''];
  const first=lineage.skill_group_1||fallback[0];
  const second=lineage.skill_group_2||fallback[1];
  if(!first&&!second) return '+1 em duas Habilidades definidas pela linhagem';
  if(first===second) return `+1 em duas Habilidades diferentes de ${first} à escolha`;
  return `+1 em uma Habilidade de ${first} e +1 em uma Habilidade de ${second}`;
};

