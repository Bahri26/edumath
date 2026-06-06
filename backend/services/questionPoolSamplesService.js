const Question = require('../models/Question');
const { buildTopicMongoClause } = require('../constants/patternTopics');

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
} = {}) {
  const query = {};
  const subj = String(subject || '').trim();
  if (subj && subj !== 'Tümü') {
    query.subject = { $regex: `^${escapeRegex(subj)}$`, $options: 'i' };
  }
  applyTopicClause(query, topic);
  applyClassLevelSafe(query, classLevel);

  const rows = await Question.find(query)
    .sort({ updatedAt: -1 })
    .limit(Math.min(20, Math.max(1, limit)))
    .select('text options topic difficulty learningOutcome subject classLevel')
    .lean();

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
 * Üretim için tam soru satırları (metin + şıklar + cevap).
 */
async function fetchQuestionPoolRows({
  subject = 'Matematik',
  topic = '',
  classLevel,
  limit = 12,
} = {}) {
  const query = {};
  const subj = String(subject || '').trim();
  if (subj && subj !== 'Tümü') {
    query.subject = { $regex: `^${escapeRegex(subj)}$`, $options: 'i' };
  }
  applyTopicClause(query, topic);
  applyClassLevelSafe(query, classLevel);

  const rows = await Question.find(query)
    .sort({ updatedAt: -1 })
    .limit(Math.min(24, Math.max(1, limit)))
    .select('text options correctAnswer solution topic difficulty learningOutcome subject classLevel')
    .lean();

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

function formatSamplesForPrompt(samples) {
  if (!samples?.length) {
    return 'Havuzda bu filtrelerle ornek bulunamadi; yalnizca MEB programi ve genel pedagojik kurallara gore uret.';
  }
  return samples
    .map((s, i) => `${i + 1}. ${s.summary}`)
    .join('\n');
}

module.exports = {
  fetchQuestionPoolSamples,
  fetchQuestionPoolRows,
  formatSamplesForPrompt,
};
