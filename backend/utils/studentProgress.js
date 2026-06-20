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

module.exports = {
  mapLessonProgressRows,
  mapStudentExerciseSubmissions,
};
