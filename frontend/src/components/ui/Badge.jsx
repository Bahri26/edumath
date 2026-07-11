import React from 'react';

const colors = {
  gray: 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-200',
  indigo: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  sky: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
};

const Badge = ({ children, color = 'gray', className = '' }) => {
  const cls = colors[color] || colors.gray;
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${cls} ${className}`}>{children}</span>
  );
};

export default Badge;
