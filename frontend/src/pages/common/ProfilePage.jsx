
import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Briefcase, GraduationCap, Camera, Save, Loader2, CheckCircle, AlertCircle, Phone, BookUser } from 'lucide-react';
import { SUBJECTS, CLASS_LEVELS } from '../../data/classLevelsAndDifficulties';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import FormField from '../../components/ui/FormField.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';

const GRADE_OPTIONS = [...CLASS_LEVELS, 'Mezun'];

const SectionTitle = ({ children }) => (
  <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-600 pb-2 mb-4">
    {children}
  </h3>
);

const ProfilePage = ({ role }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    branch: '',
    branchApproval: 'none',
    grade: '',
    schoolType: 'ilkokul',
    avatar: '',
    bio: '',
    phone: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const d = res.data || {};
        setProfile({
          name: d.name || '',
          email: d.email || '',
          branch: d.branch || '',
          branchApproval: d.branchApproval || 'none',
          grade: d.grade || '',
          schoolType: d.schoolType || 'ilkokul',
          avatar: d.avatar || '',
          bio: d.bio || '',
          phone: d.phone || '',
        });
        setAvatarPreview(d.avatar || '');
      } catch {
        setProfile({
          name: '',
          email: '',
          branch: '',
          branchApproval: 'none',
          grade: '',
          schoolType: 'ilkokul',
          avatar: '',
          bio: '',
          phone: '',
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
        setProfile((p) => ({ ...p, avatar: reader.result }));
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
      const payload = {
        name: profile.name,
        email: profile.email,
        avatar: profile.avatar,
        bio: profile.bio,
        phone: profile.phone,
      };
      if (role === 'teacher') {
        payload.branch = profile.branch;
      }
      if (role === 'student') {
        payload.grade = profile.grade;
        payload.schoolType = profile.schoolType;
      }
      await apiClient.put('/users/profile', payload);
      showToast('Profiliniz güncellendi!', 'success');
    } catch (err) {
      showToast('Profil güncellenemedi: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const studentAccent = role === 'student';
  const initial = (profile.name && profile.name.trim().charAt(0)) || '?';

  return (
    <div
      className={`max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mt-8 animate-fade-in ${
        studentAccent ? 'border border-sky-200/70 dark:border-slate-700' : ''
      }`}
    >
      <h2
        className={`text-3xl font-extrabold mb-2 flex items-center gap-3 ${
          studentAccent
            ? 'bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-teal-400'
            : 'text-slate-800 dark:text-white'
        }`}
      >
        <User size={32} className={studentAccent ? 'text-teal-600 dark:text-teal-400' : 'text-brand-600'} /> Profilim
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        {role === 'teacher'
          ? 'Hesap bilgileriniz ve branş onayınız burada. Branş değişince bazı içeriklere erişim admin onayına bağlanır.'
          : 'Adınız, iletişim ve sınıf bilgileriniz burada; öğretmeniniz ve sistem bu alanları görüntüleyebilir.'}
      </p>

      <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
        <div className="flex flex-col items-center w-full md:w-1/3">
          <div className="relative group mb-2">
            <div className="w-32 h-32 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center text-5xl font-bold border-4 border-white dark:border-slate-700 shadow-md uppercase overflow-hidden">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-2 right-2 bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full shadow transition-all group-hover:scale-110"
              onClick={() => fileInputRef.current.click()}
              title="Fotoğrafı değiştir"
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
          <button
            type="button"
            className="text-brand-600 dark:text-brand-400 text-sm font-bold cursor-pointer hover:underline bg-transparent border-0"
            onClick={() => fileInputRef.current.click()}
          >
            Fotoğrafı değiştir
          </button>
          <span className="text-xs text-slate-400 mt-1">JPG veya PNG, max 2MB</span>
        </div>

        <div className="flex-1 w-full space-y-10">
          <section aria-labelledby="profile-account-heading">
            <SectionTitle>
              <span id="profile-account-heading">Hesap bilgileri</span>
            </SectionTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Ad ve e-posta tüm rollerde ortaktır. E-posta giriş için kullanılır; değiştirirseniz bir sonraki girişte yeni adresi kullanın.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label={<><User size={18} aria-hidden /> Ad soyad</>}>
                <Input type="text" name="name" value={profile.name} onChange={handleChange} autoComplete="name" />
              </FormField>
              <FormField label={<><Mail size={18} aria-hidden /> E-posta</>}>
                <Input type="email" name="email" value={profile.email} onChange={handleChange} autoComplete="email" />
              </FormField>
            </div>
          </section>

          {role === 'teacher' && (
            <section aria-labelledby="profile-teacher-heading">
              <SectionTitle>
                <span id="profile-teacher-heading" className="inline-flex items-center gap-2">
                  <Briefcase size={20} className="text-brand-600 shrink-0" aria-hidden />
                  Branş ve erişim
                </span>
              </SectionTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Branşınız soru bankası ve sınav gibi alanlarda içerik filtresi için kullanılır. Yeni seçim veya değişiklik yönetici onayına düşer.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 min-w-0">
                  <FormField label="Branş">
                    <Select name="branch" value={profile.branch} onChange={handleChange}>
                      <option value="">Branş seçiniz</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <button
                  type="button"
                  className="shrink-0 px-4 py-3 rounded-xl bg-brand-600 text-white font-semibold hover:bg-brand-700"
                  onClick={async () => {
                    try {
                      if (!profile.branch) {
                        showToast('Lütfen önce bir branş seçin.', 'error');
                        return;
                      }
                      await apiClient.put('/users/profile', { branch: profile.branch });
                      const res = await apiClient.get('/users/profile');
                      setProfile((p) => ({ ...p, branchApproval: res.data.branchApproval || 'pending' }));
                      showToast('Branş onay talebi gönderildi. Admin onayı sonrası erişim açılacak.', 'success');
                    } catch (e) {
                      const msg = e?.response?.data?.message || 'Talep oluşturulamadı';
                      showToast(msg, 'error');
                    }
                  }}
                >
                  Onaya gönder
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {profile.branchApproval === 'approved' && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle size={14} aria-hidden /> Branş onaylandı
                  </span>
                )}
                {profile.branchApproval === 'pending' && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <AlertCircle size={14} aria-hidden /> Onay bekliyor
                  </span>
                )}
                {(!profile.branch || profile.branchApproval === 'none') && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
                    Branş seçilmedi
                  </span>
                )}
                {profile.branchApproval === 'pending' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Admin onayından sonra erişim otomatik açılır.</span>
                )}
              </div>
            </section>
          )}

          {role === 'student' && (
            <section aria-labelledby="profile-student-heading">
              <SectionTitle>
                <span id="profile-student-heading" className="inline-flex items-center gap-2">
                  <GraduationCap size={20} className="text-teal-600 dark:text-teal-400 shrink-0" aria-hidden />
                  Okul bilgileri
                </span>
              </SectionTitle>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Kademe ve sınıf, içerik önerileri ve sınıf düzeyine uygun içerik için kullanılır. Kayıt sırasında seçtiğiniz değerleri buradan güncelleyebilirsiniz.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Kademe">
                  <Select name="schoolType" value={profile.schoolType} onChange={handleChange}>
                    <option value="ilkokul">İlkokul</option>
                    <option value="ortaokul">Ortaokul</option>
                    <option value="lise">Lise</option>
                  </Select>
                </FormField>
                <FormField label="Sınıf seviyesi">
                  <Select name="grade" value={profile.grade} onChange={handleChange}>
                    <option value="">Seçiniz</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </section>
          )}

          <section aria-labelledby="profile-extra-heading">
            <SectionTitle>
              <span id="profile-extra-heading" className="inline-flex items-center gap-2">
                <BookUser size={20} className="text-slate-500 shrink-0" aria-hidden />
                İsteğe bağlı iletişim
              </span>
            </SectionTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Telefon ve kısa tanıtım; yalnızca kayıtlı kullanıcılarınız veya yönetim tarafında görüntülenebilir. Zorunlu değildir.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label={<><Phone size={18} aria-hidden /> Telefon</>}>
                <Input type="tel" name="phone" value={profile.phone} onChange={handleChange} autoComplete="tel" placeholder="Örn: 05xx xxx xx xx" />
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Kısa tanıtım">
                  <Textarea name="bio" value={profile.bio} onChange={handleChange} rows={3} placeholder="Kendinizden birkaç cümle…" />
                </FormField>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200/60 dark:shadow-none hover:bg-brand-700 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <Save size={20} aria-hidden /> Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
