import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, RotateCcw, ChevronLeft, ChevronRight, Loader2, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../services/api';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import Button from '../../components/ui/Button.jsx';
import { renderWithLatex } from '../../utils/latex.jsx';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import { useTranslation } from '../../i18n/useTranslation';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudentFlashcards() {
  const { t } = useTranslation();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/me/flashcards', { params: { limit: 40 } });
      setCards(shuffle(res.data?.data || []));
      setIndex(0);
      setFlipped(false);
    } catch (err) {
      setCards([]);
      setError(err?.response?.data?.message || t('flashcards.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const card = cards[index];
  const total = cards.length;

  const go = (dir) => {
    setFlipped(false);
    setIndex((i) => {
      if (!total) return 0;
      return (i + dir + total) % total;
    });
  };

  return (
    <StudentPageShell
      title={t('flashcards.title')}
      subtitle={t('flashcards.subtitle')}
      maxWidthClass="max-w-2xl"
      headerAside={(
        <div className="p-3 bg-sky-100 dark:bg-sky-900/30 rounded-2xl">
          <Layers size={24} className="text-sky-600 dark:text-sky-300" aria-hidden />
        </div>
      )}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/student/exercises" className="text-sm font-semibold text-teal-600 hover:underline">
          ← {t('flashcards.backHub')}
        </Link>
        <Button type="button" variant="outline" size="sm" icon={RotateCcw} onClick={load}>
          {t('flashcards.reshuffle')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-teal-600" size={36} />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-8 text-center" role="alert">
          <p className="text-sm text-rose-800 mb-4">{error}</p>
          <Button variant="outline" onClick={load}>{t('flashcards.retry')}</Button>
        </div>
      ) : total === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className="font-bold text-slate-800 dark:text-white">{t('flashcards.empty')}</p>
          <p className="text-sm text-slate-500 mt-2">{t('flashcards.emptyHint')}</p>
          <Link
            to="/student/exercises"
            className="inline-flex mt-4 min-h-[44px] items-center px-5 py-2 rounded-xl font-bold bg-teal-600 text-white"
          >
            {t('flashcards.goExercises')}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-center text-sm font-bold text-slate-500">
            {t('flashcards.progress', { n: index + 1, total })}
            {card.topic ? ` · ${card.topic}` : ''}
          </p>

          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="w-full min-h-[280px] rounded-3xl border-2 border-sky-200 dark:border-sky-800 bg-gradient-to-br from-white to-sky-50 dark:from-slate-800 dark:to-sky-950/40 p-6 sm:p-8 text-left shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label={flipped ? t('flashcards.hideAnswer') : t('flashcards.showAnswer')}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 dark:text-sky-300">
                {flipped ? t('flashcards.back') : t('flashcards.front')}
              </span>
              {flipped ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
            </div>
            {!flipped ? (
              <div className="space-y-3">
                <div className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {renderWithLatex(card.text || '—')}
                </div>
                {card.image ? <QuestionVisual src={card.image} alt="" className="max-h-48 mx-auto" /> : null}
                <p className="text-xs text-slate-400 pt-4">{t('flashcards.tapHint')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-black uppercase text-emerald-600 dark:text-emerald-400">
                  {t('flashcards.answer')}
                </p>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {renderWithLatex(card.answer || '—')}
                </div>
                {card.solution ? (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300">
                    {renderWithLatex(card.solution)}
                  </div>
                ) : null}
                {card.exerciseName ? (
                  <p className="text-xs text-slate-400 pt-2">{card.exerciseName}</p>
                ) : null}
              </div>
            )}
          </button>

          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" icon={ChevronLeft} onClick={() => go(-1)}>
              {t('flashcards.prev')}
            </Button>
            <Button type="button" variant="primary" onClick={() => setFlipped((f) => !f)}>
              {flipped ? t('flashcards.hideAnswer') : t('flashcards.showAnswer')}
            </Button>
            <Button type="button" variant="outline" icon={ChevronRight} onClick={() => go(1)}>
              {t('flashcards.next')}
            </Button>
          </div>
        </div>
      )}
    </StudentPageShell>
  );
}
