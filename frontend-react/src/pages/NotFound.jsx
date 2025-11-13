// frontend-react/src/pages/NotFound.jsx (YENİ DOSYA)

import React from 'react';
import { Link } from 'react-router-dom';
// Style now via KidsTheme.css (global import in index.css)

function NotFound() {
  return (
    <div className="container" style={{ textAlign: 'center', paddingTop: '2rem' }}>
      <div className="kids-card">
        <h1 style={{ fontSize: '5rem', margin: 0, color: '#dc3545' }}>404</h1>
        <h2 style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>Sayfa Bulunamadı</h2>
        <p style={{ fontSize: '1.1rem', color: '#6c757d' }}>
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya mevcut olmayabilir.
        </p>
        <Link to="/" className="kids-btn primary" style={{ textDecoration: 'none', marginTop: '1rem', display: 'inline-block' }}>
          <i className="fas fa-home me-2"></i>Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}

export default NotFound;