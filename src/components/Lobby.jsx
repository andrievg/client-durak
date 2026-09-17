import React, { useState } from 'react';
import { socket } from '../net/socket.js';

export default function Lobby({ onBack, onReady }) {
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [waiting, setWaiting] = useState(false);

  // Подключаемся и слушаем события
  React.useEffect(() => {
    if (!socket.connected) socket.connect();

    const onState = (state) => {
      if (waiting || roomId) {
        onReady({ roomId, playerIndex: 0, state, isCreator: true });
      }
    };
    // на самом деле после joinRoom сервер сам присылает state,
    // для создателя: как только соперник вошёл, придёт 'state'
    socket.on('state', onState);
    return () => {
      socket.off('state', onState);
    };
  }, [waiting, roomId, onReady]);

  const createRoom = () => {
    setError('');
    setBusy(true);
    socket.emit('createRoom', { name: name || 'Игрок 1' }, (res) => {
      setBusy(false);
      if (!res?.ok) {
        setError(res?.error || 'Ошибка создания');
        return;
      }
      setRoomId(res.roomId);
      setWaiting(true);
    });
  };

  const joinRoom = () => {
    setError('');
    if (!code.trim()) {
      setError('Введите код комнаты');
      return;
    }
    setBusy(true);
    socket.emit(
      'joinRoom',
      { roomId: code.trim().toUpperCase(), name: name || 'Игрок 2' },
      (res) => {
        setBusy(false);
        if (!res?.ok) {
          setError(res?.error || 'Ошибка входа');
          return;
        }
        // ждём прихода state через 'state' listener выше —
        // но проще передать сразу: сервер пришлёт state через мгновение
        setRoomId(res.roomId);
        // Ждём state
        const handler = (state) => {
          socket.off('state', handler);
          onReady({
            roomId: res.roomId,
            playerIndex: res.playerIndex,
            state,
            isCreator: false,
          });
        };
        socket.on('state', handler);
      }
    );
  };

  // === Waiting screen (создатель ждёт соперника) ===
  if (waiting && roomId) {
    return (
      <div className="menu">
        <h1>Комната создана</h1>
        <div className="sub">Передай этот код другу:</div>
        <div className="code-display">{roomId}</div>
        <div className="hint">
          Друг должен зайти на этот же сайт, выбрать «Играть по сети» →
          «Войти в комнату» и ввести код.
        </div>
        <div className="spinner" />
        <button className="btn gray" onClick={onBack}>
          ← Назад
        </button>
      </div>
    );
  }

  // === Join mode ===
  if (mode === 'join') {
    return (
      <div className="menu">
        <h1>Войти в комнату</h1>
        <input
          className="input"
          placeholder="Твоё имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
        />
        <input
          className="code-input"
          placeholder="КОД"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={4}
        />
        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        <button className="btn green" onClick={joinRoom} disabled={busy}>
          {busy ? 'Подключение...' : 'Войти'}
        </button>
        <button className="btn gray" onClick={() => setMode(null)}>
          ← Назад
        </button>
      </div>
    );
  }

  // === Create mode ===
  if (mode === 'create') {
    return (
      <div className="menu">
        <h1>Создать комнату</h1>
        <input
          className="input"
          placeholder="Твоё имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
        />
        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        <button className="btn green" onClick={createRoom} disabled={busy}>
          {busy ? 'Создание...' : 'Создать'}
        </button>
        <button className="btn gray" onClick={() => setMode(null)}>
          ← Назад
        </button>
      </div>
    );
  }

  // === Main choice ===
  return (
    <div className="menu">
      <h1>Игра по сети</h1>
      <div className="sub">Создай комнату и поделись кодом</div>

      <button className="btn green" onClick={() => setMode('create')}>
        ➕ Создать комнату
      </button>
      <button className="btn" onClick={() => setMode('join')}>
        🔑 Войти по коду
      </button>
      <button className="btn gray" onClick={onBack}>
        ← В меню
      </button>
    </div>
  );
}