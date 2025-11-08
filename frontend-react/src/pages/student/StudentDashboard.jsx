import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClock, 
  faListCheck, 
  faCalendarTimes,
  faSpinner,
  faExclamationTriangle,
  faTrophy,
  faChartLine,
  faLightbulb,
  faMedal
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import AchievementsTab from './dashboard/AchievementsTab';
import ProgressTab from './dashboard/ProgressTab';
import RecommendationsTab from './dashboard/RecommendationsTab';
import LeaderboardTab from './dashboard/LeaderboardTab';
import '../../assets/styles/TeacherPages.css';

const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  border: none;
  background: none;
  color: ${props => props.active ? '#4caf50' : '#666'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #4caf50' : 'none'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #4caf50;
  }

  .badge {
    display: inline-block;
    background: #f44336;
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 10px;
    margin-left: 5px;
  }
`;


function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('assignments');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Giriş yetkiniz yok. Lütfen yeniden giriş yapın.');
      setLoading(false);
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/api/student/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data);
    } catch (err) {
      console.error("Atamalar yüklenemedi:", err);
      const errorMsg = err.response?.data?.message || 'Atanan sınavları listelerken bir hata oluştu.';
      setError(errorMsg);
      
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}`);
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return "Süresiz";
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeRemaining = (timeRemaining) => {
    if (!timeRemaining) return '';
    if (timeRemaining.expired) return '⚠️ Süre Doldu';
    
    const { days, hours, minutes } = timeRemaining;
    
    if (days > 0) return `${days} gün ${hours} saat kaldı`;
    if (hours > 0) return `${hours} saat ${minutes} dk kaldı`;
    return `${minutes} dakika kaldı`;
  };

  const getUrgencyClass = (timeRemaining) => {
    if (!timeRemaining || timeRemaining.expired) return 'urgent-expired';
    
    const { days, hours } = timeRemaining;
    if (days === 0 && hours < 2) return 'urgent-critical';
    if (days === 0 && hours < 24) return 'urgent-warning';
    return '';
  };

  if (loading) {
    return (
      <div className="teacher-page-container">
        <PageHeader title="Öğrenci Paneli - Atanan Sınavlar" />
        <div className="page-card text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="mb-3" />
          <p>Atanmış sınavlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  const renderAssignments = () => (
    <div className="exams-grid">
      {assignments.length === 0 ? (
        <div className="page-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
          <FontAwesomeIcon icon={faListCheck} size="3x" className="mb-3" style={{ opacity: 0.3 }} />
          <h4>Size atanmış aktif bir sınav bulunmamaktadır.</h4>
          <p className="text-muted">Öğretmeniniz tarafından yeni sınavlar atandığında burada görüntülenecektir.</p>
        </div>
      ) : (
        assignments.map((assignment) => (
          <div 
            key={assignment._id} 
            className={`page-card exam-card ${getUrgencyClass(assignment.timeRemaining)}`}
          >
            <h3>{assignment.examId?.title || 'Bilinmeyen Sınav'}</h3>

            <div className="exam-details">
              <div className="detail-item">
                <FontAwesomeIcon icon={faListCheck} className="me-2" />
                {assignment.questionCount || 0} Soru
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faClock} className="me-2" />
                Süre: {assignment.examId?.duration || '?'} Dakika
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faCalendarTimes} className="me-2" />
                Son Teslim: {formatDueDate(assignment.dueDate)}
              </div>
              {assignment.timeRemaining && (
                <div className={`detail-item time-remaining ${getUrgencyClass(assignment.timeRemaining)}`}>
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  {formatTimeRemaining(assignment.timeRemaining)}
                </div>
              )}
            </div>

            <div className="exam-actions">
              <button
                className="btn-primary"
                onClick={() => handleStartExam(assignment.examId._id)}
                disabled={assignment.timeRemaining?.expired}
              >
                {assignment.timeRemaining?.expired ? 'Süre Doldu' : 'Sınava Başla'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'assignments':
        return renderAssignments();
      case 'achievements':
        return <AchievementsTab />;
      case 'progress':
        return <ProgressTab />;
      case 'recommendations':
        return <RecommendationsTab />;
      case 'leaderboard':
        return <LeaderboardTab />;
      default:
        return renderAssignments();
    }
  };

  if (loading) {
    return (
      <div className="teacher-page-container">
        <PageHeader title="Öğrenci Paneli" />
        <div className="page-card text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="mb-3" />
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-page-container">
      <PageHeader title="Öğrenci Paneli" />

      {error && (
        <div className="alert alert-danger page-card">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </div>
      )}

      <TabContainer>
        <TabButton 
          active={activeTab === 'assignments'} 
          onClick={() => setActiveTab('assignments')}
        >
          <FontAwesomeIcon icon={faListCheck} className="me-2" />
          Atanan Sınavlar
        </TabButton>
        
        <TabButton 
          active={activeTab === 'progress'} 
          onClick={() => setActiveTab('progress')}
        >
          <FontAwesomeIcon icon={faChartLine} className="me-2" />
          İlerleme
        </TabButton>
        
        <TabButton 
          active={activeTab === 'achievements'} 
          onClick={() => setActiveTab('achievements')}
        >
          <FontAwesomeIcon icon={faTrophy} className="me-2" />
          Başarımlar
          <span className="badge">3</span>
        </TabButton>
        
        <TabButton 
          active={activeTab === 'recommendations'} 
          onClick={() => setActiveTab('recommendations')}
        >
          <FontAwesomeIcon icon={faLightbulb} className="me-2" />
          Öneriler
          <span className="badge">2</span>
        </TabButton>
        
        <TabButton 
          active={activeTab === 'leaderboard'} 
          onClick={() => setActiveTab('leaderboard')}
        >
          <FontAwesomeIcon icon={faMedal} className="me-2" />
          Sıralama
        </TabButton>
      </TabContainer>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default StudentDashboard;