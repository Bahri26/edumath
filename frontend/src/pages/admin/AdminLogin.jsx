import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const resp = await apiClient.post('/auth/login', { email, password });
      const { token, user } = resp.data;
      if (!user || user.role !== 'admin') {
        setError('Admin yetkisi yok veya hatalı kullanıcı.');
      } else {
        login(user, token);
        navigate('/admin');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Giriş hatası');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Giriş</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full border p-3 rounded" placeholder="E-posta" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-3 rounded" type="password" placeholder="Şifre" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white p-3 rounded" disabled={loading}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
