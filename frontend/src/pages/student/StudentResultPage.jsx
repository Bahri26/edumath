import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';

const StudentResultDistributionChart = lazy(() => import('../../components/charts/StudentResultDistributionChart'));

const StudentResultPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                const params = new URLSearchParams(location.search);
                let attemptId = params.get('attemptId');

                if (!attemptId) {
                    const attemptsRes = await api.get(`/exams/${examId}/student-attempts`);
                    const attempts = attemptsRes.data?.data || [];
                    attemptId = attempts[0]?.attempt_id || attempts[0]?.id || null;
                }

                if (!attemptId) {
                    setResult(null);
                    return;
                }

                const [attemptRes, examRes, questionsRes] = await Promise.all([
                    api.get(`/exams/attempts/${attemptId}`),
                    api.get(`/exams/${examId}`),
                    api.get(`/exams/${examId}/questions`)
                ]);

                const attempt = attemptRes.data || {};
                const exam = examRes.data?.data || examRes.data || {};
                const questions = questionsRes.data?.data || [];
                const answers = attempt.answers || [];

                const questionMap = new Map();
                questions.forEach((q) => {
                    const qid = q.question_id || q.id;
                    questionMap.set(Number(qid), q);
                });

                const normalizedAnswers = answers.map((ans) => {
                    const qid = Number(ans.question_id);
                    const q = questionMap.get(qid) || {};
                    return {
                        question_id: qid,
                        question_text: q.content_text || q.question_text || 'Soru metni bulunamadı',
                        topic: q.topic || null,
                        is_correct: Number(ans.is_correct) === 1,
                        student_answer: ans.student_answer || 'Cevap kaydı yok',
                        correct_answer: q.correct_answer || '—'
                    };
                });

                const correctCount = normalizedAnswers.filter((a) => a.is_correct).length;
                const totalQuestions = normalizedAnswers.length || questions.length || exam.total_questions || 0;
                const wrongCount = Math.max(totalQuestions - correctCount, 0);
                const score = Number(attempt.percentage || (totalQuestions ? (correctCount / totalQuestions) * 100 : 0));

                const topicAccumulator = new Map();
                normalizedAnswers.forEach((ans) => {
                    const key = String(ans.topic || 'Genel Matematik').trim();
                    const stat = topicAccumulator.get(key) || { topic: key, total: 0, correct: 0 };
                    stat.total += 1;
                    if (ans.is_correct) stat.correct += 1;
                    topicAccumulator.set(key, stat);
                });

                const topicStats = Array.from(topicAccumulator.values())
                    .map((item) => ({
                        ...item,
                        wrong: Math.max(item.total - item.correct, 0),
                        accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0
                    }))
                    .sort((a, b) => a.accuracy - b.accuracy);

                let aiAnalysis = null;
                try {
                    const weakTopics = topicStats.filter((t) => t.accuracy < 60).map((t) => t.topic);
                    const mistakeSamples = normalizedAnswers
                        .filter((a) => !a.is_correct)
                        .slice(0, 5)
                        .map((a) => ({
                            question: a.question_text,
                            topic: a.topic,
                            studentAnswer: a.student_answer,
                            correctAnswer: a.correct_answer
                        }));

                    const aiRes = await api.post('/ai/student-analysis', {
                        studentName: 'Öğrenci',
                        examAverage: score,
                        gradeLevel: Number(questions?.[0]?.class_level || questions?.[0]?.grade_level || 0) || null,
                        weakTopics,
                        topicStats,
                        mistakeSamples,
                        recentResults: [{ examId, score }]
                    });

                    aiAnalysis = aiRes.data?.data || null;
                } catch (_) {
                    aiAnalysis = null;
                }

                setResult({
                    score,
                    correctCount,
                    wrongCount,
                    totalQuestions,
                    answers: normalizedAnswers,
                    topicStats,
                    aiAnalysis
                });
            } catch (error) {
                console.error("Sonuç hatası", error);
                setResult(null);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [examId, location.search]);

    if (loading) return (
        <div className="p-20 text-center text-xl animate-pulse text-gray-400 font-medium">
            🤖 Yapay Zeka Sınavını Analiz Ediyor...
        </div>
    );
    
    if (!result) return (
        <div className="p-10 text-center text-red-600">
            ❌ Sonuç bulunamadı.
        </div>
    );

    const aiAnalysis = result.aiAnalysis;
    
    // Grafik Verisi
    const chartData = [
        { name: 'Doğru', value: result.correctCount, color: '#10B981' },
        { name: 'Yanlış', value: result.wrongCount, color: '#EF4444' },
    ];

    const performanceLevel = result.score >= 80 ? 'Harika' : result.score >= 60 ? 'İyi' : 'Geliştirilebilir';
    const performanceColor = result.score >= 80 ? 'from-green-500 to-emerald-600' : result.score >= 60 ? 'from-blue-500 to-cyan-600' : 'from-orange-500 to-red-600';

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                
                {/* --- BAŞLIK VE PUAN --- */}
                <div className={`bg-gradient-to-r ${performanceColor} rounded-3xl shadow-2xl p-12 mb-10 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 opacity-10 text-9xl">📊</div>
                    <h1 className="text-4xl font-bold mb-2 relative z-10">Sınav Sonucun</h1>
                    <div className="text-7xl font-black my-6 relative z-10">{Math.round(result.score)}</div>
                    <div className="flex gap-4 text-lg font-semibold relative z-10">
                        <span className="bg-white/20 px-4 py-2 rounded-lg">{performanceLevel}</span>
                        <span className="bg-white/20 px-4 py-2 rounded-lg">{result.correctCount}/{result.totalQuestions} Doğru</span>
                    </div>
                </div>

                {/* --- AI KOÇ YORUMU --- */}
                {aiAnalysis && (
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl p-8 mb-10 text-white relative">
                        <div className="absolute top-4 right-4 text-5xl opacity-20">🤖</div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 relative z-10">
                            <span>EduMath Koçunun Yorumu</span>
                        </h2>
                        <p className="text-lg leading-relaxed opacity-95 mb-6 relative z-10">
                            {aiAnalysis.general_comment || aiAnalysis.feedbackPlan || aiAnalysis.topicNarrative}
                        </p>

                        <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-lg mb-4 text-sm font-bold">
                            🧭 Seviye: {aiAnalysis.studentLevel || 'Belirlenemedi'}
                        </div>
                        
                        <div className="bg-white/10 backdrop-blur rounded-xl p-5 relative z-10">
                            <h3 className="font-bold mb-3 text-yellow-300 flex items-center gap-2">🚀 Çalışma Tavsiyeleri:</h3>
                            <ul className="space-y-2">
                                {(aiAnalysis.study_recommendations || aiAnalysis.recommendedActions || []).map((rec, i) => (
                                    <li key={i} className="flex gap-2 items-start">
                                        <span className="text-yellow-300 font-bold">→</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {(aiAnalysis.practiceQuestionPrompts || []).length > 0 && (
                            <div className="bg-white/10 backdrop-blur rounded-xl p-5 relative z-10 mt-4">
                                <h3 className="font-bold mb-3 text-cyan-200">🧠 Gemini Soru Üretim Promptları</h3>
                                <ul className="space-y-2 text-sm">
                                    {aiAnalysis.practiceQuestionPrompts.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {(aiAnalysis.nextStudyPlan || []).length > 0 && (
                            <div className="bg-white/10 backdrop-blur rounded-xl p-5 relative z-10 mt-4">
                                <h3 className="font-bold mb-3 text-emerald-200">📅 Gelişim Planı</h3>
                                <ul className="space-y-2 text-sm">
                                    {aiAnalysis.nextStudyPlan.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {result.topicStats?.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Konu Bazlı Eksik Analizi</h3>
                        <div className="space-y-3">
                            {result.topicStats.map((topic, idx) => (
                                <div key={`${topic.topic}-${idx}`} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-gray-800">{topic.topic}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${topic.accuracy >= 70 ? 'bg-green-100 text-green-700' : topic.accuracy >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            Başarı: %{topic.accuracy}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600">Doğru: {topic.correct} | Yanlış: {topic.wrong} | Toplam: {topic.total}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(aiAnalysis?.practiceQuestions || []).length > 0 && (
                    <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🧩 Ek Pratik Soruları (Kişiselleştirilmiş)</h3>
                        <div className="space-y-4">
                            {aiAnalysis.practiceQuestions.map((pq, i) => (
                                <div key={`${pq.questionId || i}`} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">{pq.topic || 'Genel Matematik'} · {pq.difficulty || 'medium'}</span>
                                        <span className="text-xs text-gray-500">Soru {i + 1}</span>
                                    </div>
                                    <div className="font-semibold text-gray-800 mb-2"><MathText text={pq.questionText} /></div>
                                    {(pq.options || []).length > 0 && (
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {pq.options.map((opt) => (
                                                <li key={opt.optionId}>• <MathText text={opt.text} /></li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    
                    {/* --- SOL: GRAFİK --- */}
                    <Suspense fallback={<div className="bg-white rounded-3xl shadow-lg p-8 text-center text-gray-400 border border-gray-100">Grafik yükleniyor...</div>}>
                        <StudentResultDistributionChart
                            chartData={chartData}
                            correctCount={result.correctCount}
                            wrongCount={result.wrongCount}
                        />
                    </Suspense>

                    {/* --- SAĞ: İSTATİSTİKLER --- */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">İstatistikler</h3>
                        
                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Doğru Cevaplar</p>
                                    <p className="text-3xl font-bold text-green-600 mt-1">{result.correctCount}</p>
                                </div>
                                <span className="text-5xl opacity-20">✅</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Yanlış Cevaplar</p>
                                    <p className="text-3xl font-bold text-red-600 mt-1">{result.wrongCount}</p>
                                </div>
                                <span className="text-5xl opacity-20">❌</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Başarı Yüzdesi</p>
                                    <p className="text-3xl font-bold text-blue-600 mt-1">{Math.round((result.correctCount / result.totalQuestions) * 100)}%</p>
                                </div>
                                <span className="text-5xl opacity-20">📈</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- SORU DETAYLARI --- */}
                <div className="mb-10">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6">Soru Detayları</h3>
                    <div className="space-y-4">
                        {result.answers?.map((ans, index) => (
                            <div 
                                key={index} 
                                className={`bg-white rounded-2xl p-6 border-l-4 shadow-md hover:shadow-lg transition-all ${
                                    ans.is_correct ? 'border-green-500 bg-green-50/30' : 'border-red-500 bg-red-50/30'
                                }`}
                            >
                                {/* Soru Başlığı */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Soru {index + 1}</span>
                                        <div className="flex gap-2 mt-2">
                                            {ans.topic && (
                                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                                                    📌 {ans.topic}
                                                </span>
                                            )}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                ans.is_correct 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {ans.is_correct ? '✅ DOĞRU' : '❌ YANLIŞ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Soru Metni */}
                                <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                                    <p className="text-gray-800 font-medium leading-relaxed">
                                        <MathText text={ans.question_text} />
                                    </p>
                                </div>

                                {/* Cevap Karşılaştırması */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className={`p-4 rounded-xl ${
                                        ans.is_correct 
                                            ? 'bg-green-100 border border-green-300' 
                                            : 'bg-orange-100 border border-orange-300'
                                    }`}>
                                        <p className="text-xs font-bold text-gray-600 uppercase mb-1">Senin Cevabın</p>
                                        <p className="text-lg font-bold text-gray-800">{ans.student_answer}</p>
                                    </div>
                                    
                                    {!ans.is_correct && (
                                        <div className="p-4 rounded-xl bg-green-100 border border-green-300">
                                            <p className="text-xs font-bold text-gray-600 uppercase mb-1">Doğru Cevap</p>
                                            <p className="text-lg font-bold text-green-700">{ans.correct_answer}</p>
                                        </div>
                                    )}
                                </div>

                                {/* AI İPUCU */}
                                {aiAnalysis?.question_analysis?.[ans.question_id] && !ans.is_correct && (
                                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">Koçun İpucu</p>
                                            <p className="text-sm text-blue-800 italic leading-relaxed">
                                                {aiAnalysis.question_analysis[ans.question_id]}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- ALT BUTON --- */}
                <div className="text-center pb-10">
                    <button 
                        onClick={() => navigate('/student-dashboard')}
                        className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all transform hover:-translate-y-1"
                    >
                        ← Panele Dön
                    </button>
                </div>

            </div>
        </div>
    );
};

export default StudentResultPage;
