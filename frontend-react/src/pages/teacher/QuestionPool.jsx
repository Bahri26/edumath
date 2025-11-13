import React, { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import { curriculumData } from '../../data/curriculumData'; 
import PageHeader from '../../components/ui/common/PageHeader'; 
import QuestionSolver from '../../components/interactive/QuestionSolver';
import './QuestionPool.css';

// --- Modal Bileşeni (Yataylık için CSS Güncellendi) ---
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem', zIndex: 1000
      }}
    >
      {/* Yatay görünüm için genişlik ayarı */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '950px', width: '90%', background: '#fff', borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)', position: 'relative', padding: '1rem'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Kapat"
          style={{
            position: 'absolute', top: 8, right: 12, border: 0, background: 'transparent',
            fontSize: 28, lineHeight: 1, cursor: 'pointer', color: '#333'
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};
// --- Modal Bileşeni Sonu ---


// Service base via shared api instance
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '../../services/questionService';

const defaultFormState = {
  text: '**Soru:** \n\n$x^2+5=30$ ise $x$ kaçtır?',
  options: ['', '', '', ''], 
  correctAnswer: '', 
  solutionText: '**Çözüm:** \n\n1. Adım: $x^2 = 30-5$ \n2. Adım: $x^2=25$ \n3. Adım: $x=5$ veya $x=-5$'
};

const difficultyLevels = ['Kolay', 'Orta', 'Zor'];
const classLevels = curriculumData.siniflar || ["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"];


function QuestionPool() {
  const token = localStorage.getItem('token');
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
    setLoading(true); setError(null); setMessage('');
    if (!token) { setError('Verileri görmek için giriş yapmalısınız.'); setLoading(false); return; }
    const params = {};
    if (filterSinif) params.classLevel = filterSinif;
    if (filterZorluk) params.difficulty = filterZorluk;
    try {
      const data = await getQuestions(params);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Sorular yüklenirken hata:', err);
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
      if (editingId) {
        const updated = await updateQuestion(editingId, questionData);
        setQuestions(questions.map(q => q._id === editingId ? updated : q));
        setMessage('Soru başarıyla güncellendi!');
      } else {
        const created = await createQuestion(questionData);
        setQuestions([created, ...questions]);
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
      await deleteQuestion(id);
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
  <div className="container pt-2">

      <div className="kids-card mb-2 flex justify-between items-center" style={{ gap:'1rem', flexWrap:'wrap' }}>
        <div className="flex flex-column" style={{ gap:4 }}>
          <h2 className="m-0">Soru Havuzu</h2>
          <p className="muted m-0" style={{ fontSize:'.85rem' }}>Soruları oluştur, filtrele, düzenle.</p>
        </div>
        <div className="flex" style={{ gap:8 }}>
          <button
            className={`kids-btn ${activeTab === 'list' ? 'primary' : 'secondary'} sm`}
            onClick={() => { if (editingId) resetForm('list'); setActiveTab('list'); }}
          >
            📋 Liste
          </button>
          <button
            className={`kids-btn ${activeTab === 'create' ? 'primary' : 'secondary'} sm`}
            onClick={() => { if (editingId) resetForm('create'); setActiveTab('create'); }}
          >
            ➕ Yeni Soru
          </button>
        </div>
      </div>
      
      {/* YENİ SORU EKLEME / GÜNCELLEME FORMU */}
      {activeTab === 'create' && (
        <div className="kids-card"> 
          <h2 className="m-0 mb-1">{editingId ? 'Soruyu Güncelle' : 'Yeni Soru Ekle'}</h2>
          
          {/* Basit stepper */}
          <div className="flex items-center" style={{ gap:8, marginBottom:12 }}>
            <span className={`kids-badge ${step >= 1 ? 'success' : 'warning'}`}>1. Detaylar</span>
            <span style={{ opacity:.6 }}>→</span>
            <span className={`kids-badge ${step >= 2 ? 'success' : 'warning'}`}>2. Hazırlama</span>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {error && <div className="alert alert-danger mb-4">{error}</div>}

            {step === 1 && (
              <fieldset>
                <legend>1. Adım: Soru Detayları</legend>
                <div className="d-flex flex-column gap-3">
                  
                  <div className="form-group"><label className="form-label" htmlFor="dersSelect">Ders</label>
                    <select className="kids-select" id="dersSelect" value={selectedDers} onChange={(e) => setSelectedDers(e.target.value)}>
                      {curriculumData.dersler.map(ders => (<option key={ders} value={ders}>{ders}</option>))}
                    </select>
                  </div>
                  
                  <div className="form-group"><label className="form-label" htmlFor="sinifSelect">Sınıf Seçin</label>
                    <select className="kids-select" id="sinifSelect" value={selectedSinif} onChange={(e) => setSelectedSinif(e.target.value)} required>
                      <option value="">Sınıf seçiniz...</option>
                      {classLevels.map(sinif => (<option key={sinif} value={sinif}>{sinif}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label className="form-label" htmlFor="konuSelect">Konu / Ünite</label>
                    <select className="kids-select" id="konuSelect" value={selectedKonu} onChange={(e) => setSelectedKonu(e.target.value)}>
                      {curriculumData.konular.map(konu => (<option key={konu} value={konu}>{konu}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label className="form-label" htmlFor="kazanimInput">Kazanım (MEB Kodu veya Açıklaması)</label>
                    <textarea className="kids-input" id="kazanimInput" rows="3" value={selectedKazanım} onChange={(e) => setSelectedKazanım(e.target.value)} placeholder="İlgili kazanımı yazın (örn: M.10.1.1.2. n elemanlı bir kümenin...)" required />
                  </div>
                  
                  <div className="form-group"><label className="form-label" htmlFor="soruTipiSelect">Soru Tipi Seçin</label>
                    <select className="kids-select" id="soruTipiSelect" value={selectedSoruTipi} onChange={(e) => setSelectedSoruTipi(e.target.value)} required>
                      {curriculumData.soruTipleri.map(tip => (<option key={tip.value} value={tip.value} disabled={tip.value === 'eslestirme'}>{tip.label}</option>))}
                    </select>
                  </div>

                  <div className="form-group"><label className="form-label" htmlFor="difficultySelect">Zorluk Seviyesi</label>
                    <select className="kids-select" id="difficultySelect" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} required>
                      {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end" style={{ gap:8 }}>
                  <button type="button" className="kids-btn primary" onClick={handleNextStep}>
                    İleri →
                  </button>
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset>
                <legend>2. Adım: Soru Hazırlama ({selectedSoruTipi})</legend>
                
                <div className="form-group" data-color-mode="dark">
                  <label className="form-label" htmlFor="questionText">Soru Metni (Markdown ve LaTeX destekler)</label>
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
                  <label className="form-label" htmlFor="solutionText">Soru Çözümü (Opsiyonel, Markdown ve LaTeX destekler)</label>
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
                  <button type="button" className="kids-btn secondary" onClick={handleStartSimulation} disabled={!step2Data.text}>
                    <i className="fas fa-video me-2"></i> Soruyu Anlat (Simülasyon Başlat)
                  </button>
                </div>
                <hr className="form-divider" />


                <div className="flex" style={{ gap:8, justifyContent:'flex-end' }}>
                  <button type="button" className="kids-btn secondary" onClick={() => setStep(1)}>
                    ← Geri
                  </button>
                  {editingId && (
                    <button type="button" className="kids-btn warning" onClick={() => resetForm('list')}>
                      İptal
                    </button>
                  )}
                  <button type="submit" className="kids-btn primary" disabled={selectedSoruTipi === 'eslestirme'}>
                    {editingId ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </fieldset>
            )}
          </form>
        </div>
      )}
      
      {/* --- MEVCUT SORULAR LİSTESİ --- */}
      {activeTab === 'list' && (
        <div className="kids-card"> 
          <h2 className="m-0 mb-1">Mevcut Sorular ({totalQuestions})</h2>
          
          <div className="d-flex gap-3 flex-wrap mb-3">
            <div className="form-group" style={{ minWidth: 220 }}>
              <label className="form-label" htmlFor="filterSinif">Sınıfa Göre Filtrele</label>
              <select className="kids-select" id="filterSinif" value={filterSinif} onChange={(e) => handleFilterChange(setFilterSinif, e.target.value)}>
                <option value="">Tüm Sınıflar</option>
                {classLevels.map(level => (<option key={level} value={level}>{level}</option>))}
              </select>
            </div>
            <div className="form-group" style={{ minWidth: 220 }}>
              <label className="form-label" htmlFor="filterZorluk">Zorluğa Göre Filtrele</label>
              <select className="kids-select" id="filterZorluk" value={filterZorluk} onChange={(e) => handleFilterChange(setFilterZorluk, e.target.value)}>
                <option value="">Tüm Zorluklar</option>
                {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
              </select>
            </div>
          </div>

          {loading && (
            <div className="d-flex flex-column gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="kids-card">
                  <div className="skeleton text mb-1" style={{ width:'50%' }}></div>
                  <div className="skeleton text mb-1" style={{ width:'70%' }}></div>
                  <div className="skeleton text" style={{ width:'40%' }}></div>
                </div>
              ))}
            </div>
          )}
          {message && <div className="alert alert-success mb-4">{message}</div>}
          {!loading && error && <div className="kids-error mb-2">{error}</div>}
          
          {!loading && !error && (
            <div className="d-flex flex-column gap-3">
              {totalQuestions === 0 ? (
                <p>Bu filtrelere uygun soru bulunamadı.</p>
              ) : (
                currentQuestions.map((q) => (
                  <div key={q._id} className="kids-card">
                    <div className="flex justify-between items-center mb-2" style={{ gap:8, flexWrap:'wrap' }}>
                      <span className="kids-badge turquoise">{q.subject} - {q.classLevel}</span>
                      <span className={`kids-badge ${q.difficulty === 'Zor' ? 'danger' : q.difficulty === 'Orta' ? 'warning' : 'success'}`}>{q.difficulty || '—'}</span>
                    </div>
                    <div data-color-mode="dark" className="mb-2">
                       <MDEditor.Markdown 
                          source={q.text} 
                          rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
                          remarkPlugins={[remarkMath]}
                       />
                    </div>
                    {q.questionType === 'test' && Array.isArray(q.options) && (
                      <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:6 }}>
                        {q.options.map((opt, index) => (
                          <li key={index} style={{ padding:'8px 10px', borderRadius:10, background: opt === q.correctAnswer ? 'rgba(107,207,127,.15)' : '#f9fafb' }}>
                            <strong>{String.fromCharCode(65 + index)}.</strong> {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(q.questionType === 'dogru-yanlis' || q.questionType === 'bosluk-doldurma') && (
                      <p className="muted"><strong>Doğru Cevap:</strong> {q.correctAnswer}</p>
                    )}
                    <div className="flex justify-end" style={{ gap:8, marginTop:8 }}>
                      {(q.solutionText || q.text) && (
                        <button className="kids-btn primary sm" onClick={() => handleShowSolution(q)}>
                          Çözüm
                        </button>
                      )}
                      <button className="kids-btn secondary sm" onClick={() => handleEdit(q)}>
                        Düzenle
                      </button>
                      <button className="kids-btn danger sm" onClick={() => handleDelete(q._id)}>
                        Sil
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Sayfalama Kontrolleri */}
          {totalPages > 1 && (
            <div className="flex gap-2 justify-center mt-3">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`kids-btn ${currentPage === i + 1 ? 'primary' : 'secondary'} sm`}
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
      {simulationData && (
        <QuestionSolver
          questionData={simulationData}
          onSolved={(r) => console.log('Çözüm sonucu:', r)}
          onClose={() => setIsSimulationOpen(false)}
        />
      )}
    </Modal>
    </div> 
  );
}

export default QuestionPool;
