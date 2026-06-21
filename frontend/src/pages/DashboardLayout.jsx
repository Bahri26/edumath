import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, Moon, Sun, User, Settings, Menu, X, Globe } from 'lucide-react';
import NotificationDropdown from '../components/ui/NotificationDropdown.jsx';
import DashboardLogoMark from '../components/ui/DashboardLogoMark.jsx';
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
  const drawerRef = useRef(null);
  const menuToggleRef = useRef(null);

  const panelHomePath = role === 'teacher' ? '/teacher/overview' : '/student/home';
  const panelLabel = role === 'teacher' ? t('teacherPanel') : t('studentPanelNav');

  const visibleNavItems = navMenuItems.filter((item) => item.id !== 'overview' && item.id !== 'home');

  const handleLogout = () => {
    logout('logout');
  };

  const closeDrawer = useCallback(() => {
    setIsNavMenuOpen(false);
    requestAnimationFrame(() => menuToggleRef.current?.focus());
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsNavMenuOpen((open) => {
      const next = !open;
      if (!next) {
        requestAnimationFrame(() => menuToggleRef.current?.focus());
      }
      return next;
    });
  }, []);

  const isNavItemActive = useCallback(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
    [location.pathname],
  );

  useEffect(() => {
    if (!isDesktopNav) {
      setIsNavMenuOpen(false);
    }
  }, [location.pathname, isDesktopNav]);

  useEffect(() => {
    if (!isNavMenuOpen || isDesktopNav) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isNavMenuOpen, isDesktopNav]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (isNavMenuOpen && !isDesktopNav) closeDrawer();
      if (isProfileOpen) setIsProfileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isNavMenuOpen, isProfileOpen, closeDrawer, isDesktopNav]);

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

  useEffect(() => {
    if (!isNavMenuOpen || isDesktopNav) return;
    const first = drawerRef.current?.querySelector('button[data-nav-item]');
    first?.focus();
  }, [isNavMenuOpen, isDesktopNav]);

  const navItemClass = (active, { compact = false, iconOnly = false } = {}) => {
    const base = compact
      ? iconOnly
        ? 'relative group inline-flex items-center justify-center p-2.5 min-h-[40px] min-w-[40px] rounded-xl text-sm font-semibold shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
        : 'inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] rounded-full text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'
      : `flex items-center w-full gap-3 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
          studentKid ? 'py-3.5 min-h-[48px] rounded-2xl text-base font-semibold' : 'py-3 min-h-[44px] rounded-xl text-sm font-medium'
        }`;

    if (active) {
      return `${base} ${
        studentKid
          ? 'bg-gradient-to-r from-brand-500 to-teal-500 text-white shadow-md shadow-brand-500/25'
          : 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
      }`;
    }

    return `${base} ${
      studentKid
        ? 'text-surface-700 dark:text-surface-200 hover:bg-white/80 dark:hover:bg-surface-700/80'
        : 'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700/80'
    }`;
  };

  const renderNavButton = (item, { compact = false, iconOnly = false, onNavigate } = {}) => {
    const active = isNavItemActive(item.path);
    return (
      <button
        key={item.id}
        data-nav-item
        type="button"
        className={navItemClass(active, { compact, iconOnly })}
        onClick={() => {
          onNavigate?.();
          navigate(item.path);
        }}
        aria-current={active ? 'page' : undefined}
        aria-label={item.label}
        title={iconOnly ? item.label : undefined}
      >
        <item.icon size={compact ? 18 : 20} aria-hidden="true" className="shrink-0" />
        {iconOnly ? (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            {item.label}
          </span>
        ) : (
          <span>{item.label}</span>
        )}
      </button>
    );
  };

  const shellBg = studentKid
    ? 'bg-gradient-to-b from-kid-canvasFrom via-kid-canvasVia to-kid-canvasTo dark:from-kid-canvasFromDark dark:via-kid-canvasViaDark dark:to-kid-canvasToDark'
    : 'bg-surface-50 dark:bg-surface-900';

  const headerBg = studentKid
    ? 'bg-white/85 dark:bg-surface-900/90 backdrop-blur-xl border-kid-rail/60 dark:border-surface-700/80'
    : 'bg-white/90 dark:bg-surface-900/95 backdrop-blur-xl border-surface-200/80 dark:border-surface-700/80';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${shellBg}`}>
      <SkipLink>{t('skipToContent')}</SkipLink>

      {/* Mobil / tablet: sürgülü menü */}
      {isNavMenuOpen && !isDesktopNav && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/40 backdrop-blur-[2px] lg:hidden transition-opacity duration-300"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeDrawer();
          }}
          aria-hidden="true"
        />
      )}

      <aside
        ref={drawerRef}
        className={`fixed top-0 left-0 z-50 h-full w-[min(18rem,88vw)] shadow-2xl lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          studentKid
            ? 'bg-white/98 dark:bg-surface-900/98 backdrop-blur-xl border-r border-kid-rail/70 dark:border-surface-700'
            : 'bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700'
        } ${isNavMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
        aria-label={t('sidebar')}
        aria-hidden={!isNavMenuOpen}
        {...(!isNavMenuOpen ? { inert: true } : {})}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-800">
          <DashboardLogoMark
            size="sm"
            title={panelLabel}
            onClick={() => { closeDrawer(); navigate(panelHomePath); }}
          />
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t('closeMenu')}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <X size={20} />
          </button>
        </div>
        <nav
          id="primary-nav"
          className="p-3 space-y-1 overflow-y-auto overscroll-contain max-h-[calc(100vh-4.5rem)]"
          aria-label={role === 'teacher' ? t('teacherNav') : t('studentNav')}
        >
          {visibleNavItems.map((item) => renderNavButton(item, { onNavigate: closeDrawer }))}
        </nav>
      </aside>

      {/* Üst bar: logo + yatay menü (masaüstü) + araçlar */}
      <header className={`sticky top-0 z-30 border-b ${headerBg}`}>
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-[3.75rem]">
          <button
            ref={menuToggleRef}
            type="button"
            onClick={toggleDrawer}
            className="lg:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label={isNavMenuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isNavMenuOpen}
            aria-controls="primary-nav"
          >
            {isNavMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>

          <DashboardLogoMark
            title={panelLabel}
            onClick={() => navigate(panelHomePath)}
          />

          {extraHeader}

          <nav
            className="hidden lg:flex flex-1 items-center gap-1.5 px-2 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-surface-300 dark:scrollbar-thumb-surface-600"
            aria-label={role === 'teacher' ? t('teacherNav') : t('studentNav')}
          >
            {visibleNavItems.map((item) => renderNavButton(item, { compact: true, iconOnly: true }))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setLanguage(language === 'EN' ? 'TR' : 'EN')}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={language === 'EN' ? t('switchToTr') : t('switchToEn')}
              title={language === 'EN' ? 'Türkçe' : 'English'}
            >
              <Globe size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
                className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
        </div>

        {/* Tablet: yatay kaydırmalı menü şeridi */}
        <nav
          className="lg:hidden flex items-center gap-2 px-3 pb-3 overflow-x-auto scrollbar-thin border-t border-surface-100/80 dark:border-surface-800/80 pt-2"
          aria-label={role === 'teacher' ? t('teacherNav') : t('studentNav')}
        >
          {visibleNavItems.map((item) => renderNavButton(item, { compact: true, iconOnly: true }))}
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} className={`flex-1 w-full max-w-[1600px] mx-auto ${studentKid ? 'p-4 sm:p-6 pb-10' : 'p-4 sm:p-6'}`}>
        {children ? children : <Outlet />}
      </main>
    </div>
  );
};

export default DashboardLayout;
