import React from 'react';

/**
 * Öğrenci panelinde "Matematik Maceram" ile uyumlu genişlik, tipografi ve başlık stili.
 */
export default function StudentPageShell({
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-6xl',
  className = '',
  headerAside = null,
}) {
  return (
    <div className={`animate-fade-in ${maxWidthClass} mx-auto space-y-8 text-[1.05rem] pb-2 ${className}`}>
      {(title != null && title !== '') || subtitle || headerAside ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 min-w-0">
            {title ? (
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent dark:from-amber-400 dark:to-teal-400">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-3xl">{subtitle}</p>
            ) : null}
          </div>
          {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
