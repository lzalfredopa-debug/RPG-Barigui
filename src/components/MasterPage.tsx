import { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, Users, ScrollText, MessageSquare, Lightbulb, X, Trash2, Plus, RefreshCw, GitBranch, Sword, Shield, Clock, RotateCcw, Package } from 'lucide-react';
import { supabase, type Character, type Player, type Suggestion, type WeaponPublic, type ArmorPublic, type ShieldPublic, type ItemCatalogPublic, type TimeAdvanceSummary } from '@/lib/supabase';
import CharacterCreation from '@/components/CharacterCreation';
import AncestryAdmin from '@/components/AncestryAdmin';
import ClassTreeAdmin from '@/components/ClassTreeAdmin';
import WeaponCatalogAdmin from '@/components/WeaponCatalogAdmin';
import ProtectionCatalogAdmin from '@/components/ProtectionCatalogAdmin';
import PlayerPage from '@/components/PlayerPage';
import CatalogPage from '@/components/CatalogPage';
import MasterCharacterEditor from '@/components/MasterCharacterEditor';
import { formatDuration } from '@/lib/items';
type Props = {
    player: Player;
    onLogout: () => void;
};
type Tab = 'characters' | 'players' | 'messages' | 'suggestions' | 'races' | 'lineages' | 'classes' | 'catalog' | 'weapons' | 'protections';
type EditorSection = 'summary' | 'attributes' | 'skills' | 'inventory' | 'conditions' | 'identity' | 'journey';
type SuggestionAdmin = Suggestion & {
    status?: 'nova' | 'lida' | 'resolvida';
};
const stage = (n: number) => n <= 4 ? 'Aprendiz' : n <= 8 ? 'Competente' : n <= 12 ? 'Experiente' : n <= 16 ? 'Especialista' : 'Mestre';
const cv = (c: Character, key: string) => (c.attributes?.[key] ?? 0) + (c.racial_attribute_bonus?.[key] ?? 0);
const cs = (c: Character, key: string) => (c.skills?.[key] ?? 0) + (c.lineage_skill_bonuses?.[key] ?? 0);
const characterMaxHp = (c: Character) => 15 + cv(c, 'Vigor') * 5 + (c.level - 1) * 2;
const characterMaxMp = (c: Character) => { const mental = Math.max(...['Inteligência','Raciocínio','Sabedoria','Percepção'].map(k => cv(c,k))); const mystical = Math.max(...['Elementalismo','Arcanismo','Ritualismo','Manipulação Arcana','Teologia','Espiritualismo'].map(k => cs(c,k))); return mystical > 0 ? 5 + mental * 2 + mystical * 2 + c.level : 0; };
const characterHungerMax = (c: Character) => Math.max(1, 9 - cv(c, 'Vigor'));
const input = 'trilha-ui-field w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm focus:outline-none focus:border-gold';
const btn = 'trilha-ui-button inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gold-dim text-gold hover:border-gold text-sm';
const textKeys = ['name', 'nickname', 'height', 'weight', 'appearance', 'distinctive_marks', 'origin', 'previous_occupation', 'personality', 'ideals', 'motivation', 'important_bond', 'brief_history', 'additional_characteristics'] as const;
const parseEffectDuration = (raw: string | null) => { const value = (raw || '').trim().toLowerCase(); if (!value || value === 'permanente' || value === 'permanent')
    return { minutes: null as number | null, isPermanent: true }; const m = value.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(min|minuto|minutos|m|h|hora|horas|d|dia|dias)$/); if (!m)
    return null; const n = Number(m[1].replace(',', '.')); const unit = m[2]; const factor = unit.startsWith('d') ? 1440 : unit.startsWith('h') ? 60 : 1; return { minutes: Math.max(1, Math.round(n * factor)), isPermanent: false }; };
export default function MasterPage({ player, onLogout }: Props) {
    const [relations, setRelations] = useState<Record<string, any[]>>({});
    const [masterEditor, setMasterEditor] = useState(false);
    const [editorSection, setEditorSection] = useState<EditorSection>('summary');
    const [tab, setTab] = useState<Tab>('characters');
    const [players, setPlayers] = useState<Player[]>([]);
    const [characters, setCharacters] = useState<Character[]>([]);
    const [suggestions, setSuggestions] = useState<SuggestionAdmin[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [selected, setSelected] = useState<Character | null>(null);
    const [draft, setDraft] = useState<Character | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [messagePlayer, setMessagePlayer] = useState('');
    const [messageText, setMessageText] = useState('');
    const [creatingFor, setCreatingFor] = useState<Player | null>(null);
    const [weaponCatalog, setWeaponCatalog] = useState<WeaponPublic[]>([]);
    const [weaponChoice, setWeaponChoice] = useState('');
    const [armorCatalog, setArmorCatalog] = useState<ArmorPublic[]>([]);
    const [armorChoice, setArmorChoice] = useState('');
    const [shieldCatalog, setShieldCatalog] = useState<ShieldPublic[]>([]);
    const [shieldChoice, setShieldChoice] = useState('');
    const [itemCatalog, setItemCatalog] = useState<ItemCatalogPublic[]>([]);
    const [itemChoice, setItemChoice] = useState('');
    const [timeValue, setTimeValue] = useState('');
    const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
    const [advancingTime, setAdvancingTime] = useState(false);
    const [worldMinutes, setWorldMinutes] = useState(0);
    const load = useCallback(async () => { const [p, c, s, m, w, a, sh, it, clock] = await Promise.all([supabase.from('players').select('*').order('player_identifier'), supabase.from('characters').select('*').order('created_at'), supabase.from('suggestions').select('*').order('created_at', { ascending: false }), supabase.from('master_messages').select('*').order('created_at', { ascending: false }), supabase.from('weapon_catalog_public').select('*').order('family').order('name'), supabase.from('armor_catalog_public').select('*').order('category').order('name'), supabase.from('shield_catalog_public').select('*').order('name'), supabase.from('item_catalog_public').select('*').order('category_order').order('sort_order'), supabase.from('trilha_world_clock').select('elapsed_minutes').eq('id', 1).maybeSingle()]); setPlayers((p.data || []) as Player[]); setCharacters((c.data || []) as Character[]); setSuggestions((s.data || []) as SuggestionAdmin[]); setMessages(m.data || []); setWeaponCatalog((w.data || []) as WeaponPublic[]); setArmorCatalog((a.data || []) as ArmorPublic[]); setShieldCatalog((sh.data || []) as ShieldPublic[]); setItemCatalog((it.data || []) as ItemCatalogPublic[]); setWorldMinutes(Number(clock.data?.elapsed_minutes || 0)); }, []);
    useEffect(() => { load(); }, [load]);
    const playerMap = useMemo(() => Object.fromEntries(players.map(p => [p.id, p])), [players]);
    const classOptions = useMemo(() => Array.from(new Set(characters.map(c => c.class_name).filter(Boolean))) as string[], [characters]);
    const specializationOptions = useMemo(() => Array.from(new Set(characters.map(c => c.specialization).filter(Boolean))) as string[], [characters]);
    const itemGroups = useMemo(() => Array.from(new Set(itemCatalog.map(i => i.category))).map(category => ({ category, items: itemCatalog.filter(i => i.category === category) })), [itemCatalog]);
    const loadRelations = async (id: string) => { const tables = ['character_items', 'character_conditions', 'character_effects', 'character_contacts', 'character_factions', 'character_reputations', 'character_objectives', 'character_events', 'character_diary']; const rr = await Promise.all(tables.map(t => supabase.from(t).select('*').eq('character_id', id).order('created_at'))); setRelations(Object.fromEntries(tables.map((t, i) => [t, rr[i].data || []]))); };
    const openChar = (c: Character) => { setSelected(c); setDraft(structuredClone(c)); setEditing(false); setEditorSection('summary'); setMasterEditor(false); loadRelations(c.id); };
    const deleteCharacter = async () => { if (!selected)
        return; const owner = playerMap[selected.player_id]; const ok = confirm(`Excluir permanentemente ${selected.name}?\n\nJogador: ${owner?.player_name || owner?.alcunha || '—'}\nInventário, diário, condições e demais registros vinculados também serão excluídos. Esta ação não pode ser desfeita.`); if (!ok)
        return; const { data, error } = await supabase.from('characters').delete().eq('id', selected.id).select('id'); if (error) {
        alert(`Não foi possível excluir o personagem: ${error.message}`);
        return;
    } if (!data?.length) {
        alert('O Supabase não excluiu o personagem. Execute a migration de permissões de exclusão incluída nesta versão.');
        return;
    } setSelected(null); setDraft(null); setEditing(false); await load(); };
    const addRelated = async (table: string) => { if (!selected)
        return; if (table === 'character_items') {
        const name = prompt('Nome do item:');
        if (!name) return;
        const subcategory = prompt('Subclasse:', 'Itens variados') || 'Itens variados';
        const quantity = Math.max(1, Number(prompt('Quantidade:', '1')) || 1);
        const description = prompt('Descrição:') || null;
        const weightRaw = prompt('Peso unitário em kg (vazio = não definido):', '');
        if (weightRaw === null) return;
        const weight = weightRaw.trim() === '' ? null : Math.max(0, Number(weightRaw) || 0);
        const durabilityRaw = prompt('Durabilidade máxima (1–5; vazio = sem durabilidade):', '');
        if (durabilityRaw === null) return;
        const durability = durabilityRaw.trim() === '' ? null : Math.max(1, Math.min(5, Number(durabilityRaw) || 1));
        const { error } = await supabase.rpc('master_add_custom_character_item', { p_master_player_id: player.id, p_character_id: selected.id, p_name: name, p_subcategory: subcategory, p_quantity: quantity, p_description: description, p_weight_kg: weight, p_durability_max: durability });
        if (error) alert(error.message);
        await loadRelations(selected.id);
        return;
    } let row: any = { character_id: selected.id }; if (table === 'character_conditions') {
        const condition = prompt('Condição:');
        if (!condition)
            return;
        row = { ...row, condition, intensity: Number(prompt('Intensidade (opcional):', '')) || null, duration: prompt('Duração:') || null, notes: prompt('Observações:') || null };
    }
    else if (table === 'character_effects') {
        const name = prompt('Nome do efeito:');
        if (!name)
            return;
        const description = prompt('Descrição:') || null;
        const duration = prompt('Duração (ex.: 90min, 6h, 2d ou permanente):', 'permanente');
        const parsed = parseEffectDuration(duration);
        if (!parsed) {
            alert('Duração inválida. Use minutos, horas, dias ou "permanente".');
            return;
        }
        row = { ...row, name, description, duration: duration || 'Permanente', remaining_minutes: parsed.minutes, is_permanent: parsed.isPermanent, active: true };
    }
    else if (table === 'character_diary') {
        const title = prompt('Título:');
        if (!title)
            return;
        const content = prompt('Conteúdo:');
        if (!content)
            return;
        row = { ...row, title, content, session_reference: prompt('Data/Sessão:') || null };
    }
    else {
        const cfg: any = { character_contacts: ['name', 'Nome do contato'], character_factions: ['faction_name', 'Nome da facção'], character_reputations: ['group_or_place', 'Grupo ou lugar'], character_objectives: ['objective', 'Objetivo'], character_events: ['title', 'Título'] }[table];
        const val = prompt(cfg[1] + ':');
        if (!val)
            return;
        row[cfg[0]] = val;
        if (table === 'character_events')
            row.description = prompt('Descrição:') || null;
        else
            row.notes = prompt('Observações:') || null;
        if (table === 'character_objectives')
            row.status = 'active';
    } const { error } = await supabase.from(table).insert(row); if (error)
        alert(error.message); await loadRelations(selected.id); };
    const editRelated = async (table: string, r: any) => { if (!selected)
        return; if (table === 'character_items') {
        const name = prompt('Nome:', r.name); if (!name) return;
        const quantity = Math.max(0, Number(prompt('Quantidade:', String(r.quantity))) || 0);
        const description = prompt('Descrição:', r.description || ''); if (description === null) return;
        let amount: number | null = null;
        if (r.amount != null) { const raw = prompt(`Quantidade em ${r.unit || 'unidade'}:`, String(r.amount)); if (raw === null) return; amount = Math.max(0, Number(raw) || 0); }
        const isCustom = !r.catalog_item_id && !r.weapon_id && !r.armor_id && !r.shield_id;
        let customWeight: number | null = r.custom_weight_kg ?? null;
        let customSubcategory = r.custom_subcategory || 'Itens variados';
        if (isCustom) {
            const wr = prompt('Peso unitário em kg (vazio = não definido):', customWeight == null ? '' : String(customWeight)); if (wr === null) return;
            customWeight = wr.trim() === '' ? null : Math.max(0, Number(wr) || 0);
            const sr = prompt('Subclasse:', customSubcategory); if (sr === null) return; customSubcategory = sr.trim() || 'Itens variados';
        }
        let durability: number | null = null;
        if (r.durability_max != null) { const raw = prompt(`Durabilidade atual (0 a ${r.durability_max}):`, String(r.durability_current ?? r.durability_max)); if (raw === null) return; durability = Math.max(0, Math.min(Number(r.durability_max), Number(raw) || 0)); }
        let preservation: number | null = null;
        if (r.freshness_minutes_remaining != null) { const raw = prompt('Multiplicador de conservação: 2 = frio, 1 = normal, 0.5 = quente/úmido.', String(r.shelf_life_multiplier ?? 1)); if (raw === null) return; preservation = Math.max(.1, Number(raw) || 1); }
        const { error } = await supabase.rpc('master_update_character_item_051026', { p_master_player_id: player.id, p_item_id: r.id, p_name: name, p_quantity: quantity, p_description: description || null, p_amount: amount, p_custom_weight_kg: customWeight, p_custom_subcategory: customSubcategory, p_durability_current: durability, p_shelf_life_multiplier: preservation });
        if (error) alert(error.message);
        await loadRelations(selected.id);
        return;
    } let patch: any = {}; if (table === 'character_conditions') {
        const condition = prompt('Condição:', r.condition);
        if (!condition)
            return;
        patch = { condition, intensity: Number(prompt('Intensidade:', String(r.intensity || ''))) || null, duration: prompt('Duração:', r.duration || '') || null, notes: prompt('Observações:', r.notes || '') || null };
    }
    else if (table === 'character_effects') {
        const name = prompt('Nome:', r.name);
        if (!name)
            return;
        const description = prompt('Descrição:', r.description || '');
        if (description === null)
            return;
        const duration = prompt('Duração (ex.: 90min, 6h, 2d ou permanente):', r.is_permanent === false && r.remaining_minutes != null ? `${r.remaining_minutes}min` : (r.duration || 'permanente'));
        const parsed = parseEffectDuration(duration);
        if (!parsed) {
            alert('Duração inválida. Use minutos, horas, dias ou "permanente".');
            return;
        }
        patch = { name, description: description || null, duration: duration || 'Permanente', remaining_minutes: parsed.minutes, is_permanent: parsed.isPermanent, active: true };
    }
    else if (table === 'character_diary') {
        const title = prompt('Título:', r.title);
        if (!title)
            return;
        const content = prompt('Conteúdo:', r.content);
        if (content === null)
            return;
        patch = { title, content, session_reference: prompt('Data/Sessão:', r.session_reference || '') || null, updated_at: new Date().toISOString() };
    }
    else {
        const cfg: any = { character_contacts: ['name', 'Nome'], character_factions: ['faction_name', 'Facção'], character_reputations: ['group_or_place', 'Grupo/Lugar'], character_objectives: ['objective', 'Objetivo'], character_events: ['title', 'Título'] }[table];
        const val = prompt(cfg[1] + ':', r[cfg[0]]);
        if (!val)
            return;
        patch[cfg[0]] = val;
        if (table === 'character_events')
            patch.description = prompt('Descrição:', r.description || '') || null;
        else
            patch.notes = prompt('Observações:', r.notes || '') || null;
    } const { error } = await supabase.from(table).update(patch).eq('id', r.id); if (error)
        alert(error.message); await loadRelations(selected.id); };
    const addWeaponForSelected = async () => { if (!selected || !weaponChoice)
        return; const { error } = await supabase.rpc('master_add_character_item', { p_master_player_id: player.id, p_character_id: selected.id, p_name: null, p_type: 'arma', p_quantity: 1, p_description: null, p_weapon_id: weaponChoice, p_armor_id: null, p_shield_id: null, p_hunger_restore: 0, p_thirst_restore: 0 }); if (error)
        alert(error.message);
    else {
        setWeaponChoice('');
        await loadRelations(selected.id);
    } };
    const addArmorForSelected = async () => { if (!selected || !armorChoice)
        return; const { error } = await supabase.rpc('master_add_character_item', { p_master_player_id: player.id, p_character_id: selected.id, p_name: null, p_type: 'armadura', p_quantity: 1, p_description: null, p_weapon_id: null, p_armor_id: armorChoice, p_shield_id: null, p_hunger_restore: 0, p_thirst_restore: 0 }); if (error)
        alert(error.message);
    else {
        setArmorChoice('');
        await loadRelations(selected.id);
    } };
    const addShieldForSelected = async () => { if (!selected || !shieldChoice)
        return; const { error } = await supabase.rpc('master_add_character_item', { p_master_player_id: player.id, p_character_id: selected.id, p_name: null, p_type: 'escudo', p_quantity: 1, p_description: null, p_weapon_id: null, p_armor_id: null, p_shield_id: shieldChoice, p_hunger_restore: 0, p_thirst_restore: 0 }); if (error)
        alert(error.message);
    else {
        setShieldChoice('');
        await loadRelations(selected.id);
    } };
    const addCatalogItemForSelected = async () => { if (!selected || !itemChoice)
        return; const quantity = Math.max(1, Number(prompt('Quantidade de lotes/unidades:', '1')) || 1); const item = itemCatalog.find(i => i.id === itemChoice); let multiplier = 1; if (item?.is_perishable) {
        const storage = prompt('Conservação: 1 = normal, 2 = frio (dobra a validade), 0.5 = quente/úmido (metade da validade).', '1');
        if (storage === null)
            return;
        multiplier = Math.max(.1, Number(storage) || 1);
    } const description = prompt('Observação do lote/item (opcional):', item?.notes || ''); if (description === null)
        return; const { error } = await supabase.rpc('master_add_catalog_item', { p_master_player_id: player.id, p_character_id: selected.id, p_catalog_item_id: itemChoice, p_quantity: quantity, p_description: description || null, p_shelf_life_multiplier: multiplier }); if (error)
        alert(error.message);
    else {
        setItemChoice('');
        await loadRelations(selected.id);
    } };
    const deleteRelated = async (table: string, id: string) => { if (!selected || !confirm('Excluir este registro?'))
        return; if (table === 'character_items') {
        const { error } = await supabase.rpc('master_delete_character_item', { p_master_player_id: player.id, p_item_id: id });
        if (error)
            alert(error.message);
    }
    else {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error)
            alert(error.message);
    } await loadRelations(selected.id); };
    const refreshSelected = async () => { await load(); if (selected) {
        const { data: c } = await supabase.from('characters').select('*').eq('id', selected.id).single();
        if (c) {
            setSelected(c as Character);
            setDraft(structuredClone(c as Character));
            await loadRelations(selected.id);
        }
    } };
    const timeSummaryText = (summary: TimeAdvanceSummary) => { const changed = (summary.characters || []).filter(c => c.hunger_before !== c.hunger_after || c.thirst_before !== c.thirst_after || c.hp_before !== c.hp_after || c.mp_before !== c.mp_after); const lines = changed.slice(0, 12).map(c => `${c.name}: Fome ${c.hunger_before}→${c.hunger_after}, Sede ${c.thirst_before}→${c.thirst_after}${c.hp_before !== c.hp_after ? `, PV ${c.hp_before}→${c.hp_after}` : ''}${c.mp_before !== c.mp_after ? `, PM ${c.mp_before}→${c.mp_after}` : ''}`); if (summary.effects_expired)
        lines.push(`${summary.effects_expired} efeito(s) expiraram.`); if (summary.items_spoiled)
        lines.push(`${summary.items_spoiled} lote(s) de alimento estragaram.`); return lines.length ? lines.join('\n') : 'Nenhum valor visível mudou neste avanço.'; };
    const advanceTime = async (minutes: number, restType: 'short' | 'long' | null = null) => { if (minutes <= 0 || advancingTime)
        return; const label = restType === 'short' ? 'Descanso curto (4h)' : restType === 'long' ? 'Descanso longo (8h)' : formatDuration(minutes); if (!confirm(`${label}: avançar o relógio para todos os personagens vivos?\n\nFome: −1 a cada 8h · Sede: −1 a cada 6h. Alimentos e efeitos temporários também avançam.`))
        return; setAdvancingTime(true); const { data, error } = await supabase.rpc('master_advance_time', { p_master_player_id: player.id, p_minutes: minutes, p_rest_type: restType }); if (error)
        alert(error.message);
    else {
        const summary = data as TimeAdvanceSummary;
        alert(`${label} aplicado.\n\n${timeSummaryText(summary)}`);
    } setAdvancingTime(false); setTimeValue(''); await refreshSelected(); };
    const advanceCustomTime = () => { const value = Number(timeValue); if (value <= 0)
        return; const multiplier = timeUnit === 'minutes' ? 1 : timeUnit === 'hours' ? 60 : 1440; advanceTime(Math.round(value * multiplier), null); };
    const undoLastTime = async () => { if (advancingTime || !confirm('Desfazer o último avanço de tempo? Isto restaura Fome, Sede, PV/PM, efeitos temporários e validade dos lotes para o estado anterior.'))
        return; setAdvancingTime(true); const { error } = await supabase.rpc('undo_last_time_advance', { p_master_player_id: player.id }); if (error)
        alert(error.message);
    else
        alert('Último avanço de tempo desfeito.'); setAdvancingTime(false); await refreshSelected(); };
    const saveChar = async () => { if (!draft)
        return; setSaving(true); const patch: any = {}; for (const k of textKeys)
        patch[k] = (draft as any)[k] || null; Object.assign(patch, { name: draft.name, gender: draft.gender || null, race: draft.race, lineage: draft.lineage, class_name: draft.class_name || null, specialization: draft.specialization || null, age: Number(draft.age) || 0, level: Math.max(1, Math.min(20, Number(draft.level) || 1)), current_hp: draft.current_hp, current_mp: draft.current_mp, current_hunger: draft.current_hunger, current_thirst: draft.current_thirst, currency_obolos: draft.currency_obolos ?? 0, currency_dracmas: draft.currency_dracmas ?? 0, currency_estaters: draft.currency_estaters ?? 0, status: draft.status, attributes: draft.attributes, skills: draft.skills }); const { data, error } = await supabase.from('characters').update(patch).eq('id', draft.id).select().single(); if (error)
        alert(error.message);
    else if (data) {
        setSelected(data as Character);
        setDraft(structuredClone(data as Character));
        setCharacters(xs => xs.map(x => x.id === data.id ? data as Character : x));
        setEditing(false);
    } setSaving(false); };
    const patchPlayer = async (id: string, patch: Partial<Player>) => { const { error } = await supabase.from('players').update(patch).eq('id', id); if (error)
        alert(error.message); await load(); };
    const sendMessage = async () => { if (!messagePlayer || !messageText.trim())
        return; const { error } = await supabase.from('master_messages').insert({ player_id: messagePlayer, content: messageText.trim() }); if (error)
        alert(error.message);
    else {
        setMessageText('');
        await load();
    } };
    const deleteMessage = async (id: string) => { if (!confirm('Excluir este recado? O jogador deixará de vê-lo imediatamente.'))
        return; const { error } = await supabase.from('master_messages').delete().eq('id', id); if (error) {
        alert(`Não foi possível excluir o recado: ${error.message}`);
        return;
    } await load(); };
    const suggestionStatus = async (id: string, status: string) => { const { error } = await supabase.from('suggestions').update({ status }).eq('id', id); if (error)
        alert(error.message); await load(); };
    const deleteSuggestion = async (id: string) => { if (!confirm('Excluir esta sugestão?'))
        return; await supabase.from('suggestions').delete().eq('id', id); await load(); };
    const updateAttr = (key: string, n: number) => draft && setDraft({ ...draft, attributes: { ...draft.attributes, [key]: Math.max(0, Math.min(5, n)) } });
    const updateSkill = (key: string, n: number) => draft && setDraft({ ...draft, skills: { ...draft.skills, [key]: Math.max(0, Math.min(5, n)) } });
    return <div className="trilha-master-page min-h-screen bg-gradient-fantasy text-parchment"><header className="border-b border-gold-dim bg-shadow/70 sticky top-0 z-30"><div className="max-w-7xl mx-auto p-4 flex justify-between items-center"><div><h1 className="font-display text-2xl text-gold-bright">Controle</h1><p className="text-xs text-parchment-dim">{player.player_name} · acesso administrativo</p></div><div className="flex gap-2"><button onClick={load} className={`${btn} is-quiet`}><RefreshCw className="w-4 h-4"/>Atualizar</button><button onClick={onLogout} className={`${btn} is-quiet`}><LogOut className="w-4 h-4"/>Sair</button></div></div></header><main className="trilha-master-main max-w-7xl mx-auto p-4 md:p-6"><nav className="flex flex-wrap gap-2 mb-6">{([['characters', 'Controle', ScrollText], ['players', 'Jogadores', Users], ['races', 'Raças', ScrollText], ['lineages', 'Linhagens', ScrollText], ['classes', 'Classes', GitBranch], ['catalog', 'Catálogo', Package], ['weapons', 'Armas', Sword], ['protections', 'Proteções', Shield], ['messages', 'Recados', MessageSquare], ['suggestions', 'Sugestões', Lightbulb]] as const).map(([k, l, I]) => <button key={k} onClick={() => setTab(k)} className={`${btn} trilha-master-nav-button ${tab === k ? 'is-active' : ''}`}><I className="w-4 h-4"/>{l}</button>)}</nav>
 {tab === 'characters' && <section><div className="flex flex-wrap items-center justify-between gap-3 mb-4"><div><h2 className="font-display text-xl text-gold-bright">Personagens</h2><p className="text-xs text-parchment-dim">Crie, consulte e administre as fichas de todos os jogadores.</p></div><select className={`${input} max-w-xs`} value="" onChange={e => { const p = players.find(x => x.id === e.target.value); if (p)
        setCreatingFor(p); }}><option value="">+ Criar personagem para...</option>{players.filter(p => p.player_identifier !== 'Mestre').map(p => <option key={p.id} value={p.id}>{p.player_name || p.alcunha}</option>)}</select></div><div className="trilha-master-clock-card mb-5 rounded-xl border border-gold-dim bg-gradient-card p-4"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-display text-gold-bright flex items-center gap-2"><Clock className="w-4 h-4"/>Relógio da mesa</h3><p className="text-xs text-parchment-dim mt-1">Tempo acumulado: {formatDuration(worldMinutes)} · Fome −1/8h · Sede −1/6h · efeitos e perecíveis avançam no mesmo relógio.</p></div><div className="flex flex-wrap gap-2"><button disabled={advancingTime} onClick={() => advanceTime(240, 'short')} className={btn}>Descanso curto · 4h</button><button disabled={advancingTime} onClick={() => advanceTime(480, 'long')} className={btn}>Descanso longo · 8h</button><div className="flex"><input type="number" min="1" step="1" value={timeValue} onChange={e => setTimeValue(e.target.value)} placeholder="valor" className={`${input} w-24 rounded-r-none`}/><select value={timeUnit} onChange={e => setTimeUnit(e.target.value as 'minutes' | 'hours' | 'days')} className={`${input} w-28 rounded-none border-l-0`}><option value="minutes">minutos</option><option value="hours">horas</option><option value="days">dias</option></select><button disabled={advancingTime || Number(timeValue) <= 0} onClick={advanceCustomTime} className={`${btn} rounded-l-none`}>Avançar</button></div><button disabled={advancingTime} onClick={undoLastTime} className={btn} title="Desfazer último avanço"><RotateCcw className="w-4 h-4"/>Desfazer</button></div></div></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{characters.map(c => { const p = playerMap[c.player_id]; const hpMax = characterMaxHp(c); const mpMax = characterMaxMp(c); const hungerMax = characterHungerMax(c); const hp = c.current_hp ?? hpMax; const mp = c.current_mp ?? mpMax; const hunger = c.current_hunger ?? hungerMax; const thirst = c.current_thirst ?? 6; const alertState = hp <= Math.max(1, Math.floor(hpMax * .25)) || hunger === 0 || thirst === 0; return <button key={c.id} onClick={() => openChar(c)} className={`trilha-master-character-card text-left bg-gradient-card border rounded-xl p-4 ${alertState ? 'is-alert' : ''}`}><div className="flex gap-3">{c.thumbnail_url ? <img src={c.thumbnail_url} className="w-16 h-16 rounded-lg object-cover border border-gold-dim"/> : <div className="w-16 h-16 rounded-lg bg-shadow border border-gold-dim flex items-center justify-center text-gold">{c.name[0]}</div>}<div className="min-w-0 flex-1"><h3 className="font-display text-lg text-gold-bright truncate">{c.name}</h3><p className="text-sm">Jogador: {p?.player_name || p?.alcunha || '—'}</p><p className="text-xs text-gold">Nível {c.level} · {stage(c.level)} · {c.status === 'morto' ? 'Morto' : c.status === 'desaparecido' ? 'Desaparecido' : 'Vivo'}</p><p className="text-xs text-parchment-dim">Classe: {c.class_name || '—'}</p></div></div><div className="trilha-master-resource-grid grid grid-cols-4 gap-1 mt-3 text-center"><span className="trilha-master-resource-chip rounded border border-gold-dim/60 bg-shadow/40 px-1 py-1 text-[10px]">PV <b className="text-gold">{hp}/{hpMax}</b></span><span className="trilha-master-resource-chip rounded border border-gold-dim/60 bg-shadow/40 px-1 py-1 text-[10px]">PM <b className="text-gold">{mp}/{mpMax}</b></span><span className={`trilha-master-resource-chip rounded border bg-shadow/40 px-1 py-1 text-[10px] ${hunger === 0 ? 'is-danger' : ''}`}>Fome <b>{hunger}/{hungerMax}</b></span><span className={`trilha-master-resource-chip rounded border bg-shadow/40 px-1 py-1 text-[10px] ${thirst === 0 ? 'is-danger' : ''}`}>Sede <b>{thirst}/6</b></span></div></button>; })}</div></section>}
 {tab === 'players' && <section className="space-y-3">{players.map(p => <div key={p.id} className="bg-gradient-card border border-gold-dim rounded-xl p-4 grid md:grid-cols-[1fr_auto_auto] gap-3 items-center"><div><b className="text-gold-bright">{p.player_name || 'Sem jogador'}</b><p className="text-sm text-parchment-dim">{p.alcunha} · {p.player_identifier || 'Sem ID'} · {p.status}</p></div><label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={!!p.character_creation_allowed} onChange={e => patchPlayer(p.id, { character_creation_allowed: e.target.checked })}/>Liberar personagem adicional</label><select className={input} value={p.status} onChange={e => patchPlayer(p.id, { status: e.target.value as Player['status'] })}><option value="ativa">Ativa</option><option value="espera">Em espera</option></select></div>)}</section>}
 {tab === 'races' && <AncestryAdmin kind="races"/>}
 {tab === 'lineages' && <AncestryAdmin kind="lineages"/>}
 {tab === 'classes' && <ClassTreeAdmin characters={characters} players={players}/>}
 {tab === 'catalog' && <CatalogPage playerId={player.id} isMaster/>}
 {tab === 'weapons' && <WeaponCatalogAdmin playerId={player.id}/>}
 {tab === 'protections' && <ProtectionCatalogAdmin playerId={player.id}/>}
 {tab === 'messages' && <section className="grid lg:grid-cols-[.8fr_1.2fr] gap-5"><div className="bg-gradient-card border border-gold-dim rounded-xl p-5"><h2 className="font-display text-gold-bright mb-4">Enviar recado</h2><select className={`${input} mb-3`} value={messagePlayer} onChange={e => setMessagePlayer(e.target.value)}><option value="">Escolha o jogador</option>{players.filter(p => p.player_identifier !== 'Mestre').map(p => <option key={p.id} value={p.id}>{p.player_name || p.alcunha}</option>)}</select><textarea className={input} rows={6} value={messageText} onChange={e => setMessageText(e.target.value)} placeholder="Recado do Mestre..."/><button className={`${btn} mt-3`} onClick={sendMessage}><Plus className="w-4 h-4"/>Enviar</button></div><div><h2 className="font-display text-gold-bright mb-4">Recados enviados</h2><div className="space-y-3">{messages.map(m => <div key={m.id} className="bg-gradient-card border border-gold-dim rounded-xl p-4"><div className="flex justify-between gap-3 items-start"><b className="text-gold">Para: {playerMap[m.player_id]?.player_name || '—'}</b><button onClick={() => deleteMessage(m.id)} className={`${btn} is-danger`} title="Excluir recado"><Trash2 className="w-4 h-4"/>Excluir</button></div><p className="mt-2 whitespace-pre-wrap">{m.content}</p><p className="text-xs text-parchment-dim mt-2">{new Date(m.created_at).toLocaleString('pt-BR')}</p></div>)}</div></div></section>}
 {tab === 'suggestions' && <section><h2 className="font-display text-gold-bright mb-4">Sugestões recebidas</h2><div className="space-y-3">{suggestions.length === 0 ? <p className="text-parchment-dim">Nenhuma sugestão recebida.</p> : suggestions.map(s => <div key={s.id} className="bg-gradient-card border border-gold-dim rounded-xl p-4"><div className="flex flex-wrap justify-between gap-3"><div><b className="text-gold">{playerMap[s.player_id]?.player_name || playerMap[s.player_id]?.alcunha || 'Jogador'}</b><p className="text-xs text-parchment-dim">{new Date(s.created_at).toLocaleString('pt-BR')}</p></div><div className="flex gap-2"><select className={input} value={s.status || 'nova'} onChange={e => suggestionStatus(s.id, e.target.value)}><option value="nova">Nova</option><option value="lida">Lida</option><option value="resolvida">Resolvida</option></select><button onClick={() => deleteSuggestion(s.id)} className={btn}><Trash2 className="w-4 h-4"/></button></div></div><p className="mt-3 whitespace-pre-wrap">{s.content}</p></div>)}</div></section>}
 </main>
 {creatingFor && <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto"><div className="min-h-screen"><div className="sticky top-0 z-50 bg-stone border-b border-gold-dim px-4 py-3 flex justify-between items-center"><div><b className="font-display text-gold-bright">Criando personagem como Mestre</b><p className="text-xs text-parchment-dim">Ficha destinada a {creatingFor.player_name || creatingFor.alcunha}</p></div><button className={btn} onClick={() => setCreatingFor(null)}><X className="w-4 h-4"/>Fechar</button></div><CharacterCreation player={creatingFor} consumeCharacterAllowance={false} onBack={() => setCreatingFor(null)} onCreated={async () => { setCreatingFor(null); await load(); }}/></div></div>}
 {selected && !masterEditor && <PlayerPage player={player} onLogout={() => { }} onCreateCharacter={() => { }} masterMode masterCharacter={selected} onMasterClose={() => { setSelected(null); setDraft(null); load(); }} onMasterEdit={(c) => { setSelected(c); setDraft(structuredClone(c)); loadRelations(c.id); setMasterEditor(true); }}/>}
 {selected && draft && masterEditor && <MasterCharacterEditor
    selected={selected}
    draft={draft}
    setDraft={setDraft}
    editing={editing}
    setEditing={setEditing}
    saving={saving}
    onSave={saveChar}
    onDeleteCharacter={deleteCharacter}
    onClose={() => setMasterEditor(false)}
    editorSection={editorSection}
    setEditorSection={setEditorSection}
    relations={relations}
    classOptions={classOptions}
    specializationOptions={specializationOptions}
    itemCatalog={itemCatalog}
    itemChoice={itemChoice}
    setItemChoice={setItemChoice}
    itemGroups={itemGroups}
    weaponCatalog={weaponCatalog}
    weaponChoice={weaponChoice}
    setWeaponChoice={setWeaponChoice}
    armorCatalog={armorCatalog}
    armorChoice={armorChoice}
    setArmorChoice={setArmorChoice}
    shieldCatalog={shieldCatalog}
    shieldChoice={shieldChoice}
    setShieldChoice={setShieldChoice}
    addRelated={addRelated}
    editRelated={editRelated}
    deleteRelated={deleteRelated}
    addCatalogItem={addCatalogItemForSelected}
    addWeapon={addWeaponForSelected}
    addArmor={addArmorForSelected}
    addShield={addShieldForSelected}
    updateAttr={updateAttr}
    updateSkill={updateSkill}
 />}

 </div>;
}
