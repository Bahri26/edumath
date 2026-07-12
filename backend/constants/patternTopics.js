/**
 * Örüntü soru bankası: alt konu etiketleri (MEB matematik programındaki
 * "örüntü oluşturma ve analiz etme", tekrarlayan şekiller, sayı örüntüleri,
 * özel sayı dizileri kazanım çerçevesiyle uyumlu sınıflama).
 * @see https://mufredat.meb.gov.tr/ MATEMATİK ÖĞRETİM PROGRAMI
 */

const PATTERN_TOPIC_LABELS = {
  GEOMETRIC: 'Örüntüler — Geometrik (şekil)',
  ARITHMETIC: 'Örüntüler — Sayı (sabit adım)',
  RULE: 'Örüntüler — Sayı (karma kural)',
  SQUARES: 'Örüntüler — Kare sayılar',
  TRIANGULAR: 'Örüntüler — Üçgensel sayılar',
  MATCHING: 'Örüntüler — Sınıflama (eşleştirme)',
  SEQUENCE: 'Örüntüler — Çözüm adımları (sıralama)',
};

/** Dropdown + seed sırası (öğretim akışına yakın). */
const PATTERN_TOPIC_ORDER = [
  PATTERN_TOPIC_LABELS.GEOMETRIC,
  PATTERN_TOPIC_LABELS.ARITHMETIC,
  PATTERN_TOPIC_LABELS.RULE,
  PATTERN_TOPIC_LABELS.SQUARES,
  PATTERN_TOPIC_LABELS.TRIANGULAR,
  PATTERN_TOPIC_LABELS.MATCHING,
  PATTERN_TOPIC_LABELS.SEQUENCE,
];

/** Filtre: tüm Örüntü alt başlıkları (UI etiketi; ayrıca yalın "Örüntüler" de aynı anlama gelir). */
const PATTERN_TOPIC_ALL_UNDER = 'Örüntüler — Tüm alt konular';

const LEARNING_OUTCOME_BY_LABEL = {
  [PATTERN_TOPIC_LABELS.GEOMETRIC]:
    'Tekrar eden geometrik şekil örüntülerini oluşturur ve bir sonraki elemana karar verir.',
  [PATTERN_TOPIC_LABELS.ARITHMETIC]:
    'Sayı örüntüsündeki sabit artış ilişkisini fark eder ve eksik terimi bulur.',
  [PATTERN_TOPIC_LABELS.RULE]:
    'Sayı dizisinde ardışık farklı işlemlerden oluşan kuralı kullanarak geneller.',
  [PATTERN_TOPIC_LABELS.SQUARES]:
    'Kare sayılarla ifade edilen örüntüde sıradaki terimi belirler.',
  [PATTERN_TOPIC_LABELS.TRIANGULAR]:
    'Üçgensel sayı düzeninde ilişkiyi görür ve sıradaki değeri bulur.',
  [PATTERN_TOPIC_LABELS.MATCHING]:
    'Verilen örüntüleri türlerine göre sınıflar ve doğru seçenekle eşleştirir.',
  [PATTERN_TOPIC_LABELS.SEQUENCE]:
    'Bir örüntü problemini çözmek için uygun işlem sırasını kurar.',
};

function topicSortRank(t) {
  const idx = PATTERN_TOPIC_ORDER.indexOf(t);
  return idx === -1 ? PATTERN_TOPIC_ORDER.length + 1 : idx;
}

/**
 * Önce tanımlı örüntü sırasına göre, sonra Türkçe alfabetik.
 * @param {string[]} topics
 * @returns {string[]}
 */
function sortPatternTopics(topics) {
  return [...new Set(topics.filter(Boolean))].sort((a, b) => {
    const ra = topicSortRank(a);
    const rb = topicSortRank(b);
    if (ra !== rb) return ra - rb;
    return String(a).localeCompare(String(b), 'tr');
  });
}

/** topic sorgusu: tek alt konu veya tüm örüntü ailesi */
function buildTopicMongoClause(topicRaw, escapeRegexFn) {
  const topic = String(topicRaw || '').trim();
  if (!topic || topic === 'Tümü') return null;
  if (topic === PATTERN_TOPIC_ALL_UNDER || topic === 'Örüntüler') {
    return { $regex: '^Örüntüler', $options: '' };
  }
  return { $regex: `^${escapeRegexFn(topic)}$`, $options: 'i' };
}

function isPatternBankSubject(subject) {
  const value = String(subject || '').trim();
  return !value || /^matematik$/i.test(value);
}

/** Alıştırma havuzu (exercise-seed) soru bankasında gösterilmez. */
function excludeExerciseSeedFromBank(query = {}) {
  if (typeof query.source === 'string' && query.source) {
    return;
  }
  query.source = query.source && typeof query.source === 'object'
    ? { ...query.source, $ne: 'exercise-seed' }
    : { $ne: 'exercise-seed' };
}

/**
 * Matematik soru bankası: varsayılan olarak yalnızca Örüntüler ailesi.
 * topic=Tümü veya boş → ^Örüntüler; açık alt konu seçildiyse buildTopicMongoClause kullanılır.
 */
function applyPatternQuestionBankScope(query = {}, { subject, topic, escapeRegexFn } = {}) {
  excludeExerciseSeedFromBank(query);

  const escape = escapeRegexFn || ((value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const topicClause = buildTopicMongoClause(topic, escape);
  if (topicClause) {
    query.topic = topicClause;
    return;
  }
  if (isPatternBankSubject(subject)) {
    query.topic = { $regex: '^Örüntüler', $options: '' };
  }
}

function filterPatternTopicLabels(topics = []) {
  return (topics || []).filter((topic) => /^Örüntüler/i.test(String(topic || '').trim()));
}

module.exports = {
  PATTERN_TOPIC_LABELS,
  PATTERN_TOPIC_ORDER,
  PATTERN_TOPIC_ALL_UNDER,
  LEARNING_OUTCOME_BY_LABEL,
  sortPatternTopics,
  buildTopicMongoClause,
  isPatternBankSubject,
  excludeExerciseSeedFromBank,
  applyPatternQuestionBankScope,
  filterPatternTopicLabels,
};
