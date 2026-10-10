import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, ImagePlus, Pencil, Save, X, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Entry = { id?: string; name: string; description?: string | null; image_url?: string | null; image?: string | null; tagline?: string | null; race_id?: string; lineages?: Entry[] };
const ORDER = ['humanos','elfos','anoes','pequeninos','orcs','goblins','tiferinos','povo-fungico','draconatos','povo-fera'];
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-');
const entryKey = (e: Entry) => String(e.id || normalize(e.name));
const action = 'inline-flex items-center justify-center gap-2 rounded-lg border border-gold-dim bg-shadow/35 px-3 py-2 text-sm text-parchment transition hover:border-gold hover:text-gold-bright';
const field = 'w-full rounded-lg border border-gold-dim bg-parchment p-3 text-ink focus:outline-none focus:border-gold';

export default function AncestryBrowser({ races, admin = false }: { races: Entry[]; admin?: boolean }) {
  const [entries, setEntries] = useState<Entry[]>(races);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lineageId, setLineageId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setEntries(races); }, [races]);
  const ordered = useMemo(() => [...entries].sort((a,b) => {
    const ai = ORDER.indexOf(entryKey(a)); const bi = ORDER.indexOf(entryKey(b));
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.name.localeCompare(b.name,'pt-BR');
  }), [entries]);
  const current = ordered.find(r => entryKey(r) === selectedId);
  const lineages = current?.lineages || [];
  const chosen = lineages.find(l => entryKey(l) === lineageId);
  const active = chosen || current;
  const idx = current ? ordered.indexOf(current) : -1;
  const image = (e: Entry) => e.image_url || e.image || '';
  const dirty = editing && !!draft && !!active && JSON.stringify([draft.name,draft.description,draft.image_url]) !== JSON.stringify([active.name,active.description,active.image_url]);
  const resetEdit = () => { setEditing(false); setDraft(null); setMessage(''); };
  const cancelEdit = () => { if (canNavigate()) resetEdit(); };
  const canNavigate = () => !dirty || window.confirm('Há alterações não salvas. Deseja descartá-las?');
  const navigate = (race: string | null, lineage: string | null = null) => {
    if (!canNavigate()) return;
    resetEdit(); setSelectedId(race); setLineageId(lineage);
    contentRef.current?.scrollIntoView({block:'nearest'});
  };
  useEffect(() => { if (selectedId && !ordered.some(r => entryKey(r) === selectedId)) { setSelectedId(null); setLineageId(null); } }, [selectedId, ordered]);
  const beginEdit = () => { if (!active) return; setDraft({...active}); setEditing(true); setMessage(''); };
  const upload = async (file?: File) => {
    if (!file || !draft) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage('Use JPG, PNG ou WEBP de até 5 MB.'); return; }
    setBusy(true); setMessage('');
    const kind = chosen ? 'vertentes' : 'povos';
    const path = `${kind}/${draft.id}-${Date.now()}.${file.name.split('.').pop()?.toLowerCase() || 'webp'}`;
    const result = await supabase.storage.from('ancestry-images').upload(path, file);
    if (result.error) setMessage(`Erro ao enviar: ${result.error.message}`);
    else { const { data } = supabase.storage.from('ancestry-images').getPublicUrl(path); setDraft(d => d ? {...d, image_url: data.publicUrl} : d); setMessage('Imagem enviada. Clique em Salvar para confirmar a alteração.'); }
    setBusy(false);
  };
  const save = async () => {
    if (!draft || !active || !draft.name.trim()) { setMessage('Informe um nome.'); return; }
    setBusy(true); setMessage('');
    const table = chosen ? 'lineages' : 'races';
    const payload = {name:draft.name.trim(),description:draft.description || '',image_url:draft.image_url || ''};
    const result = await supabase.from(table).update(payload).eq('id', draft.id).select().single();
    if (result.error) { setMessage(`Erro ao salvar: ${result.error.message}`); setBusy(false); return; }
    if (active.name !== payload.name) {
      const columns = chosen ? ['lineage','secondary_lineage'] : ['race','secondary_race'];
      for (const column of columns) {
        const r = await supabase.from('characters').update({[column]:payload.name}).eq(column,active.name);
        if (r.error) setMessage(`Salvo, mas não foi possível atualizar personagens: ${r.error.message}`);
      }
    }
    setEntries(prev => prev.map(r => chosen ? {...r,lineages:(r.lineages || []).map(l => l.id === active.id ? {...l,...result.data} : l)} : r.id === active.id ? {...r,...result.data} : r));
    resetEdit(); setMessage('Alterações salvas com sucesso.'); setBusy(false);
  };
  const editor = editing && draft && <div className="mt-4 rounded-xl border border-gold bg-shadow/60 p-4 space-y-3">
    <label className="block text-xs text-gold">Nome<input className={`${field} mt-1`} value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})}/></label>
    <label className="block text-xs text-gold">Descrição<textarea rows={9} className={`${field} mt-1 font-ancestry-body leading-relaxed`} value={draft.description || ''} onChange={e => setDraft({...draft,description:e.target.value})}/></label>
    <div className="text-xs text-gold">Imagem — {chosen ? '700 × 700 px (1:1)' : '1600 × 500 px (16:5)'} recomendado</div>
    <div className="flex flex-wrap gap-2"><label className={`${action} cursor-pointer`}><ImagePlus size={16}/> Enviar/substituir<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={busy} onChange={e => upload(e.target.files?.[0])}/></label>
    {draft.image_url && <button className={action} disabled={busy} onClick={() => setDraft({...draft,image_url:''})}><Trash2 size={16}/> Remover imagem</button>}</div>
    {draft.image_url && <img src={draft.image_url} alt="Prévia da imagem enviada" className={`max-h-56 w-auto object-contain rounded border border-gold-dim`}/>}
    <div className="flex gap-2"><button className={action} disabled={busy} onClick={save}><Save size={16}/>{busy ? 'Salvando...' : 'Salvar alterações'}</button><button className={action} disabled={busy} onClick={cancelEdit}><X size={16}/>Cancelar</button></div>
  </div>;
  const heading = (e: Entry) => <div className="font-ancestry-body whitespace-pre-line text-[16px] leading-[1.7] text-ink">{e.description?.trim() || 'Descrição ainda não registrada.'}</div>;
  return <section ref={contentRef} className="mx-auto max-w-5xl pb-8">
    {!current ? <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-gold-dim pt-6">{ordered.map(r => <button type="button" key={entryKey(r)} onClick={() => navigate(entryKey(r))} className="min-h-[58px] rounded-lg border border-gold-dim bg-shadow/40 px-3 py-3 font-ancestry-title text-xl text-gold-bright hover:border-gold hover:bg-gold/10 transition">{r.name}</button>)}</div>
    : <>
      {!chosen ? <>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-gold-dim pt-5 mb-5">
          <button className={`${action} justify-self-start`} onClick={() => navigate(entryKey(ordered[(idx - 1 + ordered.length) % ordered.length]))}><ChevronLeft size={16}/><span className="hidden sm:inline">{ordered[(idx - 1 + ordered.length) % ordered.length].name}</span></button>
          <button className="font-ancestry-title text-2xl sm:text-3xl text-gold-bright" title="Voltar à lista" onClick={() => navigate(null)}>{current.name}</button>
          <button className={`${action} justify-self-end`} onClick={() => navigate(entryKey(ordered[(idx + 1) % ordered.length]))}><span className="hidden sm:inline">{ordered[(idx + 1) % ordered.length].name}</span><ChevronRight size={16}/></button>
        </div>
        <div className="overflow-hidden rounded-xl border border-gold-dim">
          <div className="aspect-[16/5] bg-stone flex items-center justify-center overflow-hidden">{image(current) ? <img className="h-full w-full object-contain" src={image(current)} alt={`Povo ${current.name}`}/> : <ImagePlus className="text-gold/50" size={38}/>}</div>
          <div className="bg-parchment p-5 sm:p-8">{heading(current)}</div>
        </div>
        {lineages.length > 0 && <div className="mt-6"><h3 className="font-ancestry-title text-2xl text-gold-bright mb-3">Conheça suas Vertentes</h3><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{lineages.map(l => <button key={entryKey(l)} onClick={() => navigate(selectedId,entryKey(l))} className="rounded-xl overflow-hidden border border-gold-dim bg-shadow/35 text-left hover:border-gold transition"><div className="aspect-[3/2] bg-stone flex items-center justify-center">{image(l) ? <img src={image(l)} className="w-full h-full object-cover" alt=""/> : <ImagePlus className="text-gold/50"/>}</div><div className="px-3 py-2 font-ancestry-title text-xl text-gold-bright">{l.name}</div></button>)}</div></div>}
      </> : <>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center border-t border-gold-dim pt-5 mb-5"><button className={`${action} justify-self-start`} onClick={() => navigate(selectedId)}><ArrowLeft size={16}/><span className="hidden sm:inline">{current.name}</span></button><h3 className="font-ancestry-title text-2xl sm:text-3xl text-gold-bright text-center">{chosen.name}</h3><div className="justify-self-end flex gap-1">{lineages.length > 1 && <><button className={action} title="Vertente anterior" onClick={() => navigate(selectedId,entryKey(lineages[(lineages.indexOf(chosen)-1+lineages.length)%lineages.length]))}><ChevronLeft size={16}/></button><button className={action} title="Próxima vertente" onClick={() => navigate(selectedId,entryKey(lineages[(lineages.indexOf(chosen)+1)%lineages.length]))}><ChevronRight size={16}/></button></>}</div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start"><div className="aspect-square rounded-xl border border-gold-dim bg-stone overflow-hidden flex items-center justify-center">{image(chosen) ? <img src={image(chosen)} alt={`Vertente ${chosen.name}`} className="w-full h-full object-contain"/> : <ImagePlus className="text-gold/50" size={40}/>}</div><div className="rounded-xl bg-parchment p-5 sm:p-7 min-h-full">{heading(chosen)}</div></div>
      </>}
      {admin && <div className="mt-5"><button className={action} onClick={editing ? cancelEdit : beginEdit}><Pencil size={16}/>{editing ? 'Fechar edição' : `Editar ${chosen ? 'Vertente' : 'Povo'}`}</button>{editor}</div>}
    </>}
    {message && <p role="status" className="mt-3 text-sm text-gold">{message}</p>}
  </section>;
}
