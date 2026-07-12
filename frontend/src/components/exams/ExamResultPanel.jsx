import React, { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  AlertTriangle,
  X,
  Brain,
  Sparkles,
  Clock,
  Download,
  Link2,
  Loader2,
} from 'lucide-react';
import QuestionVisual from '../questions/QuestionVisual.jsx';
import QuestionTextWithPattern from '../questions/QuestionTextWithPattern.jsx';
import { MatchingPracticeCard, SequencePracticeCard } from './InteractivePracticeCards.jsx';
import StudentHint from '../StudentHint.jsx';
import SolutionDisplay from '../questions/SolutionDisplay.jsx';
import Button from '../ui/Button.jsx';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { printElementById } from '../../utils/printElement.js';

function ScoreRing({ score }) {
  const ok = score >= 50;
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative w-28 h-28 mx-auto mb-5">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" strokeWidth="8" className="stroke-surface-100 dark:stroke-surface-700" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={ok ? 'stroke-emerald-500' : 'stroke-amber-500'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display text-2xl font-semibold tabular-nums ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
          {clamped}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">puan</span>
      </div>
    </div>
  );
}

/**
 * Sınav sonrası sonuç + isteğe bağlı AI antrenman paneli.
 */
export default function ExamResultPanel({
  examResult,
  examId,
  examTitle,
  practiceQuestions,
  practiceState,
  loadingAI,
  onGeneratePractice,
  onPracticeAnswer,
  onMatchingAnswer,
  onSequenceMove,
  onBackToList,
}) {
  const { showToast } = useToast();
  const [sharing, setSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const score = examResult?.score ?? 0;
  const ok = score >= 50;
  const weakTopics = examResult?.weakTopics || [];
  const resolvedExamId = examId || examResult?.examId;
  const title = examTitle || examResult?.examTitle || 'Sınav sonucu';

  const handlePrint = useCallback(() => {
    printElementById('exam-result-print', { title: `Matova — ${title}` });
  }, [title]);

  const handleShare = useCallback(async () => {
    if (!resolvedExamId) {
      showToast('Paylaşım için sınav bilgisi eksik.', 'error');
      return;
    }
    setSharing(true);
    try {
      const res = await apiClient.post(`/exams/${resolvedExamId}/share`);
      const path = res.data?.data?.path;
      if (!path) throw new Error('path missing');
      const url = `${window.location.origin}${path}`;
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        showToast('Paylaşım bağlantısı panoya kopyalandı (14 gün geçerli).', 'success');
      } catch {
        showToast('Bağlantı hazır — aşağıdan kopyalayabilirsiniz.', 'success');
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Paylaşım bağlantısı oluşturulamadı.', 'error');
    } finally {
      setSharing(false);
    }
  }, [resolvedExamId, showToast]);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pt-4 sm:pt-6 pb-20 space-y-8">
      <section
        id="exam-result-print"
        className="relative overflow-hidden bg-white/95 dark:bg-surface-800/95 p-6 sm:p-10 rounded-[1.75rem] shadow-soft border border-surface-200/80 dark:border-surface-700 text-center backdrop-blur-sm"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage: ok
              ? 'radial-gradient(at 50% 0%, rgb(16 185 129 / 0.12) 0px, transparent 55%)'
              : 'radial-gradient(at 50% 0%, rgb(245 158 11 / 0.14) 0px, transparent 55%)',
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 mb-2">
            Matova
          </p>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              ok
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            {ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
            {ok ? 'Başarılı tamamlandı' : 'Geliştirme fırsatı'}
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-surface-900 dark:text-white mb-1">
            Sınav Tamamlandı!
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-4">{title}</p>
          <ScoreRing score={score} />

          <div className="flex flex-wrap justify-center gap-3 text-sm text-surface-500 mb-6">
            {examResult.totalTimeSpentSeconds != null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
                <Clock size={14} />
                {Math.floor(examResult.totalTimeSpentSeconds / 60)} dk {examResult.totalTimeSpentSeconds % 60} sn
              </span>
            ) : null}
            {examResult.hintsUsedCount != null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-medium">
                İpucu: {examResult.hintsUsedCount}
                {examResult.hintsUsedCount > 0 ? ' · puan kesintisi yok' : ''}
              </span>
            ) : null}
            {examResult.correctCount != null ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700">
                Doğru {examResult.correctCount} · Yanlış {examResult.wrongCount ?? '—'}
              </span>
            ) : null}
          </div>

          <div className="no-print flex flex-wrap justify-center gap-2 mb-6">
            <Button type="button" variant="outline" size="md" icon={Download} onClick={handlePrint}>
              Yazdır / PDF
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={sharing ? undefined : Link2}
              disabled={sharing || !resolvedExamId}
              onClick={handleShare}
            >
              {sharing ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Hazırlanıyor…
                </span>
              ) : (
                'Kısa link paylaş'
              )}
            </Button>
          </div>
          {shareUrl ? (
            <p className="no-print text-xs text-surface-500 mb-6 break-all max-w-lg mx-auto">
              {shareUrl}
            </p>
          ) : null}

          {weakTopics.length > 0 ? (
            <div className="bg-rose-50/90 dark:bg-rose-950/25 p-5 sm:p-6 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 max-w-lg mx-auto mb-6 text-left">
              <h3 className="font-display font-semibold text-rose-800 dark:text-rose-200 flex items-center gap-2 mb-3">
                <AlertTriangle size={18} /> Geliştirilecek konular
              </h3>
              <ul className="space-y-1.5 text-rose-700 dark:text-rose-300 text-sm">
                {weakTopics.map((topic, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    {topic}
                  </li>
                ))}
              </ul>

              {!practiceQuestions ? (
                <div className="no-print flex flex-col gap-2 mt-4">
                  <Button
                    variant="success"
                    fullWidth
                    disabled={loadingAI}
                    onClick={onGeneratePractice}
                    icon={loadingAI ? undefined : Sparkles}
                  >
                    {loadingAI ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI soruları hazırlıyor…
                      </span>
                    ) : (
                      'AI ile eksiklerini kapat'
                    )}
                  </Button>
                  <Link
                    to="/student/exercises"
                    className="w-full text-center py-3 min-h-[44px] rounded-xl font-bold border-2 border-teal-200 text-teal-800 dark:border-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                  >
                    Egzersizlere git
                  </Link>
                  <Link
                    to="/student/courses"
                    className="w-full text-center py-3 min-h-[44px] rounded-xl font-bold border-2 border-surface-200 text-surface-600 dark:border-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    İlgili derslere git
                  </Link>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-6">
              Tebrikler! Belirgin bir eksik konun yok.
            </p>
          )}

          <button
            type="button"
            onClick={onBackToList}
            className="no-print text-surface-500 hover:text-teal-700 dark:hover:text-teal-300 font-semibold underline underline-offset-4"
          >
            Listeye dön
          </button>
        </div>
      </section>

      {practiceQuestions ? (
        <section className="animate-slide-up no-print">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200 rounded-2xl">
              <Brain size={28} />
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-surface-800 dark:text-white">
                Sana özel antrenman
              </h3>
              <p className="text-surface-500 text-sm">Eksik konularına göre hazırlandı.</p>
            </div>
          </div>

          <div className="space-y-5">
            {practiceQuestions.map((q, idx) => {
              const state = practiceState[idx];
              const isAnswered = !!state;
              return (
                <article
                  key={idx}
                  className={`bg-white/95 dark:bg-surface-800/95 p-5 sm:p-6 rounded-card border-2 transition-all ${
                    isAnswered
                      ? state.isCorrect
                        ? 'border-emerald-300 dark:border-emerald-700'
                        : 'border-rose-300 dark:border-rose-800'
                      : 'border-surface-200/80 dark:border-surface-700 shadow-card'
                  }`}
                >
                  <span className="inline-block bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200 font-bold px-3 py-1 rounded-xl text-sm mb-4">
                    Soru {idx + 1}
                  </span>
                  <QuestionTextWithPattern
                    text={q.text || q.questionText}
                    mainClassName="text-lg font-medium text-surface-800 dark:text-white"
                    className="mb-4"
                  />
                  <QuestionVisual src={q.image} alt={`Antrenman ${idx + 1}`} className="mb-4" />

                  {q.type === 'matching' ? (
                    <MatchingPracticeCard
                      question={q}
                      state={state}
                      onChange={(promptId, selectedValue, correctPairs) =>
                        onMatchingAnswer(idx, promptId, selectedValue, correctPairs)
                      }
                    />
                  ) : q.type === 'sequence' ? (
                    <SequencePracticeCard
                      question={q}
                      state={state}
                      onMove={(index, direction, currentOrder, checkOnly = false) =>
                        onSequenceMove(idx, index, direction, currentOrder, checkOnly)
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                      {(Array.isArray(q.options) ? q.options : Object.values(q.options || {})).map((opt, i) => {
                        const optKey = ['A', 'B', 'C', 'D'][i];
                        const isSelected = state?.selected === (q.options?.A ? optKey : opt);
                        let btnClass =
                          'border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700/50';
                        if (isAnswered) {
                          if (q.correctAnswer === (q.options?.A ? optKey : opt)) {
                            btnClass = 'bg-emerald-100 border-emerald-500 text-emerald-800';
                          } else if (isSelected) {
                            btnClass = 'bg-rose-100 border-rose-500 text-rose-800';
                          } else {
                            btnClass = 'opacity-50';
                          }
                        } else if (isSelected) {
                          btnClass = 'border-teal-500 ring-2 ring-teal-400/40 bg-teal-50 dark:bg-teal-950/40';
                        }
                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isAnswered}
                            onClick={() =>
                              onPracticeAnswer(idx, q.options?.A ? optKey : opt, q.correctAnswer)
                            }
                            className={`p-4 border-2 rounded-2xl text-left transition-all min-h-[52px] ${btnClass}`}
                          >
                            <span className="font-bold mr-2 text-teal-700 dark:text-teal-300">{optKey})</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {isAnswered && q.type !== 'matching' && q.type !== 'sequence' ? (
                    <div
                      className={`mt-4 p-4 rounded-2xl text-sm ${
                        state.isCorrect
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                          : 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-200'
                      }`}
                    >
                      <div className="font-bold mb-1 flex items-center gap-2">
                        {state.isCorrect ? <CheckCircle size={16} /> : <X size={16} />}
                        {state.isCorrect ? 'Doğru cevap!' : 'Yanlış cevap'}
                      </div>
                      {!state.isCorrect && q.correctAnswer ? (
                        <p className="mb-2">
                          Doğru cevap: <strong>{q.correctAnswer}</strong>
                        </p>
                      ) : null}
                      {!state.isCorrect && q.solution ? (
                        <div className="mb-2">
                          <p className="text-xs font-bold opacity-70 mb-1">Çözüm</p>
                          <SolutionDisplay text={q.solution} />
                        </div>
                      ) : null}
                      {!state.isCorrect ? (
                        <StudentHint
                          questionId={q._id}
                          questionText={q.text || q.questionText}
                          studentAnswer={state?.selected || ''}
                          topic={q.topic}
                          subject={q.subject}
                          compact
                        />
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Button variant="secondary" size="lg" onClick={onBackToList}>
              Antrenmanı bitir
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
