const knex = require('../db/knex');

let attemptsColumnsCache = null;
let answersColumnsCache = null;

async function getAttemptsColumns() {
  if (attemptsColumnsCache) return attemptsColumnsCache;
  const info = await knex('student_exam_attempts').columnInfo();
  attemptsColumnsCache = new Set(Object.keys(info || {}));
  return attemptsColumnsCache;
}

async function getAnswersColumns() {
  if (answersColumnsCache) return answersColumnsCache;
  const info = await knex('exam_answers').columnInfo();
  answersColumnsCache = new Set(Object.keys(info || {}));
  return answersColumnsCache;
}

async function getAttemptsColumnMap() {
  const cols = await getAttemptsColumns();
  return {
    pk: cols.has('attempt_id') ? 'attempt_id' : 'id',
    actor: cols.has('user_id') ? 'user_id' : 'student_id',
    percentage: cols.has('percentage') ? 'percentage' : (cols.has('percentage_score') ? 'percentage_score' : null),
    score: cols.has('score') ? 'score' : (cols.has('total_score') ? 'total_score' : null),
    passed: cols.has('passed') ? 'passed' : (cols.has('is_passed') ? 'is_passed' : null),
    feedback: cols.has('teacher_feedback') ? 'teacher_feedback' : (cols.has('remarks') ? 'remarks' : null)
  };
}

async function getAnswersColumnMap() {
  const cols = await getAnswersColumns();
  return {
    pk: cols.has('answer_id') ? 'answer_id' : 'id',
    answerText: cols.has('student_answer') ? 'student_answer' : (cols.has('answer_text') ? 'answer_text' : null),
    hasExamQuestionId: cols.has('exam_question_id'),
    hasTimeSpent: cols.has('time_spent_seconds'),
    hasAnswerSequence: cols.has('answer_sequence'),
    hasExamId: cols.has('exam_id'),
    hasFeedback: cols.has('teacher_feedback') || cols.has('feedback')
  };
}

module.exports = {
  /**
   * Tüm exam denemelerini listele
   */
  async findAll({ page = 1, limit = 10, examId = null, studentId = null, userId = null, status = null } = {}) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      let query = knex('student_exam_attempts').select('*');

      if (examId) query.where('exam_id', examId);
      if (studentId) query.where('student_id', studentId);
      if (userId) query.where(attemptMap.actor, userId);
      if (status) query.where('status', status);

      const totalCount = await query.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await query
        .orderBy('submitted_at', 'desc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Bir denemeyı detayıyla getir (tüm cevapları da getir)
   */
  async findById(attemptId) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const attempt = await knex('student_exam_attempts')
        .where(attemptMap.pk, attemptId)
        .first();

      if (!attempt) return null;

      // Bu denemede verilen tüm cevapları getir
      const answers = await knex('exam_answers')
        .where('attempt_id', attemptId)
        .select('*');

      attempt.answers = answers;
      return attempt;
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.findById:', error);
      throw error;
    }
  },

  /**
   * Yeni sınav denemesi başlat (CREATE)
   */
  async create({ examId, studentId, userId }) {
    try {
      if (!examId || !studentId || !userId) {
        throw new Error('examId, studentId, userId gerekli');
      }

      const attemptMap = await getAttemptsColumnMap();

      const insertData = {
        exam_id: examId,
        student_id: studentId,
        started_at: new Date(),
        status: 'in_progress',
        created_at: new Date()
      };

      // Some schemas keep actor in user_id, others in student_id.
      if (attemptMap.actor === 'user_id') {
        insertData.user_id = userId;
      }

      const [attemptId] = await knex('student_exam_attempts').insert(insertData);

      return this.findById(attemptId);
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.create:', error);
      throw error;
    }
  },

  /**
   * Denemede cevap kayıt et
   */
  async recordAnswer(attemptId, questionId, examQuestionId, studentAnswer, selectedOptionId, isCorrect, pointsEarned, timeSpent) {
    try {
      const answerMap = await getAnswersColumnMap();

      // Denemede kaça kaçıncı cevap
      let sequence = 1;
      if (answerMap.hasAnswerSequence) {
        const lastSequence = await knex('exam_answers')
          .where('attempt_id', attemptId)
          .max('answer_sequence as maxSeq')
          .first();
        sequence = (lastSequence?.maxSeq || 0) + 1;
      }

      const answerPayload = {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect ? 1 : 0,
        points_earned: pointsEarned,
        answered_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      };

      if (answerMap.answerText) answerPayload[answerMap.answerText] = studentAnswer;
      if (answerMap.hasExamQuestionId) answerPayload.exam_question_id = examQuestionId;
      if (answerMap.hasTimeSpent) answerPayload.time_spent_seconds = timeSpent || 0;
      if (answerMap.hasAnswerSequence) answerPayload.answer_sequence = sequence;

      if (answerMap.hasExamId) {
        const attempt = await knex('student_exam_attempts').where((await getAttemptsColumnMap()).pk, attemptId).first('exam_id');
        answerPayload.exam_id = attempt?.exam_id || null;
      }

      const existing = await knex('exam_answers')
        .where({ attempt_id: attemptId, question_id: questionId })
        .first(answerMap.pk);

      let answerId;
      if (existing?.[answerMap.pk]) {
        answerId = existing[answerMap.pk];
        await knex('exam_answers')
          .where(answerMap.pk, answerId)
          .update(answerPayload);
      } else {
        const inserted = await knex('exam_answers').insert(answerPayload);
        answerId = Array.isArray(inserted) ? inserted[0] : inserted;
      }

      return answerId;
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.recordAnswer:', error);
      throw error;
    }
  },

  /**
   * Denemede cevap güncelle (kısmi işaretleme, düzeltme, vb.)
   */
  async updateAnswer(answerId, studentAnswer, selectedOptionId = null, isCorrect = null, pointsEarned = null) {
    try {
      const updateData = { student_answer: studentAnswer };
      if (selectedOptionId) updateData.selected_option_id = selectedOptionId;
      if (isCorrect !== null) updateData.is_correct = isCorrect ? 1 : 0;
      if (pointsEarned !== null) updateData.points_earned = pointsEarned;

      await knex('exam_answers')
        .where('answer_id', answerId)
        .update(updateData);

      return await knex('exam_answers')
        .where('answer_id', answerId)
        .first();
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.updateAnswer:', error);
      throw error;
    }
  },

  /**
   * Denemede cevap sil
   */
  async removeAnswer(answerId) {
    try {
      return await knex('exam_answers')
        .where('answer_id', answerId)
        .delete();
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.removeAnswer:', error);
      throw error;
    }
  },

  /**
   * Sınavı teslim et (SUBMIT)
   */
  async submitAttempt(attemptId, autoSave = false) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const attempt = await this.findById(attemptId);
      if (!attempt) throw new Error('Attempt not found');

      // Tüm cevapların puanını hesapla
      const answers = await knex('exam_answers')
        .where('attempt_id', attemptId)
        .select('points_earned');

      const totalScore = answers.reduce((sum, ans) => sum + (ans.points_earned || 0), 0);

      // Sınavın toplam puanını al
      const exam = await knex('exams')
        .where('exam_id', attempt.exam_id)
        .first();

      let maxPoints = Number(exam?.total_points || 0);
      if (!maxPoints) {
        const sumRow = await knex('exam_questions')
          .where('exam_id', attempt.exam_id)
          .sum({ total: 'points' })
          .first();

        const summedPoints = Number(sumRow?.total || 0);
        if (Number.isFinite(summedPoints) && summedPoints > 0) {
          maxPoints = summedPoints;
        }
      }

      if (!maxPoints) {
        const qCount = await knex('exam_questions').where('exam_id', attempt.exam_id).count('* as c').first();
        maxPoints = Number(qCount?.c || answers.length || 1);
      }
      const passingScore = Number(exam?.passing_score || 50);
      const percentage = maxPoints > 0 ? (totalScore / maxPoints) * 100 : 0;
      const passed = percentage >= passingScore;

      const updateData = {
        submitted_at: new Date(),
        status: autoSave ? 'in_progress' : 'submitted',
        updated_at: new Date()
      };

      if (attemptMap.score) updateData[attemptMap.score] = totalScore;
      if (attemptMap.percentage) updateData[attemptMap.percentage] = Math.round(percentage);
      if (attemptMap.passed) updateData[attemptMap.passed] = passed ? 1 : 0;
      if ((await getAttemptsColumns()).has('grade')) updateData.grade = this._calculateGrade(percentage);

      await knex('student_exam_attempts')
        .where(attemptMap.pk, attemptId)
        .update(updateData);

      return this.findById(attemptId);
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.submitAttempt:', error);
      throw error;
    }
  },

  /**
   * Denemeli puan ve durumu güncelle (öğretmen puanlama için)
   */
  async gradeAttempt(attemptId, teacherFeedback = null) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const attemptCols = await getAttemptsColumns();
      const answers = await knex('exam_answers')
        .where('attempt_id', attemptId)
        .select('points_earned');

      const totalScore = answers.reduce((sum, ans) => sum + (ans.points_earned || 0), 0);

      const attempt = await this.findById(attemptId);
      const exam = await knex('exams')
        .where('exam_id', attempt.exam_id)
        .first();

      let maxPoints = Number(exam?.total_points || 0);
      if (!maxPoints) {
        const sumRow = await knex('exam_questions')
          .where('exam_id', attempt.exam_id)
          .sum({ total: 'points' })
          .first();

        const summedPoints = Number(sumRow?.total || 0);
        if (Number.isFinite(summedPoints) && summedPoints > 0) {
          maxPoints = summedPoints;
        }
      }

      if (!maxPoints) {
        const qCount = await knex('exam_questions').where('exam_id', attempt.exam_id).count('* as c').first();
        maxPoints = Number(qCount?.c || answers.length || 1);
      }
      const passingScore = Number(exam?.passing_score || 50);
      const percentage = maxPoints > 0 ? (totalScore / maxPoints) * 100 : 0;

      const updateData = {
        status: 'graded',
        graded_at: new Date(),
        updated_at: new Date()
      };

      if (attemptMap.score) updateData[attemptMap.score] = totalScore;
      if (attemptMap.percentage) updateData[attemptMap.percentage] = Math.round(percentage);
      if (attemptMap.passed) updateData[attemptMap.passed] = percentage >= passingScore ? 1 : 0;
      if (attemptCols.has('grade')) updateData.grade = this._calculateGrade(percentage);
      if (attemptMap.feedback && teacherFeedback !== null) updateData[attemptMap.feedback] = teacherFeedback;

      await knex('student_exam_attempts')
        .where(attemptMap.pk, attemptId)
        .update(updateData);

      return this.findById(attemptId);
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.gradeAttempt:', error);
      throw error;
    }
  },

  /**
   * Denemeler arasında en yüksek skoru getir
   */
  async getHighestScore(examId, studentId) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const highest = await knex('student_exam_attempts')
        .select('*')
        .where({ exam_id: examId, student_id: studentId })
        .where('status', 'graded')
        .orderBy(attemptMap.score || attemptMap.percentage || 'updated_at', 'desc')
        .limit(1)
        .first();

      return highest;
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.getHighestScore:', error);
      throw error;
    }
  },

  /**
   * Öğrenci denemelerinin ortalamasını al
   */
  async getAverageScore(examId, studentId) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const avg = await knex('student_exam_attempts')
        .where({ exam_id: examId, student_id: studentId })
        .where('status', 'graded')
        .avg(`${attemptMap.percentage || 'percentage_score'} as avgPercentage`)
        .first();

      return avg?.avgPercentage || 0;
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.getAverageScore:', error);
      throw error;
    }
  },

  /**
   * Sınıf denemesi istatistikleri
   */
  async getClassStats(examId) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const percentageCol = attemptMap.percentage || 'percentage_score';
      const passedCol = attemptMap.passed || 'is_passed';
      const stats = await knex('student_exam_attempts')
        .where('exam_id', examId)
        .where('status', 'graded')
        .select(
          knex.raw('COUNT(*) as total_attempts'),
          knex.raw(`AVG(${percentageCol}) as avg_percentage`),
          knex.raw(`MIN(${percentageCol}) as min_percentage`),
          knex.raw(`MAX(${percentageCol}) as max_percentage`),
          knex.raw(`STDDEV(${percentageCol}) as stddev_percentage`),
          knex.raw(`COUNT(CASE WHEN ${passedCol} = 1 THEN 1 END) as passed_count`)
        )
        .first();

      return stats;
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.getClassStats:', error);
      throw error;
    }
  },

  /**
   * Denemenin zaman analizi
   */
  async getTimeAnalysis(attemptId) {
    try {
      const answers = await knex('exam_answers')
        .where('attempt_id', attemptId)
        .select('time_spent_seconds', 'question_id')
        .orderBy('answer_sequence', 'asc');

      const totalTime = answers.reduce((sum, ans) => sum + (ans.time_spent_seconds || 0), 0);
      const avgTimePerQuestion = Math.round(totalTime / answers.length);

      return {
        total_time_seconds: totalTime,
        avg_time_per_question: avgTimePerQuestion,
        question_breakdown: answers
      };
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.getTimeAnalysis:', error);
      throw error;
    }
  },

  /**
   * Deneme geçerliliğini iptal et (revoke)
   */
  async revokeAttempt(attemptId, reason = null) {
    try {
      const attemptMap = await getAttemptsColumnMap();
      const cols = await getAttemptsColumns();
      const updateData = {
        status: 'revoked',
        updated_at: new Date()
      };
      if (cols.has('revoke_reason')) updateData.revoke_reason = reason;
      if (cols.has('revoked_at')) updateData.revoked_at = new Date();

      await knex('student_exam_attempts')
        .where(attemptMap.pk, attemptId)
        .update(updateData);

      return this.findById(attemptId);
    } catch (error) {
      console.error('Error in student_exam_attemptsRepo.revokeAttempt:', error);
      throw error;
    }
  },

  // Helper: Not hesapla
  _calculateGrade(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
};
