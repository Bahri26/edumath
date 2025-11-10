// frontend-react/src/pages/student/StudentResults.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../assets/styles/TeacherPages.css';

const API_URL = 'http://localhost:8000/api/results';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      if (!token || !user.id) {
        setError('Giriş yapmalısınız.');
        setLoading(false);
        return;
      }
      try {
        // Backend'den öğrenciye ait sonuçları çek
        const resp = await axios.get(`${API_URL}/student/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setResults(resp.data);
      } catch (e) {
        console.error('Sonuçlar yüklenemedi:', e);
        setError('Sonuçlar yüklenemedi. Backend çalışıyor mu?');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [token, user.id]);

  const calculateGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: '#10b981', emoji: '🌟' };
    if (score >= 80) return { grade: 'A', color: '#22c55e', emoji: '⭐' };
    if (score >= 70) return { grade: 'B', color: '#3b82f6', emoji: '👍' };
    if (score >= 60) return { grade: 'C', color: '#f59e0b', emoji: '👌' };
    return { grade: 'D', color: '#ef4444', emoji: '💪' };
  };

  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <div className="title">
          <span>📈</span>
          <h1>Sonuçlarım</h1>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Sonuçlar yükleniyor...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>Henüz sonuç yok</h3>
          <p>Sınav çözünce sonuçların burada görünecek.</p>
        </div>
      ) : (
        <div className="results-grid">
          {results.map(result => {
            const gradeInfo = calculateGrade(result.score);
            return (
              <div key={result._id} className="result-card">
                <div className="result-header">
                  <h3>{result.exam?.title || 'Sınav'}</h3>
                  <span className="grade-badge" style={{ background: gradeInfo.color }}>
                    {gradeInfo.emoji} {gradeInfo.grade}
                  </span>
                </div>
                <div className="result-body">
                  <div className="score-display">
                    <div className="score-circle" style={{ borderColor: gradeInfo.color }}>
                      <span className="score-value">{result.score}</span>
                      <span className="score-max">/100</span>
                    </div>
                  </div>
                  <div className="result-stats">
                    <div className="stat">
                      <span className="stat-label">Doğru</span>
                      <span className="stat-value" style={{ color: '#10b981' }}>✓ {result.correctAnswers || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Yanlış</span>
                      <span className="stat-value" style={{ color: '#ef4444' }}>✗ {result.wrongAnswers || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Boş</span>
                      <span className="stat-value" style={{ color: '#94a3b8' }}>⊘ {result.emptyAnswers || 0}</span>
                    </div>
                  </div>
                  <div className="result-date">
                    📅 {new Date(result.completedAt || result.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx="true">{`
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .result-card {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
        }
        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 12px rgba(0,0,0,0.1);
        }
        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f3f4f6;
        }
        .result-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #1f2937;
        }
        .grade-badge {
          padding: 0.5rem 1rem;
          border-radius: 999px;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
        }
        .result-body {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .score-display {
          display: flex;
          justify-content: center;
          margin: 1rem 0;
        }
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 6px solid;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
        }
        .score-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1f2937;
        }
        .score-max {
          font-size: 0.9rem;
          color: #6b7280;
        }
        .result-stats {
          display: flex;
          justify-content: space-around;
          gap: 1rem;
        }
        .stat {
          text-align: center;
        }
        .stat-label {
          display: block;
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }
        .stat-value {
          display: block;
          font-size: 1.1rem;
          font-weight: 700;
        }
        .result-date {
          text-align: center;
          font-size: 0.85rem;
          color: #6b7280;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
