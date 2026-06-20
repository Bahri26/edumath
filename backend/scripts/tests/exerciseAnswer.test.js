const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseAnswerPayload,
  summarizeExerciseSubmission,
} = require('../../utils/exerciseAnswer');

test('parseAnswerPayload accepts plain string answers', () => {
  assert.deepEqual(parseAnswerPayload('B'), { answer: 'B', timeSpent: 0 });
});

test('parseAnswerPayload reads answer and timeSpent from object', () => {
  assert.deepEqual(parseAnswerPayload({ answer: 'C', timeSpent: 12.7 }), {
    answer: 'C',
    timeSpent: 13,
  });
});

test('parseAnswerPayload rejects negative timeSpent', () => {
  assert.deepEqual(parseAnswerPayload({ answer: 'A', timeSpent: -5 }), {
    answer: 'A',
    timeSpent: 0,
  });
});

test('summarizeExerciseSubmission computes score and falls back to answer times', () => {
  const result = summarizeExerciseSubmission({
    correctCount: 2,
    totalQuestions: 4,
    pointsPerQuestion: 10,
    totalTimeSpentSeconds: undefined,
    submittedAnswers: [{ timeSpent: 30 }, { timeSpent: 45 }],
  });
  assert.equal(result.score, 50);
  assert.equal(result.points, 20);
  assert.equal(result.totalTimeSpent, 75);
});

test('summarizeExerciseSubmission prefers explicit totalTimeSpentSeconds', () => {
  const result = summarizeExerciseSubmission({
    correctCount: 4,
    totalQuestions: 4,
    pointsPerQuestion: 5,
    totalTimeSpentSeconds: 200,
    submittedAnswers: [],
  });
  assert.equal(result.score, 100);
  assert.equal(result.totalTimeSpent, 200);
});
