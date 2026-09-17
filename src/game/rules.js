import { createDeck, canBeat } from './deck.js';

export function initGame() {
  const deck = createDeck();
  const trumpCard = deck[0];
  const trumpSuit = trumpCard.suit;

  const hands = [[], []];
  for (let i = 0; i < 6; i++) {
    hands[0].push(deck.pop());
    hands[1].push(deck.pop());
  }

  return {
    deck,
    trumpCard,
    trumpSuit,
    hands,
    table: [],
    discard: [],
    attacker: 0,
    defender: 1,
    phase: 'attack',
    winner: null,
    round: 1,
  };
}

export function canAddCard(state, card) {
  if (!state.table.length) return true;
  if (state.table.length >= 6) return false;
  const ranks = new Set();
  for (const p of state.table) {
    ranks.add(p.attack.rank);
    if (p.defend) ranks.add(p.defend.rank);
  }
  return ranks.has(card.rank);
}

export function canDefend(state, attackCard, defendCard) {
  return canBeat(attackCard, defendCard, state.trumpSuit);
}

export function unbeatenCards(table) {
  return table.filter((p) => !p.defend).map((p) => p.attack);
}

export function isRoundEnd(state) {
  return state.table.length > 0 && state.table.every((p) => p.defend);
}

export function defenderTakes(state) {
  const hands = state.hands.map((h) => [...h]);
  for (const pair of state.table) {
    hands[state.defender].push(pair.attack);
    if (pair.defend) hands[state.defender].push(pair.defend);
  }
  return {
    ...state,
    hands,
    table: [],
    attacker: state.defender,
    defender: state.attacker,
    round: state.round + 1,
    phase: 'attack',
  };
}

export function defenderBeats(state) {
  const discard = [
    ...state.discard,
    ...state.table.flatMap((p) =>
      p.defend ? [p.attack, p.defend] : [p.attack]
    ),
  ];
  return {
    ...state,
    table: [],
    discard,
    attacker: state.defender,
    defender: state.attacker,
    round: state.round + 1,
    phase: 'attack',
  };
}

export function refillHands(state) {
  const deck = [...state.deck];
  const hands = state.hands.map((h) => [...h]);
  for (const p of [state.attacker, state.defender]) {
    while (hands[p].length < 6 && deck.length > 0) {
      hands[p].push(deck.pop());
    }
  }
  return { ...state, deck, hands };
}

export function checkGameOver(state) {
  if (state.deck.length > 0) return null;
  const out = state.hands.findIndex((h) => h.length === 0);
  return out === -1 ? null : out;
}