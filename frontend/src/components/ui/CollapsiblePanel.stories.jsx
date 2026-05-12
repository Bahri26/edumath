import React from 'react';
import CollapsiblePanel from './CollapsiblePanel';

export default {
  title: 'UI/CollapsiblePanel',
  component: CollapsiblePanel,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    defaultOpen: { control: 'boolean' },
  },
};

export const Closed = {
  args: {
    title: 'Detaylar',
    defaultOpen: false,
    children: <p className="text-sm text-slate-600 dark:text-slate-300">Panel içeriği burada görünür.</p>,
  },
};

export const OpenByDefault = {
  args: {
    title: 'Açık başlangıç',
    defaultOpen: true,
    children: (
      <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1">
        <li>Birinci madde</li>
        <li>İkinci madde</li>
      </ul>
    ),
  },
};
