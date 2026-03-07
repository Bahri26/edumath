const knex = require('../db/knex');

module.exports = {
  /**
   * Tüm soruları listele (filtreleme ve pagination ile)
   */
  async findAll({ page = 1, limit = 10, q = null, type = null, difficulty = null, gradeLevel = null, language = null, minOptionCount = null } = {}) {
    try {
      // Helper function to apply filters
      const applyFilters = (query) => {
        if (q) query.where('content_text', 'like', '%' + q + '%');
        if (type) query.where('topic', type);
        if (difficulty) query.where('difficulty_level', difficulty);
        if (gradeLevel) {
          // Legacy data may be stored under either grade_level or class_level.
          query.where(function () {
            this.where('grade_level', gradeLevel).orWhere('class_level', gradeLevel);
          });
        }
        if (minOptionCount && Number(minOptionCount) > 0) {
          query.whereIn(
            'question_id',
            knex('question_options')
              .select('question_id')
              .groupBy('question_id')
              .havingRaw('COUNT(*) >= ?', [Number(minOptionCount)])
          );
        }
        if (language) query.where('language', language);
      };

      // Get total count
      let countQuery = knex('questions');
      applyFilters(countQuery);
      const totalCount = await countQuery.count('* as count').first();
      const total = totalCount?.count || 0;

      // Get rows with pagination
      let dataQuery = knex('questions').select('*');
      applyFilters(dataQuery);
      const rows = await dataQuery
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in questionsRepo.findAll:', error);
      // Return mock data on error
      return { rows: [], total: 0 };
    }
  },

  /**
   * Bir soruyu detayıyla getir (options dahil)
   */
  async findById(questionId) {
    try {
      const question = await knex('questions')
        .where('question_id', questionId)
        .first();

      if (!question) return null;

      // Sorunun şıklarını getir
      const options = await knex('question_options')
        .where('question_id', questionId)
        .select('*')
        .orderBy('option_order', 'asc');

      question.options = options;

      // JSON alanlarını parse et
      if (question.meta) {
        question.meta = JSON.parse(question.meta);
      }

      return question;
    } catch (error) {
      console.error('Error in questionsRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni soru oluştur
   */
  async create(data) {
    try {
      const questionData = {
        content_text: data.contentText || data.content_text,
        topic: data.topic || data.subject || null,
        points: data.points || 1,
        difficulty_level: data.difficultyLevel || data.difficulty_level,
        image_url: data.imageUrl || data.image_url || null,
        class_level: data.classLevel || data.class_level || null,
        grade_level: data.gradeLevel || data.grade_level || null,
        language: data.language || null,
        topic_id: data.topicId || data.topic_id || null,
        hint: data.hint || null,
        creator_id: data.creatorId || data.creator_id || null,
        created_at: new Date()
      };

      // Remove nullish fields so DB defaults can work where applicable.
      Object.keys(questionData).forEach((k) => {
        if (typeof questionData[k] === 'undefined') delete questionData[k];
      });

      const [questionId] = await knex('questions').insert(questionData);

      // Eğer options varsa ekle
      if (data.options && Array.isArray(data.options)) {
        for (const [index, option] of data.options.entries()) {
          await knex('question_options').insert({
            question_id: questionId,
            option_text: option.optionText || option.option_text,
            option_order: option.sortOrder || option.option_order || index + 1,
            is_correct: option.isCorrect || false
          });
        }
      }

      return this.findById(questionId);
    } catch (error) {
      console.error('Error in questionsRepo.create:', error);
      throw error;
    }
  },

  /**
   * Soruyu güncelle
   */
  async update(questionId, data) {
    try {
      const updateData = {};
      if (data.content_text) updateData.content_text = data.content_text;
      if (data.subject !== undefined) updateData.topic = data.subject;
      if (data.topic !== undefined) updateData.topic = data.topic;
      if (data.points !== undefined) updateData.points = data.points;
      if (data.difficulty_level) updateData.difficulty_level = data.difficulty_level;
      if (data.image_url !== undefined) updateData.image_url = data.image_url;
      if (data.class_level) updateData.class_level = data.class_level;
      if (data.grade_level !== undefined) updateData.grade_level = data.grade_level;
      if (data.language !== undefined) updateData.language = data.language;
      if (data.topic_id !== undefined) updateData.topic_id = data.topic_id;
      if (data.hint !== undefined) updateData.hint = data.hint;

      await knex('questions')
        .where('question_id', questionId)
        .update(updateData);

      return this.findById(questionId);
    } catch (error) {
      console.error('Error in questionsRepo.update:', error);
      throw error;
    }
  },

  /**
   * Soruyu sil
   */
  async remove(questionId) {
    try {
      // Cascading delete: options tablosu CASCADE ile silinir
      return await knex('questions')
        .where('question_id', questionId)
        .delete();
    } catch (error) {
      console.error('Error in questionsRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Sorunun tüm şıklarını getir
   */
  async getOptions(questionId) {
    try {
      const options = await knex('question_options')
        .where('question_id', questionId)
        .select('*')
        .orderBy('option_order', 'asc');

      return options;
    } catch (error) {
      console.error('Error in questionsRepo.getOptions:', error);
      throw error;
    }
  },

  /**
   * Şık ekle
   */
  async addOption(questionId, optionText, isCorrect = false, explanation = null, sortOrder = null) {
    try {
      const question = await this.findById(questionId);
      if (!question) throw new Error('Question not found');

      // Sırasını otomatik hesapla
      const maxSort = await knex('question_options')
        .where('question_id', questionId)
        .max('option_order as maxSort')
        .first();

      const order = sortOrder || (maxSort?.maxSort || 0) + 1;

      const [optionId] = await knex('question_options').insert({
        question_id: questionId,
        option_text: optionText,
        option_order: order,
        is_correct: isCorrect
      });

      return optionId;
    } catch (error) {
      console.error('Error in questionsRepo.addOption:', error);
      throw error;
    }
  },

  /**
   * Şığı sil
   */
  async removeOption(optionId) {
    try {
      return await knex('question_options')
        .where('option_id', optionId)
        .delete();
    } catch (error) {
      console.error('Error in questionsRepo.removeOption:', error);
      throw error;
    }
  },

  /**
   * Şığı güncelle
   */
  async updateOption(optionId, optionText, isCorrect = null) {
    try {
      const updateData = { option_text: optionText };
      if (isCorrect !== null) updateData.is_correct = isCorrect;

      await knex('question_options')
        .where('option_id', optionId)
        .update(updateData);

      return await knex('question_options')
        .where('option_id', optionId)
        .first();
    } catch (error) {
      console.error('Error in questionsRepo.updateOption:', error);
      throw error;
    }
  },

  /**
   * Zorluk seviyesine göre soruları getir
   */
  async findByDifficulty(level) {
    try {
      return await knex('questions')
        .where('difficulty_level', level)
        .select('*');
    } catch (error) {
      console.error('Error in questionsRepo.findByDifficulty:', error);
      throw error;
    }
  },

  /**
   * Soru tipine göre getir
   */
  async findByType(type) {
    try {
      return await knex('questions')
        .where('topic', type)
        .select('*');
    } catch (error) {
      console.error('Error in questionsRepo.findByType:', error);
      throw error;
    }
  },

  /**
   * Soruların performansını analiz et
   */
  async analyzePerformance(questionId) {
    try {
      const stats = await knex('exam_answers as ea')
        .select(
          knex.raw('COUNT(*) as total_answers'),
          knex.raw('COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct_answers'),
          knex.raw('(COUNT(CASE WHEN is_correct = 1 THEN 1 END) / COUNT(*)) * 100 as p_value'),
          knex.raw('AVG(time_spent_seconds) as avg_time')
        )
        .where('question_id', questionId)
        .first();

      return stats;
    } catch (error) {
      console.error('Error in questionsRepo.analyzePerformance:', error);
      throw error;
    }
  },

  /**
   * Toplu soru import (CSV veya JSON)
   */
  async bulkImport(questions) {
    try {
      const imported = [];

      for (const question of questions) {
        const created = await this.create(question);
        imported.push(created);
      }

      return imported;
    } catch (error) {
      console.error('Error in questionsRepo.bulkImport:', error);
      throw error;
    }
  }
};
