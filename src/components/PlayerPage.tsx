import { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  Scroll,
  MessageSquare,
  Lightbulb,
  Plus,
  User,
  Send,
  Loader2,
  Save,
  X,
} from 'lucide-react';
import { supabase, type Player, type PersonalNote, type MasterMessage } from '@/lib/supabase';

type PlayerPageProps = {
  player: Player;
  onLogout: () => void;
  onCreateCharacter: () => void;
};

export default function PlayerPage({ player, onLogout, onCreateCharacter }: PlayerPageProps) {
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [notesContent, setNotesContent] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [masterMessages, setMasterMessages] = useState<MasterMessage[]>([]);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionSending, setSuggestionSending] = useState(false);
  const [suggestionSent, setSuggestionSent] = useState(false);

  const loadNotes = useCallback(async () => {
    setNotesLoading(true);
    const { data } = await supabase
      .from('personal_notes')
      .select('*')
      .eq('player_id', player.id)
      .order('updated_at', { ascending: false });
    setNotes(data || []);
    if (data && data.length > 0) {
      setNotesContent(data[0].content);
    }
    setNotesLoading(false);
  }, [player.id]);

  const loadMasterMessages = useCallback(async () => {
    const { data } = await supabase
      .from('master_messages')
      .select('*')
      .eq('player_id', player.id)
      .order('created_at', { ascending: false });
    setMasterMessages(data || []);
  }, [player.id]);

  useEffect(() => {
    loadNotes();
    loadMasterMessages();
  }, [loadNotes, loadMasterMessages]);

  const handleSaveNotes = async () => {
    if (notesSaving) return;
    setNotesSaving(true);
    setNotesSaved(false);

    try {
      if (notes.length > 0) {
        const { error } = await supabase
          .from('personal_notes')
          .update({ content: notesContent, updated_at: new Date().toISOString() })
          .eq('id', notes[0].id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('personal_notes')
          .insert({ player_id: player.id, content: notesContent })
          .select()
          .single();
        if (error) throw error;
        setNotes([data]);
      }
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch {
      // silently fail — non-critical
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSendSuggestion = async () => {
    if (!suggestionText.trim() || suggestionSending) return;
    setSuggestionSending(true);
    try {
      await supabase.from('suggestions').insert({
        player_id: player.id,
        content: suggestionText.trim(),
      });
      setSuggestionText('');
      setSuggestionSent(true);
      setTimeout(() => {
        setSuggestionSent(false);
        setSuggestionOpen(false);
      }, 2000);
    } catch {
      // silently fail
    } finally {
      setSuggestionSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-fantasy animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-shadow/80 backdrop-blur-md border-b border-gold-dim">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-card border border-gold-dim flex items-center justify-center">
              <User className="w-5 h-5 text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-display text-lg sm:text-xl text-gold-bright text-shadow-dark leading-tight">
                Bem-vindo, {player.player_name || player.alcunha}
              </h1>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-parchment-dim hover:text-blood transition-colors duration-200 text-sm font-body px-3 py-2 rounded-lg hover:bg-blood/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* My Characters */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-3 mb-4">
            <Scroll className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h2 className="font-display text-xl text-gold-bright tracking-wide">
              Meus Personagens
            </h2>
          </div>

          <div className="bg-gradient-card border border-gold-dim rounded-xl p-6 sm:p-8 shadow-gold">
            <p className="text-parchment-dim text-center py-8 font-body">
              Você ainda não possui personagens.
            </p>
            {/* Prepared area for future character cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 hidden">
              {/* Character cards will go here */}
            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              onClick={onCreateCharacter}
              className="group flex items-center gap-2 bg-gradient-gold text-stone font-display text-sm font-600 tracking-wide px-6 py-3 rounded-lg shadow-gold hover:brightness-110 active:brightness-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
              Criar novo personagem
            </button>
          </div>
        </section>

        <div className="divider-gold" />

        {/* Personal Notes */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <Scroll className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h2 className="font-display text-xl text-gold-bright tracking-wide">
              Anotações Pessoais
            </h2>
          </div>

          <div className="bg-gradient-card border border-gold-dim rounded-xl p-4 sm:p-6 shadow-gold">
            {notesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
              </div>
            ) : (
              <>
                <textarea
                  value={notesContent}
                  onChange={(e) => setNotesContent(e.target.value)}
                  placeholder="Escreva seus lembretes aqui..."
                  rows={5}
                  className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-sm placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark resize-y min-h-[120px]"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-parchment-dim/50">
                    {notesContent.length} caracteres
                  </span>
                  <button
                    onClick={handleSaveNotes}
                    disabled={notesSaving}
                    className="flex items-center gap-2 text-sm font-body text-gold hover:text-gold-bright transition-colors duration-200 disabled:opacity-50"
                  >
                    {notesSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : notesSaved ? (
                      <>
                        <Save className="w-4 h-4" />
                        Salvo!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        <div className="divider-gold" />

        {/* Master Messages */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-5 h-5 text-gold" strokeWidth={1.5} />
            <h2 className="font-display text-xl text-gold-bright tracking-wide">
              Recados do Mestre
            </h2>
          </div>

          <div className="bg-gradient-card border border-gold-dim rounded-xl p-6 shadow-gold">
            {masterMessages.length === 0 ? (
              <p className="text-parchment-dim text-center py-8 font-body">
                Nenhum recado no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {masterMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-shadow/40 border border-gold-dim rounded-lg p-4 animate-fade-in"
                  >
                    <p className="text-parchment font-body text-sm whitespace-pre-wrap">
                      {msg.content}
                    </p>
                    <p className="text-parchment-dim/50 text-xs mt-2">
                      {new Date(msg.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="divider-gold" />

        {/* Send Suggestion */}
        <section className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {!suggestionOpen ? (
            <button
              onClick={() => setSuggestionOpen(true)}
              className="flex items-center gap-2 text-parchment-dim/60 hover:text-gold transition-colors duration-200 text-sm font-body"
            >
              <Lightbulb className="w-4 h-4" />
              Enviar sugestão
            </button>
          ) : (
            <div className="bg-gradient-card border border-gold-dim rounded-xl p-4 sm:p-6 shadow-gold animate-scale-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-gold" />
                  <h3 className="font-display text-base text-gold-bright tracking-wide">
                    Enviar Sugestão
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setSuggestionOpen(false);
                    setSuggestionText('');
                  }}
                  className="text-parchment-dim/60 hover:text-blood transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {suggestionSent ? (
                <div className="text-center py-6 animate-fade-in">
                  <p className="text-gold font-body text-sm">
                    Sugestão enviada com sucesso. Obrigado!
                  </p>
                </div>
              ) : (
                <>
                  <textarea
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    placeholder="Escreva seu feedback ou sugestão..."
                    rows={4}
                    className="w-full bg-shadow/60 border border-gold-dim rounded-lg px-4 py-3 text-parchment font-body text-sm placeholder:text-parchment-dim/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all duration-200 shadow-inset-dark resize-y"
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={handleSendSuggestion}
                      disabled={!suggestionText.trim() || suggestionSending}
                      className="flex items-center gap-2 bg-gradient-gold text-stone font-display text-sm font-600 px-4 py-2 rounded-lg shadow-gold hover:brightness-110 active:brightness-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {suggestionSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-parchment-dim hover:text-blood transition-colors duration-200 text-sm font-body py-3 rounded-lg border border-gold-dim hover:border-blood/50 bg-gradient-card"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </footer>
    </div>
  );
}
