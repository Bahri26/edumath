import React from 'react';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all ${className}`}>
    {children}
  </div>
);

export default Card;
