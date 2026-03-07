const knex = require('../db/knex');

const ASSESSMENT_TABLE = 'teacher_student_assessments';
let attemptsSourceCache = null;

function toRoleName(user) {
  const raw = String(user?.role || user?.dbUser?.role || '').toLowerCase();
  if (raw) return raw;
  const roleId = Number(user?.role_id || user?.dbUser?.role_id || 0);
  if (roleId === 1) return 'admin';
  if (roleId === 2) return 'teacher';
  if (roleId === 3) return 'student';
  return '';
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function normalizeAssessmentRow(row) {
  if (!row) return null;
  return {
    ...row,
    weak_topics: parseJsonArray(row.weak_topics_json),
    recommended_actions: parseJsonArray(row.recommended_actions_json)
  };
}

async function getAttemptsSource() {
  if (attemptsSourceCache) return attemptsSourceCache;

  const hasStudentAttempts = await knex.schema.hasTable('student_exam_attempts');
  if (hasStudentAttempts) {
    const info = await knex('student_exam_attempts').columnInfo();
    const cols = new Set(Object.keys(info || {}));
    attemptsSourceCache = {
      table: 'student_exam_attempts',
      pk: cols.has('attempt_id') ? 'attempt_id' : 'id',
      actor: cols.has('user_id') ? 'user_id' : 'student_id',
      percentage: cols.has('percentage') ? 'percentage' : (cols.has('percentage_score') ? 'percentage_score' : null),
      points: cols.has('total_points') ? 'total_points' : (cols.has('total_score') ? 'total_score' : null),
      maxPoints: cols.has('max_points') ? 'max_points' : null,
      createdAt: cols.has('created_at') ? 'created_at' : (cols.has('submitted_at') ? 'submitted_at' : 'updated_at')
    };
    return attemptsSourceCache;
  }

  const hasUserAttempts = await knex.schema.hasTable('user_exam_attempts');
  if (hasUserAttempts) {
    attemptsSourceCache = {
      table: 'user_exam_attempts',
      pk: 'attempt_id',
      actor: 'user_id',
      percentage: 'percentage',
      points: 'total_points',
      maxPoints: 'max_points',
      createdAt: 'created_at'
    };
    return attemptsSourceCache;
  }

  attemptsSourceCache = {
    table: null,
    pk: null,
    actor: null,
    percentage: null,
    points: null,
    maxPoints: null,
    createdAt: null
  };
  return attemptsSourceCache;
}

async function ensureAssessmentTable() {
  const has = await knex.schema.hasTable(ASSESSMENT_TABLE);
  if (has) return;

  await knex.schema.createTable(ASSESSMENT_TABLE, (table) => {
    table.increments('assessment_id').primary();
    table.integer('teacher_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('level_tag', 20).nullable();
    table.decimal('confidence_score', 5, 2).nullable();
    table.text('weak_topics_json').nullable();
    table.text('recommended_actions_json').nullable();
    table.text('analysis_text').nullable();
    table.text('notes').nullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['teacher_id', 'user_id']);
    table.index(['user_id']);
    table.index(['is_active']);
  });
}

async function resolveTeacherStudentIds(teacherId) {
  const ids = new Set();

  const attempts = await getAttemptsSource();

  if (attempts.table && attempts.actor) {
    const fromAttempts = await knex(`${attempts.table} as at`)
      .join('exams as e', 'e.exam_id', 'at.exam_id')
      .where('e.creator_id', teacherId)
      .distinct(knex.raw(`at.${attempts.actor} as user_id`));

    fromAttempts.forEach((row) => ids.add(Number(row.user_id)));
  }

  const hasEnrollments = await knex.schema.hasTable('course_enrollments');
  if (hasEnrollments) {
    const fromEnrollments = await knex('course_enrollments')
      .where('assigned_by', teacherId)
      .distinct('user_id');

    fromEnrollments.forEach((row) => ids.add(Number(row.user_id)));
  }

  const hasAssessments = await knex.schema.hasTable(ASSESSMENT_TABLE);
  if (hasAssessments) {
    const fromAssessments = await knex(ASSESSMENT_TABLE)
      .where({ teacher_id: teacherId, is_active: 1 })
      .distinct('user_id');
    fromAssessments.forEach((row) => ids.add(Number(row.user_id)));
  }

  // Fallback: if teacher has no direct mapping yet, show students who solved at least one exam.
  if (!ids.size && attempts.table && attempts.actor) {
    const fallbackFromAttempts = await knex(`${attempts.table} as at`)
      .distinct(knex.raw(`at.${attempts.actor} as user_id`));
    fallbackFromAttempts.forEach((row) => ids.add(Number(row.user_id)));
  }

  return [...ids].filter((x) => Number.isInteger(x) && x > 0);
}

async function classStats({ limit = 200, teacherId = null } = {}) {
  const attempts = await getAttemptsSource();
  const attemptsSubQuery = attempts.table && attempts.actor
    ? knex(`${attempts.table}`)
      .select(`${attempts.actor} as user_id`)
      .count({ exams_count: '*' })
      .modify((qb) => {
        if (attempts.percentage) qb.avg({ avg_percentage: attempts.percentage });
      })
      .groupBy(attempts.actor)
    : knex.select(knex.raw('NULL as user_id, 0 as exams_count, 0 as avg_percentage')).whereRaw('1=0');

  let query = knex('users as u')
    .leftJoin('analytics as a', 'a.user_id', 'u.user_id')
    .leftJoin(
      attemptsSubQuery.as('att'),
      'att.user_id',
      'u.user_id'
    )
    .select(
      'u.user_id',
      'u.full_name',
      'u.email',
      knex.raw('COALESCE(a.exam_completed, att.exams_count, 0) as total_exams'),
      knex.raw('COALESCE(a.average_score, att.avg_percentage, 0) as avg_score')
    )
    .where('u.role_id', 3)
    .where('u.is_active', 1)
    .orderBy('avg_score', 'desc')
    .limit(limit);

  if (teacherId) {
    const studentIds = await resolveTeacherStudentIds(teacherId);
    if (!studentIds.length) return [];
    query = query.whereIn('u.user_id', studentIds);
  }

  return query;
}

async function studentDetailed(userId, { teacherId = null } = {}) {
  const attempts = await getAttemptsSource();

  if (teacherId) {
    const studentIds = await resolveTeacherStudentIds(teacherId);
    if (!studentIds.includes(Number(userId))) {
      const err = new Error('access denied');
      err.code = 'ACCESS_DENIED';
      throw err;
    }
  }

  const profile = await knex('users')
    .where({ user_id: userId, role_id: 3 })
    .first();

  if (!profile) return null;

  const statsRow = await knex('analytics').where({ user_id: userId }).first();
  let attemptAgg = { total_exams: 0, total_points: 0, avg_percentage: 0 };
  if (attempts.table && attempts.actor) {
    attemptAgg = await knex(attempts.table)
      .where(attempts.actor, userId)
      .count({ total_exams: '*' })
      .modify((qb) => {
        if (attempts.points) qb.sum({ total_points: attempts.points });
        if (attempts.percentage) qb.avg({ avg_percentage: attempts.percentage });
      })
      .first();
  }

  const totalExams = Number(statsRow?.exam_completed ?? attemptAgg?.total_exams ?? 0);
  const avgScore = Number(statsRow?.average_score ?? attemptAgg?.avg_percentage ?? 0);
  const totalCorrect = Number(statsRow?.questions_answered ?? 0);
  const successRate = Number(statsRow?.accuracy_percentage ?? avgScore ?? 0);

  const stats = {
    avgScore: Number(avgScore.toFixed ? avgScore.toFixed(2) : avgScore),
    totalExams,
    totalCorrect,
    successRate: Number(successRate.toFixed ? successRate.toFixed(2) : successRate)
  };

  let historyRows = [];
  if (attempts.table && attempts.actor) {
    const createdCol = attempts.createdAt || 'created_at';
    historyRows = await knex(`${attempts.table} as at`)
      .leftJoin('exams as e', 'e.exam_id', 'at.exam_id')
      .where(`at.${attempts.actor}`, userId)
      .select(
        knex.raw(`at.${attempts.pk} as attempt_id`),
        'at.exam_id',
        attempts.percentage ? knex.raw(`at.${attempts.percentage} as percentage`) : knex.raw('0 as percentage'),
        attempts.points ? knex.raw(`at.${attempts.points} as total_points`) : knex.raw('0 as total_points'),
        attempts.maxPoints ? knex.raw(`at.${attempts.maxPoints} as max_points`) : knex.raw('e.total_questions as max_points'),
        knex.raw(`at.${createdCol} as created_at`),
        'e.title'
      )
      .orderBy(`at.${createdCol}`, 'asc')
      .limit(50);
  }

  const history = historyRows.map((r) => ({
    attemptId: r.attempt_id,
    examId: r.exam_id,
    examName: r.title || `Sinav #${r.exam_id}`,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR') : '-',
    score: Number(r.percentage || 0)
  }));

  const recentActivity = [...historyRows]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8)
    .map((r) => {
      const maxPoints = Number(r.max_points || 0);
      const totalPoints = Number(r.total_points || 0);
      const success = maxPoints > 0 ? Number(((totalPoints / maxPoints) * 100).toFixed(2)) : Number(r.percentage || 0);
      return {
        attemptId: r.attempt_id,
        examName: r.title || `Sinav #${r.exam_id}`,
        date: r.created_at ? new Date(r.created_at).toLocaleDateString('tr-TR') : '-',
        score: Number(r.percentage || 0),
        totalQuestions: maxPoints,
        correctAnswers: totalPoints,
        successRate: success
      };
    });

  let topicRows = [];
  if (attempts.table && attempts.actor && attempts.pk) {
    topicRows = await knex('exam_answers as ea')
      .join('questions as q', 'q.question_id', 'ea.question_id')
      .join(`${attempts.table} as at`, `at.${attempts.pk}`, 'ea.attempt_id')
      .where(`at.${attempts.actor}`, userId)
      .groupBy('q.topic')
      .select('q.topic')
      .count({ total: '*' })
      .sum({ correct_count: knex.raw('CASE WHEN ea.is_correct = 1 THEN 1 ELSE 0 END') });
  }

  const topics = topicRows
    .map((row) => {
      const total = Number(row.total || 0);
      const correct = Number(row.correct_count || 0);
      const score = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;
      return {
        name: row.topic || 'Genel',
        score,
        total,
        correct
      };
    })
    .sort((a, b) => a.score - b.score);

  let latestAssessment = null;
  try {
    await ensureAssessmentTable();
    let q = knex(ASSESSMENT_TABLE)
      .where({ user_id: userId, is_active: 1 })
      .orderBy('updated_at', 'desc');
    if (teacherId) q = q.andWhere('teacher_id', teacherId);
    const row = await q.first();
    latestAssessment = normalizeAssessmentRow(row);
  } catch (_) {
    latestAssessment = null;
  }

  return { profile, stats, history, topics, recentActivity, latestAssessment };
}

async function listAssessments({ teacherId, studentId = null, page = 1, limit = 20 } = {}) {
  await ensureAssessmentTable();
  const offset = (page - 1) * limit;

  let query = knex(`${ASSESSMENT_TABLE} as tsa`)
    .leftJoin('users as u', 'u.user_id', 'tsa.user_id')
    .where('tsa.teacher_id', teacherId)
    .andWhere('tsa.is_active', 1);

  if (studentId) query = query.andWhere('tsa.user_id', studentId);

  const [{ count } = { count: 0 }] = await query.clone().count({ count: '*' });
  const rows = await query
    .clone()
    .select('tsa.*', 'u.full_name', 'u.email')
    .orderBy('tsa.updated_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    rows: rows.map(normalizeAssessmentRow),
    total: Number(count || 0)
  };
}

async function getAssessmentById({ assessmentId, teacherId }) {
  await ensureAssessmentTable();
  const row = await knex(ASSESSMENT_TABLE)
    .where({ assessment_id: assessmentId, teacher_id: teacherId, is_active: 1 })
    .first();
  return normalizeAssessmentRow(row);
}

async function upsertAssessment({ teacherId, userId, payload }) {
  await ensureAssessmentTable();

  const levelTag = String(payload?.level_tag || payload?.levelTag || '').trim() || null;
  const confidenceRaw = Number(payload?.confidence_score ?? payload?.confidenceScore ?? null);
  const confidenceScore = Number.isFinite(confidenceRaw) ? confidenceRaw : null;
  const weakTopics = Array.isArray(payload?.weak_topics || payload?.weakTopics)
    ? (payload.weak_topics || payload.weakTopics)
    : [];
  const recommendedActions = Array.isArray(payload?.recommended_actions || payload?.recommendedActions)
    ? (payload.recommended_actions || payload.recommendedActions)
    : [];

  const base = {
    level_tag: levelTag,
    confidence_score: confidenceScore,
    weak_topics_json: JSON.stringify(weakTopics),
    recommended_actions_json: JSON.stringify(recommendedActions),
    analysis_text: payload?.analysis_text || payload?.analysisText || null,
    notes: payload?.notes || null,
    updated_at: new Date()
  };

  const existing = await knex(ASSESSMENT_TABLE)
    .where({ teacher_id: teacherId, user_id: userId, is_active: 1 })
    .orderBy('updated_at', 'desc')
    .first();

  if (existing) {
    await knex(ASSESSMENT_TABLE)
      .where({ assessment_id: existing.assessment_id })
      .update(base);
    const updated = await knex(ASSESSMENT_TABLE)
      .where({ assessment_id: existing.assessment_id })
      .first();
    return normalizeAssessmentRow(updated);
  }

  const insertPayload = {
    teacher_id: teacherId,
    user_id: userId,
    ...base,
    is_active: 1,
    created_at: new Date()
  };

  const [assessmentId] = await knex(ASSESSMENT_TABLE).insert(insertPayload);
  const created = await knex(ASSESSMENT_TABLE).where({ assessment_id: assessmentId }).first();
  return normalizeAssessmentRow(created);
}

async function updateAssessmentById({ assessmentId, teacherId, payload }) {
  await ensureAssessmentTable();

  const existing = await knex(ASSESSMENT_TABLE)
    .where({ assessment_id: assessmentId, teacher_id: teacherId, is_active: 1 })
    .first();
  if (!existing) return null;

  const levelTag = String(payload?.level_tag || payload?.levelTag || existing.level_tag || '').trim() || null;
  const confidenceRaw = Number(payload?.confidence_score ?? payload?.confidenceScore ?? existing.confidence_score ?? null);
  const confidenceScore = Number.isFinite(confidenceRaw) ? confidenceRaw : null;
  const weakTopics = Array.isArray(payload?.weak_topics || payload?.weakTopics)
    ? (payload.weak_topics || payload.weakTopics)
    : parseJsonArray(existing.weak_topics_json);
  const recommendedActions = Array.isArray(payload?.recommended_actions || payload?.recommendedActions)
    ? (payload.recommended_actions || payload.recommendedActions)
    : parseJsonArray(existing.recommended_actions_json);

  const patch = {
    level_tag: levelTag,
    confidence_score: confidenceScore,
    weak_topics_json: JSON.stringify(weakTopics),
    recommended_actions_json: JSON.stringify(recommendedActions),
    analysis_text: payload?.analysis_text || payload?.analysisText || existing.analysis_text || null,
    notes: typeof payload?.notes !== 'undefined' ? payload.notes : existing.notes,
    updated_at: new Date()
  };

  await knex(ASSESSMENT_TABLE)
    .where({ assessment_id: assessmentId, teacher_id: teacherId })
    .update(patch);

  const updated = await knex(ASSESSMENT_TABLE).where({ assessment_id: assessmentId }).first();
  return normalizeAssessmentRow(updated);
}

async function deleteAssessment({ assessmentId, teacherId }) {
  await ensureAssessmentTable();
  const affected = await knex(ASSESSMENT_TABLE)
    .where({ assessment_id: assessmentId, teacher_id: teacherId, is_active: 1 })
    .update({ is_active: 0, updated_at: new Date() });
  return Number(affected || 0);
}

async function exportAssessments({ teacherId, format = 'json' } = {}) {
  await ensureAssessmentTable();

  const rows = await knex(`${ASSESSMENT_TABLE} as tsa`)
    .leftJoin('users as u', 'u.user_id', 'tsa.user_id')
    .where('tsa.teacher_id', teacherId)
    .andWhere('tsa.is_active', 1)
    .select(
      'tsa.assessment_id',
      'tsa.user_id',
      'u.full_name',
      'u.email',
      'tsa.level_tag',
      'tsa.confidence_score',
      'tsa.weak_topics_json',
      'tsa.recommended_actions_json',
      'tsa.analysis_text',
      'tsa.notes',
      'tsa.updated_at',
      'tsa.created_at'
    )
    .orderBy('tsa.updated_at', 'desc');

  const normalized = rows.map(normalizeAssessmentRow);
  if (format !== 'csv') {
    return { format: 'json', rows: normalized };
  }

  const header = [
    'assessment_id',
    'user_id',
    'full_name',
    'email',
    'level_tag',
    'confidence_score',
    'weak_topics',
    'recommended_actions',
    'analysis_text',
    'notes',
    'updated_at',
    'created_at'
  ];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = normalized.map((row) => ([
    row.assessment_id,
    row.user_id,
    row.full_name,
    row.email,
    row.level_tag,
    row.confidence_score,
    (row.weak_topics || []).join(' | '),
    (row.recommended_actions || []).join(' | '),
    row.analysis_text,
    row.notes,
    row.updated_at,
    row.created_at
  ].map(esc).join(',')));

  return {
    format: 'csv',
    content: [header.join(','), ...lines].join('\n')
  };
}

module.exports = {
  toRoleName,
  classStats,
  studentDetailed,
  listAssessments,
  getAssessmentById,
  upsertAssessment,
  updateAssessmentById,
  deleteAssessment,
  exportAssessments
};
