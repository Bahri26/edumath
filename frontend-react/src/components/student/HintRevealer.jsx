// frontend-react/src/components/student/HintRevealer.jsx
// Öğrencilere ipuçlarını aşamalı açma bileşeni

import React, { useState } from 'react';
import './HintRevealer.css';

export default function HintRevealer({ hints = [] }) {
  const [revealed, setRevealed] = useState([]);

  const revealNext = () => {
    if (revealed.length < hints.length) {
      setRevealed([...revealed, hints[revealed.length]]);
    }
  };

  if (!hints || hints.length === 0) {
    return null;
  }

  return (
    <div className="hint-revealer">
      <div className="hint-header">
        💡 İpuçları ({revealed.length}/{hints.length})
      </div>
      <div className="hint-list">
        {revealed.map((h, idx) => (
          <div key={idx} className="hint-item">
            <span className="hint-number">{idx + 1}</span>
            <span className="hint-text">{h}</span>
          </div>
        ))}
      </div>
      {revealed.length < hints.length && (
        <button className="hint-reveal-btn" onClick={revealNext}>
          🔓 Sonraki ipucunu göster
        </button>
      )}
      {revealed.length === hints.length && hints.length > 0 && (
        <div className="hint-complete">
          ✅ Tüm ipuçları gösterildi
        </div>
      )}
    </div>
  );
}
