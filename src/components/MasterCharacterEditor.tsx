import { useMemo } from 'react';
import {
  Backpack,
  BookOpen,
  Droplets,
  Heart,
  Package,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
  X,
} from 'lucide-react';
import type { ArmorPublic, Character, ItemCatalogPublic, ShieldPublic, WeaponPublic } from '@/lib/supabase';
import { ATTRIBUTE_GROUPS, GENDER_OPTIONS, RACES, SKILL_GROUPS } from '@/components/CharacterCreation';
import { durabilityLabel, formatAmount, formatDuration, freshnessLabel } from '@/lib/items';

type EditorSection = 'summary' | 'attributes' | 'skills' | 'inventory' | 'conditions' | 'identity' | 'journey';

type Props = {
  selected: Character;
  draft: Character;
  setDraft: (character: Character) => void;
  editing: boolean;
  setEditing: (value: boolean) => void;
  saving: boolean;
  onSave: () => void;
  onDeleteCharacter: () => void;
  onClose: () => void;
  editorSection: EditorSection;
  setEditorSection: (section: EditorSection) => void;
  relations: Record<string, any[]>;
  classOptions: string[];
  specializationOptions: string[];
  itemCatalog: ItemCatalogPublic[];
  itemChoice: string;
  setItemChoice: (value: string) => void;
  itemGroups: Array<{ category: string; items: ItemCatalogPublic[] }>;
  weaponCatalog: WeaponPublic[];
  weaponChoice: string;
  setWeaponChoice: (value: string) => void;
  armorCatalog: ArmorPublic[];
  armorChoice: string;
  setArmorChoice: (value: string) => void;
  shieldCatalog: ShieldPublic[];
  shieldChoice: string;
  setShieldChoice: (value: string) => void;
  addRelated: (table: string) => void;
  editRelated: (table: string, row: any) => void;
  deleteRelated: (table: string, id: string) => void;
  addCatalogItem: () => void;
  addWeapon: () => void;
  addArmor: () => void;
  addShield: () => void;
  updateAttr: (key: string, value: number) => void;
  updateSkill: (key: string, value: number) => void;
};

const input = 'trilha-ui-field w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold';
const btn = 'trilha-ui-button inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm disabled:opacity-40';
const card = 'trilha-master-card rounded-xl border border-gold-dim bg-shadow/35 p-4';
const stage = (n: number) => n <= 4 ? 'Aprendiz' : n <= 8 ? 'Competente' : n <= 12 ? 'Experiente' : n <= 16 ? 'Especialista' : 'Mestre';
const cv = (c: Character, key: string) => (c.attributes?.[key] ?? 0) + (c.racial_attribute_bonus?.[key] ?? 0);
const cs = (c: Character, key: string) => (c.skills?.[key] ?? 0) + (c.lineage_skill_bonuses?.[key] ?? 0);
const maxHp = (c: Character) => 15 + cv(c, 'Vigor') * 5 + (c.level - 1) * 2;
const maxMp = (c: Character) => {
  const mental = Math.max(...['Inteligência', 'Raciocínio', 'Sabedoria', 'Percepção'].map((k) => cv(c, k)));
  const mystical = Math.max(...['Elementalismo', 'Arcanismo', 'Ritualismo', 'Manipulação Arcana', 'Teologia', 'Espiritualismo'].map((k) => cs(c, k)));
  return mystical > 0 ? 5 + mental * 2 + mystical * 2 + c.level : 0;
};
const maxHunger = (c: Character) => Math.max(1, 9 - cv(c, 'Vigor'));

const identityFields: Array<{ key: keyof Character; label: string; multiline?: boolean }> = [
  { key: 'name', label: 'Nome' },
  { key: 'nickname', label: 'Apelido' },
  { key: 'height', label: 'Altura' },
  { key: 'weight', label: 'Peso corporal' },
  { key: 'appearance', label: 'Aparência', multiline: true },
  { key: 'distinctive_marks', label: 'Marcas distintivas', multiline: true },
  { key: 'origin', label: 'Origem' },
  { key: 'previous_occupation', label: 'Ocupação anterior' },
  { key: 'personality', label: 'Personalidade', multiline: true },
  { key: 'ideals', label: 'Ideais / Convicções', multiline: true },
  { key: 'motivation', label: 'Motivação', multiline: true },
  { key: 'important_bond', label: 'Vínculo importante', multiline: true },
  { key: 'brief_history', label: 'História breve', multiline: true },
  { key: 'additional_characteristics', label: 'Características adicionais', multiline: true },
];

const sectionDefs: Array<[EditorSection, string, typeof Heart]> = [
  ['summary', 'Resumo', Heart],
  ['attributes', 'Atributos', Sparkles],
  ['skills', 'Habilidades', BookOpen],
  ['inventory', 'Inventário', Package],
  ['conditions', 'Condições & efeitos', Utensils],
  ['identity', 'Identidade', UserRound],
  ['journey', 'Jornada', Backpack],
];

export default function MasterCharacterEditor(props: Props) {
  const {
    selected,
    draft,
    setDraft,
    editing,
    setEditing,
    saving,
    onSave,
    onDeleteCharacter,
    onClose,
    editorSection,
    setEditorSection,
    relations,
    classOptions,
    specializationOptions,
    itemCatalog,
    itemChoice,
    setItemChoice,
    itemGroups,
    weaponCatalog,
    weaponChoice,
    setWeaponChoice,
    armorCatalog,
    armorChoice,
    setArmorChoice,
    shieldCatalog,
    shieldChoice,
    setShieldChoice,
    addRelated,
    editRelated,
    deleteRelated,
    addCatalogItem,
    addWeapon,
    addArmor,
    addShield,
    updateAttr,
    updateSkill,
  } = props;

  const resourceMax = {
    current_hp: maxHp(draft),
    current_mp: maxMp(draft),
    current_hunger: maxHunger(draft),
    current_thirst: 6,
  } as const;

  const setResource = (key: keyof typeof resourceMax, value: number) => {
    const capped = Math.max(0, Math.min(resourceMax[key], Math.round(value)));
    setEditing(true);
    setDraft({ ...draft, [key]: capped });
  };

  const groupedInventory = useMemo(() => {
    const groups = new Map<string, Map<string, any[]>>();
    const commonMap = new Map(itemCatalog.map((i) => [i.id, i]));
    const weapons = new Map(weaponCatalog.map((i) => [i.id, i]));
    const armors = new Map(armorCatalog.map((i) => [i.id, i]));

    for (const row of relations.character_items || []) {
      let main = row.properties?.item_class || 'Itens comuns';
      let sub = row.custom_subcategory || row.properties?.catalog_category || 'Itens variados';
      if (row.weapon_id) {
        main = 'Armas';
        sub = weapons.get(row.weapon_id)?.family || 'Armas';
      } else if (row.armor_id) {
        main = 'Armaduras';
        sub = armors.get(row.armor_id)?.category || 'Armaduras';
      } else if (row.shield_id) {
        main = 'Escudos';
        sub = 'Escudos';
      } else if (row.catalog_item_id) {
        main = 'Itens comuns';
        sub = commonMap.get(row.catalog_item_id)?.category || sub;
      }
      if (!groups.has(main)) groups.set(main, new Map());
      const children = groups.get(main)!;
      if (!children.has(sub)) children.set(sub, []);
      children.get(sub)!.push(row);
    }

    const order = ['Armas', 'Armaduras', 'Escudos', 'Itens comuns'];
    return [...groups.entries()]
      .sort(([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)) || a.localeCompare(b, 'pt-BR'))
      .map(([main, children]) => ({
        main,
        children: [...children.entries()]
          .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
          .map(([sub, rows]) => ({ sub, rows: rows.sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR')) })),
      }));
  }, [relations.character_items, itemCatalog, weaponCatalog, armorCatalog, shieldCatalog]);

  const relationBox = (table: string, title: string) => {
    const rows = relations[table] || [];
    return (
      <div className={card}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <b className="text-gold-bright">{title}</b>
          <button className={btn} onClick={() => addRelated(table)}><Plus className="w-4 h-4" />Adicionar</button>
        </div>
        <div className="space-y-2">
          {rows.length === 0 ? <p className="text-xs text-parchment-dim">Nenhum registro.</p> : rows.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-gold-dim/60 p-3 flex justify-between gap-3">
              <div className="min-w-0">
                <b className="text-sm">{r.name || r.condition || r.faction_name || r.group_or_place || r.objective || r.title || 'Registro'}</b>
                <p className="text-xs text-parchment-dim whitespace-pre-wrap">{r.description || r.notes || r.content || r.duration || r.type || '—'}{table === 'character_effects' && r.is_permanent === false && r.remaining_minutes != null ? ` · ${formatDuration(Number(r.remaining_minutes))} restantes` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="trilha-icon-button" title="Editar" onClick={() => editRelated(table, r)}><Pencil className="w-4 h-4" /></button>
                <button className="trilha-icon-button is-danger" title="Remover" onClick={() => deleteRelated(table, r.id)}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto">
      <div className="trilha-master-editor min-h-screen bg-gradient-fantasy text-parchment">
        <header className="sticky top-0 z-30 border-b border-gold-dim bg-stone/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-gold/60 bg-gold/10 px-2 py-1 text-[10px] uppercase tracking-[.18em] text-gold">Modo Mestre</span>
                {editing && <span className="text-xs text-amber-200">Alterações não salvas</span>}
              </div>
              <h2 className="font-display text-2xl text-gold-bright mt-1">{draft.name}</h2>
              <p className="text-xs text-parchment-dim">Nível {draft.level} · {stage(draft.level)} · {draft.class_name || 'Sem classe'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!editing ? (
                <button className={`${btn} is-primary`} onClick={() => setEditing(true)}><Pencil className="w-4 h-4" />Editar ficha</button>
              ) : (
                <>
                  <button className={`${btn} is-quiet`} onClick={() => { setDraft(structuredClone(selected)); setEditing(false); }}><X className="w-4 h-4" />Cancelar</button>
                  <button className={`${btn} is-primary`} disabled={saving} onClick={onSave}><Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar alterações'}</button>
                </>
              )}
              <button className={`${btn} is-danger`} onClick={onDeleteCharacter}><Trash2 className="w-4 h-4" />Excluir</button>
              <button className={`${btn} is-quiet`} onClick={onClose}><X className="w-4 h-4" />Voltar à ficha</button>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 pb-3 overflow-x-auto">
            <nav className="trilha-master-section-nav flex gap-2 min-w-max">
              {sectionDefs.map(([key, label, Icon]) => (
                <button key={key} onClick={() => setEditorSection(key)} className={`${btn} trilha-master-section-button ${editorSection === key ? 'is-active' : ''}`}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
          {editorSection === 'summary' && (
            <div className="space-y-5">
              <section>
                <div className="mb-3">
                  <h3 className="font-display text-xl text-gold-bright">Resumo rápido</h3>
                  <p className="text-xs text-parchment-dim">Os botões +/− já colocam a ficha em modo de edição. Salve no topo quando terminar.</p>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {([
                    ['current_hp', 'PV', Heart, resourceMax.current_hp],
                    ['current_mp', 'PM', Sparkles, resourceMax.current_mp],
                    ['current_hunger', 'Fome', Utensils, resourceMax.current_hunger],
                    ['current_thirst', 'Sede', Droplets, resourceMax.current_thirst],
                  ] as const).map(([key, label, Icon, maximum]) => {
                    const current = Number(draft[key] ?? maximum);
                    return (
                      <div key={key} className={card}>
                        <div className="flex items-center justify-between gap-2"><span className="text-xs uppercase tracking-[.15em] text-gold"><Icon className="w-4 h-4 inline mr-1" />{label}</span><b className="text-lg text-gold-bright">{current} / {maximum}</b></div>
                        <div className="grid grid-cols-[auto_1fr_auto] gap-2 mt-3">
                          <button className={btn} onClick={() => setResource(key, current - 1)}>−</button>
                          <input type="number" min={0} max={maximum} className={`${input} text-center`} value={current} onChange={(e) => setResource(key, Number(e.target.value) || 0)} />
                          <button className={btn} onClick={() => setResource(key, current + 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={`${card} grid md:grid-cols-3 xl:grid-cols-6 gap-3`}>
                <label className="text-xs text-gold">Classe{editing ? <select className={`${input} mt-1`} value={draft.class_name || ''} onChange={(e) => setDraft({ ...draft, class_name: e.target.value || null })}><option value="">— Sem classe —</option>{classOptions.map((x) => <option key={x} value={x}>{x}</option>)}</select> : <div className="text-sm text-parchment mt-1">{draft.class_name || '—'}</div>}</label>
                <label className="text-xs text-gold">Especialização{editing ? <select className={`${input} mt-1`} value={draft.specialization || ''} onChange={(e) => setDraft({ ...draft, specialization: e.target.value || null })}><option value="">— Sem especialização —</option>{specializationOptions.map((x) => <option key={x} value={x}>{x}</option>)}</select> : <div className="text-sm text-parchment mt-1">{draft.specialization || '—'}</div>}</label>
                <label className="text-xs text-gold">Nível{editing ? <input type="number" min={1} max={20} className={`${input} mt-1`} value={draft.level} onChange={(e) => setDraft({ ...draft, level: Math.max(1, Math.min(20, Number(e.target.value) || 1)) })} /> : <div className="text-sm text-parchment mt-1">{draft.level} · {stage(draft.level)}</div>}</label>
                <label className="text-xs text-gold">Status{editing ? <select className={`${input} mt-1`} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Character['status'] })}><option value="vivo">Vivo</option><option value="morto">Morto</option><option value="desaparecido">Desaparecido</option></select> : <div className="text-sm text-parchment mt-1 capitalize">{draft.status}</div>}</label>
                <label className="text-xs text-gold">Óbolos{editing ? <input type="number" min={0} className={`${input} mt-1`} value={draft.currency_obolos ?? 0} onChange={(e) => setDraft({ ...draft, currency_obolos: Number(e.target.value) || 0 })} /> : <div className="text-sm text-parchment mt-1">{draft.currency_obolos ?? 0}</div>}</label>
                <label className="text-xs text-gold">Dracmas / Estaters{editing ? <div className="grid grid-cols-2 gap-1 mt-1"><input type="number" min={0} className={input} value={draft.currency_dracmas ?? 0} onChange={(e) => setDraft({ ...draft, currency_dracmas: Number(e.target.value) || 0 })} /><input type="number" min={0} className={input} value={draft.currency_estaters ?? 0} onChange={(e) => setDraft({ ...draft, currency_estaters: Number(e.target.value) || 0 })} /></div> : <div className="text-sm text-parchment mt-1">{draft.currency_dracmas ?? 0} / {draft.currency_estaters ?? 0}</div>}</label>
              </section>

              <section className="grid lg:grid-cols-2 gap-4">
                <button onClick={() => setEditorSection('conditions')} className={`${card} text-left hover:border-gold transition-colors`}>
                  <b className="text-gold-bright">Condições & efeitos</b>
                  <p className="text-sm mt-2">{(relations.character_conditions || []).length} condição(ões) · {(relations.character_effects || []).length} efeito(s)</p>
                  <p className="text-xs text-parchment-dim mt-1">Abrir para adicionar, editar ou encerrar estados temporários.</p>
                </button>
                <button onClick={() => setEditorSection('inventory')} className={`${card} text-left hover:border-gold transition-colors`}>
                  <b className="text-gold-bright">Inventário</b>
                  <p className="text-sm mt-2">{(relations.character_items || []).length} registro(s) no inventário</p>
                  <p className="text-xs text-parchment-dim mt-1">Adicionar pelo catálogo, editar durabilidade, quantidade, peso personalizado e validade.</p>
                </button>
              </section>
            </div>
          )}

          {editorSection === 'attributes' && (
            <section>
              <h3 className="font-display text-xl text-gold-bright mb-1">Atributos</h3>
              <p className="text-xs text-parchment-dim mb-4">Bônus raciais continuam separados do valor-base.</p>
              <div className="grid md:grid-cols-3 gap-4">{ATTRIBUTE_GROUPS.map((g) => <div key={g.name} className={card}><b className="text-gold-bright">{g.name}</b>{g.attributes.map((a) => <div key={a.name} className="flex justify-between items-center mt-3 gap-3"><span>{a.name}</span>{editing ? <input type="number" min={0} max={5} className="w-20 bg-shadow border border-gold-dim rounded px-2 py-1 text-center" value={draft.attributes[a.name] ?? 0} onChange={(e) => updateAttr(a.name, Number(e.target.value))} /> : <b className="text-gold">{cv(draft, a.name)}{(draft.racial_attribute_bonus?.[a.name] ?? 0) > 0 && <small className="ml-1 text-parchment-dim">({draft.attributes[a.name] ?? 0} +1 racial)</small>}</b>}</div>)}</div>)}</div>
            </section>
          )}

          {editorSection === 'skills' && (
            <section>
              <h3 className="font-display text-xl text-gold-bright mb-1">Habilidades</h3>
              <p className="text-xs text-parchment-dim mb-4">A ficha mostra o valor total, mas a edição altera apenas o valor-base.</p>
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{SKILL_GROUPS.map((g) => <div key={g.name} className={card}><b className="text-gold-bright">{g.name}</b>{g.skills.map((sk) => <div key={sk.name} className="flex justify-between items-center mt-2 gap-3 text-sm"><span>{sk.name}</span>{editing ? <input type="number" min={0} max={5} className="w-16 bg-shadow border border-gold-dim rounded px-2 py-1 text-center" value={draft.skills[sk.name] ?? 0} onChange={(e) => updateSkill(sk.name, Number(e.target.value))} /> : <b className="text-gold">{cs(draft, sk.name)}{(draft.lineage_skill_bonuses?.[sk.name] ?? 0) > 0 && <small className="ml-1 text-parchment-dim">({draft.skills[sk.name] ?? 0} +1 linhagem)</small>}</b>}</div>)}</div>)}</div>
            </section>
          )}

          {editorSection === 'inventory' && (
            <section className="space-y-4">
              <div>
                <h3 className="font-display text-xl text-gold-bright">Inventário</h3>
                <p className="text-xs text-parchment-dim">Organizado pelas mesmas classes e subclasses do inventário do jogador.</p>
              </div>
              <div className={card}>
                <div className="flex items-center justify-between mb-3 gap-3"><b className="text-gold-bright">Adicionar ao personagem</b><button className={btn} onClick={() => addRelated('character_items')}><Plus className="w-4 h-4" />Item personalizado</button></div>
                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="flex gap-2"><select className={`${input} min-w-0`} value={itemChoice} onChange={(e) => setItemChoice(e.target.value)}><option value="">Item comum do catálogo...</option>{itemGroups.map((g) => <optgroup key={g.category} label={g.category}>{g.items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.default_amount ? ` · ${formatAmount(i.default_amount, i.unit)}` : ''}</option>)}</optgroup>)}</select><button disabled={!itemChoice} onClick={addCatalogItem} className={`${btn} shrink-0`}><Plus className="w-4 h-4" />Adicionar</button></div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <div className="flex gap-1"><select className={`${input} min-w-0`} value={weaponChoice} onChange={(e) => setWeaponChoice(e.target.value)}><option value="">Arma...</option>{weaponCatalog.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select><button disabled={!weaponChoice} onClick={addWeapon} className={btn}>+</button></div>
                    <div className="flex gap-1"><select className={`${input} min-w-0`} value={armorChoice} onChange={(e) => setArmorChoice(e.target.value)}><option value="">Armadura...</option>{armorCatalog.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><button disabled={!armorChoice} onClick={addArmor} className={btn}>+</button></div>
                    <div className="flex gap-1"><select className={`${input} min-w-0`} value={shieldChoice} onChange={(e) => setShieldChoice(e.target.value)}><option value="">Escudo...</option>{shieldCatalog.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={!shieldChoice} onClick={addShield} className={btn}>+</button></div>
                  </div>
                </div>
              </div>

              {groupedInventory.length === 0 ? <div className={card}><p className="text-parchment-dim">Inventário vazio.</p></div> : groupedInventory.map((group) => (
                <div key={group.main} className={card}>
                  <h4 className="font-display text-lg text-gold-bright mb-3">{group.main}</h4>
                  <div className="space-y-4">{group.children.map((sub) => (
                    <div key={sub.sub}>
                      <p className="text-xs uppercase tracking-[.16em] text-gold/80 mb-2">{sub.sub}</p>
                      <div className="space-y-2">{sub.rows.map((r: any) => (
                        <div key={r.id} className="rounded-lg border border-gold-dim/60 p-3 flex justify-between gap-3">
                          <div className="min-w-0"><b className="text-sm">{r.name}</b><p className="text-xs text-parchment-dim">{r.description || '—'}{r.amount != null && r.unit ? ` · ${formatAmount(Number(r.amount), r.unit)}` : ` · ${r.quantity ?? 1} un.`}{r.durability_max ? ` · ${durabilityLabel(r)} ${r.durability_current}/${r.durability_max}` : ''}{r.freshness_minutes_remaining != null ? ` · ${freshnessLabel(Number(r.freshness_minutes_remaining), Number(r.properties?.shelf_life_minutes || 0) || undefined)} (${formatDuration(Number(r.freshness_minutes_remaining))})` : ''}</p></div>
                          <div className="flex gap-2 shrink-0"><button className="trilha-icon-button" title="Editar" onClick={() => editRelated('character_items', r)}><Pencil className="w-4 h-4" /></button><button className="trilha-icon-button is-danger" title="Remover" onClick={() => deleteRelated('character_items', r.id)}><Trash2 className="w-4 h-4" /></button></div>
                        </div>
                      ))}</div>
                    </div>
                  ))}</div>
                </div>
              ))}
            </section>
          )}

          {editorSection === 'conditions' && <section className="grid lg:grid-cols-2 gap-4">{relationBox('character_conditions', 'Condições')}{relationBox('character_effects', 'Efeitos temporários')}</section>}

          {editorSection === 'identity' && (
            <section className="space-y-4">
              <div><h3 className="font-display text-xl text-gold-bright">Identidade & história</h3><p className="text-xs text-parchment-dim">Dados menos usados ficam fora do Resumo para não poluir a edição rápida.</p></div>
              <div className={`${card} grid md:grid-cols-3 gap-3`}>
                <label className="text-xs text-gold">Gênero/Pronomes{editing ? <select className={`${input} mt-1`} value={draft.gender || ''} onChange={(e) => setDraft({ ...draft, gender: e.target.value || null })}><option value="">Não informado</option>{GENDER_OPTIONS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}</select> : <div className="text-sm text-parchment mt-1">{GENDER_OPTIONS.find((g) => g.id === draft.gender)?.label || draft.gender || '—'}</div>}</label>
                <label className="text-xs text-gold">Raça{editing ? <select className={`${input} mt-1`} value={draft.race} onChange={(e) => { const race = e.target.value; setDraft({ ...draft, race, lineage: RACES.find((r) => r.name === race)?.lineages[0]?.name || '' }); }}>{RACES.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}</select> : <div className="text-sm text-parchment mt-1">{draft.race || '—'}</div>}</label>
                <label className="text-xs text-gold">Linhagem{editing ? <select className={`${input} mt-1`} value={draft.lineage} onChange={(e) => setDraft({ ...draft, lineage: e.target.value })}>{(RACES.find((r) => r.name === draft.race)?.lineages || []).map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}</select> : <div className="text-sm text-parchment mt-1">{draft.lineage || '—'}</div>}</label>
                <label className="text-xs text-gold">Idade{editing ? <input type="number" className={`${input} mt-1`} value={draft.age} onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) || 0 })} /> : <div className="text-sm text-parchment mt-1">{draft.age}</div>}</label>
                {identityFields.map((field) => <label key={String(field.key)} className={`text-xs text-gold ${field.multiline ? 'md:col-span-2' : ''}`}>{field.label}{editing ? (field.multiline ? <textarea rows={3} className={`${input} mt-1`} value={String(draft[field.key] ?? '')} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} /> : <input className={`${input} mt-1`} value={String(draft[field.key] ?? '')} onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })} />) : <div className="text-sm text-parchment mt-1 whitespace-pre-wrap">{String(draft[field.key] || '—')}</div>}</label>)}
              </div>
            </section>
          )}

          {editorSection === 'journey' && (
            <section className="space-y-4">
              <div><h3 className="font-display text-xl text-gold-bright">Jornada & registros</h3><p className="text-xs text-parchment-dim">Informações narrativas e acompanhamento de campanha.</p></div>
              <div className="grid lg:grid-cols-2 gap-4">
                {relationBox('character_contacts', 'Aliados & contatos')}
                {relationBox('character_factions', 'Facções')}
                {relationBox('character_reputations', 'Reputações')}
                {relationBox('character_objectives', 'Objetivos')}
                {relationBox('character_events', 'Acontecimentos')}
                {relationBox('character_diary', 'Diário')}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
