// frontend-react/src/pages/ProfilePage.jsx (GÜNCEL VE İKON AYARLARI EKLENMİŞ HALİ)

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/TeacherPages.css';
import '../assets/styles/ProfilePage.css';
// PageHeader kullanımı bu sayfadan kaldırıldı; yerine basit bir başlık eklenecek

// --- GÜNCELLEME 1: Font Awesome İMPORT VE KÜTÜPHANE AYARI ---
// (Bu ayarlar, ikonların görünmesi için zorunludur)
import { library } from '@fortawesome/fontawesome-svg-core'; // Temel kütüphane
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Bileşen
import { 
  faKey, 
  faUserEdit, 
  faEnvelope, 
  faUserTag, 
  faGraduationCap // Kullanıcı rollerini göstermek için ekledik (isteğe bağlı)
} from '@fortawesome/free-solid-svg-icons'; // Kullanacağımız ikonlar

// İkonları kütüphaneye ekle
library.add(faKey, faUserEdit, faEnvelope, faUserTag, faGraduationCap);
// --- GÜNCELLEME 1 SONU ---


function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Kullanıcı rolünü belirle
  let roleDisplay = 'Kullanıcı';
  let roleIcon = faUserTag;
  let roleColor = 'var(--gray)';

  if (user.roles?.isTeacher) {
    roleDisplay = 'Öğretmen';
    roleIcon = faUserTag;
    roleColor = 'var(--primary-color)';
  } else if (user.roles?.isStudent) {
    roleDisplay = 'Öğrenci';
    roleIcon = faGraduationCap;
    roleColor = 'var(--info-color)';
  }

  return (
    <div className="page-container">
      {/* Basit içerik başlığı (PageHeader yerine) */}
      <div style={{ padding: '1rem 0 0.5rem 0' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Profil Bilgileri</h2>
      </div>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <FontAwesomeIcon icon={faUserTag} size="2x" />
          </div>
          <div className="profile-title">
            <h1>{user.fullName || `${user.firstName} ${user.lastName}`}</h1>
            <div className="profile-role" style={{ backgroundColor: roleColor }}>
              <FontAwesomeIcon icon={roleIcon} />
              <span>{roleDisplay}</span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>Kişisel Bilgiler</h3>
            <div className="profile-grid">
              <div className="profile-item">
                <div className="profile-item-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div className="profile-item-content">
                  <label>E-posta</label>
                  <span>{user.email}</span>
                </div>
              </div>

              {user.roles?.isStudent && user.gradeLevel && (
                <div className="profile-item">
                  <div className="profile-item-icon">
                    <FontAwesomeIcon icon={faGraduationCap} />
                  </div>
                  <div className="profile-item-content">
                    <label>Sınıf Düzeyi</label>
                    <span>{user.gradeLevel}. Sınıf</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn btn-primary">
              <FontAwesomeIcon icon={faUserEdit} />
              <span>Profili Düzenle</span>
            </button>
            <button className="btn btn-secondary">
              <FontAwesomeIcon icon={faKey} />
              <span>Şifre Değiştir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;