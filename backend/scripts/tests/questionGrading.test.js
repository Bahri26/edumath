const test = require('node:test');
const assert = require('node:assert/strict');
const { gradeQuestionAnswer, normalizeMcAnswer } = require('../../utils/questionGrading');

test('normalizeMcAnswer unwraps option objects', () => {
  assert.equal(normalizeMcAnswer({ text: ' 42 ' }), ' 42 ');
});

test('gradeQuestionAnswer matches trimmed multiple choice', () => {
  const q = { correctAnswer: 'B', type: 'multiple_choice' };
  assert.equal(gradeQuestionAnswer(q, ' B '), true);
  assert.equal(gradeQuestionAnswer(q, 'A'), false);
});

test('gradeQuestionAnswer treats letter answer and option text as equivalent', () => {
  const q = {
    type: 'multiple-choice',
    correctAnswer: 'B',
    options: [{ text: '15' }, { text: '33' }, { text: '48' }, { text: '52' }],
  };
  assert.equal(gradeQuestionAnswer(q, '33'), true);
  assert.equal(gradeQuestionAnswer(q, 'B'), true);
  assert.equal(gradeQuestionAnswer(q, '48'), false);

  const q2 = {
    type: 'multiple-choice',
    correctAnswer: '33',
    options: ['15', '33', '48', '52'],
  };
  assert.equal(gradeQuestionAnswer(q2, 'B'), true);
  assert.equal(gradeQuestionAnswer(q2, '33'), true);
  assert.equal(gradeQuestionAnswer(q2, 'C'), false);
});

test('gradeQuestionAnswer validates matching pairs', () => {
  const q = {
    type: 'matching',
    interactionData: {
      prompts: [{ id: 'p1' }, { id: 'p2' }],
      correctPairs: { p1: 'a', p2: 'b' },
    },
  };
  const ok = JSON.stringify({ p1: 'a', p2: 'b' });
  const bad = JSON.stringify({ p1: 'a', p2: 'x' });
  assert.equal(gradeQuestionAnswer(q, ok), true);
  assert.equal(gradeQuestionAnswer(q, bad), false);
});

test('gradeQuestionAnswer validates sequence order', () => {
  const q = {
    type: 'sequence',
    interactionData: { correctOrder: ['a', 'b', 'c'] },
  };
  const ok = JSON.stringify({ order: ['a', 'b', 'c'], locked: true });
  const bad = JSON.stringify({ order: ['a', 'c', 'b'], locked: true });
  assert.equal(gradeQuestionAnswer(q, ok), true);
  assert.equal(gradeQuestionAnswer(q, bad), false);
});
