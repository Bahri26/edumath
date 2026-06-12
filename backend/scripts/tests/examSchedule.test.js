const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getSchedulePhase,
  assertStudentCanTake,
  attachExamScheduleMeta,
} = require('../../utils/examSchedule');

test('scheduled before startAt', () => {
  const exam = {
    status: 'active',
    startAt: new Date(Date.now() + 86400000),
    endAt: new Date(Date.now() + 86400000 * 2),
    results: [],
  };
  assert.equal(getSchedulePhase(exam), 'scheduled');
});

test('live within window', () => {
  const exam = {
    status: 'active',
    startAt: new Date(Date.now() - 3600000),
    endAt: new Date(Date.now() + 3600000),
    results: [],
  };
  assert.equal(getSchedulePhase(exam), 'live');
});

test('student cannot start scheduled exam', () => {
  const exam = {
    status: 'active',
    startAt: new Date(Date.now() + 86400000),
    results: [],
  };
  const check = assertStudentCanTake(exam, 'student1');
  assert.equal(check.ok, false);
});

test('attachExamScheduleMeta canStart when live', () => {
  const meta = attachExamScheduleMeta({
    status: 'active',
    startAt: new Date(Date.now() - 1000),
    endAt: new Date(Date.now() + 86400000),
    results: [],
    questions: [1, 2, 3],
  }, 's1');
  assert.equal(meta.canStart, true);
  assert.equal(meta.questionCount, 3);
});
