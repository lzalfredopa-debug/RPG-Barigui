import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Radio, SkipForward, Square, Volume2, VolumeX, X } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

const RADIO_BUCKET = 'radio-trilha';
const RADIO_EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const VOLUME_KEY = 'trilha-radio-volume';
const AUDIO_EXTENSIONS = /\.(mp3|ogg|wav|m4a|aac)$/i;

type RadioTrack = { name: string; path: string; url: string; duration: number };
type RadioPosition = { index: number; offset: number };
type RadioRoomState = { id: string; skip_offset_seconds: number; updated_by: string | null; updated_at: string };

function displayTrackName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/^\s*\d+\s*[-_.]\s*/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function readInitialVolume() {
  try {
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    if (Number.isFinite(stored)) return Math.min(1, Math.max(0, stored));
  } catch { /* sem persistência */ }
  return 0.35;
}

function probeDuration(url: string) {
  return new Promise<number>((resolve, reject) => {
    const probe = new Audio();
    let settled = false;
    const finish = (duration?: number, error?: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      probe.removeAttribute('src');
      probe.load();
      if (duration && Number.isFinite(duration) && duration > 0) resolve(duration);
      else reject(error || new Error('Duração indisponível'));
    };
    const timeout = window.setTimeout(() => finish(undefined, new Error('Tempo excedido ao ler a faixa')), 15000);
    probe.preload = 'metadata';
    probe.addEventListener('loadedmetadata', () => finish(probe.duration), { once: true });
    probe.addEventListener('error', () => finish(undefined, new Error('Não foi possível ler a faixa')), { once: true });
    probe.src = url;
    probe.load();
  });
}

export default function TrilhaRadio({ player }: { player: Player }) {
  const isMaster = player.player_identifier === 'Mestre';
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<RadioTrack[]>([]);
  const activeIndexRef = useRef(-1);
  const tryingRef = useRef(false);
  const stoppedRef = useRef(false);

  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [volume, setVolume] = useState(readInitialVolume);
  const [loading, setLoading] = useState(true);
  const [waitingInteraction, setWaitingInteraction] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [stopped, setStopped] = useState(false);
  const [skipOffset, setSkipOffset] = useState(0);
  const [skipping, setSkipping] = useState(false);

  const totalDuration = useMemo(() => tracks.reduce((sum, track) => sum + track.duration, 0), [tracks]);

  useEffect(() => { tracksRef.current = tracks; }, [tracks]);
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { stoppedRef.current = stopped; }, [stopped]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
    try { localStorage.setItem(VOLUME_KEY, String(volume)); } catch { /* opcional */ }
  }, [volume]);

  useEffect(() => {
    let cancelled = false;
    async function loadPlaylist() {
      setLoading(true);
      setError('');
      const { data, error: listError } = await supabase.storage.from(RADIO_BUCKET).list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } });
      if (cancelled) return;
      if (listError) { setError('A Rádio TRILHA ainda não está disponível.'); setLoading(false); return; }
      const files = (data || []).filter((file) => AUDIO_EXTENSIONS.test(file.name));
      if (files.length === 0) { setTracks([]); setLoading(false); return; }
      const resolved = await Promise.all(files.map(async (file): Promise<RadioTrack | null> => {
        const path = file.name;
        const { data: publicData } = supabase.storage.from(RADIO_BUCKET).getPublicUrl(path);
        try { return { name: displayTrackName(file.name), path, url: publicData.publicUrl, duration: await probeDuration(publicData.publicUrl) }; }
        catch { return null; }
      }));
      if (cancelled) return;
      const playable = resolved.filter((track): track is RadioTrack => Boolean(track));
      setTracks(playable); setLoading(false);
      if (playable.length === 0) setError('Nenhuma faixa de áudio pôde ser carregada.');
    }
    loadPlaylist();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadState() {
      const { data } = await supabase.from('radio_room_state').select('*').eq('id', 'main').maybeSingle();
      if (!cancelled && data) setSkipOffset(Number((data as RadioRoomState).skip_offset_seconds || 0));
    }
    loadState();
    const channel = supabase.channel('trilha-radio-controle')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'radio_room_state', filter: 'id=eq.main' }, (payload) => {
        const next = payload.new as RadioRoomState;
        setSkipOffset(Number(next.skip_offset_seconds || 0));
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, []);

  const getRadioPosition = useCallback((playlist = tracksRef.current, offset = skipOffset): RadioPosition | null => {
    if (playlist.length === 0) return null;
    const total = playlist.reduce((sum, track) => sum + track.duration, 0);
    if (!Number.isFinite(total) || total <= 0) return null;
    const elapsed = Math.max(0, (Date.now() - RADIO_EPOCH_MS) / 1000 + offset);
    let cursor = elapsed % total;
    for (let index = 0; index < playlist.length; index += 1) {
      const duration = playlist[index].duration;
      if (cursor < duration) return { index, offset: cursor };
      cursor -= duration;
    }
    return { index: 0, offset: 0 };
  }, [skipOffset]);

  const syncToRadio = useCallback(async (forcePlay = false) => {
    const audio = audioRef.current;
    const playlist = tracksRef.current;
    if (!audio || playlist.length === 0 || tryingRef.current || stoppedRef.current) return;
    const position = getRadioPosition(playlist);
    if (!position) return;
    const track = playlist[position.index];
    tryingRef.current = true;
    try {
      const changedTrack = activeIndexRef.current !== position.index || audio.src !== track.url;
      if (changedTrack) {
        audio.src = track.url; audio.load();
        await new Promise<void>((resolve) => {
          if (audio.readyState >= 1) { resolve(); return; }
          const done = () => resolve();
          audio.addEventListener('loadedmetadata', done, { once: true });
          window.setTimeout(done, 4000);
        });
        activeIndexRef.current = position.index; setActiveIndex(position.index);
      }
      const desired = Math.min(position.offset, Math.max(0, track.duration - 0.15));
      if (changedTrack || Math.abs(audio.currentTime - desired) > 3) { try { audio.currentTime = desired; } catch { /* preparando seek */ } }
      audio.volume = volume;
      if (forcePlay || audio.paused) await audio.play();
      setWaitingInteraction(false); setError('');
    } catch { setWaitingInteraction(true); }
    finally { tryingRef.current = false; }
  }, [getRadioPosition, volume]);

  useEffect(() => { if (tracks.length && totalDuration > 0 && !stopped) syncToRadio(true); }, [tracks, totalDuration, skipOffset, stopped, syncToRadio]);

  useEffect(() => {
    if (!waitingInteraction || tracks.length === 0 || stopped) return;
    const activate = () => { syncToRadio(true); window.removeEventListener('pointerdown', activate, true); window.removeEventListener('keydown', activate, true); };
    window.addEventListener('pointerdown', activate, true); window.addEventListener('keydown', activate, true);
    return () => { window.removeEventListener('pointerdown', activate, true); window.removeEventListener('keydown', activate, true); };
  }, [waitingInteraction, tracks.length, stopped, syncToRadio]);

  useEffect(() => {
    if (tracks.length === 0) return;
    const interval = window.setInterval(() => { if (!document.hidden && !stoppedRef.current) syncToRadio(false); }, 60000);
    const onVisible = () => { if (!document.hidden && !stoppedRef.current) syncToRadio(true); };
    document.addEventListener('visibilitychange', onVisible); window.addEventListener('focus', onVisible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); window.removeEventListener('focus', onVisible); };
  }, [tracks.length, syncToRadio]);

  const stopLocal = () => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    stoppedRef.current = true;
    setStopped(true);
    setWaitingInteraction(false);
  };

  const resumeLocal = () => {
    stoppedRef.current = false;
    setStopped(false);
    window.setTimeout(() => syncToRadio(true), 0);
  };

  const skipForEveryone = async () => {
    if (!isMaster || skipping) return;
    const position = getRadioPosition();
    const track = position ? tracksRef.current[position.index] : null;
    if (!position || !track) return;
    const remaining = Math.max(0.2, track.duration - position.offset + 0.05);
    setSkipping(true); setError('');
    const { error: skipError } = await supabase.rpc('skip_radio_track', { p_player_id: player.id, p_skip_seconds: remaining });
    if (skipError) setError(skipError.message || 'Não foi possível pular a música.');
    setSkipping(false);
  };

  const currentTrack = activeIndex >= 0 ? tracks[activeIndex] : null;
  const silent = volume <= 0.001;

  return (
    <>
      <audio ref={audioRef} preload="auto" onEnded={() => syncToRadio(true)} onError={() => setError('A faixa atual não pôde ser reproduzida.')} />
      {isOpen ? (
        <aside className="trilha-radio" aria-label="Rádio TRILHA">
          <div className="trilha-radio-head">
            <span className={`trilha-radio-signal ${currentTrack && !waitingInteraction && !stopped ? 'is-live' : ''}`}><Radio className="w-4 h-4" /></span>
            <div className="trilha-radio-copy"><strong>Rádio TRILHA</strong><span>{loading && 'Preparando a transmissão...'}{!loading && tracks.length === 0 && !error && 'Nenhuma faixa na programação.'}{!loading && stopped && 'Parada neste navegador.'}{!loading && !stopped && waitingInteraction && 'A rádio começa na sua primeira interação.'}{!loading && !stopped && !waitingInteraction && currentTrack && currentTrack.name}{!loading && !stopped && !waitingInteraction && !currentTrack && tracks.length > 0 && 'Sintonizando...'}{error && error}</span></div>
            <button type="button" className="trilha-radio-close" onClick={() => setIsOpen(false)} aria-label="Fechar Rádio TRILHA" title="Fechar rádio"><X className="w-4 h-4" /></button>
          </div>

          <div className="trilha-radio-control-block">
            <span className="trilha-radio-control-label">Controles</span>
            <div className="trilha-radio-controls" aria-label="Controles da Rádio TRILHA">
              {stopped ? <button type="button" onClick={resumeLocal}><Play className="w-3.5 h-3.5" /> Retomar música</button> : <button type="button" onClick={stopLocal}><Square className="w-3.5 h-3.5" /> Parar música</button>}
              {isMaster && <button type="button" onClick={skipForEveryone} disabled={skipping || !currentTrack} title="Pular a faixa para toda a mesa"><SkipForward className="w-3.5 h-3.5" /> {skipping ? 'Pulando...' : 'Pular música para todos'}</button>}
            </div>
          </div>

          <label className="trilha-radio-volume" title={`Volume ${Math.round(volume * 100)}%`}>
            {silent ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <input aria-label="Volume da Rádio TRILHA" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
            <span>{Math.round(volume * 100)}%</span>
          </label>
        </aside>
      ) : (
        <button type="button" className={`trilha-radio-launcher ${currentTrack && !waitingInteraction && !stopped ? 'is-live' : ''}`} onClick={() => setIsOpen(true)} aria-label="Abrir Rádio TRILHA" title="Abrir Rádio TRILHA"><Radio className="w-5 h-5" /></button>
      )}
    </>
  );
}
