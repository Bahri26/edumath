import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, FileText, Plus, Trash2, Play, CheckCircle, AlertTriangle, X, GripVertical } from 'lucide-react';
import apiClient from '../../services/api';
import { generatePracticeQuestions } from '../../services/aiService';
import { useToast } from '../../context/ToastContext';
import { createExam } from '../../services/examService';
import SkeletonCard from '../../components/ui/SkeletonCard';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Card from '../../components/ui/Card.jsx';
import ExamPlayer from '../../components/exams/ExamPlayer.jsx';
import ExamResultPanel from '../../components/exams/ExamResultPanel.jsx';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { computeExamTotalTimeSpent } from '../../hooks/useQuestionTimer.js';
import { formatDuration } from '../../utils/formatDuration.js';
import { isExamQuestionAnswered } from '../../utils/examAnswerUtils.js';
import { useTranslation } from '../../i18n/useTranslation';

const ExamsPage = ({ role }) => {
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const { t } = useTranslation();
  const sx = (key, params) => t(`studentExams.${key}`, params);
  const [searchParams, setSearchParams] = useSearchParams();
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
  const hintsUsedRef = useRef(new Set());
  const autoStartHandled = useRef(false);

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

  useEffect(() => {
    if (role !== 'student' || loading || autoStartHandled.current) return;
    const startId = searchParams.get('start');
    if (!startId) return;
    autoStartHandled.current = true;
    setSearchParams({}, { replace: true });
    startExam(startId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, role, searchParams]);

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

  const PHASE_LABELS = role === 'student'
    ? {
        scheduled: sx('scheduled'),
        live: sx('phaseLive'),
        ended: sx('ended'),
      }
    : {
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
      hintsUsedRef.current = new Set();
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
      showToast(err.response?.data?.message || sx('errStart'), 'error');
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
        hintsUsedQuestionIds: [...hintsUsedRef.current],
      });

      setExamResult({
        ...res.data,
        totalTimeSpentSeconds,
        hintsUsedCount: hintsUsedRef.current.size,
      });
      setActiveExam(null);
      fetchExams();
    } catch (err) {
      const msg = err?.response?.data?.message || sx('errSubmit');
      showToast(msg, 'error');
    }
  };

  const confirmFinishExam = async (early = false) => {
    if (!activeExam) return;
    const totalQuestions = activeExam.questions.length;
    const answeredCount = activeExam.questions.filter((item) =>
      isExamQuestionAnswered(item, userAnswers[item._id]),
    ).length;
    const unanswered = totalQuestions - answeredCount;

    const confirmed = await askConfirm({
      title: early ? sx('confirmEarlyTitle') : sx('confirmFinishTitle'),
      description:
        unanswered > 0
          ? sx('confirmUnanswered', { n: unanswered })
          : sx('confirmAllAnswered'),
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
    return (
      <ExamPlayer
        exam={activeExam}
        questionIndex={examQuestionIndex}
        setQuestionIndex={setExamQuestionIndex}
        userAnswers={userAnswers}
        setUserAnswers={setUserAnswers}
        answersRef={answersRef}
        questionTimesRef={questionTimesRef}
        hintsUsedRef={hintsUsedRef}
        timeLeft={timeLeft}
        examDuration={examDurationRef.current || activeExam.duration}
        onConfirmFinish={confirmFinishExam}
        ConfirmDialog={ConfirmDialog}
        labels={{
          questionProgress: (p) => sx('questionProgress', p),
          answeredCount: (p) => sx('answeredCount', p),
          questionLabel: (p) => sx('questionLabel', p),
          questionAnsweredAria: sx('questionAnsweredAria'),
          prev: sx('prev'),
          next: sx('next'),
          finish: sx('finish'),
          finishEarly: sx('finishEarly'),
        }}
      />
    );
  }

  // --- EKRAN 2: SONUÇ VE AI ANTRENMAN ---
  if (examResult) {
    return (
      <ExamResultPanel
        examResult={examResult}
        practiceQuestions={practiceQuestions}
        practiceState={practiceState}
        loadingAI={loadingAI}
        onGeneratePractice={handleGeneratePractice}
        onPracticeAnswer={handlePracticeAnswer}
        onMatchingAnswer={handleMatchingAnswer}
        onSequenceMove={handleSequenceMove}
        onBackToList={() => setExamResult(null)}
      />
    );
  }

  // --- EKRAN 3: SINAV LİSTESİ (Ana Ekran) ---
  const examListGrid = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {exams.length === 0 ? (
          role === 'student' ? (
            <EmptyState
              icon={FileText}
              title={sx('emptyTitle')}
              description={sx('emptyDesc')}
              action={
                <Link to="/student/courses" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700">
                  {sx('goCourses')}
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
            <Card key={exam._id} interactive className="flex flex-col h-full !p-5">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${
                  role === 'student'
                    ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                    : 'bg-brand-50 dark:bg-brand-900/30 text-brand-600'
                }`}>
                  <FileText size={22} />
                </div>
                <div className="flex items-center gap-2">
                  {exam.classLevel && <Badge color="indigo" className="font-semibold">{exam.classLevel}</Badge>}
                  {role === 'teacher' && exam.canManage !== false && (
                    <Button aria-label="Sınavı Sil" variant="outline" size="sm" onClick={() => handleDelete(exam._id, exam.canManage)}>
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
              <h3 className="font-display text-lg font-semibold text-surface-900 dark:text-white mb-1">{exam.title}</h3>
              {exam.description && <p className="text-sm text-surface-500 dark:text-surface-400 mb-3 line-clamp-2">{exam.description}</p>}
              <div className="flex flex-wrap items-center gap-2 text-sm text-surface-600 dark:text-surface-300 mb-6">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-50 dark:bg-surface-900/40"><Clock size={14}/> {exam.duration} Dk</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-50 dark:bg-surface-900/40">
                  {role === 'student'
                    ? sx('questionsCount', { n: exam.questionCount ?? exam.questions?.length ?? 0 })
                    : `${exam.questionCount ?? exam.questions?.length ?? 0} Soru`}
                </span>
                {role === 'student' && exam.schedulePhase && (
                  <Badge color={PHASE_BADGE[exam.schedulePhase] || 'blue'}>{PHASE_LABELS[exam.schedulePhase] || exam.effectiveStatus}</Badge>
                )}
                {role === 'teacher' && exam.status && (
                  <Badge color={exam.status === 'active' ? 'green' : exam.status === 'draft' ? 'yellow' : 'blue'}>{exam.status}</Badge>
                )}
              </div>
              <div className="mt-auto">
              {role === 'student' ? (
                <div className="flex gap-2 flex-wrap">
                  {exam.canStart ? (
                    <Button variant="soft" size="md" onClick={() => startExam(exam._id)} icon={Play}>{sx('start')}</Button>
                  ) : exam.studentCompleted ? (
                    <Button variant="outline" size="md" onClick={() => viewMyResult(exam._id)} icon={CheckCircle}>{sx('viewResult')}</Button>
                  ) : exam.schedulePhase === 'scheduled' ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium py-2">{sx('scheduled')}</span>
                  ) : (
                    <span className="text-sm text-surface-500 py-2">{sx('ended')}</span>
                  )}
                  {exam.studentCompleted && exam.canStart === false && exam.schedulePhase === 'live' && (
                    <Button variant="outline" size="md" onClick={() => viewMyResult(exam._id)}>{sx('viewResult')}</Button>
                  )}
                </div>
              ) : (
                <div className="w-full bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 py-2.5 rounded-xl text-center text-sm font-medium">
                  {exam.results.length} Katılım
                </div>
              )}
              </div>
            </Card>
        ))}
      </div>
  );

  return (
    <>
      {role === 'student' ? (
        <StudentPageShell title={sx('pageTitle')} subtitle={sx('pageSubtitle')}>
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
                    <Link to="/student/exercises" className="text-center py-2 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700">
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
            <div className="bg-gradient-to-r from-teal-700 to-sky-700 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="font-display text-2xl font-semibold">Sınav Oluştur</h3>
              </div>
              <button onClick={() => {setShowCreateModal(false); setActiveTab('create');}} className="p-2 hover:bg-white/20 rounded-lg">
                <X size={24} className="text-white"/>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'create' ? 'border-b-2 border-teal-600 text-teal-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                Sınav Oluştur
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`flex-1 py-3 font-semibold text-sm transition-all ${activeTab === 'questions' ? 'border-b-2 border-teal-600 text-teal-600 bg-white dark:bg-slate-800' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
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
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
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
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
                        placeholder="Örn: Örüntüler" 
                        value={examSubject} 
                        onChange={e => setExamSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Sınıf *</label>
                      <select 
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
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
                        className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none" 
                        value={duration} 
                        onChange={e => setDuration(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Toplam Soru</label>
                      <div className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-sm font-bold flex items-center justify-center">
                        21 Soru
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Açıklama */}
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-200">Açıklama (İsteğe bağlı)</label>
                    <textarea 
                      className="w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none" 
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
                          <div key={q.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
                            <span>{idx + 1}</span>
                            <button
                              onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq.id !== q.id))}
                              className="ml-0.5 hover:text-teal-900 dark:hover:text-teal-100"
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