import React from 'react';
import { Inbox } from 'lucide-react';
import EmptyState from '../ui/EmptyState';

/** Consistent empty state for admin lists and tables. */
export default function AdminTableEmpty({ title, description, action }) {
  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      action={action}
      className="border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40"
    />
  );
}
