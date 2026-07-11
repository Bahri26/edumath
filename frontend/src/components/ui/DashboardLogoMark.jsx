import React, { useState } from 'react';
import logoUrl from '../../assets/logo.png';

/**
 * Panel başlığında yalnızca M logosu (metin yok).
 */
export default function DashboardLogoMark({ onClick, className = '', size = 'md', title }) {
  const [failed, setFailed] = useState(false);
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
      {failed ? (
        <div
          className={`${dim} rounded-xl bg-gradient-to-br from-brand-600 to-teal-600 text-white font-black ${textSize} flex items-center justify-center shadow-md shadow-brand-500/25 ring-1 ring-white/20`}
          aria-hidden
        >
          M
        </div>
      ) : (
        <img
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          decoding="async"
          className={`${dim} rounded-xl object-contain bg-white dark:bg-surface-800 ring-1 ring-surface-200/80 dark:ring-surface-600 shadow-sm p-0.5`}
          onError={() => setFailed(true)}
        />
      )}
    </button>
  );
}
