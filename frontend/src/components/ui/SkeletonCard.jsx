import React from 'react';

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
    <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3" />
    <div className="flex items-center gap-4">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
      <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
    </div>
  </div>
);

export default SkeletonCard;