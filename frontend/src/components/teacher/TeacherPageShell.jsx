import React from 'react';

/**
 * Öğretmen paneli sayfa kabuğu — display tipografi + tutarlı başlık.
 */
export default function TeacherPageShell({
  title,
  subtitle,
  children,
  maxWidthClass = 'max-w-6xl',
  className = '',
  headerAside = null,
}) {
  return (
    <div className={`animate-fade-in ${maxWidthClass} mx-auto space-y-6 pb-2 ${className}`}>
      {(title != null && title !== '') || subtitle || headerAside ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1.5 min-w-0">
            {title ? (
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-surface-900 dark:text-white">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-surface-500 dark:text-surface-400 font-medium leading-relaxed max-w-3xl text-sm sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {headerAside ? <div className="shrink-0">{headerAside}</div> : null}
        </header>
      ) : null}
      {children}
    </div>
  );
}
