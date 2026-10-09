import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Check, Info, Loader2, Lock, BookOpen, UsersRound, Route, Package, Brain, X } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';
import { type RaceDefinition } from '@/lib/ancestry';
import CatalogPage from '@/components/CatalogPage';
import { ATTRIBUTE_GROUPS, SKILL_GROUPS, apprenticeTitle } from '@/lib/systemV15';
import CollapsibleSection from '@/components/CollapsibleSection';
import AncestryBrowser from '@/components/AncestryBrowser';

type CharacterCreationProps = {
  player: Player;
  onBack: () => void;
  onCreated: () => void;
  consumeCharacterAllowance?: boolean;
};

const STEPS = [
  { id: 1, label: 'Identidade' },
  { id: 2, label: 'Atributos' },
  { id: 3, label: 'Habilidades' },
  { id: 4, label: 'Revisão' },
];



type Lineage = { id?: string; race_id?: string; name: string; description: string; tagline?: string; image: string; skill_group_1?: string; skill_group_2?: string };
type Race = { id?: string; name: string; description?: string; tagline?: string; image?: string; attribute_mode?: RaceDefinition['attribute_mode']; fixed_attribute?: string|null; lineages: Lineage[] };

export const RACES: Race[] = [
  { id: 'humanos', name: 'Humanos', lineages: [
    { name: 'Terranos', image: '', description: 'Constituição próxima à humana comum, com grande variedade de aparência. Representam a ancestralidade humana mais difundida.' },
    { name: 'Altaneiros', image: '', description: 'Descendentes de povos das grandes altitudes, com facilidade para respirar em ar rarefeito e suportar o frio.' },
    { name: 'Marítimos', image: '', description: 'Descendentes de povos dos arquipélagos, com adaptações à vida na água, como maior capacidade de prender a respiração.' },
  ]},
  { id: 'elfos', name: 'Elfos', lineages: [
    { name: 'Silvestres', image: '', description: 'Herança ligada às florestas; olhos e cabelos podem apresentar tons de folhas, madeira e âmbar.' },
    { name: 'Astrais', image: '', description: 'Herança ligada ao céu noturno; olhos luminosos e marcas semelhantes a constelações.' },
    { name: 'Profundos', image: '', description: 'Adaptados ao subterrâneo; olhos sensíveis à luz e aparência em tons de pedra, cinza ou violeta.' },
  ]},
  { id: 'anoes', name: 'Anões', lineages: [
    { name: 'Graníticos', image: '', description: 'Corpos compactos e ossatura densa, associados às antigas linhagens das montanhas.' },
    { name: 'Ígneos', image: '', description: 'Herança de regiões vulcânicas; pele quente e cabelos em tons de cobre, carvão ou brasa.' },
    { name: 'Cristalinos', image: '', description: 'Pequenas formações minerais surgem na pele ou nos cabelos, com sensibilidade às vibrações da pedra.' },
  ]},
  { id: 'orcs', name: 'Orcs', lineages: [
    { name: 'Colossais', image: '', description: 'Maior estatura e musculatura, com presas e estrutura óssea acentuadas.' },
    { name: 'Glaciais', image: '', description: 'Pelagem fina ou cabelos densos, pele em tons frios e adaptação às baixas temperaturas.' },
    { name: 'Rubros', image: '', description: 'Pele em tons de ocre, cobre ou vermelho, com adaptação ao calor de regiões áridas.' },
  ]},
  { id: 'pequeninos', name: 'Pequeninos', lineages: [
    { name: 'Campestres', image: '', description: 'Pés largos, geralmente cobertos de pelos, e constituição robusta para seu tamanho.' },
    { name: 'Brumosos', image: '', description: 'Herança feérica sutil, com passos silenciosos e contornos que parecem se confundir com a névoa.' },
    { name: 'Ribeirinhos', image: '', description: 'Dedos parcialmente palmados e facilidade para nadar e se movimentar em terrenos alagados.' },
  ]},
  { id: 'goblins', name: 'Goblins', lineages: [
    { name: 'Cavernícolas', image: '', description: 'Olhos e orelhas grandes, adaptados à percepção em ambientes subterrâneos.' },
    { name: 'Arborícolas', image: '', description: 'Membros alongados e dedos fortes, próprios para agarrar galhos e escalar.' },
    { name: 'Ferruginosos', image: '', description: 'Pele de aspecto salpicado, em tons de ferrugem, e capacidade de perceber metais pelo cheiro.' },
  ]},
  { id: 'tiferinos', name: 'Tiferinos', lineages: [
    { name: 'Infernais', image: '', description: 'Chifres marcantes, cauda e sinais de uma herança ligada ao fogo e a antigos pactos.' },
    { name: 'Abissais', image: '', description: 'Traços assimétricos, chifres irregulares e manifestações de uma herança ligada ao caos e à transformação.' },
    { name: 'Umbráticos', image: '', description: 'Cores escuras ou desbotadas, olhos contrastantes e sombras que parecem acompanhar seus movimentos com atraso.' },
  ]},
  { id: 'povo-fungico', name: 'Fúngicos', lineages: [
    { name: 'Micelares', image: '', description: 'Corpos fibrosos, semelhantes a raízes entrelaçadas, capazes de perceber sinais através de redes de fungos.' },
    { name: 'Chapeleiros', image: '', description: 'Chapéus de cogumelo de diferentes formatos e cores; produzem pequenos conjuntos de esporos.' },
    { name: 'Luminescentes', image: '', description: 'Partes do corpo emitem luz, usada para iluminar suavemente e transmitir sinais.' },
  ]},
  { id: 'draconatos', name: 'Draconatos', lineages: [
    { name: 'Metálicos', image: '', description: 'Escamas com brilho e aspecto de metal.' },
    { name: 'Cromáticos', image: '', description: 'Escamas de cores intensas e bem definidas.' },
    { name: 'Gemáticos', image: '', description: 'Escamas cristalinas ou facetadas, semelhantes a pedras preciosas.' },
  ]},
  { id: 'povo-fera', name: 'Feras', lineages: [
    { name: 'Felinos', image: '', description: 'Traços de gatos, linces, onças ou leões, com garras retráteis e equilíbrio apurado.' },
    { name: 'Canídeos', image: '', description: 'Traços de lobos, cães ou raposas, com olfato desenvolvido e orelhas expressivas.' },
    { name: 'Avianos', image: '', description: 'Penas, bicos e características de diferentes aves. O formato das asas e sua utilidade ainda serão definidos.' },
  ]},
];



export { ATTRIBUTE_GROUPS, SKILL_GROUPS } from '@/lib/systemV15';

const ATTRIBUTE_INITIAL_POINTS = 1;
const ATTRIBUTE_BONUS_POINTS = 4;
const APPRENTICE_ATTRIBUTE_MAX = 2;
const SKILL_INITIAL_POINTS = 8;
const APPRENTICE_SKILL_MAX = 2;

const allAttributeNames = ATTRIBUTE_GROUPS.flatMap((group) => group.attributes.map((attribute) => attribute.name));
const allSkillNames = SKILL_GROUPS.flatMap((group) => group.skills.map((skill) => skill.name));

export const GENDER_OPTIONS = [
  { id: 'ela', label: 'Ela/Dela' },
  { id: 'ele', label: 'Ele/Dele' },
  { id: 'elu', label: 'Linguagem neutra' },
  { id: 'neutro', label: 'Prefiro não responder' },
];

type CreationReferenceView = 'regras' | 'povos' | 'classes' | 'atributos' | 'itens' | null;

function CreationReferenceOverlay({ view, onClose, player, races }: { view: Exclude<CreationReferenceView, null>; onClose: () => void; player: Player; races: Race[] }) {
  const titles: Record<Exclude<CreationReferenceView, null>, string> = {
    regras: 'Regras', povos: 'Povos e Vertentes', classes: 'Progressão', atributos: 'Atributos e Habilidades', itens: 'Itens',
  };
  const card = 'rounded-xl border border-gold-dim bg-gradient-card p-4';
  return <div className="fixed inset-0 z-[70] bg-black/80 p-2 sm:p-5 flex items-center justify-center">
    <div className="w-full max-w-6xl h-[94vh] overflow-hidden rounded-2xl border border-gold bg-stone shadow-2xl flex flex-col">
      <div className="shrink-0 border-b border-gold-dim bg-shadow/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div><p className="text-[10px] uppercase tracking-[.2em] text-gold/70">Consulta durante a criação</p><h2 className="font-display text-xl text-gold-bright">{titles[view]}</h2></div>
        <button type="button" onClick={onClose} className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-gold-dim text-gold hover:border-gold" aria-label="Fechar consulta"><X className="w-5 h-5"/></button>
      </div>
      <div className="overflow-y-auto flex-1 p-4 sm:p-6">
        {view === 'regras' && <div className="max-w-4xl mx-auto space-y-4">
          <div className={card}><h3 className="font-display text-lg text-gold-bright">Testes</h3><p className="mt-2 text-sm text-parchment-dim">Atributo + Habilidade define a quantidade de d10. Cada resultado maior que a Dificuldade gera 1 sucesso; 1 anula um sucesso e 10 gera um novo d10 explosivo.</p></div>
          <div className="grid md:grid-cols-2 gap-4"><div className={card}><h3 className="font-display text-lg text-gold-bright">Fome e Sede</h3><p className="mt-2 text-sm text-parchment-dim">Fome perde 1 ponto a cada 8 horas; Sede perde 1 a cada 6 horas. 400 g de alimento recuperam 1 Fome e 250 ml de água recuperam 1 Sede.</p></div><div className={card}><h3 className="font-display text-lg text-gold-bright">Progressão</h3><p className="mt-2 text-sm text-parchment-dim">O personagem começa como Aprendiz. Classes e especializações são descobertas durante a trajetória e não precisam ser escolhidas na criação.</p></div></div>
          <div className={card}><h3 className="font-display text-lg text-gold-bright">Combinação livre</h3><p className="mt-2 text-sm text-parchment-dim">O Mestre escolhe o Atributo + Habilidade conforme a maneira como você descreve a ação. A mesma tarefa pode usar combinações diferentes em situações diferentes.</p></div>
        </div>}

        {view === 'povos' && <AncestryBrowser races={races.map(race => ({ ...race, image_url: race.image }))}/>}

        {view === 'classes' && <div className="max-w-4xl mx-auto space-y-4">
          <div className={card}><div className="flex gap-3"><Route className="w-5 h-5 text-gold shrink-0"/><div><h3 className="font-display text-xl text-gold-bright">Aprendiz e caminhos iniciais</h3><p className="mt-2 text-sm text-parchment-dim">Nos níveis 1–3, o maior Atributo define o título Aprendiz de X. Empates formam um Aprendiz Versátil. No nível 2 o personagem recebe +2 pontos de Habilidade; no nível 3 recebe +1 ponto de Atributo e +1 ponto de Habilidade. A primeira ramificação aparece quando um Atributo chega a 3 pontos. A classe inicial pode ser escolhida a partir do nível 4 com Atributo 3 + Habilidade 2.</p></div></div></div>
          <div className="grid sm:grid-cols-3 gap-3"><div className={card}><p className="text-[10px] uppercase tracking-wider text-gold/70">Níveis 1–3</p><h3 className="font-display text-gold-bright mt-1">Aprendiz</h3><p className="text-xs text-parchment-dim mt-1">Título definido pelo maior Atributo.</p></div><div className={card}><p className="text-[10px] uppercase tracking-wider text-gold/70">A partir do nível 4</p><h3 className="font-display text-gold-bright mt-1">60 caminhos iniciais</h3><p className="text-xs text-parchment-dim mt-1">Cinco possibilidades ligadas a cada Atributo.</p></div><div className={card}><p className="text-[10px] uppercase tracking-wider text-gold/70">Futuro</p><h3 className="font-display text-gold-bright mt-1">Árvore avançada</h3><p className="text-xs text-parchment-dim mt-1">Será desenvolvida depois, sem antecipar títulos superiores.</p></div></div>
        </div>}

        {view === 'atributos' && <div className="max-w-6xl mx-auto space-y-6">
          <div><h3 className="font-display text-xl text-gold-bright">Atributos</h3><p className="mt-1 text-sm text-parchment-dim">Representam capacidades naturais. Veja abaixo em que cada um costuma ser útil.</p></div>
          <div className="grid md:grid-cols-3 gap-4">{ATTRIBUTE_GROUPS.map(group => <section key={group.name} className={card}><h4 className="font-display text-gold mb-3">{group.name}</h4><div className="space-y-3">{group.attributes.map(attribute => <div key={attribute.name} className="rounded-lg border border-gold-dim/50 bg-shadow/25 p-3"><h5 className="font-display text-gold-bright">{attribute.name}</h5><p className="mt-1 text-xs text-parchment-dim">{attribute.description}</p><p className="mt-2 text-[11px] text-gold/80"><b>Útil para:</b> {attribute.examples}</p></div>)}</div></section>)}</div>
          <div><h3 className="font-display text-xl text-gold-bright">Habilidades</h3><p className="mt-1 text-sm text-parchment-dim">Representam prática, conhecimento ou treinamento.</p></div>
          <div className="grid lg:grid-cols-2 gap-4">{SKILL_GROUPS.map(group => <section key={group.name} className={card}><h4 className="font-display text-gold mb-3">{group.name}</h4><div className="grid sm:grid-cols-2 gap-2">{group.skills.map(skill => <div key={skill.name} className="rounded-lg border border-gold-dim/50 bg-shadow/25 p-3"><h5 className="font-display text-sm text-gold-bright">{skill.name}</h5><p className="mt-1 text-xs text-parchment-dim">{skill.description}</p><p className="mt-2 text-[11px] text-gold/80"><b>Útil para:</b> {skill.examples}</p></div>)}</div></section>)}</div>
        </div>}

        {view === 'itens' && <CatalogPage playerId={player.id} isMaster={false}/>} 
      </div>
    </div>
  </div>;
}

export default function CharacterCreation({ player, onBack, onCreated, consumeCharacterAllowance = true }: CharacterCreationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [referenceView, setReferenceView] = useState<CreationReferenceView>(null);
  const [raceOptions, setRaceOptions] = useState<Race[]>(RACES);
  const [isHybrid, setIsHybrid] = useState(false);
  const [secondaryRace, setSecondaryRace] = useState('');
  const [secondaryLineage, setSecondaryLineage] = useState('');

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [lineage, setLineage] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [appearance, setAppearance] = useState('');
  const [distinctiveMarks, setDistinctiveMarks] = useState('');
  const [origin, setOrigin] = useState('');
  const [previousOccupation, setPreviousOccupation] = useState('');
  const [personality, setPersonality] = useState('');
  const [ideals, setIdeals] = useState('');
  const [motivation, setMotivation] = useState('');
  const [importantBond, setImportantBond] = useState('');
  const [briefHistory, setBriefHistory] = useState('');
  const [additionalCharacteristics, setAdditionalCharacteristics] = useState('');
  const [attributes, setAttributes] = useState<Record<string, number>>(() =>
    Object.fromEntries(allAttributeNames.map((attribute) => [attribute, ATTRIBUTE_INITIAL_POINTS]))
  );
  const [skills, setSkills] = useState<Record<string, number>>(() =>
    Object.fromEntries(allSkillNames.map((skill) => [skill, 0]))
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    (async () => {
      const [rr,ll] = await Promise.all([supabase.from('races').select('*').order('name'), supabase.from('lineages').select('*').order('name')]);
      if (rr.error || ll.error || !rr.data?.length) return;
      const mapped: Race[] = rr.data.map((r:any) => ({...r, image:r.image_url, lineages:(ll.data||[]).filter((l:any)=>l.race_id===r.id).map((l:any)=>({...l,image:l.image_url}))}));
      setRaceOptions(mapped);
    })();
  }, []);

  const selectedRace = raceOptions.find((item) => item.name === race);
  const selectedSecondaryRace = raceOptions.find((item) => item.name === secondaryRace);
  const selectedLineage = selectedRace?.lineages.find((item) => item.name === lineage);
  const selectedSecondaryLineage = selectedSecondaryRace?.lineages.find((item) => item.name === secondaryLineage);
  const hybridValid = !isHybrid || (!!secondaryRace && !!secondaryLineage && secondaryRace !== race);
  const isFormValid = name.trim() !== '' && age.trim() !== '' && race !== '' && lineage !== '' && hybridValid;
  const attributePointsSpent = Object.values(attributes).reduce((total, value) => total + (value - ATTRIBUTE_INITIAL_POINTS), 0);
  const attributePointsRemaining = ATTRIBUTE_BONUS_POINTS - attributePointsSpent;
  const skillPointsSpent = Object.values(skills).reduce((total, rank) => total + (rank * (rank + 1)) / 2, 0);
  const skillPointsRemaining = SKILL_INITIAL_POINTS - skillPointsSpent;

  const setAttributeRank = (attribute: string, rank: number) => {
    if (rank < ATTRIBUTE_INITIAL_POINTS || rank > APPRENTICE_ATTRIBUTE_MAX) return;
    const currentRank = attributes[attribute] ?? ATTRIBUTE_INITIAL_POINTS;
    const delta = rank - currentRank;
    if (delta > attributePointsRemaining) return;
    setAttributes((current) => ({ ...current, [attribute]: rank }));
  };

  const setSkillRank = (skill: string, rank: number) => {
    if (rank < 0 || rank > APPRENTICE_SKILL_MAX) return;
    const currentRank = skills[skill] ?? 0;
    const currentCost = (currentRank * (currentRank + 1)) / 2;
    const newCost = (rank * (rank + 1)) / 2;
    const delta = newCost - currentCost;
    if (delta > skillPointsRemaining) return;
    setSkills((current) => ({ ...current, [skill]: rank }));
  };

  const genderLabel = GENDER_OPTIONS.find((option) => option.id === gender)?.label || 'Não informado';
  const effectiveAttributes: Record<string, number> = { ...attributes };
  const effectiveSkills: Record<string, number> = { ...skills };
  const selectedSkills = Object.entries(effectiveSkills).filter(([, rank]) => rank > 0);
  const apprentice = apprenticeTitle(attributes);

  const handleFinalize = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');

    try {
      const { error } = await supabase.from('characters').insert({
        player_id: player.id,
        name: name.trim().normalize('NFC'),
        nickname: nickname.trim().normalize('NFC') || null,
        age: Number(age),
        gender: gender || null,
        race,
        lineage,
        is_hybrid: isHybrid,
        secondary_race: isHybrid ? secondaryRace : null,
        secondary_lineage: isHybrid ? secondaryLineage : null,
        height: height.trim() || null,
        weight: weight.trim() || null,
        appearance: appearance.trim() || null,
        distinctive_marks: distinctiveMarks.trim() || null,
        origin: origin.trim() || null,
        previous_occupation: previousOccupation.trim() || null,
        personality: personality.trim() || null,
        ideals: ideals.trim() || null,
        motivation: motivation.trim() || null,
        important_bond: importantBond.trim() || null,
        brief_history: briefHistory.trim() || null,
        additional_characteristics: additionalCharacteristics.trim() || null,
        level: 1,
        class_name: null,
        specialization: null,
        status: 'vivo',
        current_hp: 15 + ((effectiveAttributes['Vigor'] ?? 1) * 5),
        current_mp: (() => {
          const mental = Math.max(...['Inteligência', 'Raciocínio', 'Sabedoria', 'Percepção'].map((key) => effectiveAttributes[key] ?? 0));
          const mystical = Math.max(...['Arcanismo', 'Ocultismo', 'Teologia'].map((key) => effectiveSkills[key] ?? 0));
          return mystical > 0 ? 5 + mental * 2 + mystical * 2 + 1 : 0;
        })(),
        attributes,
        skills,
        // Povo e Vertente são narrativos na TRILHA 1.5: não concedem bônus mecânicos.
        racial_attribute_bonus: {},
        lineage_skill_bonuses: {},
      });

      if (error) throw error;
      if (consumeCharacterAllowance && player.character_creation_allowed) {
        await supabase.from('players').update({ character_creation_allowed: false }).eq('id', player.id);
      }
      setConfirmOpen(false);
      onCreated();
    } catch (error) {
      console.error(error);
      setSaveError('Não foi possível salvar o personagem. Nada foi apagado: revise sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

 const canContinue =
    (currentStep === 1 && isFormValid) ||
    (currentStep === 2 && attributePointsRemaining === 0) ||
    (currentStep === 3 && skillPointsRemaining === 0) ||
    currentStep === 4;

  const goBack = () => {
    if (currentStep === 1) onBack();
    else setCurrentStep((step) => Math.max(1, step - 1));
  };

  const goForward = () => {
    if (!canContinue) return;
    if (currentStep < STEPS.length) {
      setCurrentStep((step) => step + 1);
      return;
    }
    setConfirmOpen(true);
  };

  const selectRace = (raceName: string) => {
    if (raceName !== race) {
      setRace(raceName);
      setLineage('');
      if (secondaryRace === raceName) { setSecondaryRace(''); setSecondaryLineage(''); }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-fantasy animate-fade-in flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-shadow/80 backdrop-blur-md border-b border-gold-dim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="font-display text-xl sm:text-2xl text-gold-bright text-shadow-dark text-center">
            Criar Personagem
          </h1>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pt-8 pb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-display text-sm font-600 border-2 transition-all duration-300 ${
                    step.id < currentStep
                      ? 'bg-gradient-gold text-stone border-gold shadow-gold'
                      : step.id === currentStep
                        ? 'bg-gradient-gold text-stone border-gold-bright shadow-gold-lg animate-pulse-gold'
                        : 'bg-shadow/60 text-parchment-dim/40 border-gold-dim'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={`font-display text-[10px] sm:text-xs tracking-wide text-center transition-colors duration-300 ${
                    step.id <= currentStep
                      ? 'text-gold-bright'
                      : 'text-parchment-dim/40'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`h-[2px] flex-1 mx-2 sm:mx-3 mb-6 transition-all duration-300 ${
                    step.id < currentStep
                      ? 'bg-gradient-to-r from-gold to-gold-dim'
                      : 'bg-gold-dim/30'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Consulta rápida durante a criação */}
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 pb-2">
        <div className="rounded-xl border border-gold-dim bg-shadow/35 p-3">
          <div className="flex items-center gap-2 mb-2"><BookOpen className="w-4 h-4 text-gold"/><span className="font-display text-sm text-gold-bright">Consulta rápida</span><span className="text-[10px] text-parchment-dim">sem sair da criação</span></div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ['regras','Regras',BookOpen], ['povos','Povos',UsersRound], ['classes','Classes',Route], ['atributos','Atributos e Habilidades',Brain], ['itens','Itens',Package],
            ].map(([id,label,Icon]) => { const C = Icon as typeof BookOpen; return <button key={String(id)} type="button" onClick={() => setReferenceView(id as Exclude<CreationReferenceView, null>)} className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-gold-dim bg-gradient-card px-3 py-2 text-xs text-parchment-dim hover:border-gold hover:text-gold-bright transition"><C className="w-3.5 h-3.5 text-gold"/>{String(label)}</button>; })}
          </div>
        </div>
      </div>

      {/* Body */}
      <main className={`${currentStep === 3 ? 'max-w-6xl' : 'max-w-3xl'} mx-auto w-full px-4 sm:px-6 flex-1 py-4`}>
        <div className="bg-gradient-card border border-gold-dim rounded-xl p-6 sm:p-10 shadow-gold animate-fade-in-up">
          {currentStep === 1 && (
            <>
          <h2 className="font-display text-xl sm:text-2xl text-gold-bright text-shadow-gold mb-2">
            Etapa 1 — Identidade
          </h2>
          <p className="text-parchment-dim font-body text-sm sm:text-base mb-6">
            Vamos descobrir quem é o seu personagem.
          </p>

          <div className="divider-gold mb-8" />

          {/* Sobre seu personagem */}
          <h3 className="font-display text-lg text-gold tracking-wide mb-6">
            Sobre seu personagem
          </h3>

          <div className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label htmlFor="char-name" className="font-display text-sm font-500 text-gold-bright tracking-wide">
                Nome <span className="text-blood">*</span>
              </label>
              <p className="text-parchment-dim/60 text-xs font-body">
                Nome do personagem e sobrenome.
              </p>
              <input
                id="char-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-base placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark"
                placeholder="Ex: Aldric Blackwood"
              />
            </div>

            {/* Apelido */}
            <div className="space-y-2">
              <label htmlFor="char-nickname" className="font-display text-sm font-500 text-gold-bright tracking-wide">
                Apelido
              </label>
              <p className="text-parchment-dim/60 text-xs font-body">
                Apelido ou nome pelo qual é conhecido.
              </p>
              <input
                id="char-nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-base placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark"
                placeholder="Ex: O Errante"
              />
            </div>

            {/* Idade */}
            <div className="space-y-2">
              <label htmlFor="char-age" className="font-display text-sm font-500 text-gold-bright tracking-wide">
                Idade <span className="text-blood">*</span>
              </label>
              <p className="text-parchment-dim/60 text-xs font-body">
                A idade será interpretada conforme o envelhecimento de sua raça.
              </p>
              <input
                id="char-age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min={0}
                autoComplete="off"
                className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-base placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark"
                placeholder="Ex: 25"
              />
            </div>

            {/* Gênero e pronomes */}
            <div className="space-y-2">
              <label className="font-display text-sm font-500 text-gold-bright tracking-wide">
                Como você prefere que se refiram ao personagem?
              </label>
              <p className="text-parchment-dim/60 text-xs font-body">
                Escolha a forma de tratamento usada pelos textos da ficha.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setGender(gender === option.id ? '' : option.id)}
                    className={`px-4 py-3 rounded-lg font-body text-sm text-center transition-all duration-200 border ${
                      gender === option.id
                        ? 'bg-gradient-gold text-stone border-gold shadow-gold font-600'
                        : 'bg-shadow/60 text-parchment-dim border-gold-dim hover:border-gold/50 hover:text-parchment'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-gold my-8" />
            <h3 className="font-display text-lg text-gold tracking-wide mb-6">Detalhes, personalidade e história</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['Altura', height, setHeight, 'Ex: 1,76 m'],
                ['Peso', weight, setWeight, 'Ex: 80 kg'],
                ['Origem', origin, setOrigin, 'De onde vem o personagem'],
                ['Ocupação anterior', previousOccupation, setPreviousOccupation, 'O que fazia antes da aventura'],
              ].map(([label, value, setter, placeholder]) => (
                <label key={label as string} className="space-y-2">
                  <span className="block font-display text-sm text-gold-bright">{label as string}</span>
                  <input value={value as string} onChange={(e) => (setter as (v:string)=>void)(e.target.value)} placeholder={placeholder as string} className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-sm focus:outline-none focus:border-gold" />
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4">
              {[
                ['Aparência', appearance, setAppearance],
                ['Marcas distintivas', distinctiveMarks, setDistinctiveMarks],
                ['Personalidade', personality, setPersonality],
                ['Ideais / Convicções', ideals, setIdeals],
                ['Motivação', motivation, setMotivation],
                ['Vínculo importante', importantBond, setImportantBond],
                ['História breve', briefHistory, setBriefHistory],
                ['Características adicionais', additionalCharacteristics, setAdditionalCharacteristics],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="space-y-2">
                  <span className="block font-display text-sm text-gold-bright">{label as string}</span>
                  <textarea value={value as string} onChange={(e) => (setter as (v:string)=>void)(e.target.value)} rows={(label === 'História breve' || label === 'Características adicionais') ? 4 : 2} className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-sm focus:outline-none focus:border-gold resize-y" />
                </label>
              ))}
            </div>

            {/* Povo e Vertente */}
            <div className="divider-gold my-8" />
            <section className="space-y-6">
              <div>
                <h3 className="font-display text-lg text-gold tracking-wide mb-2">Povo e Vertente</h3>
                <p className="text-parchment-dim/70 text-sm font-body">Escolha a ancestralidade do seu personagem.</p>
              </div>

              <div className="space-y-3">
                <div className="font-display text-sm font-500 text-gold-bright tracking-wide">
                  Povo <span className="text-blood">*</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {raceOptions.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => selectRace(item.name)}
                      className={`min-h-16 px-4 py-3 rounded-lg border font-display text-sm transition-all duration-200 ${
                        race === item.name
                          ? 'bg-gradient-gold text-stone border-gold-bright shadow-gold font-600'
                          : 'bg-shadow/60 text-parchment-dim border-gold-dim hover:border-gold/60 hover:text-parchment'
                      }`}
                    >
                      <span className="block">{item.name}</span>
                      <span className={`block mt-1 font-body text-[10px] leading-tight ${race === item.name ? 'text-stone/75' : 'text-parchment-dim/70'}`}>{item.tagline || 'Povo narrativo e cultural'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedRace && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="font-display text-sm font-500 text-gold-bright tracking-wide">
                    Vertente <span className="text-blood">*</span>
                  </div>
                  <p className="text-parchment-dim/60 text-xs font-body">
                    Escolha uma vertente de {selectedRace.name}. Povo e Vertente definem identidade e cultura, sem bônus mecânicos automáticos.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selectedRace.lineages.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setLineage(item.name)}
                        className={`p-4 rounded-lg border text-left transition-all duration-200 ${
                          lineage === item.name
                            ? 'bg-gold/15 border-gold shadow-gold'
                            : 'bg-shadow/60 border-gold-dim hover:border-gold/60'
                        }`}
                      >
                        {item.image && <img
                          src={item.image}
                          alt={`Ilustração da vertente ${item.name}`}
                          className="block w-full aspect-[3/2] object-cover rounded-md mb-4 border border-gold-dim/60"
                          loading="lazy"
                        />}
                        <span className={`block font-display text-sm mb-2 ${lineage === item.name ? 'text-gold-bright' : 'text-gold'}`}>
                          {item.name}
                        </span>
                        <span className="block font-body text-xs leading-relaxed text-parchment-dim">
                          {item.description}
                        </span>
                        <span className="block mt-3 pt-2.5 border-t border-gold-dim/40">
                          <span className="block text-[9px] uppercase tracking-[.14em] text-gold/60 mb-1">Vertente</span>
                          <span className="block font-body text-[11px] leading-relaxed text-parchment-dim">{item.tagline || 'Vertente narrativa e cultural'}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gold-dim/50 pt-5">
                <label className="inline-flex items-center gap-3 text-sm text-parchment cursor-pointer">
                  <input type="checkbox" checked={isHybrid} onChange={(event) => { setIsHybrid(event.target.checked); if (!event.target.checked) { setSecondaryRace(''); setSecondaryLineage(''); } }} />
                  <span><b className="text-gold-bright">Personagem Híbrido</b> · combina dois Povos e uma Vertente de cada.</span>
                </label>
                {isHybrid && <div className="mt-4 rounded-xl border border-gold-dim bg-shadow/25 p-4 space-y-4">
                  <div><h4 className="font-display text-gold-bright">Segundo Povo</h4><p className="mt-1 text-xs text-parchment-dim">Escolha um Povo diferente do primeiro. A combinação é narrativa e não altera Atributos ou Habilidades.</p></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{raceOptions.filter(item => item.name !== race).map(item => <button key={item.name} type="button" onClick={() => { setSecondaryRace(item.name); setSecondaryLineage(''); }} className={`min-h-12 rounded-lg border px-3 py-2 text-sm ${secondaryRace === item.name ? 'border-gold bg-gold/15 text-gold-bright' : 'border-gold-dim bg-shadow/40 text-parchment-dim'}`}><span className="block">{item.name}</span><span className="block mt-1 text-[10px] opacity-70">{item.tagline || 'Povo narrativo e cultural'}</span></button>)}</div>
                  {selectedSecondaryRace && <div><h4 className="font-display text-sm text-gold mb-3">Vertente de {selectedSecondaryRace.name}</h4><div className="grid sm:grid-cols-3 gap-2">{selectedSecondaryRace.lineages.map(item => <button key={item.name} type="button" onClick={() => setSecondaryLineage(item.name)} className={`rounded-lg border p-3 text-left ${secondaryLineage === item.name ? 'border-gold bg-gold/15' : 'border-gold-dim bg-shadow/40'}`}><b className="font-display text-sm text-gold-bright">{item.name}</b><p className="mt-1 text-[10px] text-gold/70">{item.tagline || 'Vertente narrativa e cultural'}</p><p className="mt-1 text-[11px] text-parchment-dim">{item.description}</p></button>)}</div></div>}
                </div>}
              </div>
            </section>
          </div>

            </>
          )}

          {currentStep === 2 && (
            <>
              <h2 className="font-display text-xl sm:text-2xl text-gold-bright text-shadow-gold mb-2">Etapa 2 — Atributos</h2>
              <p className="text-parchment-dim font-body text-sm sm:text-base mb-4">Defina os pontos fortes do seu personagem.</p>
              <div className="flex items-center justify-between gap-4 bg-shadow/50 border border-gold-dim rounded-lg px-4 py-3 mb-8">
                <span className="font-body text-sm text-parchment-dim">Aprendiz · máximo de 2 pontos por atributo</span>
                <span className="font-display text-gold-bright">Pontos disponíveis: {attributePointsRemaining}</span>
              </div>
              <p className="mb-6 text-xs text-parchment-dim">Povo e Vertente não alteram seus valores. Os 4 pontos de criação são a única fonte de aumento de Atributo nesta etapa.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {ATTRIBUTE_GROUPS.map((group) => (
                  <section key={group.name} className="bg-shadow/40 border border-gold-dim rounded-xl p-4">
                    <h3 className="font-display text-lg text-gold mb-4">{group.name}</h3>
                    <div className="space-y-5">
                      {group.attributes.map((attribute) => {
                        const rank = attributes[attribute.name] ?? 1;
                        return (
                          <div key={attribute.name}>
                            <div className="flex items-center gap-1.5 mb-2 relative group/tooltip w-fit">
                              <span className="font-display text-sm text-parchment">{attribute.name}</span>
                              <Info className="w-3.5 h-3.5 text-gold-dim cursor-help" />
                              <div className="pointer-events-none absolute left-0 bottom-full mb-2 z-30 w-64 opacity-0 group-hover/tooltip:opacity-100 focus-within:opacity-100 transition-opacity bg-stone border border-gold rounded-lg p-3 shadow-gold text-left">
                                <strong className="block font-display text-gold-bright text-sm mb-1">{attribute.name}</strong>
                                <span className="block font-body text-xs text-parchment mb-1">{attribute.description}</span>
                                <span className="block font-body text-xs text-parchment-dim">{attribute.examples}</span>
                              </div>
                            </div>
                            <div className="flex gap-2" aria-label={`${attribute.name}: ${rank} de 5 pontos`}>
                              {[1,2,3,4,5].map((point) => {
                                const enabled = point <= APPRENTICE_ATTRIBUTE_MAX;
                                const filled = point <= rank;
                                return (
                                  <button key={point} type="button" disabled={!enabled} onClick={() => enabled && setAttributeRank(attribute.name, point === rank && point > 1 ? point - 1 : point)} className={`w-7 h-7 rounded-full border-2 transition-all ${filled ? 'bg-gold border-gold-bright shadow-gold' : enabled ? 'bg-shadow border-gold-dim hover:border-gold' : 'bg-shadow/30 border-gold-dim/25 opacity-35 cursor-not-allowed'}`} title={enabled ? `${point} ponto${point > 1 ? 's' : ''}` : 'Disponível em estágios futuros'} />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              {attributePointsRemaining === 0 && <p className="mt-6 text-center font-body text-sm text-gold-bright">Todos os Pontos de Atributo foram distribuídos.</p>}
            </>
          )}

          {currentStep === 3 && (
            <>
              <h2 className="font-display text-xl sm:text-2xl text-gold-bright text-shadow-gold mb-2">Etapa 3 — Habilidades</h2>
              <p className="text-parchment-dim font-body text-sm sm:text-base mb-4">Distribua livremente seus Pontos de Habilidade.</p>
              <div className="bg-shadow/50 border border-gold-dim rounded-lg px-4 py-3 mb-8 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-body text-sm text-parchment-dim">Aprendiz · máximo de 2 pontos por habilidade</span>
                  <span className="font-display text-gold-bright">Pontos disponíveis: {skillPointsRemaining}</span>
                </div>
                <p className="font-body text-xs text-parchment-dim/70">Custo progressivo: 1º ponto custa 1 · 2º ponto custa +2.</p>
              </div>
              <p className="mb-6 text-xs text-parchment-dim">As Habilidades são definidas apenas pelos pontos investidos. Povo e Vertente permanecem narrativos.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {SKILL_GROUPS.map((group) => (
                  <section key={group.name} className="bg-shadow/40 border border-gold-dim rounded-xl p-4">
                    <h3 className="font-display text-base text-gold mb-4 min-h-10">{group.name}</h3>
                    <div className="space-y-4">
                      {group.skills.map((skill) => {
                        const rank = skills[skill.name] ?? 0;
                        return (
                          <div key={skill.name}>
                            <div className="relative group/skill-tooltip inline-flex items-center gap-1.5 font-body text-sm text-parchment mb-1.5">
                              <span>{skill.name}</span>
                              <button type="button" className="focus:outline-none" aria-label={`Informações sobre ${skill.name}`}>
                                <Info className="w-3.5 h-3.5 text-gold-dim cursor-help" />
                              </button>
                              <div className="pointer-events-none absolute left-0 bottom-full mb-2 z-30 w-64 opacity-0 group-hover/skill-tooltip:opacity-100 focus-within:opacity-100 transition-opacity bg-stone border border-gold rounded-lg p-3 shadow-gold text-left">
                                <strong className="block font-display text-gold-bright text-sm mb-1">{skill.name}</strong>
                                <span className="block font-body text-xs text-parchment mb-1">{skill.description}</span>
                                <span className="block font-body text-xs text-parchment-dim">{skill.examples}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5" aria-label={`${skill.name}: ${rank} de 5 pontos`}>
                              {[1,2,3,4,5].map((point) => {
                                const enabled = point <= APPRENTICE_SKILL_MAX;
                                const filled = point <= rank;
                                return (
                                  <button key={point} type="button" disabled={!enabled} onClick={() => enabled && setSkillRank(skill.name, point === rank ? point - 1 : point)} className={`w-5 h-5 rounded-full border transition-all ${filled ? 'bg-gold border-gold-bright shadow-gold' : enabled ? 'bg-shadow border-gold-dim hover:border-gold' : 'bg-shadow/30 border-gold-dim/25 opacity-35 cursor-not-allowed'}`} title={enabled ? `${point} ponto${point > 1 ? 's' : ''}` : 'Disponível em estágios futuros'} />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              {skillPointsRemaining === 0 && <p className="mt-6 text-center font-body text-sm text-gold-bright">Todos os Pontos de Habilidade foram distribuídos.</p>}
            </>
          )}

          {currentStep === 4 && (
            <>
              <h2 className="font-display text-xl sm:text-2xl text-gold-bright text-shadow-gold mb-2">Etapa 4 — Revisão</h2>
              <p className="text-parchment-dim font-body text-sm sm:text-base mb-6">
                Confira tudo antes de finalizar. Depois da confirmação, o jogador não poderá editar nem excluir este personagem.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Identidade</h3>
                  <div className="space-y-2 font-body text-sm">
                    <p><span className="text-parchment-dim">Nome:</span> <span className="text-parchment">{name}</span></p>
                    <p><span className="text-parchment-dim">Apelido:</span> <span className="text-parchment">{nickname || '—'}</span></p>
                    <p><span className="text-parchment-dim">Idade:</span> <span className="text-parchment">{age}</span></p>
                    <p><span className="text-parchment-dim">Como se referem ao personagem:</span> <span className="text-parchment">{genderLabel}</span></p>
                    <p><span className="text-parchment-dim">Nível:</span> <span className="text-parchment">1</span></p>
                    <p><span className="text-parchment-dim">Estágio:</span> <span className="text-gold-bright">{apprentice}</span></p>
                    <p><span className="text-parchment-dim">Classe:</span> <span className="text-parchment">—</span></p>
                  </div>
                </section>

                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Povo e Vertente</h3>
                  {selectedLineage && (
                    <img src={selectedLineage.image} alt={`Vertente ${lineage}`} className="w-full max-h-56 object-contain rounded-lg border border-gold-dim mb-4" />
                  )}
                  <p className="font-body text-sm text-parchment"><span className="text-parchment-dim">Povo:</span> {race}</p>
                  <p className="font-body text-sm text-parchment mt-2"><span className="text-parchment-dim">Vertente:</span> {lineage}</p>
                  {isHybrid && <><p className="font-body text-sm text-parchment mt-3"><span className="text-parchment-dim">Segundo Povo:</span> {secondaryRace}</p><p className="font-body text-sm text-parchment mt-2"><span className="text-parchment-dim">Segunda Vertente:</span> {secondaryLineage}</p></>}
                </section>

                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Atributos</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                    {ATTRIBUTE_GROUPS.flatMap((group) => group.attributes).map((attribute) => (
                      <div key={attribute.name} className="flex justify-between gap-3 font-body text-sm border-b border-gold-dim/20 pb-1">
                        <span className="text-parchment-dim">{attribute.name}</span>
                        <span className="text-gold-bright">{effectiveAttributes[attribute.name]}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Habilidades escolhidas</h3>
                  {selectedSkills.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
                      {selectedSkills.map(([skill, rank]) => (
                        <div key={skill} className="flex justify-between gap-3 font-body text-sm border-b border-gold-dim/20 pb-1">
                          <span className="text-parchment-dim">{skill}</span>
                          <span className="text-gold-bright">{rank}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-sm text-parchment-dim">Nenhuma habilidade recebeu pontos.</p>
                  )}
                </section>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-blood/10 border border-blood/40 rounded-lg p-4">
                <Lock className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <p className="font-body text-sm text-parchment-dim">
                  Ao finalizar, esta ficha será salva como permanente para o jogador. A evolução futura será feita pelos sistemas de progressão, não pela edição da criação.
                </p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 bg-shadow/80 backdrop-blur-md border-t border-gold-dim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-parchment-dim hover:text-gold-bright transition-colors duration-200 text-sm font-body px-4 py-2.5 rounded-lg border border-gold-dim hover:border-gold/50 bg-gradient-card"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <button
            onClick={goForward}
            disabled={!canContinue}
            className="flex items-center gap-2 text-stone font-display text-sm font-600 tracking-wide px-5 py-2.5 rounded-lg bg-gradient-gold shadow-gold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-95"
          >
            {currentStep === 4 ? 'Finalizar personagem' : 'Continuar'}
            {currentStep === 4 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {referenceView && <CreationReferenceOverlay view={referenceView} onClose={() => setReferenceView(null)} player={player} races={raceOptions} />}

      {confirmOpen && (
        <div className="fixed inset-0 z-50 bg-shadow/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-stone border border-gold rounded-xl p-6 shadow-gold">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-gold-bright" />
              <h3 className="font-display text-xl text-gold-bright">Finalizar personagem?</h3>
            </div>
            <p className="font-body text-sm text-parchment-dim leading-relaxed">
              Revise sua ficha antes de continuar. Após a criação, as informações do personagem não poderão ser alteradas ou excluídas pelo jogador.
            </p>
            {saveError && (
              <p className="mt-4 font-body text-sm text-blood bg-blood/10 border border-blood/40 rounded-lg p-3">{saveError}</p>
            )}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" disabled={saving} onClick={() => { setConfirmOpen(false); setSaveError(''); }} className="px-4 py-2.5 rounded-lg border border-gold-dim text-parchment-dim font-body text-sm hover:border-gold hover:text-parchment disabled:opacity-50">
                Voltar à revisão
              </button>
              <button type="button" disabled={saving} onClick={handleFinalize} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-gold text-stone font-display text-sm shadow-gold hover:brightness-110 disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Check className="w-4 h-4" /> Confirmar criação</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
