import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeAppLocale, readStoredLanguage, writeStoredLanguage } from '../i18n/locale';

export const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => readStoredLanguage());

  const setLanguage = useCallback((next) => {
    const normalized = normalizeAppLocale(next);
    setLanguageState(normalized);
    writeStoredLanguage(normalized);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'EN' ? 'en' : 'tr';
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      isEnglish: language === 'EN',
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
