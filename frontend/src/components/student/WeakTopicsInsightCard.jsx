import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { fetchStudentInsights, generatePracticeQuestions } from '../../services/aiService';
import { useTranslation } from '../../i18n/useTranslation';
import AIPractice from '../exams/AIPractice';

function readStoredUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u._id || u.id || '';
  } catch {
    return '';
  }
}

export default function WeakTopicsInsightCard({
  compact = false,
  showPractice = true,
  onGoHub,
  className = '',
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    weakTopics: [],
    topics: [],
    suggested: false,
    hasActivity: false,
    scoringProvider: 'local-matrix',
    provider: 'local',
  });
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceLoadingTopic, setPracticeLoadingTopic] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchStudentInsights();
        if (cancelled) return;
        setInsights({
          weakTopics: Array.isArray(data?.weakTopics) ? data.weakTopics : [],
          topics: Array.isArray(data?.topics) ? data.topics : [],
          suggested: Boolean(data?.suggested),
          hasActivity: Boolean(data?.hasActivity),
          scoringProvider: data?.scoringProvider || 'local-matrix',
          provider: data?.provider || 'local',
        });
      } catch {
        if (!cancelled) setInsights({ weakTopics: [], topics: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayTopics = (insights.topics?.length ? insights.topics : []).slice(0, compact ? 3 : 5);

  const weakList =
    insights.weakTopics?.length > 0
      ? insights.weakTopics
      : displayTopics.filter((x) => x.isWeak).map((x) => x.topic);

  const subtitleKey = insights.suggested
    ? 'weakTopics.suggestedHint'
    : insights.scoringProvider === 'ml-service'
      ? 'weakTopics.subtitleMl'
      : 'weakTopics.subtitleLocal';

  const providerLabel = t(`chat.provider.${insights.provider}`) || t('chat.provider.unknown');

  const handlePractice = async (topics) => {
    const list = Array.isArray(topics) ? topics : weakList.slice(0, 3);
    if (!list.length) return;
    const single = list.length === 1 ? list[0] : '';
    setPracticeLoading(true);
    if (single) setPracticeLoadingTopic(single);
    setPracticeQuestions(null);
    try {
      const uid = readStoredUserId();
      const data = await generatePracticeQuestions({
        weakTopics: list,
        studentId: uid || undefined,
        count: 5,
      });
      setPracticeQuestions(data?.questions || []);
    } catch {
      setPracticeQuestions([]);
    } finally {
      setPracticeLoading(false);
      setPracticeLoadingTopic('');
    }
  };

  const goToTopicExercises = (topic) => {
    navigate(`/student/exercises?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl border border-violet-200/70 dark:border-violet-900/40 shadow-sm ${
          compact ? 'p-4' : 'p-6'
        }`}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 shrink-0">
            <Brain size={compact ? 20 : 24} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold text-slate-800 dark:text-white ${compact ? 'text-base' : 'text-lg'}`}>
              {t('weakTopics.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t(subtitleKey)}</p>
            {!loading && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500 mt-1">
                {t('weakTopics.providerNote', { provider: providerLabel })}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            {t('weakTopics.loading')}
          </p>
        ) : displayTopics.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{t('weakTopics.empty')}</p>
        ) : weakList.length === 0 ? (
          <p className="text-sm text-teal-700 dark:text-teal-300 flex items-start gap-2">
            <Sparkles size={18} className="shrink-0 mt-0.5" aria-hidden />
            {t('weakTopics.allGood')}
          </p>
        ) : (
          <ul className="space-y-3" aria-label={t('weakTopics.title')}>
            {displayTopics.map((row) => {
              const mastery = row.mastery ?? Math.round((row.accuracy || 0) * 100);
              const isWeak = row.isWeak || weakList.includes(row.topic);
              const topicBusy = practiceLoadingTopic === row.topic;
              return (
                <li key={row.topic} className="space-y-1.5">
                  <div className="flex justify-between gap-2 text-sm">
                    <span
                      className={`font-semibold truncate ${
                        isWeak ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {row.topic}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {row.suggested
                        ? t('weakTopics.startLabel')
                        : `%${mastery}${
                            row.total > 0 ? ` · ${t('weakTopics.attemptsLabel', { n: row.total })}` : ''
                          }`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isWeak ? 'bg-rose-400 dark:bg-rose-500' : 'bg-teal-500 dark:bg-teal-400'
                      }`}
                      style={{ width: `${Math.max(4, mastery)}%` }}
                    />
                  </div>
                  {isWeak && showPractice && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => goToTopicExercises(row.topic)}
                        className="inline-flex items-center min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700"
                      >
                        {t('weakTopics.goExercises')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePractice([row.topic])}
                        disabled={practiceLoading}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
                      >
                        {topicBusy ? (
                          <>
                            <Loader2 size={14} className="animate-spin" aria-hidden />
                            {t('weakTopics.practicing')}
                          </>
                        ) : (
                          t('weakTopics.practiceTopic')
                        )}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {!loading && (
          <div className={`flex flex-wrap gap-2 ${compact ? 'mt-3' : 'mt-5'}`}>
            {showPractice && weakList.length > 0 && (
              <button
                type="button"
                onClick={() => handlePractice(weakList.slice(0, 3))}
                disabled={practiceLoading}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {practiceLoading && !practiceLoadingTopic ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    {t('weakTopics.practicing')}
                  </>
                ) : (
                  t('weakTopics.practice')
                )}
              </button>
            )}
            {onGoHub && (
              <button
                type="button"
                onClick={onGoHub}
                className="inline-flex items-center min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold border border-sky-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                {t('studyHub.title')}
              </button>
            )}
          </div>
        )}
      </div>

      {practiceQuestions && practiceQuestions.length > 0 && (
        <AIPractice questions={practiceQuestions} sourceLabel={t('weakTopics.subtitleLocal')} />
      )}
    </div>
  );
}
