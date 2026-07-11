import React from 'react';

const Card = ({ children, className = '', interactive = false }) => (
  <div
    className={`bg-white/95 dark:bg-surface-800/95 p-6 rounded-card border border-surface-200/90 dark:border-surface-700 shadow-card dark:shadow-card-dark backdrop-blur-sm transition-all duration-200 ${
      interactive ? 'hover:shadow-soft hover:-translate-y-0.5' : 'hover:shadow-md'
    } ${className}`}
  >
    {children}
  </div>
);

export default Card;
