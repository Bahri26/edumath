import React, { useEffect, useState } from 'react';
import apiClient from '../../services/api';

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [theme, setTheme] = useState('system');
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await apiClient.get('/users/profile');
        setProfile({ name: res.data.name || '', email: res.data.email || '' });
      } catch (err) {
        setError(err?.response?.data?.message || 'Profil yüklenemedi');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true); setError(null); setInfo(null);
    try {
      await apiClient.put('/users/profile', profile);
      setInfo('Ayarlar güncellendi.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Kaydedilemedi');
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Admin Ayarları</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {info && <div className="mb-4 text-green-600">{info}</div>}
      {loading ? 'Yükleniyor...' : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm mb-1">Ad</label>
            <input className="border rounded px-3 py-2 w-full" value={profile.name} onChange={e=>setProfile({...profile, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm mb-1">E-posta</label>
            <input className="border rounded px-3 py-2 w-full" value={profile.email} onChange={e=>setProfile({...profile, email: e.target.value})} />
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm">Bildirimler</label>
            <select className="border rounded px-2 py-1" value={notifyEnabled ? 'on' : 'off'} onChange={e=>setNotifyEnabled(e.target.value === 'on')}>
              <option value="on">Açık</option>
              <option value="off">Kapalı</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <label className="text-sm">Tema</label>
            <select className="border rounded px-2 py-1" value={theme} onChange={e=>setTheme(e.target.value)}>
              <option value="system">Sistem</option>
              <option value="light">Açık</option>
              <option value="dark">Koyu</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={save} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
