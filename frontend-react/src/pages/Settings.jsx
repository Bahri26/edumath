// frontend-react/src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem('notifications') || 'true')
  );
  const [soundEnabled, setSoundEnabled] = useState(
    JSON.parse(localStorage.getItem('soundEnabled') || 'true')
  );
  const [message, setMessage] = useState('');

  const handleSave = () => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
    setMessage('✅ Ayarlar kaydedildi!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="teacher-page-container">
      <div className="kids-card mb-3">
        <div className="d-flex align-items-center gap-3">
          <div style={{ fontSize: '1.75rem' }}>⚙️</div>
          <div>
            <h2 className="m-0">Ayarlar</h2>
            <p className="m-0 muted">Uygulama tercihlerini buradan yönetin</p>
          </div>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}

      <div className="d-flex flex-column gap-3">
        {/* Görünüm */}
        <div className="kids-card">
          <h3 className="mb-3">🎨 Görünüm</h3>
          <div className="mb-2">
            <label className="form-label">Tema</label>
            <select
              className="kids-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">☀️ Açık Tema</option>
              <option value="dark">🌙 Koyu Tema</option>
              <option value="auto">🔄 Otomatik</option>
            </select>
          </div>
        </div>

        {/* Bildirimler */}
        <div className="kids-card">
          <h3 className="mb-3">🔔 Bildirimler</h3>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="toggleNotifications"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="toggleNotifications">
              Bildirimleri göster
            </label>
          </div>
          <p className="muted mt-2">Yeni sınavlar, sonuçlar ve duyurular için bildirim alın.</p>
        </div>

        {/* Ses */}
        <div className="kids-card">
          <h3 className="mb-3">🔊 Ses</h3>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="toggleSound"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="toggleSound">
              Ses efektlerini aç
            </label>
          </div>
          <p className="muted mt-2">Doğru/yanlış cevap seslerini ve başarı efektlerini çal.</p>
        </div>

        {/* Hesap */}
        <div className="kids-card">
          <h3 className="mb-3">👤 Hesap Bilgileri</h3>
          <div className="kids-grid-2">
            <div className="page-card">
              <div className="d-flex justify-content-between">
                <span className="muted">Ad Soyad</span>
                <span>{user?.firstName} {user?.lastName}</span>
              </div>
            </div>
            <div className="page-card">
              <div className="d-flex justify-content-between">
                <span className="muted">E-posta</span>
                <span>{user?.email}</span>
              </div>
            </div>
            <div className="page-card">
              <div className="d-flex justify-content-between">
                <span className="muted">Rol</span>
                <span>{user?.roles?.isTeacher ? '👨‍🏫 Öğretmen' : '👩‍🎓 Öğrenci'}</span>
              </div>
            </div>
            {user?.roles?.isStudent && user?.gradeLevel && (
              <div className="page-card">
                <div className="d-flex justify-content-between">
                  <span className="muted">Sınıf</span>
                  <span>{user.gradeLevel}. Sınıf</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kaydet Butonu */}
        <div>
          <button className="kids-btn primary" onClick={handleSave}>💾 Ayarları Kaydet</button>
        </div>
      </div>
    </div>
  );
}
