const test = require('node:test');
const assert = require('node:assert/strict');
const {
  splitNumberedMultiItems,
  buildGroupedQuestionPayloads,
} = require('../../utils/multiQuestionSplit');

const SAMPLE = `
Kenar uzunluğu 5 cm olan karelerle oluşturulmuş bir şekil örüntüsünün ilk üç adımı görselde verilmiştir.
Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.
1. Bu örüntüdeki kare sayısını veren kural aşağıdakilerden hangisi olabilir?
A) 3 x (Adım Sayısı)
B) 2 x (Adım Sayısı) + 1
C) 5 x (Adım Sayısı) - 2
D) (Adım Sayısı) + 2
2. Bu örüntüdeki şeklin çevre uzunluğunu veren kural aşağıdakilerden hangisi olabilir?
A) 2 x (Adım Sayısı) + 1
B) 40 x (Adım Sayısı)
C) 20 x (Adım Sayısı) + 20
D) 60 x (Adım Sayısı) - 20
3. Bu örüntünün 40. adımındaki şeklin çevre uzunluğu kaç cm'dir?
A) 81
B) 800
C) 820
D) 1000
`;

test('splitNumberedMultiItems finds 3 items', () => {
  const multi = splitNumberedMultiItems(SAMPLE);
  assert.ok(multi);
  assert.equal(multi.items.length, 3);
  assert.match(multi.items[0].questionText, /kare sayısını/i);
  assert.equal(multi.items[0].options[1], '2 x (Adım Sayısı) + 1');
  assert.match(multi.items[2].questionText, /40\. adım/i);
  assert.equal(multi.items[2].options[2], '820');
});

test('buildGroupedQuestionPayloads sets group meta', () => {
  const multi = splitNumberedMultiItems(SAMPLE);
  const payloads = buildGroupedQuestionPayloads({
    multi,
    sharedImage: '/uploads/patterns/l-square-pattern-5cm.svg',
    classLevel: '5. Sınıf',
  });
  assert.equal(payloads.length, 3);
  assert.equal(payloads[0].assessmentMeta.groupIndex, 1);
  assert.equal(payloads[2].assessmentMeta.groupSize, 3);
  assert.equal(payloads[1].assessmentMeta.groupId, payloads[0].assessmentMeta.groupId);
  assert.match(payloads[0].text, /Kenar uzunluğu 5 cm/);
});
