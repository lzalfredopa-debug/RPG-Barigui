import { useMemo, useState } from 'react';
import { Check, Lock, Plus, Route, Sparkles } from 'lucide-react';
import { supabase, type Character } from '@/lib/supabase';
import {
  ATTRIBUTE_GROUPS,
  SKILL_GROUPS,
  apprenticeTitle,
  classPathMeetsRequirements,
  earnedV15AttributePoints,
  earnedV15SkillPoints,
  openedClassAttributes,
  visibleClassPaths,
  type InitialClassPath,
} from '@/lib/systemV15';
import CollapsibleSection from '@/components/CollapsibleSection';

type Props = {
  character: Character;
  actorPlayerId: string;
  canManage?: boolean;
  onCharacterChange?: (character: Character) => void;
};

function Requirement({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${ok ? 'border-[#78915f] bg-[#263020] text-[#f0e2bd]' : 'border-[#8a704a] bg-[#171411] text-[#d9c8a5]'}`}>{ok ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{children}</span>;
}

export default function ProgressionV15({ character, actorPlayerId, canManage = false, onCharacterChange }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [attributeChoice, setAttributeChoice] = useState('');
  const [skillChoice, setSkillChoice] = useState('');

  const title = apprenticeTitle(character.attributes || {});
  const branches = openedClassAttributes(character.attributes || {});
  const paths = useMemo(() => visibleClassPaths(character.attributes || {}), [character.attributes]);
  const chosen = character.class_name?.trim() || '';
  const canAct = canManage || character.player_id === actorPlayerId;

  const attributeEarned = earnedV15AttributePoints(character.level);
  const skillEarned = earnedV15SkillPoints(character.level);
  const attributeSpent = Number(character.v15_attribute_points_spent || 0);
  const skillSpent = Number(character.v15_skill_points_spent || 0);
  const attributeAvailable = Math.max(0, attributeEarned - attributeSpent);
  const skillAvailable = Math.max(0, skillEarned - skillSpent);

  const attributeOptions = ATTRIBUTE_GROUPS.flatMap(group => group.attributes)
    .filter(attribute => Number(character.attributes?.[attribute.name] ?? 1) < 3);
  const skillOptions = SKILL_GROUPS.flatMap(group => group.skills)
    .filter(skill => Number(character.skills?.[skill.name] ?? 0) < 2);

  const reload = async () => {
    const { data, error: reloadError } = await supabase.from('characters').select('*').eq('id', character.id).single();
    if (reloadError) throw reloadError;
    if (data) onCharacterChange?.(data as Character);
  };

  const spendAttribute = async () => {
    if (!canAct || !attributeChoice || saving || attributeAvailable <= 0) return;
    setSaving('attribute-point');
    setError('');
    const { error: rpcError } = await supabase.rpc('spend_v15_attribute_point', {
      p_player_id: actorPlayerId,
      p_character_id: character.id,
      p_attribute: attributeChoice,
    });
    if (rpcError) setError(rpcError.message);
    else {
      try { await reload(); setAttributeChoice(''); }
      catch (reloadError) { setError(reloadError instanceof Error ? reloadError.message : 'Não foi possível atualizar a ficha.'); }
    }
    setSaving(null);
  };

  const spendSkill = async () => {
    if (!canAct || !skillChoice || saving || skillAvailable <= 0) return;
    setSaving('skill-point');
    setError('');
    const { error: rpcError } = await supabase.rpc('spend_v15_skill_point', {
      p_player_id: actorPlayerId,
      p_character_id: character.id,
      p_skill: skillChoice,
    });
    if (rpcError) setError(rpcError.message);
    else {
      try { await reload(); setSkillChoice(''); }
      catch (reloadError) { setError(reloadError instanceof Error ? reloadError.message : 'Não foi possível atualizar a ficha.'); }
    }
    setSaving(null);
  };

  const choose = async (path: InitialClassPath) => {
    if (!canAct || saving || character.level < 4 || !classPathMeetsRequirements(path, character.attributes || {}, character.skills || {})) return;
    setSaving(path.id);
    setError('');
    const { error: updateError } = await supabase.rpc('set_v15_initial_class', {
      p_player_id: actorPlayerId,
      p_character_id: character.id,
      p_class_id: path.id,
    });
    if (updateError) setError(updateError.message);
    else {
      try { await reload(); }
      catch (reloadError) { setError(reloadError instanceof Error ? reloadError.message : 'Não foi possível atualizar a ficha.'); }
    }
    setSaving(null);
  };

  return <div className="space-y-4">
    <section className="rounded-xl border border-[#9b7134] bg-[#211b16] p-4 sm:p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Progressão TRILHA 1.5</p>
          <h2 className="mt-1 font-display text-xl text-gold-bright flex items-center gap-2"><Sparkles className="w-5 h-5" />{chosen || title}</h2>
          <p className="mt-2 text-sm text-parchment-dim">Nível {character.level} · {character.level <= 3 ? 'Aprendiz' : chosen ? 'Classe inicial' : 'Preparando a primeira classe'}</p>
        </div>
        <div className="rounded-lg border border-[#806237] bg-[#15120f] px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[.16em] text-gold/70">Ramificações reveladas</div>
          <div className="mt-1 text-sm text-parchment">{branches.length ? branches.join(' · ') : 'Nenhuma ainda'}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-parchment-dim"><b className="text-gold-bright">A primeira ramificação aparece quando um Atributo chega a 3 pontos.</b> Ao abrir uma ramificação, seus cinco caminhos ficam visíveis. A escolha da classe começa no nível 4 e exige Atributo 3 + Habilidade 2.</p>
      {title === 'Aprendiz Versátil' && branches.length === 0 && <p className="mt-2 text-xs text-parchment-dim">O empate atual mantém o título <b className="text-gold-bright">Aprendiz Versátil</b>. O ponto de Atributo recebido no nível 3 normalmente define qual ramificação será revelada primeiro.</p>}
    </section>

    <CollapsibleSection id={`progression:${character.id}:points`} title="Pontos de Aprendiz" subtitle="Nível 2: +2 Habilidades · Nível 3: +1 Atributo e +1 Habilidade" defaultOpen={attributeAvailable > 0 || skillAvailable > 0}>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gold-dim bg-shadow/40 p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-display text-sm text-gold-bright">Atributo</h3><p className="text-xs text-parchment-dim mt-1">Disponíveis: {attributeAvailable} / {attributeEarned}</p></div><span className="text-xs text-gold">máx. 3 no Aprendiz</span></div>
          {attributeAvailable > 0 && canAct ? <div className="mt-3 flex flex-col sm:flex-row gap-2"><select value={attributeChoice} onChange={e => setAttributeChoice(e.target.value)} className="flex-1 rounded-lg border border-gold-dim bg-shadow px-3 py-2 text-sm text-parchment"><option value="">Escolha um Atributo</option>{attributeOptions.map(attribute => <option key={attribute.name} value={attribute.name}>{attribute.name} · atual {Number(character.attributes?.[attribute.name] ?? 1)}</option>)}</select><button type="button" onClick={spendAttribute} disabled={!attributeChoice || !!saving} className="trilha-ui-button is-primary rounded-lg px-3 py-2 text-xs disabled:opacity-40 inline-flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />Aplicar +1</button></div> : <p className="mt-3 text-xs text-parchment-dim">{character.level < 3 ? 'O ponto de Atributo é recebido no nível 3.' : attributeEarned > 0 ? 'Ponto de Atributo já utilizado.' : 'Nenhum ponto disponível.'}</p>}
        </div>

        <div className="rounded-lg border border-gold-dim bg-shadow/40 p-4">
          <div className="flex items-center justify-between gap-3"><div><h3 className="font-display text-sm text-gold-bright">Habilidades</h3><p className="text-xs text-parchment-dim mt-1">Disponíveis: {skillAvailable} / {skillEarned}</p></div><span className="text-xs text-gold">máx. 2 no Aprendiz</span></div>
          {skillAvailable > 0 && canAct ? <div className="mt-3 flex flex-col sm:flex-row gap-2"><select value={skillChoice} onChange={e => setSkillChoice(e.target.value)} className="flex-1 rounded-lg border border-gold-dim bg-shadow px-3 py-2 text-sm text-parchment"><option value="">Escolha uma Habilidade</option>{skillOptions.map(skill => <option key={skill.name} value={skill.name}>{skill.name} · atual {Number(character.skills?.[skill.name] ?? 0)}</option>)}</select><button type="button" onClick={spendSkill} disabled={!skillChoice || !!saving} className="trilha-ui-button is-primary rounded-lg px-3 py-2 text-xs disabled:opacity-40 inline-flex items-center justify-center gap-1"><Plus className="w-3.5 h-3.5" />Aplicar +1</button></div> : <p className="mt-3 text-xs text-parchment-dim">{character.level < 2 ? 'Os primeiros 2 pontos de Habilidade são recebidos no nível 2.' : skillEarned > 0 ? 'Todos os pontos de Habilidade recebidos até este nível já foram utilizados.' : 'Nenhum ponto disponível.'}</p>}
        </div>
      </div>
    </CollapsibleSection>

    <CollapsibleSection id={`progression:${character.id}:paths`} title="Caminhos iniciais" subtitle="Uma ramificação é revelada com Atributo 3. Cada caminho exige também Habilidade 2.">
      {paths.length === 0 ? <div className="rounded-lg border border-dashed border-gold-dim bg-shadow/25 p-5 text-center"><Lock className="w-5 h-5 text-gold mx-auto" /><p className="mt-2 text-sm text-parchment">Nenhuma ramificação revelada ainda.</p><p className="mt-1 text-xs text-parchment-dim">Ao atingir <b className="text-gold-bright">3 pontos em um Atributo</b>, os cinco caminhos ligados a ele aparecerão aqui.</p></div> : <div className="space-y-4">{branches.map(branch => {
        const branchPaths = paths.filter(path => path.primaryAttribute === branch);
        return <div key={branch}><h3 className="font-display text-sm text-gold-bright mb-2">{branch} · {branchPaths.length} caminhos</h3><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{branchPaths.map(path => {
          const attr = Number(character.attributes?.[path.primaryAttribute] ?? 0);
          const skill = Number(character.skills?.[path.requiredSkill] ?? 0);
          const eligible = classPathMeetsRequirements(path, character.attributes || {}, character.skills || {});
          const selected = chosen === path.name;
          const levelReady = character.level >= 4;
          return <article key={path.id} className={`rounded-lg border p-4 shadow-sm ${selected ? 'border-[#d8ad4e] bg-[#4b261e]' : 'border-[#80633b] bg-[#211c17]'}`}>
            <div className="flex items-start justify-between gap-3"><div><h3 className="font-display text-[#f1d687]">{path.name}</h3><p className="text-xs text-[#d2c09d] mt-1">Ramo de {path.primaryAttribute}</p></div>{selected && <span className="rounded-full border border-[#e0b655] bg-[#24170f] px-2 py-1 text-[10px] uppercase tracking-wider text-[#f3d97f]">Atual</span>}</div>
            <div className="mt-3 flex flex-wrap gap-2"><Requirement ok={attr >= path.requiredAttributeMin}>{path.primaryAttribute} {attr}/{path.requiredAttributeMin}</Requirement><Requirement ok={skill >= path.requiredSkillMin}>{path.requiredSkill} {skill}/{path.requiredSkillMin}</Requirement></div>
            {!levelReady && <p className="mt-3 text-[11px] text-[#d9c9a9]">Caminho revelado para planejamento. A escolha da classe inicial começa no nível 4.</p>}
            {canAct && !selected && <button type="button" onClick={() => choose(path)} disabled={!eligible || !levelReady || !!saving} className="mt-3 w-full rounded-lg border border-[#9b7134] bg-[#171411] px-3 py-2 text-xs text-[#e6c467] hover:border-[#d4a94e] hover:text-[#f4dc92] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Route className="w-3.5 h-3.5" />{saving === path.id ? 'Salvando...' : 'Definir como classe inicial'}</button>}
          </article>;
        })}</div></div>;
      })}</div>}
      {error && <p className="mt-3 rounded-lg border border-blood/40 bg-blood/10 p-3 text-xs text-parchment">{error}</p>}
    </CollapsibleSection>
  </div>;
}
