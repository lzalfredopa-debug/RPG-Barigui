import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Ban, Check, Dice5, MessageCircle, Minus, Plus, Send, Shield, Star, Sword, Trash2, Users, X } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type MasterDecision = 'pending' | 'success' | 'failure' | 'void';
type CombatStatus = 'awaiting_defense' | 'awaiting_master' | 'resolved' | 'void';
type DefenseKind = 'evasion' | 'block' | 'passive';

type RollBreakdownEntry = {
  kind: 'dice' | 'constant';
  sign: 1 | -1;
  quantity?: number;
  sides?: number;
  results?: number[];
  subtotal: number;
  value?: number;
};

type ChatMessage = {
  id: string;
  player_id: string | null;
  player_name: string;
  player_identifier: string | null;
  content: string;
  message_type: 'text' | 'roll';
  roll_notation: string | null;
  roll_results: number[] | null;
  roll_total: number | null;
  roll_breakdown?: RollBreakdownEntry[] | null;
  roll_kind?: 'free' | 'action' | 'combat' | null;
  character_id?: string | null;
  character_name?: string | null;
  action_name?: string | null;
  action_source?: string | null;
  action_attribute?: string | null;
  action_skill?: string | null;
  roll_pool?: number | null;
  roll_explosion_count?: number | null;
  master_decision?: MasterDecision | null;
  master_decision_by?: string | null;
  master_decision_at?: string | null;
  combat_action_id?: string | null;
  target_character_id?: string | null;
  target_character_name?: string | null;
  defense_kind?: DefenseKind | null;
  defense_source?: string | null;
  defense_pool?: number | null;
  defense_results?: number[] | null;
  defense_explosion_count?: number | null;
  defense_passive_successes?: number | null;
  combat_difficulty?: number | null;
  attack_successes?: number | null;
  defense_successes?: number | null;
  excess_successes?: number | null;
  damage_final?: number | null;
  target_hp_after?: number | null;
  combat_status?: CombatStatus | null;
  is_highlighted: boolean;
  created_at: string;
};

type PresencePayload = {
  player_id?: string;
  player_name?: string;
  player_identifier?: string | null;
  online_at?: string;
};

type ParsedTerm =
  | { kind: 'dice'; sign: 1 | -1; quantity: number; sides: number }
  | { kind: 'constant'; sign: 1 | -1; value: number };

type ParsedExpression = { notation: string; terms: ParsedTerm[] };

type RollAnimation = {
  id: string;
  results: number[];
  sides: number;
  initialCount: number;
  title: string;
  actionName: string;
  source?: string | null;
  explosionCount?: number;
};

const ALLOWED_DICE = [2, 4, 6, 8, 10, 12, 20] as const;
const CHAT_LIMIT = 100;
const MAX_DICE = 100;

function formatTime(value: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch {
    return '';
  }
}

function secureDie(sides: number) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const max = 0xffffffff;
    const limit = max - (max % sides);
    const buffer = new Uint32Array(1);
    let value = 0;
    do {
      crypto.getRandomValues(buffer);
      value = buffer[0];
    } while (value >= limit);
    return (value % sides) + 1;
  }
  return Math.floor(Math.random() * sides) + 1;
}

function parseRollExpression(value: string): ParsedExpression | null {
  const source = value.trim().replace(/^\/(?:r|roll)\s+/i, '').replace(/\s+/g, '');
  if (!source) return null;

  const terms: ParsedTerm[] = [];
  const token = /([+-]?)(?:(\d{1,3})d(2|4|6|8|10|12|20)|(\d{1,5}))/iy;
  let cursor = 0;
  let diceCount = 0;

  while (cursor < source.length) {
    token.lastIndex = cursor;
    const match = token.exec(source);
    if (!match || match.index !== cursor) return null;

    const sign: 1 | -1 = match[1] === '-' ? -1 : 1;
    if (match[2] && match[3]) {
      const quantity = Number(match[2]);
      const sides = Number(match[3]);
      if (quantity < 1 || quantity > MAX_DICE || !ALLOWED_DICE.includes(sides as (typeof ALLOWED_DICE)[number])) return null;
      diceCount += quantity;
      if (diceCount > MAX_DICE) return null;
      terms.push({ kind: 'dice', sign, quantity, sides });
    } else {
      const constant = Number(match[4]);
      if (!Number.isFinite(constant) || constant > 10000) return null;
      terms.push({ kind: 'constant', sign, value: constant });
    }
    cursor = token.lastIndex;
  }

  if (terms.length === 0 || diceCount === 0) return null;

  const notation = terms.map((term, index) => {
    const prefix = term.sign < 0 ? '-' : index === 0 ? '' : '+';
    return term.kind === 'dice' ? `${prefix}${term.quantity}d${term.sides}` : `${prefix}${term.value}`;
  }).join('');

  return { notation, terms };
}

function decisionText(decision: MasterDecision | null | undefined) {
  if (decision === 'success') return 'Sucesso';
  if (decision === 'failure') return 'Fracasso';
  if (decision === 'void') return 'Rolagem anulada pelo Mestre';
  return 'Aguardando decisão do Mestre';
}

function defenseLabel(kind: DefenseKind | null | undefined) {
  if (kind === 'evasion') return 'Evasão';
  if (kind === 'block') return 'Bloqueio';
  if (kind === 'passive') return 'Defesa Passiva';
  return 'Defesa';
}

const DICE_BOX_THREEJS_CDN = 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/+esm';

type DiceBoxThreeInstance = {
  initialize: () => Promise<unknown>;
  roll: (notation: string) => Promise<unknown>;
};
type DiceBoxThreeConstructor = new (selector: string, config?: Record<string, unknown>) => DiceBoxThreeInstance;

function ActionRollOverlay({ animation, onComplete }: { animation: RollAnimation; onComplete: () => void }) {
  const sceneId = `trilha-dice-3d-${animation.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [status, setStatus] = useState<'loading' | 'rolling' | 'fallback'>('loading');

  useEffect(() => {
    if (animation.results.length === 0) {
      const timer = window.setTimeout(onComplete, 900);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    let finishTimer: number | null = null;
    let startTimer: number | null = null;

    async function runThreeDice() {
      try {
        const diceModule = await import(/* @vite-ignore */ DICE_BOX_THREEJS_CDN) as {
          default?: DiceBoxThreeConstructor;
          DiceBox?: DiceBoxThreeConstructor;
        };
        if (cancelled) return;

        const DiceBox = diceModule.default || diceModule.DiceBox;
        if (!DiceBox) throw new Error('DiceBox 3D não foi carregado.');

        const box = new DiceBox(`#${sceneId}`, {
          assetPath: 'https://cdn.jsdelivr.net/npm/@3d-dice/dice-box-threejs@0.0.12/public/',
          sounds: false,
          shadows: true,
          theme_colorset: 'bronze',
          theme_texture: '',
          theme_material: 'metal',
          gravity_multiplier: 420,
          light_intensity: 0.78,
          baseScale: 82,
          strength: 1.15,
        });

        await box.initialize();
        if (cancelled) return;
        setStatus('rolling');
        const notation = `${animation.results.length}d${animation.sides}@${animation.results.join(',')}`;
        await box.roll(notation);
        if (cancelled) return;
        finishTimer = window.setTimeout(onComplete, 1350);
      } catch (error) {
        console.warn('TRILHA: não foi possível carregar a animação 3D de dados.', error);
        if (cancelled) return;
        setStatus('fallback');
        finishTimer = window.setTimeout(onComplete, 2300);
      }
    }

    startTimer = window.setTimeout(runThreeDice, 80);
    return () => {
      cancelled = true;
      if (startTimer !== null) window.clearTimeout(startTimer);
      if (finishTimer !== null) window.clearTimeout(finishTimer);
      const scene = document.getElementById(sceneId);
      if (scene) scene.replaceChildren();
    };
  }, [animation, onComplete, sceneId]);

  return (
    <div className="trilha-roll-overlay trilha-roll-overlay-3d" aria-live="polite" aria-label={`Rolagem de ${animation.title}`}>
      <div className="trilha-roll-overlay-content trilha-roll-overlay-content-3d">
        <div className="trilha-roll-overlay-title">
          {animation.actionName === 'Atacar' ? <Sword className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          <span><b>{animation.title}</b> · {animation.actionName}</span>
          {animation.source && <small>{animation.source}</small>}
        </div>
        <div className="trilha-dice3d-shell" aria-label={`${animation.results.length} dados de ${animation.sides} lados`}>
          <div id={sceneId} className="trilha-dice3d-stage" />
          {status === 'loading' && <div className="trilha-dice3d-loading" aria-hidden="true"><Dice5 className="w-5 h-5" /><span>Preparando dados…</span></div>}
          {status === 'fallback' && (
            <div className="trilha-dice3d-fallback">
              {animation.results.map((result, index) => <span key={`${animation.id}-fallback-${index}`} className={result === 10 ? 'is-ten' : result === 1 ? 'is-one' : ''}>{result}</span>)}
            </div>
          )}
        </div>
        <p className="trilha-roll-overlay-note">{animation.explosionCount ? `${animation.explosionCount} dado(s) explosivo(s) · ` : ''}resultado registrado no Chat da Mesa</p>
      </div>
    </div>
  );
}

export default function TableChat({ player }: { player: Player }) {
  const isMaster = player.player_identifier === 'Mestre';
  const displayName = player.player_name?.trim() || player.alcunha;
  const [open, setOpen] = useState(() => { try { return localStorage.getItem('trilha:chat:open') === '1'; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem('trilha:chat:open', open ? '1' : '0'); } catch { /* opcional */ } }, [open]);
  const openRef = useRef(false);
  const atBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<PresencePayload[]>([]);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState(0);
  const [newBelow, setNewBelow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceQuantity, setDiceQuantity] = useState(1);
  const [diceSides, setDiceSides] = useState<number>(10);
  const [decisionBusy, setDecisionBusy] = useState<string | null>(null);
  const [combatDifficulty, setCombatDifficulty] = useState<Record<string, number>>({});
  const [animationQueue, setAnimationQueue] = useState<RollAnimation[]>([]);
  const [animatedRoll, setAnimatedRoll] = useState<RollAnimation | null>(null);
  const animatedIds = useRef(new Set<string>());
  const listRef = useRef<HTMLDivElement>(null);
  const finishRollAnimation = useCallback(() => setAnimatedRoll(null), []);

  const queueAnimation = useCallback((animation: RollAnimation) => {
    if (animatedIds.current.has(animation.id)) return;
    animatedIds.current.add(animation.id);
    setAnimationQueue((current) => [...current, animation].slice(-8));
  }, []);

  const queueAttackAnimation = useCallback((message: ChatMessage) => {
    if (!['action', 'combat'].includes(message.roll_kind || '') || !(message.roll_results?.length)) return;
    queueAnimation({
      id: `${message.id}-attack`,
      results: message.roll_results,
      sides: 10,
      initialCount: Math.max(0, Number(message.roll_pool || 0)),
      title: message.character_name || message.player_name,
      actionName: message.action_name || 'Ação',
      source: message.action_source,
      explosionCount: Number(message.roll_explosion_count || 0),
    });
  }, [queueAnimation]);

  const queueDefenseAnimation = useCallback((message: ChatMessage) => {
    if (message.roll_kind !== 'combat' || !(message.defense_results?.length)) return;
    queueAnimation({
      id: `${message.id}-defense`,
      results: message.defense_results,
      sides: 10,
      initialCount: Math.max(0, Number(message.defense_pool || 0)),
      title: message.target_character_name || 'Defensor',
      actionName: defenseLabel(message.defense_kind),
      source: message.defense_source,
      explosionCount: Number(message.defense_explosion_count || 0),
    });
  }, [queueAnimation]);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnread(0);
      setNewBelow(false);
      initialScrollDoneRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (animatedRoll || animationQueue.length === 0) return;
    setAnimatedRoll(animationQueue[0]);
    setAnimationQueue((current) => current.slice(1));
  }, [animatedRoll, animationQueue]);

  useEffect(() => {
    if (!animatedRoll) return;
    const timeout = window.setTimeout(() => setAnimatedRoll(null), 9000);
    return () => window.clearTimeout(timeout);
  }, [animatedRoll]);

  const onlineSorted = useMemo(() => {
    const unique = new Map<string, PresencePayload>();
    online.forEach((entry) => { if (entry.player_id && !unique.has(entry.player_id)) unique.set(entry.player_id, entry); });
    return [...unique.values()].sort((a, b) => {
      const masterA = a.player_identifier === 'Mestre' ? 0 : 1;
      const masterB = b.player_identifier === 'Mestre' ? 0 : 1;
      if (masterA !== masterB) return masterA - masterB;
      return (a.player_name || '').localeCompare(b.player_name || '', 'pt-BR');
    });
  }, [online]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
        atBottomRef.current = true;
        setNewBelow(false);
      });
    });
  }, []);

  useEffect(() => {
    if (!open || loading || messages.length === 0 || initialScrollDoneRef.current) return;
    initialScrollDoneRef.current = true;
    scrollToBottom('auto');
  }, [open, loading, messages.length, scrollToBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMore || messages.length === 0) return;
    const el = listRef.current;
    const beforeHeight = el?.scrollHeight || 0;
    const oldest = messages[0].created_at;
    setLoadingOlder(true);
    const { data, error: olderError } = await supabase
      .from('chat_messages')
      .select('*')
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(CHAT_LIMIT);
    if (olderError) setError('Não foi possível carregar mensagens antigas.');
    else {
      const older = ((data || []) as ChatMessage[]).reverse();
      setHasMore(older.length === CHAT_LIMIT);
      if (older.length) {
        setMessages((current) => [...older, ...current]);
        requestAnimationFrame(() => {
          if (el) el.scrollTop += el.scrollHeight - beforeHeight;
        });
      }
    }
    setLoadingOlder(false);
  }, [hasMore, loadingOlder, messages]);

  const handleMessageScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 70;
    atBottomRef.current = nearBottom;
    if (nearBottom) setNewBelow(false);
    if (el.scrollTop < 45) void loadOlderMessages();
  };

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      setLoading(true);
      const { data, error: loadError } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(CHAT_LIMIT);
      if (!cancelled) {
        if (loadError) setError('Não foi possível carregar o Chat da Mesa.');
        else {
          const loaded = ((data || []) as ChatMessage[]).reverse();
          setMessages(loaded);
          setHasMore(loaded.length === CHAT_LIMIT);
        }
        setLoading(false);
      }
    }
    loadMessages();

    const channel = supabase.channel('trilha-chat-da-mesa', { config: { presence: { key: player.id } } });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PresencePayload[]>;
        setOnline(Object.values(state).flat());
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const incoming = payload.new as ChatMessage;
        const shouldFollow = openRef.current && atBottomRef.current;
        setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
        queueAttackAnimation(incoming);
        if (!openRef.current && incoming.player_id !== player.id) setUnread((value) => value + 1);
        else if (shouldFollow) window.setTimeout(() => scrollToBottom(), 0);
        else if (openRef.current) setNewBelow(true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const updated = payload.new as ChatMessage;
        const previous = payload.old as Partial<ChatMessage>;
        setMessages((current) => current.map((item) => item.id === updated.id ? updated : item));
        if (!(previous.defense_results as number[] | null | undefined)?.length && updated.defense_results?.length) queueDefenseAnimation(updated);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const removed = payload.old as Partial<ChatMessage>;
        if (removed.id) setMessages((current) => current.filter((item) => item.id !== removed.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ player_id: player.id, player_name: displayName, player_identifier: player.player_identifier, online_at: new Date().toISOString() });
        }
      });

    return () => {
      cancelled = true;
      channel.untrack().catch(() => undefined);
      supabase.removeChannel(channel);
    };
  }, [displayName, player.id, player.player_identifier, queueAttackAnimation, queueDefenseAnimation, scrollToBottom]);

  async function insertTextMessage(content: string) {
    const { error: sendError } = await supabase.from('chat_messages').insert({
      player_id: player.id, player_name: displayName, player_identifier: player.player_identifier, content, message_type: 'text',
    });
    if (sendError) throw sendError;
  }

  async function insertRollExpression(parsed: ParsedExpression) {
    const breakdown: RollBreakdownEntry[] = [];
    const flatResults: number[] = [];
    let total = 0;

    parsed.terms.forEach((term) => {
      if (term.kind === 'dice') {
        const results = Array.from({ length: term.quantity }, () => secureDie(term.sides));
        const rawSubtotal = results.reduce((sum, result) => sum + result, 0);
        const subtotal = rawSubtotal * term.sign;
        breakdown.push({ kind: 'dice', sign: term.sign, quantity: term.quantity, sides: term.sides, results, subtotal });
        flatResults.push(...results);
        total += subtotal;
      } else {
        const subtotal = term.value * term.sign;
        breakdown.push({ kind: 'constant', sign: term.sign, value: term.value, subtotal });
        total += subtotal;
      }
    });

    const { error: sendError } = await supabase.from('chat_messages').insert({
      player_id: player.id,
      player_name: displayName,
      player_identifier: player.player_identifier,
      content: '',
      message_type: 'roll',
      roll_kind: 'free',
      roll_notation: parsed.notation,
      roll_results: flatResults,
      roll_breakdown: breakdown,
      roll_total: total,
    });
    if (sendError) throw sendError;
  }

  async function send() {
    const value = draft.trim();
    if (!value || sending) return;
    setError('');
    setSending(true);
    try {
      if (/^\/(?:r|roll)\b/i.test(value)) {
        const parsed = parseRollExpression(value);
        if (!parsed) {
          setError('Comando inválido. Ex.: /r 3d10 + 4d20, /r 2d8 + 5. Máximo de 100 dados.');
          return;
        }
        await insertRollExpression(parsed);
      } else {
        await insertTextMessage(value.slice(0, 2000));
      }
      setDraft('');
    } catch {
      setError('Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  }

  async function quickRoll() {
    if (sending) return;
    setError('');
    setSending(true);
    try {
      const parsed = parseRollExpression(`/r ${diceQuantity}d${diceSides}`);
      if (!parsed) throw new Error('Rolagem inválida');
      await insertRollExpression(parsed);
      setDiceOpen(false);
    } catch {
      setError('Não foi possível enviar a rolagem.');
    } finally {
      setSending(false);
    }
  }

  async function decideActionRoll(message: ChatMessage, decision: Exclude<MasterDecision, 'pending'>) {
    if (!isMaster || decisionBusy) return;
    setDecisionBusy(message.id);
    setError('');
    const { error: decisionError } = await supabase.rpc('decide_action_roll', { p_player_id: player.id, p_message_id: message.id, p_decision: decision });
    if (decisionError) setError(decisionError.message || 'Não foi possível registrar a decisão do Mestre.');
    setDecisionBusy(null);
  }

  async function resolveCombat(message: ChatMessage) {
    if (!isMaster || !message.combat_action_id || decisionBusy) return;
    const difficulty = combatDifficulty[message.id] ?? message.combat_difficulty ?? 6;
    setDecisionBusy(message.id);
    setError('');
    const { error: resolveError } = await supabase.rpc('resolve_combat_action', {
      p_player_id: player.id,
      p_combat_action_id: message.combat_action_id,
      p_difficulty: difficulty,
    });
    if (resolveError) setError(resolveError.message || 'Não foi possível resolver o combate.');
    setDecisionBusy(null);
  }

  async function voidCombat(message: ChatMessage) {
    if (!isMaster || !message.combat_action_id || decisionBusy) return;
    setDecisionBusy(message.id);
    setError('');
    const { error: voidError } = await supabase.rpc('void_combat_action', { p_player_id: player.id, p_combat_action_id: message.combat_action_id });
    if (voidError) setError(voidError.message || 'Não foi possível anular o combate.');
    setDecisionBusy(null);
  }

  async function toggleHighlight(message: ChatMessage) {
    if (!isMaster) return;
    const { error: updateError } = await supabase.from('chat_messages').update({ is_highlighted: !message.is_highlighted }).eq('id', message.id);
    if (updateError) setError('Não foi possível alterar o destaque.');
  }

  async function removeMessage(message: ChatMessage) {
    if (!isMaster) return;
    if (!window.confirm('Apagar esta mensagem do Chat da Mesa?')) return;
    const { error: deleteError } = await supabase.from('chat_messages').delete().eq('id', message.id);
    if (deleteError) setError('Não foi possível apagar a mensagem.');
  }

  return (
    <>
      {animatedRoll && <ActionRollOverlay animation={animatedRoll} onComplete={finishRollAnimation} />}

      {!open && (
        <button className="trilha-chat-launcher" onClick={() => setOpen(true)} aria-label="Abrir Chat da Mesa">
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Chat da Mesa</span>
          {unread > 0 && <span className="trilha-chat-unread">{unread > 99 ? '99+' : unread}</span>}
        </button>
      )}

      {open && (
        <aside className="trilha-chat-window" aria-label="Chat da Mesa">
          <header className="trilha-chat-header">
            <div><p className="trilha-chat-eyebrow">TRILHA · comunicação da mesa</p><h2><MessageCircle className="w-4 h-4" /> Chat da Mesa</h2></div>
            <button className="trilha-chat-icon-button" onClick={() => setOpen(false)} title="Minimizar"><X className="w-4 h-4" /></button>
          </header>

          <section className="trilha-chat-presence">
            <div className="trilha-chat-presence-title"><Users className="w-3.5 h-3.5" /> Online agora <b>{onlineSorted.length}</b></div>
            <div className="trilha-chat-online-list">
              {onlineSorted.length === 0 ? <span className="trilha-chat-online-empty">Conectando...</span> : onlineSorted.map((entry) => (
                <span key={entry.player_id} className={`trilha-chat-online ${entry.player_identifier === 'Mestre' ? 'is-master' : ''}`}><i /> {entry.player_name || 'Viajante'}{entry.player_identifier === 'Mestre' ? ' · Mestre' : ''}</span>
              ))}
            </div>
          </section>

          <div className="trilha-chat-messages" ref={listRef} onScroll={handleMessageScroll}>
            {loadingOlder && <p className="trilha-chat-system">Buscando mensagens anteriores...</p>}
            {loading && <p className="trilha-chat-system">Abrindo os registros da mesa...</p>}
            {!loading && messages.length === 0 && <p className="trilha-chat-system">A conversa ainda está vazia. Seja o primeiro a falar.</p>}

            {messages.map((message) => {
              const own = message.player_id === player.id;
              const authorIsMaster = message.player_identifier === 'Mestre';
              const roll = message.message_type === 'roll';
              const actionRoll = roll && message.roll_kind === 'action';
              const combatRoll = roll && message.roll_kind === 'combat';
              const initialCount = Math.max(0, Number(message.roll_pool || 0));
              const decision = (message.master_decision || 'pending') as MasterDecision;
              const combatStatus = (message.combat_status || 'awaiting_defense') as CombatStatus;
              return (
                <article key={message.id} className={`trilha-chat-message ${own ? 'is-own' : ''} ${message.is_highlighted ? 'is-highlighted' : ''} ${roll ? 'is-roll' : ''} ${(actionRoll || combatRoll) ? 'is-action-roll' : ''}`}>
                  {message.is_highlighted && <div className="trilha-chat-highlight-label"><Star className="w-3 h-3" /> Destaque do Mestre</div>}
                  <div className="trilha-chat-message-head">
                    <b className={authorIsMaster ? 'is-master' : ''}>{message.player_name}{authorIsMaster ? ' · Mestre' : ''}</b>
                    <div className="trilha-chat-message-actions">
                      <time>{formatTime(message.created_at)}</time>
                      {isMaster && <><button onClick={() => toggleHighlight(message)} title={message.is_highlighted ? 'Remover destaque' : 'Destacar mensagem'} className={message.is_highlighted ? 'is-active' : ''}><Star className="w-3.5 h-3.5" /></button><button onClick={() => removeMessage(message)} title="Apagar mensagem"><Trash2 className="w-3.5 h-3.5" /></button></>}
                    </div>
                  </div>

                  {combatRoll ? (
                    <div className="trilha-chat-action-roll trilha-chat-combat-roll">
                      <div className="trilha-chat-action-title"><Sword className="w-4 h-4" /><b>{message.character_name || message.player_name}</b> ataca <b>{message.target_character_name || 'o alvo'}</b>{message.action_source ? <> com <b>{message.action_source}</b></> : null}</div>
                      <div className="trilha-chat-action-pool">{message.action_attribute && message.action_skill ? `${message.action_attribute} + ${message.action_skill} · ` : ''}<b>{message.roll_notation || `${message.roll_pool || 0}d10`}</b></div>
                      <div className="trilha-chat-roll-results">
                        {(message.roll_results || []).map((result, index) => <span key={`${message.id}-atk-${index}`} className={`${result === 10 ? 'is-ten' : ''} ${result === 1 ? 'is-one' : ''} ${index >= initialCount ? 'is-explosion' : ''}`}>{result}{index >= initialCount ? <sup>+</sup> : null}</span>)}
                      </div>
                      {Number(message.roll_explosion_count || 0) > 0 && <div className="trilha-chat-action-explosion">Ataque: {message.roll_explosion_count} dado(s) explosivo(s)</div>}

                      {message.defense_kind && (
                        <div className="trilha-chat-combat-defense">
                          <div className="trilha-chat-action-title"><Shield className="w-4 h-4" /><b>{message.target_character_name}</b> usa {defenseLabel(message.defense_kind)}{message.defense_source ? <> com <b>{message.defense_source}</b></> : null}</div>
                          {message.defense_kind === 'passive' ? (
                            <div className="trilha-chat-passive-defense">{message.defense_passive_successes ?? message.defense_successes ?? 0} sucesso(s) automático(s)</div>
                          ) : (
                            <>
                              <div className="trilha-chat-action-pool"><b>{message.defense_pool || 0}d10</b></div>
                              <div className="trilha-chat-roll-results">{(message.defense_results || []).map((result, index) => <span key={`${message.id}-def-${index}`} className={`${result === 10 ? 'is-ten' : ''} ${result === 1 ? 'is-one' : ''} ${index >= Math.max(0, Number(message.defense_pool || 0)) ? 'is-explosion' : ''}`}>{result}{index >= Math.max(0, Number(message.defense_pool || 0)) ? <sup>+</sup> : null}</span>)}</div>
                            </>
                          )}
                        </div>
                      )}

                      {combatStatus === 'awaiting_defense' && <div className="trilha-chat-decision">Aguardando defesa de {message.target_character_name}</div>}
                      {combatStatus === 'awaiting_master' && <div className="trilha-chat-decision">Defesa registrada · aguardando Dificuldade do Mestre</div>}
                      {combatStatus === 'void' && <div className="trilha-chat-decision is-void">Combate anulado pelo Mestre</div>}
                      {combatStatus === 'resolved' && (
                        <div className={`trilha-chat-combat-result ${decision === 'success' ? 'is-success' : 'is-failure'}`}>
                          <b>{decision === 'success' ? 'ACERTO' : 'DEFESA BEM-SUCEDIDA'}</b>
                          <span>Dificuldade {message.combat_difficulty} · Ataque {message.attack_successes ?? 0} × Defesa {message.defense_successes ?? 0}</span>
                          {decision === 'success' && <span>Excedentes: {message.excess_successes ?? 0} · Dano: <strong>{message.damage_final ?? 0} PV</strong>{message.target_hp_after != null ? ` · PV restante: ${message.target_hp_after}` : ''}</span>}
                        </div>
                      )}

                      {isMaster && combatStatus === 'awaiting_master' && (
                        <div className="trilha-chat-combat-master">
                          <label>Dificuldade
                            <select value={combatDifficulty[message.id] ?? 6} onChange={(event) => setCombatDifficulty((current) => ({ ...current, [message.id]: Number(event.target.value) }))}>
                              {[2,3,4,5,6,7,8,9].map((difficulty) => <option key={difficulty} value={difficulty}>{difficulty}</option>)}
                            </select>
                          </label>
                          <button disabled={decisionBusy === message.id} onClick={() => resolveCombat(message)}><Check className="w-3.5 h-3.5" /> Resolver</button>
                          <button disabled={decisionBusy === message.id} onClick={() => voidCombat(message)}><Ban className="w-3.5 h-3.5" /> Anular</button>
                        </div>
                      )}
                      {isMaster && combatStatus === 'awaiting_defense' && <div className="trilha-chat-decision-actions"><button disabled={decisionBusy === message.id} onClick={() => voidCombat(message)}><Ban className="w-3.5 h-3.5" /> Anular ataque</button></div>}
                    </div>
                  ) : roll ? (
                    actionRoll ? (
                      <div className="trilha-chat-action-roll">
                        <div className="trilha-chat-action-title"><Sword className="w-4 h-4" /><b>{message.character_name || message.player_name}</b> {message.action_name?.toLowerCase() || 'realiza uma ação'}{message.action_source ? <> com <b>{message.action_source}</b></> : null}</div>
                        <div className="trilha-chat-action-pool">{message.action_attribute && message.action_skill ? `${message.action_attribute} + ${message.action_skill} · ` : ''}<b>{message.roll_notation || `${message.roll_pool || 0}d10`}</b></div>
                        <div className="trilha-chat-roll-results">{(message.roll_results || []).map((result, index) => <span key={`${message.id}-${index}`} className={`${result === 10 ? 'is-ten' : ''} ${result === 1 ? 'is-one' : ''} ${index >= initialCount ? 'is-explosion' : ''}`}>{result}{index >= initialCount ? <sup>+</sup> : null}</span>)}</div>
                        {Number(message.roll_explosion_count || 0) > 0 && <div className="trilha-chat-action-explosion">10 explosivo: +{message.roll_explosion_count}d10</div>}
                        <div className={`trilha-chat-decision is-${decision}`}>{decisionText(decision)}</div>
                        {isMaster && <div className="trilha-chat-decision-actions" aria-label="Decisão do Mestre"><button disabled={decisionBusy === message.id} className={decision === 'success' ? 'is-selected' : ''} onClick={() => decideActionRoll(message, 'success')}><Check className="w-3.5 h-3.5" /> Sucesso</button><button disabled={decisionBusy === message.id} className={decision === 'failure' ? 'is-selected' : ''} onClick={() => decideActionRoll(message, 'failure')}><X className="w-3.5 h-3.5" /> Fracasso</button><button disabled={decisionBusy === message.id} className={decision === 'void' ? 'is-selected' : ''} onClick={() => decideActionRoll(message, 'void')}><Ban className="w-3.5 h-3.5" /> Anular</button></div>}
                      </div>
                    ) : (
                      <div className="trilha-chat-roll">
                        <div className="trilha-chat-roll-title"><Dice5 className="w-4 h-4" /> rolou <b>{message.roll_notation}</b></div>
                        {message.roll_breakdown?.length ? (
                          <div className="trilha-chat-roll-breakdown">
                            {message.roll_breakdown.map((entry, index) => entry.kind === 'dice' ? (
                              <div key={`${message.id}-term-${index}`}><b>{entry.sign < 0 ? '−' : index > 0 ? '+' : ''}{entry.quantity}d{entry.sides}</b><span>{(entry.results || []).join(', ')}</span><strong>{entry.subtotal >= 0 ? '+' : ''}{entry.subtotal}</strong></div>
                            ) : <div key={`${message.id}-term-${index}`}><b>{entry.sign < 0 ? '−' : '+'}{entry.value}</b><span>modificador</span><strong>{entry.subtotal >= 0 ? '+' : ''}{entry.subtotal}</strong></div>)}
                          </div>
                        ) : <div className="trilha-chat-roll-results">{(message.roll_results || []).map((result, index) => <span key={`${message.id}-${index}`}>{result}</span>)}</div>}
                        <div className="trilha-chat-roll-total">Total <b>{message.roll_total ?? 0}</b></div>
                      </div>
                    )
                  ) : <p>{message.content}</p>}
                </article>
              );
            })}
          </div>

          {newBelow && <button type="button" className="trilha-chat-new-message" onClick={() => scrollToBottom()}><ArrowDown className="w-4 h-4" /> Nova mensagem</button>}
          {error && <div className="trilha-chat-error">{error}</div>}

          {diceOpen && (
            <div className="trilha-chat-dice-panel">
              <div className="trilha-chat-dice-line"><span>Quantidade</span><div className="trilha-chat-stepper"><button onClick={() => setDiceQuantity((value) => Math.max(1, value - 1))}><Minus className="w-3 h-3" /></button><input type="number" min={1} max={MAX_DICE} value={diceQuantity} onChange={(event) => setDiceQuantity(Math.min(MAX_DICE, Math.max(1, Number(event.target.value) || 1)))} /><button onClick={() => setDiceQuantity((value) => Math.min(MAX_DICE, value + 1))}><Plus className="w-3 h-3" /></button></div></div>
              <div className="trilha-chat-dice-types">{ALLOWED_DICE.map((sides) => <button key={sides} onClick={() => setDiceSides(sides)} className={diceSides === sides ? 'is-active' : ''}>d{sides}</button>)}</div>
              <button className="trilha-chat-roll-button" onClick={quickRoll} disabled={sending}><Dice5 className="w-4 h-4" /> Rolar {diceQuantity}d{diceSides}</button>
              <p>Também funciona com expressões: <b>/r 3d10 + 4d20</b>, <b>/r 2d8 + 5</b>.</p>
            </div>
          )}

          <footer className="trilha-chat-composer">
            <button className={`trilha-chat-dice-toggle ${diceOpen ? 'is-active' : ''}`} onClick={() => setDiceOpen((value) => !value)} title="Rolador de dados"><Dice5 className="w-5 h-5" /></button>
            <textarea rows={1} maxLength={2000} placeholder="Escreva uma mensagem ou /r 3d10 + 4d20" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} />
            <button className="trilha-chat-send" onClick={send} disabled={sending || !draft.trim()} title="Enviar"><Send className="w-4 h-4" /></button>
          </footer>
        </aside>
      )}
    </>
  );
}
