import { describe, it, expect } from 'vitest';
import { lookupMessage, formatMessage, MESSAGES } from './messages';

describe('i18n messages', () => {
  it('resolves nested progress keys in TR and EN', () => {
    expect(lookupMessage(MESSAGES.TR, 'progress.title')).toBe('Öğrenci takibi');
    expect(lookupMessage(MESSAGES.EN, 'progress.title')).toBe('Student progress');
  });

  it('formatMessage invokes function templates with params', () => {
    const fn = MESSAGES.TR.progress.studentsCount;
    expect(formatMessage(fn, 3)).toBe('3 öğrenci');
  });

  it('settings strings exist in both locales', () => {
    expect(lookupMessage(MESSAGES.TR, 'settings.menuLabel')).toBe('Ayarlar');
    expect(lookupMessage(MESSAGES.EN, 'settings.menuLabel')).toBe('Settings');
    expect(lookupMessage(MESSAGES.TR, 'settings.studentTitle')).toBe('Öğrenci ayarları');
    expect(lookupMessage(MESSAGES.EN, 'settings.studentTitle')).toBe('Student settings');
  });
});
