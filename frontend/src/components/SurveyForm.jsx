
import React, { useState, useEffect } from 'react';

// API URL'leri (gerekirse .env'den alınabilir)
const API_BASE = '/api/surveys';
const SURVEY_ID = 1; // Örnek: 1 numaralı anket

function SurveyForm({ surveyId = SURVEY_ID, onSubmit }) {
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSurvey() {
      setLoading(true);
      try {
        const sRes = await fetch(`${API_BASE}/${surveyId}`);
        const sData = await sRes.json();
        setSurvey(sData);
        const qRes = await fetch(`${API_BASE}/${surveyId}/questions`);
        const qData = await qRes.json();
        setQuestions(qData);
      } catch (err) {
        setError('Anket yüklenemedi.');
      } finally {
        setLoading(false);
      }
    }
    fetchSurvey();
  }, [surveyId]);

  const handleChange = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    try {
      const payload = {
        user_id: null, // Gerekirse kullanıcı id eklenebilir
        answers: questions.map(q => ({
          question_id: q.id,
          answer: answers[q.id] || ''
        }))
      };
      await fetch(`${API_BASE}/${surveyId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (onSubmit) onSubmit(answers);
    } catch (err) {
      setError('Yanıtlar kaydedilemedi.');
    }
  };

  if (loading) return <div>Anket yükleniyor...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!survey) return <div>Anket bulunamadı.</div>;

  return (
    <div className="max-w-xl mx-auto p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">{survey.title}</h2>
      <p className="mb-4">{survey.description}</p>
      <form onSubmit={handleSubmit}>
        {questions.map((q) => (
          <div key={q.id} className="mb-4">
            <label className="block font-medium mb-1">{q.question_text}</label>
            {q.question_type === 'radio' && q.options && Array.isArray(q.options) && (
              <div className="space-y-1">
                {q.options.map((opt, i) => (
                  <label key={i} className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={() => handleChange(q.id, opt)}
                      className="mr-2"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
            {q.question_type === 'text' && (
              <textarea
                className="w-full border rounded p-2"
                rows={2}
                value={answers[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={submitted}
        >
          Gönder
        </button>
        {submitted && <div className="mt-2 text-green-600">Yanıtlarınız kaydedildi!</div>}
      </form>
    </div>
  );
}

export default SurveyForm;
