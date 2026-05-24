import React, { useContext } from 'react';
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
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const navClass = ({ isActive }) =>
  [
    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-white/12 text-white shadow-lg shadow-black/20 ring-1 ring-white/15'
      : 'text-slate-400 hover:bg-white/5 hover:text-white',
  ].join(' ');

const AdminLayout = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30">
      <div className="mx-auto flex min-h-screen max-w-[1920px]">
        <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-slate-200 shadow-xl shadow-slate-900/20">
          <div className="border-b border-white/10 px-5 py-6">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/90">Kontrol</div>
                <h1 className="text-lg font-bold tracking-tight text-white">Edumath Admin</h1>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
            <NavLink to="/admin" end className={navClass}>
              <LayoutDashboard className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Panel
            </NavLink>
            <NavLink to="/admin/reset-requests" className={navClass}>
              <KeyRound className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Sıfırlama talepleri
            </NavLink>
            <NavLink to="/admin/branch-requests" className={navClass}>
              <GraduationCap className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Branş onayları
            </NavLink>
            <NavLink to="/admin/users" className={navClass}>
              <UsersRound className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Kullanıcılar
            </NavLink>
            <NavLink to="/admin/audit-log" className={navClass}>
              <ScrollText className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Denetim günlüğü
            </NavLink>
            <NavLink to="/admin/user-activity" className={navClass}>
              <Activity className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Kullanıcı aktiviteleri
            </NavLink>
            <NavLink to="/admin/settings" className={navClass}>
              <Settings className="h-4 w-4 shrink-0 opacity-80 group-hover:opacity-100" />
              Ayarlar
            </NavLink>
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 hover:text-white"
              onClick={() => logout()}
            >
              <LogOut className="h-4 w-4" />
              Çıkış
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="min-h-screen">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
