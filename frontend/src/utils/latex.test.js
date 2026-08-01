import { describe, expect, it } from 'vitest';
import { normalizeLatexSource, normalizeSolutionText } from './latex.jsx';

describe('latex helpers', () => {
  it('strips carriage returns that break KaTeX \\r accents', () => {
    expect(normalizeLatexSource('a\r\nb\rc')).toBe('a\nb\nc');
  });

  it('splits jammed numbered solution paste into readable lines', () => {
    const pasted =
      "1. Adım: 3 tane kare vardır.2. Adım: 5 tane kare vardır.3. Adım: 7 tane kare vardır."
      + "Kare sayısı her adımda 2'şer artmaktadır. "
      + 'Doğru Cevap: B) $2 \\times (\\text{Adım Sayısı}) + 1$';

    const normalized = normalizeSolutionText(pasted);
    const lines = normalized.split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines[0]).toMatch(/^1\.\s*Adım:/);
    expect(lines.some((l) => /^2\.\s*Adım:/.test(l))).toBe(true);
    expect(lines.some((l) => /^3\.\s*Adım:/.test(l))).toBe(true);
    expect(lines.some((l) => /^Doğru Cevap:/.test(l))).toBe(true);
    expect(normalized).not.toContain('\r');
  });
});
