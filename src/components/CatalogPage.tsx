import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Package, Pencil, Plus, RefreshCw, Save, Search, Shield, Shirt, Sword, Trash2, X } from 'lucide-react';
import {
  supabase,
  type ArmorMaster,
  type ArmorPublic,
  type ItemCatalogPublic,
  type ShieldMaster,
  type ShieldPublic,
  type WeaponMaster,
  type WeaponPublic,
} from '@/lib/supabase';
import { formatAmount, formatDuration } from '@/lib/items';

type CatalogClass = 'common' | 'weapons' | 'armors' | 'shields';
type Props = { playerId: string; isMaster?: boolean };
type AnyCatalogItem = ItemCatalogPublic | WeaponPublic | ArmorPublic | ShieldPublic;
type Editor = { kind: CatalogClass; item: Record<string, unknown> } | null;

const input = 'trilha-ui-field w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold';
const btn = 'trilha-ui-button inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm disabled:opacity-40';
const slug = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = (value: unknown, fallback = 0) => Number(value) || fallback;
const nullableNum = (value: unknown) => value === '' || value == null ? null : Number(value);
const text = (value: unknown) => String(value ?? '');

const emptyCommon = (): Record<string, unknown> => ({
  id: '', name: '', category: 'Itens variados', category_order: 23, sort_order: 0,
  is_consumable: false, is_perishable: false, is_container: false, is_durable: false,
  unit: 'un', default_amount: 1, capacity_ml: '', shelf_life_minutes: '', durability_max: '',
  repairable: false, notes: '', weight_kg: 0, consumption_kind: '', portion_amount: '', restore_points: 1,
  carry_slot_kind: '', carry_bonus_kg: 0, body_weightless: false,
});
const emptyWeapon = (): Record<string, unknown> => ({
  id: '', name: '', family: 'Espadas', damage_base: 1, damage_type: 'Cortante', attack_attribute: 'Força', attack_skill: 'Esgrima',
  requirement_attribute: '', requirement_attribute_min: 0, requirement_skill: '', requirement_skill_min: 0,
  hands: 1, range_label: 'Corpo a corpo', special_rule: '', sort_order: 0, weight_kg: 1, durability_max: 4,
});
const emptyArmor = (): Record<string, unknown> => ({
  id: '', name: '', category: 'Leve', absorption: 1, requirement_attribute: 'Vigor', requirement_attribute_min: 1,
  requirement_skill: '', requirement_skill_min: 0, evasion_penalty: 0, movement_penalty: 0, sort_order: 0, weight_kg: 6, durability_max: 4,
});
const emptyShield = (): Record<string, unknown> => ({
  id: '', name: '', block_attribute: 'Força', block_bonus: 1, requirement_attribute: 'Força', requirement_attribute_min: 1,
  requirement_skill: 'Defesa', requirement_skill_min: 1, evasion_penalty: 0, movement_penalty: 0, sort_order: 0, weight_kg: 2, durability_max: 4,
});

export default function CatalogPage({ playerId, isMaster = false }: Props) {
  const [common, setCommon] = useState<ItemCatalogPublic[]>([]);
  const [weapons, setWeapons] = useState<(WeaponPublic & Partial<WeaponMaster>)[]>([]);
  const [armors, setArmors] = useState<(ArmorPublic & Partial<ArmorMaster>)[]>([]);
  const [shields, setShields] = useState<(ShieldPublic & Partial<ShieldMaster>)[]>([]);
  const [active, setActive] = useState<CatalogClass>('common');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem('trilha:catalog:groups') || '{}'); } catch { return {}; }
  });
  useEffect(() => { try { localStorage.setItem('trilha:catalog:groups', JSON.stringify(openGroups)); } catch { /* preferência local opcional */ } }, [openGroups]);

  const load = useCallback(async () => {
    setLoading(true);
    const [ci, wp, ap, sp] = await Promise.all([
      supabase.from('item_catalog_public').select('*').order('category_order').order('sort_order').order('name'),
      supabase.from('weapon_catalog_public').select('*').order('family').order('name'),
      supabase.from('armor_catalog_public').select('*').order('category').order('name'),
      supabase.from('shield_catalog_public').select('*').order('name'),
    ]);
    setCommon((ci.data || []) as ItemCatalogPublic[]);
    const publicWeapons = (wp.data || []) as WeaponPublic[];
    const publicArmors = (ap.data || []) as ArmorPublic[];
    const publicShields = (sp.data || []) as ShieldPublic[];
    if (isMaster) {
      const [wm, am, sm] = await Promise.all([
        supabase.rpc('get_master_weapon_catalog', { p_player_id: playerId }),
        supabase.rpc('get_master_armor_catalog', { p_player_id: playerId }),
        supabase.rpc('get_master_shield_catalog', { p_player_id: playerId }),
      ]);
      const wmMap = new Map(((wm.data || []) as WeaponMaster[]).map(x => [x.id, x]));
      const amMap = new Map(((am.data || []) as ArmorMaster[]).map(x => [x.id, x]));
      const smMap = new Map(((sm.data || []) as ShieldMaster[]).map(x => [x.id, x]));
      setWeapons(publicWeapons.map(x => ({ ...x, ...(wmMap.get(x.id) || {}) })));
      setArmors(publicArmors.map(x => ({ ...x, ...(amMap.get(x.id) || {}) })));
      setShields(publicShields.map(x => ({ ...x, ...(smMap.get(x.id) || {}) })));
    } else {
      setWeapons(publicWeapons);
      setArmors(publicArmors);
      setShields(publicShields);
    }
    setLoading(false);
  }, [isMaster, playerId]);

  useEffect(() => { load(); }, [load]);

  const lists: Record<CatalogClass, AnyCatalogItem[]> = { common, weapons, armors, shields };
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('pt-BR');
    return lists[active].filter(item => !q || item.name.toLocaleLowerCase('pt-BR').includes(q) ||
      ('category' in item && String(item.category).toLocaleLowerCase('pt-BR').includes(q)) ||
      ('family' in item && String(item.family).toLocaleLowerCase('pt-BR').includes(q)));
  }, [active, search, common, weapons, armors, shields]);

  const groups = useMemo(() => {
    const getGroup = (item: AnyCatalogItem) => active === 'common' ? (item as ItemCatalogPublic).category :
      active === 'weapons' ? (item as WeaponPublic).family : active === 'armors' ? (item as ArmorPublic).category : 'Escudos';
    const map = new Map<string, AnyCatalogItem[]>();
    for (const item of filtered) {
      const group = getGroup(item);
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(item);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items: items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')) }));
  }, [active, filtered]);

  const openNew = () => setEditor({ kind: active, item: active === 'common' ? emptyCommon() : active === 'weapons' ? emptyWeapon() : active === 'armors' ? emptyArmor() : emptyShield() });
  const openEdit = (item: AnyCatalogItem) => setEditor({ kind: active, item: { ...item } as Record<string, unknown> });
  const setField = (key: string, value: unknown) => setEditor(e => e ? { ...e, item: { ...e.item, [key]: value } } : e);

  const save = async () => {
    if (!editor || saving) return;
    const i = editor.item;
    const name = text(i.name).trim();
    if (!name) return alert('Informe o nome do item.');
    const id = text(i.id).trim() || slug(name);
    if (!id) return alert('Não foi possível gerar um identificador para o item.');
    setSaving(true);
    let result: { error: { message: string } | null };
    if (editor.kind === 'common') {
      result = await supabase.rpc('master_save_common_catalog_item', {
        p_master_player_id: playerId, p_id: id, p_name: name, p_category: text(i.category) || 'Itens variados',
        p_category_order: num(i.category_order, 23), p_sort_order: num(i.sort_order), p_is_consumable: !!i.is_consumable,
        p_is_perishable: !!i.is_perishable, p_is_container: !!i.is_container, p_is_durable: !!i.is_durable,
        p_unit: text(i.unit) || 'un', p_default_amount: Math.max(.001, num(i.default_amount, 1)), p_capacity_ml: nullableNum(i.capacity_ml),
        p_shelf_life_minutes: nullableNum(i.shelf_life_minutes), p_durability_max: nullableNum(i.durability_max), p_repairable: !!i.repairable,
        p_notes: text(i.notes) || null, p_weight_kg: Math.max(0, num(i.weight_kg)), p_consumption_kind: text(i.consumption_kind) || null,
        p_portion_amount: nullableNum(i.portion_amount), p_restore_points: Math.max(0, num(i.restore_points, 1)), p_carry_slot_kind: text(i.carry_slot_kind) || null,
        p_carry_bonus_kg: Math.max(0, num(i.carry_bonus_kg)), p_body_weightless: !!i.body_weightless,
      });
    } else if (editor.kind === 'weapons') {
      result = await supabase.rpc('master_save_weapon_catalog_item', {
        p_master_player_id: playerId, p_id: id, p_name: name, p_family: text(i.family) || 'Outras', p_damage_base: num(i.damage_base),
        p_damage_type: text(i.damage_type) || '—', p_attack_attribute: text(i.attack_attribute) || 'Força', p_attack_skill: text(i.attack_skill) || 'Luta',
        p_requirement_attribute: text(i.requirement_attribute) || null, p_requirement_attribute_min: num(i.requirement_attribute_min),
        p_requirement_skill: text(i.requirement_skill) || null, p_requirement_skill_min: num(i.requirement_skill_min), p_hands: Math.max(1, num(i.hands, 1)),
        p_range_label: text(i.range_label) || 'Corpo a corpo', p_special_rule: text(i.special_rule) || null, p_sort_order: num(i.sort_order),
        p_weight_kg: Math.max(0, num(i.weight_kg)), p_durability_max: Math.max(1, num(i.durability_max, 4)),
      });
    } else if (editor.kind === 'armors') {
      result = await supabase.rpc('master_save_armor_catalog_item', {
        p_master_player_id: playerId, p_id: id, p_name: name, p_category: text(i.category) || 'Leve', p_absorption: num(i.absorption),
        p_requirement_attribute: text(i.requirement_attribute) || null, p_requirement_attribute_min: num(i.requirement_attribute_min),
        p_requirement_skill: text(i.requirement_skill) || null, p_requirement_skill_min: num(i.requirement_skill_min),
        p_evasion_penalty: num(i.evasion_penalty), p_movement_penalty: num(i.movement_penalty), p_sort_order: num(i.sort_order),
        p_weight_kg: Math.max(0, num(i.weight_kg)), p_durability_max: Math.max(1, num(i.durability_max, 4)),
      });
    } else {
      result = await supabase.rpc('master_save_shield_catalog_item', {
        p_master_player_id: playerId, p_id: id, p_name: name, p_block_attribute: text(i.block_attribute) || 'Força', p_block_bonus: num(i.block_bonus),
        p_requirement_attribute: text(i.requirement_attribute) || null, p_requirement_attribute_min: num(i.requirement_attribute_min),
        p_requirement_skill: text(i.requirement_skill) || null, p_requirement_skill_min: num(i.requirement_skill_min),
        p_evasion_penalty: num(i.evasion_penalty), p_movement_penalty: num(i.movement_penalty), p_sort_order: num(i.sort_order),
        p_weight_kg: Math.max(0, num(i.weight_kg)), p_durability_max: Math.max(1, num(i.durability_max, 4)),
      });
    }
    if (result.error) alert(result.error.message); else { setEditor(null); await load(); }
    setSaving(false);
  };

  const remove = async (item: AnyCatalogItem) => {
    if (!confirm(`Remover “${item.name}” do catálogo?\n\nQuem já possui o item continua com sua cópia na ficha.`)) return;
    const fn = active === 'common' ? 'master_delete_common_catalog_item' : active === 'weapons' ? 'master_delete_weapon_catalog_item' : active === 'armors' ? 'master_delete_armor_catalog_item' : 'master_delete_shield_catalog_item';
    const { error } = await supabase.rpc(fn, { p_master_player_id: playerId, p_id: item.id });
    if (error) alert(error.message); else await load();
  };

  const classButtons: [CatalogClass, string, typeof Package][] = [
    ['common', 'Itens comuns', Package], ['weapons', 'Armas', Sword], ['armors', 'Armaduras', Shirt], ['shields', 'Escudos', Shield],
  ];

  return <div className="trilha-catalog-page space-y-5 pb-8">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold-dim pb-4">
      <div><p className="text-xs uppercase tracking-[.22em] text-gold/70">Consulta do sistema</p><h2 className="font-display text-2xl text-gold-bright mt-1">Catálogo</h2><p className="text-sm text-parchment-dim mt-1">Itens comuns, armas, armaduras e escudos em um único lugar.</p></div>
      <div className="flex gap-2">{isMaster && <button className={`${btn} is-primary`} onClick={openNew}><Plus className="w-4 h-4"/>Adicionar</button>}<button className={`${btn} is-quiet`} onClick={load}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>Atualizar</button></div>
    </div>
    <div className="flex flex-wrap gap-2">{classButtons.map(([key, label, Icon]) => <button key={key} onClick={() => setActive(key)} className={`${btn} trilha-ui-segment ${active === key ? 'is-active' : ''}`}><Icon className="w-4 h-4"/>{label} <span className="text-[10px] opacity-70">{lists[key].length}</span></button>)}</div>
    <label className="trilha-catalog-search relative block max-w-lg"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60"/><input className={`${input} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome ou subclasse..."/></label>
    {loading ? <p className="text-parchment-dim">Carregando catálogo...</p> : groups.length === 0 ? <p className="text-parchment-dim">Nenhum item encontrado.</p> : <div className="space-y-3">{groups.map(group => { const groupKey = `${active}:${group.name}`; const isOpen = openGroups[groupKey] !== false; return <section key={group.name} className="trilha-catalog-group rounded-xl border border-gold-dim bg-gradient-card overflow-hidden"><button type="button" onClick={() => setOpenGroups(current => ({ ...current, [groupKey]: !isOpen }))} className="w-full px-4 py-3 bg-shadow/45 flex justify-between items-center text-left"><div className="flex items-center gap-2">{isOpen ? <ChevronDown className="w-4 h-4 text-gold"/> : <ChevronRight className="w-4 h-4 text-gold"/>}<div><h3 className="font-display text-lg text-gold-bright">{group.name}</h3><p className="text-xs text-parchment-dim">{group.items.length} item(ns)</p></div></div></button>{isOpen && <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 p-3">{group.items.map(item => {
      const weight = 'weight_kg' in item ? item.weight_kg : null;
      const durability = 'durability_max' in item ? item.durability_max : null;
      const amount = active === 'common' ? formatAmount((item as ItemCatalogPublic).default_amount, (item as ItemCatalogPublic).unit) : null;
      return <article key={item.id} className="trilha-catalog-item rounded-lg border border-gold-dim/60 bg-shadow/35 p-4"><div className="flex justify-between gap-3"><div className="min-w-0"><b className="text-gold-bright">{item.name}</b><p className="text-xs text-parchment-dim mt-1">{weight == null ? '⚠ Peso não definido' : `${Number(weight).toLocaleString('pt-BR',{maximumFractionDigits:2})} kg`}{durability ? ` · Durabilidade ${durability}` : ''}{amount ? ` · ${amount}` : ''}</p></div>{isMaster && <div className="flex gap-2 shrink-0"><button className="trilha-icon-button" onClick={() => openEdit(item)} title="Editar"><Pencil className="w-4 h-4"/></button><button className="trilha-icon-button is-danger" onClick={() => remove(item)} title="Remover"><Trash2 className="w-4 h-4"/></button></div>}</div>
      {active === 'common' && <CommonSummary item={item as ItemCatalogPublic}/>} {isMaster && active === 'weapons' && <WeaponSummary item={item as WeaponPublic & Partial<WeaponMaster>}/>} {isMaster && active === 'armors' && <ArmorSummary item={item as ArmorPublic & Partial<ArmorMaster>}/>} {isMaster && active === 'shields' && <ShieldSummary item={item as ShieldPublic & Partial<ShieldMaster>}/>}</article>;
    })}</div>}</section>; })}</div>}
    {editor && isMaster && <EditorModal editor={editor} saving={saving} setField={setField} onSave={save} onClose={() => setEditor(null)} commonCategories={[...new Set(common.map(x => x.category)), 'Itens variados']}/>} 
  </div>;
}

function CommonSummary({ item }: { item: ItemCatalogPublic }) {
  return <div className="mt-3 text-xs text-parchment-dim space-y-1">{item.consumption_kind === 'food' && <p className="text-gold">Porção: {formatAmount(item.portion_amount, item.unit)} → +{item.restore_points} Fome</p>}{item.consumption_kind === 'water' && <p className="text-gold">Porção: {formatAmount(item.portion_amount, item.unit)} → +{item.restore_points} Sede</p>}{item.capacity_ml && <p>Capacidade: {formatAmount(item.capacity_ml, 'ml')}</p>}{item.shelf_life_minutes && <p>Validade base: {formatDuration(item.shelf_life_minutes)}</p>}{item.carry_slot_kind && <p>Compartimento {item.carry_slot_kind === 'main' ? 'principal' : 'auxiliar'}{item.carry_bonus_kg ? ` · +${item.carry_bonus_kg} kg de carga` : ''}</p>}{item.notes && <p className="pt-1">{item.notes}</p>}</div>;
}
function WeaponSummary({ item }: { item: WeaponPublic & Partial<WeaponMaster> }) { return <p className="mt-3 text-xs text-parchment-dim">Dano {item.damage_base ?? '—'} · {item.damage_type ?? '—'} · {item.hands ?? '—'} mão(s) · {item.range_label ?? '—'}</p>; }
function ArmorSummary({ item }: { item: ArmorPublic & Partial<ArmorMaster> }) { return <p className="mt-3 text-xs text-parchment-dim">Absorção {item.absorption ?? '—'}{item.evasion_penalty ? ` · Evasão −${item.evasion_penalty}` : ''}{item.movement_penalty ? ` · Movimento −${item.movement_penalty} m` : ''}</p>; }
function ShieldSummary({ item }: { item: ShieldPublic & Partial<ShieldMaster> }) { return <p className="mt-3 text-xs text-parchment-dim">Bloqueio +{item.block_bonus ?? '—'} · {item.block_attribute ?? '—'} + Defesa</p>; }

function EditorModal({ editor, saving, setField, onSave, onClose, commonCategories }: { editor: NonNullable<Editor>; saving: boolean; setField: (k: string, v: unknown) => void; onSave: () => void; onClose: () => void; commonCategories: string[] }) {
  const i = editor.item;
  const numberField = (label: string, key: string, step = '1') => <label className="text-xs text-gold">{label}<input type="number" step={step} className={`${input} mt-1`} value={text(i[key])} onChange={e => setField(key, e.target.value)}/></label>;
  const textField = (label: string, key: string) => <label className="text-xs text-gold">{label}<input className={`${input} mt-1`} value={text(i[key])} onChange={e => setField(key, e.target.value)}/></label>;
  const check = (label: string, key: string) => <label className="flex items-center gap-2 text-sm text-parchment"><input type="checkbox" checked={!!i[key]} onChange={e => setField(key, e.target.checked)}/>{label}</label>;
  return <div className="trilha-catalog-editor fixed inset-0 z-[80] bg-black/80 p-3 overflow-y-auto"><div className="trilha-catalog-editor-panel max-w-4xl mx-auto my-4 rounded-2xl border border-gold bg-stone shadow-2xl"><div className="sticky top-0 z-10 bg-stone border-b border-gold-dim p-4 flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[.18em] text-gold/70">Editor do Mestre</p><h3 className="font-display text-xl text-gold-bright">{text(i.name) || 'Novo item'}</h3></div><div className="flex gap-2"><button className={`${btn} is-quiet`} onClick={onClose}><X className="w-4 h-4"/>Cancelar</button><button className={`${btn} is-primary`} disabled={saving} onClick={onSave}><Save className="w-4 h-4"/>{saving ? 'Salvando...' : 'Salvar'}</button></div></div><div className="p-5 space-y-5">
    <div className="grid sm:grid-cols-2 gap-3">{textField('Nome','name')}<label className="text-xs text-gold">ID<input className={`${input} mt-1`} value={text(i.id)} onChange={e => setField('id', slug(e.target.value))} placeholder="gerado pelo nome se vazio"/></label></div>
    {editor.kind === 'common' && <><div className="grid sm:grid-cols-3 gap-3"><label className="text-xs text-gold">Subclasse<input list="catalog-categories" className={`${input} mt-1`} value={text(i.category)} onChange={e => setField('category',e.target.value)}/><datalist id="catalog-categories">{commonCategories.map(x=><option key={x} value={x}/>)}</datalist></label>{numberField('Ordem da subclasse','category_order')}{numberField('Ordem do item','sort_order')}</div><div className="grid sm:grid-cols-4 gap-3">{numberField('Peso (kg)','weight_kg','0.01')}{textField('Unidade','unit')}{numberField('Quantidade padrão','default_amount','0.01')}{numberField('Durabilidade máx.','durability_max')}</div><div className="grid sm:grid-cols-3 gap-3">{numberField('Capacidade (ml)','capacity_ml')}{numberField('Validade (min)','shelf_life_minutes')}{numberField('Bônus de carga (kg)','carry_bonus_kg','0.1')}</div><div className="grid sm:grid-cols-3 gap-3"><label className="text-xs text-gold">Consumo<select className={`${input} mt-1`} value={text(i.consumption_kind)} onChange={e=>setField('consumption_kind',e.target.value)}><option value="">Não recupera</option><option value="food">Alimento / Fome</option><option value="water">Bebida / Sede</option></select></label>{numberField('Tamanho da porção','portion_amount','0.01')}{numberField('Pontos recuperados','restore_points')}</div><div className="grid sm:grid-cols-2 gap-3"><label className="text-xs text-gold">Compartimento corporal<select className={`${input} mt-1`} value={text(i.carry_slot_kind)} onChange={e=>setField('carry_slot_kind',e.target.value)}><option value="">Nenhum</option><option value="main">Principal</option><option value="auxiliary">Auxiliar</option></select></label><label className="text-xs text-gold">Observações<textarea className={`${input} mt-1`} rows={3} value={text(i.notes)} onChange={e=>setField('notes',e.target.value)}/></label></div><div className="flex flex-wrap gap-4">{check('Consumível','is_consumable')}{check('Perecível','is_perishable')}{check('Recipiente','is_container')}{check('Durável','is_durable')}{check('Reparável','repairable')}{check('Peso próprio ignorado quando preso ao corpo','body_weightless')}</div></>}
    {editor.kind === 'weapons' && <><div className="grid sm:grid-cols-3 gap-3">{textField('Família','family')}{numberField('Peso (kg)','weight_kg','0.01')}{numberField('Durabilidade','durability_max')}</div><div className="grid sm:grid-cols-4 gap-3">{numberField('Dano base','damage_base')}{textField('Tipo de dano','damage_type')}{textField('Atributo de ataque','attack_attribute')}{textField('Habilidade de ataque','attack_skill')}</div><div className="grid sm:grid-cols-4 gap-3">{textField('Atributo exigido','requirement_attribute')}{numberField('Mínimo','requirement_attribute_min')}{textField('Habilidade exigida','requirement_skill')}{numberField('Mínimo','requirement_skill_min')}</div><div className="grid sm:grid-cols-3 gap-3">{numberField('Mãos','hands')}{textField('Alcance','range_label')}{numberField('Ordem','sort_order')}</div><label className="text-xs text-gold">Regra especial<textarea className={`${input} mt-1`} rows={3} value={text(i.special_rule)} onChange={e=>setField('special_rule',e.target.value)}/></label></>}
    {editor.kind === 'armors' && <><div className="grid sm:grid-cols-4 gap-3"><label className="text-xs text-gold">Categoria<select className={`${input} mt-1`} value={text(i.category)} onChange={e=>setField('category',e.target.value)}><option>Leve</option><option>Média</option><option>Pesada</option></select></label>{numberField('Peso (kg)','weight_kg','0.01')}{numberField('Durabilidade','durability_max')}{numberField('Absorção','absorption')}</div><div className="grid sm:grid-cols-4 gap-3">{textField('Atributo exigido','requirement_attribute')}{numberField('Mínimo','requirement_attribute_min')}{textField('Habilidade exigida','requirement_skill')}{numberField('Mínimo','requirement_skill_min')}</div><div className="grid sm:grid-cols-3 gap-3">{numberField('Penalidade Evasão','evasion_penalty')}{numberField('Penalidade Movimento','movement_penalty')}{numberField('Ordem','sort_order')}</div></>}
    {editor.kind === 'shields' && <><div className="grid sm:grid-cols-4 gap-3">{textField('Atributo de Bloqueio','block_attribute')}{numberField('Bônus de Bloqueio','block_bonus')}{numberField('Peso (kg)','weight_kg','0.01')}{numberField('Durabilidade','durability_max')}</div><div className="grid sm:grid-cols-4 gap-3">{textField('Atributo exigido','requirement_attribute')}{numberField('Mínimo','requirement_attribute_min')}{textField('Habilidade exigida','requirement_skill')}{numberField('Mínimo','requirement_skill_min')}</div><div className="grid sm:grid-cols-3 gap-3">{numberField('Penalidade Evasão','evasion_penalty')}{numberField('Penalidade Movimento','movement_penalty')}{numberField('Ordem','sort_order')}</div></>}
  </div></div></div>;
}
