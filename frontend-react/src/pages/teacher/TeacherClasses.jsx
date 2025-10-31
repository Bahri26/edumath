// frontend-react/src/pages/teacher/TeacherClasses.jsx (SON HATA DÜZELTMELİ HALİ)

import React from 'react';
import { Link } from 'react-router-dom';
import '../../assets/styles/TeacherPages.css'; 
import PageHeader from '../../components/common/PageHeader'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChild, faBookOpen, faUserGraduate, faArrowRight } from '@fortawesome/free-solid-svg-icons';

// 1'den 12'ye kadar bir dizi oluştur
const gradeLevels = Array.from({ length: 12 }, (_, i) => i + 1);

const getGradeStyle = (level) => {
    let icon, color;
    if (level <= 5) {
        icon = faChild; 
        color = '#0d6efd'; // İlkokul (Mavi)
    } else if (level <= 8) {
        icon = faBookOpen; 
        color = '#198754'; // Ortaokul (Yeşil)
    } else {
        icon = faUserGraduate; 
        color = '#6f42c1'; // Lise (Mor)
    }
    return { icon, color };
};

function TeacherClasses() {

  return (
    <div className="teacher-page-container">
        
      <PageHeader title="Sınıflar Yönetimi">
        {/* Butonları buraya ekleyebilirsiniz */}
      </PageHeader>
      
      <p className="page-header-description" style={{maxWidth: '1000px', margin: '0 auto 1.5rem auto'}}>
        Lütfen işlem yapmak istediğiniz sınıf seviyesini seçin.
      </p>

      {/* --- KONTROL EDİN: Bu class'lar TeacherPages.css'te tanımlı olmalı --- */}
      <div className="grade-level-grid">
        {gradeLevels.map((level) => {
          const style = getGradeStyle(level);
          return (
            <Link 
              key={level} 
              to={`/teacher/classes/${level}`} 
              className="page-card grade-card" // Sınıf kartı stili
              style={{ '--card-color': style.color }} // CSS Değişkeni
            >
              <div className="grade-card-icon">
                <FontAwesomeIcon icon={style.icon} />
              </div>
              <div className="grade-card-body">
                <h3>{level}. Sınıf</h3>
                <p>0 Sınıf, 0 Öğrenci</p> 
              </div>
              <div className="grade-card-footer">
                Yönet <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default TeacherClasses;