// frontend-react/src/pages/teacher/TeacherDetailedResultsPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTachometerAlt, 
    faUsers, 
    faCheckDouble, 
    faTimesCircle,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';
import '../../assets/styles/TeacherPages.css'; 

const API_URL = 'http://localhost:8000/api/results'; // POST ve GET /:examId için

// Yardımcı İstatistik Kartı Bileşeni
const StatsCard = ({ icon, label, value, color }) => (
    <div className="stat-card" style={{ borderLeft: `5px solid ${color}`, minWidth: '220px' }}>
        <div className="stat-icon" style={{ color: color }}>
            <FontAwesomeIcon icon={icon} />
        </div>
        <div className="stat-content">
            <p className="stat-label">{label}</p>
            <h4 className="stat-value">{value}</h4>
        </div>
    </div>
);


function TeacherDetailedResultsPage() {
    const { examId } = useParams(); // URL'den sınav ID'sini alır
    const navigate = useNavigate();
    
    const token = localStorage.getItem('token');
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

    const [resultsData, setResultsData] = useState(null); // Tüm sonuç objesi (stats + studentResults)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
             setError("Yetki hatası. Lütfen yeniden giriş yapın.");
             setLoading(false);
             return;
        }

        try {
            // GET /api/results/:examId
            const response = await axios.get(`${API_URL}/${examId}`, axiosConfig); 
            setResultsData(response.data); // examTitle, passMark, stats, studentResults
        } catch (err) {
            console.error("Sonuçlar yüklenemedi:", err);
            setError(err.response?.data?.message || "Sonuçlar listelenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [examId, token]);

    useEffect(() => {
        fetchResults();
    }, [fetchResults]);

    if (loading) return <p className="teacher-page-container">Rapor yükleniyor...</p>;
    if (error) return <p className="teacher-page-container alert alert-danger page-card">{error}</p>;
    if (!resultsData || resultsData.studentResults.length === 0) {
        return (
            <div className="teacher-page-container">
                <PageHeader title="Rapor Yok" />
                <div className="page-card">
                    Bu sınav ({resultsData?.examTitle || examId}) henüz hiçbir öğrenci tarafından tamamlanmamıştır.
                </div>
            </div>
        );
    }

    const { examTitle, passMark, stats, studentResults } = resultsData;

    return (
        <div className="teacher-page-container">
            <PageHeader title={`Detaylı Sınav Raporu: ${examTitle}`}>
                <button className="btn-primary" onClick={() => navigate('/teacher/assignments')}>
                    <FontAwesomeIcon icon={faChartLine} className="me-2" />
                    Atamalar Listesine Dön
                </button>
            </PageHeader>

            {/* --- 1. GENEL İSTATİSTİKLER --- */}
            <div className="stats-grid">
                <StatsCard icon={faUsers} label="Katılımcı Sayısı" value={stats.totalSubmissions} color="#0d6efd" />
                <StatsCard icon={faTachometerAlt} label="Sınıf Ortalaması" value={`${stats.avgScore}%`} color="#ffc107" />
                <StatsCard icon={faCheckDouble} label="Geçen Öğrenci" value={stats.passedCount} color="#198754" />
                <StatsCard icon={faTimesCircle} label="Kalan Öğrenci" value={stats.totalSubmissions - stats.passedCount} color="#dc3545" />
            </div>

            {/* --- 2. ÖĞRENCİ DETAY TABLOSU --- */}
            <div className="page-card mt-4">
                <h3>Öğrenci Bazında Performans</h3>
                <p>Geçme Notu: <strong>{passMark}%</strong></p>
                
                <div className="table-container">
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th>Öğrenci Adı</th>
                                <th>E-posta</th>
                                <th>Doğru</th>
                                <th>Yanlış</th>
                                <th>Boş</th>
                                <th>Puan (%)</th>
                                <th>Durum</th>
                                <th>Süre (dk)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentResults.map((result) => (
                                <tr key={result._id} className={result.passed ? 'table-success' : 'table-danger'}>
                                    <td>{result.studentId.firstName} {result.studentId.lastName}</td>
                                    <td>{result.studentId.email}</td>
                                    <td>{result.correctAnswers}</td>
                                    <td>{result.wrongAnswers}</td>
                                    <td>{result.answers.length - (result.correctAnswers + result.wrongAnswers)}</td> {/* Boş bıraktıklarını hesapla */}
                                    <td><strong>{result.score}%</strong></td>
                                    <td>
                                        <span className={`status-badge status-${result.passed ? 'passed' : 'failed'}`}>
                                            {result.passed ? 'GEÇTİ' : 'KALDI'}
                                        </span>
                                    </td>
                                    <td>{Math.round(result.completionTime / 60)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


export default TeacherDetailedResultsPage;