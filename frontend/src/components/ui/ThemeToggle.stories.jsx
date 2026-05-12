import React from 'react';
import ThemeToggle from './ThemeToggle';

export default {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tema değiştirici; `ThemeProvider` ile sarılmış olmalıdır (global Storybook dekoratöründe tanımlı).',
      },
    },
  },
};

export const Default = {
  render: () => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <span className="text-sm text-slate-600 dark:text-slate-300">Tema</span>
      <ThemeToggle />
    </div>
  ),
};
