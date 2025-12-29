import React, { useState, useContext } from 'react';
import { 
  Settings, Bell, Shield, Globe, Moon, Sun, FileText, 
  ChevronRight, AlertCircle, Users, LogOut 
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import { AuthContext } from '../../context/AuthContext'; // AuthContext'ten user bilgisini alalım

// --- Çeviri Sözlüğü (Genişletilebilir) ---
const translations = {
  TR: {
    pageTitle: 'Ayarlar',
    subtitle: 'Hesap ve uygulama tercihlerinizi yönetin',
    tabs: {
      account: 'Hesap',
      notifications: 'Bildirimler',
      privacy: 'Gizlilik',
      surveys: 'Anketlerim', // Öğrenci için
      classroom: 'Sınıf Ayarları' // Öğretmen için
    },
    darkMode: 'Koyu Mod',
    language: 'Dil',
    notificationsEmail: 'E-posta Bildirimleri',
    notificationsPush: 'Anlık Bildirimler',
    privacyVisibility: 'Profil Görünürlüğü',
    logout: 'Çıkış Yap'
  },
  EN: {
    pageTitle: 'Settings',
    subtitle: 'Manage your account and preferences',
    tabs: {
      account: 'Account',
      notifications: 'Notifications',
      privacy: 'Privacy',
      surveys: 'My Surveys',
      classroom: 'Classroom'
    },
    darkMode: 'Dark Mode',
    language: 'Language',
    notificationsEmail: 'Email Notifications',
    notificationsPush: 'Push Notifications',
    privacyVisibility: 'Profile Visibility',
    logout: 'Log Out'
  }
};

export default function SettingsPage({ userRole = 'student' }) {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const { language, setLanguage } = useContext(LanguageContext);
  const { logout } = useContext(AuthContext); // Çıkış fonksiyonu
  
  const [activeTab, setActiveTab] = useState('account');
  const t = translations[language] || translations['TR'];

  // --- TAB MENU ITEMS ---
  const tabs = [
    { id: 'account', label: t.tabs.account, icon: Settings },
    { id: 'notifications', label: t.tabs.notifications, icon: Bell },
    { id: 'privacy', label: t.tabs.privacy, icon: Shield },
  ];

  // Role Özel Tablar
  if (userRole === 'student') {
    tabs.splice(2, 0, { id: 'surveys', label: t.tabs.surveys, icon: FileText });
  }
  if (userRole === 'teacher') {
    tabs.splice(2, 0, { id: 'classroom', label: t.tabs.classroom, icon: Users });
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 pb-24 min-h-screen">
      
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Settings size={24} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {t.pageTitle}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium ml-1">
          {t.subtitle} ({userRole === 'teacher' ? 'Öğretmen Paneli' : 'Öğrenci Paneli'})
        </p>
      </div>

      {/* TABS HEADER */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={18} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* CONTENT CARD */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
        
        {/* 1. HESAP AYARLARI (Ortak) */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
              Görünüm ve Dil
            </h3>
            
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                   {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{t.darkMode}</p>
                  <p className="text-sm text-slate-500">Uygulama temasını değiştir</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : ''}`} />
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                   <Globe size={24} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">{t.language}</p>
                  <p className="text-sm text-slate-500">Tercih ettiğiniz dili seçin</p>
                </div>
              </div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TR">Türkçe</option>
                <option value="EN">English</option>
              </select>
            </div>

            {/* Logout Button */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
               <button 
                  onClick={logout}
                  className="w-full py-4 rounded-xl border-2 border-rose-100 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold flex items-center justify-center gap-2 transition-colors"
               >
                  <LogOut size={20} /> {t.logout}
               </button>
            </div>
          </div>
        )}

        {/* 2. BİLDİRİMLER (Ortak) */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
             {/* Örnek Bildirim Ayarı */}
             <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                   <Bell className="text-indigo-500" />
                   <span className="font-bold text-slate-700 dark:text-slate-200">{t.notificationsEmail}</span>
                </div>
                <input type="checkbox" className="w-5 h-5 accent-indigo-600" defaultChecked />
             </div>
          </div>
        )}

        {/* 3. ANKETLERİM (Sadece Öğrenci) */}
        {activeTab === 'surveys' && userRole === 'student' && (
           <div className="text-center py-10">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Henüz tamamlanmış anket yok.</p>
              {/* Buraya anket listesi bileşeni (SurveyList) eklenebilir */}
           </div>
        )}

        {/* 4. SINIF AYARLARI (Sadece Öğretmen) */}
        {activeTab === 'classroom' && userRole === 'teacher' && (
           <div className="text-center py-10">
              <Users size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Sınıf ve şube ayarları yakında...</p>
           </div>
        )}

      </div>
    </div>
  );
}