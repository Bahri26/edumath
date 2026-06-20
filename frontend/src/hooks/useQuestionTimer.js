import { useRef, useCallback } from 'react';

/** Soru başına geçen süreyi saniye olarak ölçer. */
export function useQuestionTimer() {
  const questionStartRef = useRef(Date.now());
  const timesRef = useRef({});

  const resetQuestionTimer = useCallback(() => {
    questionStartRef.current = Date.now();
  }, []);

  const recordAnswerTime = useCallback((questionId) => {
    const sec = Math.round((Date.now() - questionStartRef.current) / 1000);
    timesRef.current[String(questionId)] = sec;
    return sec;
  }, []);

  const getTimes = useCallback(() => ({ ...timesRef.current }), []);

  const resetAll = useCallback(() => {
    timesRef.current = {};
    questionStartRef.current = Date.now();
  }, []);

  return { resetQuestionTimer, recordAnswerTime, getTimes, resetAll };
}

export function computeExamTotalTimeSpent(durationMinutes, timeLeftSeconds) {
  const total = Math.round(durationMinutes * 60 - timeLeftSeconds);
  return total >= 0 ? total : 0;
}
