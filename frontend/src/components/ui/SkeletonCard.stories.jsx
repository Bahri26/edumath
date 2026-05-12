import React from 'react';
import SkeletonCard from './SkeletonCard';

export default {
  title: 'UI/SkeletonCard',
  component: SkeletonCard,
  tags: ['autodocs'],
};

export const Default = {
  render: () => (
    <div className="max-w-sm">
      <SkeletonCard />
    </div>
  ),
};

export const Grid = {
  name: 'Izgara',
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  ),
};
