
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Briefcase, GraduationCap, Camera, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { SUBJECTS } from '../../data/classLevelsAndDifficulties';
import apiClient from '../../services/api';
import { toast } from 'react-toastify';

const ProfilePage = ({ role }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    branch: '',
    branchApproval: 'none',
    grade: '',
    avatar: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    // Profil verilerini API'den çek
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        setProfile({
          name: res.data.name || '',
          email: res.data.email || '',
          branch: res.data.branch || '',
          branchApproval: res.data.branchApproval || 'none',
          grade: res.data.grade || '',
          avatar: res.data.avatar || '',
        });
        setAvatarPreview(res.data.avatar || '');
      } catch (e) {
        // fallback demo
        setProfile({
          name: role === 'teacher' ? 'Bahadır SARI' : 'Öğrenci Adı',
          email: 'bahadir26@hotmail.com',
          branch: role === 'teacher' ? '' : '',
          branchApproval: 'none',
          grade: role === 'student' ? '' : '',
          avatar: '',
        });
      }
    };
    fetchProfile();
  }, [role]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfile(p => ({ ...p, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/users/profile', profile);
      toast.success('Profiliniz güncellendi!');
    } catch (err) {
      toast.error('Profil güncellenemedi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mt-8 animate-fade-in">
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
        <User size={32} className="text-indigo-600" /> Profilim
      </h2>
      <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
        {/* Profil Fotoğrafı */}
        <div className="flex flex-col items-center w-full md:w-1/3">
          <div className="relative group mb-2">
            <div className="w-32 h-32 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-5xl font-bold border-4 border-white dark:border-slate-700 shadow-md uppercase overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                profile.name.charAt(0)
              )}
            </div>
            <button
              className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow transition-all group-hover:scale-110"
              onClick={() => fileInputRef.current.click()}
              title="Fotoğrafı Değiştir"
            >
              <Camera size={20} />
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
          </div>
          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold cursor-pointer hover:underline" onClick={() => fileInputRef.current.click()}>
            Fotoğrafı Değiştir
          </span>
          <span className="text-xs text-slate-400 mt-1">JPG veya PNG, max 2MB</span>
        </div>

        {/* Profil Bilgileri */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                <User size={18}/> Ad Soyad
              </label>
              <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                <Mail size={18}/> E-Posta
              </label>
              <input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            {role === 'teacher' && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                  <Briefcase size={18}/> Branş
                </label>
                <div className="flex items-center gap-3">
                  <select
                    name="branch"
                    value={profile.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none"
                  >
                    <option value="">Branş seçiniz</option>
                    {SUBJECTS.map((s)=> (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    className="px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold"
                    onClick={async ()=>{
                      try {
                        if (!profile.branch) { toast.error('Lütfen önce bir branş seçin.'); return; }
                        await apiClient.put('/users/profile', { branch: profile.branch });
                        const res = await apiClient.get('/users/profile');
                        setProfile(p=>({ ...p, branchApproval: res.data.branchApproval || 'pending' }));
                        toast.success('Branş onay talebi gönderildi. Admin onayı sonrası erişim açılacak.');
                      } catch (e) {
                        const msg = e?.response?.data?.message || 'Talep oluşturulamadı';
                        toast.error(msg);
                      }
                    }}
                  >Onaya Gönder</button>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {profile.branchApproval === 'approved' && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><CheckCircle size={14}/> Branş Onaylandı</span>
                  )}
                  {profile.branchApproval === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1"><AlertCircle size={14}/> Onay Bekliyor</span>
                  )}
                  {(!profile.branch || profile.branchApproval === 'none') && (
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-600 border border-slate-200">Branş Seçilmedi</span>
                  )}
                  {profile.branchApproval === 'pending' && (
                    <span className="text-xs text-slate-500">Admin onayından sonra erişim otomatik açılır.</span>
                  )}
                </div>
              </div>
            )}
            {role === 'student' && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                  <GraduationCap size={18}/> Sınıf Seviyesi
                </label>
                <input type="text" name="grade" value={profile.grade} onChange={handleChange} placeholder="Örn: 10. Sınıf" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
              </div>
            )}
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Kaydet</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
