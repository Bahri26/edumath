/** Saniyeyi "X dk Y sn" veya EN "Xm Ys" biçimine çevirir. */
export function formatDuration(seconds, lang = 'TR') {
  if (seconds == null || !Number.isFinite(Number(seconds))) return '—';
  const total = Math.max(0, Math.round(Number(seconds)));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const isEn = String(lang).toUpperCase() === 'EN';
  if (isEn) {
    if (m <= 0) return `${s}s`;
    return `${m}m ${s}s`;
  }
  if (m <= 0) return `${s} sn`;
  return `${m} dk ${s} sn`;
}