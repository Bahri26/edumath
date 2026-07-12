const test = require('node:test');
const assert = require('node:assert/strict');
const { enrichParsedQuestion, isGenericSolutionText } = require('../../services/patternQuestionSolver');
const { autoEnrichQuestionPayload } = require('../../utils/questionAutoEnrich');

test('autoEnrichQuestionPayload fills missing solution after create payload', async () => {
  const result = await autoEnrichQuestionPayload({
    text: 'İlk üç adımı verilen karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?',
    options: [{ text: '6' }, { text: '7' }, { text: '9' }],
    correctAnswer: '7',
    solution: '',
  });

  assert.equal(result.correctAnswer, '7');
  assert.ok(result.solution);
  assert.match(result.solution, /7/);
  assert.equal(result.assessmentMeta.autoSolveEngine, 'local');
});

test('autoEnrichQuestionPayload keeps existing detailed solution', async () => {
  const customSolution = '1. Kural +2.\n2. Sonuç 8.';
  const result = await autoEnrichQuestionPayload({
    text: '2, 4, 6, __',
    options: [{ text: '7' }, { text: '8' }],
    correctAnswer: '8',
    solution: customSolution,
  });

  assert.equal(result.solution, customSolution);
});

test('enrichParsedQuestion replaces generic solution text', () => {
  const enriched = enrichParsedQuestion({
    text: '4. adımda kaç kare kullanılır?',
    options: ['6', '7', '8'],
    correctAnswer: '7',
    solution: 'Çözüm: örüntü kuralını bulun, adım adım uygulayın ve şıklarla karşılaştırın.',
  });

  assert.equal(enriched.correctAnswer, '7');
  assert.ok(enriched.solution);
  assert.ok(!isGenericSolutionText(enriched.solution));
});
