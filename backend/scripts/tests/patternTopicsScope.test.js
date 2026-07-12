const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyPatternQuestionBankScope,
  filterPatternTopicLabels,
  PATTERN_TOPIC_ALL_UNDER,
} = require('../../constants/patternTopics');

test('applyPatternQuestionBankScope excludes exercise-seed and defaults to pattern topics', () => {
  const query = {};
  applyPatternQuestionBankScope(query, { subject: 'Matematik', topic: 'Tümü' });

  assert.deepEqual(query.source, { $ne: 'exercise-seed' });
  assert.deepEqual(query.topic, { $regex: '^Örüntüler', $options: '' });
});

test('applyPatternQuestionBankScope keeps explicit pattern subtopic', () => {
  const query = {};
  applyPatternQuestionBankScope(query, {
    subject: 'Matematik',
    topic: 'Örüntüler — Sayı (sabit adım)',
  });

  assert.deepEqual(query.topic, { $regex: '^Örüntüler — Sayı \\(sabit adım\\)$', $options: 'i' });
});

test('applyPatternQuestionBankScope honors all-pattern filter label', () => {
  const query = {};
  applyPatternQuestionBankScope(query, {
    subject: 'Matematik',
    topic: PATTERN_TOPIC_ALL_UNDER,
  });

  assert.deepEqual(query.topic, { $regex: '^Örüntüler', $options: '' });
});

test('filterPatternTopicLabels removes non-pattern topics', () => {
  const filtered = filterPatternTopicLabels([
    'Cebirsel ifadeler',
    'Örüntüler — Sayı (sabit adım)',
    'Fonksiyonlar',
  ]);

  assert.deepEqual(filtered, ['Örüntüler — Sayı (sabit adım)']);
});
