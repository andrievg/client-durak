import React, { useState } from 'react';
import Menu from './components/Menu.jsx';
import Lobby from './components/Lobby.jsx';
import GameBoard from './components/GameBoard.jsx';
import { useLocalGame } from './hooks/useLocalGame.js';
import { useOnlineGame } from './hooks/useOnlineGame.js';

export default function App() {
  const [screen, setScreen] = useState('menu'); // menu | lobby | local | online
  const [onlineInit, setOnlineInit] = useState(null); // { roomId, playerIndex, state }

  return (
    <div className="app">
      {screen === 'menu' && (
        <Menu
          onLocal={() => setScreen('local')}
          onOnline={() => setScreen('lobby')}
        />
      )}

      {screen === 'lobby' && (
        <Lobby
          onBack={() => setScreen('menu')}
          onReady={(data) => {
            setOnlineInit(data);
            setScreen('online');
          }}
        />
      )}

      {screen === 'local' && (
        <LocalGame onLeave={() => setScreen('menu')} />
      )}

      {screen === 'online' && onlineInit && (
        <OnlineGame
          init={onlineInit}
          onLeave={() => {
            setOnlineInit(null);
            setScreen('menu');
          }}
        />
      )}
    </div>
  );
}

/* ============ Локальная игра ============ */
function LocalGame({ onLeave }) {
  const game = useLocalGame();
  return (
    <GameBoard
      state={game.state}
      myIndex={game.humanIndex}
      actions={{
        attack: game.attack,
        defend: game.defend,
        take: game.take,
        pass: game.pass,
        reset: game.reset,
      }}
      isOnline={false}
      onLeave={onLeave}
    />
  );
}

/* ============ Сетевая игра ============ */
function OnlineGame({ init, onLeave }) {
  const online = useOnlineGame();
  const [bootstrapped, setBootstrapped] = useState(false);

  // Пока не пришёл первый state — используем полученный из Lobby
  const state = online.state || init.state;
  const playerIndex = online.playerIndex ?? init.playerIndex;
  const roomId = online.roomId || init.roomId;

  React.useEffect(() => {
    if (!bootstrapped) setBootstrapped(true);
  }, [bootstrapped]);

  const handleLeave = () => {
    online.leave();
    onLeave();
  };

  return (
    <GameBoard
      state={state}
      myIndex={playerIndex}
      actions={{
        attack: online.attack,
        defend: online.defend,
        take: online.take,
        pass: online.pass,
        rematch: online.rematch,
      }}
      isOnline
      roomId={roomId}
      opponentLeft={online.opponentLeft}
      error={online.error}
      onLeave={handleLeave}
    />
  );
}