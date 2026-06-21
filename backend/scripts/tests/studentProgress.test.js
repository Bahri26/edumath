const test = require('node:test');
const assert = require('node:assert/strict');
const {
  mapLessonProgressRows,
  mapStudentExerciseSubmissions,
} = require('../../utils/studentProgress');

test('mapLessonProgressRows maps populated lesson titles', () => {
  const rows = [
    {
      lessonId: { _id: 'L1', title: 'Örüntüler' },
      correctCount: 3,
      wrongCount: 1,
      xp: 40,
      lastAttempt: '2026-01-01T00:00:00.000Z',
    },
  ];
  const out = mapLessonProgressRows(rows);
  assert.equal(out.length, 1);
  assert.equal(out[0].lessonTitle, 'Örüntüler');
  assert.equal(out[0].correctCount, 3);
  assert.equal(out[0].xp, 40);
});

test('mapStudentExamResults picks matching student only', () => {
  const { mapStudentExamResults } = require('../../utils/studentProgress');
  const studentId = 'stu-1';
  const docs = [
    {
      _id: 'ex-1',
      title: '1. Sınıf Sınav',
      classLevel: '1. Sınıf',
      duration: 20,
      results: [
        { studentId: 'stu-2', score: 50, correctCount: 10, wrongCount: 11 },
        { studentId: studentId, score: 71, correctCount: 15, wrongCount: 6, submittedAt: '2026-01-02T00:00:00.000Z', answerDetails: [{ isCorrect: true }, { isCorrect: false }] },
      ],
    },
  ];
  const out = mapStudentExamResults(docs, studentId);
  assert.equal(out.length, 1);
  assert.equal(out[0].score, 71);
  assert.equal(out[0].correctCount, 15);
  assert.equal(out[0].analysis?.correct, 15);
  assert.equal(out[0].answerDetails?.length, 2);
});

test('buildStudentExamAnalysis aggregates difficulty and topics', () => {
  const { buildStudentExamAnalysis } = require('../../utils/studentProgress');
  const analysis = buildStudentExamAnalysis({
    correctCount: 2,
    wrongCount: 1,
    topicStats: [{ topic: 'Örüntüler', wrong: 1 }],
    answerDetails: [
      { difficulty: 'Kolay', isCorrect: true, topic: 'Örüntüler', timeSpentSeconds: 30 },
      { difficulty: 'Kolay', isCorrect: true, topic: 'Örüntüler', timeSpentSeconds: 20 },
      { difficulty: 'Zor', isCorrect: false, topic: 'Örüntüler', timeSpentSeconds: 45 },
    ],
  });
  assert.equal(analysis.correct, 2);
  assert.equal(analysis.difficultyBreakdown.find((d) => d.difficulty === 'Kolay').correct, 2);
  assert.equal(analysis.topicWrong[0].wrongCount, 1);
  assert.equal(analysis.questionTimes.length, 3);
});

test('buildExamAverageByUserId averages per student', () => {
  const { buildExamAverageByUserId } = require('../../utils/studentProgress');
  const docs = [
    { results: [{ studentId: 'a', score: 80 }, { studentId: 'b', score: 60 }] },
    { results: [{ studentId: 'a', score: 60 }] },
  ];
  const avgs = buildExamAverageByUserId(docs);
  assert.equal(avgs.get('a'), 70);
  assert.equal(avgs.get('b'), 60);
});

test('mapStudentExerciseSubmissions picks matching student only', () => {
  const studentId = 'stu-1';
  const docs = [
    {
      _id: 'ex-1',
      name: 'Alıştırma A',
      gameMode: 'practice',
      totalQuestions: 5,
      submissions: [
        { studentId: 'stu-2', score: 50, status: 'completed', totalTimeSpent: 120 },
        { studentId: studentId, score: 80, completedQuestions: 4, status: 'completed', totalTimeSpent: 90 },
      ],
    },
    {
      _id: 'ex-2',
      name: 'Alıştırma B',
      gameMode: 'timed',
      totalQuestions: 3,
      submissions: [{ studentId: 'stu-3', score: 100 }],
    },
  ];
  const out = mapStudentExerciseSubmissions(docs, studentId);
  assert.equal(out.length, 1);
  assert.equal(out[0].name, 'Alıştırma A');
  assert.equal(out[0].score, 80);
  assert.equal(out[0].totalTimeSpent, 90);
  assert.equal(out[0].status, 'completed');
});
