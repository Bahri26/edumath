import React from 'react';
import Card from './Card';

export default {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    children: { control: 'text' },
    className: { control: 'text' },
  },
};

export const Default = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Kart başlığı</h3>
        <p className="text-slate-600 dark:text-slate-300 text-sm">
          İçerik alanı; liste, form veya özet metin için kullanılır.
        </p>
      </div>
    ),
  },
};

export const WithFooter = {
  args: {
    children: (
      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300">Alt bilgi ile birlikte örnek kart.</p>
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
          Son güncelleme: bugün
        </div>
      </div>
    ),
  },
};
