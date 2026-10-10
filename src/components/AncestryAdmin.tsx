import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AncestryBrowser from './AncestryBrowser';

export default function AncestryAdmin() {
  const [races, setRaces] = useState<any[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    (async () => {
      const [r, l] = await Promise.all([supabase.from('races').select('*').order('name'),supabase.from('lineages').select('*').order('name')]);
      if (!active) return;
      if (r.error || l.error) setError(r.error?.message || l.error?.message || 'Erro ao carregar povos e vertentes.');
      else setRaces((r.data || []).map(race => ({...race,lineages:(l.data || []).filter(lineage => lineage.race_id === race.id)})));
    })();
    return () => {active = false;};
  }, []);
  return <section><div className="mb-5 border-b border-gold-dim pb-4"><p className="text-[10px] tracking-[.2em] uppercase text-gold/70">Biblioteca do Mestre · Edição habilitada</p><h2 className="font-ancestry-title text-3xl text-gold-bright">Povos e Vertentes</h2></div>{error ? <p className="text-parchment">{error}</p> : <AncestryBrowser races={races} admin/>}</section>;
}
