import React, { useContext, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import { QUICK_GUIDE } from '../../data/quickGuideContent';
import QuickGuideBlockList from './QuickGuideBlockList.jsx';

/**
 * Öğrenci / öğretmen hızlı kılavuz — ortalanmış modal (sağ drawer değil).
 * Kapalıyken DOM'a hiç yazılmaz; ana sayfayı sıkıştırmaz.
 */
export default function GuideDrawer({ audience = 'student', open, onClose }) {
  const { language } = useContext(LanguageContext);
  const lang = language === 'EN' ? 'EN' : 'TR';
  const pack = QUICK_GUIDE[audience] || QUICK_GUIDE.student;
  const content = pack[lang];
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        onClick={onClose}
        aria-label={lang === 'EN' ? 'Close overlay' : 'Katmanı kapat'}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-dialog-title"
        className="relative z-[1] flex w-full max-w-lg max-h-[min(88vh,40rem)] flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700"
      >
        <header className="shrink-0 flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {lang === 'EN' ? 'Quick guide' : 'Hızlı kılavuz'}
            </p>
            <h2
              id="guide-dialog-title"
              className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-white"
            >
              {content.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label={lang === 'EN' ? 'Close' : 'Kapat'}
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
          {content.intro ? (
            <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {content.intro}
            </p>
          ) : null}

          <QuickGuideBlockList audience={audience} blocks={content.blocks} variant="drawer" />
        </div>

        <footer className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            {lang === 'EN' ? 'Got it' : 'Tamam'}
          </button>
        </footer>
      </div>
    </div>
  );
}
