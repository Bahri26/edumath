import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import apiClient, { withAuthRequestConfig, AUTH_TIMEOUT } from '../../services/api';
import { wakeBackend } from '../../services/backendWake';
import { AuthContext } from '../../context/AuthContext';
import SkipLink from '../../components/ui/SkipLink.jsx';
import { admin as a } from '../../components/admin/adminUi';
import { useTranslation } from '../../i18n/useTranslation';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await wakeBackend();
      const resp = await apiClient.post('/auth/login', { email, password }, withAuthRequestConfig({
        timeout: AUTH_TIMEOUT,
      }));
      const { token, user } = resp.data;
      if (!user || user.role !== 'admin') {
        setError(t('admin.login.errAdmin'));
      } else {
        login(user, token);
        navigate('/admin');
      }
    } catch (err) {
      if (err?.code === 'ECONNABORTED') {
        setError(t('admin.login.errTimeout'));
      } else {
        setError(err?.response?.data?.message || t('admin.login.errGeneric'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-4 py-12">
      <SkipLink>{t('skipToContent')}</SkipLink>
      <main id="main-content" tabIndex={-1} className="relative w-full max-w-md">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-teal-500/50 to-teal-600/30 blur-sm" aria-hidden />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30">
              <Sparkles className="h-7 w-7" strokeWidth={2} aria-hidden />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-teal-300/90">{t('admin.login.badge')}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">{t('admin.login.title')}</h1>
            <p className="mt-2 text-sm text-slate-400">{t('admin.login.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className={`${a.fieldLabel} text-slate-400`}>{t('admin.login.email')}</label>
              <input
                id="admin-email"
                type="email"
                className={a.inputOnDark}
                placeholder="ornek@kurum.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="admin-password" className={`${a.fieldLabel} text-slate-400`}>{t('admin.login.password')}</label>
              <input
                id="admin-password"
                className={a.inputOnDark}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className={`${a.btnPrimary} w-full py-3`}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t('admin.login.submitting')}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 opacity-90" aria-hidden />
                  {t('admin.login.submit')}
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
