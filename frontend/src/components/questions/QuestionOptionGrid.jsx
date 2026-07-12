import React from 'react';
import { renderWithLatex } from '../../utils/latex.jsx';
import { normalizeDisplayOptions } from '../../utils/questionLayout.js';

export default function QuestionOptionGrid({
  options = [],
  value = '',
  onChange,
  disabled = false,
  correctAnswer = '',
  showCorrect = false,
  ariaLabel = 'Cevap seçenekleri',
}) {
  const visibleOptions = normalizeDisplayOptions(options);

  if (!visibleOptions.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="group" aria-label={ariaLabel}>
      {visibleOptions.map((text, index) => {
        const selected = value === text;
        const correct = showCorrect && text === correctAnswer;
        const letter = String.fromCharCode(65 + index);

        return (
          <button
            key={`${letter}-${text}`}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange?.(text)}
            className={`group min-h-[86px] rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
              correct
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400/30 dark:bg-teal-950/40'
                  : 'border-surface-200 bg-white hover:border-teal-300 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700/60'
            } ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
          >
            <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-surface-500 dark:text-surface-400">
              {letter}
            </span>
            <span className="block text-base font-semibold text-surface-900 dark:text-white sm:text-lg">
              {text ? renderWithLatex(text) : '—'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
