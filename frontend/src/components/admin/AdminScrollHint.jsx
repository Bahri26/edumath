import React, { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { MESSAGES, lookupMessage, formatMessage } from '../../i18n/messages';

/** Mobile scroll note for admin tables without a card fallback (md–lg). */
export default function AdminScrollHint({ className = '' }) {
  const langCtx = useContext(LanguageContext);
  const catalog = MESSAGES[langCtx?.language || 'TR'] || MESSAGES.TR;
  const hint =
    formatMessage(lookupMessage(catalog, 'admin.tableScrollHint')) ||
    'Tabloyu görmek için yatay kaydırın →';
  return (
    <p
      className={`mb-2 hidden text-xs text-slate-500 dark:text-slate-400 md:block lg:hidden ${className}`.trim()}
      role="note"
    >
      {hint}
    </p>
  );
}
