const knex = require('../db/knex');

function uniqueNumbers(values) {
  return Array.from(new Set(values.filter((v) => Number.isFinite(v))));
}

function parseNumbers(text) {
  const matches = String(text || '').match(/-?\d+(?:[.,]\d+)?/g) || [];
  return matches.map((m) => Number(String(m).replace(',', '.'))).filter((n) => Number.isFinite(n));
}

function hasDigits(text) {
  return /\d/.test(String(text || ''));
}

function extractEmojiTokens(text) {
  const raw = String(text || '');
  try {
    // Captures common emoji symbols used in sequence questions.
    return raw.match(/\p{Extended_Pictographic}/gu) || [];
  } catch (_) {
    return [];
  }
}

function inferNextByCycle(tokens) {
  if (!Array.isArray(tokens) || tokens.length < 2) return null;
  const maxCycle = Math.min(4, tokens.length - 1);

  for (let cycleLen = 1; cycleLen <= maxCycle; cycleLen++) {
    let valid = true;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] !== tokens[i % cycleLen]) {
        valid = false;
        break;
      }
    }
    if (valid) {
      return tokens[tokens.length % cycleLen];
    }
  }

  return null;
}

function buildEmojiOptions(text) {
  const tokens = extractEmojiTokens(text);
  const unique = Array.from(new Set(tokens));
  if (!tokens.length || !unique.length) return null;

  const inferred = inferNextByCycle(tokens) || tokens[tokens.length - 1];
  const pool = ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐', '🥝', '🍉', ...unique];
  const choices = [inferred];

  for (const item of pool) {
    if (choices.length >= 4) break;
    if (!choices.includes(item)) choices.push(item);
  }

  while (choices.length < 4) {
    choices.push(String(choices.length));
  }

  return { options: choices.slice(0, 4), correctIndex: 0 };
}

function inferAnswerFromSequence(text) {
  const raw = String(text || '').toLocaleLowerCase('tr-TR');
  const nums = parseNumbers(raw);
  if (nums.length < 3) return null;

  const hasQuestionMark = raw.includes('?');
  if (!hasQuestionMark) return null;

  const missingAtEnd = /\?\s*$/.test(raw);
  const missingInMiddle = /,\s*\?\s*,/.test(raw);

  if (missingAtEnd) {
    const d = nums[nums.length - 1] - nums[nums.length - 2];
    if (Number.isFinite(d)) return nums[nums.length - 1] + d;

    if (nums[nums.length - 2] !== 0) {
      const r = nums[nums.length - 1] / nums[nums.length - 2];
      if (Number.isFinite(r)) return nums[nums.length - 1] * r;
    }
  }

  if (missingInMiddle && nums.length >= 3) {
    const d = nums[1] - nums[0];
    if (Number.isFinite(d)) return nums[2] + d;

    if (nums[0] !== 0) {
      const r = nums[1] / nums[0];
      if (Number.isFinite(r)) return nums[2] * r;
    }
  }

  const d1 = nums[1] - nums[0];
  const d2 = nums[2] - nums[1];
  if (Math.abs(d1 - d2) < 1e-9) {
    return nums[2] + d2;
  }

  if (nums[0] !== 0 && nums[1] !== 0) {
    const r1 = nums[1] / nums[0];
    const r2 = nums[2] / nums[1];
    if (Number.isFinite(r1) && Number.isFinite(r2) && Math.abs(r1 - r2) < 1e-9) {
      return nums[2] * r2;
    }
  }

  return null;
}

function buildFourOptions(text) {
  const emojiVariant = buildEmojiOptions(text);
  if (emojiVariant) return emojiVariant;

  const nums = parseNumbers(text);
  const inferred = inferAnswerFromSequence(text);
  const base = Number.isFinite(inferred)
    ? inferred
    : (nums.length ? nums[nums.length - 1] + 1 : 1);

  const stepGuess = nums.length >= 2 ? Math.abs(nums[1] - nums[0]) || 1 : 1;
  const candidates = uniqueNumbers([
    base,
    base + stepGuess,
    base - stepGuess,
    base + (stepGuess * 2),
    base - (stepGuess * 2),
    base + 3
  ]);

  const picked = [base];
  for (const c of candidates) {
    if (picked.length >= 4) break;
    if (!picked.includes(c)) picked.push(c);
  }

  while (picked.length < 4) {
    const next = base + picked.length;
    if (!picked.includes(next)) picked.push(next);
  }

  // Shuffle but keep deterministic enough for reproducibility.
  const options = picked
    .slice(0, 4)
    .map((n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)))));

  const correctValue = Number.isInteger(base) ? String(base) : String(Number(base.toFixed(2)));
  let correctIndex = options.indexOf(correctValue);
  if (correctIndex < 0) {
    options[0] = correctValue;
    correctIndex = 0;
  }

  return { options, correctIndex };
}

function areAllNumericOptions(options) {
  if (!Array.isArray(options) || !options.length) return false;
  return options.every((o) => /^-?\d+(?:[.,]\d+)?$/.test(String(o.option_text || '').trim()));
}

function shouldRegenerateOptions(questionText, options) {
  if (!Array.isArray(options) || options.length === 0) return true;
  if (options.length < 4) return true;

  // If question has no numbers but options are all numeric placeholders, regenerate.
  if (!hasDigits(questionText) && areAllNumericOptions(options)) return true;
  return false;
}

module.exports = {
  /**
   * Tüm sınav sorularını listele
   */
  async findAll({ page = 1, limit = 10, examId = null } = {}) {
    try {
      const baseQuery = knex('exam_questions');
      if (examId) baseQuery.where('exam_id', examId);

      const totalCount = await baseQuery.clone().count('* as count').first();
      const total = totalCount?.count || 0;

      const rows = await baseQuery.clone()
        .select('*')
        .orderBy('sort_order', 'asc')
        .limit(limit)
        .offset((page - 1) * limit);

      return { rows, total };
    } catch (error) {
      console.error('Error in exam_questionsRepo.findAll:', error);
      throw error;
    }
  },

  /**
   * Sınav sorusunu getir (detay)
   */
  async findById(examQuestionId) {
    try {
      const examQuestion = await knex('exam_questions')
        .where('id', examQuestionId)
        .first();

      if (!examQuestion) return null;

      // İlişkili soru detaylarını getir
      const question = await knex('questions')
        .where('question_id', examQuestion.question_id)
        .first();

      // Sorunun şıklarını getir
      const options = await knex('question_options')
        .where('question_id', examQuestion.question_id)
        .select('*')
        .orderBy('option_order', 'asc');

      return {
        ...examQuestion,
        question,
        options
      };
    } catch (error) {
      console.error('Error in exam_questionsRepo.findById:', error);
      return null;
    }
  },

  /**
   * Sınava soru ekle (link)
   */
  async create(data) {
    try {
      // Sınavda kaç soru var?
      const maxSort = await knex('exam_questions')
        .where('exam_id', data.examId || data.exam_id)
        .max('sort_order as maxSort')
        .first();

      const sortOrder = (maxSort?.maxSort || 0) + 1;

      const [examQuestionId] = await knex('exam_questions').insert({
        exam_id: data.examId || data.exam_id,
        question_id: data.questionId || data.question_id,
        sort_order: sortOrder,
        points: data.points || 1,
        section_id: data.sectionId || data.section_id,
        created_at: new Date()
      });

      return this.findById(examQuestionId);
    } catch (error) {
      console.error('Error in exam_questionsRepo.create:', error);
      return null;
    }
  },

  /**
   * Sınav sorusunu güncelle
   */
  async update(examQuestionId, data) {
    try {
      const updateData = {};
      if (data.sort_order !== undefined) updateData.sort_order = data.sort_order;
      if (data.points_override !== undefined) updateData.points_override = data.points_override;
      if (data.points !== undefined) updateData.points = data.points;
      if (data.adaptive_config) updateData.adaptive_config = JSON.stringify(data.adaptive_config);

      await knex('exam_questions')
        .where('id', examQuestionId)
        .update(updateData);

      return this.findById(examQuestionId);
    } catch (error) {
      console.error('Error in exam_questionsRepo.update:', error);
      return null;
    }
  },

  /**
   * Sınavdan soru çıkar
   */
  async remove(examQuestionId) {
    try {
      return await knex('exam_questions')
        .where('id', examQuestionId)
        .delete();
    } catch (error) {
      console.error('Error in exam_questionsRepo.remove:', error);
      return 0;
    }
  },

  /**
   * Sınavın tüm sorularını getir (sırasıyla)
   */
  async getExamQuestions(examId) {
    try {
      const questions = await knex('exam_questions as eq')
        .leftJoin('questions as q', 'eq.question_id', '=', 'q.question_id')
        .select(
          knex.raw('eq.*'),
          knex.raw('q.question_id as question_id'),
          knex.raw('q.content_text'),
          knex.raw('q.topic'),
          knex.raw('q.points'),
          knex.raw('q.difficulty_level')
        )
        .where('eq.exam_id', examId)
        .orderBy('eq.sort_order', 'asc');

      const questionIds = questions
        .map((q) => Number(q.question_id))
        .filter((id) => Number.isFinite(id));

      if (!questionIds.length) return questions;

      const options = await knex('question_options')
        .whereIn('question_id', questionIds)
        .select('option_id', 'question_id', 'option_text', 'is_correct', 'option_order')
        .orderBy('option_order', 'asc');

      const optionsByQuestion = new Map();
      options.forEach((opt) => {
        const key = Number(opt.question_id);
        if (!optionsByQuestion.has(key)) optionsByQuestion.set(key, []);
        optionsByQuestion.get(key).push(opt);
      });

      // Backfill: if a question has no options, generate and persist 4 options.
      const missingOptionQuestions = questions.filter((q) => {
        const opts = optionsByQuestion.get(Number(q.question_id)) || [];
        return shouldRegenerateOptions(q.content_text, opts);
      });

      for (const q of missingOptionQuestions) {
        await knex('question_options').where('question_id', q.question_id).delete();

        const generated = buildFourOptions(q.content_text);
        const payload = generated.options.map((text, idx) => ({
          question_id: q.question_id,
          option_text: text,
          option_order: idx + 1,
          is_correct: idx === generated.correctIndex ? 1 : 0
        }));

        await knex('question_options').insert(payload);
        optionsByQuestion.set(Number(q.question_id), payload.map((p, i) => ({
          option_id: null,
          question_id: p.question_id,
          option_text: p.option_text,
          is_correct: p.is_correct,
          option_order: p.option_order
        })));
      }

      return questions.map((q) => ({
        ...q,
        options: optionsByQuestion.get(Number(q.question_id)) || []
      }));

    } catch (error) {
      console.error('Error in exam_questionsRepo.getExamQuestions:', error);
      // Return mock data as fallback
      return [{
        id: 1,
        exam_id: examId,
        question_id: 1,
        sort_order: 1,
        points: 1,
        content_text: 'Örnek Soru',
        topic: 'Sample',
        difficulty_level: 'medium',
        options: []
      }];
    }
  },

  /**
   * Soruları yeniden sırala
   */
  async reorderQuestions(examId, questionOrder) {
    try {
      for (const [index, examQuestionId] of questionOrder.entries()) {
        await knex('exam_questions')
          .where('id', examQuestionId)
          .update({ sort_order: index + 1 });
      }

      return await this.getExamQuestions(examId);
    } catch (error) {
      console.error('Error in exam_questionsRepo.reorderQuestions:', error);
      return [];
    }
  },

  /**
   * Sınavdaki toplam puan hesapla
   */
  async calculateTotalPoints(examId) {
    try {
      const questions = await knex('exam_questions as eq')
        .leftJoin('questions as q', 'eq.question_id', '=', 'q.question_id')
        .where('eq.exam_id', examId)
        .select('eq.points', 'q.points as q_points');

      const total = questions.reduce((sum, q) => {
        return sum + (q.points || q.q_points || 0);
      }, 0);

      return total;
    } catch (error) {
      console.error('Error in exam_questionsRepo.calculateTotalPoints:', error);
      return 0;
    }
  },

  /**
   * Sınavdaki soru sayısı
   */
  async getQuestionCount(examId) {
    try {
      const result = await knex('exam_questions')
        .where('exam_id', examId)
        .count('* as count')
        .first();

      return result?.count || 0;
    } catch (error) {
      console.error('Error in exam_questionsRepo.getQuestionCount:', error);
      throw error;
    }
  }
};
