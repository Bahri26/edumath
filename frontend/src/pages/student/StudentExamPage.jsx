import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import MathText from '../../components/common/MathText';

// --- KARALAMA TAHTASI BİLEŞENİ ---
const Whiteboard = () => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('black');

    useEffect(() => {
        const canvas = canvasRef.current;
        // Retina ekranlar için çözünürlük ayarı
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        canvas.style.width = `${canvas.offsetWidth}px`;
        canvas.style.height = `${canvas.offsetHeight}px`;

        const context = canvas.getContext("2d");
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = 3;
        contextRef.current = context;
    }, []);

    useEffect(() => {
        if(contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = color === 'white' ? 20 : 3; // Silgi daha kalın olsun
        }
    }, [color]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.beginPath();
        contextRef.current.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };
    const finishDrawing = () => {
        contextRef.current.closePath();
        setIsDrawing(false);
    };
    const draw = ({ nativeEvent }) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = nativeEvent;
        contextRef.current.lineTo(offsetX, offsetY);
        contextRef.current.stroke();
    };
    const clearBoard = () => {
        const canvas = canvasRef.current;
        contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-200 shadow-inner relative group overflow-hidden">
            {/* Araçlar */}
            <div className="absolute top-4 right-4 bg-white p-2 rounded-xl shadow-md flex gap-2 z-10 border border-gray-100">
                <button onClick={() => setColor('black')} className={`w-6 h-6 rounded-full bg-black ${color==='black' && 'ring-2 ring-blue-500'}`}></button>
                <button onClick={() => setColor('red')} className={`w-6 h-6 rounded-full bg-red-500 ${color==='red' && 'ring-2 ring-blue-500'}`}></button>
                <button onClick={() => setColor('blue')} className={`w-6 h-6 rounded-full bg-blue-600 ${color==='blue' && 'ring-2 ring-blue-500'}`}></button>
                <button onClick={() => setColor('white')} className={`w-6 h-6 rounded-full border bg-gray-100 flex items-center justify-center text-xs ${color==='white' && 'ring-2 ring-blue-500'}`}>🧽</button>
                <div className="w-px bg-gray-300 mx-1"></div>
                <button onClick={clearBoard} className="text-xs text-red-600 font-bold hover:bg-red-50 px-2 rounded">Sil</button>
            </div>
            
            <div className="absolute top-4 left-4 bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 select-none">
                ✏️ Karalama Tahtası
            </div>

            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={finishDrawing}
                onMouseMove={draw}
                className="w-full h-full cursor-crosshair touch-none"
            />
        </div>
    );
};

// --- ANA SAYFA ---
const StudentExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [explanation, setExplanation] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [hint, setHint] = useState(null);
    const [gettingHint, setGettingHint] = useState(false);
    const [attemptId, setAttemptId] = useState(null);
    const [durationMinutes, setDurationMinutes] = useState(20);
    const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);
    const [submitting, setSubmitting] = useState(false);
    const [examMeta, setExamMeta] = useState({ examType: null, title: '' });

    useEffect(() => {
        setExplanation(null);
        setHint(null);
    }, [currentIndex]);

    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const stored = localStorage.getItem('edumath_user');
                const user = stored ? JSON.parse(stored) : null;
                const studentId = user?.student_id || user?.id || user?.user_id;

                const [questionsRes, examRes] = await Promise.all([
                    api.get(`/exams/${examId}/questions`),
                    api.get(`/exams/${examId}`)
                ]);
                setQuestions(questionsRes.data.data);

                const exam = examRes.data?.data || examRes.data || {};
                setExamMeta({ examType: exam.exam_type || null, title: exam.title || '' });
                const duration = Number(exam.duration_minutes || 20);
                const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 20;
                setDurationMinutes(safeDuration);
                setRemainingSeconds(safeDuration * 60);

                const attemptRes = await api.post(`/exams/${examId}/attempts`, { studentId });
                setAttemptId(attemptRes.data?.attempt_id || attemptRes.data?.id);

                setLoading(false);
            } catch (error) {
                alert("Sınav yüklenemedi: " + (error.response?.data?.error || error.response?.data?.message || error.message));
                navigate('/student-exams');
            }
        };
        loadQuestions();
    }, [examId]);

    useEffect(() => {
        if (loading || !attemptId || submitting) return undefined;

        if (remainingSeconds <= 0) {
            handleSubmit(true);
            return undefined;
        }

        const timerId = window.setInterval(() => {
            setRemainingSeconds((prev) => Math.max(prev - 1, 0));
        }, 1000);

        return () => window.clearInterval(timerId);
    }, [remainingSeconds, loading, attemptId, submitting]);

    const handleSelect = (optionId) => {
        setAnswers({ ...answers, [questions[currentIndex].question_id]: optionId });
    };

    // AI İpucu Alma
    const handleGetHint = async () => {
        setGettingHint(true);
        try {
            const currentQ = questions[currentIndex];
            const res = await api.post('/ai/hint', {
                questionText: currentQ.content_text,
                topic: currentQ.topic
            });
            setHint(res.data.data.hint);
        } catch (error) {
            console.error("İpucu hatası:", error);
            alert("İpucu şu an alınamıyor. Lütfen daha sonra deneyin.");
        } finally {
            setGettingHint(false);
        }
    };

    // Yanlış Cevap Analizi
    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const currentQ = questions[currentIndex];
            const selectedOptId = answers[currentQ.question_id];
            const selectedOpt = currentQ.options.find(o => o.option_id === selectedOptId);
            const correctOpt = currentQ.options.find(o => o.is_correct === 1);

            const res = await api.post('/ai/analyze-mistake', {
                questionText: currentQ.content_text,
                studentAnswer: selectedOpt?.option_text || "Seçim yapılmadı",
                correctAnswer: correctOpt?.option_text || "Bilinmiyor",
                topic: currentQ.topic
            });
            setExplanation(res.data.data.explanation);
        } catch (error) {
            console.error("Analiz hatası:", error);
            alert("Analiz şu an yapılamıyor. Lütfen daha sonra deneyin.");
        } finally {
            setAnalyzing(false);
        }
    };

    // Soruyu Raporla (Hata Bildir)
    const handleReportQuestion = async () => {
        const description = prompt("Bu soruda ne hata var? (Örn: Cevap yanlış, görsel yok, yazım hatası)");
        if (!description) return;

        try {
            const currentQ = questions[currentIndex];
            await api.post('/questions/report', { questionId: currentQ.question_id, description });
            alert("📢 Geri bildiriminiz gönderildi! Teşekkürler! 🙏");
        } catch (error) {
            alert('Hata: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleSubmit = async (isAutoSubmit = false) => {
        if (submitting) return;
        if (!isAutoSubmit && !window.confirm("Sınavı bitirmek istediğine emin misin?")) return;

        setSubmitting(true);

        try {
            if (!attemptId) throw new Error('Sınav denemesi başlatılamadı');

            for (const qId of Object.keys(answers)) {
                const question = questions.find((q) => Number(q.question_id) === Number(qId));
                const hasOptions = Array.isArray(question?.options) && question.options.length > 0;
                await api.post(`/exams/attempts/${attemptId}/answer`, {
                    questionId: parseInt(qId),
                    ...(hasOptions
                        ? { selectedOptionId: answers[qId] }
                        : { studentAnswer: String(answers[qId] || '') })
                });
            }

            await api.post(`/exams/attempts/${attemptId}/submit`);
            navigate(`/exam-result/${examId}?attemptId=${attemptId}`);
        } catch (error) {
            alert("Gönderim hatası: " + (error.response?.data?.error || error.response?.data?.message || error.message));
            setSubmitting(false);
        }
    };

    const formattedTime = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

    if (loading) return <div>Yükleniyor...</div>;

    if (!questions || questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-lg text-gray-600">Bu sınav için soru bulunamadı.</p>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex] || {};
    const isLast = currentIndex === questions.length - 1;
    const examTypeNormalized = String(examMeta.examType || '').toLocaleLowerCase('tr-TR');
    const titleNormalized = String(examMeta.title || '').toLocaleLowerCase('tr-TR');
    const isMeasurementExam = ['diagnostic', 'practice'].includes(examTypeNormalized)
        || titleNormalized.includes('olcme')
        || titleNormalized.includes('ölçme')
        || titleNormalized.includes('degerlendirme')
        || titleNormalized.includes('değerlendirme');

    return (
        <div className="h-screen flex flex-col md:flex-row bg-gray-50 overflow-hidden font-sans">
            
            {/* SOL PANEL: SORU */}
            <div className="w-full md:w-5/12 h-full flex flex-col border-r border-gray-200 bg-white z-10 shadow-xl">
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm">
                            Soru {currentIndex + 1} / {questions.length}
                        </span>
                        <span className={`px-3 py-1 rounded-lg font-bold text-sm ${remainingSeconds <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            ⏱ {formattedTime} / {durationMinutes} dk
                        </span>
                        <button onClick={() => navigate('/student-exams')} className="text-gray-400 hover:text-red-500">Çıkış</button>
                    </div>

                    {currentQ.image_url && (
                        <div className="mb-5 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <img src={currentQ.image_url} alt="Soru görseli" className="max-h-72 w-full object-contain" />
                        </div>
                    )}

                    <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                        <MathText text={currentQ.content_text || ''} />
                    </h2>

                    <div className="space-y-3">
                        {(currentQ.options || []).map((opt) => (
                            <div 
                                key={opt.option_id}
                                onClick={() => handleSelect(opt.option_id)}
                                className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-3
                                    ${answers[currentQ.question_id] === opt.option_id 
                                        ? 'border-orange-500 bg-orange-50 text-orange-900' 
                                        : 'border-gray-100 hover:border-orange-200 hover:bg-gray-50'}`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs
                                    ${answers[currentQ.question_id] === opt.option_id ? 'bg-orange-500 border-orange-500 text-white' : 'text-gray-400'}`}>
                                    {String.fromCharCode(65 + currentQ.options.indexOf(opt))}
                                </div>
                                <MathText text={opt.option_text} />
                            </div>
                        ))}

                        {(!currentQ.options || currentQ.options.length === 0) && (
                            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                                <p className="text-sm text-gray-600 mb-3">Bu soru acik uclu. Cevabinizi asagiya yazin:</p>
                                <textarea
                                    value={answers[currentQ.question_id] || ''}
                                    onChange={(e) => setAnswers({ ...answers, [currentQ.question_id]: e.target.value })}
                                    rows={4}
                                    placeholder="Cevabinizi buraya yazin..."
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sokratik İpucu (Hint) Alanı */}
                    <div className="mt-6">
                        {!hint ? (
                            <button 
                                onClick={handleGetHint}
                                disabled={gettingHint}
                                className="w-full bg-blue-50 text-blue-700 border border-blue-200 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-100 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {gettingHint ? (
                                    <><div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div> Düşünülüyor...</>
                                ) : (
                                    <>💡 Yapay Zekadan İpucu İste</>
                                )}
                            </button>
                        ) : (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <p className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                                    💡 <span className="text-sm">EduMath Mentor</span>
                                </p>
                                <div 
                                    className="text-gray-700 text-sm bg-white p-3 rounded-lg border border-blue-100"
                                    dangerouslySetInnerHTML={{ __html: hint }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Yanlış Cevap Analizi - StudentExamPage */}
                    {!isMeasurementExam && answers[currentQ.question_id] && !(currentQ.options || []).find(o => o.option_id === answers[currentQ.question_id])?.is_correct && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-red-700 font-bold mb-3">⚠️ Yanlış cevap seçtin. Öğrenmek istiyorsan analiz ettir!</p>
                            
                            {!explanation ? (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {analyzing ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Hoca İnceliyor...
                                            </>
                                        ) : (
                                            <>🤖 Hatamı Analiz Et</>
                                        )}
                                    </button>
                                    <button 
                                        onClick={handleReportQuestion}
                                        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-orange-600 transition-all"
                                    >
                                        🚩 Bu soruda hata var
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    className="mt-4 text-gray-700 text-sm bg-white p-4 rounded-lg border border-red-100 prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: explanation }}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Alt Navigasyon */}
                <div className="p-4 border-t border-gray-100 flex justify-between bg-white">
                    <button 
                        onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                        disabled={currentIndex === 0}
                        className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl disabled:opacity-50"
                    >
                        ← Önceki
                    </button>

                    {isLast ? (
                        <button onClick={() => handleSubmit(false)} disabled={submitting} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 disabled:opacity-60">
                            {submitting ? 'Gönderiliyor...' : '🏁 Sınavı Bitir'}
                        </button>
                    ) : (
                        <button onClick={() => setCurrentIndex(c => c + 1)} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700">
                            Sonraki →
                        </button>
                    )}
                </div>
            </div>

            {/* SAĞ PANEL: TAHTA */}
            <div className="flex-1 bg-gray-100 p-2 pt-0 hidden md:block">
                <Whiteboard />
            </div>
        </div>
    );
};

export default StudentExamPage;
