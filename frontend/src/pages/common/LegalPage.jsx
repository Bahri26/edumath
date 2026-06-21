import React from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, GraduationCap } from 'lucide-react';
import SkipLink from '../../components/ui/SkipLink';
import { useTranslation } from '../../i18n/useTranslation';
import { LEGAL_DOC_TYPES, getLegalDoc } from '../../data/legalContent';

const LegalPage = () => {
  const { docType } = useParams();
  const { t, language, setLanguage, isEnglish } = useTranslation();

  if (!LEGAL_DOC_TYPES.includes(docType)) {
    return <Navigate to="/" replace />;
  }

  const langKey = isEnglish ? 'en' : 'tr';
  const doc = getLegalDoc(docType, langKey);
  const otherDocs = LEGAL_DOC_TYPES.filter((id) => id !== docType);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <SkipLink>{t('skipToContent')}</SkipLink>

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:opacity-90 transition-opacity"
          >
            <div className="bg-indigo-600 p-1 rounded-lg text-white">
              <GraduationCap size={18} />
            </div>
            <span>Edu<span className="text-indigo-500">math</span></span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setLanguage(isEnglish ? 'TR' : 'EN')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isEnglish ? 'TR' : 'EN'}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft size={16} />
              {t('legal.backHome')}
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {t('legal.updated')}: {doc.updated}
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">{doc.title}</h1>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300 mb-10">{doc.intro}</p>

        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{section.title}</h2>
              <ul className="space-y-3">
                {section.paragraphs.map((paragraph) => (
                  <li
                    key={paragraph.slice(0, 48)}
                    className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800"
                  >
                    {paragraph}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <nav
          className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 text-sm"
          aria-label={t('legal.relatedDocs')}
        >
          {otherDocs.map((id) => (
            <Link
              key={id}
              to={`/legal/${id}`}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t(`legal.${id}`)}
            </Link>
          ))}
          <a
            href="mailto:info@edumath.com"
            className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            info@edumath.com
          </a>
        </nav>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-500">
        © {new Date().getFullYear()} Edumath
      </footer>
    </div>
  );
};

export default LegalPage;
