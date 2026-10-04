import { useCallback, useEffect, useMemo, useState } from 'react';
import { GitBranch, RefreshCw, Search, ChevronRight, BookOpen, Layers3 } from 'lucide-react';
import { supabase, type ClassNode } from '@/lib/supabase';

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

function NodeCard({ node, selected, onClick }: { node: ClassNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border p-3 transition hover:border-gold ${stageTone[node.stage]} ${selected ? 'ring-1 ring-gold border-gold' : ''}`}
    >
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
  );
}

function BranchTree({
  root,
  nodes,
  selectedId,
  onSelect,
}: {
  root: string;
  nodes: ClassNode[];
  selectedId: string | null;
  onSelect: (node: ClassNode) => void;
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
                    <NodeCard key={node.id} node={node} selected={selectedId === node.id} onClick={() => onSelect(node)} />
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

export default function ClassTreeAdmin() {
  const [nodes, setNodes] = useState<ClassNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rootFilter, setRootFilter] = useState('__all__');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-gold">
            <GitBranch className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-[.22em]">Progressão do TRILHA</span>
          </div>
          <h2 className="mt-1 font-display text-2xl text-gold-bright">Classes</h2>
          <p className="mt-1 max-w-3xl text-sm text-parchment-dim">Consulta completa da árvore de classes, vínculos e requisitos. Nesta etapa a estrutura é somente leitura.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm">
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
            <BranchTree key={root} root={root} nodes={nodes} selectedId={selectedId} onSelect={(node) => setSelectedId(node.id)} />
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
