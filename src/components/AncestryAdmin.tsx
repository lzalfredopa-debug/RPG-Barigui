import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Kind = 'races' | 'lineages';

const input = 'w-full bg-parchment border border-gold-dim rounded-lg px-3 py-2 text-ink text-sm focus:outline-none focus:border-blood-dark';
const btn = 'trilha-ui-button inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm';
const defaultTagline = (kind: Kind) => kind === 'races' ? 'Povo narrativo e cultural' : 'Vertente narrativa e cultural';

export default function AncestryAdmin() {
  const [kind, setKind] = useState<Kind>('races');
  const [rows, setRows] = useState<any[]>([]);
  const [races, setRaces] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const [a, b] = await Promise.all([
      supabase.from(kind).select('*').order('name'),
      supabase.from('races').select('*').order('name'),
    ]);
    if (a.error) {
      setError('As tabelas de Povos e Vertentes ainda não estão disponíveis.');
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

  useEffect(() => {
    setSelected(null);
    setDraft(null);
    load();
  }, [kind]);

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
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5 MB. Para o site, prefira JPG ou WEBP otimizado.');
      return;
    }
    setUploading(true);
    const ext = (file.name.split('.').pop() || 'webp').toLowerCase();
    const folder = kind === 'races' ? 'povos' : 'vertentes';
    const path = `${folder}/${draft.id}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('ancestry-images').upload(path, file, { upsert: true });
    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('ancestry-images').getPublicUrl(path);
    setDraft({ ...draft, image_url: data.publicUrl });
    setUploading(false);
  };

  if (error) return <div className="bg-blood/10 border border-blood/40 rounded-xl p-5 text-parchment">{error}</div>;

  const card = (row: any) => (
    <button key={row.id} onClick={() => choose(row)} className={`text-left rounded-xl border p-3 transition ${selected?.id === row.id ? 'border-gold bg-gold/10' : 'border-gold-dim bg-shadow/35 hover:border-gold'}`}>
      <div className="flex gap-3 items-center">
        <div className={`${kind === 'races' ? 'w-24 aspect-[16/5]' : 'w-20 aspect-[3/2]'} shrink-0 overflow-hidden rounded-lg border border-gold-dim bg-stone flex items-center justify-center`}>
          {row.image_url ? <img src={row.image_url} className="w-full h-full object-cover" alt="" /> : <ImagePlus className="w-5 h-5 text-gold/50" />}
        </div>
        <div className="min-w-0">
          <b className="font-display text-gold-bright">{row.name}</b>
          <p className="text-[11px] leading-snug text-parchment-dim mt-1 line-clamp-2">{row.description || 'Descrição ainda não registrada.'}</p>
        </div>
      </div>
    </button>
  );

  const imageHelp = kind === 'races'
    ? 'Cabeçalho recomendado: 1600 × 500 px (proporção 16:5). Prefira WEBP ou JPG e tente manter abaixo de 1 MB.'
    : 'Imagem recomendada: 1200 × 800 px (proporção 3:2). Prefira WEBP ou JPG e tente manter abaixo de 1 MB.';

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold-dim pb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Biblioteca do Mestre</p>
          <h2 className="font-display text-2xl text-gold-bright">Povos e Vertentes</h2>
        </div>
        <div className="inline-flex rounded-lg border border-gold-dim overflow-hidden">
          <button type="button" onClick={() => setKind('races')} className={`px-4 py-2 text-sm ${kind === 'races' ? 'bg-gold text-ink' : 'bg-shadow/40 text-parchment'}`}>Povos</button>
          <button type="button" onClick={() => setKind('lineages')} className={`px-4 py-2 text-sm ${kind === 'lineages' ? 'bg-gold text-ink' : 'bg-shadow/40 text-parchment'}`}>Vertentes</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)] gap-5">
        <div>
          {kind === 'races'
            ? <div className="grid sm:grid-cols-2 gap-3">{rows.map(card)}</div>
            : <div className="space-y-5">{grouped.map(group => <div key={group.race.id}><h3 className="font-display text-gold mb-2">{group.race.name}</h3><div className="grid sm:grid-cols-2 gap-3">{group.items.map(card)}</div></div>)}</div>}
        </div>

        <div>
          {draft ? (
            <div className="bg-shadow/35 border border-gold-dim rounded-xl p-5 sticky top-24">
              <h3 className="font-display text-lg text-gold-bright mb-4">Editar {kind === 'races' ? 'Povo' : 'Vertente'}</h3>
              <div className="space-y-4">
                <label className="block text-xs text-gold">Nome
                  <input className={`${input} mt-1`} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
                </label>

                <div>
                  <span className="block text-xs text-gold mb-2">Imagem</span>
                  <div className={`w-full ${kind === 'races' ? 'aspect-[16/5]' : 'aspect-[3/2]'} overflow-hidden rounded-lg border border-gold-dim bg-stone flex items-center justify-center mb-2`}>
                    {draft.image_url
                      ? <img src={draft.image_url} className="w-full h-full object-cover" alt={`Prévia de ${draft.name}`} />
                      : <div className="text-center px-4"><ImagePlus className="w-8 h-8 text-gold/60 mx-auto"/><p className="mt-2 text-xs text-parchment-dim">Nenhuma imagem cadastrada.</p></div>}
                  </div>
                  <p className="text-[11px] leading-relaxed text-parchment-dim mb-2">{imageHelp}</p>
                  <div className="flex flex-wrap gap-2">
                    <label className={`${btn} cursor-pointer`}><ImagePlus className="w-4 h-4" />{uploading ? 'Enviando...' : 'Enviar imagem'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={e => upload(e.target.files?.[0])} /></label>
                    {draft.image_url && <button type="button" className={`${btn} text-parchment`} onClick={() => setDraft({ ...draft, image_url: '' })}><Trash2 className="w-4 h-4"/>Remover imagem</button>}
                  </div>
                </div>

                <label className="block text-xs text-gold">Texto
                  <textarea
                    rows={kind === 'races' ? 16 : 9}
                    className={`${input} mt-1 resize-y leading-relaxed`}
                    value={draft.description || ''}
                    onChange={e => setDraft({ ...draft, description: e.target.value })}
                    placeholder={kind === 'races' ? 'Texto do compêndio deste Povo...' : 'Descrição desta Vertente...'}
                  />
                  <span className="block mt-1 text-[10px] text-parchment-dim">Este é o texto exibido para o jogador na Biblioteca e usado como referência durante a criação.</span>
                </label>

                <button className={btn} onClick={save} disabled={saving || uploading}><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button>
              </div>
            </div>
          ) : <div className="border border-gold-dim rounded-xl p-6 text-parchment-dim">Selecione {kind === 'races' ? 'um Povo' : 'uma Vertente'} para editar.</div>}
        </div>
      </div>
    </section>
  );
}
