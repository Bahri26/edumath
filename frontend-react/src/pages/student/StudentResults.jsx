// frontend-react/src/pages/student/StudentResults.jsx
import React, { useEffect, useState } from 'react';
import { getStudentResults } from '../../services/studentService';
import PageHeader from '../../components/ui/common/PageHeader';
import './StudentResults.css';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError('Giriş yapmalısınız.');
        setLoading(false);
        return;
      }
      try {
        // Backend'den öğrencinin kendi sonuçlarını çek (user.id parametresi artık gerekmiyor)
        const data = await getStudentResults();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Sonuçlar yüklenemedi:', e);
        setError(e.response?.data?.message || 'Sonuçlar yüklenemedi. Backend çalışıyor mu?');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [token]);

  const calculateGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: '#10b981', emoji: '🌟', avatar: '🎓', message: 'Muhteşem! Süpersin!' };
    if (score >= 80) return { grade: 'A', color: '#22c55e', emoji: '⭐', avatar: '😊', message: 'Harika! Tebrikler!' };
    if (score >= 70) return { grade: 'B', color: '#3b82f6', emoji: '👍', avatar: '😃', message: 'İyi iş çıkardın!' };
    if (score >= 60) return { grade: 'C', color: '#f59e0b', emoji: '👌', avatar: '🙂', message: 'Fena değil, devam et!' };
    return { grade: 'D', color: '#ef4444', emoji: '💪', avatar: '😔', message: 'Çalışmaya devam, başarırsın!' };
  };

  const calculateStats = () => {
    if (results.length === 0) return { avgScore: 0, totalExams: 0, bestScore: 0, recentTrend: 'neutral' };
    
    const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
    const bestScore = Math.max(...results.map(r => r.score));
    
    // Son 3 sınavın trend analizi
    const recent = results.slice(-3);
    let trend = 'neutral';
    if (recent.length >= 2) {
      const first = recent[0].score;
      const last = recent[recent.length - 1].score;
      if (last > first + 10) trend = 'up';
      else if (last < first - 10) trend = 'down';
    }
    
    return { avgScore, totalExams: results.length, bestScore, recentTrend: trend };
  };

  const stats = calculateStats();

  return (
    <div className="student-results-container">
      <PageHeader title="📊 Sınav Sonuçlarım">
        <div className="header-user-info">
          <div className="user-avatar">
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : '👤'}
          </div>
          <span className="user-name">{user.firstName || 'Öğrenci'}</span>
        </div>
      </PageHeader>

      {error && (
        <div className="results-error-alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="results-loading">
          <div className="loading-avatar">📚</div>
          <div className="loading-text">Sonuçlar yükleniyor...</div>
          <div className="loading-spinner"></div>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-results-state">
          <div className="empty-avatar">📊</div>
          <h3>Henüz Sınav Sonucu Yok</h3>
          <p>Sınav çözünce sonuçların burada görünecek.</p>
          <div className="encouragement-message">
            <span className="encouragement-icon">💪</span>
            <span>Hazırsan ilk sınavını çözmeye başla!</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="results-stats-overview">
            <div className="stat-overview-card total">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-value">{stats.totalExams}</div>
                <div className="stat-label">Toplam Sınav</div>
              </div>
            </div>
            
            <div className="stat-overview-card average">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{stats.avgScore}</div>
                <div className="stat-label">Ortalama</div>
              </div>
            </div>
            
            <div className="stat-overview-card best">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-value">{stats.bestScore}</div>
                <div className="stat-label">En İyi Puan</div>
              </div>
            </div>
            
            <div className={`stat-overview-card trend ${stats.recentTrend}`}>
              <div className="stat-icon">
                {stats.recentTrend === 'up' && '📈'}
                {stats.recentTrend === 'down' && '📉'}
                {stats.recentTrend === 'neutral' && '➡️'}
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {stats.recentTrend === 'up' && 'Yükseliş'}
                  {stats.recentTrend === 'down' && 'Düşüş'}
                  {stats.recentTrend === 'neutral' && 'Stabil'}
                </div>
                <div className="stat-label">Trend</div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="results-grid">
            {results.map((result, index) => {
              const gradeInfo = calculateGrade(result.score);
              return (
                <div 
                  key={result._id} 
                  className="result-card"
                  style={{ '--card-color': gradeInfo.color, '--animation-delay': `${index * 0.1}s` }}
                  onClick={() => setSelectedResult(selectedResult?._id === result._id ? null : result)}
                >
                  {/* Card Header with Avatar */}
                  <div className="result-card-header">
                    <div className="result-avatar-wrapper">
                      <div className="result-avatar" style={{ background: gradeInfo.color }}>
                        {gradeInfo.avatar}
                      </div>
                      <div className="avatar-pulse"></div>
                    </div>
                    <div className="result-grade-badge" style={{ background: gradeInfo.color }}>
                      {gradeInfo.emoji} {gradeInfo.grade}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="result-card-body">
                    <h3 className="result-exam-title">{result.exam?.title || 'Sınav'}</h3>
                    
                    <div className="result-score-display">
                      <div className="score-circle" style={{ '--score-color': gradeInfo.color, '--score-percent': result.score }}>
                        <svg className="score-ring-svg" viewBox="0 0 120 120">
                          <circle className="score-ring-bg" cx="60" cy="60" r="52" />
                          <circle className="score-ring-progress" cx="60" cy="60" r="52" 
                            style={{ 
                              strokeDasharray: `${result.score * 3.27} 327`,
                              stroke: gradeInfo.color 
                            }}
                          />
                        </svg>
                        <div className="score-value">
                          <span className="score-number">{result.score}</span>
                          <span className="score-max">/100</span>
                        </div>
                      </div>
                    </div>

                    <div className="result-message" style={{ color: gradeInfo.color }}>
                      {gradeInfo.message}
                    </div>

                    {/* Stats Grid */}
                    <div className="result-stats-grid">
                      <div className="result-stat correct">
                        <div className="stat-icon-small">✓</div>
                        <div className="stat-value-small">{result.correctAnswers || 0}</div>
                        <div className="stat-label-small">Doğru</div>
                      </div>
                      <div className="result-stat wrong">
                        <div className="stat-icon-small">✗</div>
                        <div className="stat-value-small">{result.wrongAnswers || 0}</div>
                        <div className="stat-label-small">Yanlış</div>
                      </div>
                      <div className="result-stat empty">
                        <div className="stat-icon-small">○</div>
                        <div className="stat-value-small">{result.emptyAnswers || 0}</div>
                        <div className="stat-label-small">Boş</div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="result-date">
                      📅 {new Date(result.completedAt || result.createdAt).toLocaleDateString('tr-TR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>

                    {/* Expand Details */}
                    {selectedResult?._id === result._id && (
                      <div className="result-details-expanded">
                        <div className="detail-row">
                          <span className="detail-label">Süre:</span>
                          <span className="detail-value">{result.completionTime ? `${Math.floor(result.completionTime / 60)} dk` : 'Bilinmiyor'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Başarı Oranı:</span>
                          <span className="detail-value">{result.score}%</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Toplam Soru:</span>
                          <span className="detail-value">{(result.correctAnswers || 0) + (result.wrongAnswers || 0) + (result.emptyAnswers || 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}