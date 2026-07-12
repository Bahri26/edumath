/**
 * Public site origin for SEO / OG (no trailing slash).
 * Prefer VITE_PUBLIC_SITE_URL; fall back to window origin in the browser.
 */
export function getPublicSiteUrl() {
  const fromEnv = import.meta.env?.VITE_PUBLIC_SITE_URL;
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://edumath-client.onrender.com';
}

export function absolutePublicUrl(path = '/') {
  const base = getPublicSiteUrl();
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
