/**
 * Sınıf seviyesi normalizasyonu: "1", "1.", "1.Sınıf", "1. Sınıf" → ortak anahtar.
 */

function extractGradeNumber(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const m = s.match(/(\d{1,2})/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

/** Canonical display form used across Matova: "9. Sınıf" */
function canonicalizeClassLevel(raw) {
  const n = extractGradeNumber(raw);
  if (n == null) {
    const s = String(raw || '').trim();
    return s || null;
  }
  return `${n}. Sınıf`;
}

/** True if two class labels refer to the same grade (or exact match after trim). */
function classLevelsMatch(a, b) {
  if (a == null || b == null) return false;
  const na = extractGradeNumber(a);
  const nb = extractGradeNumber(b);
  if (na != null && nb != null) return na === nb;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/** Mongo $in list for querying exercises matching a student class label. */
function classLevelQueryValues(raw) {
  const canon = canonicalizeClassLevel(raw);
  if (!canon) return [];
  const n = extractGradeNumber(canon);
  if (n == null) return [canon];
  const variants = new Set([
    canon,
    String(n),
    `${n}.`,
    `${n}.Sınıf`,
    `${n}. Sınıf`,
    `${n}.Sinif`,
    `${n}. Sinif`,
    `${n}. sınıf`,
    `${n}.sinif`,
  ]);
  return [...variants];
}

function sameStudentId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

module.exports = {
  extractGradeNumber,
  canonicalizeClassLevel,
  classLevelsMatch,
  classLevelQueryValues,
  sameStudentId,
};
