import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { LogOut, Moon, Sun, User, Settings, Menu, X } from 'lucide-react';
import NotificationDropdown from '../components/ui/NotificationDropdown.jsx';

const DashboardLayout = ({ navMenuItems = [], role = 'student', children, extraHeader }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode: contextDarkMode, setIsDarkMode: setContextDarkMode } = useContext(ThemeContext);
  // Language context kept for future i18n needs
  useContext(LanguageContext);
  const [isDarkMode, setIsDarkMode] = useState(contextDarkMode);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);

  const handleThemeToggle = () => {
    setIsDarkMode((prev) => {
      setContextDarkMode(!prev);
      return !prev;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = useCallback(() => {
    setIsNavMenuOpen(false);
    sidebarToggleRef.current?.focus();
  }, []);

  // Escape ile menüleri kapat
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (isNavMenuOpen) closeSidebar();
      if (isProfileOpen) setIsProfileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isNavMenuOpen, isProfileOpen, closeSidebar]);

  // Profil panelinin dışına tıklayınca kapat
  useEffect(() => {
    if (!isProfileOpen) return;
    const onClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isProfileOpen]);

  // Açıldıktan hemen sonra sidebar'ın ilk öğesine odaklan
  useEffect(() => {
    if (!isNavMenuOpen) return;
    const first = sidebarRef.current?.querySelector('button[data-nav-item]');
    first?.focus();
  }, [isNavMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {isNavMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-lg z-30 transition-transform duration-300 ${
          isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
        aria-label="Yan menü"
        aria-hidden={!isNavMenuOpen}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-lg text-indigo-600">EduMath</span>
          <button
            onClick={closeSidebar}
            aria-label="Menüyü kapat"
            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 space-y-2" aria-label={`${role === 'teacher' ? 'Öğretmen' : 'Öğrenci'} navigasyonu`}>
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              data-nav-item
              className="flex items-center w-full px-6 py-3 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onClick={() => {
                closeSidebar();
                navigate(item.path);
              }}
            >
              <item.icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button
              ref={sidebarToggleRef}
              onClick={() => setIsNavMenuOpen(true)}
              className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Menüyü aç"
              aria-expanded={isNavMenuOpen}
              aria-controls="primary-nav"
            >
              <Menu size={22} />
            </button>
            <span className="font-bold text-lg text-indigo-600">
              {role === 'teacher' ? 'Öğretmen Paneli' : 'Öğrenci Paneli'}
            </span>
            {extraHeader}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label={isDarkMode ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
              title={isDarkMode ? 'Aydınlık tema' : 'Karanlık tema'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationDropdown />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Profil menüsü"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                <User size={20} />
              </button>
              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
                  role="menu"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="font-bold truncate">{user?.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/profile`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <User size={16} /> Profil
                  </button>
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/settings`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Settings size={16} /> Ayarlar
                  </button>
                  <button
                    onClick={handleLogout}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
