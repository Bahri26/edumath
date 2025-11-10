// frontend-react/src/pages/Settings.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/ProfilePage.css';

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
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-icon">⚙️</div>
          <h2>Ayarlar</h2>
          <p>Uygulama tercihlerini buradan yönetin</p>
        </div>

        {message && <div className="alert-success">{message}</div>}

        <div className="profile-sections">
          {/* Görünüm */}
          <div className="profile-section">
            <h3 className="section-title">🎨 Görünüm</h3>
            <div className="setting-group">
              <label className="setting-label">Tema</label>
              <select
                className="kids-input"
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
          <div className="profile-section">
            <h3 className="section-title">🔔 Bildirimler</h3>
            <div className="setting-group">
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-label">Bildirimleri göster</span>
              </label>
              <p className="setting-description">
                Yeni sınavlar, sonuçlar ve duyurular için bildirim alın.
              </p>
            </div>
          </div>

          {/* Ses */}
          <div className="profile-section">
            <h3 className="section-title">🔊 Ses</h3>
            <div className="setting-group">
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span className="toggle-label">Ses efektlerini aç</span>
              </label>
              <p className="setting-description">
                Doğru/yanlış cevap seslerini ve başarı efektlerini çal.
              </p>
            </div>
          </div>

          {/* Hesap */}
          <div className="profile-section">
            <h3 className="section-title">👤 Hesap Bilgileri</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Ad Soyad:</span>
                <span className="info-value">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">E-posta:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Rol:</span>
                <span className="info-value">
                  {user?.roles?.isTeacher ? '👨‍🏫 Öğretmen' : '👩‍🎓 Öğrenci'}
                </span>
              </div>
              {user?.roles?.isStudent && user?.gradeLevel && (
                <div className="info-item">
                  <span className="info-label">Sınıf:</span>
                  <span className="info-value">{user.gradeLevel}. Sınıf</span>
                </div>
              )}
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="profile-actions">
            <button className="kids-btn kids-btn-primary" onClick={handleSave}>
              💾 Ayarları Kaydet
            </button>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .profile-sections {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .profile-section {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .section-title {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          color: #1f2937;
        }
        .setting-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .setting-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        .toggle-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
        }
        .toggle-container input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        .toggle-label {
          font-weight: 600;
          color: #1f2937;
        }
        .setting-description {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0.5rem 0 0 0;
        }
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
        }
        .info-value {
          color: #1f2937;
        }
        .profile-actions {
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
