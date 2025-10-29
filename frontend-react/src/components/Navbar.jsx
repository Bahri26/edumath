// frontend-react/src/components/Navbar.jsx (GÜNCEL HALİ)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

// Stil dosyasını import ediyoruz (bir sonraki adımda oluşturacağız)
import '../assets/styles/Navbar.css';// Veya sizin CSS dosyanızın yolu

function Navbar() {
  const { user, logout } = useAuth(); // Context'ten user ve logout fonksiyonunu al
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Dışarı tıklandığında menüyü kapatmak için

  // Çıkış Yap fonksiyonu
  const handleLogout = () => {
    logout(); // AuthContext'teki logout'u çağır
    setIsDropdownOpen(false); // Menüyü kapat
    navigate('/login'); // Login sayfasına yönlendir
  };

  // Dışarıya tıklandığında dropdown'ı kapatmak için
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);


  return (
    <header className="edu-navbar">
      <div className="navbar-container">
        
        {/* Sol Taraf - Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            EDU-PLATFORM
          </Link>
        </div>

        {/* Sağ Taraf - Linkler ve Kullanıcı Menüsü */}
        <div className="navbar-right">
          {user ? (
            // Kullanıcı GİRİŞ YAPMIŞSA
            <div className="user-menu-container" ref={dropdownRef}>
              <button 
                className="user-menu-trigger" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {/* AuthContext'ten gelen kullanıcı adını yazdır */}
                {user.fullName || `${user.firstName} ${user.lastName}`}
                
                {/* Resimdeki ikon (veya FontAwesome ikonu) */}
                <i className={`fas ${isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'} ms-2`}></i>
              </button>

              {/* AÇILIR MENÜ (Dropdown) */}
              {isDropdownOpen && (
                <div className="user-dropdown-menu">
                  <ul>
                    <li><Link to="/profile" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-user me-2"></i>Profilim</Link></li>
                    
                    {/* --- ROL BAZLI LİNKLER --- */}
                    {/* Kullanıcı Öğretmen ise: */}
                    {user.roles?.isTeacher && (
                      <>
                        <li><Link to="/teacher/dashboard" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-tachometer-alt me-2"></i>Panelim</Link></li>
                        <li><Link to="/teacher/question-pool" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-layer-group me-2"></i>Soru Havuzu</Link></li>
                        <li><Link to="/teacher/exams" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-file-alt me-2"></i>Sınavlar</Link></li>
                        <li><Link to="/teacher/classes" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-school me-2"></i>Sınıflar</Link></li>
                        <li><Link to="/teacher/students" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-user-graduate me-2"></i>Öğrencilerim</Link></li>
                        <li><Link to="/teacher/surveys" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-poll me-2"></i>Anketler</Link></li>
                      </>
                    )}

                    {/* Kullanıcı Öğrenci ise: (Gelecek için) */}
                    {user.roles?.isStudent && (
                      <>
                        <li><Link to="/student/dashboard" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-tachometer-alt me-2"></i>Panelim</Link></li>
                        <li><Link to="/student/my-exams" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-file-alt me-2"></i>Sınavlarım</Link></li>
                        <li><Link to="/student/my-classes" onClick={() => setIsDropdownOpen(false)}><i className="fas fa-school me-2"></i>Sınıflarım</Link></li>
                      </>
                    )}
                    
                    {/* --- ÇIKIŞ YAP --- */}
                    <li className="dropdown-divider"></li>
                    <li>
                      <button onClick={handleLogout} className="logout-button">
                        <i className="fas fa-sign-out-alt me-2"></i>Çıkış Yap
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            // Kullanıcı GİRİŞ YAPMAMIŞSA
            <div className="auth-links">
              <Link to="/login" className="nav-link"><i className="fas fa-sign-in-alt me-2"></i>Giriş Yap</Link>
              <Link to="/register" className="nav-link btn-register"><i className="fas fa-user-plus me-2"></i>Kayıt Ol</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;