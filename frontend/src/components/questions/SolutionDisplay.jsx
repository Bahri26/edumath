import React from 'react';
import { renderWithLatex } from '../../utils/latex.jsx';

/**
 * Çözüm metnini numaralı satırlar veya çoklu paragraflar varsa adım adım listeler.
 */
export default function SolutionDisplay({ text, className = '' }) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const numberedLine = (l) => /^\d+[\).\s]/.test(l);

  if (lines.length >= 2 && lines.some(numberedLine)) {
    return (
      <ol
        className={`list-decimal space-y-2.5 pl-5 text-sm text-slate-600 dark:text-slate-300 ${className}`}
      >
        {lines.map((line, i) => {
          const cleaned = line.replace(/^\d+[\).\s]+/, '').trim();
          return (
            <li key={i} className="leading-relaxed pl-1">
              {renderWithLatex(cleaned || line)}
            </li>
          );
        })}
      </ol>
    );
  }

  if (lines.length >= 2) {
    return (
      <ol
        className={`list-decimal space-y-2.5 pl-5 text-sm text-slate-600 dark:text-slate-300 ${className}`}
      >
        {lines.map((line, i) => (
          <li key={i} className="leading-relaxed pl-1">
            {renderWithLatex(line)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${className}`}>
      {renderWithLatex(raw)}
    </p>
  );
}
