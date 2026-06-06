import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Sparkles } from 'lucide-react';
import apiClient, { withAuthRequestConfig, AUTH_TIMEOUT } from '../../services/api';
import { wakeBackend } from '../../services/backendWake';
import { AuthContext } from '../../context/AuthContext';
import { admin as a } from '../../components/admin/adminUi';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
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
        setError('Admin yetkisi yok veya hatalı kullanıcı.');
      } else {
        login(user, token);
        navigate('/admin');
      }
    } catch (err) {
      if (err?.code === 'ECONNABORTED') {
        setError('Giriş isteği zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        setError(err?.response?.data?.message || 'Giriş hatası');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-violet-500/50 to-indigo-600/30 blur-sm" />
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-black/40 backdrop-blur-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/30">
              <Sparkles className="h-7 w-7" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-300/90">Yönetici</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Edumath giriş</h1>
            <p className="mt-2 text-sm text-slate-400">Yetkili hesabınızla oturum açın.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`${a.fieldLabel} text-slate-400`}>E-posta</label>
              <input
                type="email"
                className={a.inputOnDark}
                placeholder="ornek@kurum.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={`${a.fieldLabel} text-slate-400`}>Şifre</label>
              <input
                className={a.inputOnDark}
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className={`${a.btnPrimary} w-full py-3`}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Giriş yapılıyor…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 opacity-90" />
                  Giriş yap
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
