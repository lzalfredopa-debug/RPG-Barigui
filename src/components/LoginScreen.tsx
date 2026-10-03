import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type LoginScreenProps = {
  onLogin: (player: Player) => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [alcunha, setAlcunha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alcunha.trim();
    if (!trimmed) {
      setError('Essa alcunha não é reconhecida.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('players')
        .select('*')
        .ilike('alcunha', trimmed)
        .maybeSingle();

      if (queryError) throw queryError;

      if (!data || data.status !== 'ativa') {
        setError('Essa alcunha não é reconhecida.');
        return;
      }

      onLogin(data as Player);
    } catch {
      setError('Essa alcunha não é reconhecida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-fantasy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blood/5 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        {/* Símbolo oficial do TRILHA */}
        <div className="flex flex-col items-center mb-7 trilha-brand">
          <img src="/trilha-acanto.png" alt="Símbolo do TRILHA" className="trilha-emblem" />
          <div className="trilha-wordmark font-display">TRILHA</div>
          <div className="trilha-motto">A trilha é forjada a cada passo.</div>
        </div>

        {/* Card */}
        <div className="bg-gradient-card border border-gold-dim rounded-2xl shadow-gold-lg backdrop-blur-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="font-display text-3xl md:text-4xl font-700 text-gold-bright text-shadow-gold mb-2">
              Área do Jogador
            </h1>
            <div className="divider-gold mx-auto w-3/4 mb-5" />
            <p className="text-parchment-dim text-sm md:text-base font-body">
              Informe sua alcunha para continuar.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="alcunha"
                className="font-display text-xs uppercase tracking-widest text-gold/70 font-500"
              >
                Alcunha
              </label>
              <input
                id="alcunha"
                type="text"
                value={alcunha}
                onChange={(e) => {
                  setAlcunha(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className={`w-full bg-shadow/60 border ${
                  error ? 'border-blood' : 'border-gold-dim'
                } rounded-lg px-4 py-3 text-parchment font-body text-base placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark ${
                  error ? 'animate-shake' : ''
                }`}
                placeholder="Digite sua alcunha..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-blood text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !alcunha.trim()}
              className="w-full bg-gradient-gold text-shadow font-display text-base font-600 tracking-wide py-3 rounded-lg shadow-gold hover:brightness-110 active:brightness-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-stone"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Entrar</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-parchment-dim/40 text-xs mt-6 font-body tracking-wide">
          Acesso restrito a jogadores cadastrados
        </p>
      </div>
    </div>
  );
}
