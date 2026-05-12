import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
  className = '',
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const id = useId();

  return (
    <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/20 ${className}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
          {title}
        </span>
        <ChevronDown
          size={18}
          className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={id} className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

