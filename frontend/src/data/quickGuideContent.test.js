import { describe, it, expect } from 'vitest';
import { QUICK_GUIDE, orderGuideBlocks } from './quickGuideContent';

describe('orderGuideBlocks', () => {
  const blocks = QUICK_GUIDE.student.TR.blocks;

  it('moves matching path to the front and marks active', () => {
    const { ordered, activeId } = orderGuideBlocks(blocks, '/student/quizzes');
    expect(activeId).toBe('quizzes');
    expect(ordered[0].id).toBe('quizzes');
    expect(ordered[0]._active).toBe(true);
  });

  it('matches path prefixes', () => {
    const { ordered, activeId } = orderGuideBlocks(blocks, '/student/calendar');
    expect(activeId).toBe('assignments');
    expect(ordered[0].id).toBe('assignments');
  });

  it('keeps original order when nothing matches', () => {
    const { ordered, activeId } = orderGuideBlocks(blocks, '/student/unknown');
    expect(activeId).toBeNull();
    expect(ordered.map((b) => b.id)).toEqual(blocks.map((b) => b.id));
  });
});
