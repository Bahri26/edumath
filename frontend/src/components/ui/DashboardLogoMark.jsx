import React from 'react';
import MatovaMark from './MatovaMark.jsx';

/**
 * Panel başlığında Matova işareti (metin yok).
 */
export default function DashboardLogoMark({ onClick, className = '', size = 'md', title }) {
  const px = size === 'sm' ? 36 : 40;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 transition-transform hover:scale-[1.03] active:scale-[0.98] ${className}`}
      aria-label={title || 'Matova ana sayfa'}
      title={title || 'Matova ana sayfa'}
    >
      <MatovaMark size={px} className="shadow-md shadow-teal-500/20 ring-1 ring-white/15 rounded-[10px]" />
    </button>
  );
}
