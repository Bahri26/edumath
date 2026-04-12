import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Mail, Briefcase, GraduationCap, Loader2, Bell, Moon, Sun, Trash2, CheckCircle } from 'lucide-react';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';

const SettingsPage = ({ role = 'student' }) => {
  // Şifre değiştirme modalı için state
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    detail: '', // Sınıf veya Branş bilgisi
    branch: '', // Öğretmen ise
    grade: '',  // Öğrenci ise
    avatar: '',
    theme: 'light',
    notifications: true,
  });

  // Verileri Çek
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          branch: res.data.branch || '',
          grade: res.data.grade || '',
          avatar: res.data.avatar || '',
          theme: res.data.theme || 'light',
          notifications: typeof res.data.notifications === 'boolean' ? res.data.notifications : true
        });
      } catch (error) {
        console.error("Profil yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    const fetchNotifications = async () => {
      try {
        setNotifLoading(true);
        const res = await apiClient.get('/notifications?limit=5');
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch (error) {
        console.error('Bildirimler yüklenemedi:', error);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Tema veya bildirim değiştiğinde backend'e kaydet
  const handlePrefChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    try {
      await apiClient.put('/users/profile', { [field]: value });
    } catch (error) {
      alert('Ayar güncellenemedi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/users/profile', formData);
      toast.success("Bilgileriniz başarıyla güncellendi! ✅");
    } catch (error) {
      toast.error("Hata oluştu: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      alert('Bildirimler okunmadı olarak işaretlenemedi: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-20">
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
        <SettingsPageIcon role={role} />
        {role === 'teacher' ? 'Öğretmen Ayarları' : 'Öğrenci Ayarları'}
      </h2>

      {/* --- KULLANICI BİLGİLERİ --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-md flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2"><User size={16}/> Ad Soyad</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2"><Mail size={16}/> E-Posta</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            {role === 'teacher' && (
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2"><Briefcase size={16}/> Branş</label>
                <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
              </div>
            )}
            {role === 'student' && (
              <div>
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2"><GraduationCap size={16}/> Sınıf</label>
                <input type="text" name="grade" value={formData.grade} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TEMA & BİLDİRİM AYARLARI --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-md flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"><Moon size={18}/> Karanlık Mod</span>
            <button
              className={`ml-auto bg-slate-200 dark:bg-slate-700 rounded-full px-4 py-2 font-bold text-indigo-600 dark:text-indigo-300 ${formData.theme === 'dark' ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => handlePrefChange('theme', formData.theme === 'dark' ? 'light' : 'dark')}
            >{formData.theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>} {formData.theme === 'dark' ? 'Kapat' : 'Aç'}</button>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2"><Bell size={18}/> Bildirimler</span>
            <button
              className={`ml-auto bg-slate-200 dark:bg-slate-700 rounded-full px-4 py-2 font-bold text-indigo-600 dark:text-indigo-300 ${formData.notifications ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => handlePrefChange('notifications', !formData.notifications)}
            >{formData.notifications ? <CheckCircle size={16}/> : <Trash2 size={16}/>} {formData.notifications ? 'Açık' : 'Kapalı'}</button>
          </div>
        </div>
        <div className="flex-1 mt-8 md:mt-0">
          <div className="mb-2 flex items-center gap-2"><Bell size={18}/> <span className="font-bold text-slate-700 dark:text-slate-200">Son Bildirimler</span> {unreadCount > 0 && <span className="ml-2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>}</div>
          <div className="border rounded-xl bg-slate-50 dark:bg-slate-900/40">
            {notifLoading ? (
              <div className="p-3 text-slate-500">Yükleniyor...</div>
            ) : notifications.length === 0 ? (
              <div className="p-3 text-slate-500">Bildirim yok</div>
            ) : notifications.map(n => (
              <div key={n._id} className={`p-3 border-b last:border-b-0 ${n.isRead ? '' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}>
                <div className="font-semibold flex items-center gap-2">{n.title} {!n.isRead && <span className="ml-2 bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">Yeni</span>}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{n.message}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-2">
            <button onClick={markAllRead} className="px-3 py-2 rounded border bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-semibold">Tümünü Okundu İşaretle</button>
          </div>
        </div>
      </div>

      {/* --- GÜVENLİK --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-md flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <button
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm"
            onClick={() => setShowPwdModal(true)}
          >Şifremi Değiştir</button>
          <button
            className="text-red-500 font-medium hover:underline text-sm block"
            onClick={async () => {
              if (!window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
              try {
                await apiClient.delete('/users/delete');
                toast.success('Hesabınız silindi.');
                localStorage.clear();
                window.location.href = '/';
              } catch (err) {
                toast.error('Hesap silinemedi: ' + (err.response?.data?.message || err.message));
              }
            }}
          >Hesabımı Sil</button>
        </div>
      </div>

      {/* --- ŞİFRE DEĞİŞTİRME MODALI --- */}
      {showPwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
            <h3 className="font-bold text-lg mb-4 dark:text-white">Şifre Değiştir</h3>
            <div className="space-y-4">
              <input
                type="password"
                placeholder="Eski Şifre"
                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:text-white"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                autoFocus
              />
              <input
                type="password"
                placeholder="Yeni Şifre"
                className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:text-white"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white font-semibold"
                onClick={() => { setShowPwdModal(false); setOldPassword(''); setNewPassword(''); }}
                disabled={pwdLoading}
              >İptal</button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-60"
                disabled={pwdLoading || !oldPassword || !newPassword}
                onClick={async () => {
                  setPwdLoading(true);
                  try {
                    await apiClient.post('/users/change-password', { oldPassword, newPassword });
                    toast.success('Şifreniz başarıyla değiştirildi!');
                    setShowPwdModal(false);
                    setOldPassword('');
                    setNewPassword('');
                  } catch (err) {
                    toast.error('Şifre değiştirilemedi: ' + (err.response?.data?.message || err.message));
                  } finally {
                    setPwdLoading(false);
                  }
                }}
              >{pwdLoading ? 'Kaydediliyor...' : 'Kaydet'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- KAYDET BUTONU --- */}
      <div className="flex justify-end mt-8">
        <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Değişiklikleri Kaydet</>}
        </button>
      </div>
    </div>
  );

  // Rol bazlı ikon
  function SettingsPageIcon({ role }) {
    if (role === 'teacher') return <Briefcase size={28} className="text-indigo-600" />;
    if (role === 'student') return <GraduationCap size={28} className="text-indigo-600" />;
    return <User size={28} className="text-indigo-600" />;
  }
};

export default SettingsPage;