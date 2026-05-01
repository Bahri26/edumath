/**
 * Örüntü alt konu sırası — backend `constants/patternTopics.js` ile aynı etiketleri kullanır.
 * (MEB matematik: örüntü oluşturma/analiz; tekrarlayan şekiller; sayı dizileri; özel sayılar.)
 */
export const PATTERN_TOPIC_ALL_UNDER = 'Örüntüler — Tüm alt konular';

export const PATTERN_TOPIC_ORDER = [
  'Örüntüler — Geometrik (şekil)',
  'Örüntüler — Sayı (sabit adım)',
  'Örüntüler — Sayı (karma kural)',
  'Örüntüler — Kare sayılar',
  'Örüntüler — Üçgensel sayılar',
  'Örüntüler — Sınıflama (eşleştirme)',
  'Örüntüler — Çözüm adımları (sıralama)',
];

function topicSortRank(t) {
  const idx = PATTERN_TOPIC_ORDER.indexOf(t);
  return idx === -1 ? PATTERN_TOPIC_ORDER.length + 1 : idx;
}

export function sortPatternTopicsUi(topics) {
  return [...new Set((topics || []).filter(Boolean))].sort((a, b) => {
    const ra = topicSortRank(a);
    const rb = topicSortRank(b);
    if (ra !== rb) return ra - rb;
    return String(a).localeCompare(String(b), 'tr');
  });
}
