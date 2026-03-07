const knex = require('../db/knex');

let examAnswersColumnsCache = null;

async function getExamAnswersColumns() {
  if (examAnswersColumnsCache) return examAnswersColumnsCache;
  const info = await knex('exam_answers').columnInfo();
  examAnswersColumnsCache = new Set(Object.keys(info || {}));
  return examAnswersColumnsCache;
}

async function getExamAnswersPk() {
  const cols = await getExamAnswersColumns();
  return cols.has('answer_id') ? 'answer_id' : 'id';
}

module.exports = {
  /**
   * Tüm cevapları listele
   */
  async findAll({ page = 1, limit = 10, attemptId = null, questionId = null, isCorrect = null } = {}) {
    try {
      const cols = await getExamAnswersColumns();
      let query = knex('exam_answers').select('*');

      if (attemptId) query.where('attempt_id', attemptId);
      if (questionId) query.where('question_id', questionId);
      if (isCorrect !== null) query.where('is_correct', isCorrect);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy(cols.has('answer_sequence') ? 'answer_sequence' : 'answered_at', 'asc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in exam_answersRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir cevabı getir
   */
  async findById(answerId) {
    try {
      const pk = await getExamAnswersPk();
      return await knex('exam_answers')
        .where(pk, answerId)
        .first();
    } catch (error) {
      console.error('Error in exam_answersRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni cevap kayıt et
   */
  async create(data) {
    try {
      const [answerId] = await knex('exam_answers').insert({
        attempt_id: data.attemptId || data.attempt_id,
        question_id: data.questionId || data.question_id,
        exam_question_id: data.examQuestionId || data.exam_question_id,
        student_answer: data.studentAnswer || data.student_answer,
        selected_option_id: data.selectedOptionId || data.selected_option_id,
        is_correct: data.isCorrect ? 1 : 0,
        points_earned: data.pointsEarned || data.points_earned || 0,
        teacher_feedback: data.teacherFeedback || data.teacher_feedback,
        time_spent_seconds: data.timeSpent || data.time_spent_seconds || 0,
        answer_sequence: data.answerSequence || data.answer_sequence,
        answered_at: new Date(),
        created_at: new Date()
      });

      return this.findById(answerId);
    } catch (error) {
      console.error('Error in exam_answersRepo.create:', error);
      throw error;
    }
  },

  /**
   * Cevabı güncelle
   */
  async update(answerId, data) {
    try {
      const pk = await getExamAnswersPk();
      const updateData = {};
      if (data.student_answer) updateData.student_answer = data.student_answer;
      if (data.selected_option_id) updateData.selected_option_id = data.selected_option_id;
      if (data.is_correct !== undefined) updateData.is_correct = data.is_correct ? 1 : 0;
      if (data.points_earned !== undefined) updateData.points_earned = data.points_earned;
      if (data.teacher_feedback) updateData.teacher_feedback = data.teacher_feedback;
      if (data.time_spent_seconds !== undefined) updateData.time_spent_seconds = data.time_spent_seconds;

      updateData.updated_at = new Date();

      await knex('exam_answers')
        .where(pk, answerId)
        .update(updateData);

      return this.findById(answerId);
    } catch (error) {
      console.error('Error in exam_answersRepo.update:', error);
      throw error;
    }
  },

  /**
   * Cevabı sil
   */
  async remove(answerId) {
    try {
      const pk = await getExamAnswersPk();
      return await knex('exam_answers')
        .where(pk, answerId)
        .delete();
    } catch (error) {
      console.error('Error in exam_answersRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Bir denemede verilen cevapları getir
   */
  async getAttemptAnswers(attemptId) {
    try {
      const cols = await getExamAnswersColumns();
      const answers = await knex('exam_answers as ea')
        .join('questions as q', 'ea.question_id', 'q.id')
        .select(
          'ea.*',
          'q.content_text',
          'q.type',
          'q.points'
        )
        .where('ea.attempt_id', attemptId)
        .orderBy(cols.has('answer_sequence') ? 'ea.answer_sequence' : 'ea.answered_at', 'asc');

      return answers;
    } catch (error) {
      console.error('Error in exam_answersRepo.getAttemptAnswers:', error);
      throw error;
    }
  },

  /**
   * Bir soru için tüm cevapları getir (sınıf analizi için)
   */
  async getQuestionAnalysis(questionId) {
    try {
      const analysis = await knex('exam_answers')
        .where('question_id', questionId)
        .select(
          knex.raw('COUNT(*) as total_answers'),
          knex.raw('COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct_answers'),
          knex.raw('(COUNT(CASE WHEN is_correct = 1 THEN 1 END) / COUNT(*)) * 100 as p_value'),
          knex.raw('AVG(time_spent_seconds) as avg_time_spent')
        )
        .first();

      return analysis;
    } catch (error) {
      console.error('Error in exam_answersRepo.getQuestionAnalysis:', error);
      throw error;
    }
  },

  /**
   * Seçeneklere göre cevap dağılımı
   */
  async getOptionDistribution(questionId) {
    try {
      const pk = await getExamAnswersPk();
      const distribution = await knex('exam_answers as ea')
        .leftJoin('question_options as qo', 'ea.selected_option_id', 'qo.id')
        .select(
          'qo.option_text',
          knex.raw(`COUNT(ea.${pk}) as count`),
          knex.raw(`(COUNT(ea.${pk}) / (SELECT COUNT(*) FROM exam_answers WHERE question_id = ?)) * 100 as percentage`, [questionId])
        )
        .where('ea.question_id', questionId)
        .groupBy('ea.selected_option_id')
        .orderBy('count', 'desc');

      return distribution;
    } catch (error) {
      console.error('Error in exam_answersRepo.getOptionDistribution:', error);
      throw error;
    }
  }
};
