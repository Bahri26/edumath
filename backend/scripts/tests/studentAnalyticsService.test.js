const test = require('node:test');
const assert = require('node:assert/strict');
const {
  pushTopicStat,
  buildRawTopicEntries,
  ingestExamsIntoTopicMap,
  ingestExercisesIntoTopicMap,
  scoreEntriesWithLocalMatrix,
} = require('../../services/studentAnalyticsService');

test('pushTopicStat aggregates correct counts per topic', () => {
  const map = {};
  pushTopicStat(map, 'Örüntüler', true);
  pushTopicStat(map, 'Örüntüler', false);
  pushTopicStat(map, 'Kesirler', true, 1000);
  const entries = buildRawTopicEntries(map);
  const pattern = entries.find((e) => e.topic === 'Örüntüler');
  assert.equal(pattern.total, 2);
  assert.equal(pattern.correct, 1);
  assert.equal(pattern.mastery, 50);
});

test('ingestExamsIntoTopicMap only counts matching student', () => {
  const map = {};
  ingestExamsIntoTopicMap(
    map,
    [
      {
        topic: 'Sınav A',
        results: [
          { studentId: 's1', correctCount: 8, wrongCount: 2 },
          { studentId: 's2', correctCount: 0, wrongCount: 10 },
        ],
      },
    ],
    's1',
  );
  const entries = buildRawTopicEntries(map);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].topic, 'Sınav A');
  assert.equal(entries[0].total, 1);
});

test('ingestExercisesIntoTopicMap records completion time', () => {
  const map = {};
  ingestExercisesIntoTopicMap(
    map,
    [
      {
        topic: 'Çalışma',
        submissions: [{ studentId: 's1', status: 'completed', durationMs: 60000 }],
      },
    ],
    's1',
  );
  const entries = buildRawTopicEntries(map);
  assert.equal(entries[0].avgTimeMs, 60000);
});

test('scoreEntriesWithLocalMatrix marks low accuracy as weak', () => {
  const entries = buildRawTopicEntries({
    Zayıf: { total: 10, correct: 2, timeMs: 0 },
    Güçlü: { total: 10, correct: 9, timeMs: 0 },
  });
  const scored = scoreEntriesWithLocalMatrix(entries);
  assert.ok(scored.weakTopics.includes('Zayıf'));
  assert.ok(scored.entries.some((e) => e.topic === 'Zayıf' && e.isWeak));
});
