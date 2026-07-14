import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { renderWithLatex } from '../../utils/latex.jsx';
import QuestionOptionGrid from '../questions/QuestionOptionGrid.jsx';
import QuestionStemCard from '../questions/QuestionStemCard.jsx';
import { MatchingPracticeCard, SequencePracticeCard } from './InteractivePracticeCards.jsx';
import StudentHint from '../StudentHint.jsx';
import { ExerciseFillPlay } from '../exercises/ExerciseGameInputs.jsx';
import { computeExamTotalTimeSpent } from '../../hooks/useQuestionTimer.js';
import {
  parseStoredAnswer,
  isExamQuestionAnswered,
  formatExamClock,
} from '../../utils/examAnswerUtils.js';
import {
  formatGroupProgressLabel,
  resolveGroupedDisplayQuestion,
} from '../../utils/questionGroup.js';
import { hasQuestionImage } from '../../utils/questionImage.js';

/**
 * Canlı sınav oturumu UI + cevap kayıt mantığı.
 * Zamanlayıcı / submit üst bileşende (ExamsPage) kalır.
 */
export default function ExamPlayer({
  exam,
  questionIndex,
  setQuestionIndex,
  userAnswers,
  setUserAnswers,
  answersRef,
  questionTimesRef,
  hintsUsedRef,
  timeLeft,
  examDuration,
  onConfirmFinish,
  ConfirmDialog,
  labels,
}) {
  const totalQuestions = exam.questions.length;
  const idx = Math.min(questionIndex, Math.max(0, totalQuestions - 1));
  const q = exam.questions[idx];
  const displayQ = q ? resolveGroupedDisplayQuestion(q, exam.questions) : null;
  const groupLabel = displayQ ? formatGroupProgressLabel(displayQ) : '';
  const isFirst = idx === 0;
  const isLast = idx >= totalQuestions - 1;
  const answeredCount = exam.questions.filter((item) =>
    isExamQuestionAnswered(item, userAnswers[item._id]),
  ).length;
  const urgent = timeLeft < 300;
  const progressPct = totalQuestions ? Math.round(((idx + 1) / totalQuestions) * 100) : 0;

  const stampTime = (questionId) => {
    questionTimesRef.current = {
      ...questionTimesRef.current,
      [questionId]: computeExamTotalTimeSpent(examDuration || exam.duration, timeLeft),
    };
  };

  const recordAnswer = (questionId, optionText) => {
    const next = { ...userAnswers, [questionId]: optionText };
    setUserAnswers(next);
    answersRef.current = next;
    stampTime(questionId);
  };

  const handleMatchingExam = (questionId, promptId, selectedValue) => {
    setUserAnswers((prev) => {
      const selected = { ...(parseStoredAnswer(prev[questionId]) || {}) };
      selected[promptId] = selectedValue;
      const next = { ...prev, [questionId]: JSON.stringify(selected) };
      answersRef.current = next;
      stampTime(questionId);
      return next;
    });
  };

  const handleSequenceExam = (questionId, index, direction, currentOrder, checkOnly = false) => {
    setUserAnswers((prev) => {
      const parsed = parseStoredAnswer(prev[questionId]);
      const baseOrder = Array.isArray(parsed?.order) ? [...parsed.order] : [...currentOrder];
      let nextOrder = [...baseOrder];
      if (!checkOnly) {
        const swapIndex = index + direction;
        if (swapIndex < 0 || swapIndex >= nextOrder.length) return prev;
        [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
        const next = { ...prev, [questionId]: JSON.stringify({ order: nextOrder, locked: false }) };
        answersRef.current = next;
        stampTime(questionId);
        return next;
      }
      const next = { ...prev, [questionId]: JSON.stringify({ order: nextOrder, locked: true }) };
      answersRef.current = next;
      stampTime(questionId);
      return next;
    });
  };

  const hintText = String(q?.assessmentMeta?.hint || '').trim();
  const isMcQuestion = q && !['matching', 'sequence', 'fill-blank'].includes(q.type);
  const [pendingMc, setPendingMc] = useState('');

  useEffect(() => {
    if (!q || !isMcQuestion) {
      setPendingMc('');
      return;
    }
    const saved = userAnswers[q._id];
    setPendingMc(typeof saved === 'string' ? saved : '');
  }, [q?._id, isMcQuestion, userAnswers]);

  const commitMcAnswer = () => {
    if (!q || !pendingMc.trim()) return;
    recordAnswer(q._id, pendingMc);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--edu-canvas)] dark:bg-surface-950">
        <div
          className="absolute inset-x-0 top-0 h-1 bg-surface-200 dark:bg-surface-800"
          aria-hidden
        >
          <div
            className="h-full bg-gradient-to-r from-kid-titleFrom via-kid-titleVia to-kid-titleTo transition-[width] duration-300 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <header className="sticky top-0 z-10 mt-1 border-b border-surface-200/80 dark:border-surface-700 bg-white/85 dark:bg-surface-900/90 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-3 shadow-sm">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700/80 dark:text-teal-300/80 mb-0.5">
              Canlı sınav
            </p>
            <h2 className="font-display text-lg sm:text-xl font-semibold text-surface-900 dark:text-white truncate">
              {exam.title}
            </h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">
              {labels.questionProgress({ current: idx + 1, total: totalQuestions })}
              {answeredCount > 0 && ` · ${labels.answeredCount({ n: answeredCount })}`}
            </p>
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold px-3.5 sm:px-4 py-2 rounded-2xl shrink-0 tabular-nums tracking-tight ${
              urgent
                ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-300/60 animate-pulse-soft'
                : 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200 ring-1 ring-teal-200/70 dark:ring-teal-800'
            }`}
            role="timer"
            aria-live="polite"
          >
            {formatExamClock(timeLeft)}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in">
            {q && displayQ ? (
              <article className="bg-white/95 dark:bg-surface-800/95 p-5 sm:p-7 rounded-[1.35rem] shadow-card dark:shadow-card-dark border border-surface-200/80 dark:border-surface-700 backdrop-blur-sm">
                {groupLabel ? (
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                    {groupLabel}
                  </p>
                ) : null}
                {displayQ.assessmentMeta?.sharedPrompt ? (
                  <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                    {displayQ.assessmentMeta.sharedPrompt}
                  </p>
                ) : null}
                <QuestionStemCard
                  question={displayQ}
                  questionLabel={labels.questionLabel({ n: idx + 1 })}
                  framed={false}
                  showImageInstruction={false}
                  className="mb-5"
                />

                {q.type === 'matching' ? (
                  <MatchingPracticeCard
                    examMode
                    question={q}
                    state={{ selected: parseStoredAnswer(userAnswers[q._id]) || {} }}
                    onChange={(promptId, value) => handleMatchingExam(q._id, promptId, value)}
                  />
                ) : q.type === 'sequence' ? (
                  <SequencePracticeCard
                    examMode
                    question={q}
                    state={(() => {
                      const obj = parseStoredAnswer(userAnswers[q._id]);
                      if (obj && Array.isArray(obj.order)) {
                        return { selected: obj.order, checked: !!obj.locked };
                      }
                      return undefined;
                    })()}
                    onMove={(index, direction, ord, checkOnly) =>
                      handleSequenceExam(q._id, index, direction, ord, checkOnly)
                    }
                  />
                ) : q.type === 'fill-blank' ? (
                  <ExerciseFillPlay
                    value={typeof userAnswers[q._id] === 'string' ? userAnswers[q._id] : ''}
                    onChange={(val) => recordAnswer(q._id, val)}
                  />
                ) : (
                  <>
                    <QuestionOptionGrid
                      options={q.options}
                      value={pendingMc}
                      onChange={setPendingMc}
                      letterOnly={hasQuestionImage(displayQ.image)}
                    />
                    <button
                      type="button"
                      onClick={commitMcAnswer}
                      disabled={!pendingMc.trim()}
                      className="mt-4 w-full rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 px-5 py-3 text-base font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Cevapla
                    </button>
                  </>
                )}

                {hintText ? (
                  <div className="mt-4 px-4 py-3 rounded-2xl bg-amber-50/90 dark:bg-amber-900/20 border border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-100 text-sm">
                    <span className="font-display font-semibold uppercase tracking-wider text-[10px] text-amber-700/90 dark:text-amber-200/80">
                      İpucu
                    </span>
                    <div className="mt-1">{renderWithLatex(hintText)}</div>
                  </div>
                ) : null}

                {userAnswers[q._id] ? (
                  <div className="mt-4">
                    <StudentHint
                      questionId={q._id}
                      questionText={q.text}
                      studentAnswer={
                        typeof userAnswers[q._id] === 'string'
                          ? userAnswers[q._id]
                          : JSON.stringify(userAnswers[q._id])
                      }
                      topic={q.topic || exam.title}
                      subject={q.subject || exam.subject}
                      compact
                      onHintUsed={(id) => {
                        if (id) hintsUsedRef.current.add(String(id));
                      }}
                    />
                  </div>
                ) : null}
              </article>
            ) : null}

            <nav className="flex flex-wrap gap-2 justify-center mt-6 px-1" aria-label="Soru numaraları">
              {exam.questions.map((item, qIdx) => {
                const answered = isExamQuestionAnswered(item, userAnswers[item._id]);
                const current = qIdx === idx;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => setQuestionIndex(qIdx)}
                    className={`w-9 h-9 min-w-[36px] rounded-xl text-sm font-bold transition-all duration-200 ${
                      current
                        ? 'bg-teal-600 text-white ring-2 ring-teal-300 scale-105 shadow-md'
                        : answered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                          : 'bg-white/80 text-surface-600 dark:bg-surface-800 dark:text-surface-300 border border-surface-200 dark:border-surface-600'
                    }`}
                    aria-label={`${labels.questionLabel({ n: qIdx + 1 })}${answered ? labels.questionAnsweredAria : ''}`}
                    aria-current={current ? 'step' : undefined}
                  >
                    {qIdx + 1}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <footer className="sticky bottom-0 bg-white/90 dark:bg-surface-900/95 backdrop-blur-xl border-t border-surface-200 dark:border-surface-700 p-4 flex flex-wrap items-center justify-between gap-3 shadow-[0_-8px_30px_-12px_rgba(15,23,42,0.12)]">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setQuestionIndex((n) => Math.max(0, n - 1))}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-semibold border border-surface-200 dark:border-surface-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
          >
            <ChevronLeft size={18} aria-hidden /> {labels.prev}
          </button>
          <div className="flex gap-2">
            {!isLast ? (
              <button
                type="button"
                onClick={() => setQuestionIndex((n) => Math.min(totalQuestions - 1, n + 1))}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 text-white hover:brightness-105 shadow-md shadow-teal-600/20"
              >
                {labels.next} <ChevronRight size={18} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConfirmFinish(false)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20"
              >
                {labels.finish}
              </button>
            )}
            {!isLast && (
              <button
                type="button"
                onClick={() => onConfirmFinish(true)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl font-semibold text-surface-600 dark:text-surface-300 border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800"
              >
                {labels.finishEarly}
              </button>
            )}
          </div>
        </footer>
      </div>
      {ConfirmDialog ? <ConfirmDialog /> : null}
    </>
  );
}
