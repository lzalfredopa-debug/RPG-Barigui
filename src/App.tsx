import { useState } from 'react';
import LoginScreen from '@/components/LoginScreen';
import PlayerPage from '@/components/PlayerPage';
import CharacterCreation from '@/components/CharacterCreation';
import { type Player } from '@/lib/supabase';

type View = 'login' | 'player' | 'character-creation';

export default function App() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [view, setView] = useState<View>('login');

  if (!currentPlayer) {
    return <LoginScreen onLogin={(player) => { setCurrentPlayer(player); setView('player'); }} />;
  }

  if (view === 'character-creation') {
    return (
      <CharacterCreation
        player={currentPlayer}
        onBack={() => setView('player')}
        onCreated={() => setView('player')}
      />
    );
  }

  return (
    <PlayerPage
      player={currentPlayer}
      onLogout={() => { setCurrentPlayer(null); setView('login'); }}
      onCreateCharacter={() => setView('character-creation')}
    />
  );
}
