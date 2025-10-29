// frontend-react/src/pages/NotFound.jsx (YENİ DOSYA)

import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/TeacherPages.css'; // .page-card stilini kullanmak için

function NotFound() {
  return (
    <div className="teacher-page-container" style={{ textAlign: 'center' }}>
      <div className="page-card">
        <h1 style={{ fontSize: '5rem', margin: 0, color: '#dc3545' }}>404</h1>
        <h2 style={{ marginTop: '1rem', marginBottom: '1.5rem' }}>Sayfa Bulunamadı</h2>
        <p style={{ fontSize: '1.1rem', color: '#6c757d' }}>
          Aradığınız sayfa kaldırılmış, adı değiştirilmiş veya mevcut olmayabilir.
        </p>
        <Link to="/" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem' }}>
          <i className="fas fa-home me-2"></i>Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}

export default NotFound;