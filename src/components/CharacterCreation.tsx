import { useState } from 'react';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import type { Player } from '@/lib/supabase';

type CharacterCreationProps = {
  player: Player;
  onBack: () => void;
};

const STEPS = [
  { id: 1, label: 'Identidade' },
  { id: 2, label: 'Atributos' },
  { id: 3, label: 'Classe' },
  { id: 4, label: 'Habilidades' },
  { id: 5, label: 'Revisão' },
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

const GENDER_OPTIONS = [
  { id: 'ele', label: 'Ele / Dele' },
  { id: 'ela', label: 'Ela / Dela' },
  { id: 'elu', label: 'Elu / Delu' },
  { id: 'neutro', label: 'Não faz diferença' },
];

export default function CharacterCreation({ onBack }: CharacterCreationProps) {
  const currentStep = 1;

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [race, setRace] = useState('');
  const [lineage, setLineage] = useState('');

  const selectedRace = RACES.find((item) => item.name === race);
  const isFormValid = name.trim() !== '' && age.trim() !== '' && race !== '' && lineage !== '';

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
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 bg-shadow/80 backdrop-blur-md border-t border-gold-dim">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-parchment-dim hover:text-gold-bright transition-colors duration-200 text-sm font-body px-4 py-2.5 rounded-lg border border-gold-dim hover:border-gold/50 bg-gradient-card"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <button
            disabled={!isFormValid}
            className="flex items-center gap-2 text-stone font-display text-sm font-600 tracking-wide px-5 py-2.5 rounded-lg bg-gradient-gold shadow-gold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:brightness-95"
          >
            Continuar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
