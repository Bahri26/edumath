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
