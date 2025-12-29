
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Briefcase, GraduationCap, Camera } from 'lucide-react';
import apiClient from '../../services/api';

const ProfilePage = ({ role }) => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    branch: '',
    grade: '',
    avatar: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
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
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
      // Burada API'ye yükleme işlemi yapılabilir
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow p-8 mt-8 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
        {/* Profil Fotoğrafı */}
        <div className="flex flex-col items-center w-full md:w-1/3">
          <div className="relative group mb-2">
            <div className="w-28 h-28 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-4xl font-bold border-4 border-white dark:border-slate-700 shadow-md uppercase overflow-hidden">
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
              <Camera size={18} />
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
              <input type="text" value={profile.name} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                <Mail size={18}/> E-Posta
              </label>
              <input type="email" value={profile.email} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
            </div>
            {role === 'teacher' && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                  <Briefcase size={18}/> Branş
                </label>
                <input type="text" value={profile.branch} placeholder="Örn: Matematik" readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
              </div>
            )}
            {role === 'student' && (
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                  <GraduationCap size={18}/> Sınıf Seviyesi
                </label>
                <input type="text" value={profile.grade} placeholder="Örn: 10. Sınıf" readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
