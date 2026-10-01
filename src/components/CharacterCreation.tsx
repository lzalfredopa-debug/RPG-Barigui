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

  const isFormValid = name.trim() !== '' && age.trim() !== '';

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
