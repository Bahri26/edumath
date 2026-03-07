const knex = require('../db/knex');

let optionMetaCache = null;

async function getOptionMeta() {
  if (optionMetaCache) return optionMetaCache;

  const info = await knex('question_options').columnInfo();
  const cols = new Set(Object.keys(info || {}));

  optionMetaCache = {
    pk: cols.has('option_id') ? 'option_id' : 'id',
    order: cols.has('option_order') ? 'option_order' : 'sort_order',
    createdAt: cols.has('created_at') ? 'created_at' : null,
    hasExplanation: cols.has('explanation')
  };

  return optionMetaCache;
}

module.exports = {
  /**
   * Tüm şıkları listele
   */
  async findAll({ page = 1, limit = 10, questionId = null } = {}) {
    try {
      const meta = await getOptionMeta();
      let query = knex('question_options').select('*');

      if (questionId) query.where('question_id', questionId);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy(meta.order, 'asc')
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
      const meta = await getOptionMeta();
      return await knex('question_options')
        .where(meta.pk, optionId)
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
      const meta = await getOptionMeta();
      const [optionId] = await knex('question_options').insert({
        question_id: data.questionId || data.question_id,
        option_text: data.optionText || data.option_text,
        [meta.order]: data.optionOrder || data.option_order || data.sortOrder || data.sort_order || 1,
        is_correct: data.isCorrect ? 1 : 0,
        ...(meta.hasExplanation ? { explanation: data.explanation } : {}),
        ...(meta.createdAt ? { [meta.createdAt]: new Date() } : {})
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
      const meta = await getOptionMeta();
      const updateData = {};
      if (data.option_text) updateData.option_text = data.option_text;
      if (data.option_order || data.sort_order) updateData[meta.order] = data.option_order || data.sort_order;
      if (data.is_correct !== undefined) updateData.is_correct = data.is_correct ? 1 : 0;
      if (meta.hasExplanation && data.explanation !== undefined) updateData.explanation = data.explanation;

      await knex('question_options')
        .where(meta.pk, optionId)
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
      const meta = await getOptionMeta();
      return await knex('question_options')
        .where(meta.pk, optionId)
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
      const meta = await getOptionMeta();
      return await knex('question_options')
        .where('question_id', questionId)
        .select('*')
        .orderBy(meta.order, 'asc');
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
      const meta = await getOptionMeta();
      for (const [index, optionId] of optionOrder.entries()) {
        await knex('question_options')
          .where({ [meta.pk]: optionId, question_id: questionId })
          .update({ [meta.order]: index + 1 });
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
      const meta = await getOptionMeta();
      const options = await this.getQuestionOptions(questionId);
      
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }

      // Yeni order'ları kayıt et
      for (const [index, option] of options.entries()) {
        await knex('question_options')
          .where(meta.pk, option[meta.pk])
          .update({ [meta.order]: index + 1 });
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
