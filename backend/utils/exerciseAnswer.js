/** Normalize check-answer / submit payloads (string or { answer, timeSpent }). */
function parseAnswerPayload(raw) {
  if (raw == null) return { answer: raw, timeSpent: 0 };
  if (typeof raw === 'object' && !Array.isArray(raw) && ('answer' in raw || 'value' in raw)) {
    const answer = raw.answer ?? raw.value;
    const timeSpent = Number(raw.timeSpent ?? raw.timeSpentSeconds ?? 0);
    return {
      answer,
      timeSpent: Number.isFinite(timeSpent) && timeSpent >= 0 ? Math.round(timeSpent) : 0,
    };
  }
  return { answer: raw, timeSpent: 0 };
}

/** Score and timing summary for a completed exercise submission. */
function summarizeExerciseSubmission({
  correctCount,
  totalQuestions,
  pointsPerQuestion,
  totalTimeSpentSeconds,
  submittedAnswers,
}) {
  const total = Math.max(1, Number(totalQuestions) || 1);
  const correct = Number(correctCount) || 0;
  const score = Math.round((correct / total) * 100);
  const points = correct * (Number(pointsPerQuestion) || 0);
  const parsedTotalTime = Number(totalTimeSpentSeconds);
  const totalTimeSpent = Number.isFinite(parsedTotalTime) && parsedTotalTime >= 0
    ? Math.round(parsedTotalTime)
    : (submittedAnswers || []).reduce((sum, a) => sum + (a.timeSpent || 0), 0) || null;

  return { score, points, totalTimeSpent };
}

module.exports = {
  parseAnswerPayload,
  summarizeExerciseSubmission,
};
