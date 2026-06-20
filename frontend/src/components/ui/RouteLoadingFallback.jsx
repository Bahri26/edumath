import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export default function RouteLoadingFallback() {
  const { t } = useTranslation();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-surface-50 dark:bg-surface-900 gap-3"
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin" />
      <span className="text-sm text-surface-500 dark:text-surface-300">{t('common.loading')}</span>
    </div>
  );
}
