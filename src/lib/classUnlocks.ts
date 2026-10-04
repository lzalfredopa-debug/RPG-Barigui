import type { Character, ClassNode } from '@/lib/supabase';

type AttributeRequirement = { attribute?: string; min?: number };
type SkillRequirement = { skill?: string; min?: number };
type RequirementsPayload = {
  kind?: string;
  previous_class_id?: string;
  all?: Array<AttributeRequirement | SkillRequirement>;
  one_of?: Array<AttributeRequirement | SkillRequirement>;
};

export type RequirementCheck = {
  key: string;
  label: string;
  current: string;
  required: string;
  met: boolean;
  note?: string;
};

export type ClassUnlock = {
  node: ClassNode;
  path: string[];
  checks: RequirementCheck[];
};

const normalize = (value: string | null | undefined) =>
  (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');

const baseAttribute = (character: Character, name: string) => Number(character.attributes?.[name] ?? 0);
const baseSkill = (character: Character, name: string) => Number(character.skills?.[name] ?? 0);

function byId(nodes: ClassNode[]) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function deepestCurrentNode(character: Character, nodes: ClassNode[]) {
  const names = [character.class_name, character.specialization].filter(Boolean).map((value) => normalize(String(value)));
  if (!names.length) return undefined;
  return nodes
    .filter((node) => names.includes(normalize(node.name)))
    .sort((a, b) => b.stage_order - a.stage_order)[0];
}

function pathFor(node: ClassNode, nodeMap: Map<string, ClassNode>) {
  const result: string[] = [];
  const seen = new Set<string>();
  let current: ClassNode | undefined = node;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    result.unshift(current.name);
    current = current.parent_id ? nodeMap.get(current.parent_id) : undefined;
  }
  return result;
}

function previousClassCheck(character: Character, node: ClassNode, nodeMap: Map<string, ClassNode>): RequirementCheck | null {
  if (!node.parent_id) return null;
  const parent = nodeMap.get(node.parent_id);
  const current = deepestCurrentNode(character, Array.from(nodeMap.values()));
  const met = !!current && current.id === node.parent_id;
  return {
    key: `previous:${node.parent_id}`,
    label: 'Classe anterior',
    current: current?.name || 'Nenhuma',
    required: parent?.name || node.parent_name || 'Classe anterior',
    met,
  };
}

function attributeCheck(character: Character, requirement: AttributeRequirement, index: number): RequirementCheck {
  const name = requirement.attribute || 'Atributo';
  const min = Number(requirement.min ?? 0);
  const current = baseAttribute(character, name);
  return {
    key: `attribute:${name}:${index}`,
    label: name,
    current: String(current),
    required: String(min),
    met: current >= min,
    note: 'Somente o valor-base conta para requisitos de classe.',
  };
}

function skillCheck(character: Character, requirement: SkillRequirement, index: number): RequirementCheck {
  const name = requirement.skill || 'Habilidade';
  const min = Number(requirement.min ?? 0);
  const current = baseSkill(character, name);
  return {
    key: `skill:${name}:${index}`,
    label: name,
    current: String(current),
    required: String(min),
    met: current >= min,
    note: 'Somente o Nível de Habilidade-base conta para requisitos de classe.',
  };
}

function requirementChecks(character: Character, node: ClassNode, nodeMap: Map<string, ClassNode>) {
  const payload = (node.requirements || {}) as RequirementsPayload;
  const checks: RequirementCheck[] = [];

  checks.push({
    key: `level:${node.id}`,
    label: 'Nível para assumir a classe',
    current: String(character.level),
    required: String(node.level_min),
    met: character.level >= node.level_min,
    note: 'O nível mínimo define quando a classe pode ser assumida, mas não impede que o caminho seja percebido antes.',
  });

  const previous = previousClassCheck(character, node, nodeMap);
  if (previous) checks.push(previous);

  const all = Array.isArray(payload.all) ? payload.all : [];
  all.forEach((requirement, index) => {
    if ('attribute' in requirement && requirement.attribute) checks.push(attributeCheck(character, requirement, index));
    if ('skill' in requirement && requirement.skill) checks.push(skillCheck(character, requirement, index));
  });

  const oneOf = Array.isArray(payload.one_of) ? payload.one_of : [];
  if (oneOf.length) {
    const optionChecks = oneOf.map((requirement, index) => {
      if ('attribute' in requirement && requirement.attribute) return attributeCheck(character, requirement, index);
      return skillCheck(character, requirement as SkillRequirement, index);
    });
    const groupMet = optionChecks.some((check) => check.met);
    optionChecks.forEach((check) => checks.push({
      ...check,
      key: `one-of:${check.key}`,
      note: `${check.note ? `${check.note} ` : ''}Basta cumprir uma das opções deste grupo.`,
    }));
    checks.push({
      key: `one-of-result:${node.id}`,
      label: 'Uma das alternativas',
      current: groupMet ? 'Cumprida' : 'Não cumprida',
      required: '1 opção',
      met: groupMet,
    });
  }

  return checks;
}

function candidateNodes(character: Character, nodes: ClassNode[]) {
  const current = deepestCurrentNode(character, nodes);
  const targetStage = current ? current.stage_order + 1 : 1;
  if (targetStage > 4) return [];

  return nodes.filter((node) => {
    if (node.stage_order !== targetStage) return false;
    if (current) return node.parent_id === current.id;
    return !node.parent_id;
  });
}

export function evaluateClassUnlocks(character: Character, nodes: ClassNode[]): ClassUnlock[] {
  if (!nodes.length) return [];
  const nodeMap = byId(nodes);
  return candidateNodes(character, nodes)
    .map((node) => ({ node, path: pathFor(node, nodeMap), checks: requirementChecks(character, node, nodeMap) }))
    .filter((unlock) => unlock.checks
      .filter((check) => !check.key.startsWith('one-of:') && !check.key.startsWith('level:'))
      .every((check) => check.met));
}

export function classUnlockCount(character: Character, nodes: ClassNode[]) {
  return evaluateClassUnlocks(character, nodes).length;
}

export function currentClassNode(character: Character, nodes: ClassNode[]) {
  return deepestCurrentNode(character, nodes) || null;
}
