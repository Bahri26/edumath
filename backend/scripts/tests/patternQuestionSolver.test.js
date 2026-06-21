const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { solvePatternQuestion } = require('../../services/patternQuestionSolver');
const { normalizeStemFields } = require('../../services/questionImageParseService');

describe('solveSquareCountPattern', () => {
  it('computes 4th step square count as 7', () => {
    const result = solvePatternQuestion({
      questionText: 'İlk üç adımı verilen karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?',
      options: ['6', '7', '9', '10'],
    });
    assert.equal(result?.correctAnswer, '7');
    assert.match(result?.solution || '', /7 kare/);
  });

  it('does not treat kare pattern as hexagon doubling', () => {
    const result = solvePatternQuestion({
      questionText: '4. adımda kaç kare kullanılır? örüntü karelerden oluşur.',
      options: ['6', '7', '8', '9'],
    });
    assert.equal(result?.correctAnswer, '7');
  });
});

describe('normalizeStemFields', () => {
  it('splits OCR blob into intro and question sentence', () => {
    const raw = 'Ty Eg i a İlk üç adımı verilen ve karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?';
    const { introText, questionText } = normalizeStemFields(raw, '');
    assert.match(questionText, /4\. adımda kaç kare/);
    assert.doesNotMatch(questionText, /Ty Eg/);
    assert.ok(introText.length < raw.length || !introText.includes('kaç kare'));
  });
});
