import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHome,
  faUser,
  faBookOpen,
  faClipboardList,
  faUsers,
  faChartLine,
  faCog,
  faSignOutAlt,
  faUserGraduate,
  faPoll,
} from '@fortawesome/free-solid-svg-icons';

function Sidebar({ className = '' }) {
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const location = useLocation();
  const searchRef = useRef(null);
  
  const menuItems = useMemo(() => {
    const teacherMenuItems = [
      { path: '/teacher/dashboard', icon: faHome, label: 'Dashboard' },
      { path: '/teacher/classes', icon: faUsers, label: 'Sınıflar' },
      { path: '/teacher/students', icon: faUserGraduate, label: 'Öğrencilerim' },
      { path: '/teacher/surveys', icon: faPoll, label: 'Anketler' },
      { path: '/teacher/exams', icon: faClipboardList, label: 'Sınavlar' },
      { path: '/teacher/questions', icon: faBookOpen, label: 'Soru Havuzu' },
      { path: '/profile', icon: faUser, label: 'Profil' }
    ];

    const studentMenuItems = [
      { path: '/student/dashboard', icon: faHome, label: 'Dashboard' },
      { path: '/student/exams', icon: faClipboardList, label: 'Sınavlarım' },
      { path: '/student/results', icon: faChartLine, label: 'Sonuçlarım' },
      { path: '/profile', icon: faUser, label: 'Profil' }
    ];

    return user?.roles?.isTeacher ? teacherMenuItems : studentMenuItems;
  }, [user]);

  // keyboard navigation state
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const liveRegionRef = useRef(null);
  const itemsRef = useRef([]); // hold refs for all menu items
  const navigate = useNavigate();

  // filter by query
  const filteredItems = useMemo(() => {
    if (!query) return menuItems;
    const q = query.toLowerCase();
    return menuItems.filter((m) => m.label.toLowerCase().includes(q));
  }, [menuItems, query]);

  // focus management for keyboard navigation
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
      const linkElement = itemsRef.current[selectedIndex];
      if (linkElement) linkElement.focus();
    }
  }, [selectedIndex, filteredItems.length]);

  // announce results for screen readers
  useEffect(() => {
    if (liveRegionRef.current) {
      const count = filteredItems.length;
      if (!query) {
        liveRegionRef.current.textContent = `${count} öğe.`;
      } else {
        liveRegionRef.current.textContent = `${count} sonuç bulundu.`;
      }
    }
    // reset selection when filter changes
    setSelectedIndex(-1);
  }, [filteredItems, query]);

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        if (searchRef.current) searchRef.current.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // handle arrow navigation and Enter in search input
  const onSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((idx) => Math.min(filteredItems.length - 1, Math.max(0, idx + 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      setSelectedIndex((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter') {
      // if something selected, navigate
      if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
        const item = filteredItems[selectedIndex];
        if (item) navigate(item.path);
      }
    } else if (e.key === 'Escape') {
      // clear selection
      setSelectedIndex(-1);
      if (searchRef.current) searchRef.current.blur();
    }
  };

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <span>EduMath</span>
        </Link>
        {/* Search input */}
        <div style={{ marginTop: '0.75rem' }}>
          {/* lazy load small inline search to avoid extra imports complexity */}
          <input
            ref={searchRef}
            className="sidebar-search-input"
            placeholder="Ara (Ctrl/Cmd+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onSearchKeyDown}
            aria-label="Menüde ara"
          />
        </div>
      </div>

      <div className="user-info">
        <div className="user-name">{user?.firstName} {user?.lastName}</div>
        <div className="user-role">{user?.roles?.isTeacher ? 'Öğretmen' : 'Öğrenci'}</div>
      </div>

      <nav className="nav-menu" role="navigation" aria-label="Ana menü">
        {filteredItems.length === 0 && (
          <div className="nav-no-results">Aradığınız menü bulunamadı.</div>
        )}
        {filteredItems.map((item, idx) => (
        <Link
          ref={el => itemsRef.current[idx] = el}
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''} ${selectedIndex === idx ? 'highlighted' : ''}`}
          tabIndex={0}
          aria-selected={selectedIndex === idx}
          onMouseEnter={() => setSelectedIndex(idx)}
          onFocus={() => setSelectedIndex(idx)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') navigate(item.path);
          }}
        >
          <FontAwesomeIcon icon={item.icon} />
          <span>{item.label}</span>
        </Link>
      ))}

        <div className="nav-divider"></div>
    {/* ARIA live region for screen readers */}
    <div ref={liveRegionRef} className="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
        
        <Link to="/settings" className="nav-item">
          <FontAwesomeIcon icon={faCog} />
          <span>Ayarlar</span>
        </Link>

        <button onClick={handleLogout} className="nav-item">
          <FontAwesomeIcon icon={faSignOutAlt} />
          <span>Çıkış Yap</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;