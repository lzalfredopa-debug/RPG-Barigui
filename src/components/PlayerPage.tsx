import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Scroll, MessageSquare, Lightbulb, Plus, User, Send, Loader2, Save, X, Lock, Info, Shield, Sword, Trash2, Pencil, ImagePlus, Check, Ban, BookOpen, UsersRound, Route, Package, Brain } from 'lucide-react';
import { supabase, type Player, type PersonalNote, type MasterMessage, type PlayerMessage, type Character, type CombatEquipmentSummary, type CombatTarget, type CombatAction } from '@/lib/supabase';
import { ATTRIBUTE_GROUPS, SKILL_GROUPS, apprenticeTitle, visibleClassPaths, classPathMeetsRequirements } from '@/lib/systemV15';
import { renderCharacterText } from '@/lib/characterLanguage';
import { attributeValue as v, skillValue as s, characterMaxHp as maxHp, characterMaxMp as maxMp, characterHungerMax as hungerMax } from '@/lib/characterRules';

import { NAMING_CULTURES } from '@/lib/nameCultures';
import { type RaceDefinition } from '@/lib/ancestry';

import ProgressionV15 from '@/components/ProgressionV15';
import CollapsibleSection from '@/components/CollapsibleSection';
import CatalogPage from '@/components/CatalogPage';
import InventoryPanel, { type InventoryItem } from '@/components/InventoryPanel';
import { durabilityLabel, formatDuration } from '@/lib/items';
type PlayerPageProps = {
    player: Player;
    onLogout: () => void;
    onCreateCharacter: () => void;
    masterMode?: boolean;
    masterCharacter?: Character | null;
    onMasterClose?: () => void;
    onMasterEdit?: (character: Character) => void;
};
type Tab = 'ficha' | 'combate' | 'inventario' | 'historia' | 'jornada' | 'diario' | 'classes' | 'catalogo' | 'regras';
type ReferenceView = 'regras' | 'povos' | 'classes' | 'atributos' | 'itens' | null;
type DiaryEntry = {
    id: string;
    character_id: string;
    title: string;
    content: string;
    session_reference: string | null;
    created_at: string;
    updated_at: string;
};
type Item = InventoryItem;
type Condition = {
    id: string;
    condition: string;
    intensity: number | null;
    notes: string | null;
    duration: string | null;
};
type Effect = {
    id: string;
    name: string;
    description: string | null;
    duration: string | null;
    modifiers: Record<string, unknown>;
    remaining_minutes?: number | null;
    is_permanent?: boolean;
    active?: boolean;
};
type Contact = {
    id: string;
    name: string;
    relationship: string | null;
    notes: string | null;
};
type Faction = {
    id: string;
    faction_name: string;
    relationship: string | null;
    notes: string | null;
};
type Reputation = {
    id: string;
    group_or_place: string;
    reputation: string | null;
    notes: string | null;
};
type Objective = {
    id: string;
    objective: string;
    notes: string | null;
    status: string;
};
type Event = {
    id: string;
    title: string;
    description: string | null;
    session_reference: string | null;
};
const stageForLevel = (level: number, c?: Character) => level <= 3 ? (c ? apprenticeTitle(c.attributes || {}) : 'Aprendiz') : (c?.class_name || 'Classe inicial');
const statusLabel = (x: Character['status'] | undefined) => x === 'morto' ? 'Morto' : x === 'desaparecido' ? 'Desaparecido' : 'Vivo';
const movement = (c: Character) => 6 + Math.max(1, Math.floor((v(c, 'Agilidade') + s(c, 'Atletismo')) / 2));
const hungerStatus = (current: number, max: number) => current <= 0 ? 'Desmaiado' : current / max > 2 / 3 ? 'Saciado' : current / max > 1 / 3 ? 'Com fome' : 'Faminto';
const thirstStatus = (current: number) => current <= 0 ? 'Desmaiado' : current >= 5 ? 'Hidratado' : current >= 3 ? 'Com sede' : 'Sedento';
const field = 'w-full bg-shadow/60 border border-gold-dim rounded-lg px-3 py-2 text-parchment text-sm';
function Tip({ children }: {
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [pos, setPos] = useState<{
        left: number;
        top: number;
    } | null>(null);
    const show = () => { const r = ref.current?.getBoundingClientRect(); if (r)
        setPos({ left: Math.min(window.innerWidth - 160, Math.max(160, r.left + r.width / 2)), top: Math.max(12, r.top - 8) }); };
    return <span ref={ref} className="inline-flex ml-1 align-middle" onMouseEnter={show} onMouseLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)} tabIndex={0}><Info className="w-3.5 h-3.5 text-gold/70 cursor-help"/>{pos && createPortal(<span className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full w-72 max-w-[80vw] bg-stone border border-gold-dim rounded-lg p-3 shadow-gold text-xs text-parchment-dim font-body leading-relaxed" style={{ left: pos.left, top: pos.top }}>{children}</span>, document.body)}</span>;
}
function Dots({ base, bonus = 0, max = 5, bonusTitle }: {
    base: number;
    bonus?: number;
    max?: number;
    bonusTitle?: string;
}) { const total = base + bonus; const visibleMax = Math.max(max, total); return <span className="trilha-dots inline-flex gap-1.5">{Array.from({ length: visibleMax }, (_, i) => { const isFilled = i < total; const isBonus = i >= base && i < total && bonus > 0; return <span key={i} title={isBonus ? bonusTitle : undefined} className={`trilha-dot ${isFilled ? 'is-filled' : ''} ${isBonus ? 'is-bonus' : ''}`}/>; })}</span>; }
function Empty({ children = 'Nenhum registro.' }: {
    children?: React.ReactNode;
}) { return <p className="text-parchment-dim/60 text-sm font-body py-3">{children}</p>; }
function RulesPanel({ playerName }: {
    playerName: string;
}) {
    const card = 'bg-shadow/40 border border-gold-dim rounded-xl p-4 sm:p-5';
    const title = 'font-display text-lg text-gold-bright mb-3';
    return <div className="max-w-4xl mx-auto space-y-5 pb-10">
    <div className="flex items-end justify-between gap-4 border-b border-gold-dim pb-4">
      <div><p className="text-xs uppercase tracking-[0.25em] text-gold/70">Consulta rápida</p><h2 className="font-display text-2xl sm:text-3xl text-gold-bright mt-1">Regras do TRILHA</h2></div>
      <span className="hidden sm:block text-xs text-parchment-dim">Trajetória · Roleplay · Identidade · Liberdade · História · Aventura</span>
    </div>

    <section className={card}><h3 className={title}>🎲 Testes</h3><p className="text-sm text-parchment-dim">Quando uma ação tiver resultado incerto, o Mestre pode pedir um <b className="text-parchment">Teste</b>.</p><div className="my-3 rounded-lg border border-gold-dim bg-stone/50 px-4 py-3 text-center font-display text-gold">Atributo + Habilidade = quantidade de d10</div><p className="text-sm text-parchment-dim">Cada resultado <b className="text-parchment">maior que a Dificuldade</b> conta como 1 sucesso. <b className="text-parchment">1</b> anula um sucesso. <b className="text-parchment">10</b> conta como 1 sucesso e permite rolar +1d10; outro 10 explode novamente.</p><div className="overflow-x-auto mt-4"><table className="w-full text-sm"><thead><tr className="text-left text-gold border-b border-gold-dim"><th className="py-2 pr-4">Sucessos finais</th><th className="py-2">Resultado</th></tr></thead><tbody className="text-parchment-dim">{[['−1 ou menos', 'Falha Crítica'], ['0', 'Falha'], ['1', 'Marginal'], ['2', 'Moderado'], ['3', 'Completo'], ['4', 'Excepcional'], ['5+', 'Fenomenal']].map(([a, b]) => <tr key={a} className="border-b border-gold-dim/40"><td className="py-2 pr-4 font-display text-gold-bright">{a}</td><td>{b}</td></tr>)}</tbody></table></div></section>

    <div className="grid md:grid-cols-2 gap-5"><section className={card}><h3 className={title}>❤️ Pontos de Vida (PV)</h3><p className="text-sm text-parchment-dim">Representam a condição física do personagem.</p><p className="my-3 text-sm text-gold">PV Máximo = 15 + (Vigor × 5) + ((Nível − 1) × 2)</p><p className="text-sm text-parchment-dim">Ao chegar a <b className="text-parchment">0 PV</b>, o personagem fica <b className="text-parchment">Inconsciente</b>.</p></section><section className={card}><h3 className={title}>✦ Pontos de Mana (PM)</h3><p className="text-sm text-parchment-dim">Representam a energia usada em magias e efeitos sobrenaturais.</p><p className="my-3 text-sm text-gold">PM Máximo = 5 + (Maior Mental × 2) + (Maior Mística × 2) + Nível</p><p className="text-sm text-parchment-dim">Em <b className="text-parchment">0 PM</b>, o personagem não pode utilizar magias até recuperar Mana.</p></section></div>

    <section className={card}><h3 className={title}>💤 Descanso e Recuperação</h3><div className="grid sm:grid-cols-2 gap-4 text-sm"><div><b className="text-gold">Descanso Curto · 4 horas</b><p className="text-parchment-dim mt-1">PV: Vigor × 2<br />PM: maior Atributo Mental × 2</p></div><div><b className="text-gold">Descanso Longo · 8 horas</b><p className="text-parchment-dim mt-1">Recupera todos os PV e PM.</p></div></div><p className="text-xs text-parchment-dim mt-4 border-t border-gold-dim/50 pt-3">A passagem do tempo também afeta Fome e Sede. O Mestre controla o relógio da mesa.</p></section>

    <section className={card}><h3 className={title}>⚔️ Combate</h3><div className="space-y-4 text-sm text-parchment-dim"><div><b className="text-gold">Iniciativa</b><p>Percepção + Raciocínio. A maior age primeiro; em empate, vence a maior Percepção.</p></div><div><b className="text-gold">Turno</b><p>1 Ação + 1 Movimento. O Movimento pode ser dividido antes e depois da Ação. A Ação pode atacar, conjurar, usar habilidade/item, interagir ou realizar um segundo Movimento.</p></div><div><b className="text-gold">Reação Defensiva</b><p>1 reação para Evasão ou Bloqueio. Depois de usada, retorna quando chega novamente o turno do personagem. Sem reação disponível, usa-se a Defesa Passiva.</p></div><div className="grid sm:grid-cols-3 gap-3"><div className="bg-stone/40 rounded-lg p-3"><b className="text-parchment">Evasão</b><br />Agilidade + Defesa − penalidades</div><div className="bg-stone/40 rounded-lg p-3"><b className="text-parchment">Bloqueio</b><br />Força + Defesa; o Broquel usa Destreza. Escudos podem conceder bônus.</div><div className="bg-stone/40 rounded-lg p-3"><b className="text-parchment">Defesa Passiva</b><br />⌊Defesa ÷ 2⌋ sucessos automáticos</div></div><div><b className="text-gold">Ataque × Defesa</b><p>É um Teste Oposto. O ataque precisa superar os sucessos da defesa; <b className="text-parchment">empates favorecem o defensor</b>. Sucessos excedentes do atacante aumentam o dano.</p></div><div><b className="text-gold">Dano</b><p>Dano Bruto = Dano Base + Sucessos Excedentes. Dano Final = Dano Bruto − Armadura. Um ataque que acerta causa no mínimo 1 PV.</p></div><div><b className="text-gold">Equipamento sem proficiência</b><p>O equipamento continua utilizável, mas seu benefício é reduzido pelo déficit de requisitos: armas perdem Dano Base, escudos perdem bônus de Bloqueio e armaduras perdem Absorção. Os requisitos permanecem ocultos ao jogador.</p></div></div></section>

    <div className="grid md:grid-cols-2 gap-5"><section className={card}><h3 className={title}>🛡️ Equipamentos</h3><div className="space-y-2 text-sm text-parchment-dim"><p><b className="text-parchment">Armas:</b> a falta de proficiência reduz o Dano efetivo.</p><p><b className="text-parchment">Armaduras:</b> reduzem dano por Absorção; falta de proficiência reduz a Absorção, mas não remove penalidades.</p><p><b className="text-parchment">Escudos:</b> aumentam o Bloqueio; falta de proficiência reduz esse bônus.</p><p>Somente o Mestre adiciona itens à ficha. O jogador decide o que equipar entre os itens que recebeu.</p></div></section><section className={card}><h3 className={title}>🤝 Ajudar</h3><p className="text-sm text-parchment-dim">Gaste sua <b className="text-parchment">Ação</b> para conceder <b className="text-parchment">+1 sucesso automático</b> ao teste de um aliado. Descreva a ajuda e relacione-a a um de seus próprios Atributos ou Habilidades. Um teste recebe no máximo +1 sucesso por Ajudar.</p></section></div>

    <section className={card}><h3 className={title}>🍞 Fome & Sede</h3><div className="grid sm:grid-cols-2 gap-4 text-sm text-parchment-dim"><div><b className="text-gold">Fome</b><p className="mt-1">A reserva máxima é 9. Perde 1 ponto a cada 8 horas.</p></div><div><b className="text-gold">Sede</b><p className="mt-1">A reserva máxima é 6. Perde 1 ponto a cada 6 horas.</p></div></div><p className="text-xs text-parchment-dim mt-3">Quando qualquer uma chega a 0, o personagem recebe a condição <b className="text-parchment">Desmaiado</b>. Alimentos recuperam Fome em porções de 400 g; água recupera Sede em porções de 250 ml.</p></section>

    <section className={card}><h3 className={title}>⚠️ Condições</h3><p className="text-sm text-parchment-dim">Personagens podem ser afetados por Condições, como Caído, Atordoado, Envenenado, Agarrado ou Inconsciente. Cada Condição possui efeitos e duração próprios, apresentados quando ela for aplicada.</p></section>

    <section className={card}><h3 className={title}>⭐ Progressão</h3><div className="grid sm:grid-cols-3 gap-2 text-center text-sm"><div className="bg-stone/40 rounded-lg p-3"><div className="text-gold-bright font-display">1–3</div><div className="text-parchment-dim text-xs mt-1">Aprendiz</div></div><div className="bg-stone/40 rounded-lg p-3"><div className="text-gold-bright font-display">4+</div><div className="text-parchment-dim text-xs mt-1">Classe inicial</div></div><div className="bg-stone/40 rounded-lg p-3"><div className="text-gold-bright font-display">60</div><div className="text-parchment-dim text-xs mt-1">caminhos iniciais</div></div></div><p className="text-sm text-parchment-dim mt-4">Nos níveis 1–3, o maior Atributo define o título <b className="text-parchment">Aprendiz de X</b>. Empates formam um <b className="text-parchment">Aprendiz Versátil</b>. A partir do nível 4, cada Atributo abre cinco caminhos iniciais; o requisito padrão é Atributo 2 + Habilidade 1.</p></section>

    <section className={card}><h3 className={title}>🧩 Atributos e Habilidades</h3><p className="text-sm text-parchment-dim">Atributos representam capacidades do personagem; Habilidades representam aquilo que aprendeu ou treinou. O Mestre combina o Atributo + Habilidade adequados à ação. A combinação pode mudar conforme a forma como a ação é realizada.</p></section>

    <section className={card}><h3 className={title}>🎭 Interpretação e Decisões</h3><p className="text-sm text-parchment-dim"><b className="text-parchment">Nem toda ação exige um Teste.</b> Sem risco, oposição ou incerteza relevante, a ação pode simplesmente acontecer. Quando uma rolagem for necessária, o Mestre determina a Dificuldade e a combinação adequada. As regras orientam a aventura; a descrição e as escolhas do jogador também fazem parte da resolução.</p></section>

    <section className="mt-12 rounded-2xl border border-gold-dim bg-gradient-card p-6 sm:p-10 text-center shadow-gold">
      <p className="text-sm text-parchment-dim">Olá,</p><h2 className="font-display text-3xl text-gold-bright mt-1">{playerName}.</h2><div className="w-20 h-px bg-gold-dim mx-auto my-6"/><h3 className="font-display text-4xl sm:text-5xl text-gold-bright tracking-wider">TRILHA</h3><p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-gold mt-2">Trajetória · Roleplay · Identidade · Liberdade · História · Aventura</p><div className="max-w-2xl mx-auto mt-7 space-y-4 text-sm sm:text-base leading-relaxed text-parchment-dim text-left"><p>Este sistema nasceu como uma adaptação e uma homenagem aos muitos sistemas de RPG que vieram antes dele. O TRILHA foi pensado para facilitar o aprendizado das regras sem deixar que elas ocupem o lugar mais importante da mesa: <b className="text-parchment">a experiência dos jogadores, suas escolhas e o roleplay de seus personagens</b>.</p><p>Aqui, você não precisa decidir desde o início tudo aquilo que seu personagem será. Ele começa sua jornada como <b className="text-parchment">Aprendiz</b>, e são suas escolhas, experiências, atributos e habilidades que, pouco a pouco, revelam os caminhos que poderá seguir.</p><p>Algumas trilhas surgirão naturalmente. Outras dependerão das decisões tomadas durante a jornada. E algumas talvez nunca sejam descobertas.</p><p>As regras existem para dar estrutura à aventura, não para determinar como ela deve acontecer. <b className="text-parchment">Experimente, interprete, erre, arrisque e descubra quem seu personagem se tornará.</b></p></div><div className="w-20 h-px bg-gold-dim mx-auto my-7"/><p className="font-display text-lg sm:text-xl text-gold-bright italic">Ἡ ἀτραπὸς καθ᾽ ἕκαστον βῆμα πλάττεται.</p><p className="text-sm text-parchment-dim mt-2">“A trilha é forjada a cada passo.”</p>
    </section>
  </div>;
}

function AncestryReference({ races }: { races: RaceDefinition[] }) {
  return <div className="max-w-5xl mx-auto space-y-5 pb-10">
    <div className="border-b border-gold-dim pb-4">
      <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Consulta do jogador</p>
      <h2 className="font-display text-2xl sm:text-3xl text-gold-bright mt-1">Povos e Vertentes</h2>
      <p className="mt-2 text-sm text-parchment-dim">História, Vertentes e costumes de nomeação dos Povos do TRILHA. Povo e Vertente são escolhas narrativas e culturais.</p>
    </div>
    {races.length === 0 ? <div className="trilha-player-empty">Carregando Povos e Vertentes...</div> : <div className="space-y-5">{races.map(race => {
      const naming = NAMING_CULTURES[race.id];
      return <article key={race.id} className="rounded-2xl border border-gold-dim bg-gradient-card overflow-hidden shadow-gold">
        <div className="grid md:grid-cols-[220px_1fr] gap-0">
          <div className="bg-shadow/45 min-h-44 flex items-center justify-center border-b md:border-b-0 md:border-r border-gold-dim">
            {race.image_url ? <img src={race.image_url} alt={race.name} className="w-full h-full max-h-72 object-cover"/> : <UsersRound className="w-14 h-14 text-gold/50"/>}
          </div>
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Povo</p>
              <h3 className="font-display text-2xl text-gold-bright">{race.name}</h3>
              <p className="mt-1 text-xs text-gold">{race.tagline || 'Povo narrativo e cultural'}</p>
              <p className="mt-2 text-sm leading-relaxed text-parchment-dim whitespace-pre-line">{race.description || 'Descrição ainda não registrada.'}</p>
              <div className="mt-3 inline-flex rounded-full border border-gold-dim bg-shadow/35 px-3 py-1 text-xs text-gold">Identidade cultural · sem bônus mecânico</div>
            </div>
            {naming && <section className="rounded-xl border border-gold-dim/70 bg-shadow/30 p-4">
              <p className="text-[10px] uppercase tracking-[.18em] text-gold/70">Cultura</p>
              <h4 className="font-display text-lg text-gold-bright mt-1">{naming.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-parchment-dim">{naming.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">{naming.examples.map(name => <span key={name} className="rounded-full border border-gold-dim/70 bg-stone/35 px-2.5 py-1 text-xs text-parchment">{name}</span>)}</div>
              <p className="mt-3 border-l-2 border-gold/60 pl-3 text-sm italic text-parchment-dim">{naming.applied}</p>
            </section>}
            <section>
              <div className="flex items-center gap-2 mb-3"><Route className="w-4 h-4 text-gold"/><h4 className="font-display text-lg text-gold">Vertentes</h4></div>
              <div className="grid sm:grid-cols-3 gap-3">{race.lineages.map(lineage => <div key={lineage.id} className="rounded-xl border border-gold-dim/70 bg-shadow/35 p-3">
                {lineage.image_url && <img src={lineage.image_url} alt={lineage.name} className="w-full aspect-[4/3] object-cover rounded-lg border border-gold-dim mb-3"/>}
                <h5 className="font-display text-gold-bright">{lineage.name}</h5>
                <p className="mt-1 text-[11px] text-gold/80">{lineage.tagline || 'Vertente narrativa e cultural'}</p>
                <p className="mt-1 text-xs leading-relaxed text-parchment-dim">{lineage.description || 'Descrição ainda não registrada.'}</p>
              </div>)}</div>
            </section>
          </div>
        </div>
      </article>;
    })}</div>}
  </div>;
}

function PublicClassesReference() {
  return <div className="max-w-5xl mx-auto space-y-5 pb-10">
    <div className="border-b border-gold-dim pb-4">
      <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Consulta do jogador</p>
      <h2 className="font-display text-2xl sm:text-3xl text-gold-bright mt-1">Progressão</h2>
      <p className="mt-2 text-sm text-parchment-dim">A TRILHA 1.5 começa com o título de Aprendiz. Nos níveis 1–3, o maior Atributo indica o ramo natural do personagem; em caso de empate, ele é um Aprendiz Versátil.</p>
    </div>

    <section className="rounded-2xl border border-gold-dim bg-gradient-card p-5 sm:p-6">
      <div className="grid md:grid-cols-[1fr_auto] gap-5 items-start">
        <div>
          <div className="flex items-center gap-2"><Route className="w-5 h-5 text-gold"/><h3 className="font-display text-xl text-gold-bright">Do Aprendiz à primeira classe</h3></div>
          <p className="mt-2 text-sm leading-relaxed text-parchment-dim">No nível 4, cada Atributo dominante oferece cinco caminhos iniciais. O requisito padrão é <b className="text-parchment">Atributo 2 + Habilidade 1</b>. Um Aprendiz Versátil pode acessar os caminhos de todos os Atributos empatados no maior valor.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg border border-gold-dim bg-shadow/30 px-3 py-2"><b className="block font-display text-lg text-gold-bright">12</b>Atributos</div>
          <div className="rounded-lg border border-gold-dim bg-shadow/30 px-3 py-2"><b className="block font-display text-lg text-gold-bright">5</b>caminhos</div>
          <div className="rounded-lg border border-gold-dim bg-shadow/30 px-3 py-2"><b className="block font-display text-lg text-gold-bright">60</b>classes</div>
        </div>
      </div>
    </section>

    <div className="grid md:grid-cols-2 gap-3">
      <section className="rounded-xl border border-gold-dim bg-shadow/35 p-4">
        <p className="text-[10px] uppercase tracking-[.18em] text-gold/70">Níveis 1–3</p>
        <h3 className="font-display text-lg text-gold-bright">Aprendiz</h3>
        <p className="mt-2 text-sm text-parchment-dim">O título é calculado pelo maior Atributo: <b className="text-parchment">Aprendiz de Força</b>, <b className="text-parchment">Aprendiz de Empatia</b> e assim por diante. Empates formam o <b className="text-parchment">Aprendiz Versátil</b>.</p>
      </section>
      <section className="rounded-xl border border-gold-dim bg-shadow/35 p-4">
        <p className="text-[10px] uppercase tracking-[.18em] text-gold/70">A partir do nível 4</p>
        <h3 className="font-display text-lg text-gold-bright">Classe inicial</h3>
        <p className="mt-2 text-sm text-parchment-dim">Os caminhos ligados aos maiores Atributos ficam visíveis na ficha. Caminhos avançados ainda serão desenvolvidos e não fazem parte desta versão.</p>
      </section>
    </div>

    <section className="rounded-xl border border-gold-dim bg-gradient-card p-4 sm:p-5">
      <div className="flex items-start gap-3"><Lock className="w-5 h-5 text-gold mt-0.5"/><div><h3 className="font-display text-lg text-gold-bright">A progressão continua sendo descoberta em jogo</h3><p className="mt-1 text-sm text-parchment-dim">A ficha mostra apenas os caminhos iniciais que fazem sentido para o personagem. Especializações superiores serão adicionadas depois, mantendo a ideia de trajetória em vez de um catálogo completo de classes.</p></div></div>
    </section>
  </div>;
}
function AttributeSkillsReference() {
  return <div className="max-w-6xl mx-auto space-y-6 pb-10">
    <div className="border-b border-gold-dim pb-4">
      <p className="text-xs uppercase tracking-[0.25em] text-gold/70">Consulta do jogador</p>
      <h2 className="font-display text-2xl sm:text-3xl text-gold-bright mt-1">Atributos e Habilidades</h2>
      <p className="mt-2 text-sm text-parchment-dim">Atributos representam capacidades naturais do personagem; Habilidades representam treinamento, prática e conhecimento. Em um teste, o Mestre combina o Atributo e a Habilidade que melhor descrevem a forma como a ação está sendo realizada.</p>
    </div>
    <section>
      <div className="flex items-center gap-2 mb-3"><Brain className="w-5 h-5 text-gold"/><h3 className="font-display text-xl text-gold-bright">Atributos</h3></div>
      <div className="grid md:grid-cols-3 gap-4">{ATTRIBUTE_GROUPS.map(group => <article key={group.name} className="rounded-xl border border-gold-dim bg-gradient-card p-4">
        <h4 className="font-display text-lg text-gold mb-3">{group.name}</h4>
        <div className="space-y-3">{group.attributes.map(attribute => <div key={attribute.name} className="rounded-lg border border-gold-dim/60 bg-shadow/30 p-3">
          <div className="font-display text-gold-bright">{attribute.name}</div>
          <p className="mt-1 text-sm text-parchment-dim">{attribute.description}</p>
          <p className="mt-2 text-xs text-gold/85"><b>Útil para:</b> {attribute.examples}</p>
        </div>)}</div>
      </article>)}</div>
    </section>
    <section>
      <div className="flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-gold"/><h3 className="font-display text-xl text-gold-bright">Habilidades</h3></div>
      <div className="grid lg:grid-cols-2 gap-4">{SKILL_GROUPS.map(group => <article key={group.name} className="rounded-xl border border-gold-dim bg-gradient-card p-4">
        <h4 className="font-display text-lg text-gold mb-3">{group.name}</h4>
        <div className="grid sm:grid-cols-2 gap-2">{group.skills.map(skill => <div key={skill.name} className="rounded-lg border border-gold-dim/50 bg-shadow/25 p-3">
          <div className="font-display text-sm text-gold-bright">{skill.name}</div>
          <p className="mt-1 text-xs leading-relaxed text-parchment-dim">{skill.description}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-gold/80"><b>Útil para:</b> {skill.examples}</p>
        </div>)}</div>
      </article>)}</div>
    </section>
  </div>;
}

function ReferenceOverlay({ view, onClose, player, races }: { view: Exclude<ReferenceView, null>; onClose: () => void; player: Player; races: RaceDefinition[] }) {
  const title = view === 'regras' ? 'Regras' : view === 'povos' ? 'Povos e Vertentes' : view === 'classes' ? 'Progressão' : view === 'atributos' ? 'Atributos e Habilidades' : 'Itens';
  return <div className="fixed inset-0 z-[65] bg-black/80 p-2 sm:p-5 flex items-center justify-center">
    <div className="w-full max-w-6xl h-[94vh] overflow-hidden rounded-2xl border border-gold bg-stone shadow-2xl flex flex-col">
      <div className="shrink-0 border-b border-gold-dim bg-shadow/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Biblioteca do jogador</p><h2 className="font-display text-xl text-gold-bright">{title}</h2></div>
        <button type="button" onClick={onClose} className="trilha-sheet-close" aria-label="Fechar consulta"><X className="w-5 h-5"/></button>
      </div>
      <div className="overflow-y-auto flex-1 p-4 sm:p-6">
        {view === 'regras' && <RulesPanel playerName={player.player_name || player.alcunha}/>} 
        {view === 'povos' && <AncestryReference races={races}/>} 
        {view === 'classes' && <PublicClassesReference/>}
        {view === 'atributos' && <AttributeSkillsReference/>}
        {view === 'itens' && <CatalogPage playerId={player.id} isMaster={false}/>} 
      </div>
    </div>
  </div>;
}

export default function PlayerPage({ player, onLogout, onCreateCharacter, masterMode = false, masterCharacter = null, onMasterClose, onMasterEdit }: PlayerPageProps) {
    const isMaster = player.player_identifier === 'Mestre';
    const [characters, setCharacters] = useState<Character[]>([]), [charactersLoading, setCharactersLoading] = useState(true), [selectedCharacter, setSelectedCharacter] = useState<Character | null>(masterCharacter || null), [tab, setTab] = useState<Tab>('ficha');
    const [notes, setNotes] = useState<PersonalNote[]>([]), [notesContent, setNotesContent] = useState(''), [notesLoading, setNotesLoading] = useState(false), [notesSaving, setNotesSaving] = useState(false), [notesSaved, setNotesSaved] = useState(false);
    const [masterMessages, setMasterMessages] = useState<MasterMessage[]>([]), [playerMessages, setPlayerMessages] = useState<PlayerMessage[]>([]), [recadoText, setRecadoText] = useState(''), [recadoSending, setRecadoSending] = useState(false), [suggestionOpen, setSuggestionOpen] = useState(false), [suggestionText, setSuggestionText] = useState(''), [suggestionSending, setSuggestionSending] = useState(false), [suggestionSent, setSuggestionSent] = useState(false);
    const [items, setItems] = useState<Item[]>([]), [conditions, setConditions] = useState<Condition[]>([]), [effects, setEffects] = useState<Effect[]>([]), [contacts, setContacts] = useState<Contact[]>([]), [factions, setFactions] = useState<Faction[]>([]), [reputations, setReputations] = useState<Reputation[]>([]), [objectives, setObjectives] = useState<Objective[]>([]), [events, setEvents] = useState<Event[]>([]), [diary, setDiary] = useState<DiaryEntry[]>([]);
    const [diaryTitle, setDiaryTitle] = useState(''), [diaryContent, setDiaryContent] = useState(''), [diarySession, setDiarySession] = useState(''), [diarySaving, setDiarySaving] = useState(false);
    const [editingHistory, setEditingHistory] = useState(false), [historyDraft, setHistoryDraft] = useState<Record<string, string>>({}), [saving, setSaving] = useState(false), [uploading, setUploading] = useState(false);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]), [allCharacters, setAllCharacters] = useState<Character[]>([]);
    const [ancestryRaces, setAncestryRaces] = useState<RaceDefinition[]>([]);
    const [equipmentSummary, setEquipmentSummary] = useState<CombatEquipmentSummary | null>(null);
    const [rollingAttack, setRollingAttack] = useState(false), [attackRollError, setAttackRollError] = useState('');
    const [combatTargets, setCombatTargets] = useState<CombatTarget[]>([]), [selectedTargetId, setSelectedTargetId] = useState('');
    const [pendingDefenses, setPendingDefenses] = useState<CombatAction[]>([]), [combatBusy, setCombatBusy] = useState(false);
    const [referenceView, setReferenceView] = useState<ReferenceView>(null);
    const loadCharacters = useCallback(async () => { if (masterMode) {
        setCharactersLoading(false);
        return;
    } setCharactersLoading(true); const { data } = await supabase.from('characters').select('*').eq('player_id', player.id).order('created_at', { ascending: true }); setCharacters((data || []) as Character[]); setCharactersLoading(false); }, [player.id, masterMode]);
    const loadNotes = useCallback(async () => { setNotesLoading(true); const { data } = await supabase.from('personal_notes').select('*').eq('player_id', player.id).order('updated_at', { ascending: false }); setNotes(data || []); if (data?.length)
        setNotesContent(data[0].content); setNotesLoading(false); }, [player.id]);
    const loadMasterMessages = useCallback(async () => { const [received, sent] = await Promise.all([supabase.from('master_messages').select('*').eq('player_id', player.id).order('created_at', { ascending: false }), supabase.from('player_messages').select('*').eq('player_id', player.id).order('created_at', { ascending: false })]); setMasterMessages((received.data || []) as MasterMessage[]); setPlayerMessages((sent.data || []) as PlayerMessage[]); }, [player.id]);
    const loadMasterData = useCallback(async () => { if (!isMaster)
        return; const [p, c] = await Promise.all([supabase.from('players').select('*').order('player_name'), supabase.from('characters').select('*').order('created_at')]); setAllPlayers((p.data || []) as Player[]); setAllCharacters((c.data || []) as Character[]); }, [isMaster]);
    useEffect(() => { loadCharacters(); loadNotes(); loadMasterMessages(); loadMasterData(); }, [loadCharacters, loadNotes, loadMasterMessages, loadMasterData]);
    useEffect(() => { if (masterMode && masterCharacter) {
        setSelectedCharacter(masterCharacter);
        setTab('ficha');
    } }, [masterMode, masterCharacter]);
    useEffect(() => { (async () => { const [rr, ll] = await Promise.all([supabase.from('races').select('*').order('name'), supabase.from('lineages').select('*').order('name')]); if (rr.data) {
        const lineages = (ll.data || []) as any[];
        setAncestryRaces((rr.data as any[]).map(r => ({ ...r, lineages: lineages.filter(l => l.race_id === r.id) })) as RaceDefinition[]);
    } })(); }, []);
    const loadRelations = useCallback(async (id: string) => { const tables = ['character_items', 'character_conditions', 'character_effects', 'character_contacts', 'character_factions', 'character_reputations', 'character_objectives', 'character_events', 'character_diary'] as const; const r = await Promise.all(tables.map(t => supabase.from(t).select('*').eq('character_id', id).order('created_at', { ascending: true }))); setItems((r[0].data || []) as Item[]); setConditions((r[1].data || []) as Condition[]); setEffects((r[2].data || []) as Effect[]); setContacts((r[3].data || []) as Contact[]); setFactions((r[4].data || []) as Faction[]); setReputations((r[5].data || []) as Reputation[]); setObjectives((r[6].data || []) as Objective[]); setEvents((r[7].data || []) as Event[]); setDiary((r[8].data || []) as DiaryEntry[]); }, []);
    const loadCombatEquipment = useCallback(async (id: string) => { const { data, error } = await supabase.rpc('get_character_combat_equipment_summary', { p_character_id: id }); if (error) {
        console.error(error);
        setEquipmentSummary(null);
    }
    else
        setEquipmentSummary(((data || [])[0] || null) as CombatEquipmentSummary | null); }, []);
    const loadCombatTargets = useCallback(async (id: string) => { const { data, error } = await supabase.rpc('get_combat_targets', { p_character_id: id }); if (error) {
        console.error(error);
        setCombatTargets([]);
        return;
    } setCombatTargets((data || []) as CombatTarget[]); }, []);
    const loadPendingDefenses = useCallback(async (id: string) => { const { data, error } = await supabase.from('combat_actions').select('*').eq('target_character_id', id).eq('status', 'awaiting_defense').order('created_at', { ascending: true }); if (error) {
        console.error(error);
        setPendingDefenses([]);
        return;
    } setPendingDefenses((data || []) as CombatAction[]); }, []);
    const reloadSelectedCharacter = useCallback(async (id: string) => { const { data } = await supabase.from('characters').select('*').eq('id', id).maybeSingle(); if (!data) return; const c = data as Character; setSelectedCharacter(current => current?.id === id ? c : current); setCharacters(xs => xs.map(x => x.id === c.id ? c : x)); }, []);
    useEffect(() => { setSelectedTargetId(''); }, [selectedCharacter?.id]);
    useEffect(() => { if (selectedCharacter) {
        loadRelations(selectedCharacter.id);
        loadCombatEquipment(selectedCharacter.id);
        loadCombatTargets(selectedCharacter.id);
        loadPendingDefenses(selectedCharacter.id);
    }
    else {
        setEquipmentSummary(null);
        setCombatTargets([]);
        setPendingDefenses([]);
    } }, [selectedCharacter?.id, loadRelations, loadCombatEquipment, loadCombatTargets, loadPendingDefenses]);
    useEffect(() => {
        if (!selectedCharacter) return;
        const id = selectedCharacter.id;
        const channel = supabase.channel(`trilha-combate-personagem-${id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_actions', filter: `target_character_id=eq.${id}` }, (payload) => {
                loadPendingDefenses(id);
                const next = payload.new as Partial<CombatAction>;
                if (next.status === 'resolved' || next.status === 'void') reloadSelectedCharacter(id);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_actions', filter: `attacker_character_id=eq.${id}` }, () => {
                reloadSelectedCharacter(id);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedCharacter?.id, loadPendingDefenses, reloadSelectedCharacter]);
    const patchCharacter = async (patch: Partial<Character>) => { if (!selectedCharacter)
        return; setSaving(true); let query = supabase.from('characters').update(patch).eq('id', selectedCharacter.id); if (!masterMode)
        query = query.eq('player_id', player.id); const { data, error } = await query.select().single(); if (error)
        alert(error.message); if (!error && data) {
        const c = data as Character;
        setSelectedCharacter(c);
        setCharacters(xs => xs.map(x => x.id === c.id ? c : x));
    } setSaving(false); };
    const adjustResource = async (kind: 'current_hp' | 'current_mp', delta: number) => { if (!selectedCharacter || saving)
        return; const max = kind === 'current_hp' ? maxHp(selectedCharacter) : maxMp(selectedCharacter); const current = kind === 'current_hp' ? (selectedCharacter.current_hp ?? max) : (selectedCharacter.current_mp ?? max); const next = Math.max(0, Math.min(max, current + delta)); if (next === current)
        return; await patchCharacter({ [kind]: next } as Partial<Character>); };
    const cropThumbnailToThreeByFour = async (file: File) => { const url = URL.createObjectURL(file); try {
        const image = await new Promise<HTMLImageElement>((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
        const targetRatio = 3 / 4;
        let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
        if (sw / sh > targetRatio) {
            sw = sh * targetRatio;
            sx = (image.naturalWidth - sw) / 2;
        }
        else {
            sh = sw / targetRatio;
            sy = (image.naturalHeight - sh) / 2;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 1200;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Canvas indisponível');
        ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Falha ao preparar miniatura')), 'image/jpeg', .9));
    }
    finally {
        URL.revokeObjectURL(url);
    } };
    const uploadThumbnail = async (file?: File) => { if (!file || !selectedCharacter)
        return; if (!file.type.startsWith('image/'))
        return; setUploading(true); try {
        const cropped = await cropThumbnailToThreeByFour(file);
        const path = `${selectedCharacter.id}/miniatura.jpg`;
        const { error } = await supabase.storage.from('character-thumbnails').upload(path, cropped, { upsert: true, contentType: 'image/jpeg' });
        if (!error) {
            const { data } = supabase.storage.from('character-thumbnails').getPublicUrl(path);
            await patchCharacter({ thumbnail_url: `${data.publicUrl}?v=${Date.now()}` });
        }
    }
    finally {
        setUploading(false);
    } };
    const saveHistory = async () => { if (!selectedCharacter)
        return; const keys = ['nickname', 'gender', 'height', 'weight', 'appearance', 'distinctive_marks', 'origin', 'previous_occupation', 'personality', 'ideals', 'motivation', 'important_bond', 'brief_history', 'additional_characteristics'] as const; const patch: Record<string, string | null> = {}; keys.forEach(k => patch[k] = historyDraft[k]?.trim() || null); await patchCharacter(patch as Partial<Character>); setEditingHistory(false); };
    const startHistory = () => { if (!selectedCharacter)
        return; const d: Record<string, string> = {}; ['nickname', 'gender', 'height', 'weight', 'appearance', 'distinctive_marks', 'origin', 'previous_occupation', 'personality', 'ideals', 'motivation', 'important_bond', 'brief_history', 'additional_characteristics'].forEach(k => d[k] = String((selectedCharacter as unknown as Record<string, unknown>)[k] ?? '')); setHistoryDraft(d); setEditingHistory(true); };
    const addRow = async (table: string, row: Record<string, unknown>) => { if (!selectedCharacter)
        return; await supabase.from(table).insert({ character_id: selectedCharacter.id, ...row }); await loadRelations(selectedCharacter.id); };
    const deleteRow = async (table: string, id: string) => { if (!selectedCharacter)
        return; await supabase.from(table).delete().eq('id', id).eq('character_id', selectedCharacter.id); await loadRelations(selectedCharacter.id); };
    const setItemSlot = async (item: Item, slot: string | null) => { if (!selectedCharacter)
        return; const { error } = await supabase.rpc('set_character_item_slot', { p_player_id: player.id, p_character_id: selectedCharacter.id, p_item_id: item.id, p_slot: slot }); if (error) {
        alert(error.message);
        return;
    } await Promise.all([loadRelations(selectedCharacter.id), loadCombatEquipment(selectedCharacter.id)]); };
    const consumeItem = async (item: Item) => { if (!selectedCharacter)
        return; const { error } = await supabase.rpc('consume_character_item', { p_player_id: player.id, p_character_id: selectedCharacter.id, p_item_id: item.id }); if (error) {
        alert(error.message);
        return;
    } const { data } = await supabase.from('characters').select('*').eq('id', selectedCharacter.id).single(); if (data) {
        const c = data as Character;
        setSelectedCharacter(c);
        setCharacters(xs => xs.map(x => x.id === c.id ? c : x));
    } await Promise.all([loadRelations(selectedCharacter.id), loadCombatEquipment(selectedCharacter.id)]); };
    const rollAttack = async () => {
        if (!selectedCharacter || rollingAttack) return;
        if (!selectedTargetId) { setAttackRollError('Selecione um alvo antes de atacar.'); return; }
        setAttackRollError('');
        setRollingAttack(true);
        const { error } = await supabase.rpc('roll_character_attack', { p_player_id: player.id, p_character_id: selectedCharacter.id, p_target_character_id: selectedTargetId });
        if (error) setAttackRollError(error.message || 'Não foi possível realizar o ataque.');
        else await reloadSelectedCharacter(selectedCharacter.id);
        setRollingAttack(false);
    };
    const defendCombat = async (action: CombatAction, kind: 'evasion' | 'block' | 'passive') => {
        if (!selectedCharacter || combatBusy) return;
        setCombatBusy(true);
        setAttackRollError('');
        const { error } = await supabase.rpc('defend_combat_action', { p_player_id: player.id, p_character_id: selectedCharacter.id, p_combat_action_id: action.id, p_defense_kind: kind });
        if (error) setAttackRollError(error.message || 'Não foi possível registrar a defesa.');
        await Promise.all([loadPendingDefenses(selectedCharacter.id), reloadSelectedCharacter(selectedCharacter.id), loadCombatEquipment(selectedCharacter.id)]);
        setCombatBusy(false);
    };
    const startTurn = async () => {
        if (!selectedCharacter || combatBusy) return;
        setCombatBusy(true);
        const { error } = await supabase.rpc('start_character_turn', { p_player_id: player.id, p_character_id: selectedCharacter.id });
        if (error) setAttackRollError(error.message || 'Não foi possível iniciar o turno.');
        else await reloadSelectedCharacter(selectedCharacter.id);
        setCombatBusy(false);
    };
    const spendMovement = async () => {
        if (!selectedCharacter || combatBusy) return;
        setCombatBusy(true);
        const { error } = await supabase.rpc('spend_character_movement', { p_player_id: player.id, p_character_id: selectedCharacter.id });
        if (error) setAttackRollError(error.message || 'Não foi possível registrar o movimento.');
        else await reloadSelectedCharacter(selectedCharacter.id);
        setCombatBusy(false);
    };
    const addJourney = async (table: string) => { const configs: Record<string, [
        string,
        string
    ]> = { character_contacts: ['name', 'Nome do contato/aliado'], character_factions: ['faction_name', 'Nome da facção'], character_reputations: ['group_or_place', 'Grupo ou lugar'], character_objectives: ['objective', 'Objetivo'], character_events: ['title', 'Título do acontecimento'] }; const cfg = configs[table]; const main = prompt(`${cfg[1]}:`); if (!main)
        return; const notes = prompt('Observações/descrição (opcional):') || null; const row: Record<string, unknown> = { [cfg[0]]: main }; if (table === 'character_contacts' || table === 'character_factions')
        row[table === 'character_contacts' ? 'notes' : 'notes'] = notes; if (table === 'character_reputations')
        row.notes = notes; if (table === 'character_objectives') {
        row.notes = notes;
        row.status = 'active';
    } if (table === 'character_events')
        row.description = notes; await addRow(table, row); };
    const editJourney = async (table: string, id: string, currentTitle: string, currentNotes: string) => { if (!selectedCharacter)
        return; const configs: Record<string, string> = { character_contacts: 'name', character_factions: 'faction_name', character_reputations: 'group_or_place', character_objectives: 'objective', character_events: 'title' }; const title = prompt('Nome/Título:', currentTitle); if (!title)
        return; const notes = prompt('Observações/descrição:', currentNotes); if (notes === null)
        return; const patch: Record<string, unknown> = { [configs[table]]: title }; if (table === 'character_events')
        patch.description = notes || null;
    else
        patch.notes = notes || null; await supabase.from(table).update(patch).eq('id', id).eq('character_id', selectedCharacter.id); await loadRelations(selectedCharacter.id); };
    const addDiary = async () => { if (!selectedCharacter || !diaryTitle.trim() || !diaryContent.trim() || diarySaving)
        return; setDiarySaving(true); await addRow('character_diary', { title: diaryTitle.trim(), content: diaryContent.trim(), session_reference: diarySession.trim() || null }); setDiaryTitle(''); setDiaryContent(''); setDiarySession(''); setDiarySaving(false); };
    const editDiary = async (d: DiaryEntry) => { if (!selectedCharacter)
        return; const title = prompt('Título:', d.title); if (!title)
        return; const content = prompt('Conteúdo:', d.content); if (content === null)
        return; await supabase.from('character_diary').update({ title, content, updated_at: new Date().toISOString() }).eq('id', d.id); await loadRelations(selectedCharacter.id); };
    const handleSaveNotes = async () => { if (notesSaving)
        return; setNotesSaving(true); setNotesSaved(false); if (notes.length) {
        await supabase.from('personal_notes').update({ content: notesContent, updated_at: new Date().toISOString() }).eq('id', notes[0].id);
    }
    else {
        const { data } = await supabase.from('personal_notes').insert({ player_id: player.id, content: notesContent }).select().single();
        if (data)
            setNotes([data]);
    } setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); setNotesSaving(false); };
    const handleSendRecado = async () => {
        const content = recadoText.trim();
        if (!content || recadoSending) return;
        setRecadoSending(true);
        const { error } = await supabase.from('player_messages').insert({ player_id: player.id, content });
        if (error) alert(`Não foi possível enviar o recado: ${error.message}`);
        else { setRecadoText(''); await loadMasterMessages(); }
        setRecadoSending(false);
    };
    const handleSendSuggestion = async () => { if (!suggestionText.trim() || suggestionSending)
        return; setSuggestionSending(true); await supabase.from('suggestions').insert({ player_id: player.id, content: suggestionText.trim() }); setSuggestionText(''); setSuggestionSent(true); setTimeout(() => { setSuggestionSent(false); setSuggestionOpen(false); }, 1500); setSuggestionSending(false); };
    const authorizePlayer = async (p: Player, allowed: boolean) => { await supabase.from('players').update({ character_creation_allowed: allowed }).eq('id', p.id); await loadMasterData(); };
    const changeStatus = async (c: Character, status: Character['status']) => { await supabase.from('characters').update({ status }).eq('id', c.id); await loadMasterData(); if (c.player_id === player.id)
        await loadCharacters(); };
    const canCreate = characters.length === 0 || Boolean(player.character_creation_allowed) || isMaster;
    const tabs: [
        Tab,
        string
    ][] = [['ficha', 'Ficha'], ['combate', 'Combate'], ['inventario', 'Inventário'], ['historia', 'História'], ['jornada', 'Jornada'], ['diario', 'Diário'], ['classes', 'Progressão'], ['catalogo', 'Catálogo'], ['regras', 'Regras']];
    const classUnlockCounts = useMemo(() => Object.fromEntries((masterMode && masterCharacter ? [masterCharacter] : characters).map(character => {
        const paths = visibleClassPaths(character.attributes || {});
        const available = paths.filter(path => classPathMeetsRequirements(path, character.attributes || {}, character.skills || {})).length;
        return [character.id, available];
    })), [characters, masterMode, masterCharacter]);
    const selectedUnlockCount = selectedCharacter ? (classUnlockCounts[selectedCharacter.id] || 0) : 0;
    const hungerMaximum = selectedCharacter ? hungerMax(selectedCharacter) : 0;
    const currentHunger = selectedCharacter ? (selectedCharacter.current_hunger ?? hungerMaximum) : 0;
    const currentThirst = selectedCharacter ? (selectedCharacter.current_thirst ?? 6) : 0;
    const armorAbsorption = equipmentSummary?.armor_effective_absorption ?? 0;
    const evasionPenalty = (equipmentSummary?.armor_evasion_penalty ?? 0) + (equipmentSummary?.shield_evasion_penalty ?? 0);
    const movementPenalty = (equipmentSummary?.armor_movement_penalty ?? 0) + (equipmentSummary?.shield_movement_penalty ?? 0);
    const blockAttribute = equipmentSummary?.shield_name ? (equipmentSummary.shield_block_attribute || 'Força') : 'Força';
    const currentEvasion = selectedCharacter ? Math.max(0, v(selectedCharacter, 'Agilidade') + s(selectedCharacter, 'Defesa') - evasionPenalty) : 0;
    const currentBlock = selectedCharacter ? v(selectedCharacter, blockAttribute) + s(selectedCharacter, 'Defesa') + (equipmentSummary?.shield_effective_bonus ?? 0) : 0;
    const currentMovement = selectedCharacter ? Math.max(1, movement(selectedCharacter) - movementPenalty) : 0;
    const combatItems = items.filter(i => i.weapon_id || i.armor_id || i.shield_id);
    const equippedWeaponItem = equipmentSummary?.weapon_item_id ? items.find(i => i.id === equipmentSummary.weapon_item_id) : undefined;
    const equippedWeaponBroken = equippedWeaponItem?.durability_current === 0;
    const activeEffects = effects.filter(e => e.active !== false);
    const calcCards = selectedCharacter ? [
        ['PV', `${selectedCharacter.current_hp ?? maxHp(selectedCharacter)} / ${maxHp(selectedCharacter)}`, <>PV Máximo = 15 + (Vigor × 5) + ((Nível − 1) × 2). Seu máximo: <b>{maxHp(selectedCharacter)}</b>.</>],
        ['PM', `${selectedCharacter.current_mp ?? maxMp(selectedCharacter)} / ${maxMp(selectedCharacter)}`, <>5 + (Maior Mental × 2) + (Maior Mística × 2) + Nível. Sem habilidade mística, PM Máximo = 0. Seu máximo: <b>{maxMp(selectedCharacter)}</b>.</>],
        ['Evasão', String(currentEvasion), <>Agilidade + Defesa − penalidades de equipamento = <b>{currentEvasion}</b>.</>],
        ['Bloqueio', String(currentBlock), <>{blockAttribute} + Defesa + bônus efetivo do escudo = <b>{currentBlock}</b>.</>],
        ['Def. Passiva', String(Math.floor(s(selectedCharacter, 'Defesa') / 2)), <>Defesa ÷ 2, arredondado para baixo = <b>{Math.floor(s(selectedCharacter, 'Defesa') / 2)}</b> sucesso(s) automático(s).</>],
        ['Iniciativa', String(v(selectedCharacter, 'Percepção') + v(selectedCharacter, 'Raciocínio')), <>Percepção + Raciocínio = <b>{v(selectedCharacter, 'Percepção') + v(selectedCharacter, 'Raciocínio')}</b>.</>],
        ['Deslocamento', `${currentMovement} m`, <>Deslocamento base menos penalidades de equipamento = <b>{currentMovement} m</b>.</>],
        ['Absorção', String(armorAbsorption), <>Absorção efetiva da armadura equipada = <b>{armorAbsorption}</b>.</>]
    ] : [];
    return <div className="min-h-screen bg-gradient-fantasy animate-fade-in">
    {!masterMode && <>
    <header className="sticky top-0 z-20 bg-shadow/80 backdrop-blur-md border-b border-gold-dim"><div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-card border border-gold-dim flex items-center justify-center"><User className="w-5 h-5 text-gold"/></div><h1 className="font-display text-lg sm:text-xl text-gold-bright">Bem-vindo, {player.player_name || player.alcunha}</h1></div><button onClick={onLogout} className="flex items-center gap-2 text-parchment-dim hover:text-blood text-sm"><LogOut className="w-4 h-4"/>Sair</button></div></header>
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <section className="trilha-player-reference">
        <div className="trilha-player-section-title"><BookOpen className="w-5 h-5"/><h2 className="font-display">Biblioteca do Jogador</h2><i /></div>
        <p className="text-sm text-parchment-dim mb-4">Consulte o sistema antes de escolher um personagem. Informações que dependem de descoberta continuam ocultas.</p>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            ['regras', 'Regras', BookOpen, 'Como testes, recursos e ações funcionam.'],
            ['povos', 'Povos e Vertentes', UsersRound, 'Culturas, linhagens e costumes de nomeação.'],
            ['classes', 'Progressão', Route, 'Veja seu título de Aprendiz e os caminhos iniciais ligados aos maiores Atributos.'],
            ['atributos', 'Atributos e Habilidades', Brain, 'Veja a utilidade de cada atributo e habilidade.'],
            ['itens', 'Itens', Package, 'Catálogo público de equipamentos e objetos.'],
          ].map(([id, label, Icon, description]) => { const C = Icon as typeof BookOpen; return <button key={String(id)} type="button" onClick={() => setReferenceView(id as Exclude<ReferenceView, null>)} className="group min-h-28 rounded-xl border border-gold-dim bg-gradient-card p-4 text-left hover:border-gold transition">
            <div className="flex items-center justify-between gap-2"><C className="w-5 h-5 text-gold"/><span className="text-gold/60 group-hover:text-gold">→</span></div>
            <h3 className="font-display text-gold-bright mt-3">{String(label)}</h3><p className="mt-1 text-xs leading-relaxed text-parchment-dim">{String(description)}</p>
          </button>; })}
        </div>
      </section>
      <div className="divider-gold"/>
      <section className="trilha-player-characters"><div className="trilha-player-section-title"><Scroll className="w-5 h-5"/><h2 className="font-display">Meus Personagens</h2><i /></div>{charactersLoading ? <div className="trilha-player-loading"><Loader2 className="w-6 h-6 animate-spin"/></div> : characters.length === 0 ? <div className="trilha-player-empty">Você ainda não possui personagens.</div> : <div className="trilha-character-grid">{characters.map(c => <button key={c.id} onClick={() => { setSelectedCharacter(c); setTab('ficha'); }} className="trilha-character-card"><div className="trilha-character-card-portrait">{c.thumbnail_url ? <img src={c.thumbnail_url} alt={`Miniatura de ${c.name}`}/> : <User className="w-10 h-10"/>}<span className="trilha-character-level">Nv. {c.level}</span></div><div className="trilha-character-card-body"><h3 className="font-display">{c.name}</h3>{c.nickname && <p className="trilha-character-nickname">“{c.nickname}”</p>}<div className="trilha-character-card-rule"/><p className="trilha-character-lineage">{c.is_hybrid && c.secondary_race ? `Híbrido: ${c.race}/${c.secondary_race}` : `${c.race} · ${c.lineage}`}</p><p className="trilha-character-stage">{stageForLevel(c.level, c)} · {statusLabel(c.status)}</p>{(classUnlockCounts[c.id] || 0) > 0 && <div className="mt-2 flex flex-wrap items-center gap-1" title={`${classUnlockCounts[c.id]} possibilidade(s) de evolução percebida(s). As identidades continuam ocultas.`}><span className="mr-1 text-[10px] uppercase tracking-[.14em] text-gold/70">Caminhos</span>{Array.from({ length: classUnlockCounts[c.id] }, (_, i) => <span key={i} className="text-gold-bright text-sm" aria-hidden="true">✦</span>)}</div>}<span className="trilha-open-sheet">Abrir ficha <b>→</b></span></div></button>)}</div>}<div className="trilha-create-character">{canCreate ? <button onClick={onCreateCharacter}><Plus className="w-4 h-4"/>Criar novo personagem</button> : <div><Lock className="w-4 h-4"/>Novo personagem requer autorização do Mestre.</div>}</div></section>

      {isMaster && <><div className="divider-gold"/><section><h2 className="font-display text-xl text-gold-bright mb-4">Painel do Mestre</h2><div className="grid lg:grid-cols-2 gap-4"><div className="bg-gradient-card border border-gold-dim rounded-xl p-5"><h3 className="font-display text-gold mb-3">Autorizar novo personagem</h3><div className="space-y-2">{allPlayers.filter(p => p.id !== player.id).map(p => <div key={p.id} className="flex items-center justify-between bg-shadow/40 rounded-lg p-3"><span className="text-sm">{p.player_name || p.alcunha}</span><button onClick={() => authorizePlayer(p, !p.character_creation_allowed)} className="text-xs text-gold flex gap-1">{p.character_creation_allowed ? <><Ban className="w-4 h-4"/>Revogar</> : <><Check className="w-4 h-4"/>Autorizar</>}</button></div>)}</div></div><div className="bg-gradient-card border border-gold-dim rounded-xl p-5"><h3 className="font-display text-gold mb-3">Status dos personagens</h3><div className="space-y-2">{allCharacters.map(c => <div key={c.id} className="flex items-center justify-between gap-3 bg-shadow/40 rounded-lg p-3"><span className="text-sm">{c.name}</span><select value={c.status || 'vivo'} onChange={e => changeStatus(c, e.target.value as Character['status'])} className="bg-shadow border border-gold-dim rounded px-2 py-1 text-xs text-parchment"><option value="vivo">Vivo</option><option value="morto">Morto</option><option value="desaparecido">Desaparecido</option></select></div>)}</div></div></div></section></>}

      <div className="divider-gold"/><section><div className="flex items-center gap-3 mb-4"><Scroll className="w-5 h-5 text-gold"/><h2 className="font-display text-xl text-gold-bright">Anotações Pessoais</h2></div><div className="trilha-player-paper border border-gold-dim rounded-xl p-4 sm:p-6 shadow-gold">{notesLoading ? <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto"/> : <><textarea value={notesContent} onChange={e => setNotesContent(e.target.value)} rows={5} className={`${field} resize-y`} placeholder="Escreva seus lembretes aqui..."/><div className="flex justify-end mt-3"><button onClick={handleSaveNotes} disabled={notesSaving} className="flex gap-2 text-sm text-gold"><Save className="w-4 h-4"/>{notesSaved ? 'Salvo!' : 'Salvar'}</button></div></>}</div></section>
      <div className="divider-gold"/><section>
        <div className="flex items-center gap-3 mb-4"><MessageSquare className="w-5 h-5 text-gold"/><h2 className="font-display text-xl text-gold-bright">Recados</h2></div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="trilha-player-paper border border-gold-dim rounded-xl p-5 shadow-gold">
            <h3 className="font-display text-gold-bright mb-3">Recebidos do Mestre</h3>
            {masterMessages.length === 0 ? <Empty>Nenhum recado recebido.</Empty> : masterMessages.map(m => <div key={m.id} className="bg-shadow/40 border border-gold-dim rounded-lg p-4 mb-2"><p className="text-sm whitespace-pre-wrap">{m.content}</p><p className="mt-2 text-[10px] text-parchment-dim">{new Date(m.created_at).toLocaleString('pt-BR')}</p></div>)}
          </div>
          <div className="trilha-player-paper border border-gold-dim rounded-xl p-5 shadow-gold">
            <h3 className="font-display text-gold-bright mb-3">Enviar ao Mestre</h3>
            <textarea value={recadoText} onChange={e => setRecadoText(e.target.value)} rows={3} maxLength={2000} className={`${field} resize-y`} placeholder="Escreva um recado para o Mestre..."/>
            <button onClick={handleSendRecado} disabled={recadoSending || !recadoText.trim()} className="mt-3 flex gap-2 bg-gradient-gold text-stone px-4 py-2 rounded-lg disabled:opacity-40"><Send className="w-4 h-4"/>{recadoSending ? 'Enviando...' : 'Enviar recado'}</button>
            <div className="mt-5 border-t border-gold-dim/40 pt-4"><h4 className="font-display text-sm text-gold mb-2">Enviados</h4>{playerMessages.length === 0 ? <Empty>Nenhum recado enviado.</Empty> : playerMessages.map(m => <div key={m.id} className="bg-shadow/30 border border-gold-dim/60 rounded-lg p-3 mb-2"><p className="text-sm whitespace-pre-wrap">{m.content}</p><p className="mt-2 text-[10px] text-parchment-dim">{new Date(m.created_at).toLocaleString('pt-BR')}</p></div>)}</div>
          </div>
        </div>
      </section>
      <div className="divider-gold"/><section>{!suggestionOpen ? <button onClick={() => setSuggestionOpen(true)} className="flex gap-2 text-parchment-dim/60 hover:text-gold text-sm"><Lightbulb className="w-4 h-4"/>Enviar sugestão</button> : <div className="trilha-player-paper border border-gold-dim rounded-xl p-5"><div className="flex justify-between"><h3 className="font-display text-gold">Enviar Sugestão</h3><button onClick={() => setSuggestionOpen(false)}><X className="w-4 h-4"/></button></div>{suggestionSent ? <p className="text-gold mt-3">Sugestão enviada.</p> : <><textarea value={suggestionText} onChange={e => setSuggestionText(e.target.value)} rows={4} className={`${field} mt-3`}/><button onClick={handleSendSuggestion} disabled={suggestionSending || !suggestionText.trim()} className="mt-3 flex gap-2 bg-gradient-gold text-stone px-4 py-2 rounded-lg"><Send className="w-4 h-4"/>Enviar</button></>}</div>}</section>
    </main>
    </>}

    {!masterMode && referenceView && <ReferenceOverlay view={referenceView} onClose={() => setReferenceView(null)} player={player} races={ancestryRaces}/>}


    {selectedCharacter && <div className="trilha-sheet-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5"><div className="trilha-sheet w-full max-w-6xl h-[95vh] overflow-hidden flex flex-col">
      <div className="trilha-sheet-header relative flex justify-between gap-4">
        <div className="flex gap-4 sm:gap-5 items-center relative z-10">{selectedCharacter.thumbnail_url ? <img src={selectedCharacter.thumbnail_url} className="trilha-portrait w-16 sm:w-20"/> : <div className="trilha-portrait w-16 h-20 sm:w-20 sm:h-24 flex items-center justify-center"><User className="text-[#d7a33d]"/></div>}<div><div className="trilha-kicker">{masterMode ? 'Modo Mestre · Ficha do jogador' : 'Ficha de personagem · TRILHA'}</div><h2 className="trilha-character-name font-display">{selectedCharacter.name}</h2><div className="trilha-character-meta"><span>Nível {selectedCharacter.level}</span><i /> <span>{stageForLevel(selectedCharacter.level, selectedCharacter)}</span><i /> <span>{selectedCharacter.class_name || 'Sem classe'}</span><i /> <span>{statusLabel(selectedCharacter.status)}</span></div><p className="trilha-character-origin">{selectedCharacter.is_hybrid && selectedCharacter.secondary_race ? `Híbrido · ${selectedCharacter.race}/${selectedCharacter.secondary_race}` : `${selectedCharacter.race} · ${selectedCharacter.lineage}`}</p>{selectedUnlockCount > 0 && <div className="mt-2 inline-flex flex-wrap items-center gap-1 rounded-full border border-[#b98032]/45 bg-black/15 px-2.5 py-1" title={`${selectedUnlockCount} possibilidade(s) de evolução percebida(s). Os nomes permanecem ocultos.`}><span className="mr-1 text-[9px] uppercase tracking-[.16em] text-[#d7a33d]/80">Caminhos percebidos</span>{Array.from({ length: selectedUnlockCount }, (_, i) => <span key={i} className="text-[#edc96c] text-sm leading-none" aria-hidden="true">✦</span>)}</div>}<label className="trilha-thumbnail-action inline-flex items-center gap-1 mt-2 cursor-pointer"><ImagePlus className="w-3.5 h-3.5"/>{uploading ? 'Enviando...' : 'Alterar miniatura'}<input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => uploadThumbnail(e.target.files?.[0])}/></label></div></div><div className="relative z-10 flex items-center gap-2">{masterMode && onMasterEdit && <button onClick={() => selectedCharacter && onMasterEdit(selectedCharacter)} className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-[#b98032]/60 px-3 py-2 text-xs text-[#edc96c] hover:border-[#edc96c]"><Pencil className="w-4 h-4"/>Editar como Mestre</button>}<button className="trilha-sheet-close" onClick={() => masterMode ? onMasterClose?.() : setSelectedCharacter(null)} aria-label="Fechar ficha"><X className="w-5 h-5"/></button></div></div>
      <div className="trilha-tabs flex overflow-x-auto">{tabs.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={`trilha-tab whitespace-nowrap font-display ${tab === id ? 'is-active' : ''}`}>{label}</button>)}</div>
      {masterMode && onMasterEdit && <button onClick={() => selectedCharacter && onMasterEdit(selectedCharacter)} className="sm:hidden m-3 mb-0 inline-flex items-center gap-2 rounded-lg border border-gold-dim px-3 py-2 text-xs text-gold"><Pencil className="w-4 h-4"/>Editar como Mestre</button>}
      <div className={`trilha-sheet-content overflow-y-auto flex-1 ${tab !== 'ficha' ? 'trilha-secondary-tab' : ''}`}>
        {tab === 'ficha' && <div className="trilha-ficha space-y-8">
          <section className="rounded-2xl border border-gold-dim bg-shadow/35 p-4 sm:p-5 space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Resumo do personagem</p><h3 className="font-display text-xl text-gold-bright">Estado atual</h3></div><div className="text-xs text-parchment-dim">{selectedCharacter.is_hybrid && selectedCharacter.secondary_race ? `Híbrido · ${selectedCharacter.race}/${selectedCharacter.secondary_race}` : `${selectedCharacter.race} · ${selectedCharacter.lineage}`} · Nível {selectedCharacter.level}</div></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[['Vida', selectedCharacter.current_hp ?? maxHp(selectedCharacter), maxHp(selectedCharacter), ''], ['Mana', selectedCharacter.current_mp ?? maxMp(selectedCharacter), maxMp(selectedCharacter), ''], ['Fome', currentHunger, hungerMaximum, hungerStatus(currentHunger, hungerMaximum)], ['Sede', currentThirst, 6, thirstStatus(currentThirst)]].map(([label, current, max, status]) => <div key={String(label)} className="rounded-xl border border-gold-dim bg-stone/35 p-3"><div className="flex justify-between gap-2 text-xs"><span className="text-gold">{label}</span>{status && <span className="text-parchment-dim">{status}</span>}</div><div className="font-display text-xl text-gold-bright mt-1">{current} <span className="text-sm text-parchment-dim">/ {max}</span></div><div className="h-2 mt-2 rounded-full overflow-hidden bg-shadow border border-gold-dim"><div className="h-full bg-gradient-gold" style={{ width: `${Number(max) > 0 ? (Number(current) / Number(max)) * 100 : 0}%` }}/></div></div>)}</div><div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">{calcCards.slice(2).map(([label, value]) => <div key={String(label)} className="rounded-lg border border-gold-dim/70 bg-shadow/30 p-3"><div className="text-[10px] uppercase tracking-wide text-parchment-dim">{label}</div><div className="font-display text-lg text-gold-bright">{value}</div></div>)}</div><div className="grid md:grid-cols-3 gap-3 text-sm"><div className="rounded-lg border border-gold-dim/60 p-3"><span className="text-xs text-gold">Arma equipada</span><p className="mt-1">{equipmentSummary?.weapon_name || '—'}{equipmentSummary?.weapon_name && <span className="text-parchment-dim"> · Dano {equipmentSummary.weapon_effective_damage}</span>}</p></div><div className="rounded-lg border border-gold-dim/60 p-3"><span className="text-xs text-gold">Proteção</span><p className="mt-1">{equipmentSummary?.armor_name || 'Sem armadura'}{equipmentSummary?.shield_name ? ` · ${equipmentSummary.shield_name}` : ''}</p></div><div className="rounded-lg border border-gold-dim/60 p-3"><span className="text-xs text-gold">Itens à mão</span><p className="mt-1">{[equipmentSummary?.hand1_name, equipmentSummary?.hand2_name].filter(Boolean).join(' · ') || '—'}</p></div></div><div className="grid md:grid-cols-2 gap-3"><div className="rounded-lg border border-gold-dim/60 p-3"><span className="text-xs text-gold">Condições ativas</span><p className="mt-1 text-sm">{conditions.length ? conditions.map(c => c.condition).join(' · ') : 'Nenhuma condição ativa'}</p></div><div className="rounded-lg border border-gold-dim/60 p-3"><span className="text-xs text-gold">Bolsa</span><p className="mt-1 text-sm">{selectedCharacter.currency_obolos ?? 0} Óbolos · {selectedCharacter.currency_dracmas ?? 0} Dracmas · {selectedCharacter.currency_estaters ?? 0} Estaters</p></div></div></section>
          <CollapsibleSection id={`sheet:${selectedCharacter.id}:attributes`} title="Atributos" subtitle="12 capacidades naturais do personagem"><div className="grid md:grid-cols-3 gap-4">{ATTRIBUTE_GROUPS.map(g => <div key={g.name} className="trilha-stat-card"><h4 className="font-display">{g.name}</h4>{g.attributes.map(a => <div key={a.name} className="trilha-stat-row"><span>{a.name}<Tip><b>{a.description}</b><br />{a.examples}</Tip></span><span className="flex items-center gap-2"><Dots base={selectedCharacter.attributes?.[a.name] ?? 0}/></span></div>)}</div>)}</div></CollapsibleSection>
          <CollapsibleSection id={`sheet:${selectedCharacter.id}:skills`} title="Habilidades" subtitle="42 habilidades em três grupos" defaultOpen={false}><div className="grid lg:grid-cols-3 gap-4">{SKILL_GROUPS.map(g => <div key={g.name} className="trilha-skill-card"><h4 className="font-display">{g.name}</h4>{g.skills.map(sk => <div key={sk.name} className="trilha-stat-row"><span>{sk.name}<Tip><b>{sk.description}</b><br />{sk.examples}</Tip></span><span className="flex items-center gap-2"><Dots base={selectedCharacter.skills?.[sk.name] ?? 0}/></span></div>)}</div>)}</div></CollapsibleSection>
          <div className="trilha-lock-note"><Lock className="w-4 h-4"/>Atributos, habilidades e progressão são alterados apenas pelas regras de evolução do personagem.</div>
        </div>}
        {tab === 'combate' && <div className="space-y-6">
          <section className="trilha-combat-turn rounded-xl border border-gold-dim bg-shadow/45 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-[10px] uppercase tracking-[.16em] text-gold/70">Recursos do turno</p><h3 className="font-display text-lg text-gold-bright">Ação · Movimento · Reação</h3></div>
              <button type="button" onClick={startTurn} disabled={combatBusy} className="trilha-combat-turn-reset">Iniciar / renovar turno</button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                ['Ação', selectedCharacter.combat_action_available !== false],
                ['Movimento', selectedCharacter.combat_movement_available !== false],
                ['Reação', selectedCharacter.combat_reaction_available !== false],
              ].map(([label, available]) => <div key={String(label)} className={`trilha-combat-token ${available ? 'is-ready' : 'is-spent'}`}><span>{String(label)}</span><b>{available ? '●' : '○'}</b></div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={spendMovement} disabled={combatBusy || selectedCharacter.combat_movement_available === false} className="trilha-combat-secondary-action">Usar Movimento</button>
              <span className="text-[10px] text-parchment-dim self-center">A Reação retorna quando você inicia novamente o turno.</span>
            </div>
          </section>

          {pendingDefenses.length > 0 && <section className="space-y-3">
            {pendingDefenses.map(action => <div key={action.id} className="trilha-defense-prompt">
              <div className="flex items-start gap-3"><Shield className="w-5 h-5 text-gold mt-0.5"/><div className="min-w-0"><p className="text-[10px] uppercase tracking-[.14em] text-gold/70">Ataque recebido</p><h3 className="font-display text-gold-bright">{action.attacker_name} ataca você</h3><p className="text-xs text-parchment-dim mt-1">{action.weapon_name} · escolha sua defesa.</p></div></div>
              <div className="grid sm:grid-cols-3 gap-2 mt-4">
                <button type="button" disabled={combatBusy || selectedCharacter.combat_reaction_available === false} onClick={() => defendCombat(action, 'evasion')} className="trilha-defense-action"><b>Evadir</b><span>Agilidade + Defesa − penalidades</span></button>
                <button type="button" disabled={combatBusy || selectedCharacter.combat_reaction_available === false || !equipmentSummary?.shield_name} onClick={() => defendCombat(action, 'block')} className="trilha-defense-action"><b>Bloquear</b><span>{equipmentSummary?.shield_name ? `${blockAttribute} + Defesa + escudo` : 'Requer escudo equipado'}</span></button>
                <button type="button" disabled={combatBusy} onClick={() => defendCombat(action, 'passive')} className="trilha-defense-action"><b>Defesa Passiva</b><span>{Math.floor(s(selectedCharacter, 'Defesa') / 2)} sucesso(s) automático(s)</span></button>
              </div>
              {selectedCharacter.combat_reaction_available === false && <p className="mt-2 text-xs text-gold">Sua Reação já foi usada: Evasão e Bloqueio estão indisponíveis; use Defesa Passiva.</p>}
            </div>)}
          </section>}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[['PV', selectedCharacter.current_hp ?? maxHp(selectedCharacter), maxHp(selectedCharacter), 'current_hp'], ['PM', selectedCharacter.current_mp ?? maxMp(selectedCharacter), maxMp(selectedCharacter), 'current_mp']].map(([label, current, max, kind]) => <div key={String(label)} className="bg-shadow/50 border border-gold-dim rounded-xl p-4"><div className="flex justify-between"><span className="text-xs text-gold">{label}</span><b className="font-display text-gold-bright">{current} / {max}</b></div><div className="flex gap-2 mt-3"><button disabled={saving || Number(current) <= 0} onClick={() => adjustResource(kind as 'current_hp' | 'current_mp', -1)} className="flex-1 border border-gold-dim rounded py-1 disabled:opacity-30">−</button><button disabled={saving || Number(current) >= Number(max)} onClick={() => adjustResource(kind as 'current_hp' | 'current_mp', 1)} className="flex-1 border border-gold-dim rounded py-1 disabled:opacity-30">+</button></div></div>)}
            <div className="bg-shadow/50 border border-gold-dim rounded-xl p-4"><span className="text-xs text-gold">Fome · {hungerStatus(currentHunger, hungerMaximum)}</span><div className="font-display text-xl text-gold-bright mt-1">{currentHunger} / {hungerMaximum}</div></div>
            <div className="bg-shadow/50 border border-gold-dim rounded-xl p-4"><span className="text-xs text-gold">Sede · {thirstStatus(currentThirst)}</span><div className="font-display text-xl text-gold-bright mt-1">{currentThirst} / 6</div></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">{calcCards.slice(2).map(([label, value, tip]) => <div key={String(label)} className="bg-shadow/50 border border-gold-dim rounded-lg p-4"><div className="text-xs text-parchment-dim">{label}<Tip>{tip}</Tip></div><div className="font-display text-xl text-gold-bright mt-1">{value}</div></div>)}</div>

          <section><h3 className="font-display text-gold mb-3 flex gap-2"><Sword className="w-5 h-5"/>Equipamento em uso</h3><div className="grid md:grid-cols-3 gap-3">
            <div className="bg-shadow/40 border border-gold-dim rounded-xl p-4"><div className="text-xs text-gold">Arma</div><b className="font-display text-gold-bright">{equipmentSummary?.weapon_name || 'Nenhuma'}</b>{equipmentSummary?.weapon_name && <><p className="text-xs text-parchment-dim mt-1">Dano efetivo: {equipmentSummary.weapon_effective_damage}</p>{equipmentSummary.weapon_is_proficient === false && <p className="mt-2 text-xs text-parchment border border-blood/40 bg-blood/10 rounded p-2">Uso não proficiente: o dano base já está reduzido pelo déficit.</p>}<label className="block mt-3 text-[10px] uppercase tracking-wide text-gold/80">Alvo<select value={selectedTargetId} onChange={e => setSelectedTargetId(e.target.value)} className="mt-1 w-full bg-shadow/70 border border-gold-dim rounded-lg px-2 py-2 text-xs text-parchment normal-case tracking-normal"><option value="">Selecione...</option>{combatTargets.map(target => <option key={target.id} value={target.id}>{target.name}</option>)}</select></label><button type="button" onClick={rollAttack} disabled={rollingAttack || equippedWeaponBroken || selectedCharacter.combat_action_available === false || !selectedTargetId} className="mt-3 w-full min-h-10 rounded-lg border border-gold bg-gradient-to-r from-blood/90 to-gold/80 px-3 py-2 font-display text-sm text-parchment shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"><Sword className="w-4 h-4"/>{equippedWeaponBroken ? 'Arma quebrada' : selectedCharacter.combat_action_available === false ? 'Ação já utilizada' : rollingAttack ? 'Rolando...' : 'Atacar'}</button>{attackRollError && <p className="mt-2 text-xs text-parchment border border-blood/40 bg-blood/10 rounded p-2">{attackRollError}</p>}</>}</div>
            <div className="bg-shadow/40 border border-gold-dim rounded-xl p-4"><div className="text-xs text-gold">Armadura</div><b className="font-display text-gold-bright">{equipmentSummary?.armor_name || 'Nenhuma'}</b>{equipmentSummary?.armor_name && <><p className="text-xs text-parchment-dim mt-1">Absorção efetiva: {armorAbsorption}{equipmentSummary.armor_evasion_penalty ? ` · Evasão −${equipmentSummary.armor_evasion_penalty}` : ''}{equipmentSummary.armor_movement_penalty ? ` · Movimento −${equipmentSummary.armor_movement_penalty} m` : ''}</p>{equipmentSummary.armor_is_proficient === false && <p className="mt-2 text-xs text-parchment border border-blood/40 bg-blood/10 rounded p-2">Uso não proficiente: a absorção já está reduzida pelo déficit.</p>}</>}</div>
            <div className="bg-shadow/40 border border-gold-dim rounded-xl p-4"><div className="text-xs text-gold">Escudo</div><b className="font-display text-gold-bright">{equipmentSummary?.shield_name || 'Nenhum'}</b>{equipmentSummary?.shield_name && <><p className="text-xs text-parchment-dim mt-1">Bônus efetivo de Bloqueio: +{equipmentSummary.shield_effective_bonus}{equipmentSummary.shield_evasion_penalty ? ` · Evasão −${equipmentSummary.shield_evasion_penalty}` : ''}{equipmentSummary.shield_movement_penalty ? ` · Movimento −${equipmentSummary.shield_movement_penalty} m` : ''}</p>{equipmentSummary.shield_is_proficient === false && <p className="mt-2 text-xs text-parchment border border-blood/40 bg-blood/10 rounded p-2">Uso não proficiente: o bônus de Bloqueio já está reduzido pelo déficit.</p>}</>}</div>
          </div></section>

          <section><h3 className="font-display text-gold mb-3">Equipamentos de Combate disponíveis</h3>{combatItems.length === 0 ? <Empty>O Mestre ainda não adicionou equipamentos de combate a este personagem.</Empty> : <div className="grid sm:grid-cols-2 gap-3">{combatItems.map(i => { const slot = i.weapon_id ? 'weapon' : i.armor_id ? 'armor' : 'shield'; const equipped = i.equip_slot === slot; const durability = durabilityLabel(i); const broken = i.durability_current === 0; return <div key={i.id} className="bg-shadow/40 border border-gold-dim rounded-lg p-4 flex justify-between gap-3"><div><b className="text-gold-bright">{i.name}</b><p className="text-xs text-parchment-dim">{i.type} · ×{i.quantity}{durability ? ` · ${durability} ${i.durability_current}/${i.durability_max}` : ''}</p>{durability === 'Danificado' && <p className="text-[10px] text-gold mt-1">+1 dificuldade quando o item for essencial ao teste</p>}</div><button disabled={broken} onClick={() => setItemSlot(i, equipped ? null : slot)} className="text-xs border border-gold-dim rounded-lg px-3 py-2 text-gold disabled:opacity-30">{broken ? 'Quebrado' : equipped ? 'Desequipar' : 'Equipar'}</button></div>; })}</div>}</section>
          <section><h3 className="font-display text-gold mb-3 flex gap-2"><Shield className="w-5 h-5"/>Condições & Efeitos</h3>{conditions.length === 0 && activeEffects.length === 0 ? <Empty /> : <div className="grid sm:grid-cols-2 gap-3">{conditions.map(c => <div key={c.id} className="bg-shadow/40 border border-gold-dim rounded-lg p-3"><b>{c.condition}</b><p className="text-xs">{renderCharacterText(c.notes, selectedCharacter)}</p></div>)}{activeEffects.map(e => <div key={e.id} className="bg-shadow/40 border border-gold-dim rounded-lg p-3"><b>{e.name}</b><p className="text-xs">{renderCharacterText(e.description, selectedCharacter)}</p>{e.is_permanent === false && e.remaining_minutes != null && <p className="text-[10px] text-gold mt-1">Restante: {formatDuration(e.remaining_minutes)}</p>}</div>)}</div>}</section>
        </div>}
        {tab === 'classes' && <ProgressionV15 character={selectedCharacter} actorPlayerId={player.id} canManage={masterMode || isMaster} onCharacterChange={(updated) => { setSelectedCharacter(updated); setCharacters(rows => rows.map(row => row.id === updated.id ? updated : row)); }}/>} 
        {tab === 'catalogo' && <CatalogPage playerId={player.id} isMaster={masterMode || isMaster}/>} 
        {tab === 'regras' && <RulesPanel playerName={player.player_name || player.alcunha}/>} 
        {tab === 'inventario' && <InventoryPanel playerId={player.id} character={selectedCharacter} items={items} onConsume={consumeItem} onSetItemSlot={setItemSlot} onRefresh={async () => { await Promise.all([loadRelations(selectedCharacter.id), loadCombatEquipment(selectedCharacter.id)]); }}/>}
        {tab === 'historia' && <div>{!editingHistory ? <div className="flex justify-end mb-3"><button onClick={startHistory} className="text-sm text-gold flex gap-1"><Pencil className="w-4 h-4"/>Editar História</button></div> : <div className="flex justify-end gap-3 mb-3"><button onClick={() => setEditingHistory(false)} className="text-sm text-parchment-dim">Cancelar</button><button onClick={saveHistory} className="text-sm text-gold flex gap-1"><Save className="w-4 h-4"/>Salvar</button></div>}<div className="grid md:grid-cols-2 gap-4">{[['Apelido', 'nickname'], ['Gênero/Pronomes', 'gender'], ['Altura', 'height'], ['Peso', 'weight'], ['Origem', 'origin'], ['Ocupação anterior', 'previous_occupation'], ['Aparência', 'appearance'], ['Marcas distintivas', 'distinctive_marks'], ['Personalidade', 'personality'], ['Ideais / Convicções', 'ideals'], ['Motivação', 'motivation'], ['Vínculo importante', 'important_bond'], ['História breve', 'brief_history'], ['Características adicionais', 'additional_characteristics']].map(([label, key]) => <div key={key} className="bg-shadow/40 border border-gold-dim rounded-lg p-4"><div className="text-xs text-gold mb-1">{label}</div>{editingHistory ? <textarea value={historyDraft[key] || ''} onChange={e => setHistoryDraft(d => ({ ...d, [key]: e.target.value }))} rows={key.includes('history') || key === 'appearance' ? 4 : 2} className={field}/> : <p className="text-sm text-parchment-dim whitespace-pre-wrap">{String((selectedCharacter as unknown as Record<string, unknown>)[key] || '—')}</p>}</div>)}</div></div>}
        {tab === 'jornada' && <div className="grid md:grid-cols-2 gap-4">{[
                    ['character_contacts', 'Aliados & Contatos', contacts.map(x => ({ id: x.id, t: x.name, d: [x.relationship, x.notes].filter(Boolean).join(' · ') }))], ['character_factions', 'Facções', factions.map(x => ({ id: x.id, t: x.faction_name, d: [x.relationship, x.notes].filter(Boolean).join(' · ') }))], ['character_reputations', 'Reputações', reputations.map(x => ({ id: x.id, t: x.group_or_place, d: [x.reputation, x.notes].filter(Boolean).join(' · ') }))], ['character_objectives', 'Objetivos Atuais', objectives.map(x => ({ id: x.id, t: x.objective, d: [x.status, x.notes].filter(Boolean).join(' · ') }))], ['character_events', 'Acontecimentos Importantes', events.map(x => ({ id: x.id, t: x.title, d: [x.session_reference, x.description].filter(Boolean).join(' · ') }))]
                ].map(([table, title, rows]) => { const rr = rows as {
                    id: string;
                    t: string;
                    d: string;
                }[]; return <section key={String(table)} className="bg-shadow/40 border border-gold-dim rounded-lg p-4"><div className="flex justify-between"><h3 className="font-display text-gold mb-3">{String(title)}</h3><button onClick={() => addJourney(String(table))}><Plus className="w-4 h-4 text-gold"/></button></div>{rr.length === 0 ? <Empty /> : rr.map(x => <div key={x.id} className="mb-3 flex justify-between gap-2"><div><b className="text-sm text-gold-bright">{x.t}</b><p className="text-xs text-parchment-dim">{x.d || '—'}</p></div><div className="flex gap-2"><button onClick={() => editJourney(String(table), x.id, x.t, x.d)}><Pencil className="w-4 h-4 text-gold"/></button><button onClick={() => deleteRow(String(table), x.id)}><Trash2 className="w-4 h-4 text-parchment-dim"/></button></div></div>)}</section>; })}</div>}
        {tab === 'diario' && <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5"><section className="bg-shadow/40 border border-gold-dim rounded-lg p-4 h-fit"><h3 className="font-display text-gold mb-4">Nova entrada</h3><input value={diaryTitle} onChange={e => setDiaryTitle(e.target.value)} placeholder="Título" className={`${field} mb-3`}/><input value={diarySession} onChange={e => setDiarySession(e.target.value)} placeholder="Data / Sessão (opcional)" className={`${field} mb-3`}/><textarea value={diaryContent} onChange={e => setDiaryContent(e.target.value)} rows={7} className={field}/><button onClick={addDiary} disabled={diarySaving || !diaryTitle.trim() || !diaryContent.trim()} className="mt-3 bg-gradient-gold text-stone px-4 py-2 rounded-lg">Adicionar ao diário</button></section><section><h3 className="font-display text-gold mb-4">Diário do personagem</h3>{diary.length === 0 ? <Empty /> : <div className="space-y-3">{[...diary].reverse().map(d => <article key={d.id} className="bg-shadow/40 border border-gold-dim rounded-lg p-4"><div className="flex justify-between"><div><h4 className="font-display text-gold-bright">{d.title}</h4><p className="text-xs text-gold">{d.session_reference}</p></div><div className="flex gap-2"><button onClick={() => editDiary(d)}><Pencil className="w-4 h-4 text-gold"/></button><button onClick={() => deleteRow('character_diary', d.id)}><Trash2 className="w-4 h-4 text-parchment-dim"/></button></div></div><p className="text-sm text-parchment-dim whitespace-pre-wrap mt-3">{d.content}</p></article>)}</div>}</section></div>}
      </div>
    </div></div>}
  </div>;
}
