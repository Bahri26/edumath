// frontend-react/src/pages/teacher/QuestionPoolNew.jsx - Oyunlaştırılmış Soru Havuzu

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import '../../assets/styles/QuestionPoolNew.css';
import '../../assets/styles/InteractiveQuestions.css';
import PageHeader from '../../components/common/PageHeader';
import { curriculumData } from '../../data/curriculumData';
import MatchQuestion from '../../components/interactive/MatchQuestion';
import AnagramQuestion from '../../components/interactive/AnagramQuestion';
import MemoryQuestion from '../../components/interactive/MemoryQuestion';
import GroupingQuestion from '../../components/interactive/GroupingQuestion';

const API_URL = 'http://localhost:8000/api/questions';

// Hazır şablonlar (tek tıkla doldur)
const QUESTION_TEMPLATES = [
  {
    key: 'aritmetik-dizi',
    label: 'Aritmetik Dizi',
    payload: {
      subject: 'Matematik',
      topic: 'Aritmetik Dizi',
      difficulty: 'Orta',
      questionType: 'test',
      text: `**Soru:** Aşağıdaki dizi aritmetik bir dizidir: 2, 5, 8, 11, ...\n\nBu dizinin 20. terimi kaçtır?`,
      options: ['56', '58', '59', '62'],
      optionRationales: [
        `Yakın ama eksik: $a_{20} = 2 + 19\cdot 3 = 59$, 56 değil.`,
        `Yakın ama hatalı: ortak fark 3 ise 58 olmaz.`,
        `Doğru: $a_{20} = 2 + 19\cdot 3 = 59$.`,
        `Uzak seçenek.`
      ],
      correctAnswer: '59',
      solutionText: `**Çözüm:** Aritmetik dizi formülü $a_n = a_1 + (n-1)\cdot d$.\n\n$a_{20} = 2 + (20-1)\cdot 3 = 2 + 57 = 59$.`
    }
  },
  {
    key: 'dikdortgen-alan',
    label: 'Dikdörtgen Alanı',
    payload: {
      subject: 'Matematik',
      topic: 'Geometri',
      difficulty: 'Kolay',
      questionType: 'test',
      text: `**Soru:** Bir dikdörtgenin alanı 48 cm^2 ve uzun kenarı 8 cm ise kısa kenarı kaç cm'dir?`,
      options: ['4', '5', '6', '7'],
      optionRationales: [
        `Doğru: 48 = 8×k → k=6; 4 hatalıdır.`,
        `Yakın ama hatalı bölme`,
        `Doğru: k = 48 / 8 = 6`,
        `Yakın ama hatalı`
      ],
      correctAnswer: '6',
      solutionText: `**Çözüm:** Alan = uzun × kısa → 48 = 8 × k → k = 6`
    }
  },
  {
    key: 'yuzde-artis',
    label: 'Yüzde Artış',
    payload: {
      subject: 'Matematik',
      topic: 'Yüzdeler',
      difficulty: 'Orta',
      questionType: 'test',
      text: `**Soru:** Bir ürünün fiyatı %20 artarak 120 TL olmuştur. Ürünün eski fiyatı kaç TL'dir?`,
      options: ['96', '100', '102', '110'],
      optionRationales: [
        `Az hesaplandı`,
        `Doğru: 120 = 1.2 × x → x = 100`,
        `Yakın fakat yanlış oran`,
        `Mantık hatası`
      ],
      correctAnswer: '100',
      solutionText: `**Çözüm:** 120 = 1.2 \\times x → x = 100`
    }
  }
];

const difficultyConfig = {
  'Kolay': { emoji: '🟢', color: '#22c55e', label: 'Kolay' },
  'Orta': { emoji: '🟡', color: '#f59e0b', label: 'Orta' },
  'Zor': { emoji: '🔴', color: '#ef4444', label: 'Zor' }
};

const questionTypeConfig = {
  'test': { emoji: '✓', label: 'Test', color: '#6366f1' },
  'açık uçlu': { emoji: '✍️', label: 'Açık Uçlu', color: '#8b5cf6' },
  'eşleştirme': { emoji: '🔗', label: 'Eşleştirme', color: '#06b6d4' },
  'interactive': { emoji: '🎮', label: 'Etkileşimli', color: '#10b981' }
};

function QuestionPoolNew() {
  const token = localStorage.getItem('token');
  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // --- STATE'LER ---
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [view, setView] = useState('grid'); // 'grid' or 'wizard'
  const [wizardStep, setWizardStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const hasToken = Boolean(token);

  // --- Filtreler ---
  const [filters, setFilters] = useState({
    classLevel: '',
    difficulty: '',
    subject: '',
    search: ''
  });

  // --- Wizard Form Data ---
  const [formData, setFormData] = useState({
    subject: curriculumData.dersler[0] || 'Matematik',
    classLevel: '',
    topic: curriculumData.konular[0] || '',
    learningOutcome: '',
    questionType: 'test',
    interactionKind: '',
    interactionConfig: {},
    difficulty: 'Orta',
    text: '**Soru:** \n\n',
    options: ['', '', '', ''],
    optionRationales: ['', '', '', ''],
    hints: [''],
    correctAnswer: '',
    solutionText: '**Çözüm:** \n\n'
  });

  // --- Veri Çekme ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!token) {
      setError('Verileri görmek için giriş yapmalısınız.');
      setLoading(false);
      return;
    }

    const params = {};
    if (filters.classLevel) params.classLevel = filters.classLevel;
    if (filters.difficulty) params.difficulty = filters.difficulty;

    try {
      const response = await axios.get(API_URL, { ...axiosConfig, params });
      setQuestions(response.data);
    } catch (err) {
      console.error('Sorular yüklenirken hata:', err);
      setError('API bağlantısı kurulamadı.');
      // Test verileri
      setQuestions([
        {
          _id: '1',
          text: '**Soru:** 5x + 10 = 35 denkleminde x kaçtır?',
          subject: 'Matematik',
          classLevel: '7. Sınıf',
          topic: 'Denklemler',
          difficulty: 'Orta',
          questionType: 'test',
          options: ['3', '5', '7', '10'],
          correctAnswer: '5',
          solutionText: '**Çözüm:** 5x = 35 - 10 = 25, x = 5'
        },
        {
          _id: '2',
          text: '**Soru:** Bir dikdörtgenin alanı 48 cm², uzun kenarı 8 cm ise kısa kenarı kaç cm\'dir?',
          subject: 'Matematik',
          classLevel: '6. Sınıf',
          topic: 'Geometri',
          difficulty: 'Kolay',
          questionType: 'test',
          options: ['4', '5', '6', '7'],
          correctAnswer: '6',
          solutionText: '**Çözüm:** Alan = uzun × kısa, 48 = 8 × kısa, kısa = 6'
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [token, filters.classLevel, filters.difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- Wizard Navigation ---
  const goToWizard = () => {
    setView('wizard');
    setWizardStep(1);
    setEditingId(null);
    setFormData({
      subject: curriculumData.dersler[0] || 'Matematik',
      classLevel: '',
      topic: curriculumData.konular[0] || '',
      learningOutcome: '',
      questionType: 'test',
      interactionKind: '',
      interactionConfig: {},
      difficulty: 'Orta',
      text: '**Soru:** \n\n',
      options: ['', '', '', ''],
      optionRationales: ['', '', '', ''],
      hints: [''],
      correctAnswer: '',
      solutionText: '**Çözüm:** \n\n'
    });
  };

  const handleWizardNext = () => {
    if (wizardStep === 1) {
      if (!formData.classLevel || !formData.topic) {
        setError('Lütfen sınıf ve konu seçin.');
        return;
      }
      if (!formData.learningOutcome || !formData.learningOutcome.trim()) {
        setError('Lütfen kazanımı (öğrenme çıktısı) yazın.');
        return;
      }
    }
    setError(null);
    setWizardStep(wizardStep + 1);
  };

  const handleWizardBack = () => {
    setError(null);
    if (wizardStep > 1) setWizardStep(wizardStep - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage('');

    if (!formData.text) {
      setError('Soru metni zorunludur.');
      return;
    }
    if (formData.questionType === 'test' && !formData.correctAnswer) {
      setError('Test soruları için doğru cevap seçilmelidir.');
      return;
    }
    if (!formData.learningOutcome || !formData.learningOutcome.trim()) {
      setError('Kazanım alanı zorunludur.');
      return;
    }
    if (formData.questionType === 'interactive') {
      if (formData.interactionKind === 'match') {
        const items = formData.interactionConfig?.items || [];
        if (!items.length) {
          setError('Eşleştirme için en az bir çift ekleyin.');
          return;
        }
      }
    }

    try {
      let response;
      // Backend validasyonu için gereksiz/boş alanları çıkar
      const payload = { ...formData };
      if (payload.questionType !== 'interactive') {
        delete payload.interactionKind;
        delete payload.interactionConfig;
      } else {
        // interactive ise boş string interactionKind göndermeyelim
        if (!payload.interactionKind) delete payload.interactionKind;
      }
      if (editingId) {
        response = await axios.put(`${API_URL}/${editingId}`, payload, axiosConfig);
        setQuestions(questions.map(q => q._id === editingId ? response.data : q));
        setMessage('✨ Soru başarıyla güncellendi!');
      } else {
        response = await axios.post(API_URL, payload, axiosConfig);
        setQuestions([response.data, ...questions]);
        setMessage('🎉 Yeni soru eklendi!');
      }
      setTimeout(() => {
        setView('grid');
        setMessage('');
      }, 2000);
    } catch (err) {
      console.error('Form gönderme hatası:', err);
      setError(err.response?.data?.message || 'Soru kaydedilemedi.');
    }
  };

  const handleGenerateAI = async () => {
    setAiError(null);
    setAiBusy(true);
    try {
      const payload = {
        text: formData.text,
        options: formData.options,
        correctAnswer: formData.correctAnswer,
        topic: formData.topic,
        difficulty: formData.difficulty
      };
      const resp = await axios.post('http://localhost:8000/api/questions/explain', payload, axiosConfig);
      const { solutionMarkdown, outlineSteps } = resp.data || {};
      if (solutionMarkdown) {
        setFormData(prev => ({ ...prev, solutionText: solutionMarkdown }));
      }
      if (Array.isArray(outlineSteps) && outlineSteps.length) {
        // İpuçlarına ilk 3 adımı dolduralım
        const merged = outlineSteps.slice(0, 3);
        setFormData(prev => ({ ...prev, hints: merged }));
      }
    } catch (e) {
      console.error('AI explain failed:', e);
      if (e.response?.status === 401) {
        setAiError('Yetkisiz: Lütfen giriş yapın (401).');
      } else if (e.response?.status === 404) {
        setAiError('Endpoint bulunamadı (404). Sunucuyu yeniden başlatmayı ve rota sırasını kontrol etmeyi deneyin.');
      } else if (e.code === 'ERR_NETWORK') {
        setAiError('Ağ hatası: Sunucuya ulaşılamıyor. Sunucunun çalıştığından emin olun.');
      } else {
        setAiError(e.response?.data?.message || 'Çözüm adımları üretilemedi.');
      }
    } finally {
      setAiBusy(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return;
    try {
      await axios.delete(`${API_URL}/${id}`, axiosConfig);
      setQuestions(questions.filter(q => q._id !== id));
      setMessage('🗑️ Soru silindi.');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setError('Soru silinemedi.');
    }
  };

  const handleEdit = (question) => {
    setEditingId(question._id);
    setFormData({
      ...question,
      optionRationales: question.optionRationales || ['', '', '', ''],
      hints: question.hints && question.hints.length ? question.hints : [''],
      interactionKind: question.interactionKind || '',
      interactionConfig: question.interactionConfig || {}
    });
    setView('wizard');
    setWizardStep(2);
  };

  // --- Filtreleme ---
  const filteredQuestions = questions.filter(q => {
    if (filters.search && !q.text.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.classLevel && q.classLevel !== filters.classLevel) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.subject && q.subject !== filters.subject) return false;
    return true;
  });

  return (
    <div className="question-pool-container">
      <PageHeader title="Soru Havuzu" emoji="📚">
        {view === 'grid' && (
          <button className="btn-add-question" onClick={goToWizard}>
            <span>✨</span> Yeni Soru Ekle
          </button>
        )}
        {view === 'wizard' && (
          <button className="btn-back-grid" onClick={() => setView('grid')}>
            <span>←</span> Geri Dön
          </button>
        )}
      </PageHeader>

      {message && <div className="alert-success">{message}</div>}
      {error && <div className="alert-error">{error}</div>}

      {view === 'grid' && (
        <>
          {/* Filtreler */}
          <div className="filter-panel">
            <div className="filter-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Soru ara..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <div className="filter-chips">
              <select
                className="filter-select"
                value={filters.classLevel}
                onChange={(e) => setFilters({ ...filters, classLevel: e.target.value })}
              >
                <option value="">Tüm Sınıflar</option>
                {curriculumData.siniflar.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                className="filter-select"
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="">Tüm Zorluklar</option>
                <option value="Kolay">🟢 Kolay</option>
                <option value="Orta">🟡 Orta</option>
                <option value="Zor">🔴 Zor</option>
              </select>

              <select
                className="filter-select"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              >
                <option value="">Tüm Dersler</option>
                {curriculumData.dersler.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-icon">📝</span>
              <div>
                <div className="stat-value">{filteredQuestions.length}</div>
                <div className="stat-label">Toplam Soru</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🟢</span>
              <div>
                <div className="stat-value">{filteredQuestions.filter(q => q.difficulty === 'Kolay').length}</div>
                <div className="stat-label">Kolay</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🟡</span>
              <div>
                <div className="stat-value">{filteredQuestions.filter(q => q.difficulty === 'Orta').length}</div>
                <div className="stat-label">Orta</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🔴</span>
              <div>
                <div className="stat-value">{filteredQuestions.filter(q => q.difficulty === 'Zor').length}</div>
                <div className="stat-label">Zor</div>
              </div>
            </div>
          </div>

          {/* Soru Grid */}
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Sorular yükleniyor...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>Henüz soru yok</h3>
              <p>İlk soruyu eklemek için yukarıdaki butona tıklayın</p>
            </div>
          ) : (
            <div className="question-grid">
              {filteredQuestions.map((q) => {
                const diffConfig = difficultyConfig[q.difficulty] || difficultyConfig['Orta'];
                const typeConfig = questionTypeConfig[q.questionType] || questionTypeConfig['test'];

                return (
                  <div key={q._id} className="question-card" data-difficulty={q.difficulty}>
                    <div className="question-card-header">
                      <div className="question-badges">
                        <span className="badge badge-difficulty" style={{ background: diffConfig.color }}>
                          {diffConfig.emoji} {diffConfig.label}
                        </span>
                        <span className="badge badge-type" style={{ background: typeConfig.color }}>
                          {typeConfig.emoji} {typeConfig.label}
                        </span>
                        {q.learningOutcome && (
                          <span
                            className="badge badge-outcome"
                            style={{ background: '#2563eb' }}
                            title="Kazanım / Öğrenme Çıktısı"
                          >
                            🎯 {q.learningOutcome.length > 40 ? q.learningOutcome.slice(0, 40) + '…' : q.learningOutcome}
                          </span>
                        )}
                        {Array.isArray(q.hints) && q.hints.filter(Boolean).length > 0 && (
                          <span className="badge" style={{ background: '#06b6d4' }} title="İpucu sayısı">
                            💡 {q.hints.filter(Boolean).length}
                          </span>
                        )}
                      </div>
                      <div className="question-class">{q.classLevel}</div>
                    </div>

                    <div className="question-content">
                      <div className="question-text" data-color-mode="light">
                        <MDEditor.Markdown
                          source={q.text}
                          rehypePlugins={[rehypeKatex]}
                          remarkPlugins={[remarkMath]}
                        />
                      </div>
                      
                      {q.questionType === 'test' && q.options && (
                        <div className="question-options">
                          {q.options.map((opt, idx) => (
                            <div
                              key={idx}
                              className={`option-pill ${opt === q.correctAnswer ? 'correct' : ''}`}
                            >
                              <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                              {opt}
                              {q.optionRationales && q.optionRationales[idx] && (
                                <span className="option-rationale">— {q.optionRationales[idx]}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.questionType === 'interactive' && q.interactionKind === 'match' && (
                        <MatchQuestion items={q.interactionConfig?.items || []} readOnly />
                      )}
                      {q.questionType === 'interactive' && q.interactionKind === 'anagram' && (
                        <AnagramQuestion solution={q.interactionConfig?.solution} scrambled={q.interactionConfig?.scrambled} readOnly />
                      )}
                      {q.questionType === 'interactive' && q.interactionKind === 'memory' && (
                        <MemoryQuestion cards={q.interactionConfig?.cards || []} readOnly />
                      )}
                      {q.questionType === 'interactive' && q.interactionKind === 'grouping' && (
                        <GroupingQuestion groups={q.interactionConfig?.groups || []} items={q.interactionConfig?.items || []} readOnly />
                      )}
                    </div>

                    <div className="question-footer">
                      <div className="question-meta">
                        <span className="meta-tag">📖 {q.topic}</span>
                      </div>
                      <div className="question-actions">
                        <button className="btn-icon btn-edit" onClick={() => handleEdit(q)} title="Düzenle">
                          ✏️
                        </button>
                        <button className="btn-icon btn-delete" onClick={() => handleDelete(q._id)} title="Sil">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {view === 'wizard' && (
        <div className="wizard-container">
          <div className="wizard-progress">
            <div className={`wizard-step ${wizardStep >= 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div>
              <div className="step-label">Bilgiler</div>
            </div>
            <div className="wizard-line"></div>
            <div className={`wizard-step ${wizardStep >= 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div>
              <div className="step-label">Soru</div>
            </div>
            <div className="wizard-line"></div>
            <div className={`wizard-step ${wizardStep >= 3 ? 'active' : ''}`}>
              <div className="step-circle">3</div>
              <div className="step-label">Çözüm</div>
            </div>
          </div>

          <div className="wizard-content">
            {wizardStep === 1 && (
              <div className="wizard-panel">
                <h2 className="wizard-title">📋 Soru Bilgileri</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Ders</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      {curriculumData.dersler.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Sınıf Seviyesi</label>
                    <select
                      value={formData.classLevel}
                      onChange={(e) => setFormData({ ...formData, classLevel: e.target.value })}
                      required
                    >
                      <option value="">Seçin...</option>
                      {curriculumData.siniflar.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Konu</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      required
                    >
                      {curriculumData.konular.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Kazanım (Öğrenme Çıktısı)</label>
                    <input
                      type="text"
                      placeholder="Örn: Aritmetik dizilerde genel terimi hesaplar."
                      value={formData.learningOutcome}
                      onChange={(e) => setFormData({ ...formData, learningOutcome: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Soru Tipi</label>
                    <div className="type-selector">
                      {Object.entries(questionTypeConfig).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          className={`type-btn ${formData.questionType === key ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, questionType: key })}
                        >
                          <span>{config.emoji}</span>
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Zorluk Seviyesi</label>
                    <div className="difficulty-selector">
                      {Object.entries(difficultyConfig).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          className={`diff-btn ${formData.difficulty === key ? 'active' : ''}`}
                          style={{ borderColor: config.color }}
                          onClick={() => setFormData({ ...formData, difficulty: key })}
                        >
                          <span>{config.emoji}</span>
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Şablondan doldur */}
                <div className="templates-bar">
                  <div className="templates-title">Şablondan doldur:</div>
                  <div className="templates-list">
                    {QUESTION_TEMPLATES.map(t => (
                      <button
                        key={t.key}
                        type="button"
                        className="template-btn"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          ...t.payload,
                          classLevel: prev.classLevel // sınıfı koru
                        }))}
                        title={t.label}
                      >
                        📦 {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="wizard-panel">
                <h2 className="wizard-title">✍️ Soru Metni</h2>
                
                <div className="form-group">
                  <label>Soru (Markdown & LaTeX destekli)</label>
                  <div data-color-mode="light">
                    <MDEditor
                      value={formData.text}
                      onChange={(value) => setFormData({ ...formData, text: value || '' })}
                      height={300}
                      previewOptions={{
                        rehypePlugins: [rehypeKatex],
                        remarkPlugins: [remarkMath]
                      }}
                    />
                  </div>
                  <div className="helper-text">
                    💡 Matematik için $ işareti kullanın: $x^2 + 5 = 30$
                  </div>
                </div>

                {formData.questionType === 'test' && (
                  <div className="options-section">
                    <label>Seçenekler</label>
                    <div className="options-grid">
                      {formData.options.map((opt, idx) => (
                        <div key={idx} className="option-input">
                          <span className="option-label">{String.fromCharCode(65 + idx)}</span>
                          <input
                            type="text"
                            placeholder={`Seçenek ${String.fromCharCode(65 + idx)}`}
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[idx] = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                          />
                          <textarea
                            className="rationale-input"
                            placeholder="Gerekçe (öğrencilerin düşebileceği hata)"
                            value={formData.optionRationales[idx]}
                            onChange={(e) => {
                              const newRats = [...formData.optionRationales];
                              newRats[idx] = e.target.value;
                              setFormData({ ...formData, optionRationales: newRats });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="form-group">
                      <label>Doğru Cevap</label>
                      <select
                        value={formData.correctAnswer}
                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                        required
                      >
                        <option value="">Seçin...</option>
                        {formData.options.filter(o => o).map((opt, idx) => (
                          <option key={idx} value={opt}>
                            {String.fromCharCode(65 + idx)} - {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.questionType !== 'test' && formData.questionType !== 'interactive' && (
                  <div className="form-group">
                    <label>Doğru Cevap</label>
                    <input
                      type="text"
                      placeholder="Doğru cevabı yazın..."
                      value={formData.correctAnswer}
                      onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                      required
                    />
                  </div>
                )}

                {formData.questionType === 'interactive' && (
                  <div className="interactive-section">
                    <label>Etkileşim Türü</label>
                    <div className="interaction-selector">
                      {[
                        { kind: 'match', emoji: '🔗', label: 'Eşleştir' },
                        { kind: 'anagram', emoji: '🔤', label: 'Anagram' },
                        { kind: 'memory', emoji: '🃏', label: 'Hafıza' },
                        { kind: 'grouping', emoji: '📦', label: 'Gruplama' }
                      ].map(t => (
                        <button
                          key={t.kind}
                          type="button"
                          className={`interaction-btn ${formData.interactionKind === t.kind ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, interactionKind: t.kind })}
                        >
                          <span>{t.emoji}</span>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {formData.interactionKind === 'match' && (
                      <div className="config-editor">
                        <label>Eşleştirme Çiftleri</label>
                        {(formData.interactionConfig?.items || []).map((it, idx) => (
                          <div key={idx} className="pair-row">
                            <input
                              type="text"
                              placeholder="Sol"
                              value={it.left || ''}
                              onChange={e => {
                                const arr = [...(formData.interactionConfig?.items || [])];
                                arr[idx] = { ...arr[idx], left: e.target.value };
                                setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, items: arr } });
                              }}
                            />
                            <span>↔</span>
                            <input
                              type="text"
                              placeholder="Sağ"
                              value={it.right || ''}
                              onChange={e => {
                                const arr = [...(formData.interactionConfig?.items || [])];
                                arr[idx] = { ...arr[idx], right: e.target.value };
                                setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, items: arr } });
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const arr = (formData.interactionConfig?.items || []).filter((_, i) => i !== idx);
                                setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, items: arr } });
                              }}
                              className="btn-icon btn-delete"
                            >
                              ✖
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-pair"
                          onClick={() => {
                            const arr = [...(formData.interactionConfig?.items || []), { id: Date.now().toString(), left: '', right: '' }];
                            setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, items: arr } });
                          }}
                        >
                          ➕ Çift Ekle
                        </button>
                      </div>
                    )}

                    {formData.interactionKind === 'anagram' && (
                      <div className="config-editor">
                        <div className="form-group">
                          <label>Çözüm (Doğru Kelime)</label>
                          <input
                            type="text"
                            placeholder="ör: PARABOL"
                            value={formData.interactionConfig?.solution || ''}
                            onChange={e => setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, solution: e.target.value } })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Karışık Hali (otomatik oluşturulabilir)</label>
                          <input
                            type="text"
                            placeholder="LAPAROB"
                            value={formData.interactionConfig?.scrambled || ''}
                            onChange={e => setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, scrambled: e.target.value } })}
                          />
                          <button
                            type="button"
                            className="btn-shuffle"
                            onClick={() => {
                              const sol = formData.interactionConfig?.solution || '';
                              const shuffled = sol.split('').sort(() => 0.5 - Math.random()).join('');
                              setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, scrambled: shuffled } });
                            }}
                          >
                            🔀 Karıştır
                          </button>
                        </div>
                      </div>
                    )}

                    {formData.interactionKind === 'memory' && (
                      <div className="config-editor">
                        <label>Kart Çiftleri (pairId aynı olacak)</label>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Her çift için 2 kart ekleyin ve aynı pairId verin.</p>
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...(formData.interactionConfig?.cards || []), { id: Date.now().toString(), pairId: 'p1', content: '' }];
                            setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, cards: arr } });
                          }}
                        >
                          ➕ Kart Ekle
                        </button>
                      </div>
                    )}

                    {formData.interactionKind === 'grouping' && (
                      <div className="config-editor">
                        <label>Gruplar ve Öğeler</label>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Önce gruplar tanımlayın, sonra öğeleri ekleyip groupId verin.</p>
                        <button
                          type="button"
                          onClick={() => {
                            const arr = [...(formData.interactionConfig?.groups || []), { id: 'g' + Date.now(), name: '' }];
                            setFormData({ ...formData, interactionConfig: { ...formData.interactionConfig, groups: arr } });
                          }}
                        >
                          ➕ Grup Ekle
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizardStep === 3 && (
              <div className="wizard-panel">
                <h2 className="wizard-title">🎯 Çözüm</h2>
                
                <div className="form-group">
                  <label>Çözüm Adımları (İsteğe Bağlı)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <button 
                      type="button" 
                      className="btn-wizard" 
                      onClick={handleGenerateAI} 
                      disabled={aiBusy || !hasToken}
                      title={!hasToken ? 'Giriş yapın: AI çözüm için yetki gerekli' : ''}
                    >
                      {aiBusy ? '⏳ Üretiliyor…' : '🤖 Yapay Zeka ile Doldur'}
                    </button>
                    {!hasToken && (
                      <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>
                        🔒 AI çözüm için giriş yapmalısınız.
                      </span>
                    )}
                    {aiError && <span className="alert-error" style={{ margin: 0 }}>{aiError}</span>}
                  </div>
                  <div data-color-mode="light">
                    <MDEditor
                      value={formData.solutionText}
                      onChange={(value) => setFormData({ ...formData, solutionText: value || '' })}
                      height={300}
                      previewOptions={{
                        rehypePlugins: [rehypeKatex],
                        remarkPlugins: [remarkMath]
                      }}
                    />
                  </div>
                </div>

                {/* İpuçları */}
                <div className="form-group">
                  <label>İpuçları (kademeli)</label>
                  <div className="hint-editor">
                    {formData.hints.map((h, i) => (
                      <div key={i} className="hint-row">
                        <span className="hint-index">{i+1}.</span>
                        <input
                          type="text"
                          placeholder="Kısa ipucu yazın..."
                          value={h}
                          onChange={(e) => {
                            const arr = [...formData.hints];
                            arr[i] = e.target.value;
                            setFormData({ ...formData, hints: arr });
                          }}
                        />
                        <button
                          type="button"
                          className="hint-del"
                          onClick={() => setFormData({ ...formData, hints: formData.hints.filter((_, idx) => idx !== i) })}
                          disabled={formData.hints.length <= 1}
                          title="İpucunu sil"
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="hint-add"
                      onClick={() => setFormData({ ...formData, hints: [...formData.hints, ''] })}
                    >
                      ➕ İpucu Ekle
                    </button>
                  </div>
                </div>

                <div className="preview-card">
                  <h3>Önizleme</h3>
                  <div className="preview-difficulty">
                    {difficultyConfig[formData.difficulty]?.emoji} {formData.difficulty}
                  </div>
                  <div className="preview-text" data-color-mode="light">
                    <MDEditor.Markdown
                      source={formData.text}
                      rehypePlugins={[rehypeKatex]}
                      remarkPlugins={[remarkMath]}
                    />
                  </div>
                  <div className="preview-correct">
                    ✓ Doğru Cevap: <strong>{formData.correctAnswer}</strong>
                  </div>
                  {formData.hints.filter(Boolean).length > 0 && (
                    <div className="hint-list">
                      <div className="hint-title">💡 İpuçları</div>
                      <ul>
                        {formData.hints.filter(Boolean).map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="wizard-actions">
            {wizardStep > 1 && (
              <button className="btn-wizard btn-back" onClick={handleWizardBack}>
                ← Geri
              </button>
            )}
            <div style={{ flex: 1 }}></div>
            {wizardStep < 3 ? (
              <button className="btn-wizard btn-next" onClick={handleWizardNext}>
                İleri →
              </button>
            ) : (
              <button className="btn-wizard btn-submit" onClick={handleSubmit}>
                {editingId ? '✓ Güncelle' : '🎉 Kaydet'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionPoolNew;
