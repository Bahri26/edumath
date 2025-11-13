// frontend-react/src/pages/student/StudentExams.jsx
import React, { useEffect, useState } from 'react';
import { getExams } from '../../services/examService';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import './StudentExams.css';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, easy, medium, hard
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      setError(null);
      if (!token) {
        setError('Giriş yapmalısınız.');
        setLoading(false);
        return;
      }
      try {
        const data = await getExams();
        setExams(data);
      } catch (e) {
        console.error('Sınavlar yüklenemedi:', e);
        setError('Sınavlar yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [token]);

  const startExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  const getDifficultyLevel = (questionCount) => {
    if (questionCount <= 10) return 'easy';
    if (questionCount <= 20) return 'medium';
    return 'hard';
  };

  const getDifficultyInfo = (level) => {
    const info = {
      easy: { label: 'Kolay', color: '#27ae60', icon: '😊' },
      medium: { label: 'Orta', color: '#f39c12', icon: '🤔' },
      hard: { label: 'Zor', color: '#e74c3c', icon: '💪' }
    };
    return info[level] || info.easy;
  };

  const filteredExams = exams.filter(exam => {
    if (filter === 'all') return true;
    return getDifficultyLevel(exam.questions?.length || 0) === filter;
  });

  const examColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <div className="student-exams-container">
      <PageHeader title="📝 Sınavlarım">
        <div className="exams-stats-mini">
          <span className="stat-mini">📚 {exams.length} Sınav</span>
        </div>
      </PageHeader>

      {error && (
        <div className="exam-error-alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && exams.length > 0 && (
        <div className="exam-filters">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="filter-icon">📋</span>
            <span>Tümü ({exams.length})</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'easy' ? 'active' : ''}`}
            onClick={() => setFilter('easy')}
          >
            <span className="filter-icon">😊</span>
            <span>Kolay</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'medium' ? 'active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            <span className="filter-icon">🤔</span>
            <span>Orta</span>
          </button>
          <button 
            className={`filter-tab ${filter === 'hard' ? 'active' : ''}`}
            onClick={() => setFilter('hard')}
          >
            <span className="filter-icon">💪</span>
            <span>Zor</span>
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="exams-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="exam-card exam-skeleton">
              <div className="exam-header-skeleton">
                <div className="skeleton circle" style={{ width: '70px', height: '70px' }}></div>
                <div className="skeleton badge" style={{ width: '80px', height: '24px' }}></div>
              </div>
              <div className="exam-body-skeleton">
                <div className="skeleton text" style={{ width: '90%', height: '28px', marginBottom: '12px' }}></div>
                <div className="skeleton text" style={{ width: '100%', height: '16px', marginBottom: '8px' }}></div>
                <div className="skeleton text" style={{ width: '80%', height: '16px', marginBottom: '16px' }}></div>
                <div className="skeleton btn" style={{ width: '100%', height: '48px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="empty-exams-state">
          <div className="empty-icon">
            {filter === 'all' ? '📭' : '🔍'}
          </div>
          <h3>{filter === 'all' ? 'Henüz Sınav Yok' : 'Sınav Bulunamadı'}</h3>
          <p>
            {filter === 'all' 
              ? 'Öğretmeniniz size bir sınav atadığında burada görünecek.' 
              : 'Bu zorluk seviyesinde sınav bulunmuyor.'}
          </p>
          {filter !== 'all' && (
            <button className="kids-btn primary" onClick={() => setFilter('all')}>
              📋 Tüm Sınavları Gör
            </button>
          )}
        </div>
      ) : (
        <div className="exams-grid">
          {filteredExams.map((exam, index) => {
            const color = examColors[index % examColors.length];
            const questionCount = exam.questions?.length || 0;
            const difficulty = getDifficultyLevel(questionCount);
            const difficultyInfo = getDifficultyInfo(difficulty);
            const duration = exam.duration || 60;

            return (
              <div 
                key={exam._id} 
                className="exam-card"
                style={{ '--exam-color': color }}
              >
                <div className="exam-card-header">
                  <div className="exam-icon-wrapper">
                    <div className="exam-icon">📝</div>
                    <div className="exam-pulse"></div>
                  </div>
                  <div className="exam-badges">
                    <span className="exam-badge difficulty" style={{ background: difficultyInfo.color }}>
                      {difficultyInfo.icon} {difficultyInfo.label}
                    </span>
                  </div>
                </div>

                <div className="exam-card-body">
                  <h3 className="exam-title">{exam.title}</h3>
                  <p className="exam-description">
                    {exam.description || 'Başarılar! Elinden gelenin en iyisini yap.'}
                  </p>

                  <div className="exam-info-grid">
                    <div className="exam-info-item">
                      <div className="info-icon-circle" style={{ background: `${color}20`, color: color }}>
                        ❓
                      </div>
                      <div className="info-content">
                        <div className="info-value">{questionCount}</div>
                        <div className="info-label">Soru</div>
                      </div>
                    </div>

                    <div className="exam-info-item">
                      <div className="info-icon-circle" style={{ background: `${color}20`, color: color }}>
                        ⏱️
                      </div>
                      <div className="info-content">
                        <div className="info-value">{duration}</div>
                        <div className="info-label">Dakika</div>
                      </div>
                    </div>

                    <div className="exam-info-item">
                      <div className="info-icon-circle" style={{ background: `${color}20`, color: color }}>
                        📚
                      </div>
                      <div className="info-content">
                        <div className="info-value">{exam.subject || 'Genel'}</div>
                        <div className="info-label">Konu</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="exam-card-footer">
                  <button 
                    className="exam-start-btn"
                    onClick={() => startExam(exam._id)}
                    style={{ 
                      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                      boxShadow: `0 4px 12px ${color}40`
                    }}
                  >
                    <span className="btn-rocket">🚀</span>
                    <span className="btn-text">Sınava Başla</span>
                    <span className="btn-arrow">→</span>
                  </button>
                </div>

                {/* Decorative elements */}
                <div className="exam-decoration top" style={{ background: color }}></div>
                <div className="exam-decoration bottom" style={{ background: color }}></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
