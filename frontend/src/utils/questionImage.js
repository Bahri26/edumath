import { resolveAssetUrl, getBackendOrigin } from '../services/api';

/**
 * Soruda gerçekten gösterilebilir bir görsel var mı?
 */
export function hasQuestionImage(src) {
  if (typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return true;
  }

  const resolved = resolveAssetUrl(trimmed);
  if (!resolved || typeof resolved !== 'string') return false;

  if (/^https?:\/\//i.test(resolved)) return true;

  if (resolved.startsWith('/uploads/') || resolved.startsWith('uploads/')) {
    return !!(getBackendOrigin() || import.meta.env.DEV);
  }

  return false;
}
