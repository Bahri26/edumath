const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  cleanOcrText,
  stripLeadingOcrGarbage,
  parseStructuredQuestionText,
  buildSeparatedStemContent,
} = require('../../services/questionImageParseService');
const { shouldUseGeminiForSmartParse, hasGeminiKey } = require('../../services/geminiVisionParseService');

describe('stripLeadingOcrGarbage', () => {
  it('removes short OCR noise before Turkish sentence start', () => {
    const raw = 'Ty Eg i a İlk üç adımı verilen ve karelerden oluşan şekil örüntüsünde 4. adımda kaç kare kullanılır?';
    const cleaned = stripLeadingOcrGarbage(raw);
    assert.match(cleaned, /^İlk üç adımı/);
    assert.doesNotMatch(cleaned, /Ty Eg/);
  });

  it('keeps clean text unchanged', () => {
    const text = 'Buna göre 5. adımda kaç kare vardır?';
    assert.equal(stripLeadingOcrGarbage(text), text);
  });
});

describe('cleanOcrText', () => {
  it('fixes common OCR artifacts', () => {
    const raw = 'al-\ntigen örüntüsü';
    assert.match(cleanOcrText(raw), /altıgen/);
  });
});

describe('parseStructuredQuestionText', () => {
  it('parses inline options from OCR-like text', async () => {
    const ocr = `İlk üç adımı verilen şekil örüntüsünde 4. adımda kaç kare kullanılır?
A) 6 B) 7 C) 9 D) 10`;
    const parsed = await parseStructuredQuestionText(ocr);
    assert.match(parsed.text, /4\. adımda kaç kare/);
    assert.deepEqual(parsed.options.filter(Boolean), ['6', '7', '9', '10']);
  });

  it('separates intro and question lines', () => {
    const lines = [
      'Verilen örüntüde',
      '1. Adım 2. Adım 3. Adım',
      '4. adımda kaç kare kullanılır?',
    ];
    const separated = buildSeparatedStemContent(lines);
    assert.match(separated.introText, /Verilen örüntüde/);
    assert.match(separated.questionText, /4\. adımda/);
    assert.ok(separated.stepLabels.length >= 1);
  });
});

describe('geminiVisionParseService config', () => {
  it('shouldUseGeminiForSmartParse respects SMART_PARSE_VISION=off', () => {
    const prevKey = process.env.GEMINI_API_KEY;
    const prevMode = process.env.SMART_PARSE_VISION;
    process.env.GEMINI_API_KEY = 'test-key';
    process.env.SMART_PARSE_VISION = 'off';
    assert.equal(shouldUseGeminiForSmartParse(), false);
    process.env.GEMINI_API_KEY = prevKey;
    process.env.SMART_PARSE_VISION = prevMode;
  });

  it('hasGeminiKey detects empty key', () => {
    const prev = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '';
    assert.equal(hasGeminiKey(), false);
    process.env.GEMINI_API_KEY = prev;
  });
});
