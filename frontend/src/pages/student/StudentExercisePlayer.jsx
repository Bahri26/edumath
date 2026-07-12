import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, Clock, Loader2, Trophy, XCircle,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import { useTranslation } from '../../i18n/useTranslation';
import QuestionOptionGrid from '../../components/questions/QuestionOptionGrid.jsx';
import QuestionStemCard from '../../components/questions/QuestionStemCard.jsx';
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
import { MatchingPracticeCard } from '../../components/exams/InteractivePracticeCards.jsx';
import { parseStoredAnswer } from '../../utils/examAnswerUtils.js';
import { useQuestionTimer } from '../../hooks/useQuestionTimer.js';

function optionText(opt) {
  if (opt == null) return '';
  if (typeof opt === 'object') return String(opt.text ?? '');
  return String(opt);
}

function parseMatchingDraft(raw) {
  const parsed = parseStoredAnswer(raw);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function isMatchingComplete(question, draft) {
  const prompts = question?.interactionData?.prompts || [];
  const selected = parseMatchingDraft(draft);
  return prompts.length > 0 && prompts.every((p) => selected[p.id]);
}

function hasAnswerReady(question, draft) {
  if (!question) return false;
  if (question.type === 'matching') return isMatchingComplete(question, draft);
  return String(draft ?? '').trim().length > 0;
}

export default function StudentExercisePlayer() {
  const { t } = useTranslation();
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
      showToast(err.response?.data?.message || t('exercisePlayer.errLoad'), 'error');
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
        if (prev == null || prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // Only (re)start when exercise loads / finish toggles — not every tick.
  }, [finished, exercise?.timeLimit]);

  useEffect(() => {
    if (timeLeft === 0 && exercise && !finished && !submitting) {
      handleFinish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  useEffect(() => {
    if (!currentQ) return;
    const saved = answers[currentQ._id];
    const raw = saved?.answer ?? saved ?? '';
    if (currentQ.type === 'matching') {
      setDraftAnswer(typeof raw === 'string' ? raw : JSON.stringify(raw || {}));
    } else {
      setDraftAnswer(typeof raw === 'string' ? raw : String(raw ?? ''));
    }
    resetQuestionTimer();
    // Intentionally omit `answers` — updating it after check must not reset draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQ?._id, resetQuestionTimer]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const presentation = useMemo(() => {
    if (!currentQ || !exercise) return { key: 'default' };
    return getExercisePlayPresentation(currentQ, currentIndex, exercise.playTransform);
  }, [currentQ, currentIndex, exercise]);

  // Must stay above early returns — conditional hooks trigger React #310.
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
      showToast(err.response?.data?.message || t('exercisePlayer.errSubmit'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheck = async () => {
    if (!currentQ || !hasAnswerReady(currentQ, draftAnswer)) {
      showToast(t('exercisePlayer.pickAnswer'), 'warning');
      return;
    }
    setChecking(true);
    try {
      const timeSpent = recordAnswerTime(currentQ._id);
      const answerPayload =
        currentQ.type === 'matching' && typeof draftAnswer !== 'string'
          ? JSON.stringify(draftAnswer)
          : draftAnswer;
      const res = await apiClient.post(`/exercises/${exerciseId}/check-answer`, {
        questionId: currentQ._id,
        answer: answerPayload,
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
        [currentQ._id]: { answer: answerPayload, timeSpent },
      }));
    } catch (err) {
      showToast(err.response?.data?.message || t('exercisePlayer.errCheck'), 'error');
    } finally {
      setChecking(false);
    }
  };

  const handleMatchingChange = (promptId, value) => {
    const selected = { ...parseMatchingDraft(draftAnswer), [promptId]: value };
    setDraftAnswer(JSON.stringify(selected));
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      handleFinish();
    }
  };

  const renderInput = () => {
    const qType = currentQ.type;
    const opts = (currentQ.options || []).map(optionText).filter(Boolean);
    const pres = presentation.key;

    if (qType === 'matching') {
      return (
        <MatchingPracticeCard
          examMode
          question={currentQ}
          state={{ selected: parseMatchingDraft(draftAnswer) }}
          onChange={handleMatchingChange}
        />
      );
    }

    if (qType === 'fill-blank' || pres === 'fill_play') {
      return (
        <ExerciseFillPlay
          value={typeof draftAnswer === 'string' ? draftAnswer : ''}
          onChange={setDraftAnswer}
        />
      );
    }

    if (qType === 'true-false' || pres === 'tf_big' || pres === 'tf_play') {
      return (
        <ExerciseTfPlay
          optionA={opts[0] || 'Doğru'}
          optionB={opts[1] || 'Yanlış'}
          value={draftAnswer}
          onChange={setDraftAnswer}
        />
      );
    }

    if (pres === 'num_pad') {
      return <ExerciseNumberPad value={draftAnswer} onChange={setDraftAnswer} />;
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
      <QuestionOptionGrid
        options={currentQ.options}
        value={draftAnswer}
        onChange={setDraftAnswer}
        disabled={isAnswered}
      />
    );
  };

  if (loading) {
    return (
      <StudentPageShell title={t('exercisePlayer.loading')} maxWidthClass="max-w-2xl">
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-teal-600" size={36} />
        </div>
      </StudentPageShell>
    );
  }

  if (!exercise) return null;

  if (!questions.length) {
    return (
      <StudentPageShell
        title={exercise.name || t('exercisePlayer.emptyTitle')}
        subtitle={exercise.description || ''}
        maxWidthClass="max-w-2xl"
      >
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 p-8 text-center">
          <p className="font-bold text-slate-900 dark:text-white">{t('exercisePlayer.emptyTitle')}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{t('exercisePlayer.emptyHint')}</p>
          <Button variant="primary" className="mt-6" onClick={() => navigate('/student/exercises')}>
            {t('exercisePlayer.backToHub')}
          </Button>
        </div>
      </StudentPageShell>
    );
  }

  if (finished) {
    const review = finished.data?.answers || {};
    const wrongItems = Object.entries(review).filter(([, v]) => !v.isCorrect);
    return (
      <StudentPageShell
        title={t('exercisePlayer.completed')}
        subtitle={exercise.name}
        maxWidthClass="max-w-2xl"
      >
        <div className="text-center space-y-4 mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Trophy className="text-emerald-600" size={40} />
          </div>
          <p className="text-3xl font-black text-slate-800 dark:text-white">%{finished.score}</p>
          <p className="text-slate-600 dark:text-slate-300">
            {t('exercisePlayer.scoreSummary', { correct: finished.correctCount, total: finished.totalQuestions })}
            {finished.totalTimeSpent
              ? ` · ${t('exercisePlayer.timeSummary', {
                  minutes: Math.floor(finished.totalTimeSpent / 60),
                  seconds: finished.totalTimeSpent % 60,
                })}`
              : ''}
          </p>
        </div>

        {wrongItems.length > 0 && (
          <div className="space-y-4 mb-8">
            <h3 className="font-bold text-slate-800 dark:text-white">{t('exercisePlayer.wrongTitle')}</h3>
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
                    {t('exercisePlayer.correctAnswer', { answer: rev.correctAnswer })}
                  </p>
                  {rev.solution ? (
                    <div className="mt-2">
                      <p className="text-xs font-bold text-slate-500 mb-1">{t('exercisePlayer.solution')}</p>
                      <SolutionDisplay text={rev.solution} />
                    </div>
                  ) : null}
                </div>
              );
            })}
            <Link
              to="/student/exercises"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:underline"
            >
              {t('exercisePlayer.tryAnother')}
            </Link>
          </div>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate('/student/exercises')}>
            {t('exercisePlayer.backToList')}
          </Button>
          <Button variant="primary" onClick={() => navigate('/student/courses')}>
            {t('exercisePlayer.goCourses')}
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
          <ArrowLeft size={16} aria-hidden /> {t('exercisePlayer.back')}
        </button>
        <div className="flex items-center gap-3">
          {timeLeft != null && (
            <span
              className={`inline-flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-xl text-sm ${
                timeLeft < 120 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
              role="timer"
              aria-live="polite"
              aria-atomic="true"
              aria-label={t('exercisePlayer.timeRemaining')}
            >
              <Clock size={14} aria-hidden="true" /> {formatTime(timeLeft)}
            </span>
          )}
          <span className="text-sm font-bold text-slate-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {currentQ && (
        <div className="rounded-[1.25rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <QuestionStemCard
            question={currentQ}
            questionLabel={`Soru ${currentIndex + 1}`}
            framed={false}
          />

          {renderInput()}

          {!isAnswered ? (
            <Button
              variant="primary"
              className="w-full"
              disabled={checking || !hasAnswerReady(currentQ, draftAnswer)}
              onClick={handleCheck}
            >
              {checking ? t('exercisePlayer.checking') : t('exercisePlayer.check')}
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
                    {currentFeedback.isCorrect ? t('exercisePlayer.correct') : t('exercisePlayer.wrong')}
                  </p>
                  {!currentFeedback.isCorrect && (
                    <>
                      <p className="text-sm mt-1">
                        {t('exercisePlayer.correctAnswerLabel')}{' '}
                        <strong>
                          {typeof currentFeedback.correctAnswer === 'object'
                            ? JSON.stringify(currentFeedback.correctAnswer)
                            : String(currentFeedback.correctAnswer ?? '')}
                        </strong>
                      </p>
                      {currentFeedback.solution ? (
                        <div className="mt-3">
                          <p className="text-xs font-bold opacity-70 mb-1">{t('exercisePlayer.solutionLabel')}</p>
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
                  <>{t('exercisePlayer.nextQuestion')} <ArrowRight size={16} className="ml-1 inline" aria-hidden /></>
                ) : (
                  submitting ? t('exercisePlayer.saving') : t('exercisePlayer.finishSave')
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </StudentPageShell>
  );
}
