import { useEffect, useMemo, useRef, useState } from 'react';
import { Dice5, MessageCircle, Minus, Plus, Send, Star, Trash2, Users, X } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

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
  is_highlighted: boolean;
  created_at: string;
};

type PresencePayload = {
  player_id?: string;
  player_name?: string;
  player_identifier?: string | null;
  online_at?: string;
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

function parseRollCommand(value: string) {
  const match = value.trim().match(/^\/(?:r|roll)\s+(\d{1,3})d(2|4|6|8|10|12|20)$/i);
  if (!match) return null;
  const quantity = Number(match[1]);
  const sides = Number(match[2]);
  if (quantity < 1 || quantity > MAX_DICE || !ALLOWED_DICE.includes(sides as (typeof ALLOWED_DICE)[number])) return null;
  return { quantity, sides };
}

export default function TableChat({ player }: { player: Player }) {
  const isMaster = player.player_identifier === 'Mestre';
  const displayName = player.player_name?.trim() || player.alcunha;
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [online, setOnline] = useState<PresencePayload[]>([]);
  const [draft, setDraft] = useState('');
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [diceOpen, setDiceOpen] = useState(false);
  const [diceQuantity, setDiceQuantity] = useState(1);
  const [diceSides, setDiceSides] = useState<number>(10);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(0);
  }, [open]);

  const onlineSorted = useMemo(() => {
    const unique = new Map<string, PresencePayload>();
    online.forEach((entry) => {
      if (!entry.player_id) return;
      if (!unique.has(entry.player_id)) unique.set(entry.player_id, entry);
    });
    return [...unique.values()].sort((a, b) => {
      const masterA = a.player_identifier === 'Mestre' ? 0 : 1;
      const masterB = b.player_identifier === 'Mestre' ? 0 : 1;
      if (masterA !== masterB) return masterA - masterB;
      return (a.player_name || '').localeCompare(b.player_name || '', 'pt-BR');
    });
  }, [online]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior }));
  };

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(CHAT_LIMIT);

      if (!cancelled) {
        if (loadError) setError('Não foi possível carregar o Chat da Mesa.');
        else setMessages(((data || []) as ChatMessage[]).reverse());
        setLoading(false);
        setTimeout(() => scrollToBottom('auto'), 0);
      }
    }

    loadMessages();

    const channel = supabase.channel('trilha-chat-da-mesa', {
      config: { presence: { key: player.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, PresencePayload[]>;
        const entries = Object.values(state).flat();
        setOnline(entries);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const incoming = payload.new as ChatMessage;
        setMessages((current) => {
          if (current.some((item) => item.id === incoming.id)) return current;
          return [...current, incoming].slice(-CHAT_LIMIT);
        });
        if (!openRef.current && incoming.player_id !== player.id) setUnread((value) => value + 1);
        scrollToBottom();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const updated = payload.new as ChatMessage;
        setMessages((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages' }, (payload) => {
        const removed = payload.old as Partial<ChatMessage>;
        if (removed.id) setMessages((current) => current.filter((item) => item.id !== removed.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            player_id: player.id,
            player_name: displayName,
            player_identifier: player.player_identifier,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      cancelled = true;
      channel.untrack().catch(() => undefined);
      supabase.removeChannel(channel);
    };
  }, [displayName, player.id, player.player_identifier]);

  async function insertTextMessage(content: string) {
    const { error: sendError } = await supabase.from('chat_messages').insert({
      player_id: player.id,
      player_name: displayName,
      player_identifier: player.player_identifier,
      content,
      message_type: 'text',
    });
    if (sendError) throw sendError;
  }

  async function insertRoll(quantity: number, sides: number) {
    const results = Array.from({ length: quantity }, () => secureDie(sides));
    const total = results.reduce((sum, value) => sum + value, 0);
    const notation = `${quantity}d${sides}`;
    const { error: sendError } = await supabase.from('chat_messages').insert({
      player_id: player.id,
      player_name: displayName,
      player_identifier: player.player_identifier,
      content: '',
      message_type: 'roll',
      roll_notation: notation,
      roll_results: results,
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
        const parsed = parseRollCommand(value);
        if (!parsed) {
          setError('Comando inválido. Use, por exemplo: /r 3d10. Máximo de 100 dados.');
          return;
        }
        await insertRoll(parsed.quantity, parsed.sides);
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
      await insertRoll(diceQuantity, diceSides);
      setDiceOpen(false);
    } catch {
      setError('Não foi possível enviar a rolagem.');
    } finally {
      setSending(false);
    }
  }

  async function toggleHighlight(message: ChatMessage) {
    if (!isMaster) return;
    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ is_highlighted: !message.is_highlighted })
      .eq('id', message.id);
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
            <div>
              <p className="trilha-chat-eyebrow">TRILHA · comunicação da mesa</p>
              <h2><MessageCircle className="w-4 h-4" /> Chat da Mesa</h2>
            </div>
            <button className="trilha-chat-icon-button" onClick={() => setOpen(false)} title="Fechar">
              <X className="w-4 h-4" />
            </button>
          </header>

          <section className="trilha-chat-presence">
            <div className="trilha-chat-presence-title"><Users className="w-3.5 h-3.5" /> Online agora <b>{onlineSorted.length}</b></div>
            <div className="trilha-chat-online-list">
              {onlineSorted.length === 0 ? (
                <span className="trilha-chat-online-empty">Conectando...</span>
              ) : onlineSorted.map((entry) => (
                <span key={entry.player_id} className={`trilha-chat-online ${entry.player_identifier === 'Mestre' ? 'is-master' : ''}`}>
                  <i /> {entry.player_name || 'Viajante'}{entry.player_identifier === 'Mestre' ? ' · Mestre' : ''}
                </span>
              ))}
            </div>
          </section>

          <div className="trilha-chat-messages" ref={listRef}>
            {loading && <p className="trilha-chat-system">Abrindo os registros da mesa...</p>}
            {!loading && messages.length === 0 && <p className="trilha-chat-system">A conversa ainda está vazia. Seja o primeiro a falar.</p>}

            {messages.map((message) => {
              const own = message.player_id === player.id;
              const authorIsMaster = message.player_identifier === 'Mestre';
              const roll = message.message_type === 'roll';
              return (
                <article key={message.id} className={`trilha-chat-message ${own ? 'is-own' : ''} ${message.is_highlighted ? 'is-highlighted' : ''} ${roll ? 'is-roll' : ''}`}>
                  {message.is_highlighted && <div className="trilha-chat-highlight-label"><Star className="w-3 h-3" /> Destaque do Mestre</div>}
                  <div className="trilha-chat-message-head">
                    <b className={authorIsMaster ? 'is-master' : ''}>{message.player_name}{authorIsMaster ? ' · Mestre' : ''}</b>
                    <div className="trilha-chat-message-actions">
                      <time>{formatTime(message.created_at)}</time>
                      {isMaster && (
                        <>
                          <button onClick={() => toggleHighlight(message)} title={message.is_highlighted ? 'Remover destaque' : 'Destacar mensagem'} className={message.is_highlighted ? 'is-active' : ''}>
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => removeMessage(message)} title="Apagar mensagem"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {roll ? (
                    <div className="trilha-chat-roll">
                      <div className="trilha-chat-roll-title"><Dice5 className="w-4 h-4" /> rolou <b>{message.roll_notation}</b></div>
                      <div className="trilha-chat-roll-results">
                        {(message.roll_results || []).map((result, index) => <span key={`${message.id}-${index}`}>{result}</span>)}
                      </div>
                      <div className="trilha-chat-roll-total">Total <b>{message.roll_total ?? 0}</b></div>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </article>
              );
            })}
          </div>

          {error && <div className="trilha-chat-error">{error}</div>}

          {diceOpen && (
            <div className="trilha-chat-dice-panel">
              <div className="trilha-chat-dice-line">
                <span>Quantidade</span>
                <div className="trilha-chat-stepper">
                  <button onClick={() => setDiceQuantity((value) => Math.max(1, value - 1))}><Minus className="w-3 h-3" /></button>
                  <input type="number" min={1} max={MAX_DICE} value={diceQuantity} onChange={(event) => setDiceQuantity(Math.min(MAX_DICE, Math.max(1, Number(event.target.value) || 1)))} />
                  <button onClick={() => setDiceQuantity((value) => Math.min(MAX_DICE, value + 1))}><Plus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="trilha-chat-dice-types">
                {ALLOWED_DICE.map((sides) => (
                  <button key={sides} onClick={() => setDiceSides(sides)} className={diceSides === sides ? 'is-active' : ''}>d{sides}</button>
                ))}
              </div>
              <button className="trilha-chat-roll-button" onClick={quickRoll} disabled={sending}><Dice5 className="w-4 h-4" /> Rolar {diceQuantity}d{diceSides}</button>
              <p>Também funciona digitando <b>/r 3d10</b> ou <b>/roll 1d20</b>.</p>
            </div>
          )}

          <footer className="trilha-chat-composer">
            <button className={`trilha-chat-dice-toggle ${diceOpen ? 'is-active' : ''}`} onClick={() => setDiceOpen((value) => !value)} title="Rolador de dados"><Dice5 className="w-5 h-5" /></button>
            <textarea
              rows={1}
              maxLength={2000}
              placeholder="Escreva uma mensagem..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <button className="trilha-chat-send" onClick={send} disabled={sending || !draft.trim()} title="Enviar"><Send className="w-4 h-4" /></button>
          </footer>
        </aside>
      )}
    </>
  );
}
