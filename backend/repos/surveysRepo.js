const knex = require('../db/knex');

module.exports = {
  /**
   * Tüm anketleri listele
   */
  async findAll({ page = 1, limit = 10, courseId = null, teacherId = null, q = null } = {}) {
    try {
      let query = knex('surveys').select('*');

      if (courseId) query.where('course_id', courseId);
      if (teacherId) query.where('teacher_id', teacherId);
      if (q) query.where('title', 'like', '%' + q + '%');

      // Count: create separate query to avoid GROUP BY issues
      const countQuery = query.clone().clearSelect();
      const totalResult = await countQuery.count('survey_id as count').first();
      const total = totalResult?.count || 0;

      const rows = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in surveysRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir anketi detayıyla getir
   */
  async findById(surveyId) {
    try {
      const survey = await knex('surveys')
        .where('survey_id', surveyId)
        .first();

      if (!survey && survey.settings) {
        survey.settings = JSON.parse(survey.settings);
      }

      return survey;
    } catch (error) {
      console.error('Error in surveysRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni anket oluştur
   */
  async create(data) {
    try {
      const [surveyId] = await knex('surveys').insert({
        title: data.title,
        description: data.description,
        course_id: data.courseId || data.course_id,
        teacher_id: data.teacherId || data.teacher_id,
        start_date: data.startDate || data.start_date,
        end_date: data.endDate || data.end_date,
        is_anonymous: data.isAnonymous || data.is_anonymous || false,
        settings: data.settings ? JSON.stringify(data.settings) : null,
        created_at: new Date(),
        updated_at: new Date()
      });

      return this.findById(surveyId);
    } catch (error) {
      console.error('Error in surveysRepo.create:', error);
      throw error;
    }
  },

  /**
   * Anketi güncelle
   */
  async update(surveyId, data) {
    try {
      const updateData = {};
      if (data.title) updateData.title = data.title;
      if (data.description) updateData.description = data.description;
      if (data.start_date) updateData.start_date = data.start_date;
      if (data.end_date) updateData.end_date = data.end_date;
      if (data.is_anonymous !== undefined) updateData.is_anonymous = data.is_anonymous;
      if (data.settings) updateData.settings = JSON.stringify(data.settings);

      updateData.updated_at = new Date();

      await knex('surveys')
        .where('survey_id', surveyId)
        .update(updateData);

      return this.findById(surveyId);
    } catch (error) {
      console.error('Error in surveysRepo.update:', error);
      throw error;
    }
  },

  /**
   * Anketi sil
   */
  async remove(surveyId) {
    try {
      return await knex('surveys')
        .where('survey_id', surveyId)
        .delete();
    } catch (error) {
      console.error('Error in surveysRepo.remove:', error);
      throw error;
    }
  },

  /**
   * Anketin tüm sorularını getir
   */
  async getQuestions(surveyId) {
    try {
      const questions = await knex('survey_questions')
        .where('survey_id', surveyId)
        .select('*')
        .orderBy('sort_order', 'asc');

      // JSON alanlarını parse et
      return questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }));
    } catch (error) {
      console.error('Error in surveysRepo.getQuestions:', error);
      throw error;
    }
  },

  /**
   * Anketin tüm cevaplarını getir
   */
  async getResponses(surveyId) {
    try {
      const responses = await knex('survey_responses as sr')
        .join('survey_responses as sa', 'sr.response_id', 'sa.response_id')
        .select(
          'sr.response_id',
          'sr.survey_id',
          'sr.user_id',
          'sr.created_at',
          'sa.answer_id',
          'sa.question_id',
          'sa.answer'
        )
        .where('sr.survey_id', surveyId)
        .orderBy('sr.created_at', 'desc');

      return responses;
    } catch (error) {
      console.error('Error in surveysRepo.getResponses:', error);
      throw error;
    }
  },

  /**
   * Anket cevap oranını hesapla
   */
  async getResponseRate(surveyId) {
    try {
      const totalInvited = 100; // Bu sayı course_enrollments'ten gelmeli
      const totalResponses = await knex('survey_responses')
        .where('survey_id', surveyId)
        .count('* as count')
        .first();

      const rate = (totalResponses.count / totalInvited) * 100;

      return {
        total_invited: totalInvited,
        total_responses: totalResponses.count,
        response_rate: rate
      };
    } catch (error) {
      console.error('Error in surveysRepo.getResponseRate:', error);
      throw error;
    }
  },

  /**
   * Anket cevaplarını analiz et (istatistik)
   */
  async analyzeResponses(surveyId) {
    try {
      const questions = await this.getQuestions(surveyId);
      const analysis = {};

      for (const question of questions) {
        const answers = await knex('survey_responses')
          .where('question_id', question.id)
          .select('answer');

        analysis[question.id] = {
          question_text: question.question_text,
          total_responses: answers.length,
          // question_type'a göre analiz
          responses: answers
        };
      }

      return analysis;
    } catch (error) {
      console.error('Error in surveysRepo.analyzeResponses:', error);
      throw error;
    }
  },

  /**
   * Anket cevaplarını gönder (submit)
   */
  async submitResponse(surveyId, userId, questionAnswers) {
    try {
      // survey_responses'a kayıt
      const [responseId] = await knex('survey_responses').insert({
        survey_id: surveyId,
        user_id: userId || null,
        created_at: new Date(),
        created_at: new Date()
      });

      // Her soru için cevap kayıt et
      for (const { questionId, answer } of questionAnswers) {
        await knex('survey_responses').insert({
          response_id: responseId,
          question_id: questionId,
          answer: answer,
          created_at: new Date()
        });
      }

      return { response_id: responseId, created_at: new Date() };
    } catch (error) {
      console.error('Error in surveysRepo.submitResponse:', error);
      throw error;
    }
  },

  /**
   * Anketi CSV/JSON olarak export et
   */
  async exportResponses(surveyId, format = 'json') {
    try {
      const survey = await this.findById(surveyId);
      const questions = await this.getQuestions(surveyId);
      const responses = await this.getResponses(surveyId);

      const exportData = {
        survey: {
          id: survey.survey_id,
          title: survey.title,
          description: survey.description,
          exported_at: new Date()
        },
        questions: questions,
        responses: responses
      };

      if (format === 'csv') {
        // CSV formatına dönüştür (basit versyon)
        return convertToCSV(exportData);
      }

      return exportData; // JSON
    } catch (error) {
      console.error('Error in surveysRepo.exportResponses:', error);
      throw error;
    }
  }
};

// CSV dönüştürme helper fonksiyonu
function convertToCSV(data) {
  // Basit CSV dönüştürmesi
  let csv = 'Survey Title,' + data.survey.title + '\n';
  csv += 'Exported At,' + data.survey.exported_at + '\n\n';
  csv += 'Question ID, Question Text, Answer Count\n';

  for (const response of data.responses) {
    csv += response.question_id + ',' + response.answer + '\n';
  }

  return csv;
}
