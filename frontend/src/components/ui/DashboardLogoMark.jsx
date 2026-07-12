import React from 'react';

/**
 * Panel / navbar Matova işareti — yalnızca “M” (eski logo dosyasına bağlı değil).
 */
export default function DashboardLogoMark({ onClick, className = '', size = 'md', title }) {
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-10 w-10';
  const textSize = size === 'sm' ? 'text-base' : 'text-lg';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 transition-transform hover:scale-[1.03] active:scale-[0.98] ${className}`}
      aria-label={title || 'Matova ana sayfa'}
      title={title || 'Matova ana sayfa'}
    >
      <div
        className={`${dim} rounded-xl bg-gradient-to-br from-teal-600 to-sky-600 text-white font-black ${textSize} flex items-center justify-center shadow-md shadow-teal-500/25 ring-1 ring-white/20`}
        aria-hidden
      >
        M
      </div>
    </button>
  );
}
