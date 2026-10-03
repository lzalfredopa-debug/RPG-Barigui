import { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase, type Player } from '@/lib/supabase';

type LoginScreenProps = { onLogin: (player: Player) => void };

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [alcunha, setAlcunha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); const trimmed=alcunha.trim();
    if(!trimmed){setError('Essa alcunha não é reconhecida.');return}
    setLoading(true);setError(null);
    try { const {data,error:queryError}=await supabase.from('players').select('*').ilike('alcunha',trimmed).maybeSingle(); if(queryError)throw queryError; if(!data||data.status!=='ativa'){setError('Essa alcunha não é reconhecida.');return} onLogin(data as Player); }
    catch { setError('Essa alcunha não é reconhecida.'); }
    finally { setLoading(false); }
  };
  return <div className="trilha-login min-h-screen">
    <div className="trilha-login-ornament trilha-login-ornament-left" />
    <div className="trilha-login-ornament trilha-login-ornament-right" />
    <main className="trilha-login-layout animate-fade-in-up">
      <section className="trilha-brand-panel">
        <div className="trilha-brand-mark"><img src="/trilha-acanto.png" alt="Símbolo do TRILHA" /></div>
        <div className="trilha-brand-copy">
          <p className="trilha-kicker">Sistema de RPG</p>
          <h1>TRILHA</h1>
          <div className="trilha-rule"><span>◆</span></div>
          <p className="trilha-expansion">Trajetória · Roleplay · Identidade<br/>Liberdade · História · Aventura</p>
          <blockquote>“A trilha é forjada a cada passo.”</blockquote>
        </div>
      </section>
      <section className="trilha-access-panel">
        <div className="trilha-access-inner">
          <p className="trilha-kicker">Entrada dos viajantes</p>
          <h2>Área do Jogador</h2>
          <p className="trilha-access-intro">Toda jornada começa por um nome conhecido. Informe sua alcunha para continuar.</p>
          <form onSubmit={handleSubmit} className="trilha-form">
            <label htmlFor="alcunha">Alcunha</label>
            <div className={`trilha-input-wrap ${error?'is-error':''}`}><span className="trilha-input-flourish">❧</span><input id="alcunha" value={alcunha} onChange={e=>{setAlcunha(e.target.value);if(error)setError(null)}} disabled={loading} autoFocus autoComplete="off" spellCheck={false} placeholder="Digite sua alcunha..." /></div>
            {error&&<div className="trilha-error"><AlertCircle className="w-4 h-4"/><span>{error}</span></div>}
            <button type="submit" disabled={loading||!alcunha.trim()} className="trilha-primary-button">{loading?<><Loader2 className="w-5 h-5 animate-spin"/>Verificando...</>:<>Entrar na trilha <span>→</span></>}</button>
          </form>
          <div className="trilha-access-footer"><span></span><p>Acesso restrito a jogadores cadastrados</p><span></span></div>
        </div>
      </section>
    </main>
  </div>;
}
