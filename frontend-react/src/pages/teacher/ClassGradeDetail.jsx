// frontend-react/src/pages/teacher/ClassGradeDetail.jsx (YENİ CRUD SAYFASI)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { createClass, getClasses } from '../../services/classService';

// Not: dummySubClasses kaldırıldı. Artık gerçek API çağrısı kullanılıyor.

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
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClasses(gradeLevel); // filtreli liste
      setSubClasses(data);
    } catch (err) {
      console.error('getClasses failed', err);
      setError('Sınıflar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [gradeLevel]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // --- EVENT HANDLERS (CRUD) ---
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName || !newSubject) {
      setError('Sınıf adı ve ders alanı zorunludur.');
      return;
    }
    try {
      const payload = {
        name: newClassName,
        subject: newSubject,
        gradeLevel: gradeLevel,
      };
      const created = await createClass(payload);
      setSubClasses([created, ...subClasses]);
      setIsModalOpen(false);
      setNewClassName('');
      setNewSubject('Genel');
    } catch (err) {
      console.error('createClass failed', err);
      setError('Sınıf oluşturulamadı.');
    }
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
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : subClasses.length === 0 ? (
        <div className="alert alert-info">Bu sınıf seviyesi için henüz bir şube oluşturmamışsınız.</div>
      ) : (
        <div className="exams-grid">
          {subClasses.map((cls) => (
            <div key={cls.id || cls._id} className="page-card exam-card">
              {cls.classCode && (
                <div className="class-code-badge">
                  Sınıf Kodu: <strong>{cls.classCode}</strong>
                </div>
              )}
              <h3>{cls.name}</h3>
              <p className="class-subject">{cls.subject}</p>
              <div className="exam-details">
                <span><i className="fas fa-users"></i> {(cls.studentCount ?? cls.students?.length) || 0} Öğrenci</span>
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
