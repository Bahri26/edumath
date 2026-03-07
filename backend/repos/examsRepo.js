const knex = require('../db/knex');

let examsColumnsCache = null;
let questionsColumnsCache = null;
let examTypeMetaCache = null;

async function getExamsColumns() {
  if (examsColumnsCache) return examsColumnsCache;
  const columns = await knex('information_schema.columns')
    .where({ TABLE_SCHEMA: process.env.DB_NAME, TABLE_NAME: 'exams' })
    .select('COLUMN_NAME');
  examsColumnsCache = new Set(columns.map((c) => c.COLUMN_NAME));
  return examsColumnsCache;
}

async function getQuestionsColumns() {
  if (questionsColumnsCache) return questionsColumnsCache;
  const columns = await knex('information_schema.columns')
    .where({ TABLE_SCHEMA: process.env.DB_NAME, TABLE_NAME: 'questions' })
    .select('COLUMN_NAME');
  questionsColumnsCache = new Set(columns.map((c) => c.COLUMN_NAME));
  return questionsColumnsCache;
}

async function getExamPkColumn() {
  const columns = await getExamsColumns();
  return columns.has('exam_id') ? 'exam_id' : 'id';
}

function parseEnumValues(columnType) {
  const raw = String(columnType || '');
  const match = raw.match(/^enum\((.*)\)$/i);
  if (!match || !match[1]) return [];
  return match[1]
    .split(',')
    .map((v) => v.trim().replace(/^'/, '').replace(/'$/, ''))
    .filter(Boolean);
}

async function getExamTypeMeta() {
  if (examTypeMetaCache) return examTypeMetaCache;

  const row = await knex('information_schema.columns')
    .where({ TABLE_SCHEMA: process.env.DB_NAME, TABLE_NAME: 'exams', COLUMN_NAME: 'exam_type' })
    .first('COLUMN_TYPE', 'COLUMN_DEFAULT');

  const allowedValues = parseEnumValues(row?.COLUMN_TYPE);
  examTypeMetaCache = {
    allowedSet: new Set(allowedValues),
    defaultValue: row?.COLUMN_DEFAULT || allowedValues[0] || null
  };
  return examTypeMetaCache;
}

function firstAllowed(candidates, allowedSet) {
  for (const item of candidates) {
    if (item && allowedSet.has(item)) return item;
  }
  return null;
}

async function normalizeExamType(rawValue) {
  const { allowedSet, defaultValue } = await getExamTypeMeta();
  if (!allowedSet || allowedSet.size === 0) {
    return String(rawValue || 'summative').toLowerCase();
  }

  const requested = String(rawValue || '').toLowerCase().trim();
  if (requested && allowedSet.has(requested)) return requested;

  const mapped = {
    diagnostic: firstAllowed(['diagnostic', 'practice', 'quiz', defaultValue], allowedSet),
    summative: firstAllowed(['summative', 'final', 'midterm', 'quiz', defaultValue], allowedSet),
    formative: firstAllowed(['formative', 'quiz', 'practice', defaultValue], allowedSet)
  };

  if (mapped[requested]) return mapped[requested];
  return firstAllowed([defaultValue, 'quiz', 'practice', 'final', 'midterm'], allowedSet) || defaultValue;
}

function pickExistingColumns(payload, columnSet) {
  const out = {};
  Object.keys(payload).forEach((key) => {
    if (payload[key] !== undefined && columnSet.has(key)) {
      out[key] = payload[key];
    }
  });
  return out;
}

module.exports = {
  /**
   * Tüm sınavları listele (pagination ile)
   */
  async findAll({ page = 1, limit = 10, courseId = null, status = null, isPublished = null, subject = null } = {}) {
    try {
      const columns = await getExamsColumns();
      let query = knex('exams');

      if (courseId && columns.has('course_id')) query.where('course_id', courseId);
      if (status) query.where('status', status);
      if (isPublished !== null) query.where('is_published', isPublished);
      if (subject && columns.has('subject')) query.where('subject', subject);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const exams = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows: exams, total };
    } catch (error) {
      console.error('Error in examsRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Tek bir sınavı döndür (soruları da getir)
   */
  async findById(examId) {
    try {
      const pk = await getExamPkColumn();
      const exam = await knex('exams')
        .where(pk, examId)
        .first();

      if (!exam) return null;

      // Sınavın tüm sorularını getir
      const questions = await this.getQuestions(examId);
      exam.questions = questions;

      return exam;
    } catch (error) {
      console.error('Error in examsRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni sınav oluştur
   */
  async create(data) {
    try {
      const columns = await getExamsColumns();
      const now = new Date();
      const normalizedExamType = await normalizeExamType(data.examType || data.exam_type || 'summative');
      const payload = {
        title: data.title,
        description: data.description,
        course_id: data.courseId || data.course_id,
        exam_type: normalizedExamType,
        duration_minutes: data.durationMinutes || data.duration_minutes || 60,
        total_points: data.totalPoints || data.total_points || 100,
        passing_score: data.passingScore || data.passing_score || 60,
        start_date: data.startDate || data.start_date,
        end_date: data.endDate || data.end_date,
        status: data.status || 'draft',
        is_published: data.isPublished || data.is_published || false,
        created_by: data.createdBy || data.created_by,
        creator_id: data.createdBy || data.created_by,
        subject: data.subject,
        grade_level: data.grade_level,
        total_questions: data.total_questions,
        created_at: now,
        updated_at: now
      };

      const insertData = pickExistingColumns(payload, columns);
      const [examId] = await knex('exams').insert(insertData);

      return this.findById(examId);
    } catch (error) {
      console.error('Error in examsRepo.create:', error);
      throw error;
    }
  },

  /**
   * Sınavı güncelle
   */
  async update(examId, data) {
    try {
      const columns = await getExamsColumns();
      const pk = await getExamPkColumn();
      const normalizedExamType = data.exam_type !== undefined ? await normalizeExamType(data.exam_type) : undefined;
      const updateData = pickExistingColumns({
        title: data.title,
        description: data.description,
        duration_minutes: data.duration_minutes,
        total_points: data.total_points,
        passing_score: data.passing_score,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        exam_type: normalizedExamType,
        subject: data.subject,
        grade_level: data.grade_level,
        updated_at: new Date()
      }, columns);

      await knex('exams')
        .where(pk, examId)
        .update(updateData);

      return this.findById(examId);
    } catch (error) {
      console.error('Error in examsRepo.update:', error);
      throw error;
    }
  },

  /**
   * Sınavı sil (draft durumunda)
   */
  async remove(examId) {
    try {
      const pk = await getExamPkColumn();
      const exam = await this.findById(examId);
      if (!exam) {
        return { deleted: false, archived: false, notFound: true };
      }

      if (exam.status !== 'draft') {
        await knex('exams')
          .where(pk, examId)
          .update({
            status: 'archived',
            is_published: false,
            updated_at: new Date()
          });

        return { deleted: false, archived: true, notFound: false };
      }

      // exam_answers ve student_exam_attempts CASCADE ile silinir
      await knex('exams')
        .where(pk, examId)
        .delete();

      return { deleted: true, archived: false, notFound: false };
    } catch (error) {
      console.error('Error in examsRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Sınavın tüm sorularını getir (sırasıyla)
   */
  async getQuestions(examId) {
    try {
      const qColumns = await getQuestionsColumns();
      const questionPk = qColumns.has('question_id') ? 'question_id' : 'id';
      const questions = await knex('exam_questions as eq')
        .join('questions as q', 'eq.question_id', `q.${questionPk}`)
        .select(
          `q.${questionPk} as question_id`,
          'q.content_text',
          'q.points',
          'q.difficulty_level',
          'q.class_level',
          'eq.id as exam_question_id',
          'eq.sort_order',
          'eq.points'
        )
        .where('eq.exam_id', examId)
        .orderBy('eq.sort_order', 'asc');

      return questions;
    } catch (error) {
      console.error('Error in examsRepo.getQuestions:', error);
      throw error;
    }
  },

  /**
   * Sınavaya soru ekle
   */
  async addQuestion(examId, questionId, pointsOverride = null, sortOrder = null) {
    try {
      // Sınavada kaç soru var?
      const maxSort = await knex('exam_questions')
        .where('exam_id', examId)
        .max('sort_order as maxSort')
        .first();

      const order = sortOrder || (maxSort?.maxSort || 0) + 1;

      const [id] = await knex('exam_questions').insert({
        exam_id: examId,
        question_id: questionId,
        sort_order: order,
        points_override: pointsOverride,
        created_at: new Date()
      });

      return id;
    } catch (error) {
      console.error('Error in examsRepo.addQuestion:', error);
      throw error;
    }
  },

  /**
   * Soruyu sınavdan çıkar
   */
  async removeQuestion(examId, examQuestionId) {
    try {
      await knex('exam_questions')
        .where({ exam_id: examId, exam_question_id: examQuestionId })
        .delete();

      return 1;
    } catch (error) {
      console.error('Error in examsRepo.removeQuestion:', error);
      throw error;
    }
  },

  /**
   * Soruları yeniden sırala
   */
  async reorderQuestions(examId, questionOrder) {
    try {
      for (const [sortOrder, examQuestionId] of questionOrder.entries()) {
        await knex('exam_questions')
          .where({ exam_id: examId, exam_question_id: examQuestionId })
          .update({ sort_order: sortOrder + 1 });
      }

      return 1;
    } catch (error) {
      console.error('Error in examsRepo.reorderQuestions:', error);
      throw error;
    }
  },

  /**
   * Sınavı yayınla (published)
   */
  async publish(examId) {
    try {
      const pk = await getExamPkColumn();
      const exam = await this.findById(examId);
      if (!exam) return null;

      const status = String(exam?.status || '').toLowerCase();
      const alreadyPublished = Number(exam?.is_published) === 1 || status === 'published';
      if (alreadyPublished) return exam;

      if (!exam.questions || exam.questions.length === 0) {
        throw new Error('Cannot publish exam without questions');
      }

      await knex('exams')
        .where(pk, examId)
        .update({
          is_published: true,
          status: 'published',
          updated_at: new Date()
        });

      return this.findById(examId);
    } catch (error) {
      console.error('Error in examsRepo.publish:', error);
      throw error;
    }
  },

  /**
   * Sınavı arşivle
   */
  async archive(examId) {
    try {
      const pk = await getExamPkColumn();
      await knex('exams')
        .where(pk, examId)
        .update({
          status: 'archived',
          updated_at: new Date()
        });

      return this.findById(examId);
    } catch (error) {
      console.error('Error in examsRepo.archive:', error);
      throw error;
    }
  },

  /**
   * Sınav denemesi istatistiklerini getir
   */
  async getAttemptStats(examId) {
    try {
      const stats = await knex('student_exam_attempts')
        .where('exam_id', examId)
        .select(
          knex.raw('COUNT(*) as total_attempts'),
          knex.raw('AVG(percentage) as avg_percentage'),
          knex.raw('MIN(percentage) as min_percentage'),
          knex.raw('MAX(percentage) as max_percentage'),
          knex.raw('COUNT(CASE WHEN passed = 1 THEN 1 END) as passed_count'),
          knex.raw('COUNT(CASE WHEN passed = 0 THEN 1 END) as failed_count')
        )
        .first();

      return stats;
    } catch (error) {
      console.error('Error in examsRepo.getAttemptStats:', error);
      throw error;
    }
  }
};
