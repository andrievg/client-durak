import React from 'react';

export default function Menu({ onLocal, onOnline }) {
  return (
    <div className="menu">
      <h1>ДУРАК 🃏</h1>
      <div className="sub">Играй с компьютером или с другом по коду</div>

      <button className="btn green" onClick={onLocal}>
         Играть с компьютером
      </button>

      <button className="btn" onClick={onOnline}>
         Играть по сети
      </button>
    </div>
  );
}