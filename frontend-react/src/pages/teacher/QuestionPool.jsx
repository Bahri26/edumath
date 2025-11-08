// frontend-react/src/pages/teacher/QuestionPool.jsx (MARKDOWN DESTEĞİ EKLENDİ)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css'; // KaTeX CSS

import '../../assets/styles/TeacherPages.css';
import { curriculumData } from '../../data/curriculumData'; 
import PageHeader from '../../components/common/PageHeader'; 
import SimulationPlayer from '../../components/SimulationPlayer';

// --- Modal Bileşeni (Yataylık için CSS Güncellendi) ---
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* Yatay görünüm için genişlik ayarı */}
  <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '950px', width: '90%' }}>
        <button className="modal-close text-white text-3xl font-bold absolute top-2 right-4 z-50" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
};
// --- Modal Bileşeni Sonu ---


// API URL
const API_URL = 'http://localhost:8000/api/questions';

const defaultFormState = {
  text: '**Soru:** \n\n$x^2+5=30$ ise $x$ kaçtır?',
  options: ['', '', '', ''], 
  correctAnswer: '', 
  solutionText: '**Çözüm:** \n\n1. Adım: $x^2 = 30-5$ \n2. Adım: $x^2=25$ \n3. Adım: $x=5$ veya $x=-5$'
};

const difficultyLevels = ['Kolay', 'Orta', 'Zor'];
const classLevels = curriculumData.siniflar || ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"];


function QuestionPool() {
  // read token inside component to reflect login changes
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
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

  // --- Pagination State'leri ---
  const [currentPage, setCurrentPage] = useState(1); // Mevcut sayfa (1'den başlar)
  const questionsPerPage = 3; // Sayfa başına 3 soru

  // <<< SİMÜLASYON STATE'LERİ >>>
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  
  // --- useEffect (Veri Çekme) ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessage('');
    if (!token) { setError('Verileri görmek için giriş yapmalısınız.'); setLoading(false); return; }

    const params = {};
    if (filterSinif) params.classLevel = filterSinif;
    if (filterZorluk) params.difficulty = filterZorluk;

    try {
      const response = await axios.get(API_URL, { ...axiosConfig, params: params });
      setQuestions(response.data);
    } catch (err) {
      console.error('Sorular yüklenirken hata:', err);
      // Hata durumunda test verisi gösterimi
      if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
           setError('API bağlantısı kurulamadı. Test verileri kullanılıyor.');
           setQuestions([
            { _id: '1', subject: 'Matematik', classLevel: '9. Sınıf', topic: 'Mantık', learningOutcome: 'Önermeyi açıklar.', questionType: 'test', difficulty: 'Kolay', text: '`p: 2 tek sayıdır.` Önermesinin doğruluk değeri nedir?', options: ['Doğru', 'Yanlış', 'Bilinmez', 'Belirsiz'], correctAnswer: 'Yanlış', solutionText: '2 çift sayıdır, bu nedenle p önermesi yanlıştır. Doğruluk değeri 0 (Yanlış) olur. Bu bir simülasyon cevabıdır.' },
            { _id: '2', subject: 'Matematik', classLevel: '10. Sınıf', topic: 'Örüntüler', learningOutcome: 'Ardışık sayılar kuralını bulur.', questionType: 'bosluk-doldurma', difficulty: 'Orta', text: '3, 7, 11, ___, 19 örüntüsünde boşluğa ne gelmelidir?', correctAnswer: '15', solutionText: 'Örüntünün kuralı `+4`\'tür. $11+4=15$ olur.' },
          ]);
      } else {
          setError('Sorular yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterSinif, filterZorluk, token]);

  useEffect(() => {
    if (activeTab === 'list') {
      // API Çağrısı Aktif Hale Getirildi
      fetchQuestions();
    }
  }, [activeTab, fetchQuestions, currentPage]); 
  
  // --- Pagination Hesaplamaları ---
  const filteredQuestions = questions.filter(q => 
    (!filterSinif || q.classLevel === filterSinif) && 
    (!filterZorluk || q.difficulty === filterZorluk)
  );
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  // --- Pagination Hesaplamaları Sonu ---

  // SİMÜLASYON FONKSİYONLARI
  const handleShowSolution = (question) => {
    const allQuestionData = {
      subject: question.subject,
      classLevel: question.classLevel,
      topic: question.topic,
      learningOutcome: question.learningOutcome,
      questionType: question.questionType,
      text: question.text,
      solutionText: question.solutionText || `Bu sorunun kayıtta çözümü girilmemiş. Soru metni: ${question.text}. Adım adım ilerleyelim: `, 
      correctAnswer: question.correctAnswer,
    };
    setSimulationData(allQuestionData);
    setIsSimulationOpen(true); 
  };

  const handleStartSimulation = (e) => {
    e.preventDefault();
    if (!step2Data.text) { setError('Lütfen önce soru metnini girin.'); return; }

    const allQuestionData = {
      subject: selectedDers,
      classLevel: selectedSinif,
      topic: selectedKonu,
      learningOutcome: selectedKazanım,
      questionType: selectedSoruTipi,
      text: step2Data.text,
      solutionText: step2Data.solutionText || `Bu sorunun çözüm adımları girilmemiştir. Soru metni: ${step2Data.text}. Adım adım ilerleyelim: `, 
      correctAnswer: step2Data.correctAnswer,
    };
    
    setSimulationData(allQuestionData);
    setIsSimulationOpen(true); 
  };
  
  // --- Diğer Helper Fonksiyonlar ---
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1); 
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
    setEditingId(null); setError(null); setMessage(''); setStep(1);
    setSelectedDers(curriculumData.dersler[0]); setSelectedSinif(''); setSelectedKonu(curriculumData.konular[0]); 
    setSelectedKazanım(''); setSelectedSoruTipi('test'); setSelectedDifficulty('Orta'); 
    setStep2Data(defaultFormState); setActiveTab(switchToTab); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    if (!token) { setError('Giriş yapmalısınız.'); return; }

    let questionData = {
      subject: selectedDers,
      classLevel: selectedSinif,
      topic: selectedKonu,
      learningOutcome: selectedKazanım,
      questionType: selectedSoruTipi,
      difficulty: selectedDifficulty, 
      text: step2Data.text,
      options: step2Data.options,
      correctAnswer: step2Data.correctAnswer,
      solutionText: step2Data.solutionText
    };

    try {
      let response; 
      if (editingId) {
        response = await axios.put(`${API_URL}/${editingId}`, questionData, axiosConfig); 
        setQuestions(questions.map(q => q._id === editingId ? response.data : q));
        setMessage('Soru başarıyla güncellendi!');
      } else {
        response = await axios.post(API_URL, questionData, axiosConfig); 
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
    if (!token) { setError('Silmek için giriş yapmalısınız.'); return; }
    try {
      await axios.delete(`${API_URL}/${id}`, axiosConfig);
      setMessage('Soru başarıyla silindi.');
      setQuestions(questions.filter(q => q._id !== id));
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

  // --- MARKDOWN DEĞİŞİKLİK YAKALAYICI ---
  const handleEditorChange = (value, name) => {
    setStep2Data(prev => ({ ...prev, [name]: value }));
  };

  const handleStep2Change = (e) => {
    setStep2Data({ ...step2Data, [e.target.name]: e.target.value });
  };
  const handleOptionChange = (index, value) => {
    const newOptions = [...step2Data.options];
    newOptions[index] = value;
    setStep2Data({ ...step2Data, options: newOptions });
  };


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
  // --- JSX (ANA RENDER) KISMI) ---
  // ==================================================================
  return (
    <div className="teacher-page-container"> 
    
      <PageHeader title="Soru Havuzu" className="w-900">
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
                  
                  <div className="form-group"><label htmlFor="dersSelect">Ders</label>
                    <select id="dersSelect" value={selectedDers} onChange={(e) => setSelectedDers(e.target.value)}>
                      {curriculumData.dersler.map(ders => (<option key={ders} value={ders}>{ders}</option>))}
                    </select>
                  </div>
                  
                  <div className="form-group"><label htmlFor="sinifSelect">Sınıf Seçin</label>
                    <select id="sinifSelect" value={selectedSinif} onChange={(e) => setSelectedSinif(e.target.value)} required>
                      <option value="">Sınıf seçiniz...</option>
                      {classLevels.map(sinif => (<option key={sinif} value={sinif}>{sinif}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label htmlFor="konuSelect">Konu / Ünite</label>
                    <select id="konuSelect" value={selectedKonu} onChange={(e) => setSelectedKonu(e.target.value)}>
                      {curriculumData.konular.map(konu => (<option key={konu} value={konu}>{konu}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label htmlFor="kazanimInput">Kazanım (MEB Kodu veya Açıklaması)</label>
                    <textarea id="kazanimInput" rows="3" value={selectedKazanım} onChange={(e) => setSelectedKazanım(e.target.value)} placeholder="İlgili kazanımı yazın (örn: M.10.1.1.2. n elemanlı bir kümenin...)" required />
                  </div>
                  
                  <div className="form-group"><label htmlFor="soruTipiSelect">Soru Tipi Seçin</label>
                    <select id="soruTipiSelect" value={selectedSoruTipi} onChange={(e) => setSelectedSoruTipi(e.target.value)} required>
                      {curriculumData.soruTipleri.map(tip => (<option key={tip.value} value={tip.value} disabled={tip.value === 'eslestirme'}>{tip.label}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label htmlFor="difficultySelect">Zorluk Seviyesi</label>
                    <select id="difficultySelect" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} required>
                      {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
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
                
                <div className="form-group" data-color-mode="dark">
                  <label htmlFor="questionText">Soru Metni (Markdown ve LaTeX destekler)</label>
                  <MDEditor
                    value={step2Data.text}
                    onChange={(value) => handleEditorChange(value, 'text')}
                    previewOptions={{
                      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
                      remarkPlugins: [remarkMath],
                    }}
                  />
                </div>

                {renderAnswerFields()}

                <div className="form-group" data-color-mode="dark">
                  <label htmlFor="solutionText">Soru Çözümü (Opsiyonel, Markdown ve LaTeX destekler)</label>
                   <MDEditor
                    value={step2Data.solutionText}
                    onChange={(value) => handleEditorChange(value, 'solutionText')}
                    previewOptions={{
                      rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
                      remarkPlugins: [remarkMath],
                    }}
                  />
                </div>

                <hr className="form-divider" />
                <div className="form-group text-center">
                  {/* SİMÜLASYON BUTONU */}
                  <button type="button" className="btn-secondary" onClick={handleStartSimulation} disabled={!step2Data.text}>
                    <i className="fas fa-video me-2"></i> Soruyu Anlat (Simülasyon Başlat)
                  </button>
                </div>
                <hr className="form-divider" />


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
          <h2>Mevcut Sorular ({totalQuestions})</h2>
          
          <div className="filter-bar">
            <div className="form-group">
              <label htmlFor="filterSinif">Sınıfa Göre Filtrele</label>
              <select id="filterSinif" value={filterSinif} onChange={(e) => handleFilterChange(setFilterSinif, e.target.value)}>
                <option value="">Tüm Sınıflar</option>
                {classLevels.map(level => (<option key={level} value={level}>{level}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="filterZorluk">Zorluğa Göre Filtrele</label>
              <select id="filterZorluk" value={filterZorluk} onChange={(e) => handleFilterChange(setFilterZorluk, e.target.value)}>
                <option value="">Tüm Zorluklar</option>
                {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
              </select>
            </div>
          </div>

          {loading && <p>Sorular yükleniyor...</p>}
          {message && <div className="alert alert-success mb-4">{message}</div>}
          {!loading && error && <p className="error">{error}</p>}
          
          {!loading && !error && (
            <ul className="question-list">
              {totalQuestions === 0 ? (
                <p>Bu filtrelere uygun soru bulunamadı.</p>
              ) : (
                currentQuestions.map((q) => (
                  <li key={q._id} className="question-item">
                    
                    <div className="question-header-tags">
                      <span className="question-subject-badge">{q.subject} - {q.classLevel}</span>
                      <span className={`question-difficulty-badge difficulty-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
                    </div>

                    <div className="question-text" data-color-mode="dark">
                       <MDEditor.Markdown 
                          source={q.text} 
                          rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
                          remarkPlugins={[remarkMath]}
                       />
                    </div>
                    
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

                    <div className="question-actions flex justify-end gap-2">
                      
                      {/* ÇÖZÜMÜ GÖSTER BUTONU */}
                      {(q.solutionText || q.text) && (
                        <button className="btn-primary btn-sm" onClick={() => handleShowSolution(q)}>
                          <i className="fas fa-video me-2"></i> Çözümü Göster (Sim.)
                        </button>
                      )}
                      
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
          
          {/* Sayfalama Kontrolleri */}
          {totalPages > 1 && (
            <div className="pagination-container">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`page-button ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {/* SİMÜLASYON MODALI */}
    <Modal isOpen={isSimulationOpen} onClose={() => setIsSimulationOpen(false)}>
    {simulationData && <SimulationPlayer questionData={simulationData} />}
    </Modal>
    </div> 
  );
}

export default QuestionPool;