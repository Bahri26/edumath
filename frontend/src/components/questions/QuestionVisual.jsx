import React from 'react';

export default function QuestionVisual({ src, alt = 'Soru gorseli', className = '' }) {
  if (!src) {
    return null;
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 ${className}`}>
      <img src={src} alt={alt} className="w-full h-full object-contain" loading="lazy" />
    </div>
  );
}