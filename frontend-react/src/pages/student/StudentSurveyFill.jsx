// frontend-react/src/pages/student/StudentSurveyFill.jsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { getSurveyPublic, submitSurveyAnswer } from '../../services/surveyService';

function StudentSurveyFill() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState({}); // { [questionId]: value }
  const [freeText, setFreeText] = useState('');
  const [success, setSuccess] = useState(null);

  const fetchSurvey = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSurveyPublic(id);
      setSurvey(data);
    } catch (err) {
      console.error('getSurveyPublic failed', err);
      setError('Anket yüklenemedi veya erişim yetkiniz yok.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const handleChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      let payload;
      if (Array.isArray(survey?.questions) && survey.questions.length > 0) {
        payload = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
      } else {
        payload = [{ questionId: 'free', value: freeText }];
      }
      await submitSurveyAnswer(id, payload);
      setSuccess('Yanıtınız kaydedildi.');
      setTimeout(() => navigate('/student/surveys'), 800);
    } catch (err) {
      console.error('submitSurveyAnswer failed', err);
      setError(err?.response?.data?.message || 'Yanıt kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="teacher-page-container">
      <PageHeader title="Anketi Doldur">
        <button className="kids-btn secondary" onClick={() => navigate(-1)}>Geri</button>
      </PageHeader>

      {loading ? (
        <div className="page-card">
          <div className="skeleton text mb-1" style={{ width: '50%' }}></div>
          <div className="skeleton text mb-1" style={{ width: '60%' }}></div>
          <div className="skeleton text" style={{ width: '40%' }}></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger page-card">{error}</div>
      ) : !survey ? (
        <div className="page-card">Anket bulunamadı.</div>
      ) : (
        <form onSubmit={handleSubmit} className="page-card flex-col gap-2">
          <h2 className="mb-1">{survey.title}</h2>

          {Array.isArray(survey.questions) && survey.questions.length > 0 ? (
            <div className="flex-col gap-2">
              {survey.questions.map(q => (
                <div key={q.qid} className="form-group flex-col gap-1">
                  <label>{q.text}</label>
                  {q.type === 'text' && (
                    <textarea rows={3} value={answers[q.qid] || ''} onChange={(e) => handleChange(q.qid, e.target.value)} />
                  )}
                  {q.type === 'single' && (
                    <select value={answers[q.qid] || ''} onChange={(e) => handleChange(q.qid, e.target.value)}>
                      <option value="">Seçiniz</option>
                      {(q.options || []).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                  {q.type === 'multi' && (
                    <div className="flex-col gap-1">
                      {(q.options || []).map(opt => {
                        const arr = Array.isArray(answers[q.qid]) ? answers[q.qid] : [];
                        const checked = arr.includes(opt);
                        return (
                          <label key={opt} className="flex-row gap-1" style={{ alignItems: 'center' }}>
                            <input type="checkbox" checked={checked} onChange={(e) => {
                              const prev = Array.isArray(answers[q.qid]) ? answers[q.qid] : [];
                              const next = e.target.checked ? [...prev, opt] : prev.filter(x => x !== opt);
                              handleChange(q.qid, next);
                            }} />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="form-group flex-col gap-1">
              <label>Yanıtınız</label>
              <textarea rows={4} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Görüşlerinizi yazın" />
            </div>
          )}

          {success && <div className="alert alert-success">{success}</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="flex-row gap-1">
            <button type="button" className="kids-btn secondary" onClick={() => navigate('/student/surveys')}>İptal</button>
            <button type="submit" disabled={submitting} className="kids-btn primary">{submitting ? 'Gönderiliyor...' : 'Gönder'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default StudentSurveyFill;
