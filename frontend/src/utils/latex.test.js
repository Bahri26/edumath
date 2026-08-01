import { describe, expect, it } from 'vitest';
import {
  latexToReadableText,
  mathToPlain,
  normalizeLatexSource,
  normalizeSolutionText,
  repairMathDelimiters,
} from './latex.jsx';

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
    expect(lines.some((l) => /^Doğru Cevap:/.test(l))).toBe(true);
    expect(normalized).not.toContain('\r');
    expect(normalized).toContain('×');
    expect(normalized).not.toContain('\\times');
  });

  it('converts unit and times latex to plain readable text', () => {
    const raw =
      'Kenar uzunluğu $5\\text{ cm}$ olduğuna göre çevre $= 8 \\times 5 = 40\\text{ cm}$.';
    const readable = latexToReadableText(raw);
    expect(readable).toContain('5 cm');
    expect(readable).toContain('8 × 5 = 40 cm');
    expect(readable).not.toContain('\\text');
    expect(readable).not.toContain('\\times');
    expect(readable).not.toContain('$');
  });

  it('repairs missing dollar after \\text before Turkish prose', () => {
    const broken = 'Kenar $5\\text{ cm} olduğuna göre çevre';
    const repaired = repairMathDelimiters(broken);
    expect(repaired).toContain('$5\\text{ cm}$');
    expect(mathToPlain('8 \\times 5')).toBe('8 × 5');
  });
});
