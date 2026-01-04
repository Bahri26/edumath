
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Trophy, 
  Dumbbell, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  LayoutGrid,
  ChevronDown,
  Search,
  X,
  Bell,
  User,
  MessageCircle,
  X as XIcon
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { getUserSettings, updateUserSettings } from '../services/userSettings';
import apiClient from '../services/api';
import ChatWidget from '../components/ChatWidget';

const navMenuItems = [
  { id: 'home', label: 'Ana Sayfa', icon: BookOpen, path: '/student/home' },
  { id: 'courses', label: 'Derslerim', icon: BookOpen, path: '/student/courses' },
  { id: 'assignments', label: 'Ödevler', icon: CheckCircle, path: '/student/assignments' },
  { id: 'quizzes', label: 'Sınavlar', icon: FileText, path: '/student/quizzes' },
  { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/student/exercises' },
  { id: 'leaderboard', label: 'Sıralama', icon: Trophy, path: '/student/leaderboard' },
  { id: 'calendar', label: 'Takvim', icon: Calendar, path: '/student/calendar' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode: contextDarkMode, setIsDarkMode: setContextDarkMode } = useContext(ThemeContext);
  
  const [isDarkMode, setIsDarkMode] = useState(contextDarkMode);
  const [language, setLanguage] = useState('TR');
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const navMenuRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Ayarları yükle
  useEffect(() => {
    getUserSettings().then(settings => {
      setIsDarkMode(settings.theme === 'dark');
      setLanguage(settings.language || 'TR');
      setContextDarkMode(settings.theme === 'dark');
    });
  }, [setContextDarkMode]);

  // Bildirimleri yükle
  useEffect(() => {
    fetchNotifications();
    // Her 30 saniyede bildirimleri yenile
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await apiClient.get('/notifications?limit=10');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error('Bildirimler alınırken hata:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Bildirim işaretlenirken hata:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Bildirimler işaretlenirken hata:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(n => n._id !== notificationId));
    } catch (err) {
      console.error('Bildirim silinirken hata:', err);
    }
  };

  // Click Outside Logic
  useEffect(() => {
    function handleClickOutside(event) {
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) setIsNavMenuOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (isSearchOpen && searchInputRef.current && !searchInputRef.current.contains(event.target) && !event.target.closest('.search-toggle-btn')) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen]);

  // Backend'e kaydet
  useEffect(() => {
    updateUserSettings({
      theme: isDarkMode ? 'dark' : 'light',
      language,
    });
  }, [isDarkMode, language]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300`}>
      
      {/* --- Main Header (Navbar) --- */}
      <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0 shrink-0">
        
        {/* Left: Logo & Navigation Menu */}
        <div className="flex items-center gap-8">
           {/* Branding */}
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/student/home')}>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
                <BookOpen size={24} />
              </div>
              <div className="flex flex-col">
                  <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight leading-none">
                  ÖĞRENCİ
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1">StudentOS</span>
              </div>
           </div>

           {/* Desktop Dropdown Navigation (StudentOS Style) */}
           <div className="hidden md:block relative" ref={navMenuRef}>
             <button 
               onClick={() => setIsNavMenuOpen(!isNavMenuOpen)}
               className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 text-sm font-bold border ${isNavMenuOpen ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}`}
             >
               <LayoutGrid size={18} />
               <span>Menü</span>
               <ChevronDown size={14} className={`transition-transform duration-200 ${isNavMenuOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Dropdown Menu Content */}
             {isNavMenuOpen && (
               <div className="absolute top-full left-0 mt-4 w-64 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700 p-2 animate-fade-in z-50">
                  {navMenuItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setIsNavMenuOpen(false);
                        setTimeout(() => navigate(item.path), 100);
                      }}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 transition-all"
                    >
                      <item.icon size={18} /> {item.label}
                    </button>
                  ))}
               </div>
             )}
           </div>
        </div>

        {/* Right: Actions, Search, Profile */}
        <div className="flex items-center gap-3 md:gap-4">

          {/* Search Bar (Expandable) */}
          <div className="relative search-toggle-btn hidden sm:block">
            <div className={`flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-full border border-transparent transition-all duration-300 ${isSearchOpen ? 'w-64 border-indigo-500 ring-2 ring-indigo-500/20 pl-4 pr-2 py-2' : 'w-10 h-10 justify-center hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
               {!isSearchOpen ? (
                  <button onClick={() => setIsSearchOpen(true)} className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400"><Search size={18}/></button>
               ) : (
                  <>
                      <Search size={16} className="text-indigo-500 mr-2 flex-shrink-0" />
                      <input 
                          ref={searchInputRef}
                          type="text" 
                          placeholder="Öğrenci veya sınav ara..."
                          className="bg-transparent border-none outline-none text-sm w-full dark:text-white"
                      />
                      <button onClick={() => setIsSearchOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-400"><X size={14}/></button>
                  </>
               )}
            </div>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                if (!isNotificationsOpen && notifications.length === 0) {
                  fetchNotifications();
                }
              }}
              className="relative w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <Bell size={20} className={`group-hover:animate-swing ${isNotificationsOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-4 w-96 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700 py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Bildirimler ({unreadCount})</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Tümünü Oku</button>
                    )}
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {loadingNotifications ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Yükleniyor...</div>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification._id} 
                          className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${!notification.isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}
                          onClick={() => !notification.isRead && markAsRead(notification._id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className={`text-sm flex-1 ${!notification.isRead ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                              {notification.title}
                            </h4>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1">
                            {notification.message}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notification.createdAt).toLocaleDateString('tr-TR')} {new Date(notification.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-sm">Bildiriminiz yok.</div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* Theme & Language Toggles */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
            <button onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')} className="w-8 h-8 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all">{language}</button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all">
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 pl-1 pr-1 md:pr-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all bg-white dark:bg-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white dark:ring-slate-900">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''} hidden md:block`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-4 w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700 py-2 animate-fade-in z-50">
                 <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 m-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">{(user?.name || 'Ö').charAt(0).toUpperCase()}</div>
                       <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.name || 'Öğrenci'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email || 'ogrenci@okul.tr'}</p>
                       </div>
                    </div>
                 </div>
                  <div className="py-1">
                    <button onClick={() => { setIsProfileOpen(false); navigate('/student/profile'); }} className="w-full px-6 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"><User size={16}/> Profil</button>
                    <button onClick={() => { setIsProfileOpen(false); navigate('/student/settings'); }} className="w-full px-6 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"><Settings size={16}/> Ayarlar</button>
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                  <button className="w-full px-6 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 font-medium rounded-lg mx-2 my-1" onClick={() => logout() }><LogOut size={16}/> Çıkış Yap</button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* --- Main Content Area --- */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-8 scroll-smooth custom-scrollbar">
        <div className="max-w-7xl mx-auto h-full">
           {/* Nested route content will render here */}
           <Outlet />
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <div className="md:hidden fixed bottom-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-white/20 dark:border-slate-800 z-40 pb-safe">
        <div className="flex justify-around items-center p-2">
          {navMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl w-14 transition-all text-slate-600 dark:text-slate-300"
            >
              <item.icon size={20} />
              <span className="text-[9px] font-medium truncate w-full text-center">{item.label}</span>
            </button>
          ))}
          <button
            className="flex flex-col items-center gap-1 p-2 rounded-xl w-14 transition-all text-rose-500"
            onClick={() => logout()}
          >
            <LogOut size={20} />
            <span className="text-[9px] font-medium truncate w-full text-center">Çıkış</span>
          </button>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes swing { 0%, 100% { transform: rotate(0deg); } 20% { transform: rotate(15deg); } 40% { transform: rotate(-10deg); } 60% { transform: rotate(5deg); } 80% { transform: rotate(-5deg); } }
        .group-hover\\:animate-swing:hover { animation: swing 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default StudentDashboard;