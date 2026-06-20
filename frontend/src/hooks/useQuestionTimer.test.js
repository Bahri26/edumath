import { describe, it, expect } from 'vitest';
import { computeExamTotalTimeSpent } from './useQuestionTimer.js';

describe('computeExamTotalTimeSpent', () => {
  it('returns elapsed seconds from duration and remaining time', () => {
    expect(computeExamTotalTimeSpent(20, 600)).toBe(600);
    expect(computeExamTotalTimeSpent(20, 0)).toBe(1200);
  });
});
