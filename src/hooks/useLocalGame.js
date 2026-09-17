import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initGame, canAddCard, canDefend, isRoundEnd,
  defenderTakes, defenderBeats, refillHands, checkGameOver,
  unbeatenCards,
} from '../game/rules.js';
import { aiChooseAttack, aiChooseDefense, aiWantsToAdd } from '../game/ai.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function useLocalGame() {
  const [state, setState] = useState(() => initGame());
  const aiLockRef = useRef(false);
  const HUMAN = 0;
  const AI = 1;

  const reset = useCallback(() => {
    aiLockRef.current = false;
    setState(initGame());
  }, []);

  const attack = useCallback((cardId) => {
    setState((prev) => {
      if (prev.attacker !== HUMAN || prev.phase === 'over') return prev;
      if (unbeatenCards(prev.table).length > 0) return prev;
      const card = prev.hands[HUMAN].find((c) => c.id === cardId);
      if (!card || !canAddCard(prev, card)) return prev;
      const hands = prev.hands.map((h) => [...h]);
      hands[HUMAN] = hands[HUMAN].filter((c) => c.id !== cardId);
      return {
        ...prev, hands,
        table: [...prev.table, { attack: card, defend: null }],
        phase: 'defend',
      };
    });
  }, []);

  const defend = useCallback((cardId) => {
    setState((prev) => {
      if (prev.defender !== HUMAN || prev.phase === 'over') return prev;
      const pair = prev.table.find((p) => !p.defend);
      if (!pair) return prev;
      const card = prev.hands[HUMAN].find((c) => c.id === cardId);
      if (!card || !canDefend(prev, pair.attack, card)) return prev;
      const hands = prev.hands.map((h) => [...h]);
      hands[HUMAN] = hands[HUMAN].filter((c) => c.id !== cardId);
      const table = prev.table.map((p) =>
        p === pair ? { ...p, defend: card } : p
      );
      return { ...prev, hands, table };
    });
  }, []);

  const take = useCallback(() => {
    setState((prev) => {
      if (prev.defender !== HUMAN || prev.phase === 'over') return prev;
      let s = defenderTakes(prev);
      s = refillHands(s);
      const over = checkGameOver(s);
      if (over !== null) s = { ...s, winner: over, phase: 'over' };
      return s;
    });
  }, []);

  const pass = useCallback(() => {
    setState((prev) => {
      if (prev.attacker !== HUMAN || prev.phase === 'over') return prev;
      if (!isRoundEnd(prev)) return prev;
      let s = defenderBeats(prev);
      s = refillHands(s);
      const over = checkGameOver(s);
      if (over !== null) s = { ...s, winner: over, phase: 'over' };
      return s;
    });
  }, []);

  useEffect(() => {
    if (state.phase === 'over') return;
    const aiTurn = state.attacker === AI || state.defender === AI;
    if (!aiTurn) return;
    if (aiLockRef.current) return;
    aiLockRef.current = true;

    let cancelled = false;
    (async () => {
      await wait(700);
      if (cancelled) return;

      setState((prev) => {
        if (prev.phase === 'over') return prev;

        if (prev.attacker === AI) {
          const unbeaten = prev.table.filter((p) => !p.defend);

          if (unbeaten.length === 0) {
            const card = aiChooseAttack(prev, prev.hands[AI]);
            if (!card) return prev;
            const hands = prev.hands.map((h) => [...h]);
            hands[AI] = hands[AI].filter((c) => c.id !== card.id);
            return {
              ...prev, hands,
              table: [{ attack: card, defend: null }],
              phase: 'defend',
            };
          }

          if (isRoundEnd(prev)) {
            if (aiWantsToAdd(prev, prev.hands[AI])) {
              const card = aiChooseAttack(prev, prev.hands[AI]);
              if (card) {
                const hands = prev.hands.map((h) => [...h]);
                hands[AI] = hands[AI].filter((c) => c.id !== card.id);
                return {
                  ...prev, hands,
                  table: [...prev.table, { attack: card, defend: null }],
                };
              }
            }
            let s = defenderBeats(prev);
            s = refillHands(s);
            const over = checkGameOver(s);
            if (over !== null) s = { ...s, winner: over, phase: 'over' };
            return s;
          }
          return prev;
        }

        if (prev.defender === AI) {
          const pair = prev.table.find((p) => !p.defend);
          if (!pair) return prev;
          const card = aiChooseDefense(prev, prev.hands[AI], pair.attack);
          if (card) {
            const hands = prev.hands.map((h) => [...h]);
            hands[AI] = hands[AI].filter((c) => c.id !== card.id);
            const table = prev.table.map((p) =>
              p === pair ? { ...p, defend: card } : p
            );
            return { ...prev, hands, table };
          }
          let s = defenderTakes(prev);
          s = refillHands(s);
          const over = checkGameOver(s);
          if (over !== null) s = { ...s, winner: over, phase: 'over' };
          return s;
        }
        return prev;
      });

      aiLockRef.current = false;
    })();

    return () => { cancelled = true; };
  }, [state.attacker, state.defender, state.table, state.phase]);

  return { state, humanIndex: HUMAN, attack, defend, take, pass, reset };
}