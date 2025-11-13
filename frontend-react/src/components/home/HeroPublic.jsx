import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../hooks/useI18n';

function HeroPublic() {
  const { t } = useI18n();
  
  return (
    <div className="kids-card mb-4" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15, fontSize: '3rem' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%' }}>🌟</div>
        <div style={{ position: 'absolute', top: '40%', right: '10%' }}>⭐</div>
        <div style={{ position: 'absolute', bottom: '15%', left: '15%' }}>✨</div>
        <div style={{ position: 'absolute', bottom: '25%', right: '25%' }}>💫</div>
      </div>
      <h1 className="m-0" style={{ fontWeight: 800, fontSize: '2.2rem' }}>{t('home_public_hero_title')}</h1>
      <p className="muted mb-3">{t('home_public_hero_subtitle')}</p>
      <div className="d-flex gap-2 flex-wrap">
        <Link to="/register" className="kids-btn primary">{t('home_start_btn')}</Link>
        <Link to="/login" className="kids-btn warning">{t('home_login_btn')}</Link>
      </div>
    </div>
  );
}

export default HeroPublic;
