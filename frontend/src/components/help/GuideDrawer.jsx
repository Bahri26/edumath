import React, { useContext, useEffect } from 'react';
import { X } from 'lucide-react';
import { LanguageContext } from '../../context/LanguageContext';
import { QUICK_GUIDE } from '../../data/quickGuideContent';
import QuickGuideBlockList from './QuickGuideBlockList.jsx';

export default function GuideDrawer({ audience = 'student', open, onClose }) {
  const { language } = useContext(LanguageContext);
  const lang = language === 'EN' ? 'EN' : 'TR';
  const pack = QUICK_GUIDE[audience] || QUICK_GUIDE.student;
  const content = pack[lang];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[160] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-label={lang === 'EN' ? 'Close overlay' : 'Katmanı kapat'}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-drawer-title"
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="shrink-0 flex items-start justify-between gap-4 px-5 py-4 sm:px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              {lang === 'EN' ? 'Quick guide' : 'Hızlı kılavuz'}
            </p>
            <h2
              id="guide-drawer-title"
              className="mt-0.5 text-lg font-semibold leading-snug text-slate-900 dark:text-white break-words"
            >
              {content.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label={lang === 'EN' ? 'Close' : 'Kapat'}
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {content.intro ? (
            <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {content.intro}
            </p>
          ) : null}

          <QuickGuideBlockList audience={audience} blocks={content.blocks} variant="drawer" />

          <p className="mt-8 text-center text-[11px] text-slate-400 dark:text-slate-500">
            {lang === 'EN' ? 'Press Esc to close.' : 'Kapatmak için Esc.'}
          </p>
        </div>
      </aside>
    </div>
  );
}
