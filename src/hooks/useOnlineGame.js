import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../net/socket.js';

export function useOnlineGame() {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [playerIndex, setPlayerIndex] = useState(null);
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const listenersRef = useRef(false);

  useEffect(() => {
    if (listenersRef.current) return;
    listenersRef.current = true;

    socket.connect();
    socket.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket connected');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('state', (s) => {
      setState(s);
      setWaiting(false);
    });
    socket.on('opponentLeft', () => {
      setOpponentLeft(true);
      setState(null);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('state');
      socket.off('opponentLeft');
      socket.disconnect();
    };
  }, []);

  const createRoom = useCallback((name) => {
    setError(null);
    socket.emit('createRoom', { name }, (res) => {
      if (res?.ok) {
        setRoomId(res.roomId);
        setPlayerIndex(res.playerIndex);
        setWaiting(true);
      } else {
        setError(res?.error || 'Ошибка');
      }
    });
  }, []);

  const joinRoom = useCallback((code, name) => {
    setError(null);
    socket.emit('joinRoom', { roomId: code, name }, (res) => {
      if (res?.ok) {
        setRoomId(res.roomId);
        setPlayerIndex(res.playerIndex);
        setWaiting(false);
      } else {
        setError(res?.error || 'Ошибка');
      }
    });
  }, []);

  const sendAction = useCallback((action, payload = {}) => {
    socket.emit('action', { action, payload }, (res) => {
      if (res && !res.ok) setError(res.error);
    });
  }, []);

  const attack = useCallback((cardId) => sendAction('attack', { cardId }), [sendAction]);
  const defend = useCallback((cardId) => sendAction('defend', { cardId }), [sendAction]);
  const take = useCallback(() => sendAction('take'), [sendAction]);
  const pass = useCallback(() => sendAction('pass'), [sendAction]);

  const rematch = useCallback(() => {
    socket.emit('rematch');
    setOpponentLeft(false);
  }, []);

  const leave = useCallback(() => {
    socket.disconnect();
    socket.connect();
    setRoomId(null);
    setPlayerIndex(null);
    setState(null);
    setWaiting(false);
    setOpponentLeft(false);
    setError(null);
  }, []);

  return {
    connected, roomId, playerIndex, state, error, waiting, opponentLeft,
    createRoom, joinRoom, attack, defend, take, pass, rematch, leave,
    setError,
  };
}