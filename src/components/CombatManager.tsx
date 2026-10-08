import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Crosshair, Play, Plus, RefreshCw, Save, Shield, Skull, Sparkles, Swords, Trash2 } from 'lucide-react';
import { supabase, type Character, type Player, type CombatAction } from '@/lib/supabase';

type Difficulty = 'facil' | 'moderado' | 'dificil' | 'mortal';
type Monster = {
  id: string; name: string; category: string; threat: number; max_hp: number;
  attack_pool: number; defense_pool: number; damage: number; absorption: number;
  initiative: number; movement: number; description: string | null; public_description: string | null;
  image_url: string | null; active: boolean;
};
type Encounter = {
  id: string; title: string; difficulty: Difficulty; status: 'preparing'|'active'|'ended';
  round: number; current_turn_index: number; budget: number; effective_threat: number;
  started_at: string | null; ended_at: string | null; created_at: string;
};
type Enemy = {
  id: string; encounter_id: string; monster_id: string | null; name: string; max_hp: number; current_hp: number;
  attack_pool: number; defense_pool: number; damage: number; absorption: number; initiative: number; movement: number;
  state: string; action_available: boolean; movement_available: boolean; reaction_available: boolean;
  target_character_id: string | null; sort_order: number; image_url: string | null;
};
type Participant = {
  id: string; encounter_id: string; participant_type: 'character'|'enemy'; character_id: string | null; enemy_id: string | null;
  initiative: number; sort_order: number;
};
type SavedTemplate = { id: string; name: string; difficulty: Difficulty; selection: Record<string, number>; created_at: string };

const difficultyLabels: Record<Difficulty, string> = { facil: 'Fácil', moderado: 'Moderado', dificil: 'Difícil', mortal: 'Mortal' };
const difficultyMultiplier: Record<Difficulty, number> = { facil: .65, moderado: 1, dificil: 1.35, mortal: 1.7 };
const groupMultiplier = (count: number) => count <= 1 ? 1 : count <= 3 ? 1.1 : count <= 6 ? 1.25 : 1.5;
const initiativeOf = (c: Character) => Number(c.attributes?.Percepção || 0) + Number(c.attributes?.Raciocínio || 0);
const partyPowerOf = (chars: Character[]) => chars.reduce((sum, c) => sum + Math.max(2, Number(c.level || 1) + 2), 0);
const budgetFor = (chars: Character[], difficulty: Difficulty) => Math.max(1, Math.round(partyPowerOf(chars) * difficultyMultiplier[difficulty]));

function stateFromHp(current: number, max: number) {
  if (current <= 0) return 'Derrotado';
  const ratio = max > 0 ? current / max : 0;
  if (ratio <= .25) return 'Gravemente ferido';
  if (ratio <= .55) return 'Ferido';
  return 'Saudável';
}

export default function CombatManager({ player, characters }: { player: Player; characters: Character[] }) {
  const [combatCharacters, setCombatCharacters] = useState<Character[]>(characters);
  useEffect(() => { setCombatCharacters(characters); }, [characters]);
  const aliveCharacters = useMemo(() => combatCharacters.filter(c => c.status === 'vivo' && (c.current_hp ?? 1) > 0), [combatCharacters]);
  const [mode, setMode] = useState<'builder'|'bestiary'|'current'|'history'>('builder');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderado');
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [pendingActions, setPendingActions] = useState<CombatAction[]>([]);
  const [templates, setTemplates] = useState<SavedTemplate[]>([]);
  const [history, setHistory] = useState<Encounter[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [monsterCategory, setMonsterCategory] = useState('Todos');
  const [enemyTargets, setEnemyTargets] = useState<Record<string,string>>({});

  const budget = useMemo(() => budgetFor(aliveCharacters, difficulty), [aliveCharacters, difficulty]);
  const rawThreat = useMemo(() => Object.entries(selection).reduce((sum, [id, qty]) => sum + (monsters.find(m => m.id === id)?.threat || 0) * qty, 0), [selection, monsters]);
  const enemyCount = useMemo(() => Object.values(selection).reduce((a, b) => a + b, 0), [selection]);
  const effectiveThreat = Math.round(rawThreat * groupMultiplier(enemyCount) * 10) / 10;
  const encounterFit = effectiveThreat <= budget * .75 ? 'Abaixo do orçamento' : effectiveThreat <= budget * 1.1 ? 'Dentro do orçamento' : effectiveThreat <= budget * 1.35 ? 'Acima do orçamento' : 'Muito acima do orçamento';

  const loadAll = useCallback(async () => {
    setError('');
    const [m, e, t, h] = await Promise.all([
      supabase.from('bestiary_monsters').select('*').eq('active', true).order('category').order('threat').order('name'),
      supabase.from('combat_encounters').select('*').eq('status', 'active').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('combat_encounter_templates').select('*').order('created_at', { ascending: false }),
      supabase.from('combat_encounters').select('*').eq('status', 'ended').order('ended_at', { ascending: false }).limit(20),
    ]);
    if (m.error && !String(m.error.message).includes('bestiary_monsters')) setError(m.error.message);
    setMonsters((m.data || []) as Monster[]);
    setEncounter((e.data || null) as Encounter | null);
    setTemplates((t.data || []) as SavedTemplate[]);
    setHistory((h.data || []) as Encounter[]);
  }, []);

  const loadCurrent = useCallback(async (active: Encounter | null = encounter) => {
    if (!active) { setEnemies([]); setParticipants([]); setPendingActions([]); return; }
    const [en, pa, ac, ch] = await Promise.all([
      supabase.from('combat_enemies').select('*').eq('encounter_id', active.id).order('sort_order').order('name'),
      supabase.from('combat_participants').select('*').eq('encounter_id', active.id).order('sort_order'),
      supabase.from('combat_actions').select('*').in('status', ['awaiting_defense','awaiting_master']).order('created_at', { ascending: true }),
      supabase.from('characters').select('*').order('created_at'),
    ]);
    setEnemies((en.data || []) as Enemy[]);
    setParticipants((pa.data || []) as Participant[]);
    setPendingActions((ac.data || []) as CombatAction[]);
    if (ch.data) setCombatCharacters(ch.data as Character[]);
  }, [encounter]);

  useEffect(() => { void loadAll(); }, [loadAll]);
  useEffect(() => { void loadCurrent(encounter); }, [encounter?.id, loadCurrent]);

  useEffect(() => {
    if (!encounter) return;
    const channel = supabase.channel(`trilha-master-combat-${encounter.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_actions' }, () => void loadCurrent(encounter))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_enemies', filter: `encounter_id=eq.${encounter.id}` }, () => void loadCurrent(encounter))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_encounters', filter: `id=eq.${encounter.id}` }, async () => {
        const { data } = await supabase.from('combat_encounters').select('*').eq('id', encounter.id).maybeSingle();
        if (data) setEncounter(data as Encounter);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [encounter?.id, loadCurrent]);

  const filteredMonsters = useMemo(() => monsters.filter(m => {
    const s = monsterSearch.trim().toLowerCase();
    return (monsterCategory === 'Todos' || m.category === monsterCategory) && (!s || `${m.name} ${m.category} ${m.description || ''}`.toLowerCase().includes(s));
  }), [monsters, monsterSearch, monsterCategory]);
  const categories = useMemo(() => ['Todos', ...Array.from(new Set(monsters.map(m => m.category)))], [monsters]);

  const setQty = (id: string, qty: number) => setSelection(prev => ({ ...prev, [id]: Math.max(0, Math.min(20, qty)) }));

  const autoBuild = () => {
    const candidates = [...monsters].filter(m => m.threat > 0).sort((a,b) => b.threat - a.threat);
    if (!candidates.length) return;
    let remaining = budget;
    const next: Record<string, number> = {};
    let guard = 0;
    while (remaining > 0 && guard < 40) {
      guard += 1;
      const count = Object.values(next).reduce((a,b)=>a+b,0);
      const fit = candidates.find(m => m.threat <= Math.max(1, remaining / groupMultiplier(count + 1))) || candidates[candidates.length - 1];
      if (!fit || fit.threat > remaining * 1.5) break;
      next[fit.id] = (next[fit.id] || 0) + 1;
      const raw = Object.entries(next).reduce((sum,[id,q]) => sum + (monsters.find(m=>m.id===id)?.threat || 0) * q, 0);
      const effective = raw * groupMultiplier(Object.values(next).reduce((a,b)=>a+b,0));
      remaining = budget - effective;
      if (effective >= budget * .88) break;
    }
    setSelection(next);
  };

  const saveTemplate = async () => {
    const name = prompt('Nome deste encontro para reutilizar:');
    if (!name?.trim()) return;
    const cleaned = Object.fromEntries(Object.entries(selection).filter(([,q]) => q > 0));
    const { error: e } = await supabase.from('combat_encounter_templates').insert({ name: name.trim(), difficulty, selection: cleaned, created_by: player.id });
    if (e) alert(e.message); else await loadAll();
  };

  const startEncounter = async () => {
    const selected = Object.entries(selection).filter(([,q]) => q > 0);
    if (!selected.length) { alert('Adicione ao menos um inimigo.'); return; }
    if (!aliveCharacters.length) { alert('Não há personagens vivos disponíveis para o encontro.'); return; }
    if (encounter) { alert('Já existe um combate ativo. Encerre-o antes de iniciar outro.'); setMode('current'); return; }
    const title = prompt('Nome do encontro:', `Encontro ${difficultyLabels[difficulty]}`)?.trim() || `Encontro ${difficultyLabels[difficulty]}`;
    setBusy(true); setError('');
    const { data: enc, error: encError } = await supabase.from('combat_encounters').insert({ title, difficulty, status: 'active', round: 1, current_turn_index: 0, budget, effective_threat: effectiveThreat, created_by: player.id, started_at: new Date().toISOString() }).select('*').single();
    if (encError || !enc) { setError(encError?.message || 'Não foi possível criar o encontro.'); setBusy(false); return; }
    const enemyRows: any[] = [];
    for (const [monsterId, qty] of selected) {
      const m = monsters.find(x => x.id === monsterId); if (!m) continue;
      for (let i=1;i<=qty;i++) enemyRows.push({ encounter_id: enc.id, monster_id: m.id, name: qty > 1 ? `${m.name} ${i}` : m.name, max_hp: m.max_hp, current_hp: m.max_hp, attack_pool: m.attack_pool, defense_pool: m.defense_pool, damage: m.damage, absorption: m.absorption, initiative: m.initiative, movement: m.movement, image_url: m.image_url, state: 'ativo', sort_order: enemyRows.length });
    }
    const { data: insertedEnemies, error: enemyError } = await supabase.from('combat_enemies').insert(enemyRows).select('*');
    if (enemyError) { setError(enemyError.message); setBusy(false); return; }
    const participantRows: any[] = [
      ...aliveCharacters.map(c => ({ encounter_id: enc.id, participant_type: 'character', character_id: c.id, initiative: initiativeOf(c) })),
      ...((insertedEnemies || []) as Enemy[]).map(e => ({ encounter_id: enc.id, participant_type: 'enemy', enemy_id: e.id, initiative: e.initiative })),
    ].sort((a,b)=>b.initiative-a.initiative).map((p,i)=>({ ...p, sort_order:i }));
    const { error: partError } = await supabase.from('combat_participants').insert(participantRows);
    if (partError) { setError(partError.message); setBusy(false); return; }
    await supabase.from('characters').update({ combat_action_available: true, combat_movement_available: true, combat_reaction_available: true }).in('id', aliveCharacters.map(c=>c.id));
    setEncounter(enc as Encounter); setMode('current'); setBusy(false); await loadCurrent(enc as Encounter);
  };

  const currentParticipant = participants[encounter?.current_turn_index || 0];
  const currentCharacter = currentParticipant?.character_id ? combatCharacters.find(c=>c.id===currentParticipant.character_id) : null;
  const currentEnemy = currentParticipant?.enemy_id ? enemies.find(e => e.id === currentParticipant.enemy_id) : null;

  const resetParticipantResources = async (p: Participant | undefined) => {
    if (!p) return;
    if (p.participant_type === 'character' && p.character_id) await supabase.from('characters').update({ combat_action_available: true, combat_movement_available: true, combat_reaction_available: true }).eq('id', p.character_id);
    if (p.participant_type === 'enemy' && p.enemy_id) await supabase.from('combat_enemies').update({ action_available: true, movement_available: true, reaction_available: true }).eq('id', p.enemy_id);
  };

  const moveTurn = async (direction: 1|-1) => {
    if (!encounter || !participants.length || busy) return;
    setBusy(true);
    const len = participants.length;
    let nextIndex = encounter.current_turn_index + direction;
    let nextRound = encounter.round;
    if (nextIndex >= len) { nextIndex = 0; nextRound += 1; }
    if (nextIndex < 0) { nextIndex = len - 1; nextRound = Math.max(1, nextRound - 1); }
    const nextParticipant = participants[nextIndex];
    if (direction === 1) await resetParticipantResources(nextParticipant);
    const { data, error: e } = await supabase.from('combat_encounters').update({ current_turn_index: nextIndex, round: nextRound }).eq('id', encounter.id).select('*').single();
    if (e) setError(e.message); else setEncounter(data as Encounter);
    setBusy(false);
  };

  const toggleCharacterResource = async (c: Character, field: 'combat_action_available'|'combat_movement_available'|'combat_reaction_available') => {
    await supabase.from('characters').update({ [field]: !((c as any)[field] !== false) }).eq('id', c.id);
    setCombatCharacters(rows => rows.map(row => row.id === c.id ? ({ ...row, [field]: !((c as any)[field] !== false) } as Character) : row));
  };
  const toggleEnemyResource = async (e: Enemy, field: 'action_available'|'movement_available'|'reaction_available') => {
    await supabase.from('combat_enemies').update({ [field]: !(e as any)[field] }).eq('id', e.id); await loadCurrent();
  };

  const enemyAttack = async (enemy: Enemy) => {
    const targetId = enemyTargets[enemy.id] || aliveCharacters[0]?.id;
    if (!targetId) { alert('Escolha um personagem como alvo.'); return; }
    const { error: e } = await supabase.rpc('master_enemy_attack', { p_master_player_id: player.id, p_enemy_id: enemy.id, p_target_character_id: targetId });
    if (e) alert(e.message); else await loadCurrent();
  };

  const resolveAction = async (action: CombatAction, difficultyValue = 6) => {
    const { error: e } = await supabase.rpc('resolve_combat_action', { p_player_id: player.id, p_combat_action_id: action.id, p_difficulty: difficultyValue });
    if (e) alert(e.message); else await loadCurrent();
  };
  const voidAction = async (action: CombatAction) => {
    const { error: e } = await supabase.rpc('void_combat_action', { p_player_id: player.id, p_combat_action_id: action.id });
    if (e) alert(e.message); else await loadCurrent();
  };

  const endEncounter = async () => {
    if (!encounter || !confirm(`Encerrar ${encounter.title}?`)) return;
    const summary = { rounds: encounter.round, enemies_defeated: enemies.filter(e=>e.current_hp<=0).length, enemies_total: enemies.length };
    const { error: e } = await supabase.from('combat_encounters').update({ status: 'ended', ended_at: new Date().toISOString(), summary }).eq('id', encounter.id);
    if (e) alert(e.message); else { setEncounter(null); setEnemies([]); setParticipants([]); setMode('history'); await loadAll(); }
  };

  const createMonster = async () => {
    const name = prompt('Nome do monstro:')?.trim(); if (!name) return;
    const category = prompt('Categoria:', 'Monstruosidade')?.trim() || 'Outros';
    const max_hp = Math.max(1, Number(prompt('PV máximo:', '12')) || 12);
    const attack_pool = Math.max(1, Number(prompt('Reserva de ataque (d10):', '4')) || 4);
    const defense_pool = Math.max(0, Number(prompt('Reserva de defesa (d10):', '3')) || 3);
    const damage = Math.max(0, Number(prompt('Dano base:', '3')) || 3);
    const absorption = Math.max(0, Number(prompt('Absorção:', '0')) || 0);
    const initiative = Math.max(0, Number(prompt('Iniciativa:', '4')) || 4);
    const movement = Math.max(0, Number(prompt('Movimento (m):', '8')) || 8);
    const suggestedThreat = Math.max(1, Math.min(20, Math.round((attack_pool + defense_pool) / 3 + max_hp / 18 + damage / 4 + absorption / 2)));
    const threat = Math.max(1, Number(prompt(`Ameaça sugerida pelo sistema: ${suggestedThreat}.\nVocê pode substituir:`, String(suggestedThreat))) || suggestedThreat);
    const description = prompt('Descrição / notas do Mestre:', '') || null;
    const public_description = prompt('Descrição visível aos jogadores:', '') || null;
    const { error: e } = await supabase.from('bestiary_monsters').insert({ name, category, threat, max_hp, attack_pool, defense_pool, damage, absorption, initiative, movement, description, public_description, created_by: player.id });
    if (e) alert(e.message); else await loadAll();
  };

  const deleteMonster = async (m: Monster) => {
    if (!confirm(`Remover ${m.name} do Bestiário?`)) return;
    const { error: e } = await supabase.from('bestiary_monsters').update({ active:false }).eq('id',m.id); if (e) alert(e.message); else await loadAll();
  };

  const resourcePill = (label: string, available: boolean, onClick: () => void) => <button type="button" onClick={onClick} className={`trilha-combat-resource ${available ? 'is-ready' : 'is-spent'}`}><span>{label}</span><b>{available ? 'Disponível' : 'Usado'}</b></button>;

  return <section className="trilha-combat-manager">
    <div className="trilha-combat-manager-head">
      <div><span className="trilha-kicker">Controle da mesa</span><h2 className="font-display">Combate & Encontros</h2><p>Monte encontros, acompanhe turnos e envie inimigos para o combate.</p></div>
      <button onClick={() => { void loadAll(); void loadCurrent(); }} className="trilha-ui-button"><RefreshCw className="w-4 h-4"/>Atualizar</button>
    </div>
    {error && <div className="trilha-combat-error"><AlertTriangle className="w-4 h-4"/>{error}<span>Se esta é a primeira vez usando a aba, aplique o SQL desta atualização no Supabase.</span></div>}
    <div className="trilha-subtabs">
      {([['builder','Criar Encontro',Sparkles],['bestiary','Bestiário',Skull],['current','Combate Atual',Swords],['history','Histórico',Shield]] as const).map(([key,label,Icon]) => <button key={key} onClick={()=>setMode(key)} className={mode===key?'is-active':''}><Icon className="w-4 h-4"/>{label}{key==='current'&&encounter&&<i/>}</button>)}
    </div>

    {mode === 'builder' && <div className="space-y-5">
      <div className="trilha-encounter-overview">
        <div><span>Grupo</span><b>{aliveCharacters.length} personagem{aliveCharacters.length===1?'':'s'}</b><small>Poder-base {partyPowerOf(aliveCharacters)}</small></div>
        <div><span>Dificuldade</span><select value={difficulty} onChange={e=>setDifficulty(e.target.value as Difficulty)}>{Object.entries(difficultyLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><small>Define o orçamento recomendado</small></div>
        <div><span>Orçamento</span><b>{budget}</b><small>pontos de Ameaça efetiva</small></div>
        <div className={effectiveThreat > budget*1.35 ? 'is-danger' : effectiveThreat > budget*1.1 ? 'is-warning' : 'is-ok'}><span>Encontro montado</span><b>{effectiveThreat}</b><small>{encounterFit}</small></div>
      </div>
      <div className="flex flex-wrap gap-2"><button className="trilha-ui-button is-primary" onClick={autoBuild}><Sparkles className="w-4 h-4"/>Montar automaticamente</button><button className="trilha-ui-button" onClick={saveTemplate} disabled={!enemyCount}><Save className="w-4 h-4"/>Salvar modelo</button>{templates.slice(0,4).map(t=><button key={t.id} className="trilha-ui-button is-quiet" onClick={()=>{setDifficulty(t.difficulty);setSelection(t.selection||{});}}>{t.name}</button>)}</div>
      <div className="trilha-bestiary-grid">{monsters.map(m=>{const qty=selection[m.id]||0;return <article key={m.id} className={`trilha-monster-card ${qty?'is-selected':''}`}><div className="trilha-monster-card-head"><div><span>{m.category}</span><h3>{m.name}</h3></div><b>Ameaça {m.threat}</b></div><p>{m.public_description||m.description||'Sem descrição.'}</p><div className="trilha-monster-stats"><span>PV <b>{m.max_hp}</b></span><span>Ataque <b>{m.attack_pool}d10</b></span><span>Defesa <b>{m.defense_pool}d10</b></span><span>Dano <b>{m.damage}</b></span></div><div className="trilha-quantity"><button onClick={()=>setQty(m.id,qty-1)}>−</button><b>{qty}</b><button onClick={()=>setQty(m.id,qty+1)}>+</button></div></article>})}</div>
      <div className="trilha-encounter-footer"><div><b>{enemyCount} inimigo{enemyCount===1?'':'s'}</b><span>Ameaça bruta {rawThreat} · efetiva {effectiveThreat} · orçamento {budget}</span></div><button onClick={startEncounter} disabled={busy||!enemyCount} className="trilha-ui-button is-primary is-large"><Play className="w-4 h-4"/>{busy?'Preparando...':'Iniciar encontro'}</button></div>
    </div>}

    {mode === 'bestiary' && <div className="space-y-4">
      <div className="trilha-bestiary-toolbar"><input placeholder="Buscar no bestiário..." value={monsterSearch} onChange={e=>setMonsterSearch(e.target.value)}/><select value={monsterCategory} onChange={e=>setMonsterCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><button onClick={createMonster} className="trilha-ui-button is-primary"><Plus className="w-4 h-4"/>Criar inimigo</button></div>
      <div className="trilha-bestiary-grid">{filteredMonsters.map(m=><article key={m.id} className="trilha-monster-card"><div className="trilha-monster-card-head"><div><span>{m.category}</span><h3>{m.name}</h3></div><b>Ameaça {m.threat}</b></div><p>{m.description||m.public_description||'Sem descrição.'}</p><div className="trilha-monster-stats"><span>PV <b>{m.max_hp}</b></span><span>Ataque <b>{m.attack_pool}d10</b></span><span>Defesa <b>{m.defense_pool}d10</b></span><span>Abs. <b>{m.absorption}</b></span><span>Dano <b>{m.damage}</b></span><span>Init. <b>{m.initiative}</b></span></div><div className="flex justify-end"><button onClick={()=>deleteMonster(m)} className="trilha-ui-button is-danger"><Trash2 className="w-4 h-4"/>Remover</button></div></article>)}</div>
    </div>}

    {mode === 'current' && <div>{!encounter ? <div className="trilha-empty-state"><Swords/><h3>Nenhum combate ativo</h3><p>Monte um encontro e envie os inimigos para cá.</p><button onClick={()=>setMode('builder')} className="trilha-ui-button is-primary">Criar encontro</button></div> : <div className="space-y-5">
      <div className="trilha-current-combat-head"><div><span>Rodada {encounter.round}</span><h3>{encounter.title}</h3><p>{difficultyLabels[encounter.difficulty]} · ameaça {encounter.effective_threat}/{encounter.budget}</p></div><div className="trilha-turn-controls"><button onClick={()=>moveTurn(-1)}><ChevronLeft/></button><div><small>Turno atual</small><b>{currentCharacter?.name || currentEnemy?.name || '—'}</b></div><button onClick={()=>moveTurn(1)}><ChevronRight/></button></div><button onClick={endEncounter} className="trilha-ui-button is-danger">Encerrar encontro</button></div>
      <div className="trilha-combat-columns">
        <div className="space-y-4"><h3 className="trilha-section-title">Ordem de iniciativa</h3>{participants.map((p,i)=>{const c=p.character_id?combatCharacters.find(x=>x.id===p.character_id):null;const e=p.enemy_id?enemies.find(x=>x.id===p.enemy_id):null;return <div key={p.id} className={`trilha-initiative-row ${i===encounter.current_turn_index?'is-current':''}`}><b>{i+1}</b><span>{c?.name||e?.name||'Participante'}</span><small>{p.participant_type==='character'?'Personagem':'Inimigo'}</small><strong>{p.initiative}</strong></div>})}</div>
        <div className="space-y-4"><h3 className="trilha-section-title">Recursos de turno</h3>{aliveCharacters.map(c=><article key={c.id} className="trilha-turn-card"><div><b>{c.name}</b><small>Jogador · Iniciativa {initiativeOf(c)}</small></div><div className="trilha-turn-resources">{resourcePill('Ação',c.combat_action_available!==false,()=>toggleCharacterResource(c,'combat_action_available'))}{resourcePill('Movimento',c.combat_movement_available!==false,()=>toggleCharacterResource(c,'combat_movement_available'))}{resourcePill('Reação',c.combat_reaction_available!==false,()=>toggleCharacterResource(c,'combat_reaction_available'))}</div></article>)}{enemies.map(e=><article key={e.id} className="trilha-turn-card enemy"><div><b>{e.name}</b><small>{stateFromHp(e.current_hp,e.max_hp)} · PV {e.current_hp}/{e.max_hp}</small></div><div className="trilha-turn-resources">{resourcePill('Ação',e.action_available,()=>toggleEnemyResource(e,'action_available'))}{resourcePill('Movimento',e.movement_available,()=>toggleEnemyResource(e,'movement_available'))}{resourcePill('Reação',e.reaction_available,()=>toggleEnemyResource(e,'reaction_available'))}</div><div className="trilha-enemy-attack"><select value={enemyTargets[e.id] || aliveCharacters[0]?.id || ''} onChange={ev=>setEnemyTargets(prev=>({...prev,[e.id]:ev.target.value}))}>{aliveCharacters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button disabled={!e.action_available||e.current_hp<=0||!aliveCharacters.length} onClick={()=>enemyAttack(e)} className="trilha-ui-button is-primary"><Crosshair className="w-4 h-4"/>Atacar</button></div></article>)}</div>
      </div>
      <div><h3 className="trilha-section-title">Ações pendentes</h3>{!pendingActions.length?<p className="trilha-muted">Nenhum ataque aguardando resolução.</p>:<div className="space-y-3">{pendingActions.map(a=><article key={a.id} className="trilha-pending-action"><div><b>{a.attacker_name} → {a.target_name}</b><span>{a.weapon_name} · {a.status==='awaiting_defense'?'aguardando defesa':'aguardando Mestre'}</span></div><div className="flex flex-wrap gap-2">{a.status==='awaiting_master'&&<><button onClick={()=>resolveAction(a,5)} className="trilha-ui-button">Dif. 5</button><button onClick={()=>resolveAction(a,6)} className="trilha-ui-button is-primary">Dif. 6</button><button onClick={()=>resolveAction(a,7)} className="trilha-ui-button">Dif. 7</button></>}<button onClick={()=>voidAction(a)} className="trilha-ui-button is-danger">Anular</button></div></article>)}</div>}</div>
      <div className="trilha-master-attention"><h3><AlertTriangle className="w-4 h-4"/>Atenção do Mestre</h3><div>{pendingActions.filter(a=>a.status==='awaiting_master').length>0&&<p>{pendingActions.filter(a=>a.status==='awaiting_master').length} ataque(s) aguardando sua decisão.</p>}{aliveCharacters.filter(c=>c.combat_action_available!==false&&c.combat_movement_available!==false&&c.combat_reaction_available!==false).length>0&&<p>Há personagens que ainda não gastaram recursos neste turno/rodada.</p>}{enemies.filter(e=>e.current_hp>0&&e.current_hp/e.max_hp<=.25).map(e=><p key={e.id}>{e.name} está gravemente ferido.</p>)}</div></div>
    </div>}</div>}

    {mode === 'history' && <div className="space-y-3">{history.length===0?<div className="trilha-empty-state"><Shield/><h3>Nenhum encontro encerrado</h3></div>:history.map(h=><article key={h.id} className="trilha-history-card"><div><span>{difficultyLabels[h.difficulty]}</span><h3>{h.title}</h3></div><div><b>{h.round} rodada{h.round===1?'':'s'}</b><small>{h.ended_at?new Date(h.ended_at).toLocaleString('pt-BR'):'—'}</small></div></article>)}</div>}
  </section>;
}
