// frontend-react/src/pages/teacher/TeacherAssignmentResultsPage.jsx (Yeni adıyla güncel hali)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendarAlt, 
    faChartBar, 
    faUsers, 
    faCheckCircle,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için
import '../../assets/styles/TeacherPages.css';

const API_URL = 'http://localhost:8000/api/assignments'; // Atama listesini çeker
const token = localStorage.getItem('token'); 

const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };


function TeacherAssignmentResultsPage() { // <-- İSİM BURADA GÜNCELLENDİ
    const navigate = useNavigate(); // <-- Yönlendirme kancası
    const [assignments, setAssignments] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(API_URL, axiosConfig); 
            setAssignments(response.data); 
        } catch (err) {
            console.error("Atamalar yüklenemedi:", err);
            setError("Atama listesi yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewResults = (examId) => {
        // Detaylı sonuçlar sayfasına yönlendir. 
        // Bu, TeacherDetailedResultsPage'i tetikleyecek.
        navigate(`/teacher/results/${examId}`);
    };

    const formatDueDate = (dateString) => {
        if (!dateString) return "Belirtilmedi";
        return new Date(dateString).toLocaleDateString('tr-TR', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    if (loading) return <p className="teacher-page-container">Atamalar yükleniyor...</p>;

    return (
        <div className="teacher-page-container">
            {/* BAŞLIK */}
            <PageHeader title="Sınav Sonuçları ve Atamalar">
                <button className="btn-primary" onClick={fetchAssignments}>
                    <FontAwesomeIcon icon={faChartBar} className="me-2" />
                    Raporları Yenile
                </button>
            </PageHeader>

            {error && <div className="alert alert-danger page-card">{error}</div>}

            {/* ATAMA KARTLARI LİSTESİ */}
            <div className="exams-grid">
                {assignments.length === 0 ? (
                    <div className="page-card" style={{gridColumn: '1 / -1'}}>
                        Henüz öğrencilere atanmış bir sınav yok.
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div key={assignment._id} className="page-card exam-card">
                            
                            {/* Sınav Başlığı */}
                            <h3>{assignment.examId?.title || 'Bilinmeyen Sınav'}</h3>
                            
                            {/* Atama Detayları */}
                            <div className="exam-details" style={{flexDirection: 'column', gap: '0.5rem'}}>
                                
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    Hedef: <strong>{assignment.targetId?.name || assignment.targetType}</strong>
                                </div>
                                
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    Teslim Tarihi: <strong>{formatDueDate(assignment.dueDate)}</strong>
                                </div>
                                
                                <div className="detail-item status-indicator">
                                    <FontAwesomeIcon icon={faCheckCircle} className="me-2" style={{color: '#198754'}} />
                                    Tamamlanma: (TODO: Buraya tamamlama yüzdesi gelecek)
                                </div>
                            </div>
                            
                            {/* Eylemler */}
                            <div className="exam-actions">
                                <button 
                                    className="btn-primary btn-sm"
                                    // Buraya examId'yi değil, Assignment'ın kendisini gönderiyoruz. 
                                    // Detay sayfasında sadece examId gerekiyor.
                                    onClick={() => handleViewResults(assignment.examId._id)} 
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="me-2" />
                                    Sonuçları Gör
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default TeacherAssignmentResultsPage; // <-- İSİM BURADA DA GÜNCELLENDİ