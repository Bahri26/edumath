import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import '../../assets/styles/QuestionPoolNew.css';
import HintRevealer from '../../components/student/HintRevealer';

const API_URL = 'http://localhost:8000/api/questions';

const difficultyEmoji = {
  'Kolay': '🟢',
  'Orta': '🟡',
  'Zor': '🔴'
};

export default function AllQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', difficulty: '', subject: '' });
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const devLoginAsTestStudent = async () => {
    try {
      const resp = await axios.post('http://localhost:8000/api/auth/seed-test-student');
      const { token, user } = resp.data || {};
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Basit şekilde sayfayı yenile, context güncellensin
        window.location.reload();
      }
    } catch (e) {
      console.error('Test öğrenci girişi başarısız:', e);
      alert('Test öğrenci token alınamadı. Backend çalışıyor mu?');
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await axios.get(API_URL);
        setQuestions(resp.data);
      } catch (e) {
        console.error('Sorular çekilemedi:', e);
        setError('Sorular yüklenemedi. Sunucu çalışıyor mu?');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = questions.filter(q => {
    if (filters.search && !q.text.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.difficulty && q.difficulty !== filters.difficulty) return false;
    if (filters.subject && q.subject !== filters.subject) return false;
    return true;
  });

  return (
    <div className="question-pool-container">
      <div className="page-header">
        <div className="title">
          <span>👩‍🎓</span>
          <h1>Tüm Sorular</h1>
        </div>
        <div>
          <button className="btn-wizard" onClick={devLoginAsTestStudent} title="Geliştirme amaçlı hızlı giriş">
            🚀 Test öğrenciyle giriş yap
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

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
            <option value="Matematik">Matematik</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Sorular yükleniyor...</p>
        </div>
      ) : (
        <div className="question-grid">
          {filtered.map(q => (
            <div key={q._id} className="question-card">
              <div className="question-card-header">
                <div className="question-badges">
                  <span className="badge" style={{ background: '#64748b' }}>{q.subject}</span>
                  <span className="badge" style={{ background: '#334155' }}>{difficultyEmoji[q.difficulty] || '🟡'} {q.difficulty}</span>
                  {q.learningOutcome && (
                    <span className="badge badge-outcome" style={{ background: '#2563eb' }}>🎯 {q.learningOutcome}</span>
                  )}
                </div>
                <div className="question-class">{q.classLevel}</div>
              </div>
              <div className="question-content">
                <div className="question-text" data-color-mode="light">
                  <MDEditor.Markdown source={q.text} rehypePlugins={[rehypeKatex]} remarkPlugins={[remarkMath]} />
                </div>
                {q.questionType === 'test' && q.options && (
                  <div className="question-options">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className="option-pill">
                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
                {q.hints && q.hints.filter(Boolean).length > 0 && (
                  <HintRevealer hints={q.hints.filter(Boolean)} />
                )}
              </div>
              <div className="question-footer">
                <div className="question-meta">
                  <span className="meta-tag">📖 {q.topic}</span>
                </div>
                <button 
                  className="btn-wizard"
                  onClick={() => setSelectedQuestion(q)}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  🔍 Detay
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detay */}
      {selectedQuestion && (
        <div className="modal-overlay" onClick={() => setSelectedQuestion(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📖 Soru Detayı</h2>
              <button className="modal-close" onClick={() => setSelectedQuestion(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="question-badges" style={{ marginBottom: '1rem' }}>
                <span className="badge">{selectedQuestion.subject}</span>
                <span className="badge">{difficultyEmoji[selectedQuestion.difficulty]} {selectedQuestion.difficulty}</span>
                {selectedQuestion.learningOutcome && (
                  <span className="badge" style={{ background: '#2563eb' }}>🎯 {selectedQuestion.learningOutcome}</span>
                )}
              </div>
              <div data-color-mode="light">
                <MDEditor.Markdown source={selectedQuestion.text} rehypePlugins={[rehypeKatex]} remarkPlugins={[remarkMath]} />
              </div>
              {selectedQuestion.questionType === 'test' && selectedQuestion.options && (
                <div className="question-options" style={{ marginTop: '1rem' }}>
                  {selectedQuestion.options.map((opt, idx) => (
                    <div key={idx} className="option-pill">
                      <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
              {selectedQuestion.hints && selectedQuestion.hints.filter(Boolean).length > 0 && (
                <HintRevealer hints={selectedQuestion.hints.filter(Boolean)} />
              )}
              {selectedQuestion.solutionText && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                  <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>✅ Çözüm</h3>
                  <div data-color-mode="light">
                    <MDEditor.Markdown source={selectedQuestion.solutionText} rehypePlugins={[rehypeKatex]} remarkPlugins={[remarkMath]} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
