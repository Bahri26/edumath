import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-3 md:col-span-2 bg-slate-100 dark:bg-slate-900 p-4">
        <h1 className="text-xl font-bold mb-4">Admin</h1>
        <nav className="flex flex-col gap-2">
          <NavLink to="/admin" end className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Panel</NavLink>
          <NavLink to="/admin/reset-requests" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Sıfırlama Talepleri</NavLink>
          <NavLink to="/admin/users" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Kullanıcı Onayları</NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => `px-3 py-2 rounded ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>Ayarlar</NavLink>
          <button className="mt-2 px-3 py-2 rounded bg-red-600 text-white" onClick={() => logout()}>Çıkış</button>
        </nav>
      </aside>
      <main className="col-span-9 md:col-span-10 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;