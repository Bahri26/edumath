/**
 * Sınav cevap yardımcıları — ExamPlayer / ExamsPage ortak.
 */

export function parseStoredAnswer(raw) {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isExamQuestionAnswered(q, stored) {
  if (stored == null || stored === '') return false;
  if (q?.type === 'matching') {
    const obj = parseStoredAnswer(stored);
    const prompts = q.interactionData?.prompts || [];
    return !!(obj && prompts.length && prompts.every((p) => obj[p.id]));
  }
  if (q?.type === 'sequence') {
    const obj = parseStoredAnswer(stored);
    return !!(obj && obj.locked && Array.isArray(obj.order));
  }
  if (q?.type === 'fill-blank') {
    return String(stored).trim().length > 0;
  }
  return true;
}

export function formatExamClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
