import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function PreviewDialog({ title, onClose, children }) {
  const panel = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useFocusTrap(panel, true);
  useEffect(() => {
    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    if (scrollbar) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight || '0') + scrollbar}px`;
    body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') closeRef.current?.(); };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <section ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="flex max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:max-h-[calc(100dvh-2rem)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6">
          <h2 id={titleId} className="min-w-0 break-words text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Önizlemeyi kapat" className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-slate-200 dark:hover:bg-slate-700"><X size={20} /></button>
        </header>
        <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain break-words p-3 sm:p-6">{children}</div>
      </section>
    </div>, document.body,
  );
}
