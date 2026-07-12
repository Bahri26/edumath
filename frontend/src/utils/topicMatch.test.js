import { describe, it, expect } from 'vitest';
import { matchesTopic, normalizeTopicKey } from './topicMatch';

describe('topicMatch', () => {
  it('normalizes turkish characters', () => {
    expect(normalizeTopicKey('Örüntüler')).toContain('oruntu');
  });

  it('matches partial topic against exercise fields', () => {
    const ex = { topic: 'Örüntüler - Geometrik', name: 'Paket 1', description: '' };
    expect(matchesTopic(ex, 'Örüntüler')).toBe(true);
    expect(matchesTopic(ex, 'geometrik')).toBe(true);
    expect(matchesTopic(ex, 'Cebir')).toBe(false);
  });
});
