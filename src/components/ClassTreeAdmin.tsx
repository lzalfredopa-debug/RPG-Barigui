import { useCallback, useEffect, useMemo, useState } from 'react';
import { GitBranch, RefreshCw, Search, ChevronRight, BookOpen, Layers3, CheckCircle2, Route, Eye, EyeOff } from 'lucide-react';
import { supabase, type Character, type ClassNode, type Player } from '@/lib/supabase';
import { evaluateClassUnlocks } from '@/lib/classUnlocks';

const STAGES: Array<{ key: ClassNode['stage']; levels: string; label: string }> = [
  { key: 'Iniciante', levels: '5–8', label: 'Iniciante' },
  { key: 'Competente', levels: '9–12', label: 'Competente' },
  { key: 'Proficiente', levels: '13–16', label: 'Proficiente' },
  { key: 'Especialista', levels: '17–20', label: 'Especialista' },
];

const stageTone: Record<ClassNode['stage'], string> = {
  Iniciante: 'border-red-900/70 bg-red-950/20',
  Competente: 'border-amber-900/70 bg-amber-950/20',
  Proficiente: 'border-yellow-800/60 bg-yellow-950/10',
  Especialista: 'border-gold/50 bg-gold/5',
};

function classPath(node: ClassNode, byId: Map<string, ClassNode>) {
  const names: string[] = [];
  let current: ClassNode | undefined = node;
  const safety = new Set<string>();
  while (current && !safety.has(current.id)) {
    safety.add(current.id);
    names.unshift(current.name);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return names;
}

function NodeCard({
  node,
  selected,
  onClick,
  revealEnabled,
  revealed,
  revealBusy,
  onToggleReveal,
}: {
  node: ClassNode;
  selected: boolean;
  onClick: () => void;
  revealEnabled: boolean;
  revealed: boolean;
  revealBusy: boolean;
  onToggleReveal: () => void;
}) {
  return (
    <div className={`w-full rounded-xl border transition ${stageTone[node.stage]} ${selected ? 'ring-1 ring-gold border-gold' : ''}`}>
      <button type="button" onClick={onClick} className="w-full text-left p-3 hover:bg-gold/5 rounded-t-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-sm text-gold-bright truncate">{node.name}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[.16em] text-parchment-dim">Níveis {node.level_min}–{node.level_max}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        </div>
        {node.parent_name && <p className="mt-2 text-[11px] text-parchment-dim">Vem de: <span className="text-parchment">{node.parent_name}</span></p>}
        <p className="mt-2 text-xs leading-relaxed text-parchment/90">{node.requirement_text}</p>
      </button>
      <div className="border-t border-gold-dim/60 px-3 py-2">
        <button
          type="button"
          disabled={!revealEnabled || revealBusy}
          onClick={onToggleReveal}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition disabled:opacity-40 ${revealed ? 'border-gold/70 bg-gold/10 text-gold-bright' : 'border-parchment-dim/30 text-parchment-dim hover:border-gold-dim hover:text-gold'}`}
        >
          {revealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {revealBusy ? 'Salvando...' : revealed ? 'Revelada ao personagem' : 'Oculta para o personagem'}
        </button>
      </div>
    </div>
  );
}

function BranchTree({
  root,
  nodes,
  selectedId,
  onSelect,
  revealCharacterId,
  revealedIds,
  revealBusyId,
  onToggleReveal,
}: {
  root: string;
  nodes: ClassNode[];
  selectedId: string | null;
  onSelect: (node: ClassNode) => void;
  revealCharacterId: string;
  revealedIds: Set<string>;
  revealBusyId: string | null;
  onToggleReveal: (node: ClassNode) => void;
}) {
  const branch = nodes.filter((node) => node.root_class === root);
  return (
    <section className="rounded-2xl border border-gold-dim bg-shadow/25 overflow-hidden">
      <div className="px-4 py-3 border-b border-gold-dim bg-shadow/45 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-parchment-dim">Árvore de progressão</p>
          <h3 className="font-display text-lg text-gold-bright">{root}</h3>
        </div>
        <span className="text-xs text-parchment-dim">{branch.length} classes/evoluções</span>
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-4 gap-4">
          {STAGES.map((stage) => {
            const stageNodes = branch.filter((node) => node.stage === stage.key);
            return (
              <div key={stage.key} className="min-w-0">
                <div className="mb-3 border-b border-gold-dim pb-2">
                  <p className="font-display text-sm text-gold">{stage.label}</p>
                  <p className="text-[10px] uppercase tracking-[.16em] text-parchment-dim">Níveis {stage.levels}</p>
                </div>
                <div className="space-y-3">
                  {stageNodes.map((node) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      selected={selectedId === node.id}
                      onClick={() => onSelect(node)}
                      revealEnabled={!!revealCharacterId}
                      revealed={revealedIds.has(node.id)}
                      revealBusy={revealBusyId === node.id}
                      onToggleReveal={() => onToggleReveal(node)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type Props = { characters?: Character[]; players?: Player[] };

export default function ClassTreeAdmin({ characters = [], players = [] }: Props) {
  const [nodes, setNodes] = useState<ClassNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rootFilter, setRootFilter] = useState('__all__');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealCharacterId, setRevealCharacterId] = useState('');
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [revealError, setRevealError] = useState('');
  const [revealBusyId, setRevealBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: requestError } = await supabase.from('class_nodes').select('*').order('sort_order');
    if (requestError) {
      setNodes([]);
      setError(requestError.message);
    } else {
      const loaded = (data || []) as ClassNode[];
      setNodes(loaded);
      setSelectedId((current) => current || loaded[0]?.id || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!characters.length) {
      setRevealCharacterId('');
      return;
    }
    setRevealCharacterId((current) => current && characters.some((character) => character.id === current) ? current : characters[0].id);
  }, [characters]);

  const loadReveals = useCallback(async (characterId: string) => {
    if (!characterId) {
      setRevealedIds(new Set());
      setRevealError('');
      return;
    }
    setRevealError('');
    const { data, error: requestError } = await supabase
      .from('character_class_reveals')
      .select('class_node_id')
      .eq('character_id', characterId);
    if (requestError) {
      setRevealError(requestError.message);
      setRevealedIds(new Set());
      return;
    }
    setRevealedIds(new Set((data || []).map((row) => String(row.class_node_id))));
  }, []);

  useEffect(() => { loadReveals(revealCharacterId); }, [revealCharacterId, loadReveals]);

  const toggleReveal = useCallback(async (node: ClassNode) => {
    if (!revealCharacterId || revealBusyId) return;
    setRevealBusyId(node.id);
    setRevealError('');
    const isRevealed = revealedIds.has(node.id);
    if (isRevealed) {
      const { error: requestError } = await supabase
        .from('character_class_reveals')
        .delete()
        .eq('character_id', revealCharacterId)
        .eq('class_node_id', node.id);
      if (requestError) setRevealError(requestError.message);
      else setRevealedIds((current) => { const next = new Set(current); next.delete(node.id); return next; });
    } else {
      const { error: requestError } = await supabase
        .from('character_class_reveals')
        .insert({ character_id: revealCharacterId, class_node_id: node.id, revealed_by: 'Mestre' });
      if (requestError) setRevealError(requestError.message);
      else setRevealedIds((current) => new Set(current).add(node.id));
    }
    setRevealBusyId(null);
  }, [revealCharacterId, revealBusyId, revealedIds]);

  const roots = useMemo(
    () => nodes.filter((node) => node.stage === 'Iniciante').sort((a, b) => a.sort_order - b.sort_order).map((node) => node.root_class),
    [nodes],
  );
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const selected = selectedId ? byId.get(selectedId) || null : null;
  const counts = useMemo(() => Object.fromEntries(STAGES.map((stage) => [stage.key, nodes.filter((node) => node.stage === stage.key).length])), [nodes]);

  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return nodes.filter((node) => [node.name, node.root_class, node.parent_name, node.requirement_text, node.primary_skill, node.secondary_skill]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalizedQuery)));
  }, [nodes, normalizedQuery]);

  const visibleRoots = rootFilter === '__all__' ? roots : roots.filter((root) => root === rootFilter);
  const path = selected ? classPath(selected, byId) : [];
  const playerMap = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);
  const revealCharacter = useMemo(() => characters.find((character) => character.id === revealCharacterId) || null, [characters, revealCharacterId]);
  const revealOwner = revealCharacter ? playerMap.get(revealCharacter.player_id) : undefined;
  const unlockedPossibilities = useMemo(() => {
    return characters.flatMap((character) => {
      const owner = playerMap.get(character.player_id);
      return evaluateClassUnlocks(character, nodes).map((unlock) => ({
        character,
        owner,
        unlock,
      }));
    }).sort((a, b) => {
      const playerA = a.owner?.player_name || a.owner?.alcunha || '';
      const playerB = b.owner?.player_name || b.owner?.alcunha || '';
      return playerA.localeCompare(playerB, 'pt-BR') || a.character.name.localeCompare(b.character.name, 'pt-BR') || a.unlock.node.sort_order - b.unlock.node.sort_order;
    });
  }, [characters, nodes, playerMap]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <GitBranch className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-[.22em]">Progressão do TRILHA</span>
          </div>
          <h2 className="mt-1 font-display text-2xl text-gold-bright">Classes</h2>
          <p className="mt-1 max-w-3xl text-sm text-parchment-dim">Consulta completa da árvore de classes, vínculos e requisitos. O Mestre também controla quais casas cada personagem já conhece.</p>
        </div>
        <button onClick={async()=>{await load();await loadReveals(revealCharacterId)}} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-xl border border-gold-dim bg-gradient-card p-4">
          <p className="text-[10px] uppercase tracking-[.18em] text-parchment-dim">Total</p>
          <p className="mt-1 font-display text-2xl text-gold-bright">{nodes.length || '—'}</p>
          <p className="text-xs text-parchment-dim">classes/evoluções</p>
        </div>
        {STAGES.map((stage) => (
          <div key={stage.key} className="rounded-xl border border-gold-dim bg-gradient-card p-4">
            <p className="text-[10px] uppercase tracking-[.18em] text-parchment-dim">{stage.label}</p>
            <p className="mt-1 font-display text-2xl text-gold-bright">{counts[stage.key] ?? '—'}</p>
            <p className="text-xs text-parchment-dim">níveis {stage.levels}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gold-dim bg-shadow/35 p-4 flex gap-3 items-start">
        <BookOpen className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-sm text-gold-bright">Antes da primeira classe</p>
          <p className="mt-1 text-sm text-parchment-dim">Níveis 1–4: <b className="text-parchment">Aprendiz</b>, sem classe especializada. A árvore começa no nível 5.</p>
        </div>
      </div>

      {!loading && !error && (
        <section className="rounded-2xl border border-gold-dim bg-shadow/25 overflow-hidden">
          <div className="px-4 py-4 border-b border-gold-dim bg-shadow/45 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <Route className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-[.2em] text-parchment-dim">Visível apenas ao Mestre</p>
                <h3 className="font-display text-lg text-gold-bright">Possibilidades de evolução abertas</h3>
                <p className="mt-1 text-xs text-parchment-dim">Caminhos aparecem assim que os requisitos de construção forem alcançados, mesmo antes do nível em que a classe poderá ser assumida. Bônus raciais e de linhagem não contam nos pré-requisitos.</p>
              </div>
            </div>
            <span className="rounded-full border border-gold-dim bg-stone/50 px-3 py-1 text-xs text-gold">{unlockedPossibilities.length} aberta(s)</span>
          </div>
          <div className="p-4">
            {unlockedPossibilities.length === 0 ? (
              <p className="text-sm text-parchment-dim">Nenhum personagem possui uma nova possibilidade de classe neste momento.</p>
            ) : (
              <div className="grid lg:grid-cols-2 gap-3">
                {unlockedPossibilities.map(({ character, owner, unlock }) => (
                  <article key={`${character.id}:${unlock.node.id}`} className="rounded-xl border border-gold-dim bg-gradient-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[.16em] text-parchment-dim">{owner?.player_name || owner?.alcunha || 'Jogador'} · {character.name}</p>
                        <h4 className="mt-1 font-display text-lg text-gold-bright">{unlock.node.name}</h4>
                        <p className="mt-1 text-xs text-gold">{unlock.path.join(' → ')}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[.14em] text-parchment-dim">{unlock.node.stage} · Nv. {unlock.node.level_min}+</span>
                    </div>
                    <div className="mt-4 rounded-lg border border-gold-dim/70 bg-shadow/35 p-3">
                      <p className="text-xs text-gold">Requisito da classe</p>
                      <p className="mt-1 text-sm text-parchment">{unlock.node.requirement_text}</p>
                      <p className="mt-2 text-xs text-parchment-dim">Pode assumir a partir do nível {unlock.node.level_min}. Nível atual: {character.level}.</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {unlock.checks.filter((check) => check.met && !check.key.startsWith('one-of-result:') && !check.key.startsWith('level:')).map((check) => (
                        <div key={check.key} className="flex items-start gap-2 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-parchment">{check.label}</span>
                            <span className="text-parchment-dim"> · atual {check.current} / necessário {check.required}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gold-dim bg-shadow/25 overflow-hidden">
        <div className="px-4 py-4 border-b border-gold-dim bg-shadow/45">
          <p className="text-[10px] uppercase tracking-[.2em] text-parchment-dim">Controle do Mestre</p>
          <h3 className="font-display text-lg text-gold-bright">Revelação da árvore por personagem</h3>
          <p className="mt-1 text-xs text-parchment-dim">Escolha um personagem e use os botões de cada casa abaixo para revelar ou ocultar aquela classe somente para ele.</p>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-xs text-gold">Personagem que receberá as revelações</span>
            <select
              value={revealCharacterId}
              onChange={(event) => setRevealCharacterId(event.target.value)}
              className="mt-1 w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold"
            >
              {characters.length === 0 && <option value="">Nenhum personagem cadastrado</option>}
              {characters.map((character) => {
                const owner = playerMap.get(character.player_id);
                return <option key={character.id} value={character.id}>{owner?.player_name || owner?.alcunha || 'Jogador'} — {character.name}</option>;
              })}
            </select>
          </label>
          <div className="rounded-lg border border-gold-dim bg-stone/40 px-4 py-2 text-sm text-parchment-dim">
            <span className="text-gold-bright">{revealedIds.size}</span> casas reveladas{revealCharacter ? ` para ${revealCharacter.name}` : ''}
          </div>
        </div>
        {revealOwner && revealCharacter && <p className="px-4 pb-4 text-xs text-parchment-dim">Jogador: <span className="text-parchment">{revealOwner.player_name || revealOwner.alcunha}</span> · Personagem: <span className="text-parchment">{revealCharacter.name}</span></p>}
        {revealError && <div className="mx-4 mb-4 rounded-lg border border-red-800/60 bg-red-950/20 p-3 text-xs text-red-100">{revealError}<br/><span className="text-parchment-dim">Se a tabela ainda não existir, execute a migration da Etapa 3 no Supabase.</span></div>}
      </section>

      <div className="grid lg:grid-cols-[1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="text-xs text-gold">Buscar em todas as 180 classes</span>
          <div className="mt-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-parchment-dim" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, requisito, habilidade, classe-pai..."
              className="w-full bg-shadow/60 border border-gold-dim rounded-lg pl-9 pr-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold"
            />
          </div>
        </label>
        <label className="block min-w-[220px]">
          <span className="text-xs text-gold">Árvore exibida</span>
          <select
            value={rootFilter}
            onChange={(event) => setRootFilter(event.target.value)}
            className="mt-1 w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold"
          >
            <option value="__all__">Todas as 12 árvores</option>
            {roots.map((root) => <option key={root} value={root}>{root}</option>)}
          </select>
        </label>
      </div>

      {loading && <div className="rounded-xl border border-gold-dim bg-gradient-card p-8 text-center text-parchment-dim">Carregando árvore de classes...</div>}

      {!loading && error && (
        <div className="rounded-xl border border-red-800/70 bg-red-950/25 p-5">
          <p className="font-display text-red-200">Não foi possível carregar as classes</p>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <p className="mt-3 text-xs text-parchment-dim">Execute no Supabase a migration <b>20261003213000_class_tree_stage1.sql</b> incluída nesta versão.</p>
        </div>
      )}

      {!loading && !error && nodes.length === 0 && (
        <div className="rounded-xl border border-gold-dim bg-gradient-card p-8 text-center text-parchment-dim">Nenhuma classe cadastrada.</div>
      )}

      {!loading && !error && normalizedQuery && (
        <section className="rounded-2xl border border-gold-dim bg-shadow/25 overflow-hidden">
          <div className="px-4 py-3 border-b border-gold-dim bg-shadow/45">
            <h3 className="font-display text-gold-bright">Resultados da busca</h3>
            <p className="text-xs text-parchment-dim">{searchResults.length} resultado(s)</p>
          </div>
          <div className="p-4 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {searchResults.map((node) => (
              <button
                key={node.id}
                onClick={() => { setSelectedId(node.id); setRootFilter(node.root_class); setQuery(''); }}
                className="text-left rounded-xl border border-gold-dim bg-gradient-card p-4 hover:border-gold"
              >
                <div className="flex items-center justify-between gap-2">
                  <b className="font-display text-gold-bright">{node.name}</b>
                  <span className="text-[10px] uppercase tracking-[.12em] text-gold">{node.stage}</span>
                </div>
                <p className="mt-1 text-xs text-parchment-dim">{node.root_class} · níveis {node.level_min}–{node.level_max}</p>
                <p className="mt-2 text-xs text-parchment/90">{node.requirement_text}</p>
              </button>
            ))}
            {searchResults.length === 0 && <p className="text-sm text-parchment-dim">Nenhuma classe encontrada.</p>}
          </div>
        </section>
      )}

      {!loading && !error && !normalizedQuery && (
        <div className="space-y-5">
          {visibleRoots.map((root) => (
            <BranchTree
              key={root}
              root={root}
              nodes={nodes}
              selectedId={selectedId}
              onSelect={(node) => setSelectedId(node.id)}
              revealCharacterId={revealCharacterId}
              revealedIds={revealedIds}
              revealBusyId={revealBusyId}
              onToggleReveal={toggleReveal}
            />
          ))}
        </div>
      )}

      {selected && !error && (
        <section className="rounded-2xl border border-gold bg-gradient-card overflow-hidden">
          <div className="px-5 py-4 border-b border-gold-dim bg-shadow/45 flex items-start gap-3">
            <Layers3 className="w-5 h-5 text-gold shrink-0 mt-1" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[.2em] text-parchment-dim">Detalhes selecionados</p>
              <h3 className="font-display text-xl text-gold-bright">{selected.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-parchment-dim">
                {path.map((name, index) => (
                  <span key={`${name}-${index}`} className="inline-flex items-center gap-1">
                    {index > 0 && <ChevronRight className="w-3 h-3 text-gold" />}{name}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {revealCharacterId && <div className="px-5 py-3 border-b border-gold-dim bg-shadow/30 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-parchment-dim">Visibilidade para <span className="text-parchment">{revealCharacter?.name || 'personagem selecionado'}</span></p>
            <button
              type="button"
              disabled={revealBusyId === selected.id}
              onClick={() => toggleReveal(selected)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${revealedIds.has(selected.id) ? 'border-gold bg-gold/10 text-gold-bright' : 'border-gold-dim text-parchment-dim hover:text-gold'}`}
            >
              {revealedIds.has(selected.id) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {revealedIds.has(selected.id) ? 'Ocultar esta classe' : 'Revelar esta classe'}
            </button>
          </div>}
          <div className="p-5 grid md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-gold">Estágio</p><p className="mt-1 text-parchment">{selected.stage} · níveis {selected.level_min}–{selected.level_max}</p></div>
            <div><p className="text-xs text-gold">Classe inicial</p><p className="mt-1 text-parchment">{selected.root_class}</p></div>
            <div><p className="text-xs text-gold">Classe anterior</p><p className="mt-1 text-parchment">{selected.parent_name || 'Aprendiz'}</p></div>
            <div className="md:col-span-2 xl:col-span-3 rounded-xl border border-gold-dim bg-shadow/35 p-4">
              <p className="text-xs text-gold">Requisito</p>
              <p className="mt-1 text-parchment leading-relaxed">{selected.requirement_text}</p>
            </div>
            {selected.attributes_base && <div><p className="text-xs text-gold">Atributos-base</p><p className="mt-1 text-parchment">{selected.attributes_base}</p></div>}
            {selected.attribute_fixed && <div><p className="text-xs text-gold">Atributo principal</p><p className="mt-1 text-parchment">{selected.attribute_fixed}</p></div>}
            {(selected.attribute_alternative_a || selected.attribute_alternative_b) && <div><p className="text-xs text-gold">Alternativas de atributo</p><p className="mt-1 text-parchment">{[selected.attribute_alternative_a, selected.attribute_alternative_b].filter(Boolean).join(' ou ')}</p></div>}
            {selected.primary_skill && <div><p className="text-xs text-gold">Habilidade principal</p><p className="mt-1 text-parchment">{selected.primary_skill}</p></div>}
            {selected.secondary_skill && <div><p className="text-xs text-gold">Habilidade secundária</p><p className="mt-1 text-parchment">{selected.secondary_skill}</p></div>}
            {selected.primary_theme && <div><p className="text-xs text-gold">Tema principal</p><p className="mt-1 text-parchment">{selected.primary_theme}</p></div>}
            {selected.secondary_theme && <div><p className="text-xs text-gold">Tema secundário</p><p className="mt-1 text-parchment">{selected.secondary_theme}</p></div>}
            {selected.description && <div className="md:col-span-2 xl:col-span-3"><p className="text-xs text-gold">Descrição</p><p className="mt-1 text-parchment whitespace-pre-wrap">{selected.description}</p></div>}
          </div>
        </section>
      )}
    </section>
  );
}
