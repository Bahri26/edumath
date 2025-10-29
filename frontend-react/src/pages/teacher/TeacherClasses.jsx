// frontend-react/src/pages/teacher/TeacherClasses.jsx (12 KARTLI ANA SAYFA)

import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/TeacherPages.css'; // Paylaşılan stiller

// 1'den 12'ye kadar bir dizi oluştur
const gradeLevels = Array.from({ length: 12 }, (_, i) => i + 1);

// Sınıflara ikon ve renk atamak için (isteğe bağlı)
const getGradeStyle = (level) => {
  if (level <= 5) return { icon: 'fa-child', color: '#0d6efd' }; // İlkokul (Mavi)
  if (level <= 8) return { icon: 'fa-book-open', color: '#198754' }; // Ortaokul (Yeşil)
  return { icon: 'fa-user-graduate', color: '#6f42c1' }; // Lise (Mor)
};

function TeacherClasses() {
  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <h1>Sınıflar Yönetimi</h1>
        <p style={{marginTop: '-1rem', color: '#6c757d'}}>
          Lütfen işlem yapmak istediğiniz sınıf seviyesini seçin.
        </p>
      </div>

      {/* --- YENİ: 12 KARTLIK GRID YAPISI --- */}
      <div className="grade-level-grid">
        {gradeLevels.map((level) => {
          const style = getGradeStyle(level);
          return (
            <Link 
              key={level} 
              to={`/teacher/classes/${level}`} // -> /teacher/classes/1, /teacher/classes/2 ...
              className="grade-card" 
              style={{ '--card-color': style.color }} // CSS'e renk göndermek için
            >
              <div className="grade-card-icon">
                <i className={`fas ${style.icon}`}></i>
              </div>
              <div className="grade-card-body">
                <h3>{level}. Sınıf</h3>
                {/* TODO: Backend'den gelince burası dolacak */}
                <p>0 Sınıf, 0 Öğrenci</p> 
              </div>
              <div className="grade-card-footer">
                Yönet <i className="fas fa-arrow-right"></i>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherClasses;