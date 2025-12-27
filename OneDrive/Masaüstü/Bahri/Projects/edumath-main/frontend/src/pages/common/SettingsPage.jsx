import React, { useState, useEffect } from 'react';
import { User, Lock, Save, Mail, Briefcase, GraduationCap, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';

const SettingsPage = ({ role = 'student' }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    detail: '', // Sınıf veya Branş bilgisi
    branch: '', // Öğretmen ise
    grade: '',  // Öğrenci ise
    avatar: '',
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
            avatar: res.data.avatar || ''
        });
      } catch (error) {
        console.error("Profil yüklenemedi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/users/profile', formData);
      alert("Bilgileriniz başarıyla güncellendi! ✅");
    } catch (error) {
      alert("Hata oluştu: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
        {role === 'teacher' ? 'Öğretmen Ayarları' : 'Öğrenci Ayarları'}
      </h2>


      {/* --- TEMA & BİLDİRİM AYARLARI --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
          <GraduationCap size={24} />
          <h3 className="font-bold text-lg">Genel Ayarlar</h3>
        </div>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">Karanlık Mod</span>
            <button className="bg-slate-200 dark:bg-slate-700 rounded-full px-4 py-2 font-bold text-indigo-600 dark:text-indigo-300">Aç / Kapat</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-200">Bildirimler</span>
            <button className="bg-slate-200 dark:bg-slate-700 rounded-full px-4 py-2 font-bold text-indigo-600 dark:text-indigo-300">Açık</button>
          </div>
        </div>
      </div>

      {/* --- GÜVENLİK --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-6 text-indigo-600 dark:text-indigo-400">
          <Lock size={24} />
          <h3 className="font-bold text-lg">Güvenlik</h3>
        </div>
        <div className="space-y-4">
           <button className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-sm">Şifremi Değiştir</button>
           <button className="text-red-500 font-medium hover:underline text-sm block">Hesabımı Sil</button>
        </div>
      </div>

      {/* --- KAYDET BUTONU --- */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Değişiklikleri Kaydet</>}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;