import React, { useId } from 'react';

/**
 * Matova marka işareti — teal→sky gradyanlı “M”.
 */
export default function MatovaMark({ size = 40, className = '', title }) {
  const gradId = useId().replace(/:/g, '');
  const dim = typeof size === 'number' ? `${size}px` : size;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 40 40"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      <defs>
        <linearGradient id={`matova-${gradId}`} x1="8" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#matova-${gradId})`} />
      <path
        d="M11.5 28.5V12.2h3.4l5.1 11.2 5.1-11.2h3.4v16.3h-3.05V17.6l-4.55 10.05h-2.2L14.55 17.6v10.9H11.5Z"
        fill="#fff"
      />
    </svg>
  );
}
