const knex = require('../db/knex');

module.exports = {
  /**
   * Tüm anket sorularını listele
   */
  async findAll({ page = 1, limit = 10, surveyId = null, questionType = null } = {}) {
    try {
      let query = knex('survey_questions').select('*');

      if (surveyId) query.where('survey_id', surveyId);
      if (questionType) query.where('question_type', questionType);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy('sort_order', 'asc')
        .limit(limit)
        .offset((page - 1) * limit);

      // JSON alanlarını parse et
      return { 
        rows: rows.map(q => ({
          ...q,
          options: q.options ? JSON.parse(q.options) : []
        })),
        total 
      };
    } catch (error) {
      console.error('Error in survey_questionsRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir anket sorusunu getir
   */
  async findById(id) {
    try {
      const question = await knex('survey_questions')
        .where('id', id)
        .first();

      if (question && question.options) {
        question.options = JSON.parse(question.options);
      }

      return question;
    } catch (error) {
      console.error('Error in survey_questionsRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni anket sorusu oluştur
   */
  async create(data) {
    try {
      // Anketin son sorusunun sort_order'ını al
      const lastQuestion = await knex('survey_questions')
        .where('survey_id', data.surveyId || data.survey_id)
        .max('sort_order as maxSort')
        .first();

      const sortOrder = (lastQuestion?.maxSort || 0) + 1;

      const [questionId] = await knex('survey_questions').insert({
        survey_id: data.surveyId || data.survey_id,
        question_text: data.questionText || data.question_text,
        question_type: data.questionType || data.question_type, // text, radio, checkbox, scale, etc.
        options: data.options ? JSON.stringify(data.options) : null,
        sort_order: sortOrder,
        is_required: data.isRequired ? 1 : 0,
        help_text: data.helpText || data.help_text,
        min_value: data.minValue || data.min_value,
        max_value: data.maxValue || data.max_value,
        created_at: new Date()
      });

      return this.findById(questionId);
    } catch (error) {
      console.error('Error in survey_questionsRepo.create:', error);
      throw error;
    }
  },

  /**
   * Anket sorusunu güncelle
   */
  async update(id, data) {
    try {
      const updateData = {};
      if (data.question_text) updateData.question_text = data.question_text;
      if (data.question_type) updateData.question_type = data.question_type;
      if (data.options) updateData.options = JSON.stringify(data.options);
      if (data.is_required !== undefined) updateData.is_required = data.is_required ? 1 : 0;
      if (data.help_text) updateData.help_text = data.help_text;
      if (data.min_value !== undefined) updateData.min_value = data.min_value;
      if (data.max_value !== undefined) updateData.max_value = data.max_value;

      await knex('survey_questions')
        .where('id', id)
        .update(updateData);

      return this.findById(id);
    } catch (error) {
      console.error('Error in survey_questionsRepo.update:', error);
      throw error;
    }
  },

  /**
   * Anket sorusunu sil
   */
  async remove(id) {
    try {
      return await knex('survey_questions')
        .where('id', id)
        .delete();
    } catch (error) {
      console.error('Error in survey_questionsRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Anketin tüm sorularını getir (sırasıyla)
   */
  async getSurveyQuestions(surveyId) {
    try {
      const questions = await knex('survey_questions')
        .where('survey_id', surveyId)
        .select('*')
        .orderBy('sort_order', 'asc');

      return questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }));
    } catch (error) {
      console.error('Error in survey_questionsRepo.getSurveyQuestions:', error);
      throw error;
    }
  },

  /**
   * Soruları yeniden sırala
   */
  async reorderQuestions(surveyId, questionOrder) {
    try {
      for (const [index, questionId] of questionOrder.entries()) {
        await knex('survey_questions')
          .where({ id: questionId, survey_id: surveyId })
          .update({ sort_order: index + 1 });
      }

      return await this.getSurveyQuestions(surveyId);
    } catch (error) {
      console.error('Error in survey_questionsRepo.reorderQuestions:', error);
      throw error;
    }
  },

  /**
   * Bir anket sorusuna verilen cevapları getir
   */
  async getQuestionResponses(questionId) {
    try {
      const responses = await knex('survey_answers')
        .where('question_id', questionId)
        .select('*');

      return responses;
    } catch (error) {
      console.error('Error in survey_questionsRepo.getQuestionResponses:', error);
      throw error;
    }
  },

  /**
   * Anket sorusunun istatistiklerini al
   */
  async getQuestionStats(questionId) {
    try {
      const question = await this.findById(questionId);
      const responses = await this.getQuestionResponses(questionId);

      const stats = {
        total_responses: responses.length,
        question_type: question.question_type,
        question_text: question.question_text
      };

      // Soru tipine göre analiz
      if (question.question_type === 'text' || question.question_type === 'textarea') {
        stats.responses = responses.map(r => r.answer);
      } else if (question.question_type === 'radio' || question.question_type === 'checkbox') {
        // Seçeneklerin frekansı
        const frequency = {};
        responses.forEach(r => {
          frequency[r.answer] = (frequency[r.answer] || 0) + 1;
        });
        stats.frequency = frequency;
      } else if (question.question_type === 'scale') {
        // Ortalama, min, max
        const values = responses
          .map(r => parseInt(r.answer))
          .filter(v => !isNaN(v));
        stats.average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        stats.min = Math.min(...values);
        stats.max = Math.max(...values);
      }

      return stats;
    } catch (error) {
      console.error('Error in survey_questionsRepo.getQuestionStats:', error);
      throw error;
    }
  }
};
