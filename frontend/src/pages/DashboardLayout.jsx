import React, { useContext, useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { LogOut, Moon, Sun, Bell, User } from 'lucide-react';

// navMenuItems: [{ id, label, icon, path }]
const DashboardLayout = ({ navMenuItems = [], role = 'student', children, extraHeader }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode: contextDarkMode, setIsDarkMode: setContextDarkMode } = useContext(ThemeContext);
  const { language: contextLanguage } = useContext(LanguageContext);
  const [isDarkMode, setIsDarkMode] = useState(contextDarkMode);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Tema değişimi
  const handleThemeToggle = () => {
    setIsDarkMode((prev) => {
      setContextDarkMode(!prev);
      return !prev;
    });
  };

  // Çıkış
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Sidebar - Her ekranda açılır/kapanır */}
      {/* Overlay */}
      {isNavMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-20" onClick={() => setIsNavMenuOpen(false)}></div>
      )}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 shadow-lg z-30 transition-transform duration-300 ${isNavMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{willChange:'transform'}}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <span className="font-bold text-lg text-indigo-600">EduMath</span>
          <button onClick={() => setIsNavMenuOpen(false)}>
            ×
          </button>
        </div>
        <nav className="mt-6 space-y-2">
          {navMenuItems.map((item) => (
            <button
              key={item.id}
              className="flex items-center w-full px-6 py-3 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg gap-3"
              onClick={() => { setIsNavMenuOpen(false); navigate(item.path); }}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: isNavMenuOpen ? 0 : '0', transition: 'margin-left 0.3s' }}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsNavMenuOpen(true)} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none">
              <span style={{fontSize:24}}>☰</span>
            </button>
            <span className="font-bold text-lg text-indigo-600">
              {role === 'teacher' ? 'Öğretmen Paneli' : 'Öğrenci Paneli'}
            </span>
            {extraHeader}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleThemeToggle} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
              <Bell size={20} />
            </button>
            <div className="relative">
              <button onClick={() => setIsProfileOpen((v) => !v)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                <User size={20} />
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="font-bold">{user?.name}</div>
                    <div className="text-xs text-slate-500">{user?.email}</div>
                  </div>
                  <button onClick={() => { setIsProfileOpen(false); navigate(`/${role}/profile`); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                    <User size={16} /> Profil
                  </button>
                  <button onClick={() => { setIsProfileOpen(false); navigate(`/${role}/settings`); }} className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                    <span className="inline-block w-4 h-4"><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.01c1.527-.878 3.304.899 2.426 2.426a1.724 1.724 0 001.01 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.01 2.573c.878 1.527-.899 3.304-2.426 2.426a1.724 1.724 0 00-2.573 1.01c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.01c-1.527.878-3.304-.899-2.426-2.426a1.724 1.724 0 00-1.01-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.01-2.573c-.878-1.527.899-3.304 2.426-2.426a1.724 1.724 0 002.573-1.01z"></path><circle cx="12" cy="12" r="3"/></svg></span> Ayarlar
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <LogOut size={16} /> Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Main */}
        <main className="flex-1 p-6">
          {children ? children : <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
