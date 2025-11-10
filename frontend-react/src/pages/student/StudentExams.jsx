// frontend-react/src/pages/student/StudentExams.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/TeacherPages.css';

const API_URL = 'http://localhost:8000/api/exams';

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const resp = await axios.get(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExams(resp.data);
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

  return (
    <div className="teacher-page-container">
      <div className="page-header">
        <div className="title">
          <span>📝</span>
          <h1>Sınavlarım</h1>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Sınavlar yükleniyor...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <h3>Henüz sınav yok</h3>
          <p>Öğretmeniniz size bir sınav atadığında burada görünecek.</p>
        </div>
      ) : (
        <div className="card-grid">
          {exams.map(exam => (
            <div key={exam._id} className="exam-card">
              <div className="exam-card-header">
                <h3>{exam.title}</h3>
                <span className="badge" style={{ background: '#6366f1' }}>
                  {exam.questions?.length || 0} Soru
                </span>
              </div>
              <div className="exam-card-body">
                <p>{exam.description || 'Açıklama yok'}</p>
                <div className="exam-meta">
                  <span>📚 {exam.subject || 'Genel'}</span>
                  <span>⏱️ {exam.duration || 60} dk</span>
                </div>
              </div>
              <div className="exam-card-footer">
                <button className="btn-primary" onClick={() => startExam(exam._id)}>
                  🚀 Sınava Başla
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
