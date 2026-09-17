import { canBeat } from './deck.js';
import { canAddCard } from './rules.js';

export function aiChooseAttack(state, hand) {
  if (!hand.length) return null;

  if (!state.table.length) {
    const nonTrump = hand.filter((c) => c.suit !== state.trumpSuit);
    const pool = nonTrump.length ? nonTrump : hand;
    return pool.reduce((m, c) => (c.value < m.value ? c : m), pool[0]);
  }

  const candidates = hand.filter((c) => canAddCard(state, c));
  if (!candidates.length) return null;

  const nonTrump = candidates.filter((c) => c.suit !== state.trumpSuit);
  const pool = nonTrump.length ? nonTrump : candidates;
  return pool.reduce((m, c) => (c.value < m.value ? c : m), pool[0]);
}

export function aiChooseDefense(state, hand, attackCard) {
  const options = hand.filter((c) => canBeat(attackCard, c, state.trumpSuit));
  if (!options.length) return null;

  options.sort((a, b) => {
    const at = a.suit === state.trumpSuit ? 1 : 0;
    const bt = b.suit === state.trumpSuit ? 1 : 0;
    if (at !== bt) return at - bt;
    return a.value - b.value;
  });
  return options[0];
}

export function aiWantsToAdd(state, hand) {
  if (state.table.length >= 6) return false;
  const candidates = hand.filter((c) => canAddCard(state, c));
  if (!candidates.length) return false;

  const unbeaten = state.table.filter((p) => !p.defend);
  if (unbeaten.length > 0 && state.hands[state.defender].length === 0) {
    return false;
  }
  return true;
}