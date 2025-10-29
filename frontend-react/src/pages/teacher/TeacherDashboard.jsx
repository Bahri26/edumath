// frontend-react/src/pages/teacher/TeacherDashboard.jsx (BAŞLIKLI VE KARTLI - SON HALİ)

import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader'; // Yeni başlık bileşeni
import '../../assets/styles/TeacherPages.css'; // Ortak stil dosyası

function TeacherDashboard() {
  return (
    <>
      {/* --- 1. YENİ BAŞLIK --- */}
      <PageHeader title="Öğretmen Paneli" />

      {/* --- 2. PANO İÇERİĞİ (Özet Kartlar) --- */}
      <div className="teacher-page-container" style={{paddingTop: 0}}>
        
        {/* Sınavlar/Sınıflar için kullandığımız 3 sütunlu grid yapısı */}
        <div className="exams-grid">
          
          <div className="page-card exam-card">
            <h3><i className="fas fa-layer-group me-2 text-primary"></i> Soru Havuzu</h3>
            <div className="exam-details" style={{fontSize: '1.5rem', justifyContent: 'center', margin: '1rem 0'}}>
              {/* TODO: Backend'den Soru Sayısı Çekilecek */}
              <strong>0</strong>
              <span style={{fontSize: '0.9rem', color: '#6c757d', marginLeft: '0.5rem'}}>Soru</span>
            </div>
            <div className="exam-actions">
              <Link to="/teacher/question-pool" className="btn-primary" style={{width: '100%'}}>
                <i className="fas fa-plus me-2"></i> Soru Ekle
              </Link>
            </div>
          </div>

          <div className="page-card exam-card">
            <h3><i className="fas fa-school me-2 text-success"></i> Sınıflar</h3>
            <div className="exam-details" style={{fontSize: '1.5rem', justifyContent: 'center', margin: '1rem 0'}}>
              {/* TODO: Backend'den Sınıf Sayısı Çekilecek */}
              <strong>0</strong>
               <span style={{fontSize: '0.9rem', color: '#6c757d', marginLeft: '0.5rem'}}>Sınıf</span>
            </div>
            <div className="exam-actions">
               <Link to="/teacher/classes" className="btn-success" style={{width: '100%'}}> {/* Renk değişti */}
                 <i className="fas fa-edit me-2"></i> Sınıfları Yönet
               </Link>
            </div>
          </div>
          
           <div className="page-card exam-card">
            <h3><i className="fas fa-user-graduate me-2 text-info"></i> Öğrenciler</h3>
            <div className="exam-details" style={{fontSize: '1.5rem', justifyContent: 'center', margin: '1rem 0'}}>
              {/* TODO: Backend'den Öğrenci Sayısı Çekilecek */}
              <strong>0</strong>
               <span style={{fontSize: '0.9rem', color: '#6c757d', marginLeft: '0.5rem'}}>Öğrenci</span>
            </div>
            <div className="exam-actions">
               <Link to="/teacher/students" className="btn-info" style={{width: '100%', color: 'white'}}> {/* Renk değişti */}
                 <i className="fas fa-users me-2"></i> Öğrencilerim
               </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default TeacherDashboard;