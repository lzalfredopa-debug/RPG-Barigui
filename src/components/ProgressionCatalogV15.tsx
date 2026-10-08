import { INITIAL_CLASS_PATHS, ATTRIBUTES } from '@/lib/systemV15';
import CollapsibleSection from '@/components/CollapsibleSection';

export default function ProgressionCatalogV15() {
  return <div className="space-y-3">
    <div className="rounded-xl border border-gold-dim bg-gradient-card p-4">
      <p className="text-[10px] uppercase tracking-[.2em] text-gold/70">TRILHA 1.5</p>
      <h2 className="font-display text-xl text-gold-bright mt-1">Progressão inicial</h2>
      <p className="text-sm text-parchment-dim mt-2">Níveis 1–3: Aprendiz de um Atributo ou Aprendiz Versátil. A partir do nível 4, cada Atributo oferece cinco classes iniciais. A árvore avançada fica para uma etapa posterior.</p>
    </div>
    {ATTRIBUTES.map(attribute => {
      const paths = INITIAL_CLASS_PATHS.filter(path => path.primaryAttribute === attribute);
      return <CollapsibleSection key={attribute} id={`master:progression:${attribute}`} title={attribute} subtitle={`${paths.length} caminhos iniciais`} defaultOpen={false}>
        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-2">{paths.map(path => <div key={path.id} className="rounded-lg border border-gold-dim bg-shadow/30 p-3"><h3 className="font-display text-sm text-gold-bright">{path.name}</h3><p className="mt-2 text-xs text-parchment-dim">{path.primaryAttribute} 2 + {path.requiredSkill} 1</p></div>)}</div>
      </CollapsibleSection>;
    })}
  </div>;
}
