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
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight bg-gradient-to-r from-kid-headerFrom via-sky-600 to-kid-headerTo bg-clip-text text-transparent dark:from-kid-headerFromDark dark:via-sky-400 dark:to-kid-headerToDark">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-surface-600 dark:text-surface-300 font-medium leading-relaxed max-w-3xl">
                {subtitle}
              </p>
            ) : null}
          </div>
          {headerAside ? (
            <div className="shrink-0 animate-scale-in">{headerAside}</div>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
