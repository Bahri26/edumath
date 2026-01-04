import React, { useState } from 'react';
import apiClient from '../../services/api';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(null); setError(null);
    try {
      const resp = await apiClient.post('/auth/reset-password', { email, token, newPassword });
      setMessage(resp.data?.message || 'Şifre başarıyla güncellendi.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sıfırlama hatası';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Şifre Sıfırla</h1>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-3 rounded" placeholder="E-posta" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-3 rounded" placeholder="Token" value={token} onChange={e=>setToken(e.target.value)} />
        <input className="w-full border p-3 rounded" type="password" placeholder="Yeni Şifre" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white p-3 rounded" disabled={loading}>
          {loading ? 'Gönderiliyor...' : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
