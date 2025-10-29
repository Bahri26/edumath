// frontend-react/src/pages/ProfilePage.jsx (YENİ DOSYA)

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
// TeacherPages.css'teki .teacher-page-container ve .page-card stillerini
// yeniden kullanmak için import edelim.
import '../assets/styles/TeacherPages.css';

function ProfilePage() {
  const { user } = useAuth();

  // Eğer bir şekilde user yoksa (yükleniyordur veya giriş yapılmamıştır)
  if (!user) {
    return (
      <div className="teacher-page-container">
        <h1>Profil</h1>
        <p>Profil bilgileri yükleniyor veya kullanıcı bulunamadı...</p>
      </div>
    );
  }

  // Kullanıcı rolünü belirle
  let roleDisplay = 'Kullanıcı';
  if (user.roles?.isTeacher) {
    roleDisplay = 'Öğretmen';
  } else if (user.roles?.isStudent) {
    roleDisplay = 'Öğrenci';
  }

  return (
    <div className="teacher-page-container">
      <h1>Profil Bilgileri</h1>

      <div className="page-card">
        <h2>{user.fullName || `${user.firstName} ${user.lastName}`}</h2>
        
        <div className="profile-details">
          <div className="profile-item">
            <strong>E-posta Adresi:</strong>
            <span>{user.email}</span>
          </div>
          <div className="profile-item">
            <strong>Kullanıcı Rolü:</strong>
            <span className="profile-role-badge">{roleDisplay}</span>
          </div>

          {/* Sadece öğrenciyse sınıfını göster */}
          {user.roles?.isStudent && user.gradeLevel && (
            <div className="profile-item">
              <strong>Sınıf Düzeyi:</strong>
              <span>{user.gradeLevel}. Sınıf</span>
            </div>
          )}

          {/* TODO: Backend'den 'user' objesine birthDate eklenmeli */}
          {/* <div className="profile-item">
            <strong>Doğum Tarihi:</strong>
            <span>{new Date(user.birthDate).toLocaleDateString('tr-TR')}</span>
          </div> */}
        </div>

        <div className="profile-actions">
          <button className="btn-primary"><i className="fas fa-key me-2"></i>Şifreyi Değiştir</button>
          <button className="btn-secondary"><i className="fas fa-user-edit me-2"></i>Bilgileri Düzenle</button>
        </div>

      </div>
    </div>
  );
}

export default ProfilePage;