import React from 'react';
import Badge from './Badge';

export default {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['gray', 'indigo', 'green', 'yellow', 'red', 'blue', 'purple'],
    },
    children: { control: 'text' },
  },
};

export const Gray = {
  args: { children: 'Taslak', color: 'gray' },
};

export const Indigo = {
  args: { children: 'Yeni', color: 'indigo' },
};

export const Green = {
  args: { children: 'Tamamlandı', color: 'green' },
};

export const Red = {
  args: { children: 'Hata', color: 'red' },
};

export const All = {
  name: 'Tüm renkler',
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['gray', 'indigo', 'green', 'yellow', 'red', 'blue', 'purple'].map((color) => (
        <Badge key={color} color={color}>
          {color}
        </Badge>
      ))}
    </div>
  ),
};
