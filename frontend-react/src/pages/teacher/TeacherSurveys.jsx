// frontend-react/src/pages/teacher/TeacherSurveys.jsx

import React, { useState, useEffect } from 'react';
// Paylaşılan stil dosyamızı import edelim
import '../../assets/styles/TeacherPages.css';

// SAHTE VERİ (Backend bağlanana kadar)
const dummySurveys = [
  { id: 's1', title: 'Öğrenci Memnuniyet Anketi', targetClass: 'Tüm Sınıflar', responseCount: 45, status: 'active' },
  { id: 's2', title: '10-A Matematik Dersi Geri Bildirimi', targetClass: '10-A Matematik', responseCount: 22, status: 'active' },
  { id: 's3', title: 'Dönem Sonu Değerlendirmesi', targetClass: 'Tüm Sınıflar', responseCount: 0, status: 'closed' },
];

function TeacherSurveys() {
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // --- STATE'LER ---
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Yeni anket formu state'i
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newTargetClass, setNewTargetClass] = useState('Tüm Sınıflar'); // Veya bir sınıf ID'si

  const fetchSurveys = React.useCallback(() => {
    setLoading(true);
    // TODO: use axios.get('/api/surveys', axiosConfig)
    setTimeout(() => {
      setSurveys(dummySurveys);
      setLoading(false);
    }, 500);
  }, [token]);

  // --- EFFECT ---
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // --- EVENT HANDLERS ---
  const handleCreateSurvey = (e) => {
    e.preventDefault();
    if (!newSurveyTitle) return;

    const newSurvey = {
      id: `s${Math.floor(Math.random() * 100)}`,
      title: newSurveyTitle,
      targetClass: newTargetClass,
      responseCount: 0,
      status: 'active' // Yeni anketler aktif başlar
    };

    // TODO: Backend'e 'axios.post('/api/surveys', newSurvey)' ile gönder
    console.log('Yeni Anket Oluşturuldu:', newSurvey);

    setSurveys([newSurvey, ...surveys]);
    setIsModalOpen(false); // Modalı kapat
    
    // Formu temizle
    setNewSurveyTitle('');
    setNewTargetClass('Tüm Sınıflar');
  };

  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <h1>Anketler</h1>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus me-2"></i> Yeni Anket Oluştur
        </button>
      </div>

      {/* --- MEVCUT ANKET LİSTESİ --- */}
      {loading ? (
        <p>Anketler yükleniyor...</p>
      ) : (
        // TeacherExams.jsx'teki 'exams-grid' CSS sınıfını yeniden kullanıyoruz.
        <div className="exams-grid">
          {surveys.map((survey) => (
            // 'exam-card' CSS sınıfını yeniden kullanıyoruz.
            <div key={survey.id} className="page-card exam-card">
              
              <h3>{survey.title}</h3>
              
              {/* Anket Durumu ve Hedef Sınıf */}
              <div className="survey-meta">
                <span 
                  className={`survey-status ${survey.status === 'active' ? 'active' : 'closed'}`}
                >
                  {survey.status === 'active' ? 'Aktif' : 'Kapalı'}
                </span>
                <span className="survey-target">
                  <i className="fas fa-users"></i> {survey.targetClass}
                </span>
              </div>

              {/* 'exam-details' CSS sınıfını yeniden kullanıyoruz */}
              <div className="exam-details">
                <span><i className="fas fa-poll"></i> {survey.responseCount} Yanıt</span>
              </div>
              
              {/* 'exam-actions' CSS sınıfını yeniden kullanıyoruz */}
              <div className="exam-actions">
                <button className="btn-primary"><i className="fas fa-chart-bar me-2"></i>Sonuçları Gör</button>
                <button className="btn-secondary btn-sm"><i className="fas fa-edit"></i>Düzenle</button>
                <button className="btn-danger btn-sm"><i className="fas fa-trash"></i>Sil</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- YENİ ANKET OLUŞTURMA MODALI --- */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><i className="fas fa-plus me-2"></i>Yeni Anket Oluştur</h2>
            <form onSubmit={handleCreateSurvey}>
              
              <div className="form-group">
                <label htmlFor="surveyTitle">Anket Başlığı</label>
                <input 
                  type="text" 
                  id="surveyTitle"
                  value={newSurveyTitle}
                  onChange={(e) => setNewSurveyTitle(e.target.value)}
                  placeholder="Örn: Öğrenci Memnuniyet Anketi"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="targetClass">Hedef Sınıf</label>
                <select 
                  id="targetClass" 
                  value={newTargetClass} 
                  onChange={(e) => setNewTargetClass(e.target.value)}
                >
                  <option value="Tüm Sınıflar">Tüm Sınıflar</option>
                  <option value="10-A Matematik">10-A Matematik</option>
                  <option value="12. Sınıf React">12. Sınıf React</option>
                  <option value="9-C Fizik">9-C Fizik</option>
                  {/* TODO: Bu liste 'TeacherClasses'dan dinamik gelmeli */}
                </select>
              </div>
              
              {/* Soru ekleme kısmı (şimdilik basit tutuldu) */}
              <p style={{color: '#6c757d', fontSize: '0.9rem'}}>
                (Anket soruları bir sonraki adımda eklenecektir.)
              </p>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  <i className="fas fa-times me-2"></i>İptal
                </button>
                <button type="submit" className="btn-primary">
                  <i className="fas fa-check me-2"></i>Oluştur ve Devam Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherSurveys;