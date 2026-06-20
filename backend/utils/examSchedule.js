/**
 * Sınav zamanlama: scheduled → live → ended
 * status: draft | active | completed
 */

function getSchedulePhase(exam, now = new Date()) {
  if (!exam) return 'ended';
  if (exam.status === 'draft') return 'draft';

  const start = exam.startAt ? new Date(exam.startAt) : null;
  const end = exam.endAt ? new Date(exam.endAt) : null;

  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'ended';
  return 'live';
}

function getEffectiveStatus(exam, now = new Date()) {
  if (exam.status === 'draft') return 'draft';
  const phase = getSchedulePhase(exam, now);
  if (phase === 'scheduled') return 'scheduled';
  if (phase === 'ended') return 'completed';
  return 'active';
}

function shouldPersistStatus(exam, now = new Date()) {
  if (exam.status === 'draft') return null;
  const phase = getSchedulePhase(exam, now);
  if (phase === 'ended' && exam.status === 'active') return 'completed';
  if (phase === 'live' && exam.status === 'completed' && exam.endAt && now <= new Date(exam.endAt)) {
    return 'active';
  }
  return null;
}

async function syncExamStatusIfNeeded(exam) {
  const next = shouldPersistStatus(exam);
  if (next && exam.status !== next) {
    exam.status = next;
    await exam.save();
  }
  return exam;
}

function assertStudentCanTake(exam, studentId, now = new Date()) {
  const phase = getSchedulePhase(exam, now);
  if (exam.status === 'draft' || phase === 'scheduled') {
    return { ok: false, code: 403, message: 'Sınav henüz başlamadı.' };
  }
  if (phase === 'ended' || exam.status === 'completed') {
    return { ok: false, code: 403, message: 'Sınav süresi doldu.' };
  }
  const already = (exam.results || []).some((r) => String(r.studentId) === String(studentId));
  if (already) {
    return { ok: false, code: 400, message: 'Bu sınavı zaten tamamladınız.' };
  }
  return { ok: true };
}

function stripQuestionForStudent(question) {
  const q = question.toObject ? question.toObject() : { ...question };
  delete q.correctAnswer;
  delete q.solution;
  delete q.difficulty;
  return q;
}

function attachExamScheduleMeta(exam, studentId = null, now = new Date()) {
  const doc = exam.toObject ? exam.toObject() : { ...exam };
  const phase = getSchedulePhase(doc, now);
  const effectiveStatus = getEffectiveStatus(doc, now);
  const studentResult = studentId
    ? (doc.results || []).find((r) => String(r.studentId) === String(studentId))
    : null;

  return {
    ...doc,
    schedulePhase: phase,
    effectiveStatus,
    studentCompleted: !!studentResult,
    studentResult: studentResult || null,
    canStart: phase === 'live'
      && effectiveStatus === 'active'
      && !studentResult,
    questionCount: Array.isArray(doc.questions) ? doc.questions.length : 0,
  };
}

function buildTopicAnalysis(results = []) {
  const topicWrong = new Map();
  const difficultyWrong = { Kolay: 0, Orta: 0, Zor: 0 };
  let totalScore = 0;
  for (const r of results) {
    totalScore += Number(r.score) || 0;
    for (const ts of r.topicStats || []) {
      topicWrong.set(ts.topic, (topicWrong.get(ts.topic) || 0) + (ts.wrong || 0));
    }
    for (const ad of r.answerDetails || []) {
      if (!ad.isCorrect && ad.difficulty && difficultyWrong[ad.difficulty] != null) {
        difficultyWrong[ad.difficulty] += 1;
      }
    }
  }
  const topicAnalysis = Array.from(topicWrong.entries())
    .map(([topic, wrongCount]) => ({ topic, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount);

  const difficultyAnalysis = Object.entries(difficultyWrong)
    .map(([difficulty, wrongCount]) => ({ difficulty, wrongCount }))
    .filter((d) => d.wrongCount > 0);

  return {
    participantCount: results.length,
    avgScore: results.length ? Math.round(totalScore / results.length) : 0,
    topicAnalysis,
    difficultyAnalysis,
  };
}

module.exports = {
  getSchedulePhase,
  getEffectiveStatus,
  shouldPersistStatus,
  syncExamStatusIfNeeded,
  assertStudentCanTake,
  stripQuestionForStudent,
  attachExamScheduleMeta,
  buildTopicAnalysis,
};
