import React from 'react';

export default function QuestionSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-6 w-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="flex gap-1">
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
