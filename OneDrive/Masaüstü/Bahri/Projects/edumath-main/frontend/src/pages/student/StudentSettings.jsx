import React, { useState, useEffect, useContext } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun, 
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';

const StudentSettings = () => {
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const { language, setLanguage } = useContext(LanguageContext);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');

  const t = {
    TR: {
      pageTitle: 'Ayarlar',
      account: 'Hesap',
      notifications: 'Bildirimler',
      surveys: 'Anketlerim',
      privacy: 'Gizlilik',
      darkMode: 'Koyu Mod',
      enableDarkMode: 'Koyu modu etkinleştir',
      language: 'Dil',
      selectLanguage: 'Dil seçin',
      emailNotifications: 'E-posta Bildirimleri',
      enableEmails: 'Yeni görevler hakkında e-posta al',
      pushNotifications: 'Bildirim Almaç',
      enablePush: 'Tarayıcı bildirimlerini etkinleştir',
      mySurveys: 'Anketlerim',
      completedSurveys: 'Tamamlanan Anketler',
      viewSurvey: 'Anketi Gör',
      noSurveys: 'Henüz anket yok',
      privacySettings: 'Gizlilik Ayarları',
      profileVisibility: 'Profil Görünürlüğü',
      publicProfile: 'Profilini herkese açık yap',
      allowMessages: 'Mesaj almayı izin ver',
      dataExport: 'Veri İhraç',
      exportData: 'Tüm verilerimi indir',
      loading: 'Yükleniyor...',
      completedOn: 'Tamamlanan:',
    },
    EN: {
      pageTitle: 'Settings',
      account: 'Account',
      notifications: 'Notifications',
      surveys: 'My Surveys',
      privacy: 'Privacy',
      darkMode: 'Dark Mode',
      enableDarkMode: 'Enable dark mode',
      language: 'Language',
      selectLanguage: 'Select language',
      emailNotifications: 'Email Notifications',
      enableEmails: 'Get emails about new assignments',
      pushNotifications: 'Push Notifications',
      enablePush: 'Enable browser notifications',
      mySurveys: 'My Surveys',
      completedSurveys: 'Completed Surveys',
      viewSurvey: 'View Survey',
      noSurveys: 'No surveys yet',
      privacySettings: 'Privacy Settings',
      profileVisibility: 'Profile Visibility',
      publicProfile: 'Make my profile public',
      allowMessages: 'Allow messages',
      dataExport: 'Data Export',
      exportData: 'Download all my data',
      loading: 'Loading...',
      completedOn: 'Completed:',
    }
  };

  const getText = (key) => t[language][key] || key;

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/surveys/student/my-surveys');
      setSurveys(res.data.data || []);
    } catch (err) {
      console.error('Error fetching surveys:', err);
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto`}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Settings size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {getText('pageTitle')}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">
          Hesap ve tercihlerinizi yönetin
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'account'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            👤 {getText('account')}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'notifications'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            🔔 {getText('notifications')}
          </button>
          <button
            onClick={() => setActiveTab('surveys')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'surveys'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            📋 {getText('surveys')}
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-4 px-6 font-semibold text-center transition-colors ${
              activeTab === 'privacy'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            🔒 {getText('privacy')}
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={20} className="text-purple-500" /> : <Sun size={20} className="text-amber-500" />}
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('darkMode')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('enableDarkMode')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    isDarkMode ? 'bg-purple-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      isDarkMode ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Globe size={20} className="text-blue-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('language')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('selectLanguage')}</p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TR">Türkçe</option>
                  <option value="EN">English</option>
                </select>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Bell size={20} className="text-orange-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('emailNotifications')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('enableEmails')}</p>
                  </div>
                </div>
                <button className="relative w-12 h-7 rounded-full bg-emerald-600 transition-colors">
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full transition-transform" />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('pushNotifications')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('enablePush')}</p>
                  </div>
                </div>
                <button className="relative w-12 h-7 rounded-full bg-slate-300 transition-colors">
                  <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* Surveys Tab */}
          {activeTab === 'surveys' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">
                  {getText('mySurveys')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tamamladığın anketlerin listesi
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block">
                    <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                    <p className="text-slate-500 dark:text-slate-400">{getText('loading')}</p>
                  </div>
                </div>
              ) : surveys.length > 0 ? (
                <div className="grid gap-4">
                  {surveys.map((survey, idx) => (
                    <div
                      key={survey._id}
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/30 hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-400 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg">
                              ✓ Tamamlandı
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 dark:text-white mb-1 text-lg">
                            {survey.title}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                            {survey.description || 'Anket açıklaması yok'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              {new Date(survey.completedAt).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                            {survey.questions && (
                              <div className="flex items-center gap-1">
                                <FileText size={13} className="text-blue-600" />
                                {survey.questions.length} soru
                              </div>
                            )}
                          </div>
                        </div>
                        <button className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors group-hover:scale-110 flex-shrink-0">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                  <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{getText('noSurveys')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Öğretmen tarafından paylaşılan anketler burada görüntülenecek
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                {getText('privacySettings')}
              </h3>

              {/* Profile Visibility */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-indigo-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('profileVisibility')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('publicProfile')}</p>
                  </div>
                </div>
                <button className="relative w-12 h-7 rounded-full bg-slate-300 transition-colors">
                  <div className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform" />
                </button>
              </div>

              {/* Allow Messages */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield size={20} className="text-green-500" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('allowMessages')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Başkalarından mesaj al</p>
                  </div>
                </div>
                <button className="relative w-12 h-7 rounded-full bg-emerald-600 transition-colors">
                  <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full transition-transform" />
                </button>
              </div>

              {/* Data Export */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{getText('dataExport')}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{getText('exportData')}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors">
                    İndir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;
