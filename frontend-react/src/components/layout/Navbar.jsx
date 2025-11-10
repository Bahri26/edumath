import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? (user.fullName || `${user.firstName} ${user.lastName}`) : '';

  return (
    <header className="kids-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🎯</span>
          <span className="logo-text">Örüntü<span className="logo-accent">Macera</span></span>
        </Link>

        {/* Desktop Menü */}
        <nav className="navbar-menu">
          <Link to="/" className="nav-item">
            <span className="nav-icon">🏠</span>
            <span>Ana Sayfa</span>
          </Link>
          
          {user && (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/student/dashboard" className="nav-item">
                    <span className="nav-icon">📚</span>
                    <span>Öğren</span>
                  </Link>
                  <Link to="/student/assignments" className="nav-item">
                    <span className="nav-icon">✏️</span>
                    <span>Ödevler</span>
                  </Link>
                  <Link to="/student/badges" className="nav-item">
                    <span className="nav-icon">🏆</span>
                    <span>Rozetler</span>
                  </Link>
                </>
              )}
              
              {user.role === 'teacher' && (
                <>
                  <Link to="/teacher/dashboard" className="nav-item">
                    <span className="nav-icon">👨‍🏫</span>
                    <span>Panelim</span>
                  </Link>
                  <Link to="/teacher/classes" className="nav-item">
                    <span className="nav-icon">👥</span>
                    <span>Sınıflar</span>
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Kullanıcı Bölümü */}
        <div className="navbar-actions">
          {user ? (
            <div className="user-section">
              <div className="user-profile">
                <span className="user-avatar">👤</span>
                <span className="user-name">{displayName}</span>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span className="logout-text">Çıkış</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                Giriş Yap
              </Link>
              <Link to="/register" className="btn-register">
                🚀 Kayıt Ol
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button 
          className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menü */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">🏠</span>
            <span>Ana Sayfa</span>
          </Link>
          
          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/student/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span className="nav-icon">📚</span>
                    <span>Öğren</span>
                  </Link>
                  <Link to="/student/assignments" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span className="nav-icon">✏️</span>
                    <span>Ödevler</span>
                  </Link>
                  <Link to="/student/badges" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span className="nav-icon">🏆</span>
                    <span>Rozetler</span>
                  </Link>
                </>
              )}
              
              {user.role === 'teacher' && (
                <>
                  <Link to="/teacher/dashboard" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span className="nav-icon">👨‍🏫</span>
                    <span>Panelim</span>
                  </Link>
                  <Link to="/teacher/classes" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                    <span className="nav-icon">👥</span>
                    <span>Sınıflar</span>
                  </Link>
                </>
              )}
              
              <button className="mobile-logout" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                <span className="nav-icon">🚪</span>
                <span>Çıkış Yap</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-item" onClick={() => setMobileMenuOpen(false)}>
                Giriş Yap
              </Link>
              <Link to="/register" className="mobile-nav-item register" onClick={() => setMobileMenuOpen(false)}>
                🚀 Kayıt Ol
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;