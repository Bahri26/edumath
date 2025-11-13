import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { useAuth } from '../../hooks/useAuth';
import './StudentDashboard.css';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8000';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/student/assignments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setAssignments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        const msg = err?.response?.data?.message || 'Görevler yüklenemedi.';
        setError(msg);
        if (err?.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const total = assignments.length;
  const completed = assignments.filter(a => a?.completed).length;
  const pending = total - completed;
  const completionRate = Math.round((completed / (total || 1)) * 100);

  return (
    <div className="student-dashboard-container">
      <div className="dashboard-header-section">
        <PageHeader title={`🎓 Hoş Geldin ${user?.firstName || 'Öğrenci'}!`}>
          <div className="header-date">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </PageHeader>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card stat-total">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{total}</div>
            <div className="stat-label">Toplam Görev</div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="dashboard-stat-card stat-completed">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">✅</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{completed}</div>
            <div className="stat-label">Tamamlanan</div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="dashboard-stat-card stat-pending">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">⏰</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{pending}</div>
            <div className="stat-label">Bekleyen</div>
          </div>
          <div className="stat-decoration"></div>
        </div>

        <div className="dashboard-stat-card stat-rate">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🎯</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{completionRate}%</div>
            <div className="stat-label">Tamamlanma</div>
          </div>
          <div className="stat-decoration"></div>
          <div className="progress-ring">
            <svg width="60" height="60">
              <circle cx="30" cy="30" r="25" fill="none" stroke="#e0e0e0" strokeWidth="4"/>
              <circle 
                cx="30" 
                cy="30" 
                r="25" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="4"
                strokeDasharray={`${completionRate * 1.57} 157`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'assignments' ? 'active' : ''}`} 
          onClick={() => setActiveTab('assignments')}
        >
          <span className="tab-icon">📋</span>
          <span className="tab-label">Görevlerim</span>
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'progress' ? 'active' : ''}`} 
          onClick={() => setActiveTab('progress')}
        >
          <span className="tab-icon">📈</span>
          <span className="tab-label">İlerleme</span>
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'achievements' ? 'active' : ''}`} 
          onClick={() => setActiveTab('achievements')}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Başarılar</span>
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'leaderboard' ? 'active' : ''}`} 
          onClick={() => setActiveTab('leaderboard')}
        >
          <span className="tab-icon">👑</span>
          <span className="tab-label">Liderlik</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div className="loading-text">Yükleniyor...</div>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <div className="error-message">{error}</div>
          </div>
        )}

        {!loading && !error && activeTab === 'assignments' && (
          <div className="assignments-grid">
            {assignments.length === 0 ? (
              <div className="empty-state-dashboard">
                <div className="empty-icon">📚</div>
                <h3>Henüz Görevin Yok!</h3>
                <p>Öğretmenin yeni görevler atadığında burada görünecek.</p>
              </div>
            ) : (
              assignments.map((item, index) => {
                const assignmentColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
                const color = assignmentColors[index % assignmentColors.length];
                
                return (
                  <div key={item._id} className="assignment-card" style={{ '--card-color': color }}>
                    <div className="assignment-header">
                      <div className="assignment-icon">📝</div>
                      <span className={`assignment-status ${item.completed ? 'completed' : 'pending'}`}>
                        {item.completed ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                      </span>
                    </div>
                    
                    <div className="assignment-body">
                      <h3 className="assignment-title">{item.examTitle || item.examId?.title || 'Sınav'}</h3>
                      
                      <div className="assignment-info">
                        <div className="info-item">
                          <span className="info-icon">❓</span>
                          <span className="info-text">{item.questionCount || item.examId?.questions?.length || 0} Soru</span>
                        </div>
                        {item.dueDate && (
                          <div className="info-item">
                            <span className="info-icon">📅</span>
                            <span className="info-text">{new Date(item.dueDate).toLocaleDateString('tr-TR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="assignment-footer">
                      <button
                        className={`assignment-btn primary ${item.completed ? 'disabled' : ''}`}
                        onClick={() => navigate(`/student/exam/${item.examId?._id || item.examId}`)}
                        disabled={!!item.completed}
                      >
                        <span className="btn-icon">{item.completed ? '✓' : '🚀'}</span>
                        <span>{item.completed ? 'Tamamlandı' : 'Başla'}</span>
                      </button>
                      <button 
                        className="assignment-btn secondary" 
                        onClick={() => navigate(`/student/assignments/${item._id}`)}
                      >
                        <span className="btn-icon">👁️</span>
                        <span>Detay</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {!loading && !error && activeTab === 'progress' && (
          <div className="progress-section">
            <div className="progress-cards-grid">
              <div className="progress-card">
                <div className="progress-card-header">
                  <span className="progress-icon">📊</span>
                  <h3>Genel İlerleme</h3>
                </div>
                <div className="progress-card-body">
                  <div className="progress-visual">
                    <div className="circular-progress">
                      <div className="circle-value">{completionRate}%</div>
                    </div>
                  </div>
                  <p className="progress-description">Toplam görevlerinin <strong>{completionRate}%</strong>'ini tamamladın!</p>
                </div>
              </div>

              <div className="progress-card">
                <div className="progress-card-header">
                  <span className="progress-icon">📚</span>
                  <h3>Konu Bazlı İlerleme</h3>
                </div>
                <div className="progress-card-body">
                  <div className="subject-progress-list">
                    <div className="subject-item">
                      <span className="subject-name">Matematik</span>
                      <div className="subject-bar">
                        <div className="subject-fill" style={{ width: '75%', background: '#4ECDC4' }}></div>
                      </div>
                      <span className="subject-percent">75%</span>
                    </div>
                    <div className="subject-item">
                      <span className="subject-name">Geometri</span>
                      <div className="subject-bar">
                        <div className="subject-fill" style={{ width: '60%', background: '#FF6B6B' }}></div>
                      </div>
                      <span className="subject-percent">60%</span>
                    </div>
                    <div className="subject-item">
                      <span className="subject-name">Cebir</span>
                      <div className="subject-bar">
                        <div className="subject-fill" style={{ width: '85%', background: '#45B7D1' }}></div>
                      </div>
                      <span className="subject-percent">85%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="achievements-grid">
              <div className="achievement-card streak">
                <div className="achievement-icon">🔥</div>
                <div className="achievement-content">
                  <h3>Günlük Seri</h3>
                  <p>7 gün üst üste çalıştın!</p>
                  <div className="achievement-progress">
                    <div className="streak-days">
                      {['P', 'S', 'Ç', 'P', 'C', 'C', 'P'].map((day, i) => (
                        <div key={i} className={`streak-day ${i < 5 ? 'completed' : ''}`}>{day}</div>
                      ))}
                    </div>
                  </div>
                  <button className="achievement-btn">🎁 Ödülleri Gör</button>
                </div>
              </div>

              <div className="achievement-card badges">
                <div className="achievement-icon">🏅</div>
                <div className="achievement-content">
                  <h3>Rozetlerim</h3>
                  <p>5 rozet kazandın!</p>
                  <div className="badges-grid">
                    <div className="badge-item earned">🥇</div>
                    <div className="badge-item earned">⭐</div>
                    <div className="badge-item earned">🎯</div>
                    <div className="badge-item earned">💎</div>
                    <div className="badge-item earned">🚀</div>
                    <div className="badge-item locked">🔒</div>
                  </div>
                  <button className="achievement-btn">👀 Tümünü Gör</button>
                </div>
              </div>

              <div className="achievement-card recommendations">
                <div className="achievement-icon">💡</div>
                <div className="achievement-content">
                  <h3>Öneriler</h3>
                  <div className="recommendation-list">
                    <div className="recommendation-item">
                      <span className="rec-icon">📝</span>
                      <span className="rec-text">Bekleyen 3 görevin var</span>
                    </div>
                    <div className="recommendation-item">
                      <span className="rec-icon">🎯</span>
                      <span className="rec-text">Geometri konusunu tekrar et</span>
                    </div>
                    <div className="recommendation-item">
                      <span className="rec-icon">⏰</span>
                      <span className="rec-text">Yarın son gün!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === 'leaderboard' && (
          <div className="leaderboard-section">
            <div className="leaderboard-card">
              <div className="leaderboard-header">
                <h3>👑 Sınıf Sıralaması</h3>
                <div className="leaderboard-filter">
                  <button className="filter-btn active">Bu Hafta</button>
                  <button className="filter-btn">Bu Ay</button>
                  <button className="filter-btn">Tüm Zamanlar</button>
                </div>
              </div>
              
              <div className="leaderboard-list">
                {[
                  { rank: 1, name: 'Ahmet Y.', score: 950, avatar: '👦' },
                  { rank: 2, name: 'Ayşe K.', score: 920, avatar: '👧' },
                  { rank: 3, name: user?.firstName || 'Sen', score: 890, avatar: '🎓', isMe: true },
                  { rank: 4, name: 'Mehmet D.', score: 870, avatar: '👦' },
                  { rank: 5, name: 'Zeynep A.', score: 850, avatar: '👧' },
                ].map((player) => (
                  <div key={player.rank} className={`leaderboard-item ${player.isMe ? 'me' : ''} rank-${player.rank}`}>
                    <div className="player-rank">
                      {player.rank === 1 && '🥇'}
                      {player.rank === 2 && '🥈'}
                      {player.rank === 3 && '🥉'}
                      {player.rank > 3 && `#${player.rank}`}
                    </div>
                    <div className="player-avatar">{player.avatar}</div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-score">⭐ {player.score} puan</div>
                    </div>
                    {player.isMe && <div className="me-badge">Sen</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
