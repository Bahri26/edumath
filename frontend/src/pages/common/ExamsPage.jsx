import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText, Plus, Trash2, Play, CheckCircle, AlertTriangle, X, Brain, Sparkles, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../services/api';
import { generatePracticeQuestions } from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { createExam } from '../../services/examService';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import QuestionTextWithPattern from '../../components/questions/QuestionTextWithPattern.jsx';
import { MatchingPracticeCard, SequencePracticeCard } from '../../components/exams/InteractivePracticeCards.jsx';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import StudentHint from '../../components/StudentHint.jsx';
import SolutionDisplay from '../../components/questions/SolutionDisplay.jsx';
import { computeExamTotalTimeSpent } from '../../hooks/useQuestionTimer.js';
import { formatDuration } from '../../utils/formatDuration.js';

const ExamsPage = ({ role }) => {
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ÖĞRETMEN STATE ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [duration, setDuration] = useState(25);
  const [selectedClass, setSelectedClass] = useState('9. Sınıf');
  const [examSubject, setExamSubject] = useState('');
  const [formError, setFormError] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('create');
  const { showToast } = useToast();

  // --- ÖĞRENCİ STATE ---
  const [activeExam, setActiveExam] = useState(null);
  const [examQuestionIndex, setExamQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Sonuç ve AI Alıştırma State'leri
  const [examResult, setExamResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState(null);
  const [practiceState, setPracticeState] = useState({});
  const [myResult, setMyResult] = useState(null);

  const timerRef = useRef(null);
  const answersRef = useRef({});
  const questionTimesRef = useRef({});
  const examDurationRef = useRef(0);

  const fetchExams = async () => {
    try {
      const endpoint = role === 'student' ? '/exams/by-class' : '/exams';
      const res = await apiClient.get(endpoint);
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // --- TEACHER: SINAV OLUŞTUR ---
  const handleCreateExam = async () => {
    if (!newTitle || !examSubject) {
      setFormError("Başlık ve Konu alanları zorunludur.");
      return;
    }
    setFormError('');
    setCreatingExam(true);
    try {
      await createExam({
        title: newTitle,
        duration,
        classLevel: selectedClass,
        subject: examSubject
      });
      showToast(`"${examSubject}" konusunda sınav başarıyla oluşturuldu!`, "success");
      setShowCreateModal(false);
      setNewTitle('');
      setExamSubject('');
      fetchExams();
    } catch (err) {
      setFormError("Hata: " + (err.response?.data?.message || err.message));
      showToast("Sınav oluşturulamadı.", "error");
    } finally {
      setCreatingExam(false);
    }
  };

  const handleDelete = async (id, canManage = true) => {
    if (canManage === false) {
      showToast('Bu sınavı silme yetkiniz yok', 'error');
      return;
    }
    const confirmed = await askConfirm({
      title: 'Sınav silinsin mi?',
      description:
        'Bu sınav ve varsa öğrenci sonuçları kalıcı olarak silinecek. Öğrenciler artık bu sınava giremez. Bu işlem geri alınamaz.',
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/exams/${id}`);
      fetchExams();
      showToast('Sınav silindi', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Sınav silinemedi', 'error');
    }
  };

  const PHASE_LABELS = {
    scheduled: 'Henüz başlamadı',
    live: 'Aktif',
    ended: 'Süre doldu',
  };

  const PHASE_BADGE = {
    scheduled: 'yellow',
    live: 'green',
    ended: 'blue',
  };

  // --- STUDENT: SINAV BAŞLAT/BİTİR ---
  const startExam = async (examId) => {
    try {
      const res = await apiClient.get(`/exams/${examId}/take`);
      const examData = res.data;
      setActiveExam(examData);
      setExamQuestionIndex(0);
      setTimeLeft(examData.duration * 60);
      examDurationRef.current = examData.duration;
      setUserAnswers({});
      answersRef.current = {};
      questionTimesRef.current = {};
      setExamResult(null);
      setPracticeQuestions(null);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishExam(answersRef.current, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      showToast(err.response?.data?.message || 'Sınav başlatılamadı.', 'error');
    }
  };

  const finishExam = async (answersOverride = null, timeLeftOverride = null) => {
    if (!activeExam) return;
    clearInterval(timerRef.current);
    const isAnswerMap =
      answersOverride != null &&
      typeof answersOverride === 'object' &&
      typeof answersOverride.preventDefault !== 'function';
    const payload = isAnswerMap
      ? answersOverride
      : Object.keys(answersRef.current).length
        ? answersRef.current
        : userAnswers;
    const remaining = timeLeftOverride ?? timeLeft;
    const totalTimeSpentSeconds = computeExamTotalTimeSpent(
      examDurationRef.current || activeExam.duration,
      remaining,
    );
    try {
      const res = await apiClient.post(`/exams/${activeExam._id}/submit`, {
        answers: payload,
        totalTimeSpentSeconds,
        questionTimes: questionTimesRef.current,
      });

      setExamResult({ ...res.data, totalTimeSpentSeconds });
      setActiveExam(null);
      fetchExams();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sınav gönderilirken hata oluştu.';
      showToast(msg, 'error');
    }
  };

  const confirmFinishExam = async (early = false) => {
    if (!activeExam) return;
    const totalQuestions = activeExam.questions.length;
    const answeredCount = activeExam.questions.filter((item) => userAnswers[item._id]).length;
    const unanswered = totalQuestions - answeredCount;

    const confirmed = await askConfirm({
      title: early ? 'Sınavı erken bitir?' : 'Sınavı bitir?',
      description:
        unanswered > 0
          ? `${unanswered} soru cevaplanmadı. Sınavı şimdi göndermek istiyor musun? Cevapladığın sorular kaydedilecek.`
          : 'Sınavı göndermek istiyor musun? Tüm cevapların kaydedilecek.',
    });
    if (confirmed) finishExam();
  };

  // --- STUDENT: KENDİ SONUCUMU GÖR ---
  const viewMyResult = async (examId) => {
    try {
      const res = await apiClient.get(`/exams/${examId}/my-result`);
      setMyResult(res.data);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Sonuç bulunamadı.';
      showToast(msg, 'error');
    }
  };

  // --- STUDENT: AI İLE ALIŞTIRMA OLUŞTUR ---
  const handleGeneratePractice = async () => {
    if (!examResult?.weakTopics || examResult.weakTopics.length === 0) return;
    
    setLoadingAI(true);
    try {
      const data = await generatePracticeQuestions({
        weakTopics: examResult.weakTopics,
        difficulty: 'Orta',
        count: 5,
      });
      setPracticeQuestions(data.questions);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const msg = status === 429
        ? 'AI kotası dolu, biraz sonra tekrar deneyin.'
        : 'AI şu an meşgul, lütfen tekrar dene.';
      showToast(msg, 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  // Alıştırma Sorusu Cevaplama (Anlık Geri Bildirim)
  const handlePracticeAnswer = (qIndex, optionKey, correctOption) => {
    setPracticeState(prev => ({
      ...prev,
      [qIndex]: {
        selected: optionKey,
        isCorrect: optionKey === correctOption
      }
    }));
  };

  const handleMatchingAnswer = (qIndex, promptId, selectedValue, correctPairs) => {
    setPracticeState((prev) => {
      const selected = { ...(prev[qIndex]?.selected || {}), [promptId]: selectedValue };
      const requiredPromptIds = Object.keys(correctPairs || {});
      const isComplete = requiredPromptIds.length > 0 && requiredPromptIds.every((id) => selected[id]);
      const isCorrect = isComplete && requiredPromptIds.every((id) => selected[id] === correctPairs[id]);
      return {
        ...prev,
        [qIndex]: {
          selected,
          isCorrect,
          checked: isComplete,
        },
      };
    });
  };

  const handleSequenceMove = (qIndex, index, direction, currentOrder, checkOnly = false) => {
    setPracticeState((prev) => {
      const nextOrder = [...currentOrder];
      if (!checkOnly) {
        const swapIndex = index + direction;
        [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
      }
      return {
        ...prev,
        [qIndex]: {
          selected: nextOrder,
          checked: checkOnly,
        },
      };
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // --- EKRAN 1: SINAV ANI (Öğrenci) ---
  if (activeExam && !examResult) {
    const totalQuestions = activeExam.questions.length;
    const idx = Math.min(examQuestionIndex, Math.max(0, totalQuestions - 1));
    const q = activeExam.questions[idx];
    const isFirst = idx === 0;
    const isLast = idx >= totalQuestions - 1;
    const answeredCount = activeExam.questions.filter((item) => userAnswers[item._id]).length;

    const recordAnswer = (questionId, optionText) => {
      const next = { ...userAnswers, [questionId]: optionText };
      setUserAnswers(next);
      answersRef.current = next;
      questionTimesRef.current = {
        ...questionTimesRef.current,
        [questionId]: computeExamTotalTimeSpent(
          examDurationRef.current || activeExam.duration,
          timeLeft,
        ),
      };
    };

    return (
      <>
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-900 flex flex-col">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 shadow-md sticky top-0 z-10 flex flex-wrap justify-between items-center gap-3 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold dark:text-white truncate">{activeExam.title}</h2>
            <p className="text-sm text-slate-500">
              Soru {idx + 1} / {totalQuestions}
              {answeredCount > 0 && ` · ${answeredCount} cevaplandı`}
            </p>
          </div>
          <div className={`text-xl sm:text-2xl font-mono font-bold px-3 sm:px-4 py-2 rounded-lg shrink-0 ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            {q && (
              <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex gap-3 mb-4">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 rounded-lg">
                    Soru {idx + 1}
                  </span>
                </div>
                <QuestionTextWithPattern
                  text={q.text}
                  mainClassName="text-lg font-medium text-slate-800 dark:text-white"
                  className="mb-4"
                />
                <QuestionVisual src={q.image} alt={`Soru ${idx + 1} gorseli`} className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Array.isArray(q.options) ? q.options : []).map((opt, i) => {
                    const optionText = opt?.text || '';
                    const isSelected = userAnswers[q._id] === optionText;
                    const letter = String.fromCharCode(65 + i);
                    return (
                      <label
                        key={i}
                        className={`flex items-start gap-3 p-4 min-h-[52px] border rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'}`}
                      >
                        <input
                          type="radio"
                          name={`q-${q._id}`}
                          value={optionText}
                          checked={isSelected}
                          onChange={() => recordAnswer(q._id, optionText)}
                          className="mt-1 w-5 h-5 text-indigo-600 shrink-0"
                        />
                        <div className="flex-1">
                          <div className="text-slate-700 dark:text-slate-200">
                            <span className="font-bold mr-2">{letter})</span>
                            {renderWithLatex(optionText)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center mt-6 px-1">
              {activeExam.questions.map((item, qIdx) => {
                const answered = !!userAnswers[item._id];
                const current = qIdx === idx;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setExamQuestionIndex(qIdx)}
                    className={`w-9 h-9 min-w-[36px] rounded-lg text-sm font-bold transition-all ${
                      current
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                        : answered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                    aria-label={`Soru ${qIdx + 1}${answered ? ', cevaplandı' : ''}`}
                    aria-current={current ? 'step' : undefined}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setExamQuestionIndex((n) => Math.max(0, n - 1))}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-semibold border border-slate-200 dark:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={18} aria-hidden /> Önceki
          </button>
          <div className="flex gap-2">
            {!isLast ? (
              <button
                type="button"
                onClick={() => setExamQuestionIndex((n) => Math.min(totalQuestions - 1, n + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Sonraki <ChevronRight size={18} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => confirmFinishExam(false)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl font-bold bg-green-600 text-white hover:bg-green-700"
              >
                Bitir
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => confirmFinishExam(true)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Erken bitir
              </button>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog />
      </>
    );
  }

  // --- EKRAN 2: SONUÇ VE AI ANTRENMAN ---
  if (examResult) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto pt-6 pb-20 space-y-8">
        
        {/* Sonuç Kartı */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
             {examResult.score >= 50 ? <CheckCircle size={40} /> : <AlertTriangle size={40} className="text-orange-500"/>}
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Sınav Tamamlandı!</h2>
          <p className="text-slate-500 mb-6">
            Başarı Puanın:{' '}
            <span className={`text-2xl font-bold ${examResult.score >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
              {examResult.score}
            </span>
            {examResult.totalTimeSpentSeconds != null && (
              <span className="block text-sm mt-2 text-slate-400">
                Süre: {Math.floor(examResult.totalTimeSpentSeconds / 60)} dk {examResult.totalTimeSpentSeconds % 60} sn
              </span>
            )}
          </p>
          
          {/* Eksik Konular Listesi */}
          {examResult.weakTopics && examResult.weakTopics.length > 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-lg mx-auto mb-6 text-left">
              <h3 className="font-bold text-red-700 dark:text-red-300 flex items-center gap-2 mb-3">
                <AlertTriangle size={18}/> Geliştirilmesi Gereken Konular:
              </h3>
              <ul className="list-disc list-inside space-y-1 text-red-600 dark:text-red-400">
                {examResult.weakTopics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
              
              {/* AI Butonu - Sadece sorular henüz üretilmediyse göster */}
              {!practiceQuestions && (
                <div className="flex flex-col gap-2 mt-4">
                <button 
                  onClick={handleGeneratePractice} 
                  disabled={loadingAI}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
                >
                  {loadingAI ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      AI Soruları Hazırlıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      AI İle Eksiklerini Kapat
                    </>
                  )}
                </button>
                <Link
                  to="/student/exercises"
                  className="w-full text-center py-3 rounded-xl font-bold border-2 border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                >
                  Egzersizlere git
                </Link>
                <Link
                  to="/student/courses"
                  className="w-full text-center py-3 rounded-xl font-bold border-2 border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  İlgili derslere git
                </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-green-600 font-medium mb-6">Tebrikler! Belirgin bir eksik konun yok. 🎉</div>
          )}

          <button onClick={() => setExamResult(null)} className="text-slate-500 hover:text-slate-800 underline">
            Listeye Dön
          </button>
        </div>

        {/* AI Tarafından Üretilen Alıştırma Alanı */}
        {practiceQuestions && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                <Brain size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Sana Özel Antrenman</h3>
                <p className="text-slate-500">Gemini AI tarafından eksiklerine göre hazırlandı.</p>
              </div>
            </div>

            <div className="space-y-6">
              {practiceQuestions.map((q, idx) => {
                const state = practiceState[idx];
                const isAnswered = !!state;

                return (
                  <div key={idx} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 transition-all ${isAnswered ? (state.isCorrect ? 'border-green-200' : 'border-red-200') : 'border-transparent shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg text-sm">Soru {idx + 1}</span>
                    </div>
                    
                    <QuestionTextWithPattern
                      text={q.text || q.questionText}
                      mainClassName="text-lg font-medium text-slate-800 dark:text-white"
                      className="mb-6"
                    />
                    <QuestionVisual src={q.image} alt={`Antrenman ${idx + 1} gorseli`} className="mb-4" />

                    {q.type === 'matching' ? (
                      <MatchingPracticeCard question={q} state={state} onChange={(promptId, selectedValue, correctPairs) => handleMatchingAnswer(idx, promptId, selectedValue, correctPairs)} />
                    ) : q.type === 'sequence' ? (
                      <SequencePracticeCard question={q} state={state} onMove={(index, direction, currentOrder, checkOnly = false) => handleSequenceMove(idx, index, direction, currentOrder, checkOnly)} />
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {(Array.isArray(q.options) ? q.options : Object.values(q.options)).map((opt, i) => {
                        const optKey = ["A", "B", "C", "D"][i]; // Harf karşılığı
                        const isSelected = state?.selected === (q.options.A ? optKey : opt); // Backend formatına göre kontrol
                        
                        let btnClass = "border-slate-200 hover:bg-slate-50"; // Default
                        if (isAnswered) {
                          if (q.correctAnswer === (q.options.A ? optKey : opt)) btnClass = "bg-green-100 border-green-500 text-green-800"; // Doğru şık
                          else if (isSelected) btnClass = "bg-red-100 border-red-500 text-red-800"; // Yanlış seçim
                          else btnClass = "opacity-50"; // Diğerleri
                        } else if (isSelected) {
                           btnClass = "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50";
                        }

                        return (
                          <button 
                            key={i} 
                            disabled={isAnswered}
                            onClick={() => handlePracticeAnswer(idx, q.options.A ? optKey : opt, q.correctAnswer)}
                            className={`p-4 border rounded-xl text-left transition-all ${btnClass}`}
                          >
                            <span className="font-bold mr-2">{optKey})</span> {opt}
                          </button>
                        )
                      })}
                    </div>
                    )}

                    {isAnswered && q.type !== 'matching' && q.type !== 'sequence' && (
                      <div className={`mt-4 p-4 rounded-xl text-sm ${state.isCorrect ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'}`}>
                        <div className="font-bold mb-1 flex items-center gap-2">
                           {state.isCorrect ? <CheckCircle size={16}/> : <X size={16}/>}
                           {state.isCorrect ? "Doğru Cevap!" : "Yanlış Cevap"}
                        </div>
                        {!state.isCorrect && q.correctAnswer && (
                          <p className="mb-2">Doğru cevap: <strong>{q.correctAnswer}</strong></p>
                        )}
                        {!state.isCorrect && q.solution ? (
                          <div className="mb-2">
                            <p className="text-xs font-bold opacity-70 mb-1">Çözüm</p>
                            <SolutionDisplay text={q.solution} />
                          </div>
                        ) : null}
                        {!state.isCorrect && (
                          <StudentHint
                            questionId={q._id}
                            questionText={q.text || q.questionText}
                            studentAnswer={state?.selected || ''}
                            topic={q.topic}
                            subject={q.subject}
                            compact
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="text-center mt-10">
               <button onClick={() => setExamResult(null)} className="bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-700">Antrenmanı Bitir</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EKRAN 3: SINAV LİSTESİ (Ana Ekran) ---
  const examListGrid = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.length === 0 ? (
          role === 'student' ? (
            <EmptyState
              icon={FileText}
              title="Henüz sınav yok"
              description="Öğretmeniniz sınav paylaştığında burada görünecek. Bu arada derslerinden çalışmaya devam edebilirsin."
              action={
                <Link to="/student/courses" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                  Derslere git
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Henüz sınav oluşturulmamış"
              description="İlk sınavınızı oluşturarak öğrencilerinize paylaşabilirsiniz."
              action={
                <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)} icon={Plus}>
                  Sınav oluştur
                </Button>
              }
            />
          )
        ) : exams.map(exam => (
            <Card key={exam._id}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><FileText size={24} /></div>
                <div className="flex items-center gap-2">
                  {exam.classLevel && <Badge color="indigo" className="font-semibold">{exam.classLevel}</Badge>}
                  {role === 'teacher' && exam.canManage !== false && (
                    <Button aria-label="Sınavı Sil" variant="outline" size="sm" onClick={() => handleDelete(exam._id, exam.canManage)}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{exam.title}</h3>
              {exam.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{exam.description}</p>}
              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 mb-6">
                <span className="flex items-center gap-1"><Clock size={14}/> {exam.duration} Dk</span>
                <span className="flex items-center gap-1"><AlertTriangle size={14}/> {exam.questionCount ?? exam.questions?.length ?? 0} Soru</span>
                {role === 'student' && exam.schedulePhase && (
                  <Badge color={PHASE_BADGE[exam.schedulePhase] || 'blue'}>{PHASE_LABELS[exam.schedulePhase] || exam.effectiveStatus}</Badge>
                )}
                {role === 'teacher' && exam.status && (
                  <Badge color={exam.status === 'active' ? 'green' : exam.status === 'draft' ? 'yellow' : 'blue'}>{exam.status}</Badge>
                )}
              </div>
              {role === 'student' ? (
                <div className="flex gap-2 flex-wrap">
                  {exam.canStart ? (
                    <Button variant="primary" size="md" onClick={() => startExam(exam._id)} icon={Play}>Başla</Button>
                  ) : exam.studentCompleted ? (
                    <Button variant="outline" size="md" onClick={() => viewMyResult(exam._id)} icon={CheckCircle}>Sonucumu Gör</Button>
                  ) : exam.schedulePhase === 'scheduled' ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium py-2">Sınav henüz başlamadı</span>
                  ) : (
                    <span className="text-sm text-slate-500 py-2">Sınav süresi doldu</span>
                  )}
                  {exam.studentCompleted && exam.canStart === false && exam.schedulePhase === 'live' && (
                    <Button variant="outline" size="md" onClick={() => viewMyResult(exam._id)}>Sonucum</Button>
                  )}
                </div>
              ) : (
                <div className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-center text-sm font-medium">
                  {exam.results.length} Katılım
                </div>
              )}
            </Card>
        ))}
      </div>
  );

  return (
    <>
      {role === 'student' ? (
        <StudentPageShell title="Sınavlar" subtitle="Sınıfına uygun sınavları çöz; sonuçlarını ve güçlendirme önerilerini buradan takip et.">
          {examListGrid}
        </StudentPageShell>
      ) : (
    <div className="animate-fade-in space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Sınavlar</h2>
        {role === 'teacher' && (
          <Button variant="primary" size="md" ariaLabel="Sınav Oluştur" onClick={() => setShowCreateModal(true)} icon={Plus}>
            Sınav Oluştur
          </Button>
        )}
      </div>

      {examListGrid}

    </div>
      )}

      {/* --- MODAL: KENDİ SONUCUM --- */}
      {myResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sonucum</h3>
              <button onClick={() => setMyResult(null)} className="text-slate-500 hover:text-slate-800">Kapat</button>
            </div>
            <div className="p-6 space-y-3 text-slate-700 dark:text-slate-200">
              <div><span className="font-semibold">Puan:</span> {myResult.score}</div>
              <div>
                <span className="font-semibold">Doğru:</span> {myResult.correctCount} • <span className="font-semibold">Yanlış:</span> {myResult.wrongCount}
              </div>
              {myResult.totalTimeSpentSeconds != null && (
                <div><span className="font-semibold">Süre:</span> {formatDuration(myResult.totalTimeSpentSeconds)}</div>
              )}
              {Array.isArray(myResult.weakTopics) && myResult.weakTopics.length > 0 && (
                <div>
                  <div className="font-semibold mb-1">Zayıf Konular</div>
                  <ul className="list-disc list-inside text-sm">
                    {myResult.weakTopics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                  <div className="flex flex-col gap-2 mt-4">
                    <Link to="/student/exercises" className="text-center py-2 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                      Egzersizlere git
                    </Link>
                    <Link to="/student/courses" className="text-center py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">
                      Derslere git
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SINAV OLUŞTUR --- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold">Sınav Oluştur</h3>
              </div>
              <button onClick={() => {setShowCreateModal(false); setActiveTab('create');}} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white"/>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Sınav Oluştur
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'questions' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Soru Seçimi ({selectedQuestions.length}/21)
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              {formError && <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium mb-4">{formError}</div>}
              
              {activeTab === 'create' ? (
                <div className="space-y-4">
                  {/* Row 1: Başlık - Full Width */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Sınav Adı *</label>
                    <input 
                      type="text" 
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                      placeholder="Örn: Matematik Denemesi - 1" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)}
                    />
                  </div>

                  {/* Row 2: Konu ve Sınıf */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Konu *</label>
                      <input 
                        type="text" 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        placeholder="Örn: Örüntüler" 
                        value={examSubject} 
                        onChange={e => setExamSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Sınıf *</label>
                      <select 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        value={selectedClass} 
                        onChange={e => setSelectedClass(e.target.value)}
                      >
                        {['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Süre ve Toplam Soru */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Süre (dakika) *</label>
                      <input 
                        type="number" 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" 
                        value={duration} 
                        onChange={e => setDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Toplam Soru</label>
                      <div className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-bold flex items-center justify-center">
                        21 Soru
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Açıklama */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Açıklama (İsteğe bağlı)</label>
                    <textarea 
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none" 
                      rows="2"
                      placeholder="Sınav hakkında not ekleyebilirsiniz..."
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: '1', text: 'Dikildiğinde boyu 20 cm olan bir fidan...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '2', text: '24 - 30 - 36 - 40 - 42 - 48...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '3', text: 'Verilen örüntüde eksik sayıları bulunuz...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '4', text: 'Başlangıçtaki para 40 TL...', difficulty: 'Kolay', subject: 'Matematik' },
                      { id: '5', text: 'Orta Soru 1', difficulty: 'Orta', subject: 'Matematik' },
                      { id: '6', text: 'Orta Soru 2', difficulty: 'Orta', subject: 'Matematik' },
                      { id: '7', text: 'Zor Soru 1', difficulty: 'Zor', subject: 'Matematik' },
                    ].map(q => (
                      <div
                        key={q.id}
                        onClick={() => {
                          if (!selectedQuestions.find(sq => sq.id === q.id)) {
                            setSelectedQuestions([...selectedQuestions, q]);
                          }
                        }}
                        className="p-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-300 dark:border-teal-700 rounded-lg cursor-pointer hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={12} className="text-teal-600 dark:text-teal-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{q.difficulty}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{q.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedQuestions.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Seçilen Sorular:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedQuestions.map((q, idx) => (
                          <div key={q.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                            <span>{idx + 1}</span>
                            <button
                              onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id))}
                              className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex gap-3">
              <Button 
                variant="outline" 
                size="md"
                className="flex-1"
                onClick={() => {setShowCreateModal(false); setActiveTab('create'); setSelectedQuestions([]);}}
              >
                İptal
              </Button>
              <Button 
                variant="primary" 
                size="md"
                className="flex-1"
                onClick={handleCreateExam}
                disabled={creatingExam || selectedQuestions.length === 0}
              >
                {creatingExam ? '⏳ Oluşturuluyor...' : `✓ Oluştur (${selectedQuestions.length}/21)`}
              </Button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog />
    </>
  );
};

export default ExamsPage;