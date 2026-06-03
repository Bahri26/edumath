const Question = require('../models/Question');
const { buildTopicMongoClause } = require('../constants/patternTopics');
const {
  generateFallbackPatternQuestions,
} = require('./aiQuestionGeneratorService');

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function formatQuestionDoc(q, index = 0) {
  const options = (q.options || [])
    .map((o) => (typeof o === 'string' ? o : o?.text))
    .filter(Boolean)
    .slice(0, 4);
  while (options.length < 4) options.push('');

  return {
    id: q._id ? String(q._id) : `local-q-${index + 1}`,
    text: q.text || '',
    options,
    correctAnswer: q.correctAnswer || options[0] || '',
    explanation: q.solution || q.explanation || '',
    solution: q.solution || '',
    subject: q.subject || 'Matematik',
    topic: q.topic || '',
    classLevel: q.classLevel || '9. Sınıf',
    difficulty: q.difficulty || 'Orta',
    type: q.type || 'multiple-choice',
    learningOutcome: q.learningOutcome || '',
    mebReference: q.mebReference || '',
    curriculumNote: q.curriculumNote || '',
    visualPrompt: q.visualPrompt || '',
    source: 'local-bank',
  };
}

function buildMatchQuery({ subject, topic, classLevel, difficulty }) {
  const query = {};
  const subj = String(subject || '').trim();
  if (subj && subj !== 'Tümü') {
    query.subject = { $regex: `^${escapeRegex(subj)}$`, $options: 'i' };
  }
  const clause = buildTopicMongoClause(topic, escapeRegex);
  if (clause) {
    query.topic = clause;
  } else {
    const t = String(topic || '').trim();
    if (t && t !== 'Tümü') {
      query.topic = { $regex: escapeRegex(t), $options: 'i' };
    }
  }
  if (classLevel && classLevel !== 'Tümü') {
    query.classLevel = String(classLevel).trim();
  }
  if (difficulty && difficulty !== 'Tümü') {
    query.difficulty = String(difficulty).trim();
  }
  return query;
}

async function sampleQuestionsFromPool({
  subject = 'Matematik',
  topic = '',
  classLevel,
  difficulty,
  count = 5,
}) {
  const desired = Math.min(20, Math.max(1, Number(count) || 5));
  const query = buildMatchQuery({ subject, topic, classLevel, difficulty });

  let rows = await Question.aggregate([
    { $match: query },
    { $sample: { size: desired } },
  ]);

  if (rows.length < desired) {
    const relaxed = { ...query };
    delete relaxed.difficulty;
    const extra = await Question.aggregate([
      { $match: relaxed },
      { $sample: { size: desired - rows.length } },
    ]);
    rows = [...rows, ...extra];
  }

  return rows.map((q, i) => formatQuestionDoc(q, i));
}

async function generateLocalQuiz({ topic, difficulty, count, classLevel, subject }) {
  const fromDb = await sampleQuestionsFromPool({
    subject,
    topic,
    classLevel,
    difficulty,
    count,
  });

  if (fromDb.length >= Math.min(3, Number(count) || 5)) {
    return {
      questions: fromDb.slice(0, count),
      generator: 'local-db',
      hint: 'Sorular yerel soru bankasından seçildi.',
    };
  }

  const fb = await generateFallbackPatternQuestions({
    classLevel,
    difficulty,
    count,
    topic,
    subject,
  });

  return {
    questions: (fb.questions || []).map((q, i) => formatQuestionDoc(q, i)),
    generator: fb.generator || 'local-fallback',
    hint: 'Soru bankası yetersiz; yerel şablon paketi kullanıldı.',
  };
}

async function generateLocalPatternPack(params) {
  const fromDb = await sampleQuestionsFromPool(params);
  if (fromDb.length >= Math.min(3, Number(params.count) || 5)) {
    return {
      generator: 'local-db',
      questions: fromDb,
      hint: 'Örüntü soruları yerel bankadan seçildi.',
    };
  }
  const fb = await generateFallbackPatternQuestions(params);
  return {
    ...fb,
    hint: fb.hint || 'Yerel örüntü şablon paketi kullanıldı.',
  };
}

async function generateLocalPractice({ weakTopics, count = 5, studentId }) {
  const { getWeakTopics } = require('./studentAnalyticsService');
  let topics = Array.isArray(weakTopics) ? weakTopics.filter(Boolean) : [];
  if (!topics.length && studentId) {
    topics = await getWeakTopics(studentId);
  }
  if (!topics.length) topics = ['Örüntüler'];

  const primary = topics[0];
  const fromDb = await sampleQuestionsFromPool({
    topic: primary,
    count: Math.max(3, Number(count) || 5),
    difficulty: 'Orta',
  });

  const {
    buildInteractivePracticeQuestions,
    buildFallbackPracticeQuestions,
  } = require('./practiceQuestionBank');

  const interactive = buildInteractivePracticeQuestions(topics);
  const fallback = buildFallbackPracticeQuestions(topics);
  const bank = fromDb.length ? fromDb : fallback;

  return {
    questions: [...interactive, ...bank].slice(0, Number(count) || 5),
    message: fromDb.length ? 'Yerel bankadan kişiselleştirilmiş alıştırmalar.' : 'Yerel şablon alıştırmaları.',
  };
}

module.exports = {
  sampleQuestionsFromPool,
  generateLocalQuiz,
  generateLocalPatternPack,
  generateLocalPractice,
  formatQuestionDoc,
};
