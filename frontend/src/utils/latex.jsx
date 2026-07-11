import React from 'react';
import { InlineMath } from 'react-katex';

// Metin içinde $...$ ile işaretlenmiş LaTeX parçalarını ayrıştırıp render eder
export function renderWithLatex(text) {
  if (!text) return null;
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => (
        part.startsWith('$') && part.endsWith('$')
          ? (
            <span key={index} className="mx-1 text-teal-600 font-serif bg-teal-50/50 dark:bg-teal-900/20 px-1 rounded">
              <InlineMath math={part.slice(1, -1)} />
            </span>
          )
          : <span key={index} className="whitespace-pre-line">{part}</span>
      ))}
    </span>
  );
}
