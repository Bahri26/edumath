// frontend-react/src/pages/teacher/TeacherExams.jsx

import React, { useState, useEffect } from 'react';
// Stil dosyasını import edelim
import '../../assets/styles/TeacherPages.css';

// SAHTE VERİ (Backend'den gelene kadar)
const dummyExams = [
  { id: 'e1', title: 'Matematik 1. Vize', class: '10-A', questionCount: 20, duration: 45 },
  { id: 'e2', title: 'React Temelleri Testi', class: '12-B', questionCount: 10, duration: 20 },
];

function TeacherExams() {
  // --- STATE'LER ---
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal (açılır pencere) state'i
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yeni sınav formu state'i
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDuration, setNewExamDuration] = useState(40);

  // --- EFFECT ---
  useEffect(() => {
    setLoading(true);
    // TODO: Backend'den 'axios.get('/api/exams')' ile sınavları çek
    setTimeout(() => {
      setExams(dummyExams);
      setLoading(false);
    }, 500); // Daha hızlı yükleme
  }, []);

  // --- EVENT HANDLERS ---
  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!newExamTitle) return;

    const newExam = {
      id: `e${Math.floor(Math.random() * 100)}`,
      title: newExamTitle,
      questionCount: 0, // Başlangıçta 0 soru
      duration: newExamDuration
    };

    // TODO: Backend'e 'axios.post('/api/exams', newExam)' ile gönder
    console.log('Yeni Sınav Oluşturuldu:', newExam);

    setExams([newExam, ...exams]);
    setIsModalOpen(false); // Modalı kapat
    setNewExamTitle(''); // Formu temizle
  };


  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <h1>Sınavlar</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus me-2"></i> Yeni Sınav Oluştur
        </button>
      </div>
      
      {/* --- MEVCUT SINAV LİSTESİ --- */}
      {loading ? (
        <p>Sınavlar yükleniyor...</p>
      ) : (
        <div className="exams-grid">
          {exams.map((exam) => (
            <div key={exam.id} className="page-card exam-card">
              <h3>{exam.title}</h3>
              <div className="exam-details">
                <span><i className="fas fa-question-circle"></i> {exam.questionCount} Soru</span>
                <span><i className="fas fa-clock"></i> {exam.duration} Dakika</span>
              </div>
              <div className="exam-actions">
                <button className="btn-secondary">Soru Ekle/Düzenle</button>
                <button className="btn-primary">Ata</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- YENİ SINAV OLUŞTURMA MODALI --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Sınav Oluştur</h2>
            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label htmlFor="examTitle">Sınav Başlığı</label>
                <input 
                  type="text" 
                  id="examTitle"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="Örn: 11. Sınıf Fizik 1. Dönem"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="examDuration">Sınav Süresi (Dakika)</label>
                <input 
                  type="number" 
                  id="examDuration"
                  value={newExamDuration}
                  onChange={(e) => setNewExamDuration(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  İptal
                </button>
                <button type="submit" className="btn-primary">
                  Oluştur ve Devam Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeacherExams;