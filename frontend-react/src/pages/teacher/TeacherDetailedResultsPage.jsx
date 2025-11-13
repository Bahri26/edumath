// frontend-react/src/pages/teacher/TeacherDetailedResultsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/common/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTachometerAlt, 
    faUsers, 
    faCheckDouble, 
    faTimesCircle,
    faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { getExamResults } from '../../services/resultService';

// Yardımcı İstatistik Kartı Bileşeni (BEM Approach)
const StatsCard = ({ icon, label, value, variant = 'purple' }) => (
    <div className="kids-card">
        <div className="flex items-center gap-1 mb-1">
            <span className={`kids-badge ${variant}`}>
                <FontAwesomeIcon icon={icon} />
            </span>
            <span className="muted">{label}</span>
        </div>
        <h3 className="m-0">{value}</h3>
    </div>
);


function TeacherDetailedResultsPage() {
    const { examId } = useParams();
    const navigate = useNavigate();

    const [resultsData, setResultsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getExamResults(examId);
            setResultsData(data);
        } catch (err) {
            console.error('Sonuçlar yüklenemedi:', err);
            setError(err.response?.data?.message || 'Sonuçlar listelenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    }, [examId]);

    useEffect(() => { fetchResults(); }, [fetchResults]);

    const examTitle = resultsData?.examTitle;
    const passMark = resultsData?.passMark;
    const stats = resultsData?.stats;
    const studentResults = resultsData?.studentResults || [];

    return (
        <div className="container pt-2">
            <PageHeader title={`Detaylı Sınav Raporu: ${examTitle || '...'}`}>
                <button className="kids-btn primary" onClick={() => navigate('/teacher/assignments')}>
                    <FontAwesomeIcon icon={faChartLine} className="mr-1" /> Atamalar Listesine Dön
                </button>
            </PageHeader>

            {error && <div className="kids-error mb-2">{error}</div>}

            {loading ? (
                <>
                    <div className="kids-grid-3 mb-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="kids-card">
                                <div className="skeleton text mb-2" style={{ width: '40%' }}></div>
                                <div className="skeleton text" style={{ width: '30%' }}></div>
                            </div>
                        ))}
                    </div>
                    <div className="kids-card">
                        <div className="skeleton text mb-2" style={{ width: '60%' }}></div>
                        {[1,2,3,4].map(i => (
                            <div key={i} className="skeleton text mb-1"></div>
                        ))}
                    </div>
                </>
            ) : (!resultsData || studentResults.length === 0) ? (
                <div className="kids-card text-center">
                    <h3 className="m-0 mb-1">Rapor Yok</h3>
                    <p className="muted">Bu sınav ({examTitle || examId}) henüz hiçbir öğrenci tarafından tamamlanmamıştır.</p>
                </div>
            ) : (
                <>
                    <div className="kids-grid-3">
                        <StatsCard icon={faUsers} label="Katılımcı Sayısı" value={stats.totalSubmissions} variant="purple" />
                        <StatsCard icon={faTachometerAlt} label="Sınıf Ortalaması" value={`${stats.avgScore}%`} variant="yellow" />
                        <StatsCard icon={faCheckDouble} label="Geçen Öğrenci" value={stats.passedCount} variant="green" />
                        <StatsCard icon={faTimesCircle} label="Kalan Öğrenci" value={stats.totalSubmissions - stats.passedCount} variant="red" />
                    </div>

                    <div className="kids-card mt-2">
                        <h3 className="m-0 mb-1">Öğrenci Bazında Performans</h3>
                        <p className="muted mb-2">Geçme Notu: <strong>{passMark}%</strong></p>

                        <div className="table-container">
                            <table>
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
                                    {studentResults.map((result) => {
                                        const blank = (result.answers?.length || 0) - ((result.correctAnswers || 0) + (result.wrongAnswers || 0));
                                        return (
                                            <tr key={result._id}>
                                                <td>{result.studentId?.firstName} {result.studentId?.lastName}</td>
                                                <td>{result.studentId?.email}</td>
                                                <td>{result.correctAnswers}</td>
                                                <td>{result.wrongAnswers}</td>
                                                <td>{blank < 0 ? 0 : blank}</td>
                                                <td><strong>{result.score}%</strong></td>
                                                <td>
                                                    <span className={`kids-badge ${result.passed ? 'green' : 'red'}`}>
                                                        {result.passed ? 'GEÇTİ' : 'KALDI'}
                                                    </span>
                                                </td>
                                                <td>{Math.round((result.completionTime || 0) / 60)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


export default TeacherDetailedResultsPage;
