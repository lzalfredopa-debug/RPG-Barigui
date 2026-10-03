import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type LoginScreenProps = { onLogin: (player: Player) => void; };

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [alcunha, setAlcunha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = alcunha.trim();
    if (!trimmed) { setError('Essa alcunha não é reconhecida.'); return; }
    setLoading(true); setError(null);
    try {
      const { data, error: queryError } = await supabase.from('players').select('*').ilike('alcunha', trimmed).maybeSingle();
      if (queryError) throw queryError;
      if (!data || data.status !== 'ativa') { setError('Essa alcunha não é reconhecida.'); return; }
      onLogin(data as Player);
    } catch { setError('Essa alcunha não é reconhecida.'); }
    finally { setLoading(false); }
  };

  return <div className="trilha-login animate-fade-in">
    <div className="trilha-login-frame animate-fade-in-up">
      <section className="trilha-login-brand" aria-label="TRILHA">
        <img src="/trilha-acanto-oficial.png" alt="" aria-hidden="true" className="trilha-login-acanthus" />
        <p className="trilha-login-kicker">Sistema de RPG</p>
        <h1 className="trilha-login-title font-display">TRILHA</h1>
        <p className="trilha-login-expansion">Trajetória · Roleplay · Identidade<br/>Liberdade · História · Aventura</p>
        <p className="trilha-login-motto">“A trilha é forjada a cada passo.”</p>
      </section>

      <section className="trilha-login-panel">
        <p className="trilha-login-eyebrow">Entrada dos viajantes</p>
        <h2 className="trilha-login-heading font-display">Área do Jogador</h2>
        <p className="trilha-login-copy">Toda jornada começa por um nome conhecido. Informe sua alcunha para continuar.</p>
        <div className="trilha-login-rule" />
        <form onSubmit={handleSubmit}>
          <label htmlFor="alcunha" className="trilha-login-label">Alcunha</label>
          <input id="alcunha" type="text" value={alcunha} onChange={e=>{setAlcunha(e.target.value);if(error)setError(null)}} disabled={loading} autoFocus autoComplete="off" spellCheck={false} className={`trilha-login-input ${error?'animate-shake':''}`} placeholder="Digite sua alcunha..."/>
          {error&&<div className="trilha-login-error animate-fade-in"><AlertCircle className="w-4 h-4"/><span>{error}</span></div>}
          <button type="submit" disabled={loading||!alcunha.trim()} className="trilha-login-button">{loading?<><Loader2 className="w-4 h-4 animate-spin"/>Verificando...</>:<>Entrar na trilha <span>→</span></>}</button>
        </form>
        <p className="trilha-login-foot">Acesso restrito a jogadores cadastrados</p>
      </section>
    </div>
  </div>;
}
