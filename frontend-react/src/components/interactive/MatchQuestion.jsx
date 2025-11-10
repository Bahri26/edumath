import React from 'react';

// Minimal preview-only renderer for Match interaction
// Props: { items: [{id,left,right}], readOnly }
export default function MatchQuestion({ items = [], readOnly = true }) {
  if (!items.length) return <div className="iq-empty">Eşleştirme çiftleri eklenmemiş.</div>;
  return (
    <div className="iq-match">
      <div className="iq-columns">
        <div className="iq-col">
          {items.map(it => (
            <div key={it.id} className="iq-chip">{it.left}</div>
          ))}
        </div>
        <div className="iq-col">
          {items.map(it => (
            <div key={it.id+"-r"} className="iq-chip alt">{it.right}</div>
          ))}
        </div>
      </div>
      {readOnly && <div className="iq-hint">Önizleme (öğretmen görünümü). Etkileşimli oynanış öğrenci tarafında.</div>}
    </div>
  );
}
