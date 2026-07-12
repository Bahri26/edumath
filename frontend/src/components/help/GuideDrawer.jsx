import React, { useContext, useEffect, useMemo } from 'react';
import { X, BookOpen, ExternalLink } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LanguageContext } from '../../context/LanguageContext';
import { QUICK_GUIDE, orderGuideBlocks } from '../../data/quickGuideContent';
import QuickGuideBlockList from './QuickGuideBlockList.jsx';

/**
 * Öğretmen / öğrenci ortak kullanım kılavuzu — sağdan açılan panel.
 * Mevcut rotaya göre ilgili kartlar üste alınır; kartlardan sayfaya gidilir.
 */
export default function GuideDrawer({ audience = 'student', open, onClose }) {
  const { language } = useContext(LanguageContext);
  const lang = language === 'EN' ? 'EN' : 'TR';
  const pack = QUICK_GUIDE[audience] || QUICK_GUIDE.student;
  const content = pack[lang];
  const location = useLocation();
  const navigate = useNavigate();

  const { ordered, activeId } = useMemo(
    () => orderGuideBlocks(content.blocks, location.pathname),
    [content.blocks, location.pathname],
  );

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

  const handleNavigate = (path) => {
    onClose();
    if (path && path !== location.pathname) {
      navigate(path);
    }
  };

  const handleFullGuide = () => {
    const dest = content.fullGuidePath || (audience === 'teacher' ? '/teachers' : '/students');
    onClose();
    navigate(dest);
  };

  return (
    <div
      className={`fixed inset-0 z-[160] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label={lang === 'EN' ? 'Close overlay' : 'Katmanı kapat'}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-drawer-title"
        className={`absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-900 dark:shadow-black/40 border-l border-slate-200/80 dark:border-slate-700 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="relative shrink-0 overflow-hidden border-b border-slate-200 dark:border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-sky-600 to-cyan-500 opacity-[0.12] dark:opacity-[0.18]" />
          <div className="relative flex items-start justify-between gap-3 px-5 py-5 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-teal-600 shadow-md ring-1 ring-teal-100 dark:bg-slate-800 dark:text-teal-300 dark:ring-teal-900/50">
                <BookOpen size={22} aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600/90 dark:text-teal-300/90">
                  {lang === 'EN' ? 'Quick guide' : 'Hızlı kılavuz'}
                </p>
                <h2
                  id="guide-drawer-title"
                  className="text-lg font-bold leading-snug text-slate-900 dark:text-white"
                >
                  {content.title}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-slate-200/80 bg-white/90 p-2 text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              aria-label={lang === 'EN' ? 'Close' : 'Kapat'}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 sm:py-6">
          {content.intro ? (
            <p className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/80 px-4 py-3 text-sm leading-relaxed text-sky-950 dark:border-sky-900/40 dark:bg-sky-950/25 dark:text-sky-100">
              {content.intro}
            </p>
          ) : null}

          {activeId ? (
            <p className="mb-4 text-xs font-semibold text-teal-700 dark:text-teal-300">
              {lang === 'EN'
                ? 'Tips for this page are listed first.'
                : 'Bu sayfaya özel ipuçları üstte.'}
            </p>
          ) : null}

          <QuickGuideBlockList
            audience={audience}
            blocks={ordered}
            variant="drawer"
            lang={lang}
            onNavigate={handleNavigate}
          />

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleFullGuide}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:bg-slate-800 dark:text-teal-200 dark:hover:bg-slate-700"
            >
              <ExternalLink size={16} aria-hidden />
              {lang === 'EN' ? 'Open full guide' : 'Tam kılavuzu aç'}
            </button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
              {lang === 'EN' ? 'Press Esc to close.' : 'Kapatmak için Esc.'}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
