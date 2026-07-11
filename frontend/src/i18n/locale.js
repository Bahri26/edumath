const STORAGE_KEY = 'matova.language';

/** App screens use TR | EN */
export function normalizeAppLocale(value) {
  const v = String(value || '').trim().toUpperCase();
  return v === 'EN' ? 'EN' : 'TR';
}

/** Landing page uses tr | en */
export function normalizeLandingLocale(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === 'en' ? 'en' : 'tr';
}

export function readStoredLanguage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'TR';
    return normalizeAppLocale(raw);
  } catch {
    return 'TR';
  }
}

export function writeStoredLanguage(locale) {
  try {
    localStorage.setItem(STORAGE_KEY, normalizeAppLocale(locale));
  } catch {
    /* ignore quota / private mode */
  }
}

export function appToLandingLocale(appLocale) {
  return normalizeAppLocale(appLocale) === 'EN' ? 'en' : 'tr';
}

export function landingToAppLocale(landingLocale) {
  return normalizeLandingLocale(landingLocale) === 'en' ? 'EN' : 'TR';
}
