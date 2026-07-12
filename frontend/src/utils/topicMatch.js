/**
 * Konu / başlık eşleştirmesi — kısmi ve aksansız karşılaştırma.
 */
export function normalizeTopicKey(value) {
  return String(value || '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesTopic(exercise, needleRaw) {
  const needle = normalizeTopicKey(needleRaw);
  if (!needle) return true;
  const hay = normalizeTopicKey(
    `${exercise?.topic || ''} ${exercise?.name || ''} ${exercise?.description || ''}`,
  );
  if (!hay) return false;
  if (hay.includes(needle) || needle.includes(hay)) return true;
  const needleParts = needle.split(' ').filter((p) => p.length > 2);
  if (needleParts.length === 0) return hay.includes(needle);
  return needleParts.every((p) => hay.includes(p));
}
