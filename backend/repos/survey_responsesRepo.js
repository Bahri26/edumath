const knex = require('../db/knex');

module.exports = {
  /**
   * Tüm anket cevaplarını listele
   */
  async findAll({ page = 1, limit = 10, surveyId = null, userId = null } = {}) {
    try {
      let query = knex('survey_responses').select('*');

      if (surveyId) query.where('survey_id', surveyId);
      if (userId) query.where('user_id', userId);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in survey_responsesRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir anket cevabını getir (tüm cevaplarıyla)
   */
  async findById(responseId) {
    try {
      const response = await knex('survey_responses')
        .where('response_id', responseId)
        .first();

      if (!response) return null;

      // Bu cevaba ait tüm soru cevaplarını getir
      const answers = await knex('survey_responses')
        .where('response_id', responseId)
        .select('*');

      response.answers = answers;
      return response;
    } catch (error) {
      console.error('Error in survey_responsesRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni anket cevap başlat
   */
  async create({ surveyId, userId = null }) {
    try {
      const [responseId] = await knex('survey_responses').insert({
        survey_id: surveyId,
        user_id: userId, // Gizli anketler için NULL olabilir
        created_at: new Date()
      });

      return this.findById(responseId);
    } catch (error) {
      console.error('Error in survey_responsesRepo.create:', error);
      throw error;
    }
  },

  /**
   * Anket cevabını teslim et (submit)
   */
  async submit(responseId) {
    try {
      await knex('survey_responses')
        .where('response_id', responseId)
        .update({
          created_at: new Date(),
          updated_at: new Date()
        });

      return this.findById(responseId);
    } catch (error) {
      console.error('Error in survey_responsesRepo.submit:', error);
      throw error;
    }
  },

  /**
   * Bir soruya cevap ekle
   */
  async addAnswer(responseId, questionId, answer) {
    try {
      const [answerId] = await knex('survey_responses').insert({
        response_id: responseId,
        question_id: questionId,
        answer: answer,
        created_at: new Date()
      });

      return await knex('survey_responses')
        .where('answer_id', answerId)
        .first();
    } catch (error) {
      console.error('Error in survey_responsesRepo.addAnswer:', error);
      throw error;
    }
  },

  /**
   * Cevabı düzenle
   */
  async updateAnswer(answerId, answer) {
    try {
      await knex('survey_responses')
        .where('answer_id', answerId)
        .update({
          answer: answer,
          updated_at: new Date()
        });

      return await knex('survey_responses')
        .where('answer_id', answerId)
        .first();
    } catch (error) {
      console.error('Error in survey_responsesRepo.updateAnswer:', error);
      throw error;
    }
  },

  /**
   * Cevabı sil
   */
  async removeAnswer(answerId) {
    try {
      return await knex('survey_responses')
        .where('answer_id', answerId)
        .delete();
    } catch (error) {
      console.error('Error in survey_responsesRepo.removeAnswer:', error);
      throw error;
    }
  },

  /**
   * Anket cevabını sil
   */
  async remove(responseId) {
    try {
      // Cascading: survey_responses otomatik silinir
      return await knex('survey_responses')
        .where('response_id', responseId)
        .delete();
    } catch (error) {
      console.error('Error in survey_responsesRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Anketin cevap oranını hesapla
   */
  async getResponseRate(surveyId) {
    try {
      const total = await knex('survey_responses')
        .where('survey_id', surveyId)
        .count('* as count')
        .first();

      const submitted = await knex('survey_responses')
        .where({ survey_id: surveyId })
        .whereNotNull('created_at')
        .count('* as count')
        .first();

      const rate = total.count > 0 ? (submitted.count / total.count * 100).toFixed(2) : 0;

      return {
        total_responses: total.count,
        submitted_responses: submitted.count,
        response_rate: rate
      };
    } catch (error) {
      console.error('Error in survey_responsesRepo.getResponseRate:', error);
      throw error;
    }
  },

  /**
   * Tamamlanmamış anketi getir (devam etme için)
   */
  async getIncompleteResponse(surveyId, userId) {
    try {
      return await knex('survey_responses')
        .where({ survey_id: surveyId, user_id: userId })
        .whereNull('created_at')
        .first();
    } catch (error) {
      console.error('Error in survey_responsesRepo.getIncompleteResponse:', error);
      throw error;
    }
  },

  /**
   * Anketi tamamlayan kullanıcıları getir
   */
  async getCompletedUsers(surveyId) {
    try {
      return await knex('survey_responses as sr')
        .join('users as u', 'sr.user_id', 'u.user_id')
        .select('u.*', 'sr.response_id', 'sr.created_at')
        .where({ survey_id: surveyId })
        .whereNotNull('sr.created_at');
    } catch (error) {
      console.error('Error in survey_responsesRepo.getCompletedUsers:', error);
      throw error;
    }
  }
};
