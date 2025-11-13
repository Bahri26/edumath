// frontend-react/src/pages/student/StudentSurveys.jsx

import React, { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/ui/common/PageHeader';
import { useNavigate } from 'react-router-dom';
import { getAvailableSurveys } from '../../services/surveyService';
import './StudentSurveys.css';

function StudentSurveys() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAvailableSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAvailableSurveys();
      setSurveys(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Student surveys fetch failed', err);
      setError('Anketler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailableSurveys();
  }, [fetchAvailableSurveys]);

  const surveyIcons = ['📊', '📝', '📋', '📈', '📉', '🎯', '💬', '🔍'];
  const surveyColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

  return (
    <div className="teacher-page-container student-surveys-page">
      <PageHeader title="📊 Anketlerim">
        <button className="kids-btn secondary" onClick={fetchAvailableSurveys}>
          🔄 Yenile
        </button>
      </PageHeader>

      {error && (
        <div className="alert alert-danger page-card mb-2">
          <span className="alert-icon">⚠️</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="surveys-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="survey-card survey-skeleton">
              <div className="survey-card-header">
                <div className="skeleton circle" style={{ width: '60px', height: '60px' }}></div>
              </div>
              <div className="survey-card-body">
                <div className="skeleton text mb-2" style={{ width: '80%', height: '24px' }}></div>
                <div className="skeleton text mb-2" style={{ width: '60%', height: '16px' }}></div>
                <div className="skeleton btn" style={{ width: '100%', height: '40px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>Aktif Anket Bulunamadı</h3>
          <p>Şu anda katılabileceğiniz aktif bir anket bulunmuyor.</p>
          <button className="kids-btn primary" onClick={fetchAvailableSurveys}>
            🔄 Tekrar Dene
          </button>
        </div>
      ) : (
        <>
          <div className="surveys-stats">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-value">{surveys.length}</div>
                <div className="stat-label">Aktif Anket</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-value">Bekliyor</div>
                <div className="stat-label">Fikrini Paylaş</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-value">Kolay</div>
                <div className="stat-label">Hızlı Katılım</div>
              </div>
            </div>
          </div>

          <div className="surveys-grid">
            {surveys.map((s, index) => {
              const icon = surveyIcons[index % surveyIcons.length];
              const color = surveyColors[index % surveyColors.length];
              
              return (
                <div key={s.id || s._id} className="survey-card" style={{ '--survey-color': color }}>
                  <div className="survey-card-header">
                    <div className="survey-icon">{icon}</div>
                    <div className="survey-badges">
                      <span className="survey-badge active">✓ Aktif</span>
                    </div>
                  </div>
                  
                  <div className="survey-card-body">
                    <h3 className="survey-title">{s.title}</h3>
                    
                    <div className="survey-info">
                      <div className="survey-info-item">
                        <span className="info-icon">👥</span>
                        <span className="info-text">{s.targetClass || 'Tüm Sınıflar'}</span>
                      </div>
                      {s.questions && (
                        <div className="survey-info-item">
                          <span className="info-icon">❓</span>
                          <span className="info-text">{s.questions.length} Soru</span>
                        </div>
                      )}
                    </div>

                    {s.description && (
                      <p className="survey-description">{s.description}</p>
                    )}
                  </div>

                  <div className="survey-card-footer">
                    <button 
                      className="survey-join-btn" 
                      onClick={() => navigate(`/student/surveys/${s.id || s._id}`)}
                    >
                      <span className="btn-icon">🚀</span>
                      <span>Ankete Katıl</span>
                    </button>
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

export default StudentSurveys;
