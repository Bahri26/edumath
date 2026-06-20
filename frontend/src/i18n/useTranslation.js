import { useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { MESSAGES, lookupMessage, formatMessage } from './messages';

export function useTranslation() {
  const { language, setLanguage, isEnglish } = useLanguage();
  const catalog = MESSAGES[language] || MESSAGES.TR;

  const t = useCallback(
    (key, params) => {
      const value = lookupMessage(catalog, key);
      if (value == null) return key;
      return formatMessage(value, params);
    },
    [catalog],
  );

  return useMemo(
    () => ({ t, language, setLanguage, isEnglish }),
    [t, language, setLanguage, isEnglish],
  );
}

/** Object-shaped labels for StudentProgressDashboard (backward compatible). */
export function useProgressLabels() {
  const { t, language } = useTranslation();
  return useMemo(
    () => ({
      title: t('progress.title'),
      subtitle: t('progress.subtitle'),
      classList: t('progress.classList'),
      searchPlaceholder: t('progress.searchPlaceholder'),
      noStudents: t('progress.noStudents'),
      rosterEmptyHint: t('progress.rosterEmptyHint'),
      loadError: t('progress.loadError'),
      progressError: t('progress.progressError'),
      selectPrompt: t('progress.selectPrompt'),
      selectHint: t('progress.selectHint'),
      invalidStudent: t('progress.invalidStudent'),
      lessons: t('progress.lessons'),
      noProgress: t('progress.noProgress'),
      loadingProgress: t('progress.loadingProgress'),
      correctCol: t('progress.correctCol'),
      wrongCol: t('progress.wrongCol'),
      summaryLessons: t('progress.summaryLessons'),
      summaryCorrect: t('progress.summaryCorrect'),
      summaryWrong: t('progress.summaryWrong'),
      summaryXp: t('progress.summaryXp'),
      accuracy: t('progress.accuracy'),
      grade: t('progress.grade'),
      avgShort: t('progress.avgShort'),
      studentsCount: (n) => t('progress.studentsCount', n),
      clearSelection: t('progress.clearSelection'),
      classAvg: t('progress.classAvg'),
      exercises: t('progress.exercises'),
      noExercises: t('progress.noExercises'),
      exerciseScore: t('progress.exerciseScore'),
      exerciseTime: t('progress.exerciseTime'),
      exerciseStatus: t('progress.exerciseStatus'),
      summaryExercises: t('progress.summaryExercises'),
      summaryExerciseTime: t('progress.summaryExerciseTime'),
      questionsDone: t('progress.questionsDone'),
      statusCompleted: t('progress.statusCompleted'),
      statusStarted: t('progress.statusStarted'),
      statusAbandoned: t('progress.statusAbandoned'),
      correctPct: (pct) => t('progress.correctPct', pct),
      language,
    }),
    [t, language],
  );
}
