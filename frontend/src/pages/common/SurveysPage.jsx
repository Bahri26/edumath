import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

const SurveysPage = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [surveys, setSurveys] = useState([]);
    let user = null;
    try {
        const storedUser = localStorage.getItem('edumath_user');
        user = storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        user = null;
    }

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchSurveys = async () => {
            try {
                const res = await api.get('/surveys');
                const payload = res.data && (res.data.data || res.data.rows || res.data);
                // payload might be an object { rows, total } or an array
                const list = Array.isArray(payload) ? payload : (payload && payload.rows ? payload.rows : []);
                setSurveys(list || []);
            } catch (error) {
                console.error(error);
                // Mock data fallback
                setSurveys([
                    {
                        survey_id: 1,
                        title: 'Matematik Ders Geri Bildirim',
                        description: 'Bu anket, matematik dersine ilişkin görüşlerinizi almak için hazırlanmıştır.',
                        view_count: 45,
                        response_count: 32
                    },
                    {
                        survey_id: 2,
                        title: 'Öğrenme Deneyimi Anketi',
                        description: 'Lütfen bu süreçte yaşadığınız öğrenme deneyiminizi paylaşınız.',
                        view_count: 38,
                        response_count: 28
                    }
                ]);
            }
        };
        fetchSurveys();
    }, [navigate, user]);

    // Öğrenci ankete tıkladığında doğrudan anket sayfasına yönlendir
    const handleStudentClick = (id) => {
        navigate(`/take-survey/${id}`);
    };

    const handleDeleteSurvey = async (surveyId, title) => {
        if (!window.confirm(`"${title}" anketi silinsin mi?`)) return;
        try {
            await api.delete(`/surveys/${surveyId}`);
            setSurveys((prev) => prev.filter((s) => s.survey_id !== surveyId));
            alert('✅ Anket silindi.');
        } catch (error) {
            alert('❌ Anket silinemedi: ' + (error.response?.data?.message || 'Hata'));
        }
    };

    if (!user) return null;

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} p-10 font-sans transition-colors`}>
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                        📋 Anketler
                    </h1>
                    {user.role === 'teacher' && (
                        <button
                            onClick={() => navigate('/create-survey')}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-lg"
                        >
                            + Yeni Anket Oluştur
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* --- AKTİF ANKETLER (DB'den Gelenler) --- */}
                    {surveys.map((survey) => (
                        <div key={survey.survey_id} className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} p-8 rounded-3xl shadow-sm border hover:shadow-md transition-all`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{survey.title}</h3>
                                {user.role === 'teacher' && (
                                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-1 rounded">Aktif</span>
                                )}
                            </div>
                            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-6 min-h-[50px]`}>{survey.description}</p>

                            {/* İstatistik Özet (Sadece Öğretmen Görür) */}
                            {user.role === 'teacher' && (
                                <div className={`flex gap-4 mb-6 text-sm ${theme === 'dark' ? 'text-gray-300 bg-slate-700' : 'text-gray-500 bg-gray-50'} p-3 rounded-xl`}>
                                    <div className="flex items-center gap-1">
                                        👁️ <strong>{survey.view_count}</strong> Görüntülenme
                                    </div>
                                    <div className="flex items-center gap-1">
                                        ✍️ <strong>{survey.response_count}</strong> Yanıt
                                    </div>
                                </div>
                            )}

                            {/* BUTONLAR */}
                            {user.role === 'teacher' ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/survey-stats/${survey.survey_id}`)}
                                        className={`flex-1 py-3 ${theme === 'dark' ? 'bg-slate-700 border-indigo-500 text-indigo-400 hover:bg-slate-600' : 'bg-white border-indigo-600 text-indigo-600 hover:bg-indigo-50'} border-2 font-bold rounded-xl transition-colors flex items-center justify-center gap-2`}
                                    >
                                        📊 İstatistik
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSurvey(survey.survey_id, survey.title)}
                                        className="px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700"
                                        title="Anketi Sil"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleStudentClick(survey.survey_id)}
                                    className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-indigo-200 shadow-lg"
                                >
                                    Ankete Başla →
                                </button>
                            )}
                        </div>
                    ))}

                    {surveys.length === 0 && (
                        <div className={`col-span-full text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p className="text-lg">Henüz anket yok</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurveysPage;
