import React from 'react';

export default function AnagramQuestion({ solution = '', scrambled = '', readOnly = true }) {
  if (!solution) return <div className="iq-empty">Anagram çözümü girilmemiş.</div>;
  return (
    <div className="iq-anagram">
      <div className="iq-row"><strong>Karışık:</strong> {scrambled || solution.split('').sort(() => 0.5 - Math.random()).join('')}</div>
      <div className="iq-row"><strong>Çözüm:</strong> {solution}</div>
      {readOnly && <div className="iq-hint">Önizleme. Öğrenci harfleri sürükleyerek doğru sırayı oluşturacak.</div>}
    </div>
  );
}
