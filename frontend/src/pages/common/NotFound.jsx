import React from 'react';
import { useNavigate } from 'react-router-dom';
import SkipLink from '../../components/ui/SkipLink.jsx';
import { useTranslation } from '../../i18n/useTranslation';

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <SkipLink>{t('skipToContent')}</SkipLink>
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-9xl font-bold text-teal-600 dark:text-teal-400">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">{t('common.notFoundTitle')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 mb-8">
          {t('common.notFoundDesc') || 'The page may have been moved or removed.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
        >
          {t('common.notFoundBack')}
        </button>
      </main>
    </div>
  );
};

export default NotFound;
