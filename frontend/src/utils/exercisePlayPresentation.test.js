import { describe, it, expect } from 'vitest';
import { getExercisePlayPresentation } from './exercisePlayPresentation.js';

describe('getExercisePlayPresentation', () => {
  it('returns default for classic mode', () => {
    const q = { _id: '507f1f77bcf86cd799439011', type: 'multiple-choice', options: [{ text: 'A' }, { text: 'B' }], correctAnswer: 'A' };
    expect(getExercisePlayPresentation(q, 0, 'classic').key).toBe('default');
  });

  it('keeps matching as default even in game_show', () => {
    const q = { _id: '507f1f77bcf86cd799439012', type: 'matching' };
    expect(getExercisePlayPresentation(q, 0, 'game_show').key).toBe('default');
  });
});
