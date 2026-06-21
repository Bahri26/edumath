/** Map UserProgress lean rows to API progress DTO. */
function mapLessonProgressRows(rows) {
  return (rows || []).map((row) => ({
    lessonId: row.lessonId?._id || row.lessonId,
    lessonTitle: row.lessonId?.title || '',
    correctCount: row.correctCount || 0,
    wrongCount: row.wrongCount || 0,
    xp: row.xp || 0,
    lastAttempt: row.lastAttempt || null,
  }));
}

/** Map teacher exercises with submissions for one student userId. */
function mapStudentExerciseSubmissions(exerciseDocs, studentUserId) {
  const uid = String(studentUserId);
  return (exerciseDocs || [])
    .map((ex) => {
      const sub = (ex.submissions || []).find((s) => String(s.studentId) === uid);
      if (!sub) return null;
      return {
        exerciseId: ex._id,
        name: ex.name,
        gameMode: ex.gameMode,
        totalQuestions: ex.totalQuestions || 0,
        score: sub.score ?? null,
        completedQuestions: sub.completedQuestions ?? 0,
        status: sub.status || 'started',
        totalTimeSpent: sub.totalTimeSpent ?? 0,
        completedAt: sub.completedAt || null,
        startedAt: sub.startedAt || null,
      };
    })
    .filter(Boolean);
}

/** Build per-exam analytics from a student result row. */
function buildStudentExamAnalysis(row) {
  const answerDetails = row.answerDetails || [];
  const difficultyBuckets = {
    Kolay: { correct: 0, wrong: 0 },
    Orta: { correct: 0, wrong: 0 },
    Zor: { correct: 0, wrong: 0 },
  };

  for (const ad of answerDetails) {
    const key = difficultyBuckets[ad.difficulty] ? ad.difficulty : 'Orta';
    if (ad.isCorrect) difficultyBuckets[key].correct += 1;
    else difficultyBuckets[key].wrong += 1;
  }

  const difficultyBreakdown = Object.entries(difficultyBuckets).map(([difficulty, v]) => ({
    difficulty,
    correct: v.correct,
    wrong: v.wrong,
    total: v.correct + v.wrong,
  }));

  const topicMap = new Map();
  if (answerDetails.length > 0) {
    for (const ad of answerDetails) {
      if (!ad.isCorrect && ad.topic) {
        topicMap.set(ad.topic, (topicMap.get(ad.topic) || 0) + 1);
      }
    }
  } else {
    for (const ts of row.topicStats || []) {
      if (ts.topic) topicMap.set(ts.topic, ts.wrong || 0);
    }
  }
  const topicWrong = Array.from(topicMap.entries())
    .map(([topic, wrongCount]) => ({ topic, wrongCount }))
    .sort((a, b) => b.wrongCount - a.wrongCount)
    .slice(0, 10);

  const questionTimes = answerDetails
    .map((ad, idx) => ({
      question: idx + 1,
      seconds: ad.timeSpentSeconds ?? null,
      difficulty: ad.difficulty || '',
      isCorrect: ad.isCorrect,
    }))
    .filter((q) => q.seconds != null && q.seconds >= 0);

  return {
    difficultyBreakdown,
    topicWrong,
    questionTimes,
    correct: row.correctCount ?? 0,
    wrong: row.wrongCount ?? 0,
  };
}

function mapAnswerDetail(ad) {
  return {
    questionId: ad.questionId,
    questionText: ad.questionText || '',
    topic: ad.topic || '',
    learningOutcome: ad.learningOutcome || '',
    difficulty: ad.difficulty || '',
    questionType: ad.questionType || '',
    studentAnswer: ad.studentAnswer || '',
    isCorrect: Boolean(ad.isCorrect),
    timeSpentSeconds: ad.timeSpentSeconds ?? null,
  };
}

/** Map teacher exams with results for one student userId. */
function mapStudentExamResults(examDocs, studentUserId) {
  const uid = String(studentUserId);
  return (examDocs || [])
    .map((exam) => {
      const row = (exam.results || []).find((r) => String(r.studentId) === uid);
      if (!row) return null;
      const answerDetails = (row.answerDetails || []).map(mapAnswerDetail);
      const base = {
        examId: exam._id,
        title: exam.title,
        classLevel: exam.classLevel || '',
        duration: exam.duration || null,
        score: row.score ?? 0,
        correctCount: row.correctCount ?? 0,
        wrongCount: row.wrongCount ?? 0,
        totalTimeSpentSeconds: row.totalTimeSpentSeconds ?? null,
        submittedAt: row.submittedAt || null,
        weakTopics: row.weakTopics || [],
        topicStats: row.topicStats || [],
        answerDetails,
      };
      return {
        ...base,
        analysis: buildStudentExamAnalysis({ ...row, answerDetails }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
}

/** userId string -> rounded average exam score for a teacher-visible exam set. */
function buildExamAverageByUserId(examDocs) {
  const sums = new Map();
  const counts = new Map();
  for (const exam of examDocs || []) {
    for (const row of exam.results || []) {
      const uid = String(row.studentId);
      if (!uid) continue;
      sums.set(uid, (sums.get(uid) || 0) + (Number(row.score) || 0));
      counts.set(uid, (counts.get(uid) || 0) + 1);
    }
  }
  const avgs = new Map();
  for (const [uid, sum] of sums.entries()) {
    const n = counts.get(uid) || 0;
    avgs.set(uid, n > 0 ? Math.round(sum / n) : 0);
  }
  return avgs;
}

module.exports = {
  mapLessonProgressRows,
  mapStudentExerciseSubmissions,
  mapStudentExamResults,
  buildExamAverageByUserId,
  buildStudentExamAnalysis,
};
