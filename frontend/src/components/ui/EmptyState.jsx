import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed border-surface-200 dark:border-surface-600 bg-surface-50/60 dark:bg-surface-900/40 ${className}`.trim()}
    >
      {Icon ? (
        <Icon className="text-surface-400 dark:text-surface-500 mb-3" size={40} strokeWidth={1.5} aria-hidden />
      ) : null}
      <h3 className="text-base font-semibold text-surface-800 dark:text-surface-100">{title}</h3>
      {description ? (
        <p className="mt-2 text-sm text-surface-600 dark:text-surface-400 max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
