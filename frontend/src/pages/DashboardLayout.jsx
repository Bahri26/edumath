import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Moon, Sun, User, Settings, Menu, X, Globe } from 'lucide-react';
import NotificationDropdown from '../components/ui/NotificationDropdown.jsx';
import SkipLink from '../components/ui/SkipLink.jsx';
import { useTranslation } from '../i18n/useTranslation';

function useIsDesktopNav() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

const DashboardLayout = ({
  navMenuItems = [],
  role = 'student',
  children,
  extraHeader,
  /** Profil satırının hemen altında gösterilecek ek bağlantılar (ör. öğretmen: Örüntü, Anketler) */
  profileMenuExtras = [],
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const studentKid = role === 'student';
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const isDesktopNav = useIsDesktopNav();
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);

  const sidebarVisible = isDesktopNav || isNavMenuOpen;

  const handleLogout = () => {
    logout('logout');
  };

  const closeSidebar = useCallback(() => {
    setIsNavMenuOpen(false);
    requestAnimationFrame(() => sidebarToggleRef.current?.focus());
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsNavMenuOpen((open) => {
      const next = !open;
      if (!next) {
        requestAnimationFrame(() => sidebarToggleRef.current?.focus());
      }
      return next;
    });
  }, []);

  const isNavItemActive = useCallback(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname],
  );

  // Sayfa değişince mobil menüyü kapat
  useEffect(() => {
    if (!isDesktopNav) {
      setIsNavMenuOpen(false);
    }
  }, [location.pathname, isDesktopNav]);

  // Menü açıkken arka plan kaydırmasını kilitle (yalnızca mobil)
  useEffect(() => {
    if (!isNavMenuOpen || isDesktopNav) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isNavMenuOpen, isDesktopNav]);

  // Escape ile menüleri kapat
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (isNavMenuOpen && !isDesktopNav) closeSidebar();
      if (isProfileOpen) setIsProfileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isNavMenuOpen, isProfileOpen, closeSidebar, isDesktopNav]);

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

  // Açıldıktan hemen sonra sidebar'ın ilk öğesine odaklan (mobil)
  useEffect(() => {
    if (!isNavMenuOpen || isDesktopNav) return;
    const first = sidebarRef.current?.querySelector('button[data-nav-item]');
    first?.focus();
  }, [isNavMenuOpen, isDesktopNav]);

  const sidebarShellClass = studentKid
    ? 'bg-white/95 dark:bg-surface-800/95 backdrop-blur-md border-r border-kid-rail/80 dark:border-surface-700'
    : 'bg-white dark:bg-surface-800 border-r border-surface-200 dark:border-surface-700';

  const renderNavItems = () =>
    navMenuItems.map((item) => {
      const active = isNavItemActive(item.path);
      return (
        <button
          key={item.id}
          data-nav-item
          type="button"
          className={`flex items-center w-full px-6 gap-3 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            studentKid ? 'py-4 min-h-[3rem] rounded-2xl text-base font-semibold' : 'py-3 rounded-lg'
          } ${
            active
              ? studentKid
                ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-200 font-bold'
                : 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-200 font-semibold'
              : 'text-surface-700 dark:text-surface-200 hover:bg-brand-50 dark:hover:bg-surface-700'
          }`}
          onClick={() => {
            if (!isDesktopNav) closeSidebar();
            navigate(item.path);
          }}
          aria-current={active ? 'page' : undefined}
        >
          <item.icon size={20} aria-hidden="true" />
          <span>{item.label}</span>
        </button>
      );
    });

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        studentKid
          ? 'bg-gradient-to-b from-kid-canvasFrom via-kid-canvasVia to-kid-canvasTo dark:from-kid-canvasFromDark dark:via-kid-canvasViaDark dark:to-kid-canvasToDark'
          : 'bg-surface-50 dark:bg-surface-900'
      }`}
    >
      <SkipLink>{t('skipToContent')}</SkipLink>

      {isNavMenuOpen && !isDesktopNav && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSidebar();
            }
          }}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed lg:sticky top-0 left-0 z-30 h-full lg:h-screen w-64 max-w-[85vw] shrink-0 shadow-lg lg:shadow-none transition-transform duration-300 ease-out ${sidebarShellClass} ${
          sidebarVisible ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:translate-x-0 lg:pointer-events-auto'
        }`}
        aria-label={t('sidebar')}
        aria-hidden={!sidebarVisible}
        {...(!sidebarVisible ? { inert: true } : {})}
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
            type="button"
            onClick={closeSidebar}
            aria-label={t('closeMenu')}
            className="lg:hidden p-1 rounded-md hover:bg-surface-100 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <X size={20} />
          </button>
        </div>
        <nav
          id="primary-nav"
          className="mt-6 space-y-2 overflow-y-auto overscroll-contain pb-8 px-0"
          aria-label={role === 'teacher' ? t('teacherNav') : t('studentNav')}
        >
          {renderNavItems()}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`relative z-40 flex items-center justify-between px-4 sm:px-6 py-4 border-b ${
            studentKid
              ? 'border-kid-rail/80 dark:border-surface-700 bg-white/90 dark:bg-surface-800/90 backdrop-blur-md'
              : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              ref={sidebarToggleRef}
              type="button"
              onClick={toggleSidebar}
              className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={isNavMenuOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={isNavMenuOpen}
              aria-controls="primary-nav"
            >
              {isNavMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
            </button>
            <span
              className={`font-bold text-lg truncate ${
                studentKid
                  ? 'bg-gradient-to-r from-kid-headerFrom to-kid-headerTo bg-clip-text text-transparent dark:from-kid-headerFromDark dark:to-kid-headerToDark'
                  : 'text-brand-600'
              }`}
            >
              {role === 'teacher' ? t('teacherPanel') : t('studentPanel')}
            </span>
            {extraHeader}
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage(language === 'EN' ? 'TR' : 'EN')}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={language === 'EN' ? t('switchToTr') : t('switchToEn')}
              title={language === 'EN' ? 'Türkçe' : 'English'}
            >
              <Globe size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={isDarkMode ? t('lightTheme') : t('darkTheme')}
              title={isDarkMode ? t('lightTheme') : t('darkTheme')}
            >
              {isDarkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>

            <NotificationDropdown />

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={t('profileMenu')}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                <User size={20} />
              </button>
              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-2xl shadow-xl z-[100] overflow-hidden"
                  role="menu"
                >
                  <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                    <div className="font-bold truncate">{user?.name || t('common.userFallback')}</div>
                    <div className="text-xs text-surface-500 truncate">{user?.email || ''}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/profile`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                  >
                    <User size={16} aria-hidden /> {t('profile')}
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
                        className="w-full text-left px-4 py-2.5 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2 text-surface-800 dark:text-surface-100 font-medium"
                      >
                        {Icon ? <Icon size={16} aria-hidden /> : null}
                        {item.label}
                      </button>
                    );
                  })}
                  {profileMenuExtras.length > 0 && (
                    <div className="border-t border-surface-100 dark:border-surface-700 my-1" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setIsProfileOpen(false); navigate(`/${role}/settings`); }}
                    role="menuitem"
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-100 dark:hover:bg-surface-700 flex items-center gap-2"
                  >
                    <Settings size={16} aria-hidden /> {t('settings')}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} aria-hidden /> {t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className={`flex-1 ${studentKid ? 'p-4 sm:p-6 pb-10' : 'p-4 sm:p-6'}`}>
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
