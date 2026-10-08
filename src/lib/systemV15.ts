export type AttributeName =
  | 'Força' | 'Vigor' | 'Agilidade' | 'Destreza'
  | 'Presença' | 'Carisma' | 'Manipulação' | 'Empatia'
  | 'Percepção' | 'Raciocínio' | 'Inteligência' | 'Sabedoria';

export type AttributeDefinition = {
  name: AttributeName;
  description: string;
  examples: string;
};

export type AttributeGroup = {
  name: 'Físicos' | 'Sociais' | 'Mentais';
  attributes: AttributeDefinition[];
};

export type SkillDefinition = {
  name: string;
  description: string;
  examples: string;
};

export type SkillGroup = {
  name: 'Ação & Exploração' | 'Sociedade & Vivência' | 'Conhecimento & Técnica';
  skills: SkillDefinition[];
};

export type InitialClassPath = {
  id: string;
  name: string;
  primaryAttribute: AttributeName;
  requiredSkill: string;
  requiredAttributeMin: number;
  requiredSkillMin: number;
  sortOrder: number;
};

export const ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    name: 'Físicos',
    attributes: [
      { name: 'Força', description: 'Potência muscular e capacidade de aplicar força.', examples: 'Erguer, empurrar, quebrar, golpear e sustentar peso.' },
      { name: 'Vigor', description: 'Resistência física e capacidade de suportar esforço.', examples: 'Fadiga, dor, venenos, privação e resistência prolongada.' },
      { name: 'Agilidade', description: 'Rapidez, equilíbrio e controle corporal.', examples: 'Esquivar, saltar, equilibrar-se e mudar de direção.' },
      { name: 'Destreza', description: 'Precisão e coordenação manual.', examples: 'Mirar, manipular mecanismos e executar movimentos delicados.' },
    ],
  },
  {
    name: 'Sociais',
    attributes: [
      { name: 'Presença', description: 'Impacto pessoal e capacidade de ocupar espaço.', examples: 'Intimidar, comandar, discursar e impor autoridade.' },
      { name: 'Carisma', description: 'Capacidade de cativar, aproximar e inspirar simpatia.', examples: 'Persuadir, entreter, acolher e inspirar.' },
      { name: 'Manipulação', description: 'Capacidade de influenciar de maneira indireta.', examples: 'Blefar, dissimular, conduzir interesses e explorar brechas sociais.' },
      { name: 'Empatia', description: 'Capacidade de compreender pessoas e emoções.', examples: 'Perceber intenções, aconselhar, mediar e criar vínculos.' },
    ],
  },
  {
    name: 'Mentais',
    attributes: [
      { name: 'Percepção', description: 'Atenção ao ambiente e aos sinais ao redor.', examples: 'Observar, ouvir, procurar e notar mudanças sutis.' },
      { name: 'Raciocínio', description: 'Lógica e capacidade de construir soluções.', examples: 'Deduzir, calcular, planejar e improvisar.' },
      { name: 'Inteligência', description: 'Conhecimento adquirido e capacidade de aprender.', examples: 'Estudar, recordar, interpretar e dominar conhecimento técnico.' },
      { name: 'Sabedoria', description: 'Julgamento, experiência e compreensão prática.', examples: 'Bom senso, leitura de contexto, prudência e discernimento.' },
    ],
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    name: 'Ação & Exploração',
    skills: [
      { name: 'Atletismo', description: 'Esforço físico aplicado a deslocamento e superação de obstáculos.', examples: 'Correr, escalar, nadar, saltar e carregar.' },
      { name: 'Acrobacia', description: 'Controle corporal em movimentos técnicos e arriscados.', examples: 'Equilíbrio, quedas, giros e passagens estreitas.' },
      { name: 'Furtividade', description: 'Agir ou deslocar-se evitando ser percebido.', examples: 'Esconder-se, infiltrar-se e mover-se silenciosamente.' },
      { name: 'Prestidigitação', description: 'Precisão manual rápida ou discreta.', examples: 'Truques de mãos, pequenos furtos e ocultar objetos.' },
      { name: 'Luta', description: 'Combate usando o próprio corpo.', examples: 'Socos, chutes, agarrões e imobilizações.' },
      { name: 'Esgrima', description: 'Uso técnico de armas brancas empunhadas.', examples: 'Espadas, sabres, lanças curtas e aparos.' },
      { name: 'Tiro', description: 'Ataques realizados a distância com armas de projétil.', examples: 'Arcos, bestas, fundas e outras armas de disparo.' },
      { name: 'Defesa', description: 'Evitar, aparar ou neutralizar ataques.', examples: 'Esquiva, guarda, bloqueio e postura defensiva.' },
      { name: 'Emboscada', description: 'Preparar e executar ações a partir de surpresa e posição.', examples: 'Tocaia, escolha de terreno e ataque inesperado.' },
      { name: 'Sobrevivência', description: 'Permanecer seguro e obter recursos fora de áreas estruturadas.', examples: 'Abrigo, água, alimento, fogo e reconhecer riscos naturais.' },
      { name: 'Exploração', description: 'Investigar e atravessar lugares desconhecidos.', examples: 'Ruínas, cavernas, passagens, reconhecimento e mapeamento.' },
      { name: 'Navegação', description: 'Determinar posição, direção e trajetos.', examples: 'Mapas, estrelas, bússola e planejamento de rotas.' },
      { name: 'Condução', description: 'Controlar veículos e meios de transporte.', examples: 'Carroças, carruagens, trenós, barcos simples e manobras.' },
      { name: 'Trato Animal', description: 'Lidar, compreender e conduzir animais.', examples: 'Montarias, acalmar, cuidar, treinar e interpretar comportamento.' },
    ],
  },
  {
    name: 'Sociedade & Vivência',
    skills: [
      { name: 'Persuasão', description: 'Convencer alguém por argumentos ou apelo pessoal.', examples: 'Negociar apoio, apresentar razões e influenciar decisões.' },
      { name: 'Enganação', description: 'Fazer outras pessoas aceitarem informações falsas ou incompletas.', examples: 'Mentir, blefar, inventar histórias e esconder intenções.' },
      { name: 'Intimidação', description: 'Pressionar alguém pelo medo, autoridade ou ameaça.', examples: 'Coagir, impor respeito e desencorajar oposição.' },
      { name: 'Negociação', description: 'Construir acordos por troca de interesses e concessões.', examples: 'Barganhar, contratos, preços e condições.' },
      { name: 'Mediação', description: 'Facilitar entendimento entre partes em desacordo.', examples: 'Conciliar conflitos, reduzir tensão e formular compromissos.' },
      { name: 'Etiqueta', description: 'Conhecer comportamentos esperados em diferentes ambientes sociais.', examples: 'Protocolos, cerimônias, formalidades e costumes.' },
      { name: 'Liderança', description: 'Organizar, motivar e orientar pessoas.', examples: 'Coordenar grupos, inspirar aliados e dar ordens claras.' },
      { name: 'Intuição', description: 'Perceber emoções, intenções e incoerências humanas.', examples: 'Ler clima social, notar desconforto e desconfiar de motivações.' },
      { name: 'Expressão', description: 'Comunicar ideias e emoções por performance ou arte.', examples: 'Música, atuação, poesia, oratória e artes visuais.' },
      { name: 'Linguística', description: 'Compreender e utilizar idiomas, escrita e estruturas de linguagem.', examples: 'Traduzir, decifrar, interpretar sotaques e estudar idiomas.' },
      { name: 'Tradições', description: 'Conhecer práticas, costumes, histórias e hábitos de comunidades.', examples: 'Festas, crenças populares, ritos, costumes e memória oral.' },
      { name: 'Submundo', description: 'Conhecer redes clandestinas e práticas ilícitas.', examples: 'Contrabando, golpes, contatos, códigos e mercados paralelos.' },
      { name: 'Política', description: 'Entender relações de poder, instituições e interesses coletivos.', examples: 'Facções, alianças, influência, leis e disputas de poder.' },
      { name: 'Avaliação', description: 'Estimar valor, qualidade, autenticidade ou condição de algo.', examples: 'Mercadorias, obras, documentos, joias e equipamentos.' },
    ],
  },
  {
    name: 'Conhecimento & Técnica',
    skills: [
      { name: 'Investigação', description: 'Reunir pistas e construir explicações a partir de evidências.', examples: 'Cenas, documentos, padrões, testemunhos e dedução.' },
      { name: 'História', description: 'Conhecer eventos, povos, locais e processos do passado.', examples: 'Guerras, dinastias, cidades, personagens e cronologias.' },
      { name: 'Natureza', description: 'Compreender ambientes, seres vivos e fenômenos naturais.', examples: 'Fauna, flora, clima, ecossistemas e perigos naturais.' },
      { name: 'Medicina', description: 'Conhecer corpo, doenças, ferimentos e tratamentos.', examples: 'Diagnóstico, primeiros socorros, anatomia e recuperação.' },
      { name: 'Culinária', description: 'Preparar, conservar e avaliar alimentos e bebidas.', examples: 'Cozimento, fermentação, conservação e improviso com ingredientes.' },
      { name: 'Ofícios', description: 'Executar trabalhos manuais e artesanais especializados.', examples: 'Ferraria, carpintaria, costura, cerâmica e outros ofícios escolhidos narrativamente.' },
      { name: 'Engenharia', description: 'Projetar, compreender e reparar estruturas e mecanismos.', examples: 'Construções, máquinas simples, armadilhas e dispositivos.' },
      { name: 'Alquimia', description: 'Conhecer substâncias, reagentes e suas combinações.', examples: 'Compostos, solventes, venenos, pigmentos e preparados.' },
      { name: 'Finanças', description: 'Administrar dinheiro, crédito, patrimônio e registros.', examples: 'Contabilidade, dívida, juros, orçamento e fluxo de recursos.' },
      { name: 'Tática', description: 'Tomar decisões imediatas em conflitos e operações.', examples: 'Posicionamento, formações, cobertura e coordenação de combate.' },
      { name: 'Estratégia', description: 'Planejar objetivos e recursos em horizonte mais amplo.', examples: 'Campanhas, logística, antecipação e planos de longo prazo.' },
      { name: 'Arcanismo', description: 'Conhecer teoria e manifestações da magia arcana.', examples: 'Símbolos, fenômenos, escolas, artefatos e estruturas mágicas.' },
      { name: 'Ocultismo', description: 'Conhecer fenômenos secretos, entidades e práticas ocultas.', examples: 'Maldições, espíritos, símbolos, pactos e manifestações incomuns.' },
      { name: 'Teologia', description: 'Conhecer divindades, religiões e tradições sagradas.', examples: 'Cultos, doutrinas, ritos, textos e símbolos religiosos.' },
    ],
  },
];

export const ATTRIBUTES = ATTRIBUTE_GROUPS.flatMap(group => group.attributes.map(attribute => attribute.name));
export const SKILLS = SKILL_GROUPS.flatMap(group => group.skills.map(skill => skill.name));

export const PEOPLE: Record<string, string[]> = {
  Humanos: ['Terranos', 'Altaneiros', 'Marítimos'],
  Elfos: ['Silvestres', 'Astrais', 'Profundos'],
  Orcs: ['Colossais', 'Glaciais', 'Rubros'],
  Pequeninos: ['Campestres', 'Brumosos', 'Ribeirinhos'],
  Goblins: ['Cavernícolas', 'Arborícolas', 'Ferruginosos'],
  Tiferinos: ['Infernais', 'Abissais', 'Umbráticos'],
  Fúngicos: ['Micelares', 'Chapeleiros', 'Luminescentes'],
  Draconatos: ['Metálicos', 'Cromáticos', 'Gemáticos'],
  Feras: ['Felinos', 'Canídeos', 'Avianos'],
  Anões: ['Graníticos', 'Ígneos', 'Cristalinos'],
};

const CLASS_PATH_SOURCE: Array<[AttributeName, string, string]> = [
  ['Força','Combatente','Esgrima'], ['Força','Brigão','Luta'], ['Força','Atleta','Atletismo'], ['Força','Valentão','Intimidação'], ['Força','Oficial de Ofício','Ofícios'],
  ['Vigor','Protetor','Defesa'], ['Vigor','Mateiro','Sobrevivência'], ['Vigor','Escudeiro','Tática'], ['Vigor','Condutor','Condução'], ['Vigor','Cozinheiro de Campo','Culinária'],
  ['Agilidade','Acrobata','Acrobacia'], ['Agilidade','Batedor','Exploração'], ['Agilidade','Escaramuçador','Emboscada'], ['Agilidade','Mensageiro','Navegação'], ['Agilidade','Cavaleiro Ligeiro','Trato Animal'],
  ['Destreza','Ladino','Furtividade'], ['Destreza','Espadachim','Esgrima'], ['Destreza','Arqueiro','Tiro'], ['Destreza','Trombadinha','Prestidigitação'], ['Destreza','Sabotador','Engenharia'],
  ['Presença','Porta-Voz','Expressão'], ['Presença','Porta-Estandarte','Liderança'], ['Presença','Cortesão','Etiqueta'], ['Presença','Orador','Persuasão'], ['Presença','Provocador','Intimidação'],
  ['Carisma','Emissário','Persuasão'], ['Carisma','Artista','Expressão'], ['Carisma','Conciliador','Mediação'], ['Carisma','Anfitrião','Liderança'], ['Carisma','Confidente','Intuição'],
  ['Manipulação','Charlatão','Enganação'], ['Manipulação','Intermediário','Submundo'], ['Manipulação','Intrigante','Política'], ['Manipulação','Barganhador','Negociação'], ['Manipulação','Avaliador','Avaliação'],
  ['Empatia','Conselheiro','Intuição'], ['Empatia','Socorrista','Medicina'], ['Empatia','Tratador','Trato Animal'], ['Empatia','Mediador','Mediação'], ['Empatia','Costumeiro','Tradições'],
  ['Percepção','Investigador','Investigação'], ['Percepção','Caçador','Tiro'], ['Percepção','Rastreador','Sobrevivência'], ['Percepção','Vigia','Exploração'], ['Percepção','Tocaiador','Emboscada'],
  ['Raciocínio','Planejador','Estratégia'], ['Raciocínio','Tático','Tática'], ['Raciocínio','Projetista','Engenharia'], ['Raciocínio','Guarda-Livros','Finanças'], ['Raciocínio','Perito','Avaliação'],
  ['Inteligência','Iniciado Arcano','Arcanismo'], ['Inteligência','Preparador','Alquimia'], ['Inteligência','Estudioso','História'], ['Inteligência','Naturalista','Natureza'], ['Inteligência','Intérprete','Linguística'],
  ['Sabedoria','Noviço','Teologia'], ['Sabedoria','Iniciado do Oculto','Ocultismo'], ['Sabedoria','Curandeiro','Medicina'], ['Sabedoria','Andarilho','Tradições'], ['Sabedoria','Cronista','História'],
];

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const INITIAL_CLASS_PATHS: InitialClassPath[] = CLASS_PATH_SOURCE.map(([primaryAttribute, name, requiredSkill], index) => ({
  id: `${slug(primaryAttribute)}-${slug(name)}`,
  name,
  primaryAttribute,
  requiredSkill,
  requiredAttributeMin: 3,
  requiredSkillMin: 2,
  sortOrder: index + 1,
}));

export function getHighestAttributes(attributes: Record<string, number>): AttributeName[] {
  const values = ATTRIBUTES.map(name => Number(attributes?.[name] ?? 1));
  const highest = Math.max(...values);
  return ATTRIBUTES.filter(name => Number(attributes?.[name] ?? 1) === highest);
}

export function apprenticeTitle(attributes: Record<string, number>): string {
  const highest = getHighestAttributes(attributes);
  return highest.length === 1 ? `Aprendiz de ${highest[0]}` : 'Aprendiz Versátil';
}

export function availableApprenticeAttributes(attributes: Record<string, number>): AttributeName[] {
  return getHighestAttributes(attributes);
}

export function openedClassAttributes(attributes: Record<string, number>): AttributeName[] {
  return ATTRIBUTES.filter(name => Number(attributes?.[name] ?? 0) >= 3);
}

export function classPathMeetsRequirements(path: InitialClassPath, attributes: Record<string, number>, skills: Record<string, number>): boolean {
  return Number(attributes?.[path.primaryAttribute] ?? 0) >= path.requiredAttributeMin
    && Number(skills?.[path.requiredSkill] ?? 0) >= path.requiredSkillMin;
}

export function visibleClassPaths(attributes: Record<string, number>): InitialClassPath[] {
  const opened = new Set(openedClassAttributes(attributes));
  return INITIAL_CLASS_PATHS.filter(path => opened.has(path.primaryAttribute));
}

export function earnedV15AttributePoints(level: number): number {
  return level >= 3 ? 1 : 0;
}

export function earnedV15SkillPoints(level: number): number {
  if (level >= 3) return 3;
  if (level >= 2) return 2;
  return 0;
}

export function normalizeAttributes(value?: Record<string, number> | null): Record<string, number> {
  return Object.fromEntries(ATTRIBUTES.map(name => [name, Number.isFinite(value?.[name]) ? Number(value?.[name]) : 1]));
}

export function normalizeSkills(value?: Record<string, number> | null): Record<string, number> {
  return Object.fromEntries(SKILLS.map(name => [name, Number.isFinite(value?.[name]) ? Number(value?.[name]) : 0]));
}
