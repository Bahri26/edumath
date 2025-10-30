// frontend-react/src/pages/teacher/QuestionPool.jsx (BASİT TEXTAREA ÇÖZÜMLÜ SON HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../assets/styles/TeacherPages.css';
import { curriculumData } from '../../data/curriculumData'; 
import PageHeader from '../../components/common/PageHeader'; 

// --- SİLİNDİ: MDEditor, rehypeKatex, remarkMath ve KaTeX CSS importları kaldırıldı ---


// API URL'nizi ve Token alma yönteminizi buraya girin
const API_URL = 'http://localhost:8000/api/questions';
const token = localStorage.getItem('token'); 

const axiosConfig = {
  headers: {
    Authorization: `Bearer ${token}`
  }
};

const defaultFormState = {
  text: '',
  options: ['', '', '', ''], 
  correctAnswer: '', 
  solutionText: '' // Soru çözümü alanı (Artık DÜZ METİN olarak saklanacak)
};

const difficultyLevels = ['Kolay', 'Orta', 'Zor'];
const classLevels = curriculumData.siniflar || ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"];


function QuestionPool() {
  // --- STATE'LER ---
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(''); 
  const [step, setStep] = useState(1); 
  const [editingId, setEditingId] = useState(null); 
  const [activeTab, setActiveTab] = useState('list'); 

  // --- Adım 1 State'leri ---
  const [selectedDers, setSelectedDers] = useState(curriculumData.dersler[0]);
  const [selectedSinif, setSelectedSinif] = useState('');
  const [selectedKonu, setSelectedKonu] = useState(curriculumData.konular[0]);
  const [selectedKazanım, setSelectedKazanım] = useState('');
  const [selectedSoruTipi, setSelectedSoruTipi] = useState('test');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Orta'); 

  // --- Adım 2 State'leri ---
  const [step2Data, setStep2Data] = useState(defaultFormState);

  // --- Filtre State'leri ---
  const [filterSinif, setFilterSinif] = useState(''); 
  const [filterZorluk, setFilterZorluk] = useState(''); 
  
  
  useEffect(() => {
    if (activeTab === 'list') {
      fetchQuestions();
    }
  }, [activeTab, filterSinif, filterZorluk]); 


  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    setMessage(''); 
    if (!token) {
      setError('Verileri görmek için giriş yapmalısınız.');
      setLoading(false);
      return;
    }

    const params = {};
    if (filterSinif) params.classLevel = filterSinif;
    if (filterZorluk) params.difficulty = filterZorluk;

    try {
      const response = await axios.get(API_URL, {
        ...axiosConfig,
        params: params 
      });
      setQuestions(response.data);
    } catch (err) {
      console.error('Sorular yüklenirken hata:', err);
      setError('Sorular yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedDers || !selectedSinif || !selectedKonu || !selectedKazanım || !selectedSoruTipi || !selectedDifficulty) {
      setError('Lütfen 1. Adımdaki tüm alanları doldurun.');
      return;
    }
    setError(null);
    setStep(2);
  };
  
  const resetForm = (switchToTab = 'list') => {
    setEditingId(null);
    setError(null);
    setMessage('');
    setStep(1);
    // Adım 1
    setSelectedDers(curriculumData.dersler[0]);
    setSelectedSinif('');
    setSelectedKonu(curriculumData.konular[0]);
    setSelectedKazanım('');
    setSelectedSoruTipi('test');
    setSelectedDifficulty('Orta'); 
    // Adım 2
    setStep2Data(defaultFormState);
    
    setActiveTab(switchToTab); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    if (!token) {
      setError('Bu işlemi yapmak için giriş yapmalısınız.');
      return;
    }

    let questionData = {
      subject: selectedDers,
      classLevel: selectedSinif,
      topic: selectedKonu,
      learningOutcome: selectedKazanım,
      questionType: selectedSoruTipi,
      difficulty: selectedDifficulty, 
      text: step2Data.text,
      options: [],
      correctAnswer: '',
      solutionText: step2Data.solutionText // Bu artık DÜZ METİN
    };

    // Soru tipine göre doldurma
    if (selectedSoruTipi === 'test') {
      if (step2Data.options.some(opt => opt === '')) { 
        setError('Lütfen 4 seçeneği de doldurun.'); return;
      }
      if (!step2Data.correctAnswer) {
        setError('Lütfen doğru cevabı seçin.'); return;
      }
      questionData.options = step2Data.options;
      questionData.correctAnswer = step2Data.correctAnswer;
    } 
    else if (selectedSoruTipi === 'dogru-yanlis') {
      questionData.options = ['Doğru', 'Yanlış']; 
      questionData.correctAnswer = step2Data.correctAnswer || 'Doğru'; 
    } 
    else if (selectedSoruTipi === 'bosluk-doldurma') {
      if (!step2Data.correctAnswer) {
        setError('Lütfen boşluğa gelecek doğru cevabı girin.'); return;
      }
      questionData.options = []; 
      questionData.correctAnswer = step2Data.correctAnswer;
    }

    try {
      if (editingId) {
        // GÜNCELLEME (PUT)
        const response = await axios.put(`${API_URL}/${editingId}`, questionData, axiosConfig);
        setQuestions(questions.map(q => q._id === editingId ? response.data : q));
        setMessage('Soru başarıyla güncellendi!');
      } else {
        // OLUŞTURMA (POST)
        const response = await axios.post(API_URL, questionData, axiosConfig);
        setQuestions([response.data, ...questions]); 
        setMessage('Soru başarıyla oluşturuldu!');
      }
      resetForm('list'); 

    } catch (err) {
      console.error('Form gönderme hatası:', err);
      setError(err.response?.data?.message || 'Soru kaydedilemedi.');
    }
  };
  
  
  const handleDelete = async (id) => {
    if (!window.confirm('Bu soruyu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }
    if (!token) {
      setError('Silmek için giriş yapmalısınız.');
      return;
    }
    try {
      await axios.delete(`${API_URL}/${id}`, axiosConfig);
      setQuestions(questions.filter(q => q._id !== id)); 
      setMessage('Soru başarıyla silindi.');
    } catch (err) {
      console.error('Silme hatası:', err);
      setError(err.response?.data?.message || 'Soru silinemedi.');
    }
  };
  
  
  const handleEdit = (question) => {
    setEditingId(question._id);
    setError(null);
    setMessage('');
    // Adım 1
    setSelectedDers(question.subject);
    setSelectedSinif(question.classLevel);
    setSelectedKonu(question.topic);
    setSelectedKazanım(question.learningOutcome);
    setSelectedSoruTipi(question.questionType);
    setSelectedDifficulty(question.difficulty); 
    // Adım 2
    setStep2Data({
      text: question.text,
      options: question.questionType === 'test' ? question.options : ['', '', '', ''],
      correctAnswer: question.correctAnswer,
      solutionText: question.solutionText || '' // Çözüm metnini yükle
    });
    setStep(1); 
    setActiveTab('create'); 
    window.scrollTo(0, 0); 
  };


  // --- FORM YÖNETİMİ: Adım 2 State Yönetimi ---
  const handleStep2Change = (e) => {
    setStep2Data({ ...step2Data, [e.target.name]: e.target.value });
  };
  const handleOptionChange = (index, value) => {
    const newOptions = [...step2Data.options];
    newOptions[index] = value;
    setStep2Data({ ...step2Data, options: newOptions });
  };

  // --- SİLİNDİ: handleSolutionChange fonksiyonu kaldırıldı ---


  const renderAnswerFields = () => {
    const { options, correctAnswer } = step2Data;
    switch (selectedSoruTipi) {
      case 'test':
        return (
          <>
            <div className="options-grid">
              {options.map((option, index) => (
                <div className="form-group" key={index}>
                  <label htmlFor={`option${index}`}>Seçenek {String.fromCharCode(65 + index)}</label>
                  <input 
                    type="text" 
                    id={`option${index}`} 
                    value={option} 
                    onChange={(e) => handleOptionChange(index, e.target.value)} 
                    required 
                  />
                </div>
              ))}
            </div>
            <div className="form-group">
              <label htmlFor="correctAnswerTest">Doğru Cevap (Test)</label>
              <select 
                id="correctAnswerTest" 
                name="correctAnswer" 
                value={correctAnswer} 
                onChange={handleStep2Change} 
                required
              >
                <option value="">Doğru cevabı seçin...</option>
                {options.filter(opt => opt).map((opt, index) => (
                  <option key={index} value={opt}>
                    Seçenek {String.fromCharCode(65 + index)} ({opt})
                  </option>
                ))}
              </select>
            </div>
          </>
        );
      case 'dogru-yanlis':
        return (
          <div className="form-group">
            <label htmlFor="correctAnswerDY">Doğru Cevap (D/Y)</label>
            <select 
              id="correctAnswerDY" 
              name="correctAnswer" 
              value={correctAnswer || 'Doğru'} 
              onChange={handleStep2Change} 
            >
              <option value="Doğru">Doğru</option>
              <option value="Yanlış">Yanlış</option>
            </select>
          </div>
        );
      case 'bosluk-doldurma':
        return (
          <div className="form-group">
            <label htmlFor="correctAnswerBosluk">Doğru Cevap (Boşluk)</label>
            <input 
              type="text" 
              id="correctAnswerBosluk" 
              name="correctAnswer" 
              value={correctAnswer} 
              onChange={handleStep2Change} 
              placeholder="Boşluğa gelecek kelimeyi yazın..." 
              required 
            />
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


  // ==================================================================
  // --- JSX (ANA RENDER) KISMI ---
  // ==================================================================
  return (
    <div className="teacher-page-container"> 
    
      <PageHeader title="Soru Havuzu">
        <div className="header-tab-group">
          <button 
            className={`header-tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => {
              if (editingId) resetForm('list');
              setActiveTab('list');
            }}
          >
            <i className="fas fa-list me-2"></i> Soru Listesi
          </button>
          <button 
            className={`header-tab-button ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              if (editingId) resetForm('create');
              setActiveTab('create');
            }}
          >
            <i className="fas fa-plus me-2"></i> Yeni Soru Oluştur
          </button>
        </div>
      </PageHeader>
      
      {/* YENİ SORU EKLEME / GÜNCELLEME FORMU */}
      {activeTab === 'create' && (
        <div className="page-card form-card"> 
          <h2>{editingId ? 'Soruyu Güncelle' : 'Yeni Soru Ekle'}</h2>
          
          <div className="stepper">
            <div className={`step-item ${step === 1 ? 'active' : (step > 1 ? 'completed' : '')}`}>
              <div className="step-number">1</div>
              <div className="step-label">Soru Detayları</div>
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step === 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Soru Hazırlama</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            
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
                      {classLevels.map(sinif => (
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

                  <div className="form-group">
                    <label htmlFor="difficultySelect">Zorluk Seviyesi</label>
                    <select id="difficultySelect" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} required>
                      {difficultyLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
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
                  <textarea 
                    id="questionText" 
                    name="text" 
                    rows="5" 
                    value={step2Data.text} 
                    onChange={handleStep2Change} 
                    placeholder="Soru metnini buraya yazın..." 
                    required 
                  />
                </div>

                {renderAnswerFields()}

                {/* --- GÜNCELLENDİ: Standart <textarea> --- */}
                <div className="form-group">
                  <label htmlFor="solutionText">Soru Çözümü (Opsiyonel)</label>
                  <textarea 
                    id="solutionText" 
                    name="solutionText" // State'e bağlanması için
                    rows="4" 
                    value={step2Data.solutionText} // State'den değer al
                    onChange={handleStep2Change} // Standart state güncelleyiciyi kullan
                    placeholder="Sorunun yazılı çözümünü buraya ekleyebilirsiniz..." 
                  />
                </div>
                {/* --- GÜNCELLEME SONU --- */}


                <div className="step-navigation-buttons">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                    <i className="fas fa-arrow-left me-2"></i> Geri
                  </button>
                  {editingId && (
                    <button type="button" className="btn-warning" onClick={() => resetForm('list')}>
                      <i className="fas fa-times me-2"></i> İptal
                    </button>
                  )}
                  <button type="submit" className="btn-primary" disabled={selectedSoruTipi === 'eslestirme'}>
                    <i className="fas fa-save me-2"></i> 
                    {editingId ? 'Soruyu Güncelle' : 'Soruyu Kaydet'}
                  </button>
                </div>
              </fieldset>
            )}
          </form>
        </div>
      )}
      
      {/* --- MEVCUT SORULAR LİSTESİ --- */}
      {activeTab === 'list' && (
        <div className="page-card list-card"> 
          <h2>Mevcut Sorular ({questions.length})</h2>
          
          <div className="filter-bar">
            <div className="form-group">
              <label htmlFor="filterSinif">Sınıfa Göre Filtrele</label>
              <select id="filterSinif" value={filterSinif} onChange={(e) => setFilterSinif(e.target.value)}>
                <option value="">Tüm Sınıflar</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filterZorluk">Zorluğa Göre Filtrele</label>
              <select id="filterZorluk" value={filterZorluk} onChange={(e) => setFilterZorluk(e.target.value)}>
                <option value="">Tüm Zorluklar</option>
                {difficultyLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && <p>Sorular yükleniyor...</p>}
          {message && <div className="alert alert-success mb-4">{message}</div>}
          {!loading && error && <p className="error">{error}</p>}
          
          {!loading && !error && (
            <ul className="question-list">
              {questions.length === 0 ? (
                <p>Bu filtrelere uygun soru bulunamadı.</p>
              ) : (
                questions.map((q) => (
                  <li key={q._id} className="question-item">
                    
                    <div className="question-header-tags">
                      <span className="question-subject-badge">{q.subject} - {q.classLevel}</span>
                      <span className={`question-difficulty-badge difficulty-${q.difficulty?.toLowerCase()}`}>
                        {q.difficulty}
                      </span>
                    </div>

                    <p className="question-text">{q.text}</p>
                    
                    {q.questionType === 'test' && (
                      <ul className="question-options">
                        {q.options.map((opt, index) => (
                          <li key={index} className={opt === q.correctAnswer ? 'correct' : ''}>
                            {String.fromCharCode(65 + index)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(q.questionType === 'dogru-yanlis' || q.questionType === 'bosluk-doldurma') && (
                      <p><strong>Doğru Cevap:</strong> <span className="correct">{q.correctAnswer}</span></p>
                    )}

                    {/* --- GÜNCELLENDİ: Soru Çözümü (Düz Metin Olarak Render) --- */}
                    {q.solutionText && (
                      <div className="question-solution">
                        <strong>Çözüm:</strong>
                        {/* <pre> tag'i, textarea'ya girilen satır sonlarını (Enter) korur.
                          Stilini satır içinde (inline) vererek CSS dosyasıyla uğraşmanızı engelliyoruz.
                        */}
                        <pre 
                          className="solution-text-render"
                          style={{ 
                            whiteSpace: 'pre-wrap', // Satırları koru ve taştığında aşağı kaydır
                            wordBreak: 'break-word', // Uzun kelimeleri kır
                            margin: 0, 
                            paddingTop: '0.5rem',
                            fontFamily: 'inherit', // Ana metin fontunu kullan
                            fontSize: '0.95rem',
                            color: '#495057'
                          }}
                        >
                          {q.solutionText}
                        </pre>
                      </div>
                    )}
                    {/* --- GÜNCELLEME SONU --- */}

                    <div className="question-actions">
                      <button className="btn-secondary btn-sm" onClick={() => handleEdit(q)}>
                        <i className="fas fa-edit me-2"></i> Düzenle
                      </button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(q._id)}>
                        <i className="fas fa-trash me-2"></i> Sil
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div> 
  );
}

export default QuestionPool;