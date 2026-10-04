import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Radio, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const RADIO_BUCKET = 'radio-trilha';
const RADIO_EPOCH_MS = Date.UTC(2026, 0, 1, 0, 0, 0);
const VOLUME_KEY = 'trilha-radio-volume';
const AUDIO_EXTENSIONS = /\.(mp3|ogg|wav|m4a|aac)$/i;

type RadioTrack = {
  name: string;
  path: string;
  url: string;
  duration: number;
};

type RadioPosition = {
  index: number;
  offset: number;
};

function displayTrackName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/^\s*\d+\s*[-_.]\s*/, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readInitialVolume() {
  try {
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    if (Number.isFinite(stored)) return Math.min(1, Math.max(0, stored));
  } catch {
    // localStorage pode estar indisponível em alguns modos privados.
  }
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

export default function TrilhaRadio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<RadioTrack[]>([]);
  const activeIndexRef = useRef(-1);
  const tryingRef = useRef(false);

  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [volume, setVolume] = useState(readInitialVolume);
  const [loading, setLoading] = useState(true);
  const [waitingInteraction, setWaitingInteraction] = useState(false);
  const [error, setError] = useState('');

  const totalDuration = useMemo(
    () => tracks.reduce((sum, track) => sum + track.duration, 0),
    [tracks],
  );

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      // Sem persistência, o volume ainda funciona durante a sessão.
    }
  }, [volume]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaylist() {
      setLoading(true);
      setError('');

      const { data, error: listError } = await supabase.storage
        .from(RADIO_BUCKET)
        .list('', { limit: 200, sortBy: { column: 'name', order: 'asc' } });

      if (cancelled) return;
      if (listError) {
        setError('A Rádio TRILHA ainda não está disponível.');
        setLoading(false);
        return;
      }

      const files = (data || []).filter((file) => AUDIO_EXTENSIONS.test(file.name));
      if (files.length === 0) {
        setTracks([]);
        setLoading(false);
        return;
      }

      const resolved = await Promise.all(
        files.map(async (file): Promise<RadioTrack | null> => {
          const path = file.name;
          const { data: publicData } = supabase.storage.from(RADIO_BUCKET).getPublicUrl(path);
          try {
            const duration = await probeDuration(publicData.publicUrl);
            return { name: displayTrackName(file.name), path, url: publicData.publicUrl, duration };
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;
      const playable = resolved.filter((track): track is RadioTrack => Boolean(track));
      setTracks(playable);
      setLoading(false);
      if (playable.length === 0) setError('Nenhuma faixa de áudio pôde ser carregada.');
    }

    loadPlaylist();
    return () => { cancelled = true; };
  }, []);

  const getRadioPosition = useCallback((playlist = tracksRef.current): RadioPosition | null => {
    if (playlist.length === 0) return null;
    const total = playlist.reduce((sum, track) => sum + track.duration, 0);
    if (!Number.isFinite(total) || total <= 0) return null;

    const elapsed = Math.max(0, (Date.now() - RADIO_EPOCH_MS) / 1000);
    let cursor = elapsed % total;

    for (let index = 0; index < playlist.length; index += 1) {
      const duration = playlist[index].duration;
      if (cursor < duration) return { index, offset: cursor };
      cursor -= duration;
    }

    return { index: 0, offset: 0 };
  }, []);

  const syncToRadio = useCallback(async (forcePlay = false) => {
    const audio = audioRef.current;
    const playlist = tracksRef.current;
    if (!audio || playlist.length === 0 || tryingRef.current) return;

    const position = getRadioPosition(playlist);
    if (!position) return;
    const track = playlist[position.index];
    tryingRef.current = true;

    try {
      const changedTrack = activeIndexRef.current !== position.index || audio.src !== track.url;
      if (changedTrack) {
        audio.src = track.url;
        audio.load();
        await new Promise<void>((resolve) => {
          if (audio.readyState >= 1) {
            resolve();
            return;
          }
          const done = () => resolve();
          audio.addEventListener('loadedmetadata', done, { once: true });
          window.setTimeout(done, 4000);
        });
        activeIndexRef.current = position.index;
        setActiveIndex(position.index);
      }

      const desired = Math.min(position.offset, Math.max(0, track.duration - 0.15));
      if (changedTrack || Math.abs(audio.currentTime - desired) > 3) {
        try { audio.currentTime = desired; } catch { /* navegador ainda preparando seek */ }
      }

      audio.volume = volume;
      if (forcePlay || audio.paused) {
        await audio.play();
      }
      setWaitingInteraction(false);
      setError('');
    } catch {
      setWaitingInteraction(true);
    } finally {
      tryingRef.current = false;
    }
  }, [getRadioPosition, volume]);

  useEffect(() => {
    if (tracks.length === 0 || totalDuration <= 0) return;
    syncToRadio(true);
  }, [tracks, totalDuration, syncToRadio]);

  useEffect(() => {
    if (!waitingInteraction || tracks.length === 0) return;

    const activate = () => {
      syncToRadio(true);
      window.removeEventListener('pointerdown', activate, true);
      window.removeEventListener('keydown', activate, true);
    };

    window.addEventListener('pointerdown', activate, true);
    window.addEventListener('keydown', activate, true);
    return () => {
      window.removeEventListener('pointerdown', activate, true);
      window.removeEventListener('keydown', activate, true);
    };
  }, [waitingInteraction, tracks.length, syncToRadio]);

  useEffect(() => {
    if (tracks.length === 0) return;

    const interval = window.setInterval(() => {
      if (!document.hidden) syncToRadio(false);
    }, 60000);
    const onVisible = () => {
      if (!document.hidden) syncToRadio(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [tracks.length, syncToRadio]);

  const currentTrack = activeIndex >= 0 ? tracks[activeIndex] : null;
  const silent = volume <= 0.001;

  return (
    <aside className="trilha-radio" aria-label="Rádio TRILHA">
      <audio
        ref={audioRef}
        preload="auto"
        onEnded={() => syncToRadio(true)}
        onError={() => setError('A faixa atual não pôde ser reproduzida.')}
      />

      <div className="trilha-radio-head">
        <span className={`trilha-radio-signal ${currentTrack && !waitingInteraction ? 'is-live' : ''}`}>
          <Radio className="w-4 h-4" />
        </span>
        <div className="trilha-radio-copy">
          <strong>Rádio TRILHA</strong>
          <span>
            {loading && 'Preparando a transmissão...'}
            {!loading && tracks.length === 0 && !error && 'Nenhuma faixa na programação.'}
            {!loading && waitingInteraction && 'A rádio começa na sua primeira interação.'}
            {!loading && !waitingInteraction && currentTrack && currentTrack.name}
            {!loading && !waitingInteraction && !currentTrack && tracks.length > 0 && 'Sintonizando...'}
            {error && error}
          </span>
        </div>
      </div>

      <label className="trilha-radio-volume" title={`Volume ${Math.round(volume * 100)}%`}>
        {silent ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        <input
          aria-label="Volume da Rádio TRILHA"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <span>{Math.round(volume * 100)}%</span>
      </label>
    </aside>
  );
}
