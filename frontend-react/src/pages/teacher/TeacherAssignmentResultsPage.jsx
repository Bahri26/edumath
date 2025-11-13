// frontend-react/src/pages/teacher/TeacherAssignmentResultsPage.jsx (Yeni adıyla güncel hali)

import React, { useState, useEffect } from 'react';
import { getAssignments } from '../../services/assignmentService';
import PageHeader from '../../components/ui/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCalendarAlt, 
    faChartBar, 
    faUsers, 
    faCheckCircle,
    faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Yönlendirme için

// API URL servis katmanında yönetiliyor.


function TeacherAssignmentResultsPage() { // <-- İSİM BURADA GÜNCELLENDİ
    const navigate = useNavigate(); // <-- Yönlendirme kancası
    // const token = localStorage.getItem('token'); // token header'ı servis interceptors üzerinden ekleniyor
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAssignments = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAssignments();
            setAssignments(data);
        } catch (err) {
            console.error("Atamalar yüklenemedi:", err);
            setError("Atama listesi yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

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

    if (loading) {
        return (
            <div className="teacher-page-container">
                <PageHeader title="Sınav Sonuçları ve Atamalar">
                    <div className="skeleton btn" style={{ width: '160px' }}></div>
                </PageHeader>
                <div className="exams-grid">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="page-card exam-card">
                            <div className="skeleton text mb-2" style={{ width: '50%' }}></div>
                            <div className="flex-col gap-1 mb-2">
                                <div className="skeleton text" style={{ width: '70%' }}></div>
                                <div className="skeleton text" style={{ width: '40%' }}></div>
                                <div className="skeleton text" style={{ width: '55%' }}></div>
                            </div>
                            <div className="skeleton btn" style={{ width: '100%' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                    <div className="page-card flex-col gap-2" style={{ gridColumn: '1 / -1' }}>
                        <p className="text-muted">Henüz öğrencilere veya sınıflara atanmış bir sınav bulunmuyor.</p>
                        <p className="text-small">Önce bir sınav oluşturup ardından atama akışını kullanın.</p>
                        <button className="kids-btn primary" onClick={fetchAssignments}>
                            <FontAwesomeIcon icon={faChartBar} className="me-2" /> Yeniden Dene
                        </button>
                    </div>
                ) : (
                    assignments.map((assignment) => (
                        <div key={assignment._id} className="page-card exam-card">
                            <h3 className="mb-2">{assignment.examId?.title || 'Bilinmeyen Sınav'}</h3>
                            <div className="flex-col gap-1 mb-2">
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faUsers} className="me-2" />
                                    Hedef: <strong>{assignment.targetId?.name || assignment.targetType}</strong>
                                </div>
                                <div className="detail-item">
                                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                                    Teslim: <strong>{formatDueDate(assignment.dueDate)}</strong>
                                </div>
                                <div className="detail-item status-indicator">
                                    <FontAwesomeIcon icon={faCheckCircle} className="me-2 text-success" />
                                    Tamamlanma: <span className="badge neutral">% (yakında)</span>
                                </div>
                            </div>
                            <div className="exam-actions">
                                <button
                                    className="kids-btn primary btn-sm"
                                    disabled={!assignment.examId?._id}
                                    onClick={() => handleViewResults(assignment.examId._id)}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} className="me-2" /> Sonuçları Gör
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
