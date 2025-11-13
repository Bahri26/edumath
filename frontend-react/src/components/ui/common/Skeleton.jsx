// src/components/ui/common/Skeleton.jsx
import React from 'react';

/**
 * Simple skeleton component
 * Props:
 *  - lines: number of text lines (optional)
 *  - variant: 'card' | 'inline'
 *  - children: optional fallback
 */
export default function Skeleton({ lines = 3, variant = 'card' }) {
  if (variant === 'card') {
    return (
      <div className="kids-card">
        <div className="skeleton text mb-2" style={{ width: '60%' }}></div>
        <div className="skeleton text mb-2" style={{ width: '40%' }}></div>
        <div className="skeleton text mb-2" style={{ width: '80%' }}></div>
        <div className="skeleton btn" style={{ width: '100%', marginTop: '0.5rem' }}></div>
      </div>
    );
  }
  return (
    <div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton text mb-1" style={{ width: `${80 - i*10}%` }}></div>
      ))}
    </div>
  );
}
