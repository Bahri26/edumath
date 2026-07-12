import React from 'react';
import { resolveAssetUrl } from '../../services/api';
import { renderWithLatex } from '../../utils/latex.jsx';
import { normalizeOptionEntries } from '../../utils/questionLayout.js';

export default function QuestionOptionGrid({
  options = [],
  value = '',
  onChange,
  disabled = false,
  correctAnswer = '',
  showCorrect = false,
  ariaLabel = 'Cevap seçenekleri',
  variant = 'square',
}) {
  const visibleOptions = normalizeOptionEntries(options);

  if (!visibleOptions.length) {
    return null;
  }

  const isSquare = variant === 'square';
  const gridClass = isSquare
    ? 'mx-auto grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4'
    : 'grid grid-cols-1 gap-3 sm:grid-cols-2';

  return (
    <div className={gridClass} role="group" aria-label={ariaLabel}>
      {visibleOptions.map((opt, index) => {
        const text = opt.text;
        const selected = value === text;
        const correct = showCorrect && text === correctAnswer;
        const letter = String.fromCharCode(65 + index);

        return (
          <button
            key={`${letter}-${text || opt.image}`}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onChange?.(text)}
            className={`group relative rounded-2xl border-2 transition-all duration-200 ${
              isSquare
                ? 'flex aspect-square flex-col p-3'
                : 'min-h-[86px] p-4 text-left'
            } ${
              correct
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : selected
                  ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-400/30 dark:bg-teal-950/40'
                  : 'border-surface-200 bg-white hover:border-teal-300 hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700/60'
            } ${disabled ? 'cursor-default opacity-80' : 'cursor-pointer'}`}
          >
            <span className={`text-sm font-bold text-surface-600 dark:text-surface-300 ${isSquare ? 'self-start' : 'mb-2 block text-[11px] uppercase tracking-[0.14em] text-surface-500 dark:text-surface-400'}`}>
              {letter})
            </span>
            <span className={`flex flex-1 flex-col items-center justify-center ${isSquare ? 'w-full text-center' : ''}`}>
              {opt.image ? (
                <img
                  src={resolveAssetUrl(opt.image)}
                  alt={`${letter} şıkkı`}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className={`font-semibold text-surface-900 dark:text-white ${isSquare ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}`}>
                  {text ? renderWithLatex(text) : '—'}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
