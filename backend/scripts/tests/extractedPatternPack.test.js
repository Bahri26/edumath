const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validatePack, sourceIdentity } = require('../import/extractedPatternPack');
const root = path.resolve(__dirname, '../../data/pattern-pdf-import');

for (const [grade, count] of [[5,22],[6,30],[7,22],[9,21]]) {
  test(`${grade}. sınıf tüm kaynak soruları, cevapları ve görselleri içerir`, () => {
    const data = JSON.parse(fs.readFileSync(path.join(root, `${grade}-sinif-extracted.json`), 'utf8'));
    const result = validatePack(data, root, `${grade}-sinif`);
    assert.equal(result.count, count);
    assert.equal(result.images, count);
    assert.ok(data.questions.every(q => q.imageRole === 'full-question'));
  });
}

const sample = () => ({ source: { classLevel:'5. Sınıf' }, questions:[{
  page:1, questionNumber:1, text:'Soru', solution:'Çözüm', difficulty:'Kolay',
  options:['1','2'], correctAnswer:'2', hasVisual:false,
}] });
test('eksik veya şıklarda olmayan cevap tahmin edilmez', () => {
  for (const answer of ['', '3']) {
    const data=sample(); data.questions[0].correctAnswer=answer;
    assert.throws(() => validatePack(data,root,'5-sinif'), /doğru cevap/);
  }
});
test('ortak numaralar farklı sayfalarda farklı kimlik alır', () => {
  assert.notEqual(sourceIdentity('6-sinif',{page:1,questionNumber:1}), sourceIdentity('6-sinif',{page:3,questionNumber:1}));
  const data=sample(); data.questions.push({...data.questions[0]});
  assert.throws(() => validatePack(data,root,'5-sinif'), /yinelenen/);
});
test('eksik veya paket dışındaki görsel aktarımı durdurur', () => {
  for (const diagramFile of ['missing.png','../README.md']) {
    const data=sample(); Object.assign(data.questions[0],{hasVisual:true,diagramFile});
    assert.throws(() => validatePack(data,root,'5-sinif'), /görsel eksik/);
  }
});
