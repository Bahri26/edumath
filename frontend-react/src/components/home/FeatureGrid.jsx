import React from 'react';

const FEATURES = [
  ['🎮','Oyunlaştırma','Rozetler kazan, seviyeleri geç! 🏅'],
  ['🎨','Renkli Tasarım','Çocuklar için eğlenceli arayüz! 🌈'],
  ['📊','İlerleme Takibi','Gelişimini takip et, hedeflerine ulaş! 📈'],
  ['👨‍🏫','Uzman Öğretmenler','Deneyimli öğretmen içerikleri! ⭐'],
  ['🎯','Kişisel Öğrenme','Sana özel öğrenme planı! 💡'],
  ['🔔','Günlük Görevler','Her gün yeni görevler ve ödüller! 🎁']
];

function FeatureGrid() {
  return (
    <div className="kids-card mb-4">
      <h2 className="kids-section-title" style={{ fontSize: '1.8rem' }}>✨ Neden Bizi Seçmelisin?</h2>
      <div className="kids-grid-3">
        {FEATURES.map(([icon,title,desc]) => (
          <div key={title} className="page-card" style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ fontSize:'1.8rem' }}>{icon}</div>
            <h3 className="m-0" style={{ fontSize:'1.1rem' }}>{title}</h3>
            <p className="muted m-0" style={{ fontSize:'0.85rem' }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureGrid;
