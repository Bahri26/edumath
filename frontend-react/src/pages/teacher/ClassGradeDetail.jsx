// frontend-react/src/pages/teacher/ClassGradeDetail.jsx (YENİ CRUD SAYFASI)

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; // useParams'ı import et
import axios from 'axios';
import '../../assets/styles/TeacherPages.css';

// SAHTE VERİ (Sadece bu sayfayı test etmek için)
const dummySubClasses = {
  '9': [
    { id: 'c1', name: '9-A Fen Lisesi', subject: 'Fizik', studentCount: 22, classCode: 'A1-B2C' },
    { id: 'c2', name: '9-B Anadolu', subject: 'Matematik', studentCount: 30, classCode: 'XF-9Z1' },
  ],
  '10': [
    { id: 'c3', name: '10-A Matematik', subject: 'Matematik', studentCount: 25, classCode: 'P9-KLY' },
  ],
};

function ClassGradeDetail() {
  // --- STATE'LER ---
  const [subClasses, setSubClasses] = useState([]); // 9-A, 9-B gibi alt sınıflar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Yeni sınıf formu state'i
  const [newClassName, setNewClassName] = useState('');
  const [newSubject, setNewSubject] = useState('Genel');

  // --- 1. ADIM: URL'den Sınıf Seviyesini Al ---
  const { gradeLevel } = useParams(); // URL'deki :gradeLevel parametresini alır (örn: "9")

  // --- EFFECT ---
  useEffect(() => {
    setLoading(true);
    setError(null);
    // TODO: Backend'i bağlayınca bu API çağrısı kullanılacak
    // const fetchClasses = async () => {
    //   try {
    //     const response = await axios.get(`/api/classes?gradeLevel=${gradeLevel}`);
    //     setSubClasses(response.data);
    //   } catch (err) {
    //     setError('Sınıflar yüklenemedi.');
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchClasses();

    // Şimdilik sahte veriyi kullan
    setTimeout(() => {
      setSubClasses(dummySubClasses[gradeLevel] || []);
      setLoading(false);
    }, 500);
    
  }, [gradeLevel]); // gradeLevel değiştikçe (örn: 9'dan 10'a geçerse) veriyi yeniden çek

  // --- EVENT HANDLERS (CRUD) ---
  const handleCreateClass = (e) => {
    e.preventDefault();
    if (!newClassName || !newSubject) {
      setError('Sınıf adı ve ders alanı zorunludur.');
      return;
    }

    const newClass = {
      id: `c${Math.floor(Math.random() * 100)}`,
      name: newClassName,
      subject: newSubject,
      studentCount: 0, 
      classCode: `RND-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      gradeLevel: gradeLevel // -> Bu sınıfa ait olduğunu belirtir
    };

    // TODO: Backend'e 'axios.post('/api/classes', newClass)' ile gönder
    console.log('Yeni Sınıf Oluşturuldu:', newClass);

    setSubClasses([newClass, ...subClasses]);
    setIsModalOpen(false);
    setNewClassName('');
    setNewSubject('Genel');
  };

  return (
    <div className="teacher-page-container">
      <div className="page-header">
        {/* Geri dön butonu */}
        <Link to="/teacher/classes" className="back-link">
          <i className="fas fa-arrow-left me-2"></i> Tüm Sınıf Seviyeleri
        </Link>
        <h1>{gradeLevel}. Sınıf Yönetimi</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus me-2"></i> Yeni {gradeLevel}. Sınıf Şubesi Ekle
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* --- MEVCUT SINIF LİSTESİ (Kart/Grid) --- */}
      {loading ? (
        <p>Sınıflar yükleniyor...</p>
      ) : subClasses.length === 0 ? (
        <div className="alert alert-info">Bu sınıf seviyesi için henüz bir şube oluşturmamışsınız.</div>
      ) : (
        <div className="exams-grid">
          {subClasses.map((cls) => (
            <div key={cls.id} className="page-card exam-card">
              <div className="class-code-badge">
                Sınıf Kodu: <strong>{cls.classCode}</strong>
              </div>
              <h3>{cls.name}</h3>
              <p className="class-subject">{cls.subject}</p>
              <div className="exam-details">
                <span><i className="fas fa-users"></i> {cls.studentCount} Öğrenci</span>
              </div>
              <div className="exam-actions">
                <button className="btn-primary"><i className="fas fa-tasks me-2"></i>Ödev/Sınav Ata</button>
                <button className="btn-secondary btn-sm"><i className="fas fa-edit"></i>Düzenle</button>
                <button className="btn-danger btn-sm"><i className="fas fa-trash"></i>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- YENİ SINIF OLUŞTURMA MODALI --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni {gradeLevel}. Sınıf Şubesi Oluştur</h2>
            <form onSubmit={handleCreateClass}>
              <div className="form-group">
                <label htmlFor="className">Şube Adı</label>
                <input type="text" id="className" value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder={`Örn: ${gradeLevel}-A Fen Grubu`}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="classSubject">Ana Ders</label>
                <select id="classSubject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
                  <option value="Genel">Genel</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Fizik">Fizik</option>
                  {/* ... */}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Sınıfı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassGradeDetail;