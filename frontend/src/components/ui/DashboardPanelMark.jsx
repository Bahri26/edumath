import React from 'react';

/**
 * Öğretmen / öğrenci panel kısayolu — E logosu stili, hover'da panel adı.
 */
export default function DashboardPanelMark({ role = 'student', label, onClick, size = 'md' }) {
  const isTeacher = role === 'teacher';
  const dim = size === 'sm' ? 'h-9 w-9 text-base' : 'h-10 w-10 text-lg';

  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        onClick={onClick}
        className={`flex ${dim} items-center justify-center rounded-xl border-2 font-black transition-all hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 ${
          isTeacher
            ? 'border-brand-200 bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/25 hover:from-brand-500 hover:to-indigo-500 dark:border-brand-800'
            : 'border-teal-200 bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25 hover:from-teal-500 hover:to-emerald-500 dark:border-teal-800'
        }`}
        aria-label={label}
      >
        E
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 dark:bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}
