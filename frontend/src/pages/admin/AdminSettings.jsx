import React, { useEffect, useState } from 'react';
import { Loader2, Save, User } from 'lucide-react';
import apiClient from '../../services/api';
import { admin as a } from '../../components/admin/adminUi';

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
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/users/profile');
        setProfile({ name: res.data.name || '', email: res.data.email || '' });
      } catch (err) {
        setError(err?.response?.data?.message || 'Profil yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      await apiClient.put('/users/profile', profile);
      setInfo('Ayarlar güncellendi.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
      <header className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25">
          <User className="h-6 w-6" />
        </span>
        <div>
          <p className={a.eyebrow}>Hesap</p>
          <h1 className={a.title}>Admin ayarları</h1>
          <p className={a.subtitle}>Profil bilgileriniz ve tercihleriniz.</p>
        </div>
      </header>

      {error && <div className={a.alertError}>{error}</div>}
      {info && <div className={a.alertOk}>{info}</div>}

      {loading ? (
        <div className={a.loadingBox}>
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-teal-600" />
          Yükleniyor…
        </div>
      ) : (
        <div className={`${a.card} space-y-6`}>
          <div>
            <label className={a.fieldLabel}>Ad</label>
            <input
              className={a.input}
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className={a.fieldLabel}>E-posta</label>
            <input
              className={a.input}
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className={a.fieldLabel}>Bildirimler</label>
              <select
                className={a.select + ' w-full'}
                value={notifyEnabled ? 'on' : 'off'}
                onChange={(e) => setNotifyEnabled(e.target.value === 'on')}
              >
                <option value="on">Açık</option>
                <option value="off">Kapalı</option>
              </select>
            </div>
            <div>
              <label className={a.fieldLabel}>Tema</label>
              <select className={a.select + ' w-full'} value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="system">Sistem</option>
                <option value="light">Açık</option>
                <option value="dark">Koyu</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-6 dark:border-slate-800">
            <button type="button" className={a.btnPrimary} onClick={save} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kaydediliyor…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
