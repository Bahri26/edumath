// frontend-react/src/pages/ProfilePage.jsx (GÜNCEL VE İKON AYARLARI EKLENMİŞ HALİ)

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../assets/styles/TeacherPages.css';
import PageHeader from '../components/common/PageHeader'; 

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
      <div className="teacher-page-container">
        <p>Profil bilgileri yükleniyor veya kullanıcı bulunamadı...</p>
      </div>
    );
  }

  // Kullanıcı rolünü belirle
  let roleDisplay = 'Kullanıcı';
  let roleIcon = faUserTag;
  if (user.roles?.isTeacher) {
    roleDisplay = 'Öğretmen';
    roleIcon = faUserTag;
  } else if (user.roles?.isStudent) {
    roleDisplay = 'Öğrenci';
    roleIcon = faGraduationCap;
  }

  return (
    <div className="teacher-page-container">
      <PageHeader title="Profil Bilgileri" /> 

      <div className="page-card profile-card">
        
        <h2 className="profile-name-header">
          {/* İsim başlığı */}
          {user.fullName || `${user.firstName} ${user.lastName}`}
        </h2>
        
        <div className="profile-details">
          {/* E-posta */}
          <div className="profile-item">
            <strong className="profile-label">E-posta Adresi:</strong>
            <span className="profile-value">
              <FontAwesomeIcon icon={faEnvelope} className="me-2" />
              {user.email}
            </span>
          </div>
          
          {/* Kullanıcı Rolü */}
          <div className="profile-item">
            <strong className="profile-label">Kullanıcı Rolü:</strong>
            <span className="profile-role-badge">
              <FontAwesomeIcon icon={roleIcon} className="me-2" />
              {roleDisplay}
            </span>
          </div>

          {/* Sadece öğrenciyse sınıfını göster */}
          {user.roles?.isStudent && user.gradeLevel && (
            <div className="profile-item">
              <strong className="profile-label">Sınıf Düzeyi:</strong>
              <span className="profile-value">{user.gradeLevel}. Sınıf</span>
            </div>
          )}
          
        </div>

        <div className="profile-actions">
          {/* BUTONLAR: İkonlar FontAwesomeIcon bileşeni ile güncellendi */}
          <button className="btn-primary">
            <FontAwesomeIcon icon={faKey} className="me-2" />
            Şifreyi Değiştir
          </button>
          
          {/* İkinci buton için yeni stil (btn-outline-info) kullanıldı */}
          <button className="btn-outline-info">
            <FontAwesomeIcon icon={faUserEdit} className="me-2" />
            Bilgileri Düzenle
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;