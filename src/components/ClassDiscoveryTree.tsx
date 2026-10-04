import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Compass, Crown, Eye, Lock, RefreshCw, Route, Sparkles } from 'lucide-react';
import { supabase, type Character, type ClassNode } from '@/lib/supabase';
import { currentClassNode, evaluateClassUnlocks } from '@/lib/classUnlocks';

const STAGES: Array<{ key: ClassNode['stage']; levels: string }> = [
  { key: 'Iniciante', levels: '5–8' },
  { key: 'Competente', levels: '9–12' },
  { key: 'Proficiente', levels: '13–16' },
  { key: 'Especialista', levels: '17–20' },
];

type Props = {
  character: Character;
  nodes: ClassNode[];
};

type NodeVisualState = 'hidden' | 'revealed' | 'available' | 'current';

function nodeState(
  node: ClassNode,
  revealed: Set<string>,
  available: Set<string>,
  currentId: string | null,
): NodeVisualState {
  if (!revealed.has(node.id)) return 'hidden';
  if (currentId === node.id) return 'current';
  if (available.has(node.id)) return 'available';
  return 'revealed';
}

function PlayerNode({ node, state }: { node: ClassNode; state: NodeVisualState }) {
  if (state === 'hidden') {
    return (
      <div className="trilha-class-node trilha-class-node--hidden" aria-label="Classe oculta">
        <div className="trilha-class-seal"><Lock className="w-4 h-4" /></div>
        <p className="trilha-class-node-title">Oculto</p>
        <p className="trilha-class-node-micro">Vereda ainda velada</p>
      </div>
    );
  }

  return (
    <div className={`trilha-class-node trilha-class-node--${state}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="trilha-class-node-title">{node.name}</p>
          <p className="trilha-class-node-micro">{node.stage} · níveis {node.level_min}–{node.level_max}</p>
        </div>
        {state === 'current' ? <Crown className="w-4 h-4 shrink-0" /> : state === 'available' ? <Sparkles className="w-4 h-4 shrink-0" /> : <Eye className="w-4 h-4 shrink-0" />}
      </div>
      <p className="trilha-class-node-requirement">{node.requirement_text}</p>
      {state === 'available' && <span className="trilha-class-badge">Caminho aberto</span>}
      {state === 'current' && <span className="trilha-class-badge">Classe atual</span>}
    </div>
  );
}

export default function ClassDiscoveryTree({ character, nodes }: Props) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openRootId, setOpenRootId] = useState<string | null>(null);

  const roots = useMemo(
    () => nodes
      .filter((node) => node.stage === 'Iniciante')
      .sort((a, b) => a.sort_order - b.sort_order),
    [nodes],
  );

  const availableIds = useMemo(
    () => new Set(evaluateClassUnlocks(character, nodes).map((unlock) => unlock.node.id)),
    [character, nodes],
  );
  const currentNode = useMemo(() => currentClassNode(character, nodes), [character, nodes]);

  const loadReveals = async () => {
    if (!character.id) return;
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase
      .from('character_class_reveals')
      .select('class_node_id')
      .eq('character_id', character.id);

    if (requestError) {
      setError(requestError.message);
      setRevealed(new Set());
    } else {
      setRevealed(new Set((data || []).map((row) => String(row.class_node_id))));
    }
    setLoading(false);
  };

  useEffect(() => { loadReveals(); }, [character.id]);

  return (
    <div className="trilha-class-discovery space-y-5">
      <div className="trilha-class-intro">
        <div className="flex flex-wrap items-start justify-between gap-3 relative z-10">
          <div>
            <p className="trilha-class-kicker"><Compass className="w-4 h-4" /> Mapa de possibilidades</p>
            <h2 className="trilha-class-title">Árvore de Classes</h2>
            <p className="trilha-class-subtitle">Os caminhos nem sempre se revelam por inteiro. Alguns devem ser descobertos.</p>
          </div>
          <button type="button" onClick={loadReveals} className="trilha-class-action">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </button>
        </div>
        <div className="trilha-class-intro-line" />
      </div>

      <div className="trilha-class-legend">
        <span><i className="trilha-legend-dot trilha-legend-dot--hidden" /> Oculto</span>
        <span><i className="trilha-legend-dot trilha-legend-dot--revealed" /> Revelado</span>
        <span><i className="trilha-legend-dot trilha-legend-dot--available" /> Caminho aberto</span>
        <span><i className="trilha-legend-dot trilha-legend-dot--current" /> Classe atual</span>
      </div>

      {loading && <div className="trilha-class-message">Carregando as veredas reveladas...</div>}

      {!loading && error && (
        <div className="rounded-xl border border-red-800/70 bg-red-950/20 p-5">
          <p className="font-display text-red-200">Não foi possível carregar a árvore revelada</p>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <p className="mt-3 text-xs text-parchment-dim">A migration da Etapa 3 precisa estar executada no Supabase.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="trilha-class-panels">
          {roots.map((root, index) => {
            const branch = nodes.filter((node) => node.root_class === root.root_class);
            const isOpen = openRootId === root.id;
            const rootRevealed = revealed.has(root.id);
            const revealedCount = branch.filter((node) => revealed.has(node.id)).length;

            return (
              <section key={root.id} className={`trilha-class-panel ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="trilha-class-panel-header"
                  onClick={() => setOpenRootId((current) => current === root.id ? null : root.id)}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="trilha-class-panel-number">{String(index + 1).padStart(2, '0')}</div>
                    <div className="min-w-0 text-left">
                      <p className="trilha-class-panel-kicker">Trilha de progressão</p>
                      <h3 className="trilha-class-panel-title">{rootRevealed ? root.name : `Trilha ${String(index + 1).padStart(2, '0')}`}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="trilha-class-panel-count">{revealedCount}/{branch.length}</span>
                    {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="trilha-class-panel-body">
                    <div className="trilha-class-map-wrap">
                      <div className="trilha-class-map">
                        {STAGES.map((stage) => (
                          <div key={stage.key} className="trilha-class-stage">
                            <div className="trilha-class-stage-heading">
                              <Route className="w-4 h-4" />
                              <div>
                                <p>{stage.key}</p>
                                <span>Níveis {stage.levels}</span>
                              </div>
                            </div>
                            <div className="trilha-class-stage-nodes">
                              {branch.filter((node) => node.stage === stage.key).map((node) => (
                                <PlayerNode
                                  key={node.id}
                                  node={node}
                                  state={nodeState(node, revealed, availableIds, currentNode?.id || null)}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
