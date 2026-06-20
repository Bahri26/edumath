import React from 'react';

/** WCAG 2.4.1 — klavye kullanıcıları için ana içeriğe atlama bağlantısı */
export default function SkipLink({ href = '#main-content', children }) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}
