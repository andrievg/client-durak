import React from 'react';

const RED = ['♥', '♦'];

export default function Card({
  card,
  onClick,
  selected,
  faceDown,
  disabled,
  small,
}) {
  const w = small ? 44 : 62;
  const h = small ? 62 : 88;

  if (faceDown || !card) {
    return <div className="card back" style={{ width: w, height: h }} />;
  }

  const red = RED.includes(card.suit);
  const cls = [
    'card',
    red ? 'red' : '',
    onClick && !disabled ? 'clickable' : '',
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      style={{ width: w, height: h }}
      onClick={disabled ? undefined : onClick}
    >
      <div className="corner">
        {card.rank}
        {card.suit}
      </div>
      <div className="center" style={{ fontSize: small ? 18 : 24 }}>
        {card.suit}
      </div>
      <div className="corner br">
        {card.rank}
        {card.suit}
      </div>
    </div>
  );
}