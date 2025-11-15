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

  // --- Çoklu Soru Oluşturma State'leri ---
  const [multiQuestionMode, setMultiQuestionMode] = useState(false);
  const [numberOfQuestions, setNumberOfQuestions] = useState(1);
  const [multiQuestions, setMultiQuestions] = useState([defaultFormState]);

  // --- Filtre State'leri ---
  const [filterSinif, setFilterSinif] = useState(''); 
  const [filterZorluk, setFilterZorluk] = useState('');
  const [filterKonu, setFilterKonu] = useState('');
  const [filterTip, setFilterTip] = useState('');
  const [searchText, setSearchText] = useState('');

  // --- Bulk İşlem State'leri ---
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);

  // --- Görünüm State'i ---
  const [viewMode, setViewMode] = useState('cards'); // 'cards' veya 'compact'

  // --- Pagination State'leri ---
  const [currentPage, setCurrentPage] = useState(1); // Mevcut sayfa (1'den başlar)

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
    if (filterKonu) params.topic = filterKonu;
    if (filterTip) params.questionType = filterTip;
    if (searchText) params.search = searchText;
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
  }, [filterSinif, filterZorluk, filterKonu, filterTip, searchText, token]);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchQuestions();
    }
  }, [activeTab, fetchQuestions]); 
  
  // --- Pagination Hesaplamaları ---
  const questionsPerPage = viewMode === 'compact' ? 10 : 6; // Dinamik sayfa başına soru sayısı
  const filteredQuestions = questions.filter(q => {
    const matchSinif = !filterSinif || q.classLevel === filterSinif;
    const matchZorluk = !filterZorluk || q.difficulty === filterZorluk;
    const matchKonu = !filterKonu || q.topic === filterKonu;
    const matchTip = !filterTip || q.questionType === filterTip;
    const matchSearch = !searchText || 
      q.text?.toLowerCase().includes(searchText.toLowerCase()) ||
      q.topic?.toLowerCase().includes(searchText.toLowerCase());
    return matchSinif && matchZorluk && matchKonu && matchTip && matchSearch;
  });
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.ceil(totalQuestions / questionsPerPage);

  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  // --- Pagination Hesaplamaları Sonu ---

  // --- İstatistikler ---
  const stats = {
    total: questions.length,
    byDifficulty: {
      Kolay: questions.filter(q => q.difficulty === 'Kolay').length,
      Orta: questions.filter(q => q.difficulty === 'Orta').length,
      Zor: questions.filter(q => q.difficulty === 'Zor').length
    },
    byType: {
      test: questions.filter(q => q.questionType === 'test').length,
      'dogru-yanlis': questions.filter(q => q.questionType === 'dogru-yanlis').length,
      'bosluk-doldurma': questions.filter(q => q.questionType === 'bosluk-doldurma').length
    }
  };

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

  // --- Bulk İşlem Fonksiyonları ---
  const toggleQuestionSelect = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === currentQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(currentQuestions.map(q => q._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedQuestions.length === 0) {
      setError('Lütfen en az bir soru seçin.');
      return;
    }
    if (!window.confirm(`Seçili ${selectedQuestions.length} soruyu silmek istediğinizden emin misiniz?`)) {
      return;
    }
    try {
      await Promise.all(selectedQuestions.map(id => deleteQuestion(id)));
      setMessage(`${selectedQuestions.length} soru başarıyla silindi.`);
      setQuestions(questions.filter(q => !selectedQuestions.includes(q._id)));
      setSelectedQuestions([]);
      setBulkMode(false);
    } catch (err) {
      console.error('Toplu silme hatası:', err);
      setError('Sorular silinirken hata oluştu.');
    }
  };

  const handleBulkExport = () => {
    if (selectedQuestions.length === 0) {
      setError('Lütfen en az bir soru seçin.');
      return;
    }
    const exportData = questions.filter(q => selectedQuestions.includes(q._id));
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorular_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage(`${selectedQuestions.length} soru dışa aktarıldı.`);
  };
  
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedDers || !selectedSinif || !selectedKonu || !selectedKazanım || !selectedSoruTipi || !selectedDifficulty) {
      setError('Lütfen 1. Adımdaki tüm alanları doldurun.');
      return;
    }
    setError(null);
    
    // Çoklu soru modundaysa array oluştur
    if (multiQuestionMode && numberOfQuestions > 1) {
      const newQuestions = Array.from({ length: numberOfQuestions }, () => ({ ...defaultFormState }));
      setMultiQuestions(newQuestions);
    }
    
    setStep(2);
  };
  
  const resetForm = (switchToTab = 'list') => {
    setEditingId(null); setError(null); setMessage(''); setStep(1);
    setSelectedDers(curriculumData.dersler[0]); setSelectedSinif(''); setSelectedKonu(curriculumData.konular[0]); 
    setSelectedKazanım(''); setSelectedSoruTipi('test'); setSelectedDifficulty('Orta'); 
    setStep2Data(defaultFormState); setActiveTab(switchToTab);
    setMultiQuestionMode(false); setNumberOfQuestions(1); setMultiQuestions([defaultFormState]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');
    if (!token) { setError('Giriş yapmalısınız.'); return; }

    try {
      if (multiQuestionMode && numberOfQuestions > 1) {
        // Çoklu soru oluşturma
        const createdQuestions = [];
        for (let i = 0; i < multiQuestions.length; i++) {
          const qData = multiQuestions[i];
          
          // İnteraktif config objesi oluştur
          const interactiveConfig = buildInteractiveConfig(qData);
          
          const questionData = {
            subject: selectedDers,
            classLevel: selectedSinif,
            topic: selectedKonu,
            learningOutcome: selectedKazanım,
            questionType: selectedSoruTipi,
            difficulty: selectedDifficulty,
            text: qData.text,
            options: qData.options,
            correctAnswer: qData.correctAnswer,
            solutionText: qData.solutionText,
            interactiveConfig: Object.keys(interactiveConfig).length > 0 ? interactiveConfig : undefined
          };
          
          const created = await createQuestion(questionData);
          createdQuestions.push(created);
        }
        
        setQuestions([...createdQuestions, ...questions]);
        setMessage(`${createdQuestions.length} soru başarıyla oluşturuldu!`);
        resetForm('list');
      } else {
        // Tekli soru oluşturma/güncelleme
        const interactiveConfig = buildInteractiveConfig(step2Data);
        
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
          solutionText: step2Data.solutionText,
          interactiveConfig: Object.keys(interactiveConfig).length > 0 ? interactiveConfig : undefined
        };

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
      }
    } catch (err) {
      console.error('Form gönderme hatası:', err);
      setError(err.response?.data?.message || 'Soru kaydedilemedi.');
    }
  };
  
  // Helper fonksiyon - interactiveConfig oluşturur
  const buildInteractiveConfig = (qData) => {
    const interactiveConfig = {};
    
    if (['eslestirme', 'surukle-birak', 'hafiza-karti', 'eslesmeyi-bul'].includes(selectedSoruTipi)) {
      interactiveConfig.leftItems = qData.leftItems ? JSON.parse(qData.leftItems) : [];
      interactiveConfig.rightItems = qData.rightItems ? JSON.parse(qData.rightItems) : [];
      interactiveConfig.matchingPairs = qData.correctAnswer ? JSON.parse(qData.correctAnswer) : {};
    } else if (['siralama', 'kelime-corbasi', 'grup-siralama', 'anagram'].includes(selectedSoruTipi)) {
      interactiveConfig.items = qData.items ? JSON.parse(qData.items) : [];
      interactiveConfig.correctOrder = qData.correctAnswer ? JSON.parse(qData.correctAnswer) : [];
    } else if (['cizim', 'grafik-ciz', 'geometri-cizim'].includes(selectedSoruTipi)) {
      interactiveConfig.drawingType = qData.drawingType || 'graph';
      interactiveConfig.expectedResult = qData.correctAnswer ? JSON.parse(qData.correctAnswer) : {};
    } else if (selectedSoruTipi === 'sayi-dogrusu') {
      interactiveConfig.numberLineMin = parseInt(qData.numberLineMin) || -10;
      interactiveConfig.numberLineMax = parseInt(qData.numberLineMax) || 10;
    } else if (selectedSoruTipi === 'kesir-gorsel') {
      interactiveConfig.fractionType = qData.fractionType || 'circle';
      interactiveConfig.totalParts = parseInt(qData.totalParts) || 8;
    } else if (selectedSoruTipi === 'denklem-kur') {
      interactiveConfig.operators = qData.operators || '+,-,*,/,(,)';
      interactiveConfig.variables = qData.variables || 'x,y';
    } else if (['carkifelek', 'kutu-ac', 'eslesme-oyunu', 'cumle-tamamla'].includes(selectedSoruTipi)) {
      interactiveConfig.options = qData.items ? JSON.parse(qData.items) : [];
    }
    
    return interactiveConfig;
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
      // İnteraktif Sorular - Eşleştirme Tabanlı
      case 'eslestirme':
      case 'surukle-birak':
      case 'hafiza-karti':
      case 'eslesmeyi-bul':
        return (
          <div className="alert alert-info">
            <h5>🎯 {selectedSoruTipi === 'eslestirme' ? 'Eşleştirme' : selectedSoruTipi === 'surukle-birak' ? 'Sürükle-Bırak' : selectedSoruTipi === 'hafiza-karti' ? 'Hafıza Kartları' : 'Eşleşmeyi Bul'} Soru Konfigürasyonu</h5>
            <p>Bu interaktif soru tipi için sol ve sağ öğeleri JSON formatında tanımlayın:</p>
            <div className="form-group">
              <label>Sol Öğeler (JSON array)</label>
              <textarea 
                className="kids-input" 
                rows="3"
                name="leftItems"
                value={step2Data.leftItems || '["A", "B", "C"]'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, leftItems: e.target.value }))}
                placeholder='["Türkiye", "Fransa", "Almanya"]'
              />
            </div>
            <div className="form-group">
              <label>Sağ Öğeler (JSON array)</label>
              <textarea 
                className="kids-input" 
                rows="3"
                name="rightItems"
                value={step2Data.rightItems || '["1", "2", "3"]'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, rightItems: e.target.value }))}
                placeholder='["Ankara", "Paris", "Berlin"]'
              />
            </div>
            <div className="form-group">
              <label>Doğru Eşleşmeler (JSON object)</label>
              <textarea 
                className="kids-input" 
                rows="2"
                name="correctAnswer"
                value={correctAnswer || '{"A":"1", "B":"2", "C":"3"}'}
                onChange={handleStep2Change}
                placeholder='{"Türkiye":"Ankara", "Fransa":"Paris"}'
              />
            </div>
          </div>
        );
      
      // İnteraktif Sorular - Sıralama Tabanlı
      case 'siralama':
      case 'kelime-corbasi':
      case 'grup-siralama':
      case 'anagram':
        return (
          <div className="alert alert-warning">
            <h5>🔢 {selectedSoruTipi === 'siralama' ? 'Sıralama' : selectedSoruTipi === 'kelime-corbasi' ? 'Kelime Çorbası' : selectedSoruTipi === 'grup-siralama' ? 'Grup Sıralaması' : 'Anagram'} Soru Konfigürasyonu</h5>
            <p>Sıralanacak öğeleri ve doğru sırayı tanımlayın:</p>
            <div className="form-group">
              <label>Öğeler (JSON array - karışık sırada)</label>
              <textarea 
                className="kids-input" 
                rows="3"
                name="items"
                value={step2Data.items || '["B", "A", "C", "D"]'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, items: e.target.value }))}
                placeholder='["3", "1", "4", "2"]'
              />
            </div>
            <div className="form-group">
              <label>Doğru Sıralama (JSON array)</label>
              <textarea 
                className="kids-input" 
                rows="2"
                name="correctAnswer"
                value={correctAnswer || '["A", "B", "C", "D"]'}
                onChange={handleStep2Change}
                placeholder='["1", "2", "3", "4"]'
              />
            </div>
          </div>
        );
      
      // İnteraktif Sorular - Görsel/Çizim
      case 'cizim':
      case 'grafik-ciz':
      case 'geometri-cizim':
        return (
          <div className="alert alert-success">
            <h5>🎨 {selectedSoruTipi === 'cizim' ? 'Çizim' : selectedSoruTipi === 'grafik-ciz' ? 'Grafik Çizimi' : 'Geometri Çizimi'} Soru Konfigürasyonu</h5>
            <p>Öğrencinin çizeceği şeklin/grafiğin beklenen özelliklerini tanımlayın:</p>
            <div className="form-group">
              <label>Beklenen Çizim Tipi</label>
              <select 
                className="kids-select"
                name="drawingType"
                value={step2Data.drawingType || 'graph'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, drawingType: e.target.value }))}
              >
                <option value="graph">Grafik (y=f(x))</option>
                <option value="shape">Geometrik Şekil</option>
                <option value="free">Serbest Çizim</option>
              </select>
            </div>
            <div className="form-group">
              <label>Beklenen Sonuç (JSON)</label>
              <textarea 
                className="kids-input" 
                rows="3"
                name="correctAnswer"
                value={correctAnswer || '{"type":"parabola", "equation":"y=x^2"}'}
                onChange={handleStep2Change}
                placeholder='{"type":"circle", "center":[0,0], "radius":5}'
              />
            </div>
          </div>
        );
      
      case 'sayi-dogrusu':
        return (
          <div className="alert alert-primary">
            <h5>📏 Sayı Doğrusu Soru Konfigürasyonu</h5>
            <div className="form-group">
              <label>Sayı Aralığı (min)</label>
              <input 
                type="number" 
                className="kids-input"
                name="numberLineMin"
                value={step2Data.numberLineMin || -10}
                onChange={(e) => setStep2Data(prev => ({ ...prev, numberLineMin: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Sayı Aralığı (max)</label>
              <input 
                type="number" 
                className="kids-input"
                name="numberLineMax"
                value={step2Data.numberLineMax || 10}
                onChange={(e) => setStep2Data(prev => ({ ...prev, numberLineMax: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Doğru İşaretlenecek Sayı</label>
              <input 
                type="number" 
                className="kids-input"
                name="correctAnswer"
                value={correctAnswer || 0}
                onChange={handleStep2Change}
              />
            </div>
          </div>
        );
      
      case 'kesir-gorsel':
        return (
          <div className="alert alert-info" style={{ background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)' }}>
            <h5>🍕 Kesir Görseli Soru Konfigürasyonu</h5>
            <div className="form-group">
              <label>Kesir Türü</label>
              <select 
                className="kids-select"
                name="fractionType"
                value={step2Data.fractionType || 'circle'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, fractionType: e.target.value }))}
              >
                <option value="circle">Daire (Pizza)</option>
                <option value="rectangle">Dikdörtgen (Çikolata)</option>
                <option value="bar">Çubuk (Bar)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Bölünecek Parça Sayısı</label>
              <input 
                type="number" 
                className="kids-input"
                name="totalParts"
                value={step2Data.totalParts || 8}
                onChange={(e) => setStep2Data(prev => ({ ...prev, totalParts: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Boyalı Parça Sayısı (Doğru Cevap)</label>
              <input 
                type="number" 
                className="kids-input"
                name="correctAnswer"
                value={correctAnswer || 3}
                onChange={handleStep2Change}
              />
            </div>
          </div>
        );
      
      case 'denklem-kur':
        return (
          <div className="alert alert-secondary">
            <h5>🧮 Denklem Kurma Soru Konfigürasyonu</h5>
            <p>Öğrencinin oluşturacağı matematiksel denklemi tanımlayın:</p>
            <div className="form-group">
              <label>Kullanılabilir Operatörler</label>
              <input 
                type="text" 
                className="kids-input"
                name="operators"
                value={step2Data.operators || '+,-,*,/,(,)'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, operators: e.target.value }))}
                placeholder="+,-,*,/,(,)"
              />
            </div>
            <div className="form-group">
              <label>Kullanılabilir Sayılar/Değişkenler</label>
              <input 
                type="text" 
                className="kids-input"
                name="variables"
                value={step2Data.variables || 'x,y,1,2,3,4,5'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, variables: e.target.value }))}
                placeholder="x,y,1,2,3"
              />
            </div>
            <div className="form-group">
              <label>Doğru Denklem</label>
              <input 
                type="text" 
                className="kids-input"
                name="correctAnswer"
                value={correctAnswer || '2*x + 3 = 11'}
                onChange={handleStep2Change}
                placeholder="2*x + 3 = 11"
              />
            </div>
          </div>
        );
      
      // Özel İnteraktif Sorular
      case 'carkifelek':
      case 'kutu-ac':
      case 'eslesme-oyunu':
      case 'cumle-tamamla':
        return (
          <div className="alert alert-dark">
            <h5>🎮 {selectedSoruTipi === 'carkifelek' ? 'Çarkıfelek' : selectedSoruTipi === 'kutu-ac' ? 'Kutuyu Aç' : selectedSoruTipi === 'eslesme-oyunu' ? 'Eşleşme Oyunu' : 'Cümle Tamamlama'} Soru Konfigürasyonu</h5>
            <p>Bu özel interaktif soru tipi için seçenekleri ve doğru cevabı tanımlayın:</p>
            <div className="form-group">
              <label>Seçenekler (JSON array)</label>
              <textarea 
                className="kids-input" 
                rows="4"
                name="items"
                value={step2Data.items || '["Seçenek 1", "Seçenek 2", "Seçenek 3"]'}
                onChange={(e) => setStep2Data(prev => ({ ...prev, items: e.target.value }))}
                placeholder='["2+2", "3+3", "4+4", "5+5"]'
              />
            </div>
            <div className="form-group">
              <label>Doğru Cevap</label>
              <input 
                type="text" 
                className="kids-input"
                name="correctAnswer"
                value={correctAnswer || ''}
                onChange={handleStep2Change}
                placeholder="Doğru seçeneği yazın"
              />
            </div>
          </div>
        );
      
      case 'acik-uclu':
        return (
          <div className="alert alert-light border">
            <h5>📝 Açık Uçlu Soru</h5>
            <p>Bu soru tipi için öğrenci serbest metin yazacaktır. Değerlendirme öğretmen tarafından manuel yapılır.</p>
            <div className="form-group">
              <label>Örnek Cevap / Puanlama Rehberi</label>
              <textarea 
                className="kids-input" 
                rows="4"
                name="correctAnswer"
                value={correctAnswer || ''}
                onChange={handleStep2Change}
                placeholder="Beklenen cevap veya puanlama kriterlerini yazın..."
              />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="alert alert-warning">
            <p>⚠️ Seçilen soru tipi için henüz özel alanlar tanımlanmamış. Varsayılan metin cevap alanı kullanılacak.</p>
            <div className="form-group">
              <label htmlFor="correctAnswerDefault">Doğru Cevap</label>
              <input 
                type="text" 
                id="correctAnswerDefault" 
                name="correctAnswer" 
                value={correctAnswer} 
                onChange={handleStep2Change} 
                placeholder="Doğru cevabı yazın..." 
              />
            </div>
          </div>
        );
    }
  };


  // ==================================================================
  // --- JSX (ANA RENDER) KISMI) ---
  // ==================================================================
  return (
  <div className="container pt-2">

      <div className="kids-card mb-2 flex justify-between items-center" style={{ gap:'1rem', flexWrap:'wrap' }}>
        <div className="flex flex-column" style={{ gap:4 }}>
          <h2 className="m-0">📚 Soru Havuzu</h2>
          <p className="muted m-0" style={{ fontSize:'.85rem' }}>Soruları oluştur, filtrele, düzenle ve yönet.</p>
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

      {/* İSTATİSTİKLER KARTI */}
      {activeTab === 'list' && !loading && (
        <div className="kids-card mb-3">
          <h3 className="mb-2" style={{ fontSize: '1.1rem', fontWeight: 600 }}>📊 İstatistikler</h3>
          <div className="d-flex gap-3 flex-wrap">
            <div style={{ flex: '1 1 150px', padding: '1rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, color: 'white' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</div>
              <div style={{ fontSize: '.85rem', opacity: 0.9 }}>Toplam Soru</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: 'linear-gradient(135deg, #6bcf7f 0%, #48bb78 100%)', borderRadius: 12, color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.byDifficulty.Kolay}</div>
              <div style={{ fontSize: '.85rem', opacity: 0.9 }}>Kolay</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)', borderRadius: 12, color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.byDifficulty.Orta}</div>
              <div style={{ fontSize: '.85rem', opacity: 0.9 }}>Orta</div>
            </div>
            <div style={{ flex: '1 1 150px', padding: '1rem', background: 'linear-gradient(135deg, #fc8181 0%, #f56565 100%)', borderRadius: 12, color: 'white' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.byDifficulty.Zor}</div>
              <div style={{ fontSize: '.85rem', opacity: 0.9 }}>Zor</div>
            </div>
          </div>
          <div className="d-flex gap-2 mt-3" style={{ fontSize: '.9rem' }}>
            <span className="kids-badge info">📝 Test: {stats.byType.test}</span>
            <span className="kids-badge info">✓ D/Y: {stats.byType['dogru-yanlis']}</span>
            <span className="kids-badge info">🔤 Boşluk: {stats.byType['bosluk-doldurma']}</span>
          </div>
        </div>
      )}
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
                      <option value="">Soru tipi seçin...</option>
                      {['Klasik', 'İnteraktif', 'Görsel', 'Özel'].map(kategori => {
                        const tipsInCategory = curriculumData.soruTipleri.filter(t => t.category === kategori);
                        return tipsInCategory.length > 0 ? (
                          <optgroup key={kategori} label={`🎯 ${kategori} Sorular`}>
                            {tipsInCategory.map(tip => (
                              <option key={tip.value} value={tip.value}>
                                {tip.icon} {tip.label}
                              </option>
                            ))}
                          </optgroup>
                        ) : null;
                      })}
                    </select>
                  </div>

                  <div className="form-group"><label className="form-label" htmlFor="difficultySelect">Zorluk Seviyesi</label>
                    <select className="kids-select" id="difficultySelect" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} required>
                      {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
                    </select>
                  </div>
                  
                  {/* Çoklu Soru Oluşturma Seçeneği */}
                  <div className="kids-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '1rem' }}>
                    <div className="form-group mb-2">
                      <label className="flex items-center" style={{ gap: 8, cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={multiQuestionMode}
                          onChange={(e) => setMultiQuestionMode(e.target.checked)}
                          style={{ width: '18px', height: '18px' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>🚀 Çoklu Soru Oluştur</span>
                      </label>
                      <small style={{ opacity: 0.9, display: 'block', marginTop: 4 }}>
                        Aynı özelliklere sahip birden fazla soru oluşturun
                      </small>
                    </div>
                    
                    {multiQuestionMode && (
                      <div className="form-group">
                        <label style={{ fontSize: '.9rem' }}>Kaç soru oluşturulacak?</label>
                        <input 
                          type="number" 
                          className="kids-input"
                          min="2"
                          max="20"
                          value={numberOfQuestions}
                          onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 2)}
                          style={{ background: 'white' }}
                        />
                        <small style={{ opacity: 0.9, display: 'block', marginTop: 4 }}>
                          💡 2-20 arası soru oluşturabilirsiniz
                        </small>
                      </div>
                    )}
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
                <legend>2. Adım: Soru Hazırlama ({selectedSoruTipi}) {multiQuestionMode && `- ${numberOfQuestions} Soru`}</legend>
                
                {multiQuestionMode && numberOfQuestions > 1 ? (
                  // Çoklu soru modu
                  <div>
                    <div className="alert alert-info mb-3">
                      <strong>📝 Çoklu Soru Modu Aktif</strong>
                      <p>Her soru için bilgileri sırayla doldurun. Tüm sorular aynı özelliklere (ders, sınıf, konu, tip, zorluk) sahip olacaktır.</p>
                    </div>
                    
                    {multiQuestions.map((qData, index) => (
                      <div key={index} className="kids-card mb-3" style={{ border: '2px solid #667eea' }}>
                        <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>Soru {index + 1}</h4>
                        
                        <div className="form-group" data-color-mode="dark">
                          <label className="form-label">Soru Metni</label>
                          <MDEditor
                            value={qData.text}
                            onChange={(value) => {
                              const newQuestions = [...multiQuestions];
                              newQuestions[index] = { ...newQuestions[index], text: value };
                              setMultiQuestions(newQuestions);
                            }}
                            previewOptions={{
                              rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
                              remarkPlugins: [remarkMath],
                            }}
                          />
                        </div>
                        
                        {/* Basit cevap alanı - her soru tipi için detaylı alanlar eklenebilir */}
                        {selectedSoruTipi === 'test' && (
                          <>
                            <div className="options-grid">
                              {(qData.options || ['', '', '', '']).map((option, optIndex) => (
                                <div className="form-group" key={optIndex}>
                                  <label>Seçenek {String.fromCharCode(65 + optIndex)}</label>
                                  <input 
                                    type="text" 
                                    value={option} 
                                    onChange={(e) => {
                                      const newQuestions = [...multiQuestions];
                                      const newOptions = [...(newQuestions[index].options || ['', '', '', ''])];
                                      newOptions[optIndex] = e.target.value;
                                      newQuestions[index] = { ...newQuestions[index], options: newOptions };
                                      setMultiQuestions(newQuestions);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="form-group">
                              <label>Doğru Cevap</label>
                              <select 
                                value={qData.correctAnswer || ''}
                                onChange={(e) => {
                                  const newQuestions = [...multiQuestions];
                                  newQuestions[index] = { ...newQuestions[index], correctAnswer: e.target.value };
                                  setMultiQuestions(newQuestions);
                                }}
                              >
                                <option value="">Seçin...</option>
                                {(qData.options || []).filter(opt => opt).map((opt, optIndex) => (
                                  <option key={optIndex} value={opt}>
                                    {String.fromCharCode(65 + optIndex)} - {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </>
                        )}
                        
                        {(selectedSoruTipi === 'dogru-yanlis' || selectedSoruTipi === 'bosluk-doldurma' || selectedSoruTipi === 'acik-uclu') && (
                          <div className="form-group">
                            <label>Doğru Cevap</label>
                            <input 
                              type="text" 
                              value={qData.correctAnswer || ''}
                              onChange={(e) => {
                                const newQuestions = [...multiQuestions];
                                newQuestions[index] = { ...newQuestions[index], correctAnswer: e.target.value };
                                setMultiQuestions(newQuestions);
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="form-group" data-color-mode="dark">
                          <label className="form-label">Çözüm (Opsiyonel)</label>
                          <MDEditor
                            value={qData.solutionText}
                            onChange={(value) => {
                              const newQuestions = [...multiQuestions];
                              newQuestions[index] = { ...newQuestions[index], solutionText: value };
                              setMultiQuestions(newQuestions);
                            }}
                            previewOptions={{
                              rehypePlugins: [[rehypeKatex, { output: 'mathml' }]],
                              remarkPlugins: [remarkMath],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Tekli soru modu (mevcut)
                  <>
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
                  </>
                )}


                <div className="flex" style={{ gap:8, justifyContent:'flex-end' }}>
                  <button type="button" className="kids-btn secondary" onClick={() => setStep(1)}>
                    ← Geri
                  </button>
                  {editingId && (
                    <button type="button" className="kids-btn warning" onClick={() => resetForm('list')}>
                      İptal
                    </button>
                  )}
                  <button type="submit" className="kids-btn primary">
                    {editingId ? 'Güncelle' : multiQuestionMode && numberOfQuestions > 1 ? `${numberOfQuestions} Soruyu Kaydet` : 'Kaydet'}
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
          <div className="flex justify-between items-center mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="m-0">Mevcut Sorular ({totalQuestions})</h2>
            <div className="flex gap-2">
              <button 
                className={`kids-btn ${viewMode === 'cards' ? 'primary' : 'secondary'} sm`}
                onClick={() => setViewMode('cards')}
                title="Kart Görünümü"
              >
                🃏
              </button>
              <button 
                className={`kids-btn ${viewMode === 'compact' ? 'primary' : 'secondary'} sm`}
                onClick={() => setViewMode('compact')}
                title="Kompakt Görünüm"
              >
                ☰
              </button>
              <button 
                className={`kids-btn ${bulkMode ? 'warning' : 'secondary'} sm`}
                onClick={() => { setBulkMode(!bulkMode); setSelectedQuestions([]); }}
              >
                {bulkMode ? '✕ İptal' : '☑ Toplu İşlem'}
              </button>
            </div>
          </div>

          {/* Toplu İşlem Araç Çubuğu */}
          {bulkMode && (
            <div className="kids-card mb-3" style={{ background: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
              <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <strong>{selectedQuestions.length} soru seçildi</strong>
                  {selectedQuestions.length > 0 && (
                    <button 
                      className="kids-btn secondary sm ms-2"
                      onClick={() => setSelectedQuestions([])}
                    >
                      Seçimi Temizle
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    className="kids-btn primary sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedQuestions.length === currentQuestions.length ? '☐ Hiçbirini Seçme' : '☑ Tümünü Seç'}
                  </button>
                  <button 
                    className="kids-btn info sm"
                    onClick={handleBulkExport}
                    disabled={selectedQuestions.length === 0}
                  >
                    📥 Dışa Aktar
                  </button>
                  <button 
                    className="kids-btn danger sm"
                    onClick={handleBulkDelete}
                    disabled={selectedQuestions.length === 0}
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GELİŞMİŞ FİLTRELEME */}
          <div className="kids-card mb-3" style={{ background: '#f8f9fa' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>🔍 Gelişmiş Filtreleme & Arama</h4>
            <div className="d-flex gap-3 flex-wrap">
              <div className="form-group" style={{ minWidth: 200, flex: 1 }}>
                <label className="form-label" htmlFor="searchText">Arama (Soru metni veya konu)</label>
                <input
                  type="text"
                  className="kids-input"
                  id="searchText"
                  placeholder="Anahtar kelime girin..."
                  value={searchText}
                  onChange={(e) => handleFilterChange(setSearchText, e.target.value)}
                />
              </div>
              <div className="form-group" style={{ minWidth: 180 }}>
                <label className="form-label" htmlFor="filterSinif">Sınıf</label>
                <select className="kids-select" id="filterSinif" value={filterSinif} onChange={(e) => handleFilterChange(setFilterSinif, e.target.value)}>
                  <option value="">Tüm Sınıflar</option>
                  {classLevels.map(level => (<option key={level} value={level}>{level}</option>))}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 180 }}>
                <label className="form-label" htmlFor="filterKonu">Konu</label>
                <select className="kids-select" id="filterKonu" value={filterKonu} onChange={(e) => handleFilterChange(setFilterKonu, e.target.value)}>
                  <option value="">Tüm Konular</option>
                  {curriculumData.konular.map(konu => (<option key={konu} value={konu}>{konu}</option>))}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 160 }}>
                <label className="form-label" htmlFor="filterZorluk">Zorluk</label>
                <select className="kids-select" id="filterZorluk" value={filterZorluk} onChange={(e) => handleFilterChange(setFilterZorluk, e.target.value)}>
                  <option value="">Tüm Zorluklar</option>
                  {difficultyLevels.map(level => (<option key={level} value={level}>{level}</option>))}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 160 }}>
                <label className="form-label" htmlFor="filterTip">Soru Tipi</label>
                <select className="kids-select" id="filterTip" value={filterTip} onChange={(e) => handleFilterChange(setFilterTip, e.target.value)}>
                  <option value="">Tüm Tipler</option>
                  <option value="test">Test</option>
                  <option value="dogru-yanlis">Doğru/Yanlış</option>
                  <option value="bosluk-doldurma">Boşluk Doldurma</option>
                </select>
              </div>
            </div>
            {(searchText || filterSinif || filterKonu || filterZorluk || filterTip) && (
              <button 
                className="kids-btn secondary sm mt-2"
                onClick={() => {
                  setSearchText('');
                  setFilterSinif('');
                  setFilterKonu('');
                  setFilterZorluk('');
                  setFilterTip('');
                  setCurrentPage(1);
                }}
              >
                🔄 Filtreleri Temizle
              </button>
            )}
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
            <>
              {totalQuestions === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '4rem', opacity: 0.3 }}>📭</div>
                  <p className="muted">Bu filtrelere uygun soru bulunamadı.</p>
                </div>
              ) : (
                <>
                  {viewMode === 'cards' ? (
                    <div className="d-flex flex-column gap-3">
                      {currentQuestions.map((q) => (
                        <div key={q._id} className="kids-card" style={{ 
                          position: 'relative',
                          border: selectedQuestions.includes(q._id) ? '2px solid #667eea' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}>
                          {bulkMode && (
                            <div style={{ position: 'absolute', top: 12, right: 12 }}>
                              <input 
                                type="checkbox" 
                                checked={selectedQuestions.includes(q._id)}
                                onChange={() => toggleQuestionSelect(q._id)}
                                style={{ width: 20, height: 20, cursor: 'pointer' }}
                              />
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-2" style={{ gap:8, flexWrap:'wrap', marginRight: bulkMode ? 40 : 0 }}>
                            <div className="flex gap-2 flex-wrap">
                              <span className="kids-badge turquoise">{q.subject} - {q.classLevel}</span>
                              <span className="kids-badge secondary" style={{ fontSize: '.8rem' }}>{q.topic}</span>
                            </div>
                            <span className={`kids-badge ${q.difficulty === 'Zor' ? 'danger' : q.difficulty === 'Orta' ? 'warning' : 'success'}`}>
                              {q.difficulty || '—'}
                            </span>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <span className="kids-badge info" style={{ fontSize: '.75rem' }}>
                              {q.questionType === 'test' ? '📝 Test' : 
                               q.questionType === 'dogru-yanlis' ? '✓ Doğru/Yanlış' : 
                               q.questionType === 'bosluk-doldurma' ? '🔤 Boşluk Doldurma' : q.questionType}
                            </span>
                          </div>
                          <div data-color-mode="light" className="mb-3" style={{ 
                            padding: '1rem', 
                            background: '#f8fafc', 
                            borderRadius: 8,
                            border: '1px solid #e2e8f0'
                          }}>
                            <MDEditor.Markdown 
                              source={q.text} 
                              rehypePlugins={[[rehypeKatex, { output: 'mathml' }]]}
                              remarkPlugins={[remarkMath]}
                            />
                          </div>
                          {q.questionType === 'test' && Array.isArray(q.options) && (
                            <div style={{ display:'grid', gap:6, marginBottom: '1rem' }}>
                              {q.options.map((opt, index) => (
                                <div key={index} style={{ 
                                  padding:'10px 14px', 
                                  borderRadius:10, 
                                  background: opt === q.correctAnswer ? 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' : '#f9fafb',
                                  border: opt === q.correctAnswer ? '2px solid #48bb78' : '1px solid #e2e8f0',
                                  fontWeight: opt === q.correctAnswer ? 600 : 400,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8
                                }}>
                                  {opt === q.correctAnswer && <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>}
                                  <span><strong>{String.fromCharCode(65 + index)}.</strong> {opt}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(q.questionType === 'dogru-yanlis' || q.questionType === 'bosluk-doldurma') && (
                            <div style={{ 
                              padding: '10px 14px', 
                              background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                              borderRadius: 10,
                              border: '2px solid #48bb78',
                              marginBottom: '1rem'
                            }}>
                              <strong>✓ Doğru Cevap:</strong> {q.correctAnswer}
                            </div>
                          )}
                          <div className="flex justify-end" style={{ gap:8 }}>
                            {(q.solutionText || q.text) && (
                              <button className="kids-btn primary sm" onClick={() => handleShowSolution(q)}>
                                💡 Çözüm
                              </button>
                            )}
                            <button className="kids-btn secondary sm" onClick={() => handleEdit(q)}>
                              ✏️ Düzenle
                            </button>
                            <button className="kids-btn danger sm" onClick={() => handleDelete(q._id)}>
                              🗑️ Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // COMPACT VIEW
                    <div className="table-responsive">
                      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            {bulkMode && <th style={{ padding: '12px', width: 40 }}>
                              <input 
                                type="checkbox" 
                                checked={selectedQuestions.length === currentQuestions.length && currentQuestions.length > 0}
                                onChange={toggleSelectAll}
                                style={{ width: 18, height: 18, cursor: 'pointer' }}
                              />
                            </th>}
                            <th style={{ padding: '12px', textAlign: 'left' }}>Soru</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: 120 }}>Sınıf</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: 100 }}>Zorluk</th>
                            <th style={{ padding: '12px', textAlign: 'left', width: 100 }}>Tip</th>
                            <th style={{ padding: '12px', textAlign: 'right', width: 200 }}>İşlemler</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentQuestions.map((q) => (
                            <tr key={q._id} style={{ 
                              borderBottom: '1px solid #e2e8f0',
                              background: selectedQuestions.includes(q._id) ? '#f0f4ff' : 'white'
                            }}>
                              {bulkMode && <td style={{ padding: '12px' }}>
                                <input 
                                  type="checkbox" 
                                  checked={selectedQuestions.includes(q._id)}
                                  onChange={() => toggleQuestionSelect(q._id)}
                                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                                />
                              </td>}
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontSize: '.9rem', fontWeight: 500, marginBottom: 4 }}>
                                  {q.text?.substring(0, 80)}...
                                </div>
                                <span className="kids-badge secondary" style={{ fontSize: '.75rem' }}>{q.topic}</span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span className="kids-badge turquoise" style={{ fontSize: '.8rem' }}>{q.classLevel}</span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span className={`kids-badge ${q.difficulty === 'Zor' ? 'danger' : q.difficulty === 'Orta' ? 'warning' : 'success'}`} style={{ fontSize: '.8rem' }}>
                                  {q.difficulty || '—'}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ fontSize: '.8rem' }}>
                                  {q.questionType === 'test' ? '📝' : q.questionType === 'dogru-yanlis' ? '✓' : '🔤'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                <div className="flex justify-end gap-1">
                                  {(q.solutionText || q.text) && (
                                    <button className="kids-btn primary sm" onClick={() => handleShowSolution(q)} style={{ fontSize: '.75rem', padding: '4px 8px' }}>
                                      💡
                                    </button>
                                  )}
                                  <button className="kids-btn secondary sm" onClick={() => handleEdit(q)} style={{ fontSize: '.75rem', padding: '4px 8px' }}>
                                    ✏️
                                  </button>
                                  <button className="kids-btn danger sm" onClick={() => handleDelete(q._id)} style={{ fontSize: '.75rem', padding: '4px 8px' }}>
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
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
