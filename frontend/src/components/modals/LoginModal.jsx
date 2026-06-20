// src/components/modals/LoginModal.jsx
import React, { useState, useContext, useId, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Lock, User, BookOpen, Briefcase, Loader2, ArrowRight, LogIn, UserPlus, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import apiClient, { withAuthRequestConfig, AUTH_TIMEOUT } from '../../services/api';
import { wakeBackend } from '../../services/backendWake';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import { getFriendlyApiError } from '../../utils/apiErrorMessage.js';
import { translations } from '../../data/translations';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const LoginModal = ({ isOpen, onClose, onLoginSuccess, lang = 'tr' }) => {
  const ui = translations[lang]?.login || translations.tr.login;
  const [isLoginView, setIsLoginView] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', 
    grade: '9. Sınıf', // Varsayılan sınıf
    schoolType: 'lise' // Varsayılan kademe
  });

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const fid = useId().replace(/:/g, '');
  const panelRef = useRef(null);
  useFocusTrap(panelRef, isOpen);

  useEffect(() => {
    if (!isOpen || !isLoginView) {
      setLoadingHint(null);
      return undefined;
    }
    let cancelled = false;
    wakeBackend().then((result) => {
      if (!cancelled && !result.ready) {
        setLoadingHint(ui.serverWaking);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isLoginView]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); 
    setSuccess(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoadingHint(null);
    setError(null);
    setSuccess(null);

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const postAuthWithRetry = async (path, payload) => {
      const maxAttempts = 3;
      let lastError = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          if (attempt === 1) {
            const wake = await wakeBackend({
              onProgress: (msg) => setLoadingHint(msg),
            });
            if (!wake.ready) {
              setLoadingHint('Sunucu henüz hazır değil; yine de giriş deneniyor…');
            }
          } else {
            setLoadingHint(ui.retryHint.replace('{attempt}', attempt).replace('{max}', maxAttempts));
            await sleep(2500 * attempt);
          }

          return await apiClient.post(
            path,
            payload,
            withAuthRequestConfig({
              timeout: attempt > 1 ? AUTH_TIMEOUT + 15000 : AUTH_TIMEOUT,
            }),
          );
        } catch (err) {
          lastError = err;
          const retryable =
            err?.code === 'ECONNABORTED' ||
            err?.response?.status === 503 ||
            err?.response?.data?.code === 'DB_NOT_READY';
          if (!retryable || attempt >= maxAttempts) {
            throw err;
          }
        }
      }

      throw lastError;
    };

    try {
      if (isLoginView) {
        // --- GİRİŞ YAP ---
        const response = await postAuthWithRetry('/auth/login', {
          email: formData.email,
          password: formData.password,
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
          grade: formData.role === 'student' ? formData.grade : undefined,
          schoolType: formData.role === 'student' ? formData.schoolType : undefined
        });
        setSuccess(ui.registerSuccess);
        setIsLoginView(true); 
        setFormData(prev => ({ ...prev, password: '' }));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Giriş / kayıt isteği başarısız:', err?.response?.status, err?.response?.data ?? err?.message);
      }
      const { message: friendly } = getFriendlyApiError(err);
      setError(friendly);
    } finally {
      setLoading(false);
      setLoadingHint(null);
    }
  };

  const toggleView = () => {
    setIsLoginView(!isLoginView);
    setError(null);
    setSuccess(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" role="presentation" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${fid}-login-title`}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label={ui.closeModal} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"><X size={24} aria-hidden /></button>

        <div className="p-8 pb-0 text-center">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-900/30 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {isLoginView ? <LogIn size={28} className="ml-1" aria-hidden /> : <UserPlus size={28} aria-hidden />}
          </div>
          <h2 id={`${fid}-login-title`} className="text-2xl font-bold text-slate-800 dark:text-white">
            {isLoginView ? ui.loginTitle : ui.registerTitle}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            {isLoginView ? ui.loginSubtitle : ui.registerSubtitle}
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
                  <button type="button" onClick={() => setFormData({...formData, role: 'student'})} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'student' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <BookOpen size={20} />
                    <span className="text-sm font-medium">{ui.student}</span>
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'teacher'})} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${formData.role === 'teacher' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                    <Briefcase size={20} aria-hidden />
                    <span className="text-sm font-medium">{ui.teacher}</span>
                  </button>
                </div>

                {/* 🚨 YENİ: KADEME VE SINIF SEVİYESİ SEÇİMİ (Sadece Öğrenci İçin) */}
                {formData.role === 'student' && (
                  <>
                  <div className="space-y-1 animate-fade-in">
                    <label htmlFor={`${fid}-school`} className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{ui.schoolType}</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} aria-hidden />
                      <Select
                        id={`${fid}-school`}
                        name="schoolType"
                        value={formData.schoolType}
                        onChange={handleChange}
                        className="pl-10 pr-4"
                      >
                        <option value="ilkokul">İlkokul</option>
                        <option value="ortaokul">Ortaokul</option>
                        <option value="lise">Lise</option>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 animate-fade-in">
                    <label htmlFor={`${fid}-grade`} className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{ui.grade}</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} aria-hidden />
                      <Select
                        id={`${fid}-grade`}
                        name="grade"
                        value={formData.grade}
                        onChange={handleChange}
                        className="pl-10 pr-4"
                      >
                        {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  </>
                )}

                {/* AD SOYAD */}
                <div className="space-y-1">
                  <label htmlFor={`${fid}-name`} className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{ui.name}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} aria-hidden />
                    <Input
                      id={`${fid}-name`}
                      type="text"
                      name="name"
                      required
                      placeholder={ui.namePlaceholder}
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 pr-4"
                      autoComplete="name"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label htmlFor={`${fid}-email`} className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{isLoginView ? ui.emailLoginLabel : ui.emailLabel}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} aria-hidden />
                <Input
                  id={`${fid}-email`}
                  type={isLoginView ? 'text' : 'email'}
                  name="email"
                  required
                  placeholder={isLoginView ? ui.emailLoginPlaceholder : ui.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 pr-4"
                  autoComplete={isLoginView ? 'username' : 'email'}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor={`${fid}-password`} className="text-xs font-medium text-slate-700 dark:text-slate-300 ml-1">{ui.passwordLabel}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={18} aria-hidden />
                <Input
                  id={`${fid}-password`}
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-4"
                  autoComplete={isLoginView ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            {isLoginView && (
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer"><input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" /> {ui.rememberMe}</label>
                <button type="button" className="text-brand-600 font-medium hover:underline"
                  onClick={async () => {
                    try {
                      if (!formData.email) {
                        setError(ui.resetNeedEmail);
                        return;
                      }
                      if (!formData.email.includes('@')) {
                        setError(ui.resetNeedValidEmail);
                        return;
                      }
                      await apiClient.post('/auth/password-reset-request', { email: formData.email, note: 'Login modal talebi' });
                      setSuccess(ui.resetSuccess);
                    } catch (err) {
                      setError(err?.response?.data?.message || ui.resetFail);
                    }
                  }}
                >{ui.forgotPassword}</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-200/60 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={20} aria-hidden /> : <>{isLoginView ? ui.btnLogin : ui.btnRegister} <ArrowRight size={20} aria-hidden /></>}
            </button>
            {loading && loadingHint && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">{loadingHint}</p>
            )}
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLoginView ? `${ui.noAccount} ` : `${ui.hasAccount} `}
            <button type="button" onClick={toggleView} className="text-brand-600 font-bold hover:underline">{isLoginView ? ui.register : ui.btnLogin}</button>
          </div>

          {isLoginView && (
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-xs font-medium text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                onClick={() => {
                  onClose();
                  navigate('/admin/login');
                }}
              >
                {ui.adminEntry}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginModal;