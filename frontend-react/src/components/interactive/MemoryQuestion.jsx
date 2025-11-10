import React from 'react';

export default function MemoryQuestion({ cards = [], readOnly = true }) {
  if (!cards.length) return <div className="iq-empty">Hafıza kartları tanımlanmamış.</div>;
  return (
    <div className="iq-memory-grid" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:'8px'}}>
      {cards.slice(0,8).map(c => (
        <div key={c.id} className="iq-card" style={{background:'#e0f2fe',padding:'12px',borderRadius:'10px',textAlign:'center'}}>
          <span role="img" aria-label="kapalı">🂠</span>
        </div>
      ))}
      {readOnly && (
        <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', opacity: 0.7 }}>
          Önizleme. Öğrenci çiftleri açıp eşleştirecek.
        </div>
      )}
    </div>
  );
}
