import React, { useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  KeyRound,
  GraduationCap,
  UsersRound,
  ScrollText,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import SkipLink from '../../components/ui/SkipLink.jsx';
import { useTranslation } from '../../i18n/useTranslation';

const navClass = ({ isActive }) =>
  [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-white/12 text-white shadow-lg shadow-black/20 ring-1 ring-white/15'
      : 'text-slate-400 hover:bg-white/5 hover:text-white',
  ].join(' ');

function AdminSidebar({ onNavigate, className = '' }) {
  const { logout } = useContext(AuthContext);
  const { t } = useTranslation();

  const closeIfMobile = () => {
    onNavigate?.();
  };

  return (
    <aside className={className}>
      <div className="border-b border-white/10 px-5 py-6 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30">
            <Sparkles className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-300/90">{t('admin.nav.control')}</div>
            <h1 className="text-lg font-bold tracking-tight text-white">{t('admin.nav.brand')}</h1>
          </div>
        </div>
        {onNavigate ? (
          <button
            type="button"
            className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onNavigate}
            aria-label={t('admin.nav.closeMenu')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3" aria-label={t('admin.nav.brand')}>
        <NavLink to="/admin" end className={navClass} onClick={closeIfMobile}>
          <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.dashboard')}
        </NavLink>
        <NavLink to="/admin/reset-requests" className={navClass} onClick={closeIfMobile}>
          <KeyRound className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.resetRequests')}
        </NavLink>
        <NavLink to="/admin/branch-requests" className={navClass} onClick={closeIfMobile}>
          <GraduationCap className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.branchRequests')}
        </NavLink>
        <NavLink to="/admin/users" className={navClass} onClick={closeIfMobile}>
          <UsersRound className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.users')}
        </NavLink>
        <NavLink to="/admin/audit-log" className={navClass} onClick={closeIfMobile}>
          <ScrollText className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.auditLog')}
        </NavLink>
        <NavLink to="/admin/user-activity" className={navClass} onClick={closeIfMobile}>
          <Activity className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.userActivity')}
        </NavLink>
        <NavLink to="/admin/settings" className={navClass} onClick={closeIfMobile}>
          <Settings className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" aria-hidden />
          {t('admin.nav.settings')}
        </NavLink>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 hover:text-white"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t('admin.nav.logout')}
        </button>
      </div>
    </aside>
  );
}

const AdminLayout = () => {
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30">
      <SkipLink>{t('skipToContent')}</SkipLink>

      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('admin.nav.openMenu')}
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <span className="font-bold text-slate-800 dark:text-white">{t('admin.nav.brand')}</span>
      </div>

      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="presentation"
          onClick={closeMobileNav}
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          <div
            className="absolute inset-y-0 left-0 flex w-[min(280px,88vw)] flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-slate-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar onNavigate={closeMobileNav} className="flex h-full flex-col" />
          </div>
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <AdminSidebar className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-teal-950 text-slate-200 shadow-xl shadow-slate-900/20 lg:flex" />

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 overflow-x-hidden">
          <div className="min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
