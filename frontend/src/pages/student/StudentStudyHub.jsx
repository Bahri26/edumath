import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock, Play, Trophy, CheckCircle2, X, Layers } from 'lucide-react';
import apiClient from '../../services/api';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import WeakTopicsInsightCard from '../../components/student/WeakTopicsInsightCard.jsx';
import SkeletonCard from '../../components/ui/SkeletonCard.jsx';
import Button from '../../components/ui/Button.jsx';
import { useTranslation } from '../../i18n/useTranslation';
import { matchesTopic } from '../../utils/topicMatch';

export default function StudentStudyHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();
  const focusTopic = searchParams.get('topic')?.trim() || '';

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [listWarning, setListWarning] = useState(null);

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setListWarning(null);
    try {
      const res = await apiClient.get('/exercises/student/my-exercises', {
        params: { page: 1, limit: 50 },
      });
      const rows = res.data?.data ?? res.data ?? [];
      setExercises(Array.isArray(rows) ? rows : []);
      if (res.data?.warning) setListWarning(res.data.warning);
    } catch (err) {
      setExercises([]);
      setLoadError(err?.response?.data?.message || t('studyHub.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  const { displayedExercises, filterActive, noTopicMatch } = useMemo(() => {
    if (!focusTopic) {
      return { displayedExercises: exercises, filterActive: false, noTopicMatch: false };
    }
    const matched = exercises.filter((ex) => matchesTopic(ex, focusTopic));
    return {
      displayedExercises: matched,
      filterActive: true,
      noTopicMatch: matched.length === 0 && exercises.length > 0,
    };
  }, [exercises, focusTopic]);

  useEffect(() => {
    if (focusTopic && !loading) {
      document.getElementById('my-exercises')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusTopic, loading]);

  const clearTopicFilter = () => {
    searchParams.delete('topic');
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <StudentPageShell title={t('studyHub.title')} subtitle={t('studyHub.subtitle')} maxWidthClass="max-w-4xl">
      <div className="mb-8">
        <WeakTopicsInsightCard compact showPractice />
      </div>

      <section id="my-exercises" className="mb-10 scroll-mt-24">
        {filterActive && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/30 px-4 py-3">
            <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
              {t('studyHub.filterTopic', { topic: focusTopic })}
            </p>
            <button
              type="button"
              onClick={clearTopicFilter}
              className="inline-flex items-center gap-1 text-sm font-bold text-teal-700 dark:text-teal-300 hover:underline"
            >
              <X size={16} aria-hidden />
              {t('studyHub.clearFilter')}
            </button>
          </div>
        )}

        {listWarning ? (
          <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
            {listWarning}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Trophy size={22} className="text-amber-500" aria-hidden />
            {t('studyHub.myExercises')}
          </h2>
          <Link to="/student/quizzes" className="text-sm font-semibold text-teal-600 hover:underline">
            {t('studyHub.goQuizzes')}
          </Link>
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/80 dark:bg-rose-950/30 p-6 text-center" role="alert">
            <p className="text-sm text-rose-800 dark:text-rose-200 mb-4">{loadError}</p>
            <Button variant="outline" onClick={loadExercises}>{t('studyHub.retry')}</Button>
          </div>
        ) : loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-10 text-center bg-white/80 dark:bg-slate-800/50">
            <p className="font-bold text-slate-800 dark:text-white">{t('studyHub.noExercises')}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{t('studyHub.noExercisesHint')}</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/student/courses')}>
              {t('studyHub.goCourses')}
            </Button>
          </div>
        ) : noTopicMatch ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-900/50 p-8 text-center bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-900 dark:text-amber-200">{t('studyHub.noMatchTopic')}</p>
            <Button variant="outline" className="mt-4" onClick={clearTopicFilter}>
              {t('studyHub.clearFilter')}
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {displayedExercises.map((ex) => {
              const done = ex.studentProgress?.status === 'completed';
              const score = ex.studentProgress?.score;
              const count = ex.questionCount ?? ex.totalQuestions ?? 0;
              const highlighted =
                filterActive && focusTopic && matchesTopic(ex, focusTopic);
              return (
                <div
                  key={ex._id}
                  className={`rounded-2xl border bg-white dark:bg-slate-800 p-5 shadow-sm flex flex-col gap-3 ${
                    highlighted
                      ? 'border-teal-400 ring-2 ring-teal-200 dark:border-teal-600 dark:ring-teal-900/50'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{ex.name}</h3>
                      {ex.description ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {ex.description}
                        </p>
                      ) : null}
                    </div>
                    {done ? (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={14} aria-hidden /> %{score}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700">{ex.classLevel}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700">
                      {t('studyHub.questionsCount', { n: count })}
                    </span>
                    {ex.timeLimit ? (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 inline-flex items-center gap-1">
                        <Clock size={12} aria-hidden /> {ex.timeLimit} dk
                      </span>
                    ) : null}
                    {ex.topic ? (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 truncate max-w-full">
                        {ex.topic}
                      </span>
                    ) : null}
                  </div>
                  <Link
                    to={`/student/exercises/${ex._id}`}
                    className="mt-auto inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl font-bold bg-gradient-to-r from-teal-600 to-sky-600 text-white hover:brightness-105 px-4 py-2.5"
                  >
                    <Play size={18} aria-hidden />
                    {done ? t('studyHub.retryExercise') : t('studyHub.start')}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-sky-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 p-6">
          <BookOpen size={28} className="text-teal-600 mb-3" aria-hidden />
          <h3 className="font-bold text-slate-800 dark:text-white">{t('studyHub.quizCardTitle')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-4">{t('studyHub.quizCardDesc')}</p>
          <Link
            to="/student/courses"
            className="inline-flex min-h-[44px] items-center px-5 py-2 rounded-xl font-bold bg-sky-500 text-white hover:brightness-105"
          >
            {t('studyHub.goCourses')}
          </Link>
        </div>
        <div className="rounded-2xl border border-sky-200/70 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 p-6">
          <Layers size={28} className="text-sky-600 mb-3" aria-hidden />
          <h3 className="font-bold text-slate-800 dark:text-white">{t('studyHub.flashcardsTitle')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 mb-4">{t('studyHub.flashcardsDesc')}</p>
          <Link
            to="/student/flashcards"
            className="inline-flex min-h-[44px] items-center px-5 py-2 rounded-xl font-bold bg-sky-600 text-white hover:brightness-105"
          >
            {t('studyHub.openFlashcards')}
          </Link>
        </div>
      </section>
    </StudentPageShell>
  );
}
