import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

type BrowserRace = {
  id?: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  image?: string | null;
};

const ORDER = [
  'humanos',
  'elfos',
  'anoes',
  'orcs',
  'pequeninos',
  'goblins',
  'tiferinos',
  'povo-fungico',
  'draconatos',
  'povo-fera',
];

const normalize = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-');

export default function AncestryBrowser({ races }: { races: BrowserRace[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ordered = useMemo(() => {
    const indexed = [...races];
    return indexed.sort((a, b) => {
      const aKey = String(a.id || normalize(a.name));
      const bKey = String(b.id || normalize(b.name));
      const ai = ORDER.indexOf(aKey);
      const bi = ORDER.indexOf(bKey);
      if (ai !== -1 || bi !== -1) {
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      }
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }, [races]);

  useEffect(() => {
    if (selectedId && !ordered.some(race => String(race.id || normalize(race.name)) === selectedId)) {
      setSelectedId(null);
    }
  }, [ordered, selectedId]);

  if (ordered.length === 0) {
    return <div className="trilha-player-empty">Carregando Povos e Vertentes...</div>;
  }

  if (!selectedId) {
    return (
      <div className="max-w-5xl mx-auto py-2 sm:py-4">
        <div className="border-t border-gold-dim pt-6">
          <div className="flex flex-wrap gap-2.5">
            {ordered.map(race => {
              const id = String(race.id || normalize(race.name));
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className="trilha-ui-button min-w-[120px] justify-center rounded-lg border border-gold-dim bg-shadow/35 px-4 py-2.5 font-display text-sm text-gold hover:border-gold hover:text-gold-bright transition"
                >
                  {race.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const index = ordered.findIndex(race => String(race.id || normalize(race.name)) === selectedId);
  const current = ordered[Math.max(index, 0)];
  const previous = ordered[(index - 1 + ordered.length) % ordered.length];
  const next = ordered[(index + 1) % ordered.length];
  const currentImage = current.image_url || current.image || '';

  return (
    <article className="max-w-5xl mx-auto pb-8">
      <div className="border-t border-gold-dim pt-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-5">
          <button
            type="button"
            onClick={() => setSelectedId(String(previous.id || normalize(previous.name)))}
            className="justify-self-start inline-flex items-center gap-1.5 rounded-lg border border-gold-dim bg-shadow/35 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-parchment hover:border-gold hover:text-gold-bright transition"
            aria-label={`Ver ${previous.name}`}
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{previous.name}</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="font-display text-lg sm:text-2xl text-gold-bright tracking-wide text-center hover:text-gold transition"
            title="Voltar à lista de Povos"
          >
            {current.name}
          </button>

          <button
            type="button"
            onClick={() => setSelectedId(String(next.id || normalize(next.name)))}
            className="justify-self-end inline-flex items-center gap-1.5 rounded-lg border border-gold-dim bg-shadow/35 px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-parchment hover:border-gold hover:text-gold-bright transition"
            aria-label={`Ver ${next.name}`}
          >
            <span className="hidden sm:inline">{next.name}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gold-dim bg-shadow/25">
          <div className="aspect-[16/5] min-h-[150px] bg-stone flex items-center justify-center overflow-hidden">
            {currentImage ? (
              <img src={currentImage} alt={`Cabeçalho do Povo ${current.name}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-parchment-dim px-4 text-center">
                <ImageIcon className="w-9 h-9 text-gold/70" />
                <span className="text-xs">Imagem de cabeçalho ainda não cadastrada.</span>
              </div>
            )}
          </div>

          <div className="bg-parchment p-5 sm:p-7">
            <div className="whitespace-pre-line text-sm sm:text-[15px] leading-7 text-ink">
              {current.description?.trim() || 'Descrição ainda não registrada.'}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
