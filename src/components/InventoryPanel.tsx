import { useCallback, useEffect, useMemo, useState } from 'react';
import { Backpack, ChevronDown, ChevronRight, Scale, TriangleAlert } from 'lucide-react';
import { supabase, type ArmorPublic, type Character, type ItemCatalogPublic, type ShieldPublic, type WeaponPublic } from '@/lib/supabase';
import { durabilityLabel, formatAmount, formatDuration, freshnessLabel } from '@/lib/items';

export type InventoryItem = {
  id: string; name: string; type: string; quantity: number; equipped: boolean; description: string | null;
  properties: Record<string, unknown>; weapon_id?: string | null; armor_id?: string | null; shield_id?: string | null;
  equip_slot?: string | null; catalog_item_id?: string | null; unit?: string | null; amount?: number | null; capacity_ml?: number | null;
  durability_current?: number | null; durability_max?: number | null; freshness_minutes_remaining?: number | null; shelf_life_multiplier?: number | null;
  custom_weight_kg?: number | null; custom_subcategory?: string | null; carry_slot?: 'main' | 'auxiliary' | null;
};

type Props = {
  playerId: string;
  character: Character;
  items: InventoryItem[];
  onConsume: (item: InventoryItem) => Promise<void> | void;
  onSetItemSlot: (item: InventoryItem, slot: string | null) => Promise<void> | void;
  onRefresh: () => Promise<void> | void;
};

type Meta = { className: string; subclass: string; weight: number; missingWeight: boolean; carrySlotKind?: 'main' | 'auxiliary' | null; carryBonusKg?: number; common?: ItemCatalogPublic; weapon?: WeaponPublic; armor?: ArmorPublic; shield?: ShieldPublic };
const classOrder = ['Armas', 'Armaduras', 'Escudos', 'Itens comuns'];
const v = (c: Character, key: string) => (c.attributes?.[key] ?? 0) + (c.racial_attribute_bonus?.[key] ?? 0);
const kg = (n: number) => `${n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 1 : 0, maximumFractionDigits: 2 })} kg`;

export default function InventoryPanel({ playerId, character, items, onConsume, onSetItemSlot, onRefresh }: Props) {
  const [common, setCommon] = useState<ItemCatalogPublic[]>([]);
  const [weapons, setWeapons] = useState<WeaponPublic[]>([]);
  const [armors, setArmors] = useState<ArmorPublic[]>([]);
  const [shields, setShields] = useState<ShieldPublic[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({ 'Armas': true, 'Armaduras': true, 'Escudos': true, 'Itens comuns': true });

  const loadCatalog = useCallback(async () => {
    const [c, w, a, s] = await Promise.all([
      supabase.from('item_catalog_public').select('*'), supabase.from('weapon_catalog_public').select('*'),
      supabase.from('armor_catalog_public').select('*'), supabase.from('shield_catalog_public').select('*'),
    ]);
    setCommon((c.data || []) as ItemCatalogPublic[]); setWeapons((w.data || []) as WeaponPublic[]); setArmors((a.data || []) as ArmorPublic[]); setShields((s.data || []) as ShieldPublic[]);
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const commonMap = useMemo(() => new Map(common.map(x => [x.id, x])), [common]);
  const weaponMap = useMemo(() => new Map(weapons.map(x => [x.id, x])), [weapons]);
  const armorMap = useMemo(() => new Map(armors.map(x => [x.id, x])), [armors]);
  const shieldMap = useMemo(() => new Map(shields.map(x => [x.id, x])), [shields]);

  const metaFor = useCallback((item: InventoryItem): Meta => {
    if (item.weapon_id) {
      const x = weaponMap.get(item.weapon_id); const snap = item.properties?.weight_kg_snapshot; const base = x?.weight_kg ?? (snap == null ? item.custom_weight_kg : Number(snap));
      return { className: 'Armas', subclass: x?.family || String(item.properties?.catalog_category || 'Armas'), weight: base == null ? 0 : Number(base) * item.quantity, missingWeight: base == null, weapon: x };
    }
    if (item.armor_id) {
      const x = armorMap.get(item.armor_id); const snap = item.properties?.weight_kg_snapshot; const base = x?.weight_kg ?? (snap == null ? item.custom_weight_kg : Number(snap));
      return { className: 'Armaduras', subclass: x?.category || String(item.properties?.catalog_category || 'Armaduras'), weight: base == null ? 0 : Number(base) * item.quantity, missingWeight: base == null, armor: x };
    }
    if (item.shield_id) {
      const x = shieldMap.get(item.shield_id); const snap = item.properties?.weight_kg_snapshot; const base = x?.weight_kg ?? (snap == null ? item.custom_weight_kg : Number(snap));
      return { className: 'Escudos', subclass: 'Escudos', weight: base == null ? 0 : Number(base) * item.quantity, missingWeight: base == null, shield: x };
    }
    if (item.catalog_item_id) {
      const x = commonMap.get(item.catalog_item_id);
      const bodyWeightless = x?.body_weightless ?? Boolean(item.properties?.body_weightless_snapshot);
      const snap = item.properties?.weight_kg_snapshot;
      const base = bodyWeightless ? 0 : (x?.weight_kg ?? (snap == null ? item.custom_weight_kg : Number(snap)));
      let weight = base == null ? 0 : Number(base) * item.quantity;
      const unit = x?.unit || item.unit || '';
      const defaultAmount = Number(x?.default_amount || item.properties?.default_amount_snapshot || 0);
      if (!bodyWeightless && item.amount != null && ['g', 'ml'].includes(unit) && defaultAmount > 0 && base != null) weight = Number(base) * (Number(item.amount) / defaultAmount);
      const carrySlotKind = (x?.carry_slot_kind || item.properties?.carry_slot_kind_snapshot || null) as 'main' | 'auxiliary' | null;
      const carryBonusKg = Number(x?.carry_bonus_kg ?? item.properties?.carry_bonus_kg_snapshot ?? 0);
      return { className: 'Itens comuns', subclass: x?.category || String(item.properties?.catalog_category || 'Itens variados'), weight, missingWeight: !bodyWeightless && base == null, carrySlotKind, carryBonusKg, common: x };
    }
    const customWeight = item.custom_weight_kg;
    return { className: String(item.properties?.item_class || 'Itens comuns'), subclass: item.custom_subcategory || String(item.properties?.catalog_category || 'Itens variados'), weight: customWeight == null ? 0 : Number(customWeight) * item.quantity, missingWeight: customWeight == null, carrySlotKind: (item.properties?.carry_slot_kind_snapshot || null) as 'main' | 'auxiliary' | null, carryBonusKg: Number(item.properties?.carry_bonus_kg_snapshot || 0) };
  }, [weaponMap, armorMap, shieldMap, commonMap]);

  const rows = useMemo(() => items.map(item => ({ item, meta: metaFor(item) })), [items, metaFor]);
  const totalWeight = rows.reduce((sum, x) => sum + x.meta.weight, 0);
  const naturalCapacity = 10 + v(character, 'Força') * 5 + v(character, 'Vigor') * 2.5;
  const carryBonus = rows.reduce((sum, x) => x.item.carry_slot ? sum + Number(x.meta.carryBonusKg || 0) : sum, 0);
  const capacity = naturalCapacity + carryBonus;
  const pct = capacity > 0 ? Math.min(100, totalWeight / capacity * 100) : 100;
  const overloaded = totalWeight > capacity;
  const missingWeightCount = rows.filter(x => x.meta.missingWeight).length;

  const grouped = useMemo(() => classOrder.map(className => {
    const classRows = rows.filter(x => x.meta.className === className);
    const subclasses = [...new Set(classRows.map(x => x.meta.subclass))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return { className, rows: classRows, subclasses: subclasses.map(subclass => ({ subclass, rows: classRows.filter(x => x.meta.subclass === subclass).sort((a, b) => a.item.name.localeCompare(b.item.name, 'pt-BR')) })) };
  }).filter(x => x.rows.length), [rows]);

  const setCarry = async (item: InventoryItem, meta: Meta) => {
    if (!meta.carrySlotKind) return;
    const slot = item.carry_slot === meta.carrySlotKind ? null : meta.carrySlotKind;
    const { error } = await supabase.rpc('set_character_carry_slot', { p_player_id: playerId, p_character_id: character.id, p_item_id: item.id, p_slot: slot });
    if (error) alert(error.message); else await onRefresh();
  };

  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between items-end gap-3"><div><h3 className="font-display text-lg text-gold flex gap-2"><Backpack className="w-5 h-5"/>Inventário</h3><p className="text-xs text-parchment-dim mt-1">Organizado por classe e subclasse. Itens equipados também contam na carga.</p></div>{missingWeightCount > 0 && <span className="text-xs text-gold flex items-center gap-1"><TriangleAlert className="w-4 h-4"/>{missingWeightCount} item(ns) sem peso definido</span>}</div>
    <section className="rounded-xl border border-gold-dim bg-gradient-card p-4"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-xs uppercase tracking-[.16em] text-gold/70">Carga</p><div className={`font-display text-2xl mt-1 ${overloaded ? 'text-red-300' : 'text-gold-bright'}`}>{kg(totalWeight)} / {kg(capacity)}</div><p className="text-xs text-parchment-dim mt-1">Natural {kg(naturalCapacity)}{carryBonus ? ` · Compartimentos +${kg(carryBonus)}` : ''}</p></div><Scale className={`w-7 h-7 ${overloaded ? 'text-red-300' : 'text-gold'}`}/></div><div className="mt-3 h-2 rounded-full bg-shadow overflow-hidden"><div className={`h-full ${overloaded ? 'bg-red-400' : 'bg-gold'}`} style={{ width: `${pct}%` }}/></div>{overloaded && <p className="text-xs text-red-300 mt-2">Sobrecarregado: a carga atual ultrapassa o limite do personagem. As penalidades mecânicas ainda serão definidas.</p>}</section>
    {grouped.length === 0 ? <p className="text-parchment-dim/60 text-sm py-4">Nenhum item no inventário.</p> : grouped.map(group => {
      const classWeight = group.rows.reduce((s, x) => s + x.meta.weight, 0); const isOpen = open[group.className] !== false;
      return <section key={group.className} className="rounded-xl border border-gold-dim bg-gradient-card overflow-hidden"><button className="w-full px-4 py-3 flex items-center justify-between text-left bg-shadow/35" onClick={() => setOpen(o => ({ ...o, [group.className]: !isOpen }))}><div className="flex items-center gap-2">{isOpen ? <ChevronDown className="w-4 h-4 text-gold"/> : <ChevronRight className="w-4 h-4 text-gold"/>}<h4 className="font-display text-lg text-gold-bright">{group.className}</h4><span className="text-xs text-parchment-dim">({group.rows.length})</span></div><span className="text-xs text-gold">{kg(classWeight)}</span></button>{isOpen && <div className="p-3 space-y-4">{group.subclasses.map(sub => <div key={sub.subclass}><div className="flex justify-between border-b border-gold-dim/50 pb-2 mb-2"><b className="text-sm text-gold">{sub.subclass}</b><span className="text-[10px] text-parchment-dim">{sub.rows.length} item(ns)</span></div><div className="grid sm:grid-cols-2 gap-2">{sub.rows.map(({ item, meta }) => <ItemCard key={item.id} item={item} meta={meta} onConsume={onConsume} onSetItemSlot={onSetItemSlot} onSetCarry={() => setCarry(item, meta)}/>)}</div></div>)}</div>}</section>;
    })}
  </div>;
}

function ItemCard({ item, meta, onConsume, onSetItemSlot, onSetCarry }: { item: InventoryItem; meta: Meta; onConsume: Props['onConsume']; onSetItemSlot: Props['onSetItemSlot']; onSetCarry: () => void }) {
  const durability = durabilityLabel(item); const shelf = Number(item.properties?.shelf_life_minutes || 0) || undefined; const freshness = freshnessLabel(item.freshness_minutes_remaining, shelf);
  const broken = item.durability_current === 0; const spoiled = item.freshness_minutes_remaining != null && item.freshness_minutes_remaining <= 0;
  const amount = formatAmount(item.amount, item.unit); const consumptionKind = meta.common?.consumption_kind || String(item.properties?.consumption_kind || '');
  const portion = Number(meta.common?.portion_amount || item.properties?.portion_amount || 0); const restore = Number(meta.common?.restore_points || item.properties?.restore_points || 1);
  const portions = portion > 0 && item.amount != null ? Math.floor(Number(item.amount) / portion) : 0;
  const legacyConsumable = Number(item.properties?.hunger_restore || 0) > 0 || Number(item.properties?.thirst_restore || 0) > 0;
  const consumable = !!consumptionKind || legacyConsumable; const canConsume = !spoiled && (legacyConsumable || portions > 0);
  const combatSlot = item.weapon_id ? 'weapon' : item.armor_id ? 'armor' : item.shield_id ? 'shield' : null;
  return <article className="border border-gold-dim/60 rounded-lg p-3 bg-shadow/30"><div className="flex justify-between gap-3"><div className="min-w-0"><b className="text-gold-bright">{item.name}</b><p className="text-xs text-parchment-dim">{item.quantity > 1 ? `×${item.quantity} · ` : ''}{amount || 'unidade'} · {meta.missingWeight ? '⚠ sem peso' : kg(meta.weight)}</p></div><div className="flex flex-wrap justify-end gap-1">{combatSlot && <button disabled={broken} onClick={() => onSetItemSlot(item, item.equip_slot === combatSlot ? null : combatSlot)} className={`text-[10px] border rounded px-2 py-1 disabled:opacity-30 ${item.equip_slot === combatSlot ? 'border-gold text-gold-bright' : 'border-gold-dim text-parchment-dim'}`}>{broken ? 'Quebrado' : item.equip_slot === combatSlot ? 'Desequipar' : 'Equipar'}</button>}{!combatSlot && <><button disabled={broken} onClick={() => onSetItemSlot(item, item.equip_slot === 'hand1' ? null : 'hand1')} className={`text-[10px] border rounded px-2 py-1 disabled:opacity-30 ${item.equip_slot === 'hand1' ? 'border-gold text-gold-bright' : 'border-gold-dim text-parchment-dim'}`}>Mão 1</button><button disabled={broken} onClick={() => onSetItemSlot(item, item.equip_slot === 'hand2' ? null : 'hand2')} className={`text-[10px] border rounded px-2 py-1 disabled:opacity-30 ${item.equip_slot === 'hand2' ? 'border-gold text-gold-bright' : 'border-gold-dim text-parchment-dim'}`}>Mão 2</button></>}{meta.carrySlotKind && <button onClick={onSetCarry} className={`text-[10px] border rounded px-2 py-1 ${item.carry_slot ? 'border-gold text-gold-bright' : 'border-gold-dim text-parchment-dim'}`}>{item.carry_slot ? (item.carry_slot === 'main' ? 'Principal' : 'Auxiliar') : (meta.carrySlotKind === 'main' ? 'Usar principal' : 'Usar auxiliar')}</button>}{consumable && <button disabled={!canConsume} onClick={() => onConsume(item)} className="text-[10px] border border-gold rounded px-2 py-1 text-gold-bright disabled:opacity-30">{spoiled ? 'Estragado' : portions === 0 && !legacyConsumable ? 'Sem porção' : 'Consumir'}</button>}</div></div>
    <div className="flex flex-wrap gap-2 mt-2 text-[10px]">{durability && <span className="border border-gold-dim rounded px-2 py-1">{durability} · {item.durability_current}/{item.durability_max}</span>}{freshness && <span className="border border-gold-dim rounded px-2 py-1">{freshness}{item.freshness_minutes_remaining != null && item.freshness_minutes_remaining > 0 ? ` · ${formatDuration(item.freshness_minutes_remaining)}` : ''}</span>}{meta.carryBonusKg ? <span className="border border-gold-dim rounded px-2 py-1">+{kg(Number(meta.carryBonusKg))} se ativo</span> : null}</div>
    {consumptionKind === 'food' && <p className="text-xs text-gold/80 mt-2">{portions} porção(ões) · {formatAmount(portion, item.unit)} → Fome +{restore}</p>}{consumptionKind === 'water' && <p className="text-xs text-gold/80 mt-2">{portions} porção(ões) · {formatAmount(portion, item.unit)} → Sede +{restore}</p>}
    {item.description && <p className="text-xs text-parchment-dim mt-2">{item.description}</p>}
  </article>;
}
