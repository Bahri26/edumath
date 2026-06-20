import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, Trophy, XCircle,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import QuestionTextWithPattern from '../../components/questions/QuestionTextWithPattern.jsx';
import SolutionDisplay from '../../components/questions/SolutionDisplay.jsx';
import StudentHint from '../../components/StudentHint.jsx';
import Button from '../../components/ui/Button.jsx';
import { renderWithLatex } from '../../utils/latex.jsx';
import { getExercisePlayPresentation } from '../../utils/exercisePlayPresentation.js';
import {
  ExerciseFillPlay,
  ExerciseNumberPad,
  ExerciseShapeOptionRow,
  ExerciseTfPlay,
  ExerciseTwoChoiceBlocks,
} from '../../components/exercises/ExerciseGameInputs.jsx';
import { useQuestionTimer } from '../../hooks/useQuestionTimer.js';

function optionText(opt) {
  if (opt == null) return '';
  if (typeof opt === 'object') return String(opt.text ?? '');
  return String(opt);
}

export default function StudentExercisePlayer() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { resetQuestionTimer, recordAnswerTime, resetAll } = useQuestionTimer();

  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const examStartRef = useRef(null);
  const timerRef = useRef(null);

  const questions = exercise?.questions || [];
  const currentQ = questions[currentIndex];
  const currentFeedback = currentQ ? feedback[currentQ._id] : null;
  const isAnswered = currentQ ? !!feedback[currentQ._id] : false;

  const loadExercise = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/exercises/${exerciseId}/play`);
      const data = res.data?.data ?? res.data;
      setExercise(data);
      resetAll();
      resetQuestionTimer();
      examStartRef.current = Date.now();
      if (data.timeLimit) {
        setTimeLeft(data.timeLimit * 60);
      } else {
        setTimeLeft(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Egzersiz yüklenemedi', 'error');
      navigate('/student/exercises');
    } finally {
      setLoading(false);
    }
  }, [exerciseId, navigate, resetAll, resetQuestionTimer, showToast]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  useEffect(() => {
    if (timeLeft == null || finished) return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft, finished, exercise]);

  useEffect(() => {
    if (timeLeft === 0 && exercise && !finished && !submitting) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (!currentQ) return;
    const saved = answers[currentQ._id];
    setDraftAnswer(saved?.answer ?? saved ?? '');
    resetQuestionTimer();
  }, [currentIndex, currentQ, answers, resetQuestionTimer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const presentation = useMemo(() => {
    if (!currentQ || !exercise) return { key: 'default' };
    return getExercisePlayPresentation(currentQ, currentIndex, exercise.playTransform);
  }, [currentQ, currentIndex, exercise]);

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    try {
      const payloadAnswers = {};
      for (const q of questions) {
        const entry = answers[q._id];
        if (entry) {
          payloadAnswers[q._id] = entry;
        }
      }
      const totalTimeSpentSeconds = examStartRef.current
        ? Math.round((Date.now() - examStartRef.current) / 1000)
        : null;

      const res = await apiClient.post(`/exercises/${exerciseId}/submit`, {
        answers: payloadAnswers,
        totalTimeSpentSeconds,
      });
      setFinished(res.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gönderilemedi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheck = async () => {
    if (!currentQ || !draftAnswer.trim()) {
      showToast('Önce bir cevap seç veya yaz', 'warning');
      return;
    }
    setChecking(true);
    try {
      const timeSpent = recordAnswerTime(currentQ._id);
      const res = await apiClient.post(`/exercises/${exerciseId}/check-answer`, {
        questionId: currentQ._id,
        answer: draftAnswer,
      });
      const data = res.data;
      setFeedback((prev) => ({
        ...prev,
        [currentQ._id]: {
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          solution: data.solution,
        },
      }));
      setAnswers((prev) => ({
        ...prev,
        [currentQ._id]: { answer: draftAnswer, timeSpent },
      }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Kontrol edilemedi', 'error');
    } finally {
      setChecking(false);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const renderInput = () => {
    const opts = (currentQ.options || []).map(optionText).filter(Boolean);
    const pres = presentation.key;

    if (pres === 'num_pad') {
      return <ExerciseNumberPad value={draftAnswer} onChange={setDraftAnswer} />;
    }
    if (pres === 'tf_big' || pres === 'tf_play') {
      return (
        <ExerciseTfPlay
          optionA={opts[0]}
          optionB={opts[1]}
          value={draftAnswer}
          onChange={setDraftAnswer}
        />
      );
    }
    if (pres === 'shape_row') {
      return (
        <ExerciseShapeOptionRow
          options={currentQ.options || []}
          optionLabel={optionText}
          value={draftAnswer}
          onChange={setDraftAnswer}
        />
      );
    }
    if (pres === 'fill_play') {
      return <ExerciseFillPlay value={draftAnswer} onChange={setDraftAnswer} />;
    }
    if (opts.length === 2) {
      return (
        <ExerciseTwoChoiceBlocks
          leftLabel={opts[0]}
          rightLabel={opts[1]}
          value={draftAnswer}
          onChange={setDraftAnswer}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(currentQ.options || []).map((opt, i) => {
          const text = optionText(opt);
          const letter = String.fromCharCode(65 + i);
          const selected = draftAnswer === text;
          return (
            <button
              key={i}
              type="button"
              disabled={isAnswered}
              onClick={() => setDraftAnswer(text)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300'
              } ${isAnswered ? 'opacity-80' : ''}`}
            >
              <span className="font-bold mr-2">{letter})</span>
              {renderWithLatex(text)}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <StudentPageShell title="Egzersiz yükleniyor…" maxWidthClass="max-w-2xl">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600" size={36} />
        </div>
      </StudentPageShell>
    );
  }

  if (!exercise) return null;

  if (finished) {
    const review = finished.data?.answers || {};
    const wrongItems = Object.entries(review).filter(([, v]) => !v.isCorrect);
    return (
      <StudentPageShell
        title="Egzersiz tamamlandı"
        subtitle={exercise.name}
        maxWidthClass="max-w-2xl"
      >
        <div className="text-center space-y-4 mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Trophy className="text-emerald-600" size={40} />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">%{finished.score}</p>
          <p className="text-slate-600 dark:text-slate-300">
            {finished.correctCount} / {finished.totalQuestions} doğru
            {finished.totalTimeSpent ? ` · ${Math.floor(finished.totalTimeSpent / 60)} dk ${finished.totalTimeSpent % 60} sn` : ''}
          </p>
        </div>

        {wrongItems.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-bold text-slate-800 dark:text-white">Yanlış cevapların</h3>
            {wrongItems.map(([qid, rev]) => {
              const q = questions.find((item) => String(item._id) === String(qid));
              return (
                <div
                  key={qid}
                  className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-4"
                >
                  {q?.text && (
                    <QuestionTextWithPattern
                      text={q.text}
                      mainClassName="text-sm font-medium text-slate-800 dark:text-white mb-2"
                    />
                  )}
                  <p className="text-sm text-rose-700 dark:text-rose-300">
                    Doğru cevap: <strong>{rev.correctAnswer}</strong>
                  </p>
                  {rev.solution ? (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-500 mb-1">Çözüm</p>
                      <SolutionDisplay text={rev.solution} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <Link
              to="/student/exercises"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline"
            >
              Başka egzersiz dene →
            </Link>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/student/exercises')}>
            Listeye dön
          </Button>
          <Button variant="primary" onClick={() => navigate('/student/courses')}>
            Derslere git
          </Button>
        </div>
      </StudentPageShell>
    );
  }

  const progress = questions.length ? Math.round(((currentIndex + (isAnswered ? 1 : 0)) / questions.length) * 100) : 0;

  return (
    <StudentPageShell
      title={exercise.name}
      subtitle={exercise.description || `${exercise.totalQuestions} soru · ${exercise.classLevel}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/student/exercises')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Geri
        </button>
        <div className="flex items-center gap-3">
          {timeLeft != null && (
            <span className={`inline-flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-xl text-sm ${
              timeLeft < 120 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}>
              <Clock size={14} /> {formatTime(timeLeft)}
            </span>
          )}
          <span className="text-sm font-bold text-slate-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {currentQ && (
        <div className="rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold uppercase px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {currentQ.difficulty || 'Soru'}
            </span>
          </div>
          <QuestionTextWithPattern
            text={currentQ.text}
            mainClassName="text-lg font-medium text-slate-800 dark:text-white"
          />
          <QuestionVisual src={currentQ.image} alt="Soru görseli" />

          {renderInput()}

          {!isAnswered ? (
            <Button
              variant="primary"
              className="w-full"
              disabled={checking || !draftAnswer.trim()}
              onClick={handleCheck}
            >
              {checking ? 'Kontrol ediliyor…' : 'Kontrol et'}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl flex items-start gap-3 ${
                currentFeedback.isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
              }`}>
                {currentFeedback.isCorrect ? <CheckCircle size={22} className="shrink-0" /> : <XCircle size={22} className="shrink-0" />}
                <div>
                  <p className="font-bold">
                    {currentFeedback.isCorrect ? 'Doğru!' : 'Yanlış cevap'}
                  </p>
                  {!currentFeedback.isCorrect && (
                    <>
                      <p className="text-sm mt-1">
                        Doğru cevap: <strong>{currentFeedback.correctAnswer}</strong>
                      </p>
                      {currentFeedback.solution ? (
                        <div className="mt-3">
                          <p className="text-xs font-bold opacity-70 mb-1">Çözüm</p>
                          <SolutionDisplay text={currentFeedback.solution} />
                        </div>
                      ) : null}
                      <StudentHint
                        questionId={currentQ._id}
                        questionText={currentQ.text}
                        studentAnswer={draftAnswer}
                        topic={currentQ.topic}
                        subject={currentQ.subject}
                        compact
                      />
                    </>
                  )}
                </div>
              </div>
              <Button variant="primary" className="w-full" onClick={goNext} disabled={submitting}>
                {currentIndex < questions.length - 1 ? (
                  <>Sonraki soru <ArrowRight size={16} className="ml-1 inline" /></>
                ) : (
                  submitting ? 'Kaydediliyor…' : 'Bitir ve kaydet'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </StudentPageShell>
  );
}
