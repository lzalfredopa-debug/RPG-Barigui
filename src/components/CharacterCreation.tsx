import { useState } from 'react';
import { ArrowLeft, ChevronRight, Check, Info, Loader2, Lock } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type CharacterCreationProps = {
  player: Player;
  onBack: () => void;
  onCreated: () => void;
};

const STEPS = [
  { id: 1, label: 'Identidade' },
  { id: 2, label: 'Atributos' },
  { id: 3, label: 'Habilidades' },
  { id: 4, label: 'Revisão' },
];



type Lineage = { name: string; description: string; image: string };
type Race = { name: string; lineages: Lineage[] };

const RACES: Race[] = [
  { name: 'Humanos', lineages: [
    { name: 'Terranos', image: '/images/linhagens/humanos-terrano.png', description: 'Constituição próxima à humana comum, com grande variedade de aparência. Representam a ancestralidade humana mais difundida.' },
    { name: 'Altaneiros', image: '/images/linhagens/humanos-altaneiro.png', description: 'Descendentes de povos das grandes altitudes, com facilidade para respirar em ar rarefeito e suportar o frio.' },
    { name: 'Marítimos', image: '/images/linhagens/humanos-maritimo.png', description: 'Descendentes de povos dos arquipélagos, com adaptações à vida na água, como maior capacidade de prender a respiração.' },
  ]},
  { name: 'Elfos', lineages: [
    { name: 'Silvestres', image: '/images/linhagens/elfos-silvestre.png', description: 'Herança ligada às florestas; olhos e cabelos podem apresentar tons de folhas, madeira e âmbar.' },
    { name: 'Astrais', image: '/images/linhagens/elfos-astral.png', description: 'Herança ligada ao céu noturno; olhos luminosos e marcas semelhantes a constelações.' },
    { name: 'Profundos', image: '/images/linhagens/elfos-profundo.png', description: 'Adaptados ao subterrâneo; olhos sensíveis à luz e aparência em tons de pedra, cinza ou violeta.' },
  ]},
  { name: 'Anões', lineages: [
    { name: 'Graníticos', image: '/images/linhagens/anoes-granitico.png', description: 'Corpos compactos e ossatura densa, associados às antigas linhagens das montanhas.' },
    { name: 'Ígneos', image: '/images/linhagens/anoes-igneo.png', description: 'Herança de regiões vulcânicas; pele quente e cabelos em tons de cobre, carvão ou brasa.' },
    { name: 'Cristalinos', image: '/images/linhagens/anoes-cristalino.png', description: 'Pequenas formações minerais surgem na pele ou nos cabelos, com sensibilidade às vibrações da pedra.' },
  ]},
  { name: 'Orcs', lineages: [
    { name: 'Colossais', image: '/images/linhagens/orcs-colossal.png', description: 'Maior estatura e musculatura, com presas e estrutura óssea acentuadas.' },
    { name: 'Glaciais', image: '/images/linhagens/orcs-glacial.png', description: 'Pelagem fina ou cabelos densos, pele em tons frios e adaptação às baixas temperaturas.' },
    { name: 'Rubros', image: '/images/linhagens/orcs-rubro.png', description: 'Pele em tons de ocre, cobre ou vermelho, com adaptação ao calor de regiões áridas.' },
  ]},
  { name: 'Pequeninos', lineages: [
    { name: 'Campestres', image: '/images/linhagens/pequeninos-campestre.png', description: 'Pés largos, geralmente cobertos de pelos, e constituição robusta para seu tamanho.' },
    { name: 'Brumosos', image: '/images/linhagens/pequeninos-brumoso.png', description: 'Herança feérica sutil, com passos silenciosos e contornos que parecem se confundir com a névoa.' },
    { name: 'Ribeirinhos', image: '/images/linhagens/pequeninos-ribeirinho.png', description: 'Dedos parcialmente palmados e facilidade para nadar e se movimentar em terrenos alagados.' },
  ]},
  { name: 'Goblins', lineages: [
    { name: 'Cavernícolas', image: '/images/linhagens/goblins-cavernicola.png', description: 'Olhos e orelhas grandes, adaptados à percepção em ambientes subterrâneos.' },
    { name: 'Arborícolas', image: '/images/linhagens/goblins-arboricola.png', description: 'Membros alongados e dedos fortes, próprios para agarrar galhos e escalar.' },
    { name: 'Ferruginosos', image: '/images/linhagens/goblins-ferruginoso.png', description: 'Pele de aspecto salpicado, em tons de ferrugem, e capacidade de perceber metais pelo cheiro.' },
  ]},
  { name: 'Tiferinos', lineages: [
    { name: 'Infernais', image: '/images/linhagens/tiferinos-infernal.png', description: 'Chifres marcantes, cauda e sinais de uma herança ligada ao fogo e a antigos pactos.' },
    { name: 'Abissais', image: '/images/linhagens/tiferinos-abissal.png', description: 'Traços assimétricos, chifres irregulares e manifestações de uma herança ligada ao caos e à transformação.' },
    { name: 'Umbráticos', image: '/images/linhagens/tiferinos-umbratico.png', description: 'Cores escuras ou desbotadas, olhos contrastantes e sombras que parecem acompanhar seus movimentos com atraso.' },
  ]},
  { name: 'Povo Fúngico', lineages: [
    { name: 'Micelares', image: '/images/linhagens/povo-fungico-micelar.png', description: 'Corpos fibrosos, semelhantes a raízes entrelaçadas, capazes de perceber sinais através de redes de fungos.' },
    { name: 'Chapeleiros', image: '/images/linhagens/povo-fungico-chapeleiro.png', description: 'Chapéus de cogumelo de diferentes formatos e cores; produzem pequenos conjuntos de esporos.' },
    { name: 'Luminescentes', image: '/images/linhagens/povo-fungico-luminescente.png', description: 'Partes do corpo emitem luz, usada para iluminar suavemente e transmitir sinais.' },
  ]},
  { name: 'Draconatos', lineages: [
    { name: 'Metálicos', image: '/images/linhagens/draconatos-metalico.png', description: 'Escamas com brilho e aspecto de metal.' },
    { name: 'Cromáticos', image: '/images/linhagens/draconatos-cromatico.png', description: 'Escamas de cores intensas e bem definidas.' },
    { name: 'Gemáticos', image: '/images/linhagens/draconatos-gematico.png', description: 'Escamas cristalinas ou facetadas, semelhantes a pedras preciosas.' },
  ]},
  { name: 'Povo Fera', lineages: [
    { name: 'Felinos', image: '/images/linhagens/povo-fera-felino.png', description: 'Traços de gatos, linces, onças ou leões, com garras retráteis e equilíbrio apurado.' },
    { name: 'Canídeos', image: '/images/linhagens/povo-fera-canideo.png', description: 'Traços de lobos, cães ou raposas, com olfato desenvolvido e orelhas expressivas.' },
    { name: 'Avianos', image: '/images/linhagens/povo-fera-aviano.png', description: 'Penas, bicos e características de diferentes aves. O formato das asas e sua utilidade ainda serão definidos.' },
  ]},
];



type AttributeDefinition = {
  name: string;
  description: string;
  examples: string;
};

type AttributeGroup = {
  name: string;
  attributes: AttributeDefinition[];
};

const ATTRIBUTE_GROUPS: AttributeGroup[] = [
  {
    name: 'Físicos',
    attributes: [
      { name: 'Força', description: 'Potência e força muscular.', examples: 'Erguer, empurrar, quebrar e golpear.' },
      { name: 'Vigor', description: 'Resistência e capacidade física.', examples: 'Suportar esforço, dor, venenos e cansaço.' },
      { name: 'Agilidade', description: 'Rapidez e controle do corpo.', examples: 'Esquivar, saltar, equilibrar-se e mover-se.' },
      { name: 'Destreza', description: 'Precisão e coordenação manual.', examples: 'Mirar, manipular objetos e executar movimentos delicados.' },
    ],
  },
  {
    name: 'Mentais',
    attributes: [
      { name: 'Inteligência', description: 'Conhecimento e capacidade de aprender.', examples: 'Estudo, memória e conhecimento técnico.' },
      { name: 'Raciocínio', description: 'Lógica e capacidade de solucionar problemas.', examples: 'Deduzir, calcular, investigar e improvisar soluções.' },
      { name: 'Sabedoria', description: 'Julgamento e compreensão adquirida.', examples: 'Bom senso, experiência e interpretação de situações.' },
      { name: 'Percepção', description: 'Atenção e capacidade de notar o ambiente.', examples: 'Observar, ouvir, procurar e detectar mudanças.' },
    ],
  },
  {
    name: 'Sociais',
    attributes: [
      { name: 'Carisma', description: 'Capacidade de cativar e conquistar.', examples: 'Persuadir, entreter e inspirar simpatia.' },
      { name: 'Presença', description: 'Impacto e força da personalidade.', examples: 'Intimidar, liderar, impor-se e chamar atenção.' },
      { name: 'Manipulação', description: 'Capacidade de influenciar de forma indireta.', examples: 'Blefar, enganar, dissimular e conduzir alguém.' },
      { name: 'Empatia', description: 'Capacidade de compreender outras pessoas.', examples: 'Perceber emoções, intenções e criar conexão.' },
    ],
  },
];

const SKILL_GROUPS = [
  {
    name: 'Marcial',
    skills: [{ name: 'Tática', description: 'Capacidade de analisar e coordenar ações durante conflitos.', examples: 'Posicionamento, formações, coordenar aliados e explorar terreno.' }, { name: 'Cavalaria', description: 'Habilidade para montar e controlar animais, inclusive em situações de conflito.', examples: 'Cavalgar, controlar montaria, manobrar e combater montado.' }, { name: 'Esgrima', description: 'Técnica no uso preciso de armas brancas empunhadas.', examples: 'Espadas, sabres, floretes e aparar golpes.' }, { name: 'Luta', description: 'Capacidade de combater utilizando o próprio corpo.', examples: 'Socos, chutes, agarrões e imobilizações.' }, { name: 'Vigilância', description: 'Capacidade de manter atenção ativa diante de possíveis ameaças.', examples: 'Montar guarda, perceber aproximações e notar emboscadas.' }, { name: 'Proteção', description: 'Capacidade de defender outras pessoas contra perigos e ataques.', examples: 'Interceptar ataques, cobrir aliado, escoltar e proteger posição.' }, { name: 'Defesa', description: 'Técnica para evitar ou neutralizar ataques direcionados a si.', examples: 'Bloquear, aparar e assumir postura defensiva.' }, { name: 'Armaduras', description: 'Conhecimento e prática no uso de equipamentos de proteção.', examples: 'Vestir corretamente, movimentar-se com armadura e reconhecer proteções.' }, { name: 'Escaramuça', description: 'Capacidade de lutar com mobilidade e constante reposicionamento.', examples: 'Atacar e recuar, flanquear e realizar combate móvel.' }, { name: 'Tiro', description: 'Técnica para atingir alvos utilizando armas de ataque à distância.', examples: 'Arco, besta, armas de projétil e mirar.' }, { name: 'Emboscada', description: 'Capacidade de preparar e executar ataques aproveitando surpresa e posição.', examples: 'Preparar tocaia, escolher posição e atacar de surpresa.' }, { name: 'Atletismo', description: 'Capacidade física aplicada a atividades que exigem esforço e coordenação.', examples: 'Correr, escalar, nadar e saltar.' }],
  },
  {
    name: 'Campo & Ofício',
    skills: [{ name: 'Rastreamento', description: 'Capacidade de identificar e seguir sinais deixados pela passagem de seres ou veículos.', examples: 'Pegadas, rastros, direção e sinais de passagem.' }, { name: 'Condução', description: 'Capacidade de controlar veículos, carroças e outros meios de transporte.', examples: 'Carroças, carruagens, trenós e manobras.' }, { name: 'Furtividade', description: 'Capacidade de agir e se deslocar evitando ser percebido.', examples: 'Esconder-se, mover-se silenciosamente e infiltrar-se.' }, { name: 'Arrombamento', description: 'Conhecimento de fechaduras e mecanismos utilizados para restringir acesso.', examples: 'Abrir fechaduras, identificar mecanismos e contornar trancas.' }, { name: 'Prestidigitação', description: 'Habilidade manual para realizar movimentos rápidos, precisos ou discretos.', examples: 'Esconder objetos, truques de mãos e pequenos furtos.' }, { name: 'Metalurgia', description: 'Conhecimento sobre metais e técnicas utilizadas para trabalhá-los.', examples: 'Forjar, reparar, avaliar metais e fabricar peças.' }, { name: 'Construção', description: 'Conhecimento prático para criar e reparar estruturas e objetos.', examples: 'Carpintaria, estruturas, reparos e avaliar construções.' }, { name: 'Mecânica', description: 'Conhecimento sobre mecanismos, engrenagens e dispositivos físicos.', examples: 'Reparar mecanismos, montar dispositivos e identificar falhas.' }, { name: 'Alquimia', description: 'Conhecimento sobre substâncias, suas propriedades e suas combinações.', examples: 'Preparar compostos, identificar substâncias e reagentes.' }, { name: 'Sobrevivência', description: 'Capacidade de obter recursos e permanecer seguro em ambientes naturais.', examples: 'Conseguir alimento, abrigo, água e reconhecer perigos naturais.' }, { name: 'Exploração', description: 'Capacidade de investigar e atravessar lugares desconhecidos.', examples: 'Explorar ruínas, cavernas, mapear áreas e encontrar passagens.' }, { name: 'Navegação', description: 'Capacidade de determinar posição, direção e trajetos.', examples: 'Mapas, bússola, estrelas e planejar rotas.' }],
  },
  {
    name: 'Sociedade, Cultura & Expressão',
    skills: [{ name: 'Escrita', description: 'Capacidade de comunicar ideias e informações por meio de textos.', examples: 'Cartas, relatos, documentos e registros.' }, { name: 'Enganação', description: 'Capacidade de fazer outras pessoas acreditarem em informações falsas ou incompletas.', examples: 'Mentir, inventar histórias e disfarçar intenções.' }, { name: 'Trapaça', description: 'Capacidade de manipular regras, situações ou procedimentos em benefício próprio.', examples: 'Fraudar jogos, aplicar golpes e explorar brechas.' }, { name: 'Jornadas', description: 'Conhecimento adquirido por viagens, povos e experiências em diferentes lugares.', examples: 'Costumes regionais, rotas conhecidas e histórias de viagem.' }, { name: 'Poética', description: 'Capacidade de criar e transmitir ideias através da linguagem artística e narrativa.', examples: 'Poemas, histórias, versos e composição narrativa.' }, { name: 'Interpretação', description: 'Capacidade de representar personagens, emoções ou identidades.', examples: 'Atuação, imitação e disfarce comportamental.' }, { name: 'Música', description: 'Conhecimento e prática de expressão musical.', examples: 'Cantar, tocar instrumentos, compor e reconhecer melodias.' }, { name: 'Artes Visuais', description: 'Capacidade de criar e compreender obras expressas visualmente.', examples: 'Pintura, desenho, escultura e ilustração.' }, { name: 'Etiqueta', description: 'Conhecimento das normas sociais e comportamentos esperados em diferentes ambientes.', examples: 'Cerimônias, protocolos, costumes e formalidades.' }, { name: 'Mediação', description: 'Capacidade de facilitar entendimento entre pessoas ou grupos em desacordo.', examples: 'Conciliar disputas, encontrar acordos e reduzir conflitos.' }, { name: 'Oratória', description: 'Capacidade de transmitir ideias de forma clara e convincente diante de outras pessoas.', examples: 'Discursos, debates, apresentações e falar para multidões.' }, { name: 'Negociação', description: 'Capacidade de alcançar acordos através da troca de propostas e concessões.', examples: 'Barganhar, negociar contratos, preços e condições.' }],
  },
  {
    name: 'Conhecimento & Doutrina',
    skills: [{ name: 'Comércio', description: 'Conhecimento sobre compra, venda e circulação de bens e serviços.', examples: 'Avaliar mercadorias, reconhecer mercados, preços e rotas comerciais.' }, { name: 'Finanças', description: 'Conhecimento sobre dinheiro, patrimônio, crédito e operações financeiras.', examples: 'Calcular juros, avaliar dívidas e administrar recursos.' }, { name: 'Administração', description: 'Capacidade de organizar recursos, pessoas e atividades para alcançar um objetivo.', examples: 'Planejamento, logística, gestão de equipes e organização.' }, { name: 'Estratégia', description: 'Capacidade de elaborar planos de longo prazo considerando recursos, objetivos e adversários.', examples: 'Campanhas, planejamento militar e antecipar consequências.' }, { name: 'Disciplina Marcial', description: 'Conhecimento de tradições, princípios e práticas formais relacionadas ao combate.', examples: 'Doutrinas militares, treinamento e códigos marciais.' }, { name: 'Elementalismo', description: 'Conhecimento sobre forças e manifestações associadas aos elementos.', examples: 'Fogo, água, terra, ar e fenômenos elementais.' }, { name: 'Arcanismo', description: 'Conhecimento teórico sobre magia e fenômenos arcanos.', examples: 'Reconhecer magia, símbolos arcanos e teorias mágicas.' }, { name: 'Ritualismo', description: 'Conhecimento sobre preparação, estrutura e execução de rituais.', examples: 'Círculos, componentes, cerimônias mágicas e identificar rituais.' }, { name: 'Manipulação Arcana', description: 'Conhecimento prático sobre como controlar e modificar manifestações mágicas.', examples: 'Conduzir energia, alterar efeitos e estabilizar fenômenos arcanos.' }, { name: 'Teologia', description: 'Conhecimento sobre divindades, religiões, crenças e suas tradições.', examples: 'Cultos, textos sagrados, símbolos religiosos e dogmas.' }, { name: 'Medicina', description: 'Conhecimento sobre o corpo, ferimentos, doenças e formas de tratamento.', examples: 'Diagnosticar, tratar ferimentos, anatomia e primeiros socorros.' }, { name: 'Espiritualismo', description: 'Conhecimento sobre espíritos e fenômenos relacionados ao mundo espiritual.', examples: 'Reconhecer manifestações, tradições espirituais, entidades e contato espiritual.' }],
  },
] as const;

const ATTRIBUTE_INITIAL_POINTS = 1;
const ATTRIBUTE_BONUS_POINTS = 4;
const APPRENTICE_ATTRIBUTE_MAX = 2;
const SKILL_INITIAL_POINTS = 8;
const APPRENTICE_SKILL_MAX = 2;

const allAttributeNames = ATTRIBUTE_GROUPS.flatMap((group) => group.attributes.map((attribute) => attribute.name));
const allSkillNames = SKILL_GROUPS.flatMap((group) => group.skills.map((skill) => skill.name));

const GENDER_OPTIONS = [
  { id: 'ele', label: 'Ele / Dele' },
  { id: 'ela', label: 'Ela / Dela' },
  { id: 'elu', label: 'Elu / Delu' },
  { id: 'neutro', label: 'Não faz diferença' },
];

export default function CharacterCreation({ player, onBack, onCreated }: CharacterCreationProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [lineage, setLineage] = useState('');
  const [attributes, setAttributes] = useState<Record<string, number>>(() =>
    Object.fromEntries(allAttributeNames.map((attribute) => [attribute, ATTRIBUTE_INITIAL_POINTS]))
  );
  const [skills, setSkills] = useState<Record<string, number>>(() =>
    Object.fromEntries(allSkillNames.map((skill) => [skill, 0]))
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const selectedRace = RACES.find((item) => item.name === race);
  const isFormValid = name.trim() !== '' && age.trim() !== '' && race !== '' && lineage !== '';
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
  const selectedLineage = selectedRace?.lineages.find((item) => item.name === lineage);
  const selectedSkills = Object.entries(skills).filter(([, rank]) => rank > 0);

  const handleFinalize = async () => {
    if (saving) return;
    setSaving(true);
    setSaveError('');

    try {
      const { error } = await supabase.from('characters').insert({
        player_id: player.id,
        name: name.trim(),
        nickname: nickname.trim() || null,
        age: Number(age),
        gender: gender || null,
        race,
        lineage,
        level: 1,
        class_name: 'Aprendiz',
        attributes,
        skills,
      });

      if (error) throw error;
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
    (currentStep === 3 && skillPointsRemaining === 0);

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

      {/* Body */}
      <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 flex-1 py-4">
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
                Gênero e pronomes
              </label>
              <p className="text-parchment-dim/60 text-xs font-body">
                Como o personagem se identifica.
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

            {/* Raça e Linhagem */}
            <div className="divider-gold my-8" />
            <section className="space-y-6">
              <div>
                <h3 className="font-display text-lg text-gold tracking-wide mb-2">Raça e Linhagem</h3>
                <p className="text-parchment-dim/70 text-sm font-body">Escolha a ancestralidade do seu personagem.</p>
              </div>

              <div className="space-y-3">
                <div className="font-display text-sm font-500 text-gold-bright tracking-wide">
                  Raça <span className="text-blood">*</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {RACES.map((item) => (
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
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {selectedRace && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="font-display text-sm font-500 text-gold-bright tracking-wide">
                    Linhagem <span className="text-blood">*</span>
                  </div>
                  <p className="text-parchment-dim/60 text-xs font-body">
                    Escolha uma linhagem de {selectedRace.name}. As descrições são informativas e ainda não concedem bônus ou habilidades.
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
                        <img
                          src={item.image}
                          alt={`Ilustração da linhagem ${item.name}`}
                          className="block w-full h-auto rounded-md mb-4 border border-gold-dim/60"
                          loading="lazy"
                        />
                        <span className={`block font-display text-sm mb-2 ${lineage === item.name ? 'text-gold-bright' : 'text-gold'}`}>
                          {item.name}
                        </span>
                        <span className="block font-body text-xs leading-relaxed text-parchment-dim">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                    <p><span className="text-parchment-dim">Gênero e pronomes:</span> <span className="text-parchment">{genderLabel}</span></p>
                    <p><span className="text-parchment-dim">Nível:</span> <span className="text-parchment">1</span></p>
                    <p><span className="text-parchment-dim">Classe:</span> <span className="text-gold-bright">Aprendiz</span></p>
                  </div>
                </section>

                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Raça e Linhagem</h3>
                  {selectedLineage && (
                    <img src={selectedLineage.image} alt={`Linhagem ${lineage}`} className="w-full max-h-56 object-contain rounded-lg border border-gold-dim mb-4" />
                  )}
                  <p className="font-body text-sm text-parchment"><span className="text-parchment-dim">Raça:</span> {race}</p>
                  <p className="font-body text-sm text-parchment mt-2"><span className="text-parchment-dim">Linhagem:</span> {lineage}</p>
                </section>

                <section className="bg-shadow/40 border border-gold-dim rounded-xl p-5">
                  <h3 className="font-display text-lg text-gold-bright mb-4">Atributos</h3>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                    {ATTRIBUTE_GROUPS.flatMap((group) => group.attributes).map((attribute) => (
                      <div key={attribute.name} className="flex justify-between gap-3 font-body text-sm border-b border-gold-dim/20 pb-1">
                        <span className="text-parchment-dim">{attribute.name}</span>
                        <span className="text-gold-bright">{attributes[attribute.name]}</span>
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
