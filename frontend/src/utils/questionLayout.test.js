import { describe, expect, it } from 'vitest';
import {
  buildCombinedQuestionText,
  getQuestionLayout,
  getQuestionPreviewText,
  IMAGE_QUESTION_INSTRUCTION,
  isGenericStemPlaceholder,
  isWeakStemFragment,
  normalizeDisplayOptions,
  normalizeOptionEntries,
  resolveQuestionStem,
  sanitizeStemPart,
} from './questionLayout.js';

describe('getQuestionLayout', () => {
  it('uses structured Smart Paste layout fields', () => {
    const result = getQuestionLayout({
      text: 'Giriş metni\n\nSoru cümlesi?',
      assessmentMeta: {
        parseLayout: {
          introText: 'Giriş metni',
          questionLine: 'Soru cümlesi?',
        },
      },
    });

    expect(result).toEqual({
      introText: 'Giriş metni',
      questionText: 'Soru cümlesi?',
      hasStructuredStem: true,
    });
  });

  it('recovers the question line when only intro metadata exists', () => {
    const result = getQuestionLayout({
      text: 'Giriş metni\n\nEksik sayı kaçtır?',
      assessmentMeta: { parseLayout: { introText: 'Giriş metni' } },
    });

    expect(result.questionText).toBe('Eksik sayı kaçtır?');
  });

  it('splits legacy flat text into intro and question', () => {
    const result = getQuestionLayout({
      text: 'Dosyalar bir örüntü oluşturur.\n\nRafta kaç numaralı dosya bulunmaz?',
    });

    expect(result.introText).toContain('örüntü');
    expect(result.questionText).toContain('bulunmaz');
  });
});

describe('resolveQuestionStem', () => {
  it('drops generic placeholder intro for image questions', () => {
    const stem = resolveQuestionStem({
      text: 'Aşağıdaki soruyu çözünüz.',
      image: '/uploads/questions/sample.png',
      assessmentMeta: {
        parseLayout: {
          introText: 'Aşağıdaki soruyu çözünüz.',
          questionLine: 'Buna göre rafta kaç numaralı dosya bulunmaz?',
        },
      },
    });

    expect(stem.showIntro).toBe(false);
    expect(stem.showQuestion).toBe(true);
    expect(stem.visualVariant).toBe('compact');
  });

  it('suppresses junk OCR stems like verilen soruyu çözünüz and Aşağıda', () => {
    const stem = resolveQuestionStem({
      text: 'verilen soruyu çözünüz.\n\nAşağıda',
      image: '/uploads/questions/sample.png',
      assessmentMeta: {
        parseLayout: {
          introText: 'verilen soruyu çözünüz.',
          questionLine: 'Aşağıda',
        },
      },
    });

    expect(stem.showIntro).toBe(false);
    expect(stem.showQuestion).toBe(false);
    expect(stem.imageOnly).toBe(true);
    expect(stem.showImageInstruction).toBe(true);
  });
});

describe('question layout helpers', () => {
  it('detects generic stem placeholders', () => {
    expect(isGenericStemPlaceholder('Aşağıdaki soruyu çözünüz.')).toBe(true);
    expect(isGenericStemPlaceholder('verilen soruyu çözünüz.')).toBe(true);
    expect(isGenericStemPlaceholder('Bir kitaplıkta örüntü vardır.')).toBe(false);
  });

  it('detects weak stem fragments', () => {
    expect(isWeakStemFragment('Aşağıda')).toBe(true);
    expect(sanitizeStemPart('verilen soruyu çözünüz.')).toBe('');
    expect(sanitizeStemPart('Buna göre kaç kare kullanılır?')).toBe('Buna göre kaç kare kullanılır?');
  });

  it('builds preview text for image-only questions', () => {
    expect(getQuestionPreviewText({
      text: 'verilen soruyu çözünüz.',
      image: '/uploads/questions/sample.png',
      assessmentMeta: {
        parseLayout: {
          introText: 'verilen soruyu çözünüz.',
          questionLine: 'Aşağıda',
        },
      },
    })).toBe(IMAGE_QUESTION_INSTRUCTION);
  });

  it('keeps option images in normalized entries', () => {
    expect(normalizeOptionEntries([
      { text: '15', image: '' },
      { text: '33', image: '/uploads/options/b.png' },
    ])).toEqual([
      { text: '15', image: '' },
      { text: '33', image: '/uploads/options/b.png' },
    ]);
  });

  it('builds combined question text', () => {
    expect(buildCombinedQuestionText('Giriş', 'Soru?')).toBe('Giriş\n\nSoru?');
  });

  it('filters empty options', () => {
    expect(normalizeDisplayOptions(['28', '', '32', '35'])).toEqual(['28', '32', '35']);
  });
});
