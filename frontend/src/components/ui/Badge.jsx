import React from 'react';

const colors = {
  gray: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const Badge = ({ children, color = 'gray', className = '' }) => {
  const cls = colors[color] || colors.gray;
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${cls} ${className}`}>{children}</span>
  );
};

export default Badge;
