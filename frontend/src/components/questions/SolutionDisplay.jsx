import React from 'react';
import { normalizeSolutionText, renderWithLatex } from '../../utils/latex.jsx';

/**
 * Çözüm metnini numaralı satırlar veya çoklu paragraflar varsa adım adım listeler.
 * Yapıştırılan sıkışık metinler normalizeSolutionText ile okunabilir hale getirilir.
 */
export default function SolutionDisplay({ text, className = '' }) {
  const raw = normalizeSolutionText(text);
  if (!raw) return null;

  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const numberedLine = (l) => /^\d+[\).\s]/.test(l);
  const answerLine = (l) => /^Do[ğg]ru\s*Cevap\s*:/i.test(l);

  if (lines.length >= 2 && (lines.some(numberedLine) || lines.some(answerLine))) {
    return (
      <div className={`space-y-2.5 text-sm text-slate-600 dark:text-slate-300 ${className}`}>
        <ol className="list-decimal space-y-2.5 pl-5">
          {lines.filter((l) => !answerLine(l)).map((line, i) => {
            const cleaned = line.replace(/^\d+[\).\s]+/, '').trim();
            return (
              <li key={i} className="leading-relaxed pl-1">
                {renderWithLatex(cleaned || line)}
              </li>
            );
          })}
        </ol>
        {lines.filter(answerLine).map((line, i) => (
          <p
            key={`ans-${i}`}
            className="rounded-xl border border-teal-100 bg-teal-50/80 px-3 py-2 font-semibold text-teal-900 dark:border-teal-900/40 dark:bg-teal-950/30 dark:text-teal-100"
          >
            {renderWithLatex(line)}
          </p>
        ))}
      </div>
    );
  }

  if (lines.length >= 2) {
    return (
      <div className={`space-y-2 text-sm text-slate-600 dark:text-slate-300 ${className}`}>
        {lines.map((line, i) => (
          <p key={i} className="leading-relaxed">
            {renderWithLatex(line)}
          </p>
        ))}
      </div>
    );
  }

  return (
    <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${className}`}>
      {renderWithLatex(raw)}
    </p>
  );
}
