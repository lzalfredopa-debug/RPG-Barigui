import { useMemo, useState } from 'react';
import { Check, Lock, Route, Sparkles } from 'lucide-react';
import { supabase, type Character } from '@/lib/supabase';
import {
  apprenticeTitle,
  availableApprenticeAttributes,
  classPathMeetsRequirements,
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
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${ok ? 'border-forest/60 bg-forest/20 text-parchment' : 'border-gold-dim bg-shadow/30 text-parchment-dim'}`}>{ok ? <Check className="w-3 h-3" /> : <Lock className="w-3 h-3" />}{children}</span>;
}

export default function ProgressionV15({ character, actorPlayerId, canManage = false, onCharacterChange }: Props) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const title = apprenticeTitle(character.attributes || {});
  const roots = availableApprenticeAttributes(character.attributes || {});
  const paths = useMemo(() => visibleClassPaths(character.attributes || {}), [character.attributes]);
  const chosen = character.class_name?.trim() || '';

  const choose = async (path: InitialClassPath) => {
    if (!canManage || saving || character.level < 4 || !classPathMeetsRequirements(path, character.attributes || {}, character.skills || {})) return;
    setSaving(path.id);
    setError('');
    const { error: updateError } = await supabase.rpc('set_v15_initial_class', {
      p_player_id: actorPlayerId,
      p_character_id: character.id,
      p_class_id: path.id,
    });
    if (updateError) setError(updateError.message);
    else {
      const { data, error: reloadError } = await supabase.from('characters').select('*').eq('id', character.id).single();
      if (reloadError) setError(reloadError.message);
      else if (data) onCharacterChange?.(data as Character);
    }
    setSaving(null);
  };

  return <div className="space-y-4">
    <section className="rounded-xl border border-gold-dim bg-gradient-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Progressão TRILHA 1.5</p>
          <h2 className="mt-1 font-display text-xl text-gold-bright flex items-center gap-2"><Sparkles className="w-5 h-5" />{chosen || title}</h2>
          <p className="mt-2 text-sm text-parchment-dim">Nível {character.level} · {character.level <= 3 ? 'Aprendiz' : chosen ? 'Classe inicial' : 'Pronto para escolher uma classe inicial'}</p>
        </div>
        <div className="rounded-lg border border-gold-dim bg-shadow/35 px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[.16em] text-gold/70">Ramos disponíveis</div>
          <div className="mt-1 text-sm text-parchment">{roots.join(' · ')}</div>
        </div>
      </div>
      {roots.length > 1 && <p className="mt-3 text-xs text-parchment-dim">Empate no maior atributo: o personagem é <b className="text-gold-bright">Aprendiz Versátil</b> e enxerga os caminhos de todos os atributos empatados.</p>}
    </section>

    <CollapsibleSection id={`progression:${character.id}:paths`} title="Caminhos iniciais" subtitle="Cinco caminhos por atributo dominante. Requisito padrão: Atributo 2 + Habilidade 1.">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {paths.map(path => {
          const attr = Number(character.attributes?.[path.primaryAttribute] ?? 0);
          const skill = Number(character.skills?.[path.requiredSkill] ?? 0);
          const eligible = classPathMeetsRequirements(path, character.attributes || {}, character.skills || {});
          const selected = chosen === path.name;
          const levelReady = character.level >= 4;
          return <article key={path.id} className={`rounded-lg border p-4 ${selected ? 'border-gold bg-gold/10' : 'border-gold-dim bg-shadow/25'}`}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-display text-gold-bright">{path.name}</h3><p className="text-xs text-parchment-dim mt-1">Ramo de {path.primaryAttribute}</p></div>
              {selected && <span className="rounded-full border border-gold bg-gold/15 px-2 py-1 text-[10px] uppercase tracking-wider text-gold-bright">Atual</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Requirement ok={attr >= path.requiredAttributeMin}>{path.primaryAttribute} {attr}/{path.requiredAttributeMin}</Requirement>
              <Requirement ok={skill >= path.requiredSkillMin}>{path.requiredSkill} {skill}/{path.requiredSkillMin}</Requirement>
            </div>
            {!levelReady && <p className="mt-3 text-[11px] text-parchment-dim">A escolha de classe inicial começa no nível 4. Até lá, os caminhos ficam visíveis para planejamento.</p>}
            {canManage && !selected && <button type="button" onClick={() => choose(path)} disabled={!eligible || !levelReady || !!saving} className="mt-3 w-full rounded-lg border border-gold-dim bg-shadow/40 px-3 py-2 text-xs text-gold hover:border-gold disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Route className="w-3.5 h-3.5" />{saving === path.id ? 'Salvando...' : 'Definir como classe inicial'}</button>}
          </article>;
        })}
      </div>
      {error && <p className="mt-3 rounded-lg border border-blood/40 bg-blood/10 p-3 text-xs text-parchment">{error}</p>}
    </CollapsibleSection>
  </div>;
}
