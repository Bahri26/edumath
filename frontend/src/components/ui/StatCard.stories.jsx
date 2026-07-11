import React from 'react';
import { BookOpen, Trophy, Users } from 'lucide-react';
import StatCard from './StatCard';

export default {
  title: 'UI/StatCard',
  component: StatCard,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    value: { control: 'text' },
    change: { control: 'text' },
    color: {
      control: 'select',
      options: [
        'bg-blue-600',
        'bg-sky-600',
        'bg-green-600',
        'bg-teal-600',
        'bg-red-600',
        'bg-orange-600',
        'bg-pink-600',
        'bg-yellow-600',
      ],
    },
    icon: { control: false },
  },
};

export const Default = {
  args: {
    title: 'Aktif dersler',
    value: '12',
    change: '+3%',
    icon: BookOpen,
    color: 'bg-teal-600',
  },
};

export const WithoutChange = {
  args: {
    title: 'Öğrenci sayısı',
    value: '48',
    icon: Users,
    color: 'bg-blue-600',
  },
};

export const WithTrophyIcon = {
  args: {
    title: 'Tamamlanan sınav',
    value: '7',
    change: '+1',
    icon: Trophy,
    color: 'bg-green-600',
  },
};

export const Grid = {
  name: 'Izgara',
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl">
      <StatCard title="Dersler" value="12" change="+2%" icon={BookOpen} color="bg-teal-600" />
      <StatCard title="Puan" value="840" icon={Trophy} color="bg-green-600" />
      <StatCard title="Sınıf" value="24" icon={Users} color="bg-blue-600" />
    </div>
  ),
};
