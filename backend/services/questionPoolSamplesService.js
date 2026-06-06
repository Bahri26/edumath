const Question = require('../models/Question');
const { buildTopicMongoClause } = require('../constants/patternTopics');

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Havuz örneği olarak yalnızca metin tabanlı sorular kullanılsın (görsel/diyagramlı hariç). */
function isTextOnlyPoolQuestion(q) {
  if (!q) return false;
  if (String(q.image || '').trim()) return false;
  if (String(q.imageKey || '').trim()) return false;

  const opts = q.options || [];
  for (const opt of opts) {
    if (typeof opt === 'object' && opt) {
      if (String(opt.image || '').trim()) return false;
      if (String(opt.imageKey || '').trim()) return false;
    }
  }

  const layout = q.assessmentMeta?.parseLayout;
  if (layout?.diagramImagePath || layout?.diagramImageKey) return false;
  if (String(layout?.diagramImage || '').trim()) return false;

  return Boolean(String(q.text || '').trim());
}

function applyTextOnlyPoolClause(query) {
  if (!query.$and) query.$and = [];
  query.$and.push({
    $or: [{ image: { $exists: false } }, { image: null }, { image: '' }],
  });
  query.$and.push({
    $or: [{ imageKey: { $exists: false } }, { imageKey: null }, { imageKey: '' }],
  });
}

function buildPoolBaseQuery({ subject, topic, classLevel, textOnly = true }) {
  const query = {};
  const subj = String(subject || '').trim();
  if (subj && subj !== 'Tümü') {
    query.subject = { $regex: `^${escapeRegex(subj)}$`, $options: 'i' };
  }
  applyTopicClause(query, topic);
  applyClassLevelSafe(query, classLevel);
  if (textOnly) applyTextOnlyPoolClause(query);
  return query;
}

async function fetchPoolQuestionDocs({
  subject,
  topic,
  classLevel,
  limit,
  textOnly = true,
}) {
  const desired = Math.min(24, Math.max(1, limit));
  const fetchLimit = textOnly ? Math.min(96, desired * 6) : desired;

  const selectFields =
    'text options correctAnswer solution topic difficulty learningOutcome subject classLevel image imageKey visualPrompt assessmentMeta';

  let rows = await Question.find(buildPoolBaseQuery({ subject, topic, classLevel, textOnly }))
    .sort({ updatedAt: -1 })
    .limit(fetchLimit)
    .select(selectFields)
    .lean();

  if (textOnly) {
    rows = rows.filter(isTextOnlyPoolQuestion);
  }

  if (textOnly && rows.length < desired && classLevel && classLevel !== 'Tümü') {
    const relaxed = buildPoolBaseQuery({ subject, topic, classLevel: null, textOnly });
    const extra = await Question.find(relaxed)
      .sort({ updatedAt: -1 })
      .limit(fetchLimit)
      .select(selectFields)
      .lean();
    const seen = new Set(rows.map((r) => String(r._id)));
    for (const row of extra.filter(isTextOnlyPoolQuestion)) {
      if (!seen.has(String(row._id))) {
        rows.push(row);
        seen.add(String(row._id));
      }
      if (rows.length >= desired) break;
    }
  }

  return rows.slice(0, desired);
}

function applyClassLevelSafe(query, classLevel) {
  if (!classLevel || classLevel === 'Tümü') {
    return;
  }
  query.classLevel = String(classLevel).trim();
}

/** Konu filtresi: önce örüntü özel clause, yoksa konu için alt dize arama */
function applyTopicClause(query, topicRaw) {
  const clause = buildTopicMongoClause(topicRaw, escapeRegex);
  if (clause) {
    query.topic = clause;
    return;
  }
  const t = String(topicRaw || '').trim();
  if (!t || t === 'Tümü') {
    return;
  }
  query.topic = { $regex: escapeRegex(t), $options: 'i' };
}

/**
 * Havuzdan anonimlestirilmiş ornekleri ceker — stil/seviye hizalamasi icin; birebir kopyalama yapilmamali denir promptta.
 * @returns {Promise<Array<{ summary: string, topic?: string, difficulty?: string }>>}
 */
async function fetchQuestionPoolSamples({
  subject = 'Matematik',
  topic = '',
  classLevel,
  limit = 8,
  textOnly = true,
} = {}) {
  const rows = await fetchPoolQuestionDocs({
    subject,
    topic,
    classLevel,
    limit: Math.min(20, Math.max(1, limit)),
    textOnly,
  });

  return rows.map((q) => {
    const opts = (q.options || [])
      .map((o) => (typeof o === 'string' ? o : o?.text))
      .filter(Boolean)
      .slice(0, 4)
      .join(' | ');
    const excerpt = String(q.text || '')
      .trim()
      .slice(0, 220);
    const lo = (q.learningOutcome || '').trim().slice(0, 140);
    let summary = excerpt + (opts ? ` ; secenek ornekleri: ${opts.slice(0, 120)}` : '');
    if ((q.topic || '').trim()) summary = `[Konu:${q.topic}] ${summary}`;
    if (lo) summary = `${summary} [Kazanima yakin bağlam:${lo}${lo.length >= 140 ? '…' : ''}]`;
    return {
      summary: summary.slice(0, 520),
      topic: q.topic,
      difficulty: q.difficulty,
    };
  });
}

/**
 * Üretim için tam soru satırları (metin + şıklar + cevap). Varsayılan: görsel/diyagramlı sorular hariç.
 */
async function fetchQuestionPoolRows({
  subject = 'Matematik',
  topic = '',
  classLevel,
  limit = 12,
  textOnly = true,
} = {}) {
  const rows = await fetchPoolQuestionDocs({
    subject,
    topic,
    classLevel,
    limit: Math.min(24, Math.max(1, limit)),
    textOnly,
  });

  return rows.map((q) => ({
    text: String(q.text || '').trim(),
    options: (q.options || [])
      .map((o) => (typeof o === 'string' ? o : o?.text))
      .filter(Boolean)
      .slice(0, 4),
    correctAnswer: String(q.correctAnswer || '').trim(),
    solution: String(q.solution || '').trim(),
    topic: q.topic || '',
    difficulty: q.difficulty || '',
    learningOutcome: q.learningOutcome || '',
    subject: q.subject || subject,
    classLevel: q.classLevel || classLevel || '',
  }));
}

function formatSamplesForPrompt(samples, { textOnly = true } = {}) {
  if (!samples?.length) {
    const base =
      'Havuzda bu filtrelerle ornek bulunamadi; yalnizca MEB programi ve genel pedagojik kurallara gore uret.';
    return textOnly
      ? `${base} (Gorsel/diyagramli sorular ornek havuzuna dahil edilmez.)`
      : base;
  }
  const header = textOnly
    ? 'Asagidaki ornekler yalnizca METIN tabanli sorulardan alinmistir; gorsel/diyagram sorulari ornek degildir.'
    : '';
  const body = samples.map((s, i) => `${i + 1}. ${s.summary}`).join('\n');
  return header ? `${header}\n${body}` : body;
}

module.exports = {
  fetchQuestionPoolSamples,
  fetchQuestionPoolRows,
  formatSamplesForPrompt,
  isTextOnlyPoolQuestion,
};
