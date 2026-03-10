import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

const DailyQuest = () => {
    const [quests, setQuests] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answered, setAnswered] = useState(false);
    const [explanation, setExplanation] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [todayProgress, setTodayProgress] = useState({ completedCount: 0, correctCount: 0, targetCount: 10 });
    const [streak, setStreak] = useState({ daily_streak: 0, xp_total: 0, current_level: 1 });
    const [hintUsed, setHintUsed] = useState(false);
    const [startedAt, setStartedAt] = useState(Date.now());

    useEffect(() => {
        fetchDailyQuests();
    }, []);

    const fetchDailyQuests = async () => {
        try {
            const res = await api.get('/learning/next');
            const item = res.data?.data?.item;
            const progress = res.data?.data?.progress;
            const streakData = res.data?.data?.streak;
            setQuests(item ? [item] : []);
            if (progress) setTodayProgress(progress);
            if (streakData) setStreak(streakData);
            setCurrentIndex(0);
            setStartedAt(Date.now());
        } catch (error) {
            console.error("Günlük görevler yüklenemedi:", error);
            setQuests([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = async (option) => {
        if (answered) return;

        setSelectedAnswer(option.option_id);
        setAnswered(true);

        try {
            const res = await api.post('/learning/answer', {
                questionId: currentQuestion.question_id,
                selectedOptionId: option.option_id,
                hintUsed,
                timeSpentMs: Date.now() - startedAt,
                source: 'daily_quest'
            });
            const result = res.data?.data;
            if (result?.progress) setTodayProgress(result.progress);
            if (result?.streak) setStreak(result.streak);

            if (result?.isCorrect) {
                setTimeout(() => {
                    if (result?.progress?.completedCount >= result?.progress?.targetCount) {
                        setCompleted(true);
                    } else if (result?.next_item) {
                        setQuests([result.next_item]);
                        setCurrentIndex(0);
                        setSelectedAnswer(null);
                        setAnswered(false);
                        setShowHint(false);
                        setExplanation(null);
                        setHintUsed(false);
                        setStartedAt(Date.now());
                    } else {
                        fetchDailyQuests();
                    }
                }, 1500);
            } else {
                setTimeout(() => {
                    setSelectedAnswer(null);
                    setAnswered(false);
                }, 1500);
            }
        } catch (error) {
            console.error("Cevap gönderme hatası:", error);
        }
    };

    // Yanlış Cevap Analizi
    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const currentQuestion = quests[currentIndex];
            const selectedOpt = currentQuestion.options.find(o => o.option_id === selectedAnswer);
            const correctOpt = currentQuestion.options.find(o => o.is_correct === 1);

            const res = await api.post('/ai/analyze-mistake', {
                questionText: currentQuestion.content_text,
                studentAnswer: selectedOpt?.option_text || "Seçim yapılmadı",
                correctAnswer: correctOpt?.option_text || "Bilinmiyor",
                topic: currentQuestion.topic
            });
            setExplanation(res.data.data.explanation);
        } catch (error) {
            console.error("Analiz hatası:", error);
            alert("Analiz şu an yapılamıyor. Lütfen daha sonra deneyin.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="inline-block">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-500 mt-4 animate-pulse">Günün soruları hazırlanıyor...</p>
            </div>
        );
    }

    if (quests.length === 0) {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-8 text-center">
                <div className="text-5xl mb-3">🎓</div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">Tüm Görevler Tamamlandı!</h3>
                <p className="text-blue-700">Çözülecek yeni soru kalmadı. Harika iş çıkardın!</p>
            </div>
        );
    }

    if (completed) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden"
            >
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-5 text-4xl animate-bounce" style={{animationDelay: '0s'}}>🎉</div>
                    <div className="absolute top-10 right-10 text-3xl animate-bounce" style={{animationDelay: '0.2s'}}>⭐</div>
                    <div className="absolute bottom-5 left-20 text-2xl animate-bounce" style={{animationDelay: '0.4s'}}>🏆</div>
                </div>

                <div className="relative z-10">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="text-7xl mb-4"
                    >
                        🏆
                    </motion.div>

                    <h2 className="text-4xl font-bold mb-2">Görevi Tamamladın!</h2>
                    <p className="text-lg opacity-95 mb-8">Bugünkü hedefini tamamladın. Harika performans!</p>

                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="inline-block bg-white/20 px-8 py-3 rounded-full font-bold text-lg backdrop-blur-sm border border-white/30"
                    >
                        🔥 Günlük Seri: {streak.daily_streak || 0} Gün · ⭐ XP: {streak.xp_total || 0}
                    </motion.div>

                    <p className="mt-8 text-sm opacity-90">Yarın yeni görevlerle karşılaşacaksın!</p>
                </div>
            </motion.div>
        );
    }

    const currentQuestion = quests[currentIndex];
    const progress = Math.min(100, Math.round(((todayProgress.completedCount || 0) / Math.max(todayProgress.targetCount || 10, 1)) * 100));

    return (
        <div className="w-full">
            {/* Başlık ve İlerleme */}
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        📅 Günün Görevi
                        <span className="text-base bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-600 px-3 py-1 rounded-lg font-semibold">
                            {(todayProgress.completedCount || 0) + 1} / {todayProgress.targetCount || 10}
                        </span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Günlük hedefin, seri durumun ve XP ilerlemen artık sunucuda takip ediliyor.</p>
                </div>
                <div className="text-right">
                    <div className="w-40 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5 }}
                        ></motion.div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% Tamamlandı</p>
                    <p className="text-xs text-indigo-500 mt-1">Seviye {streak.current_level || 1} · Seri {streak.daily_streak || 0}</p>
                </div>
            </div>

            {/* Soru Kartı */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    {/* Soru Başlığı */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                        <div className="flex gap-3">
                            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-bold uppercase">
                                {currentQuestion.topic || "Genel"}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-lg uppercase ${
                                currentQuestion.difficulty_level === 1 
                                    ? 'bg-green-100 text-green-700' 
                                    : currentQuestion.difficulty_level === 2 
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                            }`}>
                                {currentQuestion.difficulty_level === 1 ? 'Kolay' : currentQuestion.difficulty_level === 2 ? 'Orta' : 'Zor'}
                            </span>
                        </div>
                        <div className="text-right text-xs text-gray-400">Soru {(todayProgress.completedCount || 0) + 1}</div>
                    </div>

                    {/* Soru Metni */}
                    <div className="p-8">
                        <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                            {currentQuestion.content_text}
                        </h3>

                        {/* Şıklar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {currentQuestion.options && currentQuestion.options.map((opt, idx) => {
                                const isSelected = selectedAnswer === opt.option_id;
                                const isCorrect = opt.is_correct === 1;
                                const isWrong = isSelected && !isCorrect && answered;
                                const isRightChoice = isSelected && isCorrect && answered;

                                return (
                                    <motion.button
                                        key={opt.option_id}
                                        whileHover={{ scale: answered ? 1 : 1.02 }}
                                        whileTap={{ scale: answered ? 1 : 0.98 }}
                                        onClick={() => !answered && handleAnswer(opt)}
                                        className={`p-5 border-2 rounded-xl text-left transition-all font-medium text-lg group cursor-pointer relative overflow-hidden ${
                                            isWrong
                                                ? 'border-red-500 bg-red-50 text-red-700'
                                                : isRightChoice
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : answered
                                                        ? 'border-gray-200 bg-gray-50 text-gray-400'
                                                        : 'border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 text-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 inline-flex items-center justify-center bg-gray-300 text-xs font-bold rounded-full group-hover:bg-indigo-300 transition-colors">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span>{opt.option_text}</span>
                                        </div>

                                        {/* Cevap İşaretleri */}
                                        {isRightChoice && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                                                ✅
                                            </motion.div>
                                        )}
                                        {isWrong && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
                                                ❌
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* İpucu */}
                        {!answered && (
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                {!showHint ? (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setShowHint(true); setHintUsed(true); }}
                                        className="flex items-center gap-2 text-yellow-600 font-bold hover:text-yellow-700 transition-colors"
                                    >
                                        💡 İpucu Al
                                    </motion.button>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg border border-yellow-200 text-sm leading-relaxed"
                                    >
                                        <strong className="text-yellow-900">💡 İpucu:</strong>
                                        <p className="mt-2">{currentQuestion.hint || "Bu soru için özel bir ipucu yok, ama sen yapabilirsin! 💪"}</p>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Cevap Verildiyse Sonuç */}
                        {answered && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`mt-8 pt-6 border-t border-gray-100 text-center font-bold text-lg ${
                                    selectedAnswer && quests[currentIndex].options.find(o => o.option_id === selectedAnswer)?.is_correct
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {selectedAnswer && quests[currentIndex].options.find(o => o.option_id === selectedAnswer)?.is_correct
                                    ? '🎉 Doğru Cevap! Harika!'
                                    : '❌ Yanlış Cevap. Tekrar Deneyelim!'}
                            </motion.div>
                        )}

                        {/* Yanlış Cevap Analizi */}
                        {answered && selectedAnswer && !quests[currentIndex].options.find(o => o.option_id === selectedAnswer)?.is_correct && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
                                <p className="text-red-700 font-bold mb-3">Yanlış cevap! Nedenini öğrenmek ister misin?</p>
                                
                                {!explanation ? (
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
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
                                    </motion.button>
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-4 text-gray-700 text-sm bg-white p-4 rounded-lg border border-red-100 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: explanation }}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {/* Alt Bar */}
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                        <div className="text-xs text-gray-500">
                            💡 <span className="font-semibold">İpucu:</span> Bu soru zayıf konu, tekrar zamanı ve yakın geçmiş performansına göre seçildi.
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            🤖
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DailyQuest;
