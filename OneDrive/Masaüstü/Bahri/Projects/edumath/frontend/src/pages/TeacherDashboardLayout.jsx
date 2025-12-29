import { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Trophy, 
  Users, 
  Settings, 
  LogOut, 
  Moon, 
  Sun, 
  BarChart2,
  LayoutGrid,
  ChevronDown,
  Search,
  X,
  Bell,
  Plus,
  User,
  Clock
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { LanguageContext } from '../context/LanguageContext';
import { getUserSettings, updateUserSettings } from '../services/userSettings';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// --- Mock Veriler ---
const performanceData = [
  { name: '9-A', math: 78, phys: 82 },
  { name: '10-B', math: 72, phys: 68 },
  { name: '11-A', math: 90, phys: 85 },
];

const upcomingExams = [
  { id: 1, title: 'Matematik Vize', class: '10-A', date: '15 Kasım', time: '09:00', students: 24 },
  { id: 2, title: 'Fizik Quiz', class: '11-B', date: '16 Kasım', time: '14:00', students: 22 },
];

const recentActivities = [
  { id: 1, text: 'Ahmet Y. ödevini teslim etti.', time: '10 dk önce', type: 'submit' },
  { id: 2, text: '10-A sınıfı not ortalaması düştü.', time: '1 saat önce', type: 'alert' },
  { id: 3, text: 'Ayşe K. mazeret bildirdi.', time: '2 saat önce', type: 'info' },
];

// --- Alt Bileşenler ---

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100`}>
        <Icon size={24} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>
        <span className="text-slate-400">geçen haftaya göre</span>
      </div>
    )}
  </div>
);

const Card = ({ children, title, action }) => (
  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700 shadow-sm">
    {(title || action) && (
      <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
        {title && <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>}
        {action}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

// --- Ana Uygulama ---

const TeacherDashboard = () => {
  // State Yönetimi
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode: contextDarkMode, setIsDarkMode: setContextDarkMode } = useContext(ThemeContext);
  const { language: contextLanguage } = useContext(LanguageContext);

  const [isDarkMode, setIsDarkMode] = useState(contextDarkMode);
  const [language, setLanguage] = useState('TR');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Ayarları backend'den yükle
  useEffect(() => {
    getUserSettings().then(settings => {
      setIsDarkMode(settings.theme === 'dark');
      setLanguage(settings.language || 'TR');
      setNotificationsEnabled(settings.notifications);
      // ThemeContext'i de güncelle
      setContextDarkMode(settings.theme === 'dark');
    });
  }, [setContextDarkMode]);

  // Refs
  const navMenuRef = useRef(null);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const searchInputRef = useRef(null);

  // Navigasyon Öğeleri
  // Sadece Profil, Ayarlar, Anketler ve Çıkış için navItems
  // Menüde sadece genel işlemler (profil işlemleri sağda)
  const navMenuItems = [
    { id: 'overview', label: 'Genel Bakış', icon: BookOpen, path: '/teacher/overview' },
    { id: 'questions', label: 'Soru Bankası', icon: FileText, path: '/teacher/questions' },
    { id: 'exams', label: 'Sınavlar', icon: CheckCircle, path: '/teacher/exams' },
    { id: 'exercises', label: 'Egzersizler', icon: Trophy, path: '/teacher/exercises' },
    { id: 'reports', label: 'Raporlar', icon: BarChart2, path: '/teacher/reports' },
  ];

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Sınav Onayı', message: 'Matematik 101 sınavı onaya gönderildi.', time: '5dk önce', read: false },
    { id: 2, title: 'Yeni Kayıt', message: 'Sınıfınıza 3 yeni öğrenci eklendi.', time: '1s önce', read: false },
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

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
      notifications: notificationsEnabled
    });
  }, [isDarkMode, language, notificationsEnabled]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  // Views
  const OverviewView = () => (
    <div className="space-y-6 animate-fade-in">
      {/* İstatistikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Toplam Öğrenci" value="142" icon={Users} color="bg-indigo-500" trend="+3" />
        <StatCard title="Aktif Sınavlar" value="4" icon={FileText} color="bg-emerald-500" />
        <StatCard title="Bekleyen Ödevler" value="28" icon={Clock} color="bg-amber-500" trend="-5" />
        <StatCard title="Sınıf Ortalaması" value="78.4" icon={Trophy} color="bg-rose-500" trend="+1.2" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik */}
        <div className="lg:col-span-2">
          <Card title="Sınıf Performans Analizi">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" aspect={2} minWidth={300} minHeight={200}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#000' }}
                  />
                  <Bar dataKey="math" name="Matematik" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="phys" name="Fizik" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Sağ Panel */}
        <div className="space-y-6">
          <Card title="Yaklaşan Sınavlar">
            <div className="space-y-4">
              {upcomingExams.map(exam => (
                <div key={exam.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      {exam.date.split(' ')[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{exam.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{exam.class} • {exam.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{exam.students} Öğr.</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Son Aktiviteler">
            <div className="space-y-4 relative">
              <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-700"></div>
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-start gap-3 pl-4 relative">
                  <div className={`w-2 h-2 rounded-full mt-1.5 absolute -left-[3px] border-2 border-white dark:border-slate-800 ${
                    activity.type === 'alert' ? 'bg-rose-500' : activity.type === 'submit' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></div>
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{activity.text}</p>
                    <span className="text-xs text-slate-400">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-screen flex flex-col bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300`}>
      
      {/* --- Main Header (Navbar) --- */}
      <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-slate-800 flex items-center justify-between px-6 z-30 shadow-sm sticky top-0 shrink-0">
        
        {/* Left: Logo & Navigation Menu */}
        <div className="flex items-center gap-8">
           {/* Branding */}
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/teacher/overview')}>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
                <BookOpen size={24} />
              </div>
              <div className="flex flex-col">
                  <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 tracking-tight leading-none">
                  ÖĞRETMEN
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
                        setTimeout(() => navigate(item.path), 100); // Menü animasyonu için küçük gecikme
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
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
            >
              <Bell size={20} className={`group-hover:animate-swing ${isNotificationsOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {isNotificationsOpen && (
              <div className="absolute right-0 top-full mt-4 w-80 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700 py-2 animate-fade-in z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <button onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">Tümünü Okundu Say</button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div key={notification.id} className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${!notification.read ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className={`text-sm ${!notification.read ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>{notification.title}</h4>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{notification.time}</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{notification.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs">Bildiriminiz yok.</div>
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
                AH
              </div>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''} hidden md:block`} />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-4 w-72 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-indigo-500/10 border border-white/20 dark:border-slate-700 py-2 animate-fade-in z-50">
                 <div className="p-4 bg-slate-50/50 dark:bg-slate-700/30 m-2 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">AH</div>
                       <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Ahmet Hoca</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Matematik Zümre Bşk.</p>
                       </div>
                    </div>
                 </div>
                  <div className="py-1">
                    <button onClick={() => { setIsProfileOpen(false); navigate('/teacher/profile'); }} className="w-full px-6 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"><User size={16}/> Profil</button>
                    <button onClick={() => { setIsProfileOpen(false); navigate('/teacher/settings'); }} className="w-full px-6 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors"><Settings size={16}/> Ayarlar</button>
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
            onClick={() => navigate('/')}
          >
            <LogOut size={20} />
            <span className="text-[9px] font-medium truncate w-full text-center">Çıkış</span>
          </button>
        </div>
      </div>

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

export default TeacherDashboard;