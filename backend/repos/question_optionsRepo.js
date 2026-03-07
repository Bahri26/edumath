const knex = require('../db/knex');

module.exports = {
  /**
   * Tüm şıkları listele
   */
  async findAll({ page = 1, limit = 10, questionId = null } = {}) {
    try {
      let query = knex('question_options').select('*');

      if (questionId) query.where('question_id', questionId);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy('sort_order', 'asc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in question_optionsRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir şıkı getir
   */
  async findById(optionId) {
    try {
      return await knex('question_options')
        .where('id', optionId)
        .first();
    } catch (error) {
      console.error('Error in question_optionsRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni şık oluştur
   */
  async create(data) {
    try {
      const [optionId] = await knex('question_options').insert({
        question_id: data.questionId || data.question_id,
        option_text: data.optionText || data.option_text,
        sort_order: data.sortOrder || data.sort_order,
        is_correct: data.isCorrect ? 1 : 0,
        explanation: data.explanation,
        created_at: new Date()
      });

      return this.findById(optionId);
    } catch (error) {
      console.error('Error in question_optionsRepo.create:', error);
      throw error;
    }
  },

  /**
   * Şığı güncelle
   */
  async update(optionId, data) {
    try {
      const updateData = {};
      if (data.option_text) updateData.option_text = data.option_text;
      if (data.sort_order) updateData.sort_order = data.sort_order;
      if (data.is_correct !== undefined) updateData.is_correct = data.is_correct ? 1 : 0;
      if (data.explanation) updateData.explanation = data.explanation;

      await knex('question_options')
        .where('id', optionId)
        .update(updateData);

      return this.findById(optionId);
    } catch (error) {
      console.error('Error in question_optionsRepo.update:', error);
      throw error;
    }
  },

  /**
   * Şığı sil
   */
  async remove(optionId) {
    try {
      return await knex('question_options')
        .where('id', optionId)
        .delete();
    } catch (error) {
      console.error('Error in question_optionsRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Bir soruya ait tüm şıkları getir
   */
  async getQuestionOptions(questionId) {
    try {
      return await knex('question_options')
        .where('question_id', questionId)
        .select('*')
        .orderBy('sort_order', 'asc');
    } catch (error) {
      console.error('Error in question_optionsRepo.getQuestionOptions:', error);
      throw error;
    }
  },

  /**
   * Doğru şığı getir
   */
  async getCorrectOption(questionId) {
    try {
      return await knex('question_options')
        .where({ question_id: questionId, is_correct: 1 })
        .first();
    } catch (error) {
      console.error('Error in question_optionsRepo.getCorrectOption:', error);
      throw error;
    }
  },

  /**
   * Şıkları sırasıyla yeniden düzenle
   */
  async reorderOptions(questionId, optionOrder) {
    try {
      for (const [index, optionId] of optionOrder.entries()) {
        await knex('question_options')
          .where({ id: optionId, question_id: questionId })
          .update({ sort_order: index + 1 });
      }

      return await this.getQuestionOptions(questionId);
    } catch (error) {
      console.error('Error in question_optionsRepo.reorderOptions:', error);
      throw error;
    }
  },

  /**
   * Cevapları karıştır (randomize edit)
   */
  async shuffleOptions(questionId) {
    try {
      const options = await this.getQuestionOptions(questionId);
      
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Yeni order'ları kayıt et
      for (const [index, option] of options.entries()) {
        await knex('question_options')
          .where('id', option.id)
          .update({ sort_order: index + 1 });
      }

      return options;
    } catch (error) {
      console.error('Error in question_optionsRepo.shuffleOptions:', error);
      throw error;
    }
  },

  /**
   * Şık seçim dağılımı (öğrenciler hangi şıkları seçti)
   */
  async getOptionUsage(optionId) {
    try {
      const usage = await knex('exam_answers')
        .where('selected_option_id', optionId)
        .count('* as count')
        .first();

      return usage?.count || 0;
    } catch (error) {
      console.error('Error in question_optionsRepo.getOptionUsage:', error);
      throw error;
    }
  }
};
