const knex = require('../db/knex');
const questionsRepo = require('../repos/questionsRepo');
const { normalizeSkillKey, inferSkillMappings, pickPrimarySkill } = require('../lib/skillMapping');

let optionMetaCache = null;

async function getOptionMeta() {
  if (optionMetaCache) return optionMetaCache;
  const info = await knex('question_options').columnInfo();
  const cols = new Set(Object.keys(info || {}));
  optionMetaCache = {
    pk: cols.has('option_id') ? 'option_id' : 'id',
    order: cols.has('option_order') ? 'option_order' : 'sort_order'
  };
  return optionMetaCache;
}

function normalizeDifficultyBand(value) {
  const n = Number(value);
  if (Number.isFinite(n)) return Math.max(1, Math.min(3, Math.round(n)));
  const text = String(value || '').toLocaleLowerCase('tr-TR');
  if (text.includes('hard') || text.includes('zor')) return 3;
  if (text.includes('medium') || text.includes('orta')) return 2;
  return 1;
}

function masteryDelta({ correct, difficultyBand, hintUsed, attemptNo }) {
  const correctMap = { 1: 2, 2: 3, 3: 4 };
  const wrongMap = { 1: -3, 2: -2, 3: -1 };
  let delta = correct ? (correctMap[difficultyBand] || 2) : (wrongMap[difficultyBand] || -2);
  if (hintUsed) delta -= 1;
  if (correct && Number(attemptNo || 1) > 1) delta = Math.ceil(delta / 2);
  return delta;
}

function computeReviewDue(masteryScore) {
  const now = new Date();
  const days = masteryScore < 35 ? 1 : masteryScore < 60 ? 3 : masteryScore < 80 ? 7 : 14;
  now.setDate(now.getDate() + days);
  return now;
}

async function ensureStreakRow(userId) {
  let row = await knex('learner_streaks').where({ user_id: userId }).first();
  if (!row) {
    await knex('learner_streaks').insert({ user_id: userId, daily_streak: 0, longest_streak: 0, xp_total: 0, current_level: 1 });
    row = await knex('learner_streaks').where({ user_id: userId }).first();
  }
  return row;
}

async function updateStreakAndXp(userId, xpGain) {
  const row = await ensureStreakRow(userId);
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const lastActive = row.last_active_date ? new Date(row.last_active_date) : null;
  const lastKey = lastActive ? lastActive.toISOString().slice(0, 10) : null;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  let dailyStreak = Number(row.daily_streak || 0);
  if (lastKey !== todayKey) {
    if (lastKey === yesterdayKey) dailyStreak += 1;
    else dailyStreak = 1;
  }

  const xpTotal = Number(row.xp_total || 0) + Number(xpGain || 0);
  const currentLevel = Math.max(1, Math.floor(xpTotal / 100) + 1);
  const longestStreak = Math.max(Number(row.longest_streak || 0), dailyStreak);

  await knex('learner_streaks')
    .where({ user_id: userId })
    .update({
      daily_streak: dailyStreak,
      longest_streak: longestStreak,
      xp_total: xpTotal,
      current_level: currentLevel,
      last_active_date: todayKey,
      updated_at: knex.fn.now()
    });

  return { daily_streak: dailyStreak, longest_streak: longestStreak, xp_total: xpTotal, current_level: currentLevel };
}

async function getRecentQuestionIds(userId, limit = 20) {
  const rows = await knex('learner_activity_events')
    .where({ user_id: userId })
    .whereNotNull('question_id')
    .orderBy('created_at', 'desc')
    .limit(limit)
    .select('question_id');
  return rows.map((row) => Number(row.question_id)).filter(Boolean);
}

async function getWeakTopicsFromHistory(userId) {
  const attemptTable = await knex.schema.hasTable('student_exam_attempts') ? 'student_exam_attempts' : (await knex.schema.hasTable('user_exam_attempts') ? 'user_exam_attempts' : null);
  if (!attemptTable) return [];

  const attemptInfo = await knex(attemptTable).columnInfo();
  const attemptCols = new Set(Object.keys(attemptInfo || {}));
  const actorCol = attemptCols.has('user_id') ? 'user_id' : (attemptCols.has('student_id') ? 'student_id' : null);
  const pkCol = attemptCols.has('attempt_id') ? 'attempt_id' : 'id';
  if (!actorCol) return [];

  const attemptIds = (await knex(attemptTable).where(actorCol, userId).limit(100).select(pkCol))
    .map((row) => Number(row[pkCol]))
    .filter(Boolean);
  if (!attemptIds.length) return [];

  const rows = await knex('exam_answers as ea')
    .join('questions as q', 'q.question_id', 'ea.question_id')
    .whereIn('ea.attempt_id', attemptIds)
    .groupBy('q.topic')
    .select('q.topic')
    .count({ total: '*' })
    .sum({ correct_count: knex.raw('CASE WHEN ea.is_correct = 1 THEN 1 ELSE 0 END') });

  return rows
    .map((row) => ({
      topic: row.topic || 'Genel Matematik',
      score: Number(row.total || 0) > 0 ? Math.round((Number(row.correct_count || 0) / Number(row.total || 0)) * 100) : 0
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((row) => row.topic);
}

async function getTodayProgress(userId, source = 'daily_quest') {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const rows = await knex('learner_activity_events')
    .where({ user_id: userId, source })
    .where('created_at', '>=', start)
    .where('created_at', '<', end)
    .select('is_correct');

  return {
    completedCount: rows.length,
    correctCount: rows.filter((row) => Number(row.is_correct) === 1).length,
    targetCount: 10
  };
}

async function getQuestionOptions(questionIds) {
  if (!questionIds.length) return new Map();
  const meta = await getOptionMeta();
  const rows = await knex('question_options')
    .whereIn('question_id', questionIds)
    .select(meta.pk, 'question_id', 'option_text', 'is_correct', meta.order)
    .orderBy('question_id', 'asc')
    .orderBy(meta.order, 'asc');

  const map = new Map();
  rows.forEach((row) => {
    const key = Number(row.question_id);
    const list = map.get(key) || [];
    list.push({
      option_id: row[meta.pk],
      option_text: row.option_text,
      is_correct: Number(row.is_correct) === 1 ? 1 : 0
    });
    map.set(key, list);
  });
  return map;
}

async function getQuestionSkillMappings(questionId) {
  return knex('question_skill_map')
    .where({ question_id: questionId })
    .orderBy('weight', 'desc')
    .select('skill_key', 'weight');
}

async function ensureQuestionSkillMappings(question) {
  const existing = await getQuestionSkillMappings(question.question_id);
  if (existing.length) return existing;
  const inferred = inferSkillMappings(question);
  for (const item of inferred) {
    await knex('question_skill_map').insert({
      question_id: question.question_id,
      skill_key: item.skill_key,
      weight: item.weight || 1,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    });
  }
  return inferred;
}

async function buildQuestionQuery({ topics = [], skillKeys = [], excludeIds = [], difficultyBand = null }) {
  const query = knex('questions')
    .select('question_id', 'content_text', 'topic', 'difficulty_level', 'hint', 'topic_id')
    .whereNotNull('content_text')
    .andWhereRaw('TRIM(content_text) <> ""')
    .whereIn('question_id', knex('question_options').select('question_id').groupBy('question_id').havingRaw('COUNT(*) >= 2').havingRaw('SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) = 1'));

  if (skillKeys.length) {
    query.whereIn('question_id', knex('question_skill_map').select('question_id').whereIn('skill_key', skillKeys));
  }

  if (topics.length) {
    query.andWhere((qb) => {
      topics.forEach((topic, index) => {
        const method = index === 0 ? 'where' : 'orWhere';
        qb[method]('topic', 'like', `%${topic}%`);
      });
    });
  }

  if (difficultyBand != null) {
    query.andWhere((qb) => {
      qb.where('difficulty_level', difficultyBand)
        .orWhere('difficulty_level', difficultyBand === 1 ? 'easy' : difficultyBand === 2 ? 'medium' : 'hard');
    });
  }

  if (excludeIds.length) {
    query.whereNotIn('question_id', excludeIds);
  }

  return query.orderByRaw('RAND()');
}

async function getCandidateTopics(userId) {
  const dueStates = await knex('learner_skill_state')
    .where({ user_id: userId })
    .whereNotNull('review_due_at')
    .where('review_due_at', '<=', knex.fn.now())
    .orderBy('review_due_at', 'asc')
    .orderBy('mastery_score', 'asc')
    .limit(5)
    .select('topic_name', 'current_difficulty_band', 'skill_key', 'mastery_score');

  if (dueStates.length) {
    return {
      reason: 'due_review',
      skillKeys: dueStates.map((row) => row.skill_key).filter(Boolean),
      topics: dueStates.map((row) => row.topic_name).filter(Boolean),
      difficultyBand: Number(dueStates[0].current_difficulty_band || 1)
    };
  }

  const weakStates = await knex('learner_skill_state')
    .where({ user_id: userId })
    .orderBy('mastery_score', 'asc')
    .limit(5)
    .select('topic_name', 'current_difficulty_band');

  if (weakStates.length) {
    return {
      reason: 'weak_skill',
      skillKeys: weakStates.map((row) => row.skill_key).filter(Boolean),
      topics: weakStates.map((row) => row.topic_name).filter(Boolean),
      difficultyBand: Number(weakStates[0].current_difficulty_band || 1)
    };
  }

  const weakTopics = await getWeakTopicsFromHistory(userId);
  return {
    reason: weakTopics.length ? 'weak_topic_history' : 'exploration',
    skillKeys: [],
    topics: weakTopics,
    difficultyBand: 1
  };
}

async function getNextQuestions(userId, limit = 1) {
  const selection = await getCandidateTopics(userId);
  const recentQuestionIds = await getRecentQuestionIds(userId, 25);
  let rows = await (await buildQuestionQuery({ skillKeys: selection.skillKeys || [], topics: selection.topics, excludeIds: recentQuestionIds, difficultyBand: selection.difficultyBand })).limit(limit);
  if (!rows.length) {
    rows = await (await buildQuestionQuery({ skillKeys: selection.skillKeys || [], topics: selection.topics, excludeIds: [], difficultyBand: null })).limit(limit);
  }
  if (!rows.length) return { items: [], reason: selection.reason };
  const optionMap = await getQuestionOptions(rows.map((row) => Number(row.question_id)));
  const mappedRows = [];
  for (const row of rows) {
    const skills = await ensureQuestionSkillMappings(row);
    const primarySkill = pickPrimarySkill(skills, row.topic);
    mappedRows.push({ row, primarySkill });
  }
  return {
    reason: selection.reason,
    items: mappedRows.map(({ row, primarySkill }) => ({
      ...row,
      difficulty_band: normalizeDifficultyBand(row.difficulty_level),
      skill_key: primarySkill.skill_key,
      skill_label: primarySkill.display_name || row.topic || 'Genel Matematik',
      selection_reason: selection.reason,
      options: optionMap.get(Number(row.question_id)) || []
    }))
  };
}

async function updateSkillState({ userId, question, isCorrect, hintUsed, attemptNo }) {
  const skills = await ensureQuestionSkillMappings(question);
  const primarySkill = pickPrimarySkill(skills, question.topic);
  const skillKey = primarySkill.skill_key;
  const difficultyBand = normalizeDifficultyBand(question.difficulty_level);
  const existing = await knex('learner_skill_state').where({ user_id: userId, skill_key: skillKey }).first();
  const delta = masteryDelta({ correct: isCorrect, difficultyBand, hintUsed, attemptNo });

  const currentMastery = Number(existing?.mastery_score || 0);
  const masteryScore = Math.max(0, Math.min(100, currentMastery + delta));
  const confidenceBase = Number(existing?.confidence_score || 0);
  const confidenceScore = Math.max(0, Math.min(100, confidenceBase + (isCorrect ? 2 : -1)));
  const correctCount = Number(existing?.correct_count || 0) + (isCorrect ? 1 : 0);
  const wrongCount = Number(existing?.wrong_count || 0) + (isCorrect ? 0 : 1);
  const streakCorrect = isCorrect ? Number(existing?.streak_correct || 0) + 1 : 0;
  const streakWrong = isCorrect ? 0 : Number(existing?.streak_wrong || 0) + 1;
  let currentDifficultyBand = Number(existing?.current_difficulty_band || difficultyBand || 1);
  if (streakCorrect >= 3) currentDifficultyBand = Math.min(3, currentDifficultyBand + 1);
  if (streakWrong >= 2) currentDifficultyBand = Math.max(1, currentDifficultyBand - 1);
  const payload = {
    user_id: userId,
    skill_key: skillKey,
    topic_name: primarySkill.display_name || question.topic || 'Genel Matematik',
    topic_id: question.topic_id || null,
    mastery_score: masteryScore,
    confidence_score: confidenceScore,
    last_seen_at: knex.fn.now(),
    last_correct_at: isCorrect ? knex.fn.now() : existing?.last_correct_at || null,
    correct_count: correctCount,
    wrong_count: wrongCount,
    streak_correct: streakCorrect,
    streak_wrong: streakWrong,
    review_due_at: computeReviewDue(masteryScore),
    current_difficulty_band: currentDifficultyBand,
    updated_at: knex.fn.now()
  };

  if (existing) {
    await knex('learner_skill_state').where({ user_id: userId, skill_key: skillKey }).update(payload);
  } else {
    await knex('learner_skill_state').insert({ ...payload, created_at: knex.fn.now() });
  }

  return {
    skill_key: skillKey,
    topic_name: payload.topic_name,
    mastery_score: masteryScore,
    confidence_score: confidenceScore,
    current_difficulty_band: currentDifficultyBand,
    review_due_at: payload.review_due_at
  };
}

async function logActivityEvent({ userId, question, isCorrect, selectedOptionId, timeSpentMs, hintUsed, attemptNo, source }) {
  const skills = await ensureQuestionSkillMappings(question);
  const primarySkill = pickPrimarySkill(skills, question.topic);
  await knex('learner_activity_events').insert({
    user_id: userId,
    activity_type: 'mcq',
    question_id: question.question_id,
    skill_key: primarySkill.skill_key,
    topic_id: question.topic_id || null,
    topic_name: primarySkill.display_name || question.topic || 'Genel Matematik',
    is_correct: isCorrect ? 1 : 0,
    time_spent_ms: Number(timeSpentMs || 0) || null,
    hint_used: hintUsed ? 1 : 0,
    attempt_no: Number(attemptNo || 1) || 1,
    difficulty_level: normalizeDifficultyBand(question.difficulty_level),
    source: source || 'daily_quest',
    created_at: knex.fn.now(),
    updated_at: knex.fn.now()
  });
}

async function resolveAnswer(questionId, selectedOptionId) {
  const meta = await getOptionMeta();
  const option = await knex('question_options')
    .where({ question_id: questionId, [meta.pk]: selectedOptionId })
    .first('is_correct');
  return Number(option?.is_correct) === 1;
}

async function getNextAction(userId) {
  const next = await getNextQuestions(userId, 1);
  const streak = await ensureStreakRow(userId);
  const progress = await getTodayProgress(userId);
  return {
    item: next.items[0] || null,
    selection_reason: next.reason,
    streak: streak,
    progress
  };
}

async function getDueReviews(userId, limit = 5) {
  const rows = await knex('learner_skill_state')
    .where({ user_id: userId })
    .whereNotNull('review_due_at')
    .where('review_due_at', '<=', knex.fn.now())
    .orderBy('review_due_at', 'asc')
    .orderBy('mastery_score', 'asc')
    .limit(limit)
    .select('skill_key', 'topic_name', 'mastery_score', 'confidence_score', 'review_due_at', 'current_difficulty_band');
  return rows.map((row) => ({
    skill_key: row.skill_key,
    skill_label: row.topic_name,
    mastery_score: Number(row.mastery_score || 0),
    confidence_score: Number(row.confidence_score || 0),
    review_due_at: row.review_due_at,
    current_difficulty_band: Number(row.current_difficulty_band || 1)
  }));
}

async function getWeakSkills(userId, limit = 6) {
  const rows = await knex('learner_skill_state')
    .where({ user_id: userId })
    .orderBy('mastery_score', 'asc')
    .limit(limit)
    .select('skill_key', 'topic_name', 'mastery_score', 'confidence_score', 'current_difficulty_band', 'correct_count', 'wrong_count');
  return rows.map((row) => ({
    skill_key: row.skill_key,
    skill_label: row.topic_name,
    mastery_score: Number(row.mastery_score || 0),
    confidence_score: Number(row.confidence_score || 0),
    current_difficulty_band: Number(row.current_difficulty_band || 1),
    correct_count: Number(row.correct_count || 0),
    wrong_count: Number(row.wrong_count || 0)
  }));
}

async function getLearningOverview(userId) {
  const continueLesson = await getNextAction(userId);
  const dueReviews = await getDueReviews(userId, 5);
  const weakSkills = await getWeakSkills(userId, 6);
  return {
    xpHeader: {
      currentLevel: Number(continueLesson.streak?.current_level || 1),
      xpTotal: Number(continueLesson.streak?.xp_total || 0),
      dailyStreak: Number(continueLesson.streak?.daily_streak || 0),
      dailyCompleted: Number(continueLesson.progress?.completedCount || 0),
      dailyTarget: Number(continueLesson.progress?.targetCount || 10)
    },
    continueLesson,
    dueReviews,
    weakSkills,
    recommendedQuestions: (await getNextQuestions(userId, 6)).items
  };
}

async function submitAnswer(userId, payload) {
  const questionId = Number(payload.questionId || payload.question_id);
  const selectedOptionId = Number(payload.selectedOptionId || payload.selected_option_id);
  if (!questionId || !selectedOptionId) {
    throw new Error('questionId and selectedOptionId required');
  }

  const question = await questionsRepo.findById(questionId);
  if (!question) throw new Error('question not found');
  const isCorrect = await resolveAnswer(questionId, selectedOptionId);
  const hintUsed = Boolean(payload.hintUsed || payload.hint_used);
  const attemptNo = Number(payload.attemptNo || payload.attempt_no || 1) || 1;
  await logActivityEvent({
    userId,
    question,
    isCorrect,
    selectedOptionId,
    timeSpentMs: payload.timeSpentMs || payload.time_spent_ms,
    hintUsed,
    attemptNo,
    source: payload.source || 'daily_quest'
  });

  const skillState = await updateSkillState({
    userId,
    question,
    isCorrect,
    hintUsed,
    attemptNo
  });

  const xpGain = Math.max(0, masteryDelta({ correct: isCorrect, difficultyBand: normalizeDifficultyBand(question.difficulty_level), hintUsed, attemptNo }) + 2);
  const streak = await updateStreakAndXp(userId, xpGain);
  const progress = await getTodayProgress(userId, payload.source || 'daily_quest');
  const next = await getNextQuestions(userId, 1);

  return {
    isCorrect,
    xp_gain: xpGain,
    skill_state: skillState,
    streak,
    progress,
    next_item: next.items[0] || null,
    selection_reason: next.reason
  };
}

module.exports = {
  getNextAction,
  submitAnswer,
  getTodayProgress,
  getNextQuestions,
  getLearningOverview,
  getDueReviews,
  getWeakSkills
};