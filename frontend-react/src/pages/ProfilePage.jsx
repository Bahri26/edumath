// frontend-react/src/pages/ProfilePage.jsx (GÜNCEL VE İKON AYARLARI EKLENMİŞ HALİ)

import React from 'react';
import { useAuth } from '../hooks/useAuth';
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
    return <div className="kids-loading">Yükleniyor</div>;
  }

  // Kullanıcı rolünü belirle (kids theme renkleri)
  let roleDisplay = 'Kullanıcı';
  let roleIcon = faUserTag;
  let roleClass = 'kids-badge purple';

  if (user.roles?.isTeacher) {
    roleDisplay = 'Öğretmen';
    roleIcon = faUserTag;
    roleClass = 'kids-badge pink';
  } else if (user.roles?.isStudent) {
    roleDisplay = 'Öğrenci';
    roleIcon = faGraduationCap;
    roleClass = 'kids-badge turquoise';
  }

  return (
    <div className="teacher-page-container">
      <div className="kids-card mb-3 d-flex align-items-center gap-3">
        <div className="kids-badge purple" style={{ fontSize: '1.2rem' }}>
          <FontAwesomeIcon icon={faUserTag} />
        </div>
        <div>
          <h2 className="m-0">Profil Bilgileri</h2>
          <p className="m-0 muted">Kullanıcıya ait temel bilgiler</p>
        </div>
      </div>

      <div className="kids-grid-2">
        <div className="kids-card">
          <h3 className="mb-3">Kişisel Bilgiler</h3>
          <div className="d-flex flex-column gap-2">
            <div className="page-card d-flex justify-content-between">
              <span className="muted">Ad Soyad</span>
              <span>{user.fullName || `${user.firstName} ${user.lastName}`}</span>
            </div>
            <div className="page-card d-flex justify-content-between">
              <span className="muted">E-posta</span>
              <span>{user.email}</span>
            </div>
            {user.roles?.isStudent && user.gradeLevel && (
              <div className="page-card d-flex justify-content-between">
                <span className="muted">Sınıf</span>
                <span>{user.gradeLevel}. Sınıf</span>
              </div>
            )}
            <div className="page-card d-flex justify-content-between align-items-center">
              <span className="muted">Rol</span>
              <span className={roleClass} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <FontAwesomeIcon icon={roleIcon} /> {roleDisplay}
              </span>
            </div>
          </div>
        </div>

        <div className="kids-card">
          <h3 className="mb-3">İşlemler</h3>
            <div className="d-flex gap-2 flex-wrap">
              <button className="kids-btn primary d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faUserEdit} />
                <span>Profili Düzenle</span>
              </button>
              <button className="kids-btn warning d-flex align-items-center gap-2">
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