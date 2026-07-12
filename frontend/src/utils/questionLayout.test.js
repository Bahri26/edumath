import { describe, expect, it } from 'vitest';
import { getQuestionLayout } from './questionLayout.js';

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

  it('keeps legacy flat questions in fallback mode', () => {
    expect(getQuestionLayout({ text: '2 + 2 kaçtır?' }).hasStructuredStem).toBe(false);
  });
});
