// frontend-react/src/pages/student/StudentDashboard.jsx (TAM VE GÜNCEL SON HALİ)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faListCheck, faCalendarTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; 
import '../../assets/styles/TeacherPages.css'; 

// DİKKAT: Backend'de studentController ve studentRoutes'un kurulu olduğu varsayılır.

const API_URL = 'http://localhost:8000/api/student/assignments'; // Öğrencinin atanmış sınavları
const token = localStorage.getItem('token'); 

const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };


function StudentDashboard() {
    const navigate = useNavigate(); 
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError('Giriş yetkiniz yok. Lütfen yeniden giriş yapın.');
            setLoading(false);
            return;
        }

        try {
            // GET /api/student/assignments: Öğrenciye (sınıfı dahil) atanmış aktif sınavları çeker
            const response = await axios.get(API_URL, axiosConfig); 
            setAssignments(response.data); 
        } catch (err) {
            console.error("Atamalar yüklenemedi:", err);
            setError("Atanan sınavları listelerken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = (examId) => {
        // Öğrenciyi sınav arayüzüne yönlendirir
        // Sınav çözüm arayüzümüzün route'u: /student/exam/:examId
        navigate(`/student/exam/${examId}`); 
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return "Süresiz";
        // Teslim tarihini yerel formata çevir
        return new Date(dateString).toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <p className="teacher-page-container">Atanmış sınavlar yükleniyor...</p>;

    return (
        <div className="teacher-page-container">
            {/* BAŞLIK */}
            <PageHeader title="Öğrenci Paneli - Atanan Sınavlar" />

            {error && <div className="alert alert-danger page-card">{error}</div>}

            <div className="exams-grid">
                {assignments.length === 0 && !loading ? (
                    <div className="page-card" style={{gridColumn: '1 / -1'}}>
                        Size atanmış aktif bir sınav bulunmamaktadır.
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div key={assignment._id} className="page-card exam-card">
                            
                            {/* Sınav Başlığı (examId.title populated olarak gelmeli) */}
                            <h3>{assignment.examId?.title || 'Bilinmeyen Sınav'}</h3>

                            <div className="exam-details">
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faListCheck} className="me-2" />
                                    {/* Soru sayısı examId objesinden çekilir (questions dizisinin uzunluğu) */}
                                    {assignment.examId?.questions?.length || '0'} Soru
                                </div>
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faClock} className="me-2" />
                                    Süre: {assignment.examId?.duration || '?'} Dakika
                                </div>
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faCalendarTimes} className="me-2" />
                                    Son Teslim: {formatDueDate(assignment.dueDate)}
                                </div>
                            </div>
                            
                            <div className="exam-actions">
                                <button 
                                    className="btn-primary"
                                    onClick={() => handleStartExam(assignment.examId._id)}
                                >
                                    Sınava Başla
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default StudentDashboard;