import React from 'react';
import { useNavigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import MathText from '../../components/common/MathText';
import DailyQuest from '../../components/student/DailyQuest';

const LearningPathPage = () => {
    const navigate = useNavigate();
    const { data, loading, error } = useFetch('/learning-path');
    let user = {};
    try {
            const storedUser = localStorage.getItem('edumath_user');
        user = storedUser ? JSON.parse(storedUser) : {};
    } catch (e) {
        user = {};
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce">🛣️</div>
                    <p className="text-xl text-gray-700 font-medium">Yol haritanız çiziliyor...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Veriler Yüklenemedi</h2>
                    <p className="text-gray-600 mb-4">{error || 'Lütfen sayfayı yenileyin'}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                        🔄 Yenile
                    </button>
                </div>
            </div>
        );
    }

    const { topics = [], recommendedQuestions = [], lastAiAdvice, lastExam, overallStats, recentActivity = [] } = data;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                
                {/* GÜNÜN GÖREVI BÖLÜMÜ */}
                <div className="mb-10">
                    <DailyQuest />
                </div>

                {/* HEADER: HOŞGELDİN & AI KOÇ */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 text-[200px] transform translate-x-20 -translate-y-10">🚀</div>
                    <div className="absolute left-0 bottom-0 opacity-10 text-[150px] transform -translate-x-10 translate-y-10">✨</div>
                    
                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black mb-2">Merhaba, {user.full_name || user.name || 'Öğrenci'}! 👋</h1>
                        <p className="text-lg opacity-90 mb-6">Senin için hazırladığım kişisel öğrenme yoluna hoş geldin</p>
                        
                        {lastAiAdvice ? (
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                                <h3 className="font-bold text-yellow-300 mb-3 flex items-center gap-2 text-lg">
                                    <span className="text-2xl">🤖</span> AI Koçun Sana Diyor Ki:
                                </h3>
                                <p className="leading-relaxed text-white/95 text-lg mb-4 italic">
                                    "{lastAiAdvice.general_comment}"
                                </p>
                                {lastAiAdvice.study_recommendations && lastAiAdvice.study_recommendations.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-white/20">
                                        <span className="text-xs font-bold uppercase tracking-wider opacity-70 block mb-3">📚 Çalışma Önerileri:</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {lastAiAdvice.study_recommendations.map((rec, i) => (
                                                <div key={i} className="bg-white/20 backdrop-blur px-4 py-2 rounded-xl text-sm flex items-start gap-2">
                                                    <span className="text-yellow-300">✓</span>
                                                    <span>{rec}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/30">
                                <p className="opacity-90 text-center">
                                    📝 Henüz yeterli sınav verisi yok. Sınav çözdükçe AI koçun seninle daha fazla konuşacak!
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* İSTATİSTİK KARTLARI */}
                {overallStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">📊</div>
                            <div className="text-3xl font-black text-indigo-600">{overallStats.totalExams}</div>
                            <div className="text-sm text-gray-500 font-medium">Tamamlanan Sınav</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">✅</div>
                            <div className="text-3xl font-black text-green-600">{overallStats.totalCorrect}</div>
                            <div className="text-sm text-gray-500 font-medium">Doğru Cevap</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">🎯</div>
                            <div className="text-3xl font-black text-purple-600">%{overallStats.successRate}</div>
                            <div className="text-sm text-gray-500 font-medium">Başarı Oranı</div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-shadow">
                            <div className="text-4xl mb-2">⭐</div>
                            <div className="text-3xl font-black text-orange-600">{overallStats.avgScore}</div>
                            <div className="text-sm text-gray-500 font-medium">Ortalama Puan</div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SOL PANEL: KONU ANALİZİ */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Konu Karnesi */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                <span className="text-2xl">📊</span> Konu Analizin
                            </h2>
                            {topics.length > 0 ? (
                                <div className="space-y-5">
                                    {topics.map((t, index) => (
                                        <div key={index} className="group">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-700 text-sm">{t.topic}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold text-lg ${t.status === 'strong' ? 'text-green-600' : 'text-red-500'}`}>
                                                        %{t.score}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        ({t.correctCount}/{t.totalQuestions})
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div 
                                                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                                                        t.status === 'strong' 
                                                            ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                                            : 'bg-gradient-to-r from-red-400 to-red-600'
                                                    }`} 
                                                    style={{ width: `${t.score}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-400">
                                                {t.status === 'strong' ? '💪 Güçlü!' : '⚠️ Geliştirilmeli'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-5xl mb-3">📚</div>
                                    <p className="text-gray-400 text-sm">Henüz veri yok</p>
                                    <p className="text-gray-500 text-xs mt-1">Sınav çözerek başla!</p>
                                </div>
                            )}
                        </div>

                        {/* Motivasyon Kartı */}
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-6 text-center shadow-sm">
                            <div className="text-5xl mb-3">🔥</div>
                            <h3 className="font-black text-orange-800 text-lg mb-2">Seriyi Bozma!</h3>
                            <p className="text-orange-700 text-sm leading-relaxed">
                                Her gün düzenli çalışarak başarı oranını artır.
                            </p>
                        </div>

                        {/* Son Aktivite */}
                        {recentActivity.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <span className="text-xl">📅</span> Son 7 Gün
                                </h3>
                                <div className="space-y-2">
                                    {recentActivity.map((activity, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">
                                                {new Date(activity.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-indigo-600 font-semibold">{activity.exam_count} sınav</span>
                                                <span className="text-green-600 font-bold">%{Math.round(activity.avg_score)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SAĞ PANEL: ÖNERİLEN SORULAR */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                                <span className="text-3xl">🎯</span> Senin İçin Seçtiklerim
                            </h2>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                                Eksiklerine Özel
                            </span>
                        </div>

                        <div className="space-y-4">
                            {recommendedQuestions.length > 0 ? recommendedQuestions.map((q, index) => (
                                <div key={q.question_id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                            q.difficulty_level === 1 ? 'bg-green-100 text-green-700' :
                                            q.difficulty_level === 2 ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {q.difficulty_level === 1 ? '😊 Kolay' : q.difficulty_level === 2 ? '🤔 Orta' : '🔥 Zor'}
                                        </span>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                                            {q.topic || 'Genel'}
                                        </span>
                                    </div>
                                    
                                    <div className="text-gray-800 font-medium text-base mb-5">
                                        <MathText text={q.content_text} />
                                    </div>

                                    <button 
                                        onClick={() => alert("🚧 Yakında!")} 
                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        Hemen Çöz →
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h3 className="text-2xl font-bold text-gray-700 mb-2">Harikasın!</h3>
                                    <p className="text-gray-500">Şu an için eksik konun görünmüyor.</p>
                                    <button 
                                        onClick={() => navigate('/student-exams')}
                                        className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                                    >
                                        Sınavlara Git →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LearningPathPage;
