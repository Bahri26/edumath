import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import useFetch from '../../hooks/useFetch';
import Button from '../../components/ui/Button';
import { exportExamToPDF } from '../../utils/pdfExporter';

const ExamListPage = () => {
    const navigate = useNavigate();
    // Role guard: redirect non-teachers to student exams
    useEffect(() => {
        try {
            const stored = localStorage.getItem('edumath_user');
            const parsed = stored ? JSON.parse(stored) : null;
            const role = parsed?.role || (parsed?.role_id === 2 ? 'teacher' : parsed?.role_id === 3 ? 'student' : undefined);
            if (!role || role !== 'teacher') {
                navigate('/student-exams');
            }
        } catch (e) {
            navigate('/login');
        }
    }, [navigate]);

    const { data: exams, loading, error, refetch } = useFetch('/exams');
    const [exportingExamId, setExportingExamId] = useState(null);

    const getExamStage = (exam) => {
        const status = String(exam?.status || '').toLocaleLowerCase('tr-TR');
        const isPublished = Number(exam?.is_published) === 1 || status === 'published' || status === 'archived';
        if (isPublished) {
            return { key: 'finished', label: '✅ Sınav Bitmiş (Yayınlandı)', color: '#2e7d32' };
        }

        const totalQuestions = Number(exam?.total_questions || 0);
        if (totalQuestions > 0 || (status && status !== 'draft')) {
            return { key: 'in-progress', label: '🟡 Henüz Bitmemiş (Hazırlanıyor)', color: '#b26a00' };
        }

        return { key: 'draft', label: '📝 Taslak', color: '#0f766e' };
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu sınavı ve içindeki tüm soruları silmek istediğinize emin misiniz?")) return;
        
        try {
            const res = await api.delete(`/exams/${id}`);
            refetch(); // Listeyi yenile
            const message = res?.data?.message || 'Sınav silindi.';
            alert(message);
        } catch (error) {
            alert(error?.response?.data?.error || "Silme işlemi başarısız.");
        }
    };

    const handleExportPDF = async (examId) => {
        setExportingExamId(examId);
        
        try {
            // Sınav detaylarını ve sorularını getir
            const [examRes, questionsRes] = await Promise.all([
                api.get(`/exams/${examId}`),
                api.get(`/exams/${examId}/questions`)
            ]);

            const exam = examRes.data.data || examRes.data;
            const questions = questionsRes.data.data || questionsRes.data;

            if (!questions || questions.length === 0) {
                alert('❌ Bu sınavda henüz soru bulunmuyor!');
                return;
            }

            // PDF oluştur
            let user = {};
            try {
                const storedUser = localStorage.getItem('edumath_user');
                user = storedUser ? JSON.parse(storedUser) : {};
            } catch (e) {
                user = {};
            }
            const teacherName = user.full_name || user.name || 'EduMath Öğretmeni';
            
            const result = await exportExamToPDF(exam, questions, teacherName);

            if (result.success) {
                alert(`✅ PDF başarıyla indirildi: ${result.fileName}`);
            } else {
                alert(`❌ PDF oluşturma hatası: ${result.error}`);
            }
        } catch (error) {
            console.error('❌ PDF export hatası:', error);
            alert('PDF oluşturulurken bir hata oluştu!');
        } finally {
            setExportingExamId(null);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '40px' }}>Yükleniyor...</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '40px', color: '#e74c3c' }}>Hata: {error}</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'Segoe UI' }}>
            
            {/* ÜST BAŞLIK VE YENİ EKLE BUTONU */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#2c3e50', margin: 0 }}>📂 Sınavlarım</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                        onClick={() => navigate('/exams/level-thresholds')}
                        className="flex items-center gap-2"
                    >
                        🎯 Seviye Eşikleri
                    </Button>
                    <Button
                        onClick={() => navigate('/create-exam')}
                        className="flex items-center gap-2"
                    >
                        ➕ Yeni Sınav Oluştur
                    </Button>
                </div>
            </div>

            {/* SINAV LİSTESİ */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {(exams || []).length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#7f8c8d', fontSize: '18px', marginTop: '50px' }}>Henüz hiç sınav oluşturmadınız.</p>
                ) : (
                    (exams || []).map((exam) => (
                        (() => {
                            const examId = exam.exam_id || exam.id;
                            const stage = getExamStage(exam);
                            const isPublished = stage.key === 'finished';
                            return (
                        <div key={examId} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            
                            {/* SOL: SINAV BİLGİSİ */}
                            <div>
                                <h3 style={{ margin: '0 0 5px 0', color: '#34495e' }}>{exam.title}</h3>
                                <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                                    ⏳ {exam.duration_minutes} Dakika • 📅 {new Date(exam.created_at).toLocaleDateString('tr-TR')}
                                </p>
                                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: stage.color, fontWeight: 'bold' }}>
                                    {stage.label}
                                </p>
                            </div>

                            {/* SAĞ: BUTONLAR */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => navigate(isPublished ? `/exams/${examId}` : `/add-questions/${examId}`)}
                                    style={{ backgroundColor: '#3498db', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    {isPublished ? '👁️ Sınavı Görüntüle' : '✏️ Soruları Düzenle'}
                                </button>
                                <button 
                                    onClick={() => handleExportPDF(examId)}
                                    disabled={exportingExamId === examId}
                                    style={{ 
                                        backgroundColor: exportingExamId === examId ? '#95a5a6' : '#9b59b6', 
                                        color: 'white', 
                                        border: 'none', 
                                        padding: '8px 15px', 
                                        borderRadius: '5px', 
                                        cursor: exportingExamId === examId ? 'wait' : 'pointer', 
                                        fontWeight: 'bold' 
                                    }}
                                >
                                    {exportingExamId === examId ? '⏳ İndiriliyor...' : '📄 PDF İndir'}
                                </button>
                                <button 
                                    onClick={() => handleDelete(examId)}
                                    style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    🗑️ Sil
                                </button>
                            </div>
                        </div>
                            );
                        })()
                    ))
                )}
            </div>
            
            <button
                onClick={() => {
                    const storedUser = localStorage.getItem('edumath_user');
                    let dashboard = '/student-dashboard';
                    if (storedUser) {
                        try {
                            const user = JSON.parse(storedUser);
                            if (user.role === 'teacher') {
                                dashboard = '/teacher-dashboard';
                            }
                        } catch (e) {}
                    }
                    navigate(dashboard);
                }}
                style={{ marginTop: '30px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
            >
                &larr; Panele Dön
            </button>
        </div>
    );
};

export default ExamListPage;
