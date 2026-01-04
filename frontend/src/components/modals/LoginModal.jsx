// src/components/modals/LoginModal.jsx
import React, { useState, useContext } from 'react';
import { X, Mail, Lock, User, BookOpen, Briefcase, Loader2, ArrowRight, LogIn, UserPlus, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext'; 
import apiClient from '../../services/api'; 

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', 
    grade: '9. Sınıf' // Varsayılan sınıf
  });

  const { login } = useContext(AuthContext); 

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); 
    setSuccess(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLoginView) {
        // --- GİRİŞ YAP ---
        const response = await apiClient.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        const { token, user, refreshToken } = response.data;
        login(user, token);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        if (onLoginSuccess) onLoginSuccess(user.role);
        onClose();
      } else {
        // --- KAYIT OL ---
        await apiClient.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          grade: formData.role === 'student' ? formData.grade : undefined
        });
        setSuccess("Kayıt başarıyla oluşturuldu! Lütfen giriş yapın.");
        setIsLoginView(true); 
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      console.error("İşlem hatası:", err);
      const status = err.response?.status;
      const details = err.response?.data?.details;
      const rawMsg = err.response?.data?.message || err.message || "";
      let friendly = rawMsg;
      if (Array.isArray(details) && details.length > 0) {
        // Joi detaylarını daha anlaşılır hale getir
        friendly = details.map(d => (typeof d.message === 'string' ? d.message : '')).join('\n');
      }
      if (!friendly) {
        if (status === 400) friendly = 'Form verileri geçersiz. Lütfen alanları kontrol edin.';
        else if (status >= 500) friendly = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        else friendly = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      }
      setError(friendly);
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"><X size={24} /></button>

        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {isLoginView ? <LogIn size={28} className="ml-1" /> : <UserPlus size={28} />}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {isLoginView ? 'Tekrar Hoşgeldiniz' : 'Hesap Oluşturun'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {isLoginView ? 'Hesabınıza giriş yaparak derslere devam edin.' : 'Edumath dünyasına katılmak için bilgilerinizi girin.'}
          </p>
        </div>

        <div className="p-8 overflow-y-auto">
          {success && <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl flex items-start gap-3"><CheckCircle size={20} className="shrink-0 mt-0.5" /><span>{success}</span></div>}
          {error && <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3"><AlertCircle size={20} className="shrink-0 mt-0.5" /><span>{error}</span></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLoginView && (
              <>
                {/* ROL SEÇİMİ */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'student' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <BookOpen size={20} />
                    <span className="text-sm font-medium">Öğrenci</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'teacher'})} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'teacher' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 ring-1 ring-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Briefcase size={20} />
                    <span className="text-sm font-medium">Öğretmen</span>
                  </button>
                </div>

                {/* 🚨 YENİ: SINIF SEVİYESİ SEÇİMİ (Sadece Öğrenci İçin) */}
                {formData.role === 'student' && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Sınıf Seviyesi</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(cls => (
                           <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* AD SOYAD */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" name="name" required placeholder="Adınız Soyadınız" value={formData.name} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
               <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">E-Posta</label>
               <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" name="email" required placeholder="ornek@edumath.com" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">Şifre</label>
               <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" name="password" required placeholder="••••••••" value={formData.password} onChange={handleChange} className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors" />
              </div>
            </div>

            {isLoginView && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer"><input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" /> Beni Hatırla</label>
                <button type="button" className="text-indigo-600 font-medium hover:underline"
                  onClick={async () => {
                    try {
                      if (!formData.email) {
                        setError('Lütfen önce e-posta adresinizi girin.');
                        return;
                      }
                      await apiClient.post('/auth/password-reset-request', { email: formData.email, note: 'Login modal talebi' });
                      setSuccess('Şifre sıfırlama talebiniz alındı. Yönetici onayı sonrası size token iletilecek. Ardından /reset-password sayfasından şifrenizi güncelleyebilirsiniz.');
                    } catch (err) {
                      setError(err?.response?.data?.message || 'Talep oluşturulamadı');
                    }
                  }}
                >Şifremi Unuttum?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>{isLoginView ? 'Giriş Yap' : 'Kayıt Ol'} <ArrowRight size={20} /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLoginView ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
            <button onClick={toggleView} className="text-indigo-600 font-bold hover:underline">{isLoginView ? 'Kayıt Ol' : 'Giriş Yap'}</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginModal;