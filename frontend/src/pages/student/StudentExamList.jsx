import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const StudentExamList = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all');
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [onboarding, setOnboarding] = useState({
        isNewStudent: false,
        diagnosticAssigned: false,
        levelTag: null,
        message: ''
    });

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await api.get('/exams/student-list');
                const payload = res.data || {};
                const rows = payload.data || [];
                if (!mounted) return;
                setExams(Array.isArray(rows) ? rows : []);
                setOnboarding(payload.onboarding || { isNewStudent: false, diagnosticAssigned: false, message: '' });
            } catch (err) {
                if (!mounted) return;
                setError(err.response?.data?.error || err.response?.data?.message || 'Sınavlar yüklenemedi.');
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const formatDate = (dateString) => {
        if (!dateString) return "Belirsiz";
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-bounce text-6xl mb-4">📚</div>
                <p className="text-gray-600">Sınavlar yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <div className="text-6xl mb-4">❌</div>
                <p className="text-red-600">Hata: {error}</p>
            </div>
        );
    }

    const filteredExams = (exams || []).filter(exam => {
        if (filter === 'all') return true;
        return exam.status === filter;
    });

    const getStatusBadge = (status) => {
        if (status === 'completed') {
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    ✅ Tamamlandı
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                ⏳ Bekliyor
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    🎒 Sınavlarım
                    {onboarding?.levelTag && (
                        <span className="text-sm font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-700">
                            Seviye: {onboarding.levelTag}
                        </span>
                    )}
                </h1>

                {onboarding?.isNewStudent && (
                    <div className={`mb-6 rounded-xl border p-4 ${onboarding?.diagnosticAssigned ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                        <div className="font-bold mb-1">
                            {onboarding?.diagnosticAssigned ? '📘 Ölçme ve Değerlendirme Testiniz Var' : '🆕 Yeni Öğrenci'}
                        </div>
                        <div className="text-sm">{onboarding?.message}</div>
                    </div>
                )}

                {!onboarding?.isNewStudent && onboarding?.levelTag && (
                    <div className="mb-6 rounded-xl border p-4 bg-indigo-50 border-indigo-200 text-indigo-800">
                        <div className="font-bold mb-1">📊 Güncel Seviye Etiketi</div>
                        <div className="text-sm">Son ölçme-değerlendirme sonucuna göre seviyeniz: <strong>{onboarding.levelTag}</strong></div>
                    </div>
                )}

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            filter === 'all'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        📋 Tümü ({exams?.length || 0})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            filter === 'pending'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        ⏳ Bekleyenler ({exams?.filter(e => e.status === 'pending').length || 0})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            filter === 'completed'
                                ? 'bg-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        ✅ Tamamlananlar ({exams?.filter(e => e.status === 'completed').length || 0})
                    </button>
                </div>

                {/* Exams Grid */}
                {filteredExams.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <div className="text-6xl mb-4">📭</div>
                        <p className="text-gray-600 text-lg">{onboarding?.isNewStudent ? 'Henüz sınav atanmadı.' : 'Bu kategoride sınav bulunmuyor.'}</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredExams.map((exam) => {
                            const examId = exam.exam_id || exam.id;
                            return (
                            <div
                                key={examId}
                                className={`bg-white p-6 rounded-2xl shadow-sm border-2 transition-all hover:shadow-lg ${
                                    exam.status === 'completed'
                                        ? 'border-green-200'
                                        : 'border-orange-200'
                                }`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                                                exam.status === 'completed'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-orange-100 text-orange-600'
                                            }`}
                                        >
                                            {exam.status === 'completed' ? '✅' : '📝'}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">{exam.title}</h2>
                                            {getStatusBadge(exam.status)}
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                {exam.description && (
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {exam.description}
                                    </p>
                                )}

                                {/* Info */}
                                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                                    <span>📅 {formatDate(exam.exam_date)}</span>
                                    {exam.status === 'completed' && exam.completed_at && (
                                        <span>✅ {formatDate(exam.completed_at)}</span>
                                    )}
                                </div>

                                {/* Score (if completed) */}
                                {exam.status === 'completed' && exam.score !== null && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                                        <span className="text-green-700 font-bold text-lg">
                                            🎯 Puanın: {Math.round(exam.score)}
                                        </span>
                                    </div>
                                )}

                                {/* Action Button */}
                                {exam.status === 'completed' ? (
                                    <button
                                        onClick={() => navigate(`/exam-result/${examId}`)}
                                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        📊 Sonucu Gör
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => navigate(`/take-exam/${examId}`)}
                                        className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
                                    >
                                        🚀 Sınava Başla
                                    </button>
                                )}
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentExamList;
