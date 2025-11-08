// frontend-react/src/components/Navbar.jsx (GÜNCEL HALİ)

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

import '../assets/styles/Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user ? (user.fullName || `${user.firstName} ${user.lastName}`) : '';

  return (
    <header className="edu-navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">EDU-PLATFORM</Link>
        </div>

        <div className="navbar-right">
          {user ? (
            <div className="navbar-user-bar">
              <span className="navbar-user" title={displayName}>{displayName}</span>
              <button className="btn-logout" onClick={handleLogout} title="Çıkış Yap">
                <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
                <span className="logout-text">Çıkış</span>
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Giriş Yap</Link>
              <Link to="/register" className="nav-link btn-register">Kayıt Ol</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;