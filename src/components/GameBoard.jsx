import React, { useState } from 'react';
import Card from './Card.jsx';
import { sortHand } from '../game/deck.js';
import { canAddCard, canDefend, unbeatenCards, isRoundEnd } from '../game/rules.js';

/**
 * Универсальная доска для одиночной и сетевой игры.
 *
 * props:
 *  - state: игровое состояние
 *  - myIndex: индекс игрока (0 или 1)
 *  - actions: { attack, defend, take, pass, reset/rematch, leave }
 *  - isOnline: bool
 *  - roomId?: строка
 *  - opponentLeft?: bool
 *  - error?: строка
 */
export default function GameBoard({
  state,
  myIndex,
  actions,
  isOnline = false,
  roomId,
  opponentLeft,
  error,
  onLeave,
}) {
  const [selected, setSelected] = useState(null);

  if (!state) return null;

  const me = state.hands[myIndex] || [];
  const oppIndex = 1 - myIndex;
  const opp = state.hands[oppIndex] || [];

  const amAttacker = state.attacker === myIndex;
  const amDefender = state.defender === myIndex;

  const pair = state.table.find((p) => !p.defend);
  const unbeaten = unbeatenCards(state.table);
  const allDefended = state.table.length > 0 && state.table.every((p) => p.defend);

  const canPlay = (card) => {
    if (state.phase === 'over') return false;

    if (amAttacker) {
      // нельзя подкидывать, пока есть неотбитые
      if (unbeaten.length > 0) return false;
      // подкидывать можно в начале раунда или после того как побито
      return canAddCard(state, card);
    }
    if (amDefender && pair) {
      return canDefend(state, pair.attack, card);
    }
    return false;
  };

  const handleClick = (card) => {
    if (!canPlay(card)) return;
    if (amDefender && pair) {
      actions.defend(card.id);
    } else if (amAttacker) {
      actions.attack(card.id);
    }
    setSelected(null);
  };

  const sortedMe = sortHand(me, state.trumpSuit);

  const trumpRed = ['♥', '♦'].includes(state.trumpSuit);
  const isMyTurn =
    (amAttacker && unbeaten.length === 0) ||
    (amDefender && !!pair);

  const statusText = (() => {
    if (state.phase === 'over') return '';
    if (amDefender && pair) return 'Отбивайтесь или возьмите карты';
    if (amDefender && !pair && allDefended) return 'Ждём, подкинет ли соперник...';
    if (amAttacker && unbeaten.length === 0 && !state.table.length)
      return 'Ваш ход — выберите карту';
    if (amAttacker && allDefended)
      return 'Можно подкинуть ещё или сказать «Бито»';
    return 'Ход соперника...';
  })();

  return (
    <div className="board">
      {/* Top bar */}
      <div className="top-bar">
        <span className={`trump ${trumpRed ? 'red' : 'black'}`}>
          Козырь: {state.trumpCard.rank}{state.trumpSuit}
        </span>
        <span className="info">Колода: {state.deck.length}</span>
        <span className="info">Раунд: {state.round}</span>
        {isOnline && roomId && (
          <span className="room-code">{roomId}</span>
        )}
      </div>

      {/* Соперник */}
      <div className="opponent-area">
        {opp.map((c, i) => (
          <Card key={i} faceDown small />
        ))}
      </div>
      <div className="opponent-label">
        {isOnline ? '👤 Соперник' : '🤖 Компьютер'} · {opp.length} карт
      </div>

      {/* Стол */}
      <div className="table-area">
        {state.table.length === 0 && (
          <div className="table-empty">Стол пуст</div>
        )}
        {state.table.map((pair, i) => (
          <div key={i} className="pair">
            <Card card={pair.attack} small />
            {pair.defend && (
              <div className="defend">
                <Card card={pair.defend} small />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Управление */}
      <div className="controls">
        {amDefender && pair && (
          <button className="btn red" onClick={actions.take}>
            Взять
          </button>
        )}
        {amDefender && allDefended && (
          <button className="btn green" onClick={actions.pass}>
            Бито ✓
          </button>
        )}
        {amAttacker && allDefended && (
          <button className="btn gold" onClick={actions.pass}>
            Бито ✓
          </button>
        )}
      </div>

      <div className="status">{statusText}</div>

      {/* Моя рука */}
      <div className="player-label">
        {isOnline
          ? `👤 Вы (${myIndex === 0 ? 'создатель' : 'гость'})`
          : '👤 Вы'}{' '}
        · {me.length} карт
      </div>
      <div className="player-area">
        {sortedMe.map((card) => (
          <Card
            key={card.id}
            card={card}
            selected={selected === card.id}
            disabled={!canPlay(card)}
            onClick={() => handleClick(card)}
          />
        ))}
      </div>

      {/* Ошибка */}
      {error && <div className="toast">{error}</div>}

      {/* Победа */}
      {state.phase === 'over' && !opponentLeft && (
        <div className="overlay">
          <h1>
            {state.winner === myIndex
              ? '🏆 Вы победили!'
              : '😢 Вы проиграли'}
          </h1>
          <p>Игра окончена</p>
          {isOnline ? (
            <button className="btn green" onClick={actions.rematch}>
              Реванш
            </button>
          ) : (
            <button className="btn green" onClick={actions.reset}>
              Играть снова
            </button>
          )}
          <button className="btn gray" onClick={onLeave}>
            В меню
          </button>
        </div>
      )}

      {/* Соперник вышел */}
      {opponentLeft && (
        <div className="overlay">
          <h1>Соперник вышел</h1>
          <p>Игра завершена.</p>
          <button className="btn green" onClick={onLeave}>
            В меню
          </button>
        </div>
      )}
    </div>
  );
}