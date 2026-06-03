import React, { useContext, useEffect, useState } from 'react';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { fetchStudentInsights, generatePracticeQuestions } from '../../services/aiService';
import { LanguageContext } from '../../context/LanguageContext';
import AIPractice from '../exams/AIPractice';

function readStoredUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u._id || u.id || '';
  } catch {
    return '';
  }
}

const copy = {
  TR: {
    title: 'Geliştirmen gereken konular',
    subtitle: 'Yerel analiz — sınav ve çalışmalarına göre',
    empty: 'Henüz konu listesi yüklenemedi. Biraz sonra tekrar dene veya öğretmenin konuları eklediğinden emin ol.',
    suggestedHint: 'Henüz yeterli sınav/çalışma verin yok. Sınıfına uygun konulardan başlaman için öneriler:',
    loading: 'Konular analiz ediliyor…',
    mastery: 'Başarı',
    attempts: '{{n}} deneme',
    practice: 'Önerilen alıştırma',
    practicing: 'Hazırlanıyor…',
    goHub: 'Çalışma merkezi',
    allGood: 'Harika! Şu an belirgin bir zayıf konu görünmüyor. Yine de tekrar için çalışabilirsin.',
    startLabel: 'Başla',
  },
  EN: {
    title: 'Topics to improve',
    subtitle: 'Local analysis from your quizzes and practice',
    empty: 'Could not load topics. Try again later or ask your teacher to add topics.',
    suggestedHint: 'Not enough quiz data yet. Suggested topics to start with:',
    loading: 'Analyzing topics…',
    mastery: 'Mastery',
    attempts: '{{n}} attempts',
    practice: 'Suggested practice',
    practicing: 'Preparing…',
    goHub: 'Study hub',
    allGood: 'Great! No weak topics stand out right now. You can still review in the study hub.',
    startLabel: 'Start',
  },
};

const fill = (str, vars) =>
  typeof str !== 'string' ? str : str.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : ''));

export default function WeakTopicsInsightCard({
  compact = false,
  showPractice = true,
  onGoHub,
  className = '',
}) {
  const { language } = useContext(LanguageContext);
  const t = copy[language] || copy.TR;
  const getText = (key) => t[key] || copy.TR[key];

  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState({
    weakTopics: [],
    topics: [],
    suggested: false,
    hasActivity: false,
  });
  const [practiceLoading, setPracticeLoading] = useState(false);
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

  const displayTopics = (insights.topics?.length ? insights.topics : [])
    .slice(0, compact ? 3 : 5);

  const weakList =
    insights.weakTopics?.length > 0
      ? insights.weakTopics
      : displayTopics.filter((x) => x.isWeak).map((x) => x.topic);

  const handlePractice = async () => {
    if (!weakList.length) return;
    setPracticeLoading(true);
    setPracticeQuestions(null);
    try {
      const uid = readStoredUserId();
      const data = await generatePracticeQuestions({
        weakTopics: weakList.slice(0, 3),
        studentId: uid || undefined,
        count: 5,
      });
      setPracticeQuestions(data?.questions || []);
    } catch {
      setPracticeQuestions([]);
    } finally {
      setPracticeLoading(false);
    }
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
              {getText('title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {insights.suggested ? getText('suggestedHint') : getText('subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            {getText('loading')}
          </p>
        ) : displayTopics.length === 0 ? (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{getText('empty')}</p>
        ) : weakList.length === 0 ? (
          <p className="text-sm text-teal-700 dark:text-teal-300 flex items-start gap-2">
            <Sparkles size={18} className="shrink-0 mt-0.5" aria-hidden />
            {getText('allGood')}
          </p>
        ) : (
          <ul className="space-y-3" aria-label={getText('title')}>
            {displayTopics.map((row) => {
              const mastery = row.mastery ?? Math.round((row.accuracy || 0) * 100);
              const isWeak = row.isWeak || weakList.includes(row.topic);
              return (
                <li key={row.topic} className="space-y-1">
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
                        ? getText('startLabel')
                        : `%${mastery}${row.total > 0 ? ` · ${fill(getText('attempts'), { n: row.total })}` : ''}`}
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
                onClick={handlePractice}
                disabled={practiceLoading}
                className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {practiceLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden />
                    {getText('practicing')}
                  </>
                ) : (
                  getText('practice')
                )}
              </button>
            )}
            {onGoHub && (
              <button
                type="button"
                onClick={onGoHub}
                className="inline-flex items-center min-h-[40px] px-4 py-2 rounded-xl text-sm font-bold border border-sky-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-700"
              >
                {getText('goHub')}
              </button>
            )}
          </div>
        )}
      </div>

      {practiceQuestions && practiceQuestions.length > 0 && (
        <AIPractice questions={practiceQuestions} sourceLabel={getText('subtitle')} />
      )}
    </div>
  );
}
