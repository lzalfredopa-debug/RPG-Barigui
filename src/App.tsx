import { useState } from 'react';
import LoginScreen from '@/components/LoginScreen';
import PlayerPage from '@/components/PlayerPage';
import MasterPage from '@/components/MasterPage';
import CharacterCreation from '@/components/CharacterCreation';
import TableChat from '@/components/TableChat';
import TrilhaRadio from '@/components/TrilhaRadio';
import { type Player } from '@/lib/supabase';

type View = 'login' | 'player' | 'character-creation';

export default function App() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [view, setView] = useState<View>('login');

  if (!currentPlayer) {
    return <LoginScreen onLogin={(player) => { setCurrentPlayer(player); setView('player'); }} />;
  }

  if (currentPlayer.player_identifier === 'Mestre' && view === 'player') {
    return (
      <>
        <MasterPage player={currentPlayer} onLogout={() => { setCurrentPlayer(null); setView('login'); }} />
        <TableChat player={currentPlayer} />
        <TrilhaRadio player={currentPlayer} />
      </>
    );
  }

  if (view === 'character-creation') {
    return (
      <>
        <CharacterCreation
          player={currentPlayer}
          onBack={() => setView('player')}
          onCreated={() => setView('player')}
        />
        <TableChat player={currentPlayer} />
        <TrilhaRadio player={currentPlayer} />
      </>
    );
  }

  return (
    <>
      <PlayerPage
        player={currentPlayer}
        onLogout={() => { setCurrentPlayer(null); setView('login'); }}
        onCreateCharacter={() => setView('character-creation')}
      />
      <TableChat player={currentPlayer} />
        <TrilhaRadio player={currentPlayer} />
    </>
  );
}
