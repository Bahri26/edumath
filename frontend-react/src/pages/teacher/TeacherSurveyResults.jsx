// frontend-react/src/pages/teacher/TeacherSurveyResults.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { getSurvey, getSurveyResults } from '../../services/surveyService';

function TeacherSurveyResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [surveyData, resultsData] = await Promise.all([
        getSurvey(id),
        getSurveyResults(id)
      ]);
      setSurvey(surveyData);
      setResults(resultsData);
    } catch (err) {
      console.error('fetch survey results failed', err);
      setError('Anket sonuçları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aggregateAnswers = (questionId, questionType) => {
    if (!results || !results.responses) return {};
    const freq = {};
    results.responses.forEach(resp => {
      const ans = (resp.answers || []).find(a => a.questionId === questionId);
      if (ans) {
        if (questionType === 'multi' && Array.isArray(ans.value)) {
          ans.value.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
        } else {
          const key = String(ans.value || '(boş)');
          freq[key] = (freq[key] || 0) + 1;
        }
      }
    });
    return freq;
  };

  return (
    <div className="teacher-page-container">
      <PageHeader title="Anket Sonuçları">
        <button className="kids-btn secondary" onClick={() => navigate('/teacher/surveys')}>Geri</button>
        <button className="kids-btn primary" onClick={fetchData}><i className="fas fa-sync me-1"></i>Yenile</button>
      </PageHeader>

      {loading ? (
        <div className="page-card">
          <div className="skeleton text mb-2" style={{ width: '50%' }}></div>
          <div className="skeleton text mb-1" style={{ width: '30%' }}></div>
          <div className="skeleton text" style={{ width: '40%' }}></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger page-card">{error}</div>
      ) : !survey ? (
        <div className="page-card">Anket bulunamadı.</div>
      ) : (
        <div className="flex-col gap-2">
          <div className="page-card">
            <h2 className="mb-1">{survey.title}</h2>
            <div className="flex-row gap-1 mb-1">
              <span className={`badge ${survey.status === 'active' ? 'success' : 'danger'}`}>{survey.status === 'active' ? 'Aktif' : 'Kapalı'}</span>
              <span className="badge neutral">{survey.targetClass?.name || 'Tüm Sınıflar'}</span>
            </div>
            <p className="text-small">Toplam yanıt: {results?.count || 0}</p>
          </div>

          {(!survey.questions || survey.questions.length === 0) ? (
            <div className="page-card">
              <p className="text-muted">Bu ankette soru bulunmuyor. Serbest yanıtlar:</p>
              {results && results.responses && results.responses.length > 0 ? (
                <div className="flex-col gap-1 mt-2">
                  {results.responses.map((resp, idx) => {
                    const freeAnswer = (resp.answers || []).find(a => a.questionId === 'free');
                    return (
                      <div key={idx} className="page-card" style={{ padding: '0.5rem' }}>
                        <span className="text-small">{freeAnswer?.value || '(boş)'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted mt-1">Henüz yanıt yok.</p>
              )}
            </div>
          ) : (
            <div className="flex-col gap-2">
              {survey.questions.map((q, idx) => {
                const freq = aggregateAnswers(q.qid, q.type);
                const total = Object.values(freq).reduce((sum, v) => sum + v, 0);
                return (
                  <div key={q.qid || idx} className="page-card">
                    <h3 className="mb-1">Soru {idx+1}: {q.text}</h3>
                    <span className="badge neutral mb-1">{q.type === 'text' ? 'Metin' : q.type === 'single' ? 'Tek Seçim' : 'Çoklu Seçim'}</span>
                    {q.type === 'text' ? (
                      <div className="flex-col gap-1 mt-1">
                        {results && results.responses && results.responses.length > 0 ? (
                          results.responses.map((resp, ridx) => {
                            const ans = (resp.answers || []).find(a => a.questionId === q.qid);
                            return (
                              <div key={ridx} className="page-card" style={{ padding: '0.5rem' }}>
                                <span className="text-small">{ans?.value || '(boş)'}</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-muted">Yanıt yok.</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-col gap-1 mt-1">
                        {Object.keys(freq).length === 0 ? (
                          <p className="text-muted">Yanıt yok.</p>
                        ) : (
                          Object.entries(freq).map(([key, count]) => {
                            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
                            return (
                              <div key={key} className="flex-row gap-1" style={{ alignItems: 'center' }}>
                                <span style={{ flex: 1 }}>{key}</span>
                                <span className="badge neutral">{count}</span>
                                <span className="text-small">({pct}%)</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TeacherSurveyResults;
