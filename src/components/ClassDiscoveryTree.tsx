import { useEffect, useMemo, useState } from 'react';
import { Eye, Lock, RefreshCw } from 'lucide-react';
import { supabase, type ClassNode } from '@/lib/supabase';

const STAGES: Array<{ key: ClassNode['stage']; levels: string }> = [
  { key: 'Iniciante', levels: '5–8' },
  { key: 'Competente', levels: '9–12' },
  { key: 'Proficiente', levels: '13–16' },
  { key: 'Especialista', levels: '17–20' },
];

type Props = {
  characterId: string;
  nodes: ClassNode[];
};

export default function ClassDiscoveryTree({ characterId, nodes }: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rootFilter, setRootFilter] = useState('__all__');

  const roots = useMemo(
    () => nodes
      .filter((node) => node.stage === 'Iniciante')
      .sort((a, b) => a.sort_order - b.sort_order),
    [nodes],
  );

  const loadReveals = async () => {
    if (!characterId) return;
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase
      .from('character_class_reveals')
      .select('class_node_id')
      .eq('character_id', characterId);

    if (requestError) {
      setError(requestError.message);
      setRevealed(new Set());
    } else {
      setRevealed(new Set((data || []).map((row) => String(row.class_node_id))));
    }
    setLoading(false);
  };

  useEffect(() => { loadReveals(); }, [characterId]);

  const visibleRoots = rootFilter === '__all__'
    ? roots
    : roots.filter((node) => node.id === rootFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[.22em] text-gold/70">Mapa de possibilidades</p>
          <h2 className="font-display text-2xl text-gold-bright mt-1">Árvore de Classes</h2>
          <p className="mt-1 max-w-3xl text-sm text-parchment-dim">
            A estrutura completa existe desde o início, mas cada casa permanece oculta até ser revelada pelo Mestre.
          </p>
        </div>
        <button
          type="button"
          onClick={loadReveals}
          className="inline-flex items-center gap-2 rounded-lg border border-gold-dim px-3 py-2 text-sm text-gold hover:border-gold"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gold-dim bg-shadow/30 p-4">
        <label className="min-w-[240px] flex-1">
          <span className="text-xs text-gold">Trilha exibida</span>
          <select
            value={rootFilter}
            onChange={(event) => setRootFilter(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gold-dim bg-shadow/60 px-3 py-2 text-sm text-parchment focus:border-gold focus:outline-none"
          >
            <option value="__all__">Todas as trilhas</option>
            {roots.map((root, index) => (
              <option key={root.id} value={root.id}>
                {revealed.has(root.id) ? root.name : `Trilha ${String(index + 1).padStart(2, '0')}`}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-parchment-dim">
          <span className="text-gold-bright">{revealed.size}</span> de {nodes.length} casas reveladas
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-gold-dim bg-shadow/30 p-8 text-center text-parchment-dim">
          Carregando revelações...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-800/70 bg-red-950/20 p-5">
          <p className="font-display text-red-200">Não foi possível carregar a árvore revelada</p>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <p className="mt-3 text-xs text-parchment-dim">A migration da Etapa 3 precisa ser executada no Supabase.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-5">
          {visibleRoots.map((root, branchIndex) => {
            const branch = nodes.filter((node) => node.root_class === root.root_class);
            const rootIsRevealed = revealed.has(root.id);
            const branchNumber = roots.findIndex((candidate) => candidate.id === root.id) + 1;

            return (
              <section key={root.id} className="overflow-hidden rounded-2xl border border-gold-dim bg-shadow/25">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-dim bg-shadow/45 px-4 py-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[.2em] text-parchment-dim">Trilha de progressão {String(branchNumber || branchIndex + 1).padStart(2, '0')}</p>
                    <h3 className="font-display text-lg text-gold-bright">{rootIsRevealed ? root.name : 'Trilha desconhecida'}</h3>
                  </div>
                  <span className="text-xs text-parchment-dim">{branch.filter((node) => revealed.has(node.id)).length}/{branch.length} reveladas</span>
                </div>

                <div className="overflow-x-auto p-4">
                  <div className="grid min-w-[980px] grid-cols-4 gap-4">
                    {STAGES.map((stage) => (
                      <div key={stage.key} className="min-w-0">
                        <div className="mb-3 border-b border-gold-dim pb-2">
                          <p className="font-display text-sm text-gold">{stage.key}</p>
                          <p className="text-[10px] uppercase tracking-[.16em] text-parchment-dim">Níveis {stage.levels}</p>
                        </div>
                        <div className="space-y-3">
                          {branch.filter((node) => node.stage === stage.key).map((node) => {
                            const isRevealed = revealed.has(node.id);
                            return (
                              <div
                                key={node.id}
                                className={`min-h-[118px] rounded-xl border p-3 ${isRevealed ? 'border-gold-dim bg-gradient-card' : 'border-stone-700/70 bg-black/25'}`}
                              >
                                {isRevealed ? (
                                  <>
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <p className="font-display text-sm text-gold-bright">{node.name}</p>
                                        <p className="mt-1 text-[10px] uppercase tracking-[.14em] text-parchment-dim">{node.stage} · níveis {node.level_min}–{node.level_max}</p>
                                      </div>
                                      <Eye className="w-4 h-4 shrink-0 text-gold" />
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-parchment/90">{node.requirement_text}</p>
                                  </>
                                ) : (
                                  <div className="flex min-h-[90px] flex-col items-center justify-center text-center">
                                    <Lock className="w-5 h-5 text-parchment-dim/50" />
                                    <p className="mt-2 font-display text-sm text-parchment-dim/70">Oculto</p>
                                    <p className="mt-1 text-[10px] uppercase tracking-[.16em] text-parchment-dim/40">Casa não revelada</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
