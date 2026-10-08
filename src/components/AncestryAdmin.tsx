import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Kind = 'races' | 'lineages';

const input = 'w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold';
const btn = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm';
const defaultTagline = (kind: Kind) => kind === 'races' ? 'Povo narrativo e cultural' : 'Vertente narrativa e cultural';

export default function AncestryAdmin({ kind }: { kind: Kind }) {
  const [rows, setRows] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const [a, b] = await Promise.all([
      supabase.from(kind).select('*').order('name'),
      supabase.from('races').select('*').order('name'),
    ]);
    if (a.error) {
      setError('As tabelas de ancestralidade ainda não estão disponíveis.');
      return;
    }
    setRows(a.data || []);
    setRaces(b.data || []);
    if (selected) {
      const fresh = (a.data || []).find((x: any) => x.id === selected.id);
      if (fresh) {
        setSelected(fresh);
        setDraft({ ...fresh });
      }
    }
  };

  useEffect(() => { load(); }, [kind]);

  const grouped = useMemo(
    () => kind === 'lineages'
      ? races.map(race => ({ race, items: rows.filter(item => item.race_id === race.id) }))
      : [],
    [kind, races, rows],
  );

  const choose = (row: any) => {
    setSelected(row);
    setDraft({ ...row, tagline: row.tagline || defaultTagline(kind) });
  };

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setSaving(true);
    const oldName = selected?.name;
    const payload = {
      name: draft.name.trim(),
      tagline: (draft.tagline || '').trim() || defaultTagline(kind),
      description: draft.description || '',
      image_url: draft.image_url || '',
    };
    const { data, error: updateError } = await supabase.from(kind).update(payload).eq('id', draft.id).select().single();

    if (updateError) {
      alert(updateError.message);
    } else {
      if (oldName && oldName !== payload.name) {
        if (kind === 'races') {
          await supabase.from('characters').update({ race: payload.name }).eq('race', oldName);
          await supabase.from('characters').update({ secondary_race: payload.name }).eq('secondary_race', oldName);
        } else {
          await supabase.from('characters').update({ lineage: payload.name }).eq('lineage', oldName);
          await supabase.from('characters').update({ secondary_lineage: payload.name }).eq('secondary_lineage', oldName);
        }
      }
      setSelected(data);
      setDraft({ ...data });
      await load();
    }
    setSaving(false);
  };

  const upload = async (file?: File) => {
    if (!file || !draft) return;
    const ext = file.name.split('.').pop() || 'png';
    const path = `${kind}/${draft.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('ancestry-images').upload(path, file, { upsert: true });
    if (uploadError) {
      alert(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('ancestry-images').getPublicUrl(path);
    setDraft({ ...draft, image_url: data.publicUrl });
  };

  if (error) return <div className="bg-blood/10 border border-blood/40 rounded-xl p-5 text-parchment">{error}</div>;

  const card = (row: any) => (
    <button key={row.id} onClick={() => choose(row)} className={`text-left rounded-xl border p-3 transition ${selected?.id === row.id ? 'border-gold bg-gold/10' : 'border-gold-dim bg-gradient-card hover:border-gold'}`}>
      <div className="flex gap-3 items-center">
        {row.image_url
          ? <img src={row.image_url} className="w-16 h-16 rounded-lg object-cover border border-gold-dim" />
          : <div className="w-16 h-16 bg-shadow rounded-lg" />}
        <div className="min-w-0">
          <b className="font-display text-gold-bright">{row.name}</b>
          <p className="text-[11px] leading-snug text-parchment-dim mt-1">{row.tagline || defaultTagline(kind)}</p>
        </div>
      </div>
    </button>
  );

  return (
    <section className="grid lg:grid-cols-[1fr_1fr] gap-5">
      <div>
        <h2 className="font-display text-xl text-gold-bright mb-1">{kind === 'races' ? 'Povos' : 'Vertentes'}</h2>
        <p className="text-xs text-parchment-dim mb-4">Edite nome, texto curto, imagem e descrição. Povo e Vertente não concedem bônus mecânicos automáticos.</p>
        {kind === 'races'
          ? <div className="grid sm:grid-cols-2 gap-3">{rows.map(card)}</div>
          : <div className="space-y-5">{grouped.map(group => <div key={group.race.id}><h3 className="font-display text-gold mb-2">{group.race.name}</h3><div className="grid sm:grid-cols-2 gap-3">{group.items.map(card)}</div></div>)}</div>}
      </div>

      <div>
        {draft ? (
          <div className="bg-gradient-card border border-gold-dim rounded-xl p-5 sticky top-24">
            <h3 className="font-display text-lg text-gold-bright mb-4">Editar {kind === 'races' ? 'Povo' : 'Vertente'}</h3>
            <div className="space-y-4">
              <label className="block text-xs text-gold">Nome
                <input className={`${input} mt-1`} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </label>

              <label className="block text-xs text-gold">Texto curto
                <input
                  className={`${input} mt-1`}
                  value={draft.tagline || defaultTagline(kind)}
                  onChange={e => setDraft({ ...draft, tagline: e.target.value })}
                  maxLength={100}
                  placeholder={defaultTagline(kind)}
                />
                <span className="block mt-1 text-[10px] text-parchment-dim">Aparece abaixo do nome nas telas de consulta e criação.</span>
              </label>

              <div>
                <span className="block text-xs text-gold mb-1">Imagem</span>
                {draft.image_url && <img src={draft.image_url} className="w-full max-h-64 object-contain bg-shadow rounded-lg border border-gold-dim mb-2" />}
                <label className={`${btn} cursor-pointer`}><ImagePlus className="w-4 h-4" />Trocar imagem<input type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files?.[0])} /></label>
              </div>

              <label className="block text-xs text-gold">Descrição
                <textarea rows={7} className={`${input} mt-1 resize-y`} value={draft.description || ''} onChange={e => setDraft({ ...draft, description: e.target.value })} />
              </label>

              <div className="rounded-lg border border-gold-dim bg-shadow/25 p-3">
                <span className="block text-[10px] uppercase tracking-[.15em] text-gold/70 mb-1">Regra da TRILHA 1.5</span>
                <p className="text-sm text-parchment-dim">Povo e Vertente são escolhas narrativas/culturais. O texto curto é descritivo e não cria bônus mecânicos.</p>
              </div>

              <button className={btn} onClick={save} disabled={saving}><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button>
            </div>
          </div>
        ) : <div className="border border-gold-dim rounded-xl p-6 text-parchment-dim">Selecione {kind === 'races' ? 'um Povo' : 'uma Vertente'} para editar.</div>}
      </div>
    </section>
  );
}
