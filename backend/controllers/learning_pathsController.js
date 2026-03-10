const repo = require('../repos/learning_pathsRepo');
const knex = require('../db/knex');
const { GoogleGenAI } = require('@google/genai');
const adaptiveLearningService = require('../services/adaptiveLearningService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getAuthUserId(req) {
  return Number(req.user?.id || req.user?.dbUser?.user_id || req.user?.user_id || 0) || null;
}

let attemptsMetaCache = null;
async function getAttemptsMeta() {
  if (attemptsMetaCache) return attemptsMetaCache;

  const hasStudentAttempts = await knex.schema.hasTable('student_exam_attempts');
  if (hasStudentAttempts) {
    const info = await knex('student_exam_attempts').columnInfo();
    const cols = new Set(Object.keys(info || {}));
    attemptsMetaCache = {
      table: 'student_exam_attempts',
      pk: cols.has('attempt_id') ? 'attempt_id' : 'id',
      actor: cols.has('user_id') ? 'user_id' : 'student_id',
      percentage: cols.has('percentage') ? 'percentage' : (cols.has('percentage_score') ? 'percentage_score' : null),
      createdAt: cols.has('created_at') ? 'created_at' : (cols.has('submitted_at') ? 'submitted_at' : 'updated_at'),
      status: cols.has('status') ? 'status' : null
    };
    return attemptsMetaCache;
  }

  const hasUserAttempts = await knex.schema.hasTable('user_exam_attempts');
  if (hasUserAttempts) {
    attemptsMetaCache = {
      table: 'user_exam_attempts',
      pk: 'attempt_id',
      actor: 'user_id',
      percentage: 'percentage',
      createdAt: 'created_at',
      status: null
    };
    return attemptsMetaCache;
  }

  attemptsMetaCache = {
    table: null,
    pk: null,
    actor: null,
    percentage: null,
    createdAt: null,
    status: null
  };
  return attemptsMetaCache;
}

function toFixedNumber(value, digits = 2) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Number(n.toFixed(digits));
}

function mapTopicRows(topicRows) {
  return topicRows
    .map((row) => {
      const total = Number(row.total || 0);
      const correct = Number(row.correct_count || 0);
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        topic: row.topic || 'Genel Matematik',
        score,
        status: score >= 70 ? 'strong' : 'weak',
        correctCount: correct,
        totalQuestions: total
      };
    })
    .sort((a, b) => a.score - b.score);
}

async function generateAiAdvice({ avgScore, weakTopics, topicSummary, recentResults }) {
  const fallback = {
    general_comment: avgScore >= 70
      ? 'Guzel bir ivmedesin. Guclu oldugun konulari korurken zayif alanlara kisa tekrar ekle.'
      : 'Temel kavramlari adim adim guclendirerek ilerlersen puanin hizla yukselecek.',
    study_recommendations: [
      'Her gun 20-30 dakika hedefli konu tekrari yap.',
      'Zayif oldugun konularda once kolay sonra orta seviye soru coz.',
      'Yanlis yaptigin sorulari ertesi gun tekrar et.'
    ],
    weak_topics: weakTopics
  };

  if (!GEMINI_API_KEY) return fallback;

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `Bir ogrenci icin kisa, uygulanabilir ogrenme kocu yorumu uret.
Sadece JSON don:
{
  "general_comment": "...",
  "study_recommendations": ["...","...","..."],
  "weak_topics": ["..."]
}

Ortalama: ${avgScore}
Zayif Konular: ${JSON.stringify(weakTopics)}
Konu Ozeti: ${JSON.stringify(topicSummary)}
Son Sonuclar: ${JSON.stringify(recentResults)}`;

    const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
    const raw = String(response?.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(raw);

    return {
      general_comment: String(parsed?.general_comment || fallback.general_comment),
      study_recommendations: Array.isArray(parsed?.study_recommendations)
        ? parsed.study_recommendations
        : fallback.study_recommendations,
      weak_topics: Array.isArray(parsed?.weak_topics) ? parsed.weak_topics : fallback.weak_topics
    };
  } catch (_) {
    return fallback;
  }
}

async function buildLearningPathPayload(userId) {
  const adaptiveOverview = await adaptiveLearningService.getLearningOverview(userId);
  const attemptsMeta = await getAttemptsMeta();
  if (!attemptsMeta.table || !attemptsMeta.actor) {
    return {
      topics: [],
      recommendedQuestions: adaptiveOverview.recommendedQuestions || [],
      lastAiAdvice: null,
      lastExam: null,
      overallStats: { totalExams: 0, totalCorrect: 0, successRate: 0, avgScore: 0 },
      recentActivity: [],
      dailyQuests: [],
      xpHeader: adaptiveOverview.xpHeader,
      continueLesson: adaptiveOverview.continueLesson,
      dueReviews: adaptiveOverview.dueReviews,
      weakSkills: adaptiveOverview.weakSkills
    };
  }

  const createdCol = attemptsMeta.createdAt || 'created_at';
  const attemptsQb = knex(`${attemptsMeta.table} as at`)
    .leftJoin('exams as e', 'e.exam_id', 'at.exam_id')
    .where(`at.${attemptsMeta.actor}`, userId)
    .select(
      knex.raw(`at.${attemptsMeta.pk} as attempt_id`),
      'at.exam_id',
      attemptsMeta.percentage
        ? knex.raw(`at.${attemptsMeta.percentage} as score`)
        : knex.raw('0 as score'),
      knex.raw(`at.${createdCol} as created_at`),
      'e.title'
    )
    .orderBy(`at.${createdCol}`, 'desc')
    .limit(150);

  if (attemptsMeta.status) {
    attemptsQb.whereIn(`at.${attemptsMeta.status}`, ['submitted', 'graded', 'completed']);
  }

  const attempts = await attemptsQb;
  if (!attempts.length) {
    return {
      topics: [],
      recommendedQuestions: adaptiveOverview.recommendedQuestions || [],
      lastAiAdvice: null,
      lastExam: null,
      overallStats: { totalExams: 0, totalCorrect: 0, successRate: 0, avgScore: 0 },
      recentActivity: [],
      dailyQuests: [],
      xpHeader: adaptiveOverview.xpHeader,
      continueLesson: adaptiveOverview.continueLesson,
      dueReviews: adaptiveOverview.dueReviews,
      weakSkills: adaptiveOverview.weakSkills
    };
  }

  const attemptIds = attempts.map((a) => Number(a.attempt_id)).filter((x) => Number.isInteger(x));

  const topicRows = await knex('exam_answers as ea')
    .join('questions as q', 'q.question_id', 'ea.question_id')
    .whereIn('ea.attempt_id', attemptIds)
    .groupBy('q.topic')
    .select('q.topic')
    .count({ total: '*' })
    .sum({ correct_count: knex.raw('CASE WHEN ea.is_correct = 1 THEN 1 ELSE 0 END') });

  const avgScore = toFixedNumber(
    attempts.reduce((sum, a) => sum + Number(a.score || 0), 0) / Math.max(attempts.length, 1),
    1
  );

  let topics = mapTopicRows(topicRows);
  if (!topics.length && attempts.length > 0) {
    topics = [{
      topic: 'Genel Matematik',
      totalQuestions: attempts.length,
      correctCount: Math.round((Number(avgScore || 0) / 100) * attempts.length),
      score: Math.round(Number(avgScore || 0))
    }];
  }

  const totalCorrect = topics.reduce((sum, t) => sum + Number(t.correctCount || 0), 0);
  const totalQuestions = topics.reduce((sum, t) => sum + Number(t.totalQuestions || 0), 0);
  const successRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : Math.round(avgScore);

  const overallStats = {
    totalExams: attempts.length,
    totalCorrect,
    successRate,
    avgScore: Math.round(avgScore)
  };

  const recentByDate = new Map();
  attempts.slice(0, 30).forEach((a) => {
    const d = a.created_at ? new Date(a.created_at) : new Date();
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    const item = recentByDate.get(key) || { date: key, exam_count: 0, score_sum: 0 };
    item.exam_count += 1;
    item.score_sum += Number(a.score || 0);
    recentByDate.set(key, item);
  });
  const recentActivity = [...recentByDate.values()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7)
    .map((r) => ({
      date: r.date,
      exam_count: r.exam_count,
      avg_score: toFixedNumber(r.score_sum / Math.max(r.exam_count, 1), 1)
    }));

  const weakTopics = topics.filter((t) => t.score < 65).map((t) => t.topic).slice(0, 5);
  const hasWeakTopics = weakTopics.length > 0;

  let recommendedQuery = knex('questions as q')
    .select('q.question_id', 'q.content_text', 'q.topic', 'q.difficulty_level', 'q.class_level', 'q.grade_level')
    .limit(15)
    .orderByRaw('RAND()');

  if (hasWeakTopics) {
    recommendedQuery = recommendedQuery.whereIn('q.topic', weakTopics);
  }

  let recommendedQuestions = await recommendedQuery;

  if (!recommendedQuestions.length && hasWeakTopics) {
    recommendedQuestions = await knex('questions as q')
      .select('q.question_id', 'q.content_text', 'q.topic', 'q.difficulty_level', 'q.class_level', 'q.grade_level')
      .limit(15)
      .orderByRaw('RAND()');
  }

  const recIds = recommendedQuestions.map((q) => q.question_id);
  const recOptions = recIds.length
    ? await knex('question_options')
      .whereIn('question_id', recIds)
      .select('option_id', 'question_id', 'option_text', 'is_correct', 'option_order')
      .orderBy('question_id', 'asc')
      .orderBy('option_order', 'asc')
      .orderBy('option_id', 'asc')
    : [];

  const optionsByQuestion = new Map();
  recOptions.forEach((opt) => {
    const key = Number(opt.question_id);
    const arr = optionsByQuestion.get(key) || [];
    arr.push({
      option_id: opt.option_id,
      option_text: opt.option_text,
      is_correct: Number(opt.is_correct) === 1 ? 1 : 0
    });
    optionsByQuestion.set(key, arr);
  });

  recommendedQuestions = recommendedQuestions.map((q) => ({
    ...q,
    options: optionsByQuestion.get(Number(q.question_id)) || []
  }));

  let dailyQuests = recommendedQuestions
    .filter((q) => Array.isArray(q.options) && q.options.length >= 2)
    .slice(0, 3)
    .map((q, idx) => ({
      quest_id: idx + 1,
      question_id: q.question_id,
      content_text: q.content_text,
      topic: q.topic,
      difficulty_level: q.difficulty_level,
      options: q.options
    }));

  if (!dailyQuests.length) {
    const fallbackDailyRows = await knex('questions as q')
      .join('question_options as qo', 'qo.question_id', 'q.question_id')
      .select('q.question_id', 'q.content_text', 'q.topic', 'q.difficulty_level')
      .groupBy('q.question_id', 'q.content_text', 'q.topic', 'q.difficulty_level')
      .havingRaw('COUNT(qo.option_id) >= 2')
      .limit(3)
      .orderByRaw('RAND()');

    const fallbackIds = fallbackDailyRows.map((q) => Number(q.question_id));
    const fallbackOptions = fallbackIds.length
      ? await knex('question_options')
        .whereIn('question_id', fallbackIds)
        .select('option_id', 'question_id', 'option_text', 'is_correct', 'option_order')
        .orderBy('question_id', 'asc')
        .orderBy('option_order', 'asc')
        .orderBy('option_id', 'asc')
      : [];

    const fallbackOptionsByQuestion = new Map();
    fallbackOptions.forEach((opt) => {
      const key = Number(opt.question_id);
      const arr = fallbackOptionsByQuestion.get(key) || [];
      arr.push({
        option_id: opt.option_id,
        option_text: opt.option_text,
        is_correct: Number(opt.is_correct) === 1 ? 1 : 0
      });
      fallbackOptionsByQuestion.set(key, arr);
    });

    dailyQuests = fallbackDailyRows
      .map((q, idx) => ({
        quest_id: idx + 1,
        question_id: q.question_id,
        content_text: q.content_text,
        topic: q.topic,
        difficulty_level: q.difficulty_level,
        options: fallbackOptionsByQuestion.get(Number(q.question_id)) || []
      }))
      .filter((q) => Array.isArray(q.options) && q.options.length >= 2);
  }

  const lastAttempt = attempts[0] || null;
  const lastAiAdvice = await generateAiAdvice({
    avgScore,
    weakTopics,
    topicSummary: topics,
    recentResults: attempts.slice(0, 5).map((a) => ({ examId: a.exam_id, score: Number(a.score || 0) }))
  });

  return {
    topics,
    recommendedQuestions: adaptiveOverview.recommendedQuestions?.length ? adaptiveOverview.recommendedQuestions : recommendedQuestions,
    lastAiAdvice,
    lastExam: lastAttempt
      ? {
        exam_id: lastAttempt.exam_id,
        title: lastAttempt.title || `Sinav #${lastAttempt.exam_id}`,
        score: Number(lastAttempt.score || 0),
        created_at: lastAttempt.created_at
      }
      : null,
    overallStats,
    recentActivity,
    dailyQuests,
    xpHeader: adaptiveOverview.xpHeader,
    continueLesson: adaptiveOverview.continueLesson,
    dueReviews: adaptiveOverview.dueReviews,
    weakSkills: adaptiveOverview.weakSkills
  };
}

async function list(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const payload = await buildLearningPathPayload(userId);
    res.json({ data: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function daily(req, res) {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const payload = await buildLearningPathPayload(userId);
    res.json({ data: payload.dailyQuests || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function completeDaily(req, res) {
  // Daily quest completion is currently client-side progression only.
  return res.json({ success: true });
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try { const item = await repo.findById(id); if (!item) return res.status(404).json({ error: 'not found' }); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); }
}
async function create(req, res) { try { const item = await repo.create(req.body); res.status(201).json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function update(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { const item = await repo.update(id, req.body); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function remove(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { await repo.remove(id); res.status(204).end(); } catch (err) { res.status(500).json({ error: err.message }); } }

module.exports = { list, getOne, create, update, remove, daily, completeDaily };
