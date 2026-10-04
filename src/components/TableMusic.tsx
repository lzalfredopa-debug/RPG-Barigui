import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Link2, Music2, Save, X } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type MusicRoomSetting = {
  id: string;
  spotify_url: string;
  updated_by: string | null;
  updated_at: string;
};

type SpotifyEmbed = {
  type: 'track' | 'album' | 'playlist' | 'artist' | 'show' | 'episode' | 'audiobook';
  id: string;
  sourceUrl: string;
  embedUrl: string;
};

const SUPPORTED_TYPES = ['track', 'album', 'playlist', 'artist', 'show', 'episode', 'audiobook'] as const;

function parseSpotify(value: string): SpotifyEmbed | null {
  const raw = value.trim();
  if (!raw) return null;

  const uri = raw.match(/^spotify:(track|album|playlist|artist|show|episode|audiobook):([A-Za-z0-9]+)$/i);
  if (uri) {
    const type = uri[1].toLowerCase() as SpotifyEmbed['type'];
    const id = uri[2];
    return {
      type,
      id,
      sourceUrl: `https://open.spotify.com/${type}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  }

  try {
    const parsed = new URL(raw);
    if (!/(^|\.)open\.spotify\.com$/i.test(parsed.hostname)) return null;
    const parts = parsed.pathname.split('/').filter(Boolean);
    const typeIndex = parts.findIndex((part) => SUPPORTED_TYPES.includes(part as SpotifyEmbed['type']));
    if (typeIndex < 0 || !parts[typeIndex + 1]) return null;

    const type = parts[typeIndex] as SpotifyEmbed['type'];
    const id = parts[typeIndex + 1].replace(/[^A-Za-z0-9]/g, '');
    if (!id) return null;

    return {
      type,
      id,
      sourceUrl: `https://open.spotify.com/${type}/${id}`,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
    };
  } catch {
    return null;
  }
}

function formatUpdatedAt(value: string | undefined) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
}

export default function TableMusic({ player }: { player: Player }) {
  const isMaster = player.player_identifier === 'Mestre';
  const [open, setOpen] = useState(false);
  const [setting, setSetting] = useState<MusicRoomSetting | null>(null);
  const [draftUrl, setDraftUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  const spotify = useMemo(() => parseSpotify(setting?.spotify_url || ''), [setting?.spotify_url]);
  const draftSpotify = useMemo(() => parseSpotify(draftUrl), [draftUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadSetting() {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from('music_room_settings')
        .select('*')
        .eq('id', 'main')
        .maybeSingle();

      if (cancelled) return;

      if (loadError) {
        setError('Não foi possível carregar a Música da Mesa. Verifique se o SQL desta atualização foi executado.');
      } else if (data) {
        const current = data as MusicRoomSetting;
        setSetting(current);
        setDraftUrl(current.spotify_url || '');
      } else {
        setSetting({ id: 'main', spotify_url: '', updated_by: null, updated_at: new Date().toISOString() });
      }
      setLoading(false);
    }

    loadSetting();

    const channel = supabase
      .channel('trilha-musica-da-mesa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'music_room_settings', filter: 'id=eq.main' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setSetting({ id: 'main', spotify_url: '', updated_by: null, updated_at: new Date().toISOString() });
          return;
        }
        const next = payload.new as MusicRoomSetting;
        setSetting(next);
        setDraftUrl((current) => (isMaster && current.trim() && current !== setting?.spotify_url ? current : next.spotify_url || ''));
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // setting?.spotify_url fica fora de propósito para não recriar o canal a cada troca de música.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaster]);

  async function saveSpotify() {
    if (!isMaster || saving) return;
    setError('');
    setSavedNotice('');

    const clean = draftUrl.trim();
    if (clean && !draftSpotify) {
      setError('Cole um link válido do Spotify (faixa, álbum, playlist, artista, podcast ou episódio).');
      return;
    }

    setSaving(true);
    const normalizedUrl = draftSpotify?.sourceUrl || '';
    const { data, error: saveError } = await supabase
      .from('music_room_settings')
      .upsert({
        id: 'main',
        spotify_url: normalizedUrl,
        updated_by: player.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select('*')
      .single();

    if (saveError) {
      setError('Não foi possível atualizar a Música da Mesa.');
    } else {
      const next = data as MusicRoomSetting;
      setSetting(next);
      setDraftUrl(next.spotify_url || '');
      setSavedNotice(normalizedUrl ? 'Player atualizado para toda a mesa.' : 'Player da mesa removido.');
      window.setTimeout(() => setSavedNotice(''), 2600);
    }
    setSaving(false);
  }

  const compact = spotify?.type === 'track' || spotify?.type === 'episode';

  return (
    <>
      {!open && (
        <button className="trilha-music-launcher" onClick={() => setOpen(true)} aria-label="Abrir Música da Mesa">
          <Music2 className="w-5 h-5" />
          <span className="hidden sm:inline">Música da Mesa</span>
          {spotify && <i className="trilha-music-live-dot" aria-hidden="true" />}
        </button>
      )}

      <aside className={`trilha-music-window ${open ? 'is-open' : 'is-collapsed'}`} aria-label="Música da Mesa" aria-hidden={!open}>
        <header className="trilha-music-header">
          <div>
            <p className="trilha-music-eyebrow">TRILHA · ambientação compartilhada</p>
            <h2><Music2 className="w-4 h-4" /> Música da Mesa</h2>
          </div>
          <button className="trilha-music-icon-button" onClick={() => setOpen(false)} title="Recolher">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="trilha-music-body">
          {loading ? (
            <div className="trilha-music-empty">Preparando o salão de música...</div>
          ) : spotify ? (
            <div className={`trilha-music-player ${compact ? 'is-compact' : ''}`}>
              <iframe
                key={spotify.embedUrl}
                src={spotify.embedUrl}
                title="Spotify — Música da Mesa"
                width="100%"
                height={compact ? 152 : 352}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
              <div className="trilha-music-meta">
                <span>Compartilhado com toda a mesa</span>
                <a href={spotify.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="w-3.5 h-3.5" /> Abrir no Spotify</a>
              </div>
              {setting?.updated_at && <small>Atualizado em {formatUpdatedAt(setting.updated_at)}</small>}
            </div>
          ) : (
            <div className="trilha-music-empty">
              <Music2 className="w-8 h-8" />
              <strong>Nenhuma música foi escolhida ainda.</strong>
              <span>Quando o Mestre compartilhar um conteúdo do Spotify, o player aparecerá aqui para todos.</span>
            </div>
          )}

          {error && <div className="trilha-music-error">{error}</div>}
          {savedNotice && <div className="trilha-music-success">{savedNotice}</div>}

          {isMaster && (
            <section className="trilha-music-master">
              <div className="trilha-music-master-title"><Link2 className="w-3.5 h-3.5" /> Controle do Mestre</div>
              <p>Cole o link de uma faixa, álbum, playlist, artista ou podcast do Spotify. A mudança chega aos jogadores em tempo real.</p>
              <input
                type="url"
                value={draftUrl}
                onChange={(event) => setDraftUrl(event.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                spellCheck={false}
              />
              <div className="trilha-music-master-actions">
                <button className="trilha-music-save" onClick={saveSpotify} disabled={saving || (!!draftUrl.trim() && !draftSpotify)}>
                  <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Compartilhar com a mesa'}
                </button>
                {!!setting?.spotify_url && (
                  <button className="trilha-music-clear" onClick={() => setDraftUrl('')} disabled={saving}>Limpar campo</button>
                )}
              </div>
              {draftUrl.trim() && !draftSpotify && <small className="trilha-music-hint is-error">Este endereço não parece ser um link do Spotify compatível.</small>}
              {!draftUrl.trim() && setting?.spotify_url && <small className="trilha-music-hint">Clique em “Compartilhar com a mesa” com o campo vazio para remover o player atual.</small>}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
