import { describe, it, expect } from 'vitest';
import {
  parseStoredAnswer,
  isExamQuestionAnswered,
  formatExamClock,
} from './examAnswerUtils';

describe('examAnswerUtils', () => {
  it('parses JSON answers and leaves objects intact', () => {
    expect(parseStoredAnswer('{"a":1}')).toEqual({ a: 1 });
    expect(parseStoredAnswer({ a: 1 })).toEqual({ a: 1 });
    expect(parseStoredAnswer('')).toBeNull();
  });

  it('detects answered matching / sequence / fill-blank', () => {
    const matching = {
      type: 'matching',
      interactionData: { prompts: [{ id: 'p1' }, { id: 'p2' }] },
    };
    expect(isExamQuestionAnswered(matching, JSON.stringify({ p1: 'x', p2: 'y' }))).toBe(true);
    expect(isExamQuestionAnswered(matching, JSON.stringify({ p1: 'x' }))).toBe(false);

    const sequence = { type: 'sequence' };
    expect(isExamQuestionAnswered(sequence, JSON.stringify({ order: [1, 2], locked: true }))).toBe(true);
    expect(isExamQuestionAnswered(sequence, JSON.stringify({ order: [1, 2], locked: false }))).toBe(false);

    expect(isExamQuestionAnswered({ type: 'fill-blank' }, ' 42 ')).toBe(true);
    expect(isExamQuestionAnswered({ type: 'multiple-choice' }, 'A')).toBe(true);
  });

  it('formats exam clock', () => {
    expect(formatExamClock(65)).toBe('1:05');
    expect(formatExamClock(9)).toBe('0:09');
  });
});
