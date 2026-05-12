import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { LogOut, Moon, Sun, User, Settings, Menu, X } from 'lucide-react';
import NotificationDropdown from '../components/ui/NotificationDropdown.jsx';

const DashboardLayout = ({
  navMenuItems = [],
  role = 'student',
  children,
  extraHeader,
  /** Profil satırının hemen altında gösterilecek ek bağlantılar (ör. öğretmen: Örüntü, Anketler) */
  profileMenuExtras = [],
}) => {
  const navigate = useNavigate();
  const studentKid = role === 'student';
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  // Language context kept for future i18n needs
  useContext(LanguageContext);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);

  const handleLogout = () => {
    logout('logout');
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
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 ${
        studentKid
          ? 'bg-gradient-to-b from-kid-canvasFrom via-kid-canvasVia to-kid-canvasTo dark:from-kid-canvasFromDark dark:via-kid-canvasViaDark dark:to-kid-canvasToDark'
          : 'bg-surface-50 dark:bg-surface-900'
      }`}
    >
      {isNavMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
      <aside
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-64 shadow-lg z-30 transition-transform duration-300 ${
          studentKid
            ? 'bg-white/95 dark:bg-surface-800/95 backdrop-blur-md border-r border-kid-rail/80 dark:border-surface-700'
            : 'bg-white dark:bg-surface-800'
        } ${isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ willChange: 'transform' }}
        aria-label="Yan menü"
        aria-hidden={!isNavMenuOpen}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            studentKid
              ? 'border-kid-rail/80 dark:border-surface-700'
              : 'border-surface-200 dark:border-surface-700'
          }`}
        >
          <span
            className={`font-bold text-lg tracking-tight ${
              studentKid
                ? 'bg-gradient-to-r from-kid-titleFrom via-kid-titleVia to-kid-titleTo bg-clip-text text-transparent'
                : 'text-brand-600'
            }`}
          >
            EduMath
          </span>
          <button
            onClick={closeSidebar}
            aria-label="Menüyü kapat"
            className="p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 space-y-2" aria-label={`${role === 'teacher' ? 'Öğretmen' : 'Öğrenci'} navigasyonu`}>
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              data-nav-item
              className={`flex items-center w-full px-6 text-surface-700 dark:text-surface-200 hover:bg-brand-50 dark:hover:bg-surface-700 gap-3 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                studentKid ? 'py-4 min-h-[3rem] rounded-2xl text-base font-semibold' : 'py-3 rounded-lg'
              }`}
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
        <header
          className={`flex items-center justify-between px-6 py-4 border-b ${
            studentKid
              ? 'border-kid-rail/80 dark:border-surface-700 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md'
              : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              ref={sidebarToggleRef}
              onClick={() => setIsNavMenuOpen(true)}
              className="p-2 rounded-md hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Menüyü aç"
              aria-expanded={isNavMenuOpen}
              aria-controls="primary-nav"
            >
              <Menu size={22} />
            </button>
            <span
              className={`font-bold text-lg ${
                studentKid
                  ? 'bg-gradient-to-r from-kid-headerFrom to-kid-headerTo bg-clip-text text-transparent dark:from-kid-headerFromDark dark:to-kid-headerToDark'
                  : 'text-brand-600'
              }`}
            >
              {role === 'teacher' ? 'Öğretmen Paneli' : 'Matematik Maceram'}
            </span>
            {extraHeader}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={isDarkMode ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
              title={isDarkMode ? 'Aydınlık tema' : 'Karanlık tema'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <NotificationDropdown />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                className="p-2 rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Profil menüsü"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                <User size={20} />
              </button>
              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg z-50"
                  role="menu"
                >
                  <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="font-bold truncate">{user?.name || 'Kullanıcı'}</div>
                    <div className="text-xs text-surface-500 truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/profile`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                  >
                    <User size={16} aria-hidden /> Profil
                  </button>
                  {profileMenuExtras.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate(item.path);
                        }}
                        role="menuitem"
                        className="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2 text-surface-800 dark:text-surface-100"
                      >
                        {Icon ? <Icon size={16} aria-hidden /> : null}
                        {item.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/settings`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                  >
                    <Settings size={16} aria-hidden /> Ayarlar
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

        <main className={`flex-1 ${studentKid ? 'p-4 sm:p-6 pb-10' : 'p-6'}`}>
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
