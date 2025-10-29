// frontend-react/src/pages/teacher/QuestionPool.jsx (2 ADIMLI, BAŞLIKLI - SON HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/TeacherPages.css';
import { curriculumData } from '../../data/curriculumData'; // Veri dosyamız
import PageHeader from '../../components/common/PageHeader'; // Yeni başlık bileşeni

const API_URL = 'http://localhost:8000/api/questions';

function QuestionPool() {
  // --- STATE'LER (Backend'den gelen veri) ---
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Form Adım State'i ---
  const [step, setStep] = useState(1); // 1: Detaylar, 2: Soru Hazırlama

  // --- Adım 1: Soru Detayları State'leri ---
  const [selectedDers, setSelectedDers] = useState(curriculumData.dersler[0]);
  const [selectedSinif, setSelectedSinif] = useState('');
  const [selectedKonu, setSelectedKonu] = useState(curriculumData.konular[0]);
  const [selectedKazanım, setSelectedKazanım] = useState('');
  const [selectedSoruTipi, setSelectedSoruTipi] = useState('test');

  // --- Adım 2: Soru İçeriği State'leri ---
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswerTest, setCorrectAnswerTest] = useState('A');
  const [correctAnswerDY, setCorrectAnswerDY] = useState('Doğru');
  const [correctAnswerBosluk, setCorrectAnswerBosluk] = useState('');
  

  // --- Veri Çekme (useEffect) ---
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(API_URL);
        setQuestions(response.data);
      } catch (err) {
        console.error('Sorular yüklenirken hata:', err);
        setError('Sorular yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  // --- ADIM İLERLETME ---
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedDers || !selectedSinif || !selectedKonu || !selectedKazanım || !selectedSoruTipi) {
      setError('Lütfen 1. Adımdaki tüm alanları doldurun.');
      return;
    }
    setError(null);
    setStep(2);
  };
  
  // --- FORM GÖNDERME (SON ADIM) ---
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setError(null);

    if (!questionText) {
      setError('Soru metni boş bırakılamaz.');
      return;
    }
    
    let questionData = {
      subject: selectedDers,
      classLevel: selectedSinif,
      topic: selectedKonu,
      learningOutcome: selectedKazanım,
      questionType: selectedSoruTipi,
      text: questionText,
    };

    if (selectedSoruTipi === 'test') {
      if (!optionA || !optionB || !optionC || !optionD) {
        setError('Lütfen 4 seçeneği de doldurun.'); return;
      }
      questionData = { ...questionData, optionA, optionB, optionC, optionD, correctAnswerTest };
    } else if (selectedSoruTipi === 'dogru-yanlis') {
      questionData = { ...questionData, correctAnswerDY };
    } else if (selectedSoruTipi === 'bosluk-doldurma') {
      if (!correctAnswerBosluk) {
        setError('Lütfen boşluğa gelecek doğru cevabı girin.'); return;
      }
      questionData = { ...questionData, correctAnswerBosluk };
    }

    try {
      const response = await axios.post(API_URL, questionData);
      setQuestions([response.data, ...questions]);
      
      // Formu temizle ve 1. Adıma dön
      setQuestionText(''); setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
      setSelectedKazanım(''); setStep(1);

    } catch (err) {
      console.error('Soru oluşturma hatası:', err);
      setError(err.response?.data?.message || 'Soru oluşturulamadı.');
    }
  };
  
  // --- CEVAP ALANINI RENDER EDEN FONKSİYON ---
  const renderAnswerFields = () => {
    switch (selectedSoruTipi) {
      case 'test':
        return (
          <>
            <div className="options-grid">
              <div className="form-group"><label htmlFor="optionA">Seçenek A</label>
                <input type="text" id="optionA" value={optionA} onChange={(e) => setOptionA(e.target.value)} required /></div>
              <div className="form-group"><label htmlFor="optionB">Seçenek B</label>
                <input type="text" id="optionB" value={optionB} onChange={(e) => setOptionB(e.target.value)} required /></div>
              <div className="form-group"><label htmlFor="optionC">Seçenek C</label>
                <input type="text" id="optionC" value={optionC} onChange={(e) => setOptionC(e.target.value)} required /></div>
              <div className="form-group"><label htmlFor="optionD">Seçenek D</label>
                <input type="text" id="optionD" value={optionD} onChange={(e) => setOptionD(e.target.value)} required /></div>
            </div>
            <div className="form-group">
              <label htmlFor="correctAnswerTest">Doğru Cevap (Test)</label>
              <select id="correctAnswerTest" value={correctAnswerTest} onChange={(e) => setCorrectAnswerTest(e.target.value)}>
                <option value="A">Seçenek A</option>
                <option value="B">Seçenek B</option>
                <option value="C">Seçenek C</option>
                <option value="D">Seçenek D</option>
              </select>
            </div>
          </>
        );
      case 'dogru-yanlis':
        return (
          <div className="form-group">
            <label htmlFor="correctAnswerDY">Doğru Cevap (D/Y)</label>
            <select id="correctAnswerDY" value={correctAnswerDY} onChange={(e) => setCorrectAnswerDY(e.target.value)}>
              <option value="Doğru">Doğru</option>
              <option value="Yanlış">Yanlış</option>
            </select>
          </div>
        );
      case 'bosluk-doldurma':
        return (
          <div className="form-group">
            <label htmlFor="correctAnswerBosluk">Doğru Cevap (Boşluk)</label>
            <input type="text" id="correctAnswerBosluk" value={correctAnswerBosluk}
              onChange={(e) => setCorrectAnswerBosluk(e.target.value)} 
              placeholder="Boşluğa gelecek kelimeyi yazın..." required />
            <small>Not: Soru metnine boşluk için ___ (3 alt çizgi) koyunuz.</small>
          </div>
        );
      case 'eslestirme':
        return (
          <div className="alert alert-info">
            Eşleştirme tipi soru hazırlama modülü yakında eklenecektir.
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <>
      <PageHeader title="Soru Havuzu" />

      <div className="teacher-page-container" style={{paddingTop: 0}}>
        
        <div className="page-card form-card">
          <h2>Yeni Soru Ekle</h2>
          
          <div className="stepper">
            <div className={`step-item ${step === 1 ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <div className="step-label">Soru Detayları</div>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step === 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Soru Hazırlama</div>
            </div>
          </div>
          
          <form onSubmit={handleCreateQuestion}>
            
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {step === 1 && (
              <fieldset>
                <legend>1. Adım: Soru Detayları</legend>
                
                <div className="form-grid-single-column">
                  
                  <div className="form-group">
                    <label htmlFor="dersSelect">Ders</label>
                    <select id="dersSelect" value={selectedDers} onChange={(e) => setSelectedDers(e.target.value)}>
                      {curriculumData.dersler.map(ders => (
                        <option key={ders} value={ders}>{ders}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="sinifSelect">Sınıf Seçin</label>
                    <select id="sinifSelect" value={selectedSinif} onChange={(e) => setSelectedSinif(e.target.value)} required>
                      <option value="">Sınıf seçiniz...</option>
                      {curriculumData.siniflar.map(sinif => (
                        <option key={sinif} value={sinif}>{sinif}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="konuSelect">Konu / Ünite</label>
                    <select id="konuSelect" value={selectedKonu} onChange={(e) => setSelectedKonu(e.target.value)}>
                      {curriculumData.konular.map(konu => (
                        <option key={konu} value={konu}>{konu}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="kazanimInput">Kazanım (MEB Kodu veya Açıklaması)</label>
                    <textarea id="kazanimInput" rows="3" value={selectedKazanım} 
                      onChange={(e) => setSelectedKazanım(e.target.value)}
                      placeholder="İlgili kazanımı yazın (örn: M.10.1.1.2. n elemanlı bir kümenin...)" required />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="soruTipiSelect">Soru Tipi Seçin</label>
                    <select id="soruTipiSelect" value={selectedSoruTipi} onChange={(e) => setSelectedSoruTipi(e.target.value)} required>
                      {curriculumData.soruTipleri.map(tip => (
                        <option key={tip.value} value={tip.value} disabled={tip.value === 'eslestirme'}>
                          {tip.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="step-navigation-buttons" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-primary" onClick={handleNextStep}>
                    İleri <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend>2. Adım: Soru Hazırlama ({selectedSoruTipi})</legend>
                
                <div className="form-group">
                  <label htmlFor="questionText">Soru Metni</label>
                  <textarea id="questionText" rows="5" value={questionText} 
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Soru metnini buraya yazın..." required />
                </div>

                {renderAnswerFields()}

                <div className="step-navigation-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                    <i className="fas fa-arrow-left me-2"></i> Geri
                  </button>
                  <button type="submit" className="btn-primary" disabled={selectedSoruTipi === 'eslestirme'}>
                    <i className="fas fa-save me-2"></i> Soruyu Kaydet
                  </button>
                </div>
              </fieldset>
            )}
          </form>
        </div>
        
        <div className="page-card list-card">
          <h2>Mevcut Sorular ({questions.length})</h2>
          {loading ? (
            <p>Sorular yükleniyor...</p>
          ) : (
            <ul className="question-list">
              {questions.map((q) => (
                <li key={q._id} className="question-item">
                  <span className="question-subject-badge">{q.subject} - {q.classLevel}</span>
                  <p className="question-text">{q.text}</p>
                  <ul className="question-options">
                    {q.options.map((opt, index) => (
                      <li key={index} className={opt === q.correctAnswer ? 'correct' : ''}>
                        {opt}
                      </li>
                    ))}
                  </ul>
                  <div className="question-actions">
                    <button className="btn-secondary btn-sm"><i className="fas fa-edit me-2"></i> Düzenle</button>
                    <button className="btn-danger btn-sm"><i className="fas fa-trash me-2"></i> Sil</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

export default QuestionPool;