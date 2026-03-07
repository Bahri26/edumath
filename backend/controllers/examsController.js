const repo = require('../repos/examsRepo');
const questionsRepo = require('../repos/questionsRepo');
const examQuestionsRepo = require('../repos/exam_questionsRepo');
const studentExamAttemptsRepo = require('../repos/student_exam_attemptsRepo');
const examAnswersRepo = require('../repos/exam_answersRepo');
const knex = require('../db/knex');

const DEFAULT_CEFR_THRESHOLDS = {
  a2Min: 20,
  b1Min: 35,
  b2Min: 50,
  c1Min: 65,
  c2Min: 80
};

let studentAttemptColumnsCache = null;

async function getStudentAttemptColumns() {
  if (studentAttemptColumnsCache) return studentAttemptColumnsCache;
  const info = await knex('student_exam_attempts').columnInfo();
  studentAttemptColumnsCache = new Set(Object.keys(info || {}));
  return studentAttemptColumnsCache;
}

async function getStudentAttemptColumnMap() {
  const cols = await getStudentAttemptColumns();
  return {
    attemptId: cols.has('attempt_id') ? 'attempt_id' : 'id',
    percentage: cols.has('percentage') ? 'percentage' : (cols.has('percentage_score') ? 'percentage_score' : null),
    actorId: cols.has('user_id') ? 'user_id' : 'student_id'
  };
}

function normalizeCefrThresholds(raw) {
  const source = raw || {};
  const thresholds = {
    a2Min: Number(source.a2Min ?? DEFAULT_CEFR_THRESHOLDS.a2Min),
    b1Min: Number(source.b1Min ?? DEFAULT_CEFR_THRESHOLDS.b1Min),
    b2Min: Number(source.b2Min ?? DEFAULT_CEFR_THRESHOLDS.b2Min),
    c1Min: Number(source.c1Min ?? DEFAULT_CEFR_THRESHOLDS.c1Min),
    c2Min: Number(source.c2Min ?? DEFAULT_CEFR_THRESHOLDS.c2Min)
  };

  const values = [thresholds.a2Min, thresholds.b1Min, thresholds.b2Min, thresholds.c1Min, thresholds.c2Min];
  const invalidRange = values.some((v) => Number.isNaN(v) || v < 0 || v > 100);
  const notAscending = !(thresholds.a2Min < thresholds.b1Min && thresholds.b1Min < thresholds.b2Min && thresholds.b2Min < thresholds.c1Min && thresholds.c1Min < thresholds.c2Min);

  if (invalidRange || notAscending) return { ...DEFAULT_CEFR_THRESHOLDS };
  return thresholds;
}

async function getCefrThresholds() {
  try {
    const row = await knex('system_settings').where({ setting_key: 'cefr_thresholds' }).first();
    if (!row?.setting_value) return { ...DEFAULT_CEFR_THRESHOLDS };
    const parsed = JSON.parse(row.setting_value);
    return normalizeCefrThresholds(parsed);
  } catch (_) {
    return { ...DEFAULT_CEFR_THRESHOLDS };
  }
}

function mapPercentageToCefr(percentage, thresholds = DEFAULT_CEFR_THRESHOLDS) {
  const value = Number(percentage || 0);
  if (value < thresholds.a2Min) return 'A1';
  if (value < thresholds.b1Min) return 'A2';
  if (value < thresholds.b2Min) return 'B1';
  if (value < thresholds.c1Min) return 'B2';
  if (value < thresholds.c2Min) return 'C1';
  return 'C2';
}

async function getLevelThresholds(req, res) {
  try {
    const thresholds = await getCefrThresholds();
    return res.json({ data: thresholds });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateLevelThresholds(req, res) {
  try {
    const incoming = req.body || {};
    const thresholds = normalizeCefrThresholds(incoming);
    const isSame = JSON.stringify(thresholds) === JSON.stringify(incoming);
    if (!isSame) {
      return res.status(400).json({ error: 'Eşik değerleri 0-100 aralığında ve artan sırada olmalı (A2 < B1 < B2 < C1 < C2).' });
    }

    const existing = await knex('system_settings').where({ setting_key: 'cefr_thresholds' }).first();
    const payload = { setting_key: 'cefr_thresholds', setting_value: JSON.stringify(thresholds) };

    if (existing?.setting_id) {
      await knex('system_settings').where({ setting_id: existing.setting_id }).update(payload);
    } else {
      await knex('system_settings').insert(payload);
    }

    return res.json({ data: thresholds, message: 'CEFR eşikleri güncellendi.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ===== EXAM CRUD =====
async function list(req, res) {
  const { page = 1, limit = 20, courseId, status, isPublished, subject: subjectParam } = req.query;
  try {
    // Only apply subject filter when explicitly requested.
    // Existing exams may not have a subject value yet.
    const subject = subjectParam || null;

    const result = await repo.findAll({ 
      page: Number(page), 
      limit: Number(limit), 
      courseId: courseId ? Number(courseId) : null,
      status,
      subject,
      isPublished: isPublished === 'true' ? true : isPublished === 'false' ? false : null
    });
    res.json(result);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function getOne(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });
  try { 
    const item = await repo.findById(examId); 
    if (!item) return res.status(404).json({ error: 'exam not found' }); 
    res.json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function create(req, res) { 
  try { 
    const userId = req.user?.user_id || req.user?.id || req.user?.dbUser?.user_id || req.user?.dbUser?.id;
    if (!userId) {
      return res.status(401).json({ error: 'authenticated user required for exam creation' });
    }

    const payload = {
      ...(req.body || {}),
      created_by: userId,
      createdBy: userId
    };

    const item = await repo.create(payload); 
    res.status(201).json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

async function update(req, res) { 
  const examId = Number(req.params.id); 
  if (!examId) return res.status(400).json({ error: 'invalid exam id' }); 
  try { 
    const item = await repo.update(examId, req.body); 
    res.json(item); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

async function remove(req, res) { 
  const examId = Number(req.params.id); 
  if (!examId) return res.status(400).json({ error: 'invalid exam id' }); 
  try { 
    const result = await repo.remove(examId);
    if (result?.notFound) {
      return res.status(404).json({ error: 'exam not found' });
    }

    if (result?.archived) {
      return res.status(200).json({ message: 'Sınav yayınlanmış olduğu için arşivlendi.' });
    }

    return res.status(204).end(); 
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  } 
}

// ===== EXAM QUESTIONS MANAGEMENT =====
async function listQuestions(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });
  try {
    const rows = await examQuestionsRepo.getExamQuestions(examId);
    return res.json({ data: rows });
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function linkQuestion(req, res) {
  const examId = Number(req.params.id);
  const { questionId, pointsOverride } = req.body;
  if (!examId || !questionId) return res.status(400).json({ error: 'examId and questionId required' });
  try {
    const exists = await knex('exam_questions').where({ exam_id: examId, question_id: questionId }).first();
    if (exists) return res.status(200).json({ message: 'already linked' });
    
    const item = await examQuestionsRepo.create({ 
      examId, 
      questionId, 
      pointsOverride 
    });
    return res.status(201).json(item);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function createQuestionForExam(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });
  try {
    const question = await questionsRepo.create(req.body);
    await examQuestionsRepo.create({ examId, questionId: question.id });
    return res.status(201).json(question);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function removeQuestionFromExam(req, res) {
  const examId = Number(req.params.id);
  const examQuestionId = Number(req.params.questionId);
  if (!examId || !examQuestionId) return res.status(400).json({ error: 'invalid ids' });
  try {
    await examQuestionsRepo.remove(examQuestionId);
    return res.status(204).end();
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function reorderQuestions(req, res) {
  const examId = Number(req.params.id);
  const { order } = req.body; // order: [exam_question_id, exam_question_id, ...]
  if (!examId || !Array.isArray(order)) return res.status(400).json({ error: 'invalid order array' });
  try {
    const result = await examQuestionsRepo.reorderQuestions(examId, order);
    return res.json(result);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

// ===== EXAM PUBLICATION =====
async function publish(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });
  try {
    const exam = await repo.publish(examId);
    if (!exam) {
      return res.status(404).json({ error: 'exam not found' });
    }
    return res.json(exam);
  } catch (err) { 
    if (String(err?.message || '').includes('Cannot publish exam without questions')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message }); 
  }
}

async function archive(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });
  try {
    const exam = await repo.archive(examId);
    return res.json(exam);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

// ===== STUDENT EXAM ATTEMPTS =====
async function startAttempt(req, res) {
  const examId = Number(req.params.id);
  const bodyStudentId = req.body?.studentId || req.body?.student_id;
  const userId = req.user?.user_id || req.user?.id;
  const studentId = Number(bodyStudentId || userId);
  
  if (!examId || !userId || !studentId) {
    return res.status(400).json({ error: 'examId and authenticated student context required' });
  }

  try {
    const exam = await repo.findById(examId);
    if (!exam) return res.status(404).json({ error: 'exam not found' });
    const status = String(exam.status || '').toLowerCase();
    const isPublished = Number(exam.is_published) === 1 || status === 'published';
    if (!isPublished) return res.status(400).json({ error: 'exam not published' });

    const attempt = await studentExamAttemptsRepo.create({
      examId,
      studentId,
      userId
    });

    return res.status(201).json(attempt);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function getAttempt(req, res) {
  const attemptId = Number(req.params.attemptId);
  if (!attemptId) return res.status(400).json({ error: 'invalid attempt id' });

  try {
    const attempt = await studentExamAttemptsRepo.findById(attemptId);
    if (!attempt) return res.status(404).json({ error: 'attempt not found' });
    res.json(attempt);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
}

async function recordAnswer(req, res) {
  const attemptId = Number(req.params.attemptId);
  const { questionId, examQuestionId, studentAnswer, selectedOptionId, isCorrect, pointsEarned, timeSpent } = req.body;

  if (!attemptId || !questionId) {
    return res.status(400).json({ error: 'attemptId and questionId required' });
  }

  try {
    const numericQuestionId = Number(questionId);
    const numericOptionId = selectedOptionId ? Number(selectedOptionId) : null;
    const hasIsCorrect = typeof isCorrect === 'boolean' || Number(isCorrect) === 0 || Number(isCorrect) === 1;

    let resolvedIsCorrect = hasIsCorrect ? (Number(isCorrect) === 1 || isCorrect === true) : null;
    let resolvedPointsEarned = Number.isFinite(Number(pointsEarned)) ? Number(pointsEarned) : null;

    // If client does not send correctness, derive it from selected option.
    if (resolvedIsCorrect === null && numericOptionId) {
      const option = await knex('question_options')
        .where({ option_id: numericOptionId, question_id: numericQuestionId })
        .first('is_correct');

      if (option) {
        resolvedIsCorrect = Number(option.is_correct) === 1;
      }
    }

    if (resolvedIsCorrect === null) {
      resolvedIsCorrect = false;
    }

    if (resolvedPointsEarned === null) {
      let questionPoints = 1;

      // Prefer exam-specific points to keep percentage calculation consistent.
      const attempt = await knex('student_exam_attempts').where('id', attemptId).orWhere('attempt_id', attemptId).first('exam_id');
      if (attempt?.exam_id) {
        const eq = await knex('exam_questions')
          .where({ exam_id: attempt.exam_id, question_id: numericQuestionId })
          .first('points', 'points_override');

        const examQuestionPoints = Number(eq?.points_override ?? eq?.points);
        if (Number.isFinite(examQuestionPoints) && examQuestionPoints > 0) {
          questionPoints = examQuestionPoints;
        }
      }

      if (questionPoints <= 0) {
        const q = await knex('questions').where({ question_id: numericQuestionId }).first('points');
        questionPoints = Number(q?.points || 1);
      }

      resolvedPointsEarned = resolvedIsCorrect ? questionPoints : 0;
    }

    const answerId = await studentExamAttemptsRepo.recordAnswer(
      attemptId,
      numericQuestionId,
      examQuestionId,
      studentAnswer,
      numericOptionId,
      resolvedIsCorrect,
      resolvedPointsEarned,
      Number(timeSpent || 0)
    );

    const answer = await examAnswersRepo.findById(answerId);
    return res.status(201).json(answer);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function submitAttempt(req, res) {
  const attemptId = Number(req.params.attemptId);
  if (!attemptId) return res.status(400).json({ error: 'invalid attempt id' });

  try {
    const submitted = await studentExamAttemptsRepo.submitAttempt(attemptId);
    return res.json(submitted);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

async function gradeAttempt(req, res) {
  const attemptId = Number(req.params.attemptId);
  const { teacherFeedback } = req.body;
  if (!attemptId) return res.status(400).json({ error: 'invalid attempt id' });

  try {
    const graded = await studentExamAttemptsRepo.gradeAttempt(attemptId, teacherFeedback);
    return res.json(graded);
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

// ===== STATISTICS =====
async function getStatistics(req, res) {
  const examId = Number(req.params.id);
  if (!examId) return res.status(400).json({ error: 'invalid exam id' });

  try {
    const stats = await repo.getAttemptStats(examId);
    const performance = await repo.getClassPerformance(examId);
    
    return res.json({ 
      stats, 
      performance,
      total_students: performance?.length || 0
    });
  } catch (err) { 
    return res.status(500).json({ error: err.message }); 
  }
}

// ===== STUDENT ENDPOINTS =====
async function studentList(req, res) {
  try {
    const userId = req.user?.user_id || req.user?.id;
    if (!userId) return res.status(400).json({ error: 'missing user id' });
    const thresholds = await getCefrThresholds();
    const attemptCols = await getStudentAttemptColumnMap();

    if (!attemptCols.percentage) {
      return res.status(500).json({ error: 'student_exam_attempts percentage column not found' });
    }

    const latestDiagnosticAttempt = await knex('student_exam_attempts as sea')
      .join('exams as e', 'sea.exam_id', 'e.exam_id')
      .where(`sea.${attemptCols.actorId}`, userId)
      .whereIn('sea.status', ['submitted', 'graded'])
      .andWhere((qb) => {
        qb.where('e.exam_type', 'diagnostic')
          .orWhere('e.exam_type', 'practice')
          .orWhere('e.title', 'like', '%ölçme%')
          .orWhere('e.title', 'like', '%değerlendirme%')
          .orWhere('e.title', 'like', '%seviye tespit%');
      })
      .orderBy('sea.submitted_at', 'desc')
      .first(
        knex.raw(`sea.${attemptCols.attemptId} as attempt_id`),
        knex.raw(`sea.${attemptCols.percentage} as percentage`)
      );

    const hasDiagnosticAttempt = Boolean(latestDiagnosticAttempt?.attempt_id);
    const levelTag = hasDiagnosticAttempt ? mapPercentageToCefr(latestDiagnosticAttempt?.percentage, thresholds) : null;

    const diagnosticExams = await knex('exams')
      .where({ is_published: 1 })
      .andWhere((qb) => {
        qb.where('exam_type', 'diagnostic')
          .orWhere('exam_type', 'practice')
          .orWhere('title', 'like', '%ölçme%')
          .orWhere('title', 'like', '%değerlendirme%')
          .orWhere('title', 'like', '%seviye tespit%');
      })
      .orderBy('start_date', 'desc');

    if (!hasDiagnosticAttempt) {
      if (!diagnosticExams.length) {
        return res.json({
          data: [],
          onboarding: {
            isNewStudent: true,
            diagnosticAssigned: false,
            levelTag: null,
            message: 'Yeni öğrenci: Öğretmeniniz henüz ölçme ve değerlendirme sınavı atamadı.'
          }
        });
      }

      return res.json({
        data: diagnosticExams,
        onboarding: {
          isNewStudent: true,
          diagnosticAssigned: true,
          levelTag: null,
          message: 'Ölçme ve değerlendirme testiniz var. Lütfen önce bu sınavı çözün.'
        }
      });
    }

    const rows = await knex('exams')
      .where({ is_published: 1 })
      .orderBy('start_date', 'desc');

    const attempts = await knex('student_exam_attempts')
      .where(attemptCols.actorId, userId)
      .orderBy('submitted_at', 'desc')
      .orderBy('updated_at', 'desc');

    const latestAttemptByExam = new Map();
    attempts.forEach((a) => {
      const examKey = Number(a.exam_id);
      if (!Number.isFinite(examKey) || latestAttemptByExam.has(examKey)) return;
      latestAttemptByExam.set(examKey, a);
    });

    const enrichedRows = rows.map((exam) => {
      const attempt = latestAttemptByExam.get(Number(exam.exam_id));
      const attemptStatus = String(attempt?.status || '').toLowerCase();
      const isCompleted = ['submitted', 'graded', 'completed'].includes(attemptStatus);
      const percentageRaw = attempt ? Number(attempt[attemptCols.percentage] || 0) : null;
      const percentage = Number.isFinite(percentageRaw)
        ? Math.max(0, Math.min(100, percentageRaw))
        : null;

      return {
        ...exam,
        status: isCompleted ? 'completed' : 'pending',
        score: Number.isFinite(percentage) ? percentage : null,
        completed_at: attempt?.submitted_at || attempt?.graded_at || attempt?.completed_at || null,
        attempt_id: attempt ? Number(attempt[attemptCols.attemptId]) : null
      };
    });

    return res.json({
      data: enrichedRows,
      onboarding: {
        isNewStudent: false,
        diagnosticAssigned: true,
        levelTag,
        message: `Sınavlarınız hazır. Güncel seviye etiketiniz: ${levelTag}.`
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getStudentAttempts(req, res) {
  const examId = Number(req.params.id);
  const userId = req.user?.user_id || req.user?.id;
  
  if (!examId || !userId) return res.status(400).json({ error: 'missing parameters' });

  try {
    const attemptCols = await getStudentAttemptColumnMap();
    const attempts = await knex('student_exam_attempts')
      .where({ exam_id: examId, [attemptCols.actorId]: userId })
      .orderBy('submitted_at', 'desc');
    return res.json({ data: attempts });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ===== AUTO CREATE EXAM =====
async function autoCreate(req, res) {
  const { title, duration, grade_level, topic, exam_type } = req.body;
  const userId = req.user?.user_id || req.user?.id || 1;
  const normalizedExamType = String(exam_type || 'diagnostic').toLowerCase();
  const targetPerDifficulty = 7;
  const totalTargetQuestions = 21;
  const durationMinutes = Number(duration) > 0
    ? Number(duration)
    : (normalizedExamType === 'diagnostic' ? 20 : 60);

  if (!title) return res.status(400).json({ error: 'title required' });

  try {
    const buildBaseQuestionQuery = () => {
      const query = knex('questions').select('question_id', 'difficulty_level', 'points');

      query.whereIn(
        'question_id',
        knex('question_options')
          .select('question_id')
          .groupBy('question_id')
          .havingRaw('COUNT(*) >= 4')
      );

      if (grade_level) {
        query.andWhere((qb) => {
          qb.where('grade_level', Number(grade_level)).orWhere('class_level', Number(grade_level));
        });
      }

      if (topic) {
        query.andWhere('topic', 'like', '%' + topic + '%');
      }

      return query;
    };

    const easyQuestions = await buildBaseQuestionQuery()
      .where('difficulty_level', 'easy')
      .orderByRaw('RAND()')
      .limit(targetPerDifficulty);

    const mediumQuestions = await buildBaseQuestionQuery()
      .where('difficulty_level', 'medium')
      .orderByRaw('RAND()')
      .limit(targetPerDifficulty);

    const hardQuestions = await buildBaseQuestionQuery()
      .where('difficulty_level', 'hard')
      .orderByRaw('RAND()')
      .limit(targetPerDifficulty);

    const selected = [...easyQuestions, ...mediumQuestions, ...hardQuestions];

    // Backfill from any difficulty to still reach 21 if one difficulty bucket is short.
    if (selected.length < totalTargetQuestions) {
      const missingCount = totalTargetQuestions - selected.length;
      const selectedIds = selected.map((q) => q.question_id);
      const extraQuestions = await buildBaseQuestionQuery()
        .whereNotIn('question_id', selectedIds.length ? selectedIds : [0])
        .orderByRaw('RAND()')
        .limit(missingCount);
      selected.push(...extraQuestions);
    }

    if (selected.length < totalTargetQuestions) {
      return res.status(400).json({ 
        error: `Yeterli soru bulunamadı. Talep: ${totalTargetQuestions} soru, Mevcut: ${selected.length}` 
      });
    }

    const createdExam = await repo.create({
      title,
      duration_minutes: durationMinutes,
      created_by: userId,
      exam_type: normalizedExamType,
      total_points: totalTargetQuestions,
      total_questions: totalTargetQuestions,
      is_published: true,
      status: 'published'
    });

    const examId = createdExam?.exam_id || createdExam?.id;
    if (!examId) {
      throw new Error('Sınav oluşturuldu ancak exam id alınamadı.');
    }

    // Link questions to exam
    let sortOrder = 1;
    const questionIds = [];
    
    for (const q of selected.slice(0, totalTargetQuestions)) {
      await examQuestionsRepo.create({
        examId,
        questionId: q.question_id,
        points: 1,
        sort_order: sortOrder
      });
      questionIds.push(q.question_id);
      sortOrder++;
    }

    res.status(201).json({
      message: '✅ Sınav başarıyla oluşturuldu ve yayınlandı!',
      data: {
        examId,
        questionCount: totalTargetQuestions,
        easyCount: easyQuestions.length,
        mediumCount: mediumQuestions.length,
        hardCount: hardQuestions.length,
        durationMinutes,
        examType: normalizedExamType
      }
    });
  } catch (error) {
    console.error('Auto-create exam error:', error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { 
  list, getOne, create, update, remove,
  listQuestions, linkQuestion, createQuestionForExam, removeQuestionFromExam, reorderQuestions,
  publish, archive,
  startAttempt, getAttempt, recordAnswer, submitAttempt, gradeAttempt,
  getLevelThresholds, updateLevelThresholds,
  getStatistics,
  studentList, getStudentAttempts,
  autoCreate
};

