const knex = require('../db/knex');
const mammoth = require('mammoth');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getAuthUserId(req) {
  return Number(req.user?.id || req.user?.user_id || req.user?.dbUser?.user_id || 0) || null;
}

function cleanQuestionText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function parseJsonFromModelText(rawText) {
  const text = String(rawText || '').trim();
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleaned);
}

function fallbackSurveyFromText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const title = lines[0] ? lines[0].slice(0, 150) : 'Word Dosyasindan Otomatik Anket';
  const questionCandidates = lines.filter((line) => /\?|^\d+[.)\-\s]/.test(line));
  const questions = questionCandidates
    .map((line) => line.replace(/^\d+[.)\-\s]+/, '').trim())
    .filter((line) => line.length >= 4)
    .slice(0, 30);

  if (!questions.length) {
    questions.push('Bu içerik hakkında genel değerlendirmeniz nedir?');
    questions.push('Sizin için en faydalı bölüm hangisiydi?');
    questions.push('Geliştirilmesini istediğiniz konu var mı?');
  }

  return {
    title,
    description: 'Word belgesinden otomatik olusturulan anket.',
    questions
  };
}

async function extractSurveyDraftWithAI(sourceText) {
  if (!GEMINI_API_KEY) return fallbackSurveyFromText(sourceText);

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const prompt = `Asagidaki metinden bir anket taslagi olustur.
Cevap dili: Turkce.
Sadece JSON dondur.
JSON semasi:
{
  "title": "max 150 karakter",
  "description": "max 1000 karakter",
  "questions": ["soru1", "soru2"]
}
Kurallar:
- En az 3 en fazla 25 soru uret.
- Sorular net ve anlasilir olsun.
- Tekrarlayan soru olmasin.
- Metin anket yapisinda degilse yine de uygun bir anket cikar.

Metin:
${String(sourceText || '').slice(0, 20000)}`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });
    const parsed = parseJsonFromModelText(response?.text || '');
    const title = String(parsed?.title || '').trim() || 'Word Dosyasindan Otomatik Anket';
    const description = String(parsed?.description || '').trim() || 'Word belgesinden otomatik olusturulan anket.';
    const questions = Array.isArray(parsed?.questions)
      ? parsed.questions.map(cleanQuestionText).filter((q) => q.length >= 4).slice(0, 30)
      : [];

    if (!questions.length) return fallbackSurveyFromText(sourceText);
    return { title, description, questions };
  } catch (_) {
    return fallbackSurveyFromText(sourceText);
  }
}

async function createSurveyWithQuestions({ title, description, creatorId, questions = [] }) {
  const trx = await knex.transaction();
  try {
    const payload = {
      title: String(title || '').trim(),
      description: String(description || '').trim() || null,
      creator_id: creatorId,
      is_active: 1,
      created_at: new Date(),
      view_count: 0
    };

    if (!payload.title) {
      await trx.rollback();
      throw new Error('title is required');
    }

    const [surveyId] = await trx('surveys').insert(payload);

    const normalizedQuestions = (Array.isArray(questions) ? questions : [])
      .map(cleanQuestionText)
      .filter((q) => q.length >= 4);

    if (normalizedQuestions.length) {
      const qRows = normalizedQuestions.map((questionText, idx) => ({
        survey_id: surveyId,
        question_text: questionText,
        order_num: idx + 1
      }));
      await trx('survey_questions').insert(qRows);
    }

    await trx.commit();

    const survey = await knex('surveys').where({ survey_id: surveyId }).first();
    const surveyQuestions = await knex('survey_questions')
      .where({ survey_id: surveyId })
      .orderBy('order_num', 'asc');

    return { ...survey, questions: surveyQuestions };
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

// ===== SURVEY CRUD =====
async function list(req, res) {
  const { page = 1, limit = 20, q } = req.query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  try {
    let base = knex('surveys').where('is_active', 1);
    if (q) base = base.andWhere('title', 'like', `%${String(q)}%`);

    const [{ count } = { count: 0 }] = await base.clone().count({ count: '*' });

    const rows = await base
      .clone()
      .orderBy('survey_id', 'desc')
      .limit(limitNum)
      .offset(offset)
      .select('*');

    const surveyIds = rows.map((r) => Number(r.survey_id)).filter(Boolean);

    let questionCounts = {};
    let responseCounts = {};
    if (surveyIds.length) {
      const qCounts = await knex('survey_questions')
        .whereIn('survey_id', surveyIds)
        .groupBy('survey_id')
        .select('survey_id')
        .count({ count: '*' });

      const rCounts = await knex('survey_responses')
        .whereIn('survey_id', surveyIds)
        .groupBy('survey_id')
        .select('survey_id')
        .countDistinct({ count: 'response_id' });

      questionCounts = Object.fromEntries(qCounts.map((x) => [Number(x.survey_id), Number(x.count || 0)]));
      responseCounts = Object.fromEntries(rCounts.map((x) => [Number(x.survey_id), Number(x.count || 0)]));
    }

    const data = rows.map((s) => ({
      ...s,
      question_count: questionCounts[Number(s.survey_id)] || 0,
      response_count: responseCounts[Number(s.survey_id)] || 0
    }));

    return res.json({ data, total: Number(count || 0), page: pageNum, limit: limitNum });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const survey = await knex('surveys').where({ survey_id: surveyId, is_active: 1 }).first();
    if (!survey) return res.status(404).json({ error: 'survey not found' });

    await knex('surveys').where({ survey_id: surveyId }).update({ view_count: Number(survey.view_count || 0) + 1 });

    const questions = await knex('survey_questions')
      .where({ survey_id: surveyId })
      .orderBy('order_num', 'asc')
      .select('*');

    return res.json({ ...survey, questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  const creatorId = getAuthUserId(req);
  if (!creatorId) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const created = await createSurveyWithQuestions({
      title: req.body?.title,
      description: req.body?.description,
      creatorId,
      questions: req.body?.questions || []
    });
    return res.status(201).json({ data: created, message: 'Anket olusturuldu' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const existing = await knex('surveys').where({ survey_id: surveyId }).first();
    if (!existing) return res.status(404).json({ error: 'survey not found' });

    const patch = {};
    if (typeof req.body?.title !== 'undefined') {
      const t = String(req.body.title || '').trim();
      if (!t) return res.status(400).json({ error: 'title is required' });
      patch.title = t;
    }
    if (typeof req.body?.description !== 'undefined') patch.description = String(req.body.description || '').trim() || null;
    if (typeof req.body?.is_active !== 'undefined') patch.is_active = Number(req.body.is_active) ? 1 : 0;

    if (Object.keys(patch).length) {
      await knex('surveys').where({ survey_id: surveyId }).update(patch);
    }

    if (Array.isArray(req.body?.questions)) {
      const normalizedQuestions = req.body.questions
        .map(cleanQuestionText)
        .filter((q) => q.length >= 4);

      await knex('survey_questions').where({ survey_id: surveyId }).del();
      if (normalizedQuestions.length) {
        const qRows = normalizedQuestions.map((questionText, idx) => ({
          survey_id: surveyId,
          question_text: questionText,
          order_num: idx + 1
        }));
        await knex('survey_questions').insert(qRows);
      }
    }

    const survey = await knex('surveys').where({ survey_id: surveyId }).first();
    const questions = await knex('survey_questions').where({ survey_id: surveyId }).orderBy('order_num', 'asc');
    return res.json({ data: { ...survey, questions }, message: 'Anket guncellendi' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  const trx = await knex.transaction();
  try {
    const existing = await trx('surveys').where({ survey_id: surveyId }).first();
    if (!existing) {
      await trx.rollback();
      return res.status(404).json({ error: 'survey not found' });
    }

    await trx('survey_responses').where({ survey_id: surveyId }).del();
    await trx('survey_questions').where({ survey_id: surveyId }).del();
    await trx('surveys').where({ survey_id: surveyId }).del();

    await trx.commit();
    return res.status(204).end();
  } catch (err) {
    await trx.rollback();
    return res.status(500).json({ error: err.message });
  }
}

// ===== SURVEY QUESTIONS =====
async function getQuestions(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const questions = await knex('survey_questions')
      .where({ survey_id: surveyId })
      .orderBy('order_num', 'asc')
      .select('*');

    return res.json({ data: questions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function addQuestion(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  const questionText = cleanQuestionText(req.body?.question_text || req.body?.questionText);
  if (!questionText) return res.status(400).json({ error: 'question_text is required' });

  try {
    const [{ maxOrder } = { maxOrder: 0 }] = await knex('survey_questions')
      .where({ survey_id: surveyId })
      .max({ maxOrder: 'order_num' });

    const [questionId] = await knex('survey_questions').insert({
      survey_id: surveyId,
      question_text: questionText,
      order_num: Number(maxOrder || 0) + 1
    });

    const created = await knex('survey_questions').where({ question_id: questionId }).first();
    return res.status(201).json({ data: created });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateQuestion(req, res) {
  const questionId = Number(req.params.questionId);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });

  const questionText = cleanQuestionText(req.body?.question_text || req.body?.questionText);
  if (!questionText) return res.status(400).json({ error: 'question_text is required' });

  try {
    await knex('survey_questions').where({ question_id: questionId }).update({ question_text: questionText });
    const updated = await knex('survey_questions').where({ question_id: questionId }).first();
    return res.json({ data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function removeQuestion(req, res) {
  const questionId = Number(req.params.questionId);
  if (!questionId) return res.status(400).json({ error: 'invalid question id' });

  try {
    await knex('survey_questions').where({ question_id: questionId }).del();
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function reorderQuestions(req, res) {
  const surveyId = Number(req.params.id);
  const order = Array.isArray(req.body?.order) ? req.body.order : [];
  if (!surveyId || !order.length) return res.status(400).json({ error: 'invalid order array' });

  const trx = await knex.transaction();
  try {
    for (let i = 0; i < order.length; i += 1) {
      const questionId = Number(order[i]);
      if (!questionId) continue;
      await trx('survey_questions')
        .where({ survey_id: surveyId, question_id: questionId })
        .update({ order_num: i + 1 });
    }

    await trx.commit();
    const questions = await knex('survey_questions').where({ survey_id: surveyId }).orderBy('order_num', 'asc');
    return res.json({ data: questions });
  } catch (err) {
    await trx.rollback();
    return res.status(500).json({ error: err.message });
  }
}

// ===== SURVEY RESPONSES =====
async function createResponse(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const [{ maxResponseId } = { maxResponseId: 0 }] = await knex('survey_responses').max({ maxResponseId: 'response_id' });
    return res.status(201).json({ data: { response_id: Number(maxResponseId || 0) + 1 } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function submitAnswers(req, res) {
  const surveyId = Number(req.params.id);
  const bodySurveyId = Number(req.body?.surveyId || 0);
  const finalSurveyId = surveyId || bodySurveyId;
  const answers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  let responseId = Number(req.body?.responseId || 0);

  if (!finalSurveyId || !answers.length) {
    return res.status(400).json({ error: 'invalid input' });
  }

  const userId = getAuthUserId(req);

  const trx = await knex.transaction();
  try {
    const survey = await trx('surveys').where({ survey_id: finalSurveyId, is_active: 1 }).first();
    if (!survey) {
      await trx.rollback();
      return res.status(404).json({ error: 'survey not found' });
    }

    if (!responseId) {
      const [{ maxResponseId } = { maxResponseId: 0 }] = await trx('survey_responses').max({ maxResponseId: 'response_id' });
      responseId = Number(maxResponseId || 0) + 1;
    }

    await trx('survey_responses').where({ survey_id: finalSurveyId, response_id: responseId }).del();

    const rows = answers
      .map((a) => {
        const questionId = Number(a.question_id || a.questionId || 0);
        const rating = Number(a.rating || a.answer || 0);
        if (!questionId || !rating) return null;
        return {
          survey_id: finalSurveyId,
          response_id: responseId,
          user_id: userId,
          question_id: questionId,
          rating,
          created_at: new Date()
        };
      })
      .filter(Boolean);

    if (!rows.length) {
      await trx.rollback();
      return res.status(400).json({ error: 'valid answers required' });
    }

    await trx('survey_responses').insert(rows);
    await trx.commit();

    return res.json({ data: { survey_id: finalSurveyId, response_id: responseId, saved_answers: rows.length } });
  } catch (err) {
    await trx.rollback();
    return res.status(500).json({ error: err.message });
  }
}

async function getResponses(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const rows = await knex('survey_responses as sr')
      .leftJoin('users as u', 'sr.user_id', 'u.user_id')
      .leftJoin('survey_questions as sq', 'sr.question_id', 'sq.question_id')
      .where('sr.survey_id', surveyId)
      .select(
        'sr.response_id',
        'sr.user_id',
        'u.full_name',
        'u.email',
        'sr.question_id',
        'sq.question_text',
        'sr.rating',
        'sr.created_at'
      )
      .orderBy('sr.response_id', 'desc')
      .orderBy('sr.question_id', 'asc');

    return res.json({ data: rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ===== ANALYSIS =====
async function getResponseRate(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const [{ totalResponses } = { totalResponses: 0 }] = await knex('survey_responses')
      .where({ survey_id: surveyId })
      .countDistinct({ totalResponses: 'response_id' });

    const [{ totalStudents } = { totalStudents: 0 }] = await knex('users').where({ role_id: 3, is_active: 1 }).count({ totalStudents: '*' });
    const responseRate = Number(totalStudents || 0) > 0
      ? Number(((Number(totalResponses || 0) / Number(totalStudents || 1)) * 100).toFixed(2))
      : 0;

    return res.json({ total_responses: Number(totalResponses || 0), total_students: Number(totalStudents || 0), response_rate: responseRate });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function analyzeResponses(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const survey = await knex('surveys').where({ survey_id: surveyId }).first();
    if (!survey) return res.status(404).json({ error: 'survey not found' });

    const questions = await knex('survey_questions').where({ survey_id: surveyId }).orderBy('order_num', 'asc');

    const analysis = {};
    for (const q of questions) {
      const rows = await knex('survey_responses')
        .where({ survey_id: surveyId, question_id: q.question_id })
        .select('rating');

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      rows.forEach((r) => {
        const val = Number(r.rating || 0);
        if (distribution[val] !== undefined) distribution[val] += 1;
      });

      const ratings = rows.map((r) => Number(r.rating || 0)).filter((n) => n > 0);
      const average = ratings.length
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2))
        : 0;

      analysis[q.question_id] = {
        question_text: q.question_text,
        total_responses: rows.length,
        average,
        distribution
      };
    }

    return res.json({ survey_id: surveyId, title: survey.title, analysis });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function exportResponses(req, res) {
  const surveyId = Number(req.params.id);
  const format = String(req.query?.format || 'json').toLowerCase();
  if (!surveyId) return res.status(400).json({ error: 'invalid survey id' });

  try {
    const survey = await knex('surveys').where({ survey_id: surveyId }).first();
    if (!survey) return res.status(404).json({ error: 'survey not found' });

    const rows = await knex('survey_responses as sr')
      .leftJoin('survey_questions as sq', 'sr.question_id', 'sq.question_id')
      .leftJoin('users as u', 'sr.user_id', 'u.user_id')
      .where('sr.survey_id', surveyId)
      .select('sr.response_id', 'u.full_name', 'u.email', 'sq.question_text', 'sr.rating', 'sr.created_at')
      .orderBy('sr.response_id', 'desc');

    if (format === 'csv') {
      const header = 'response_id,full_name,email,question_text,rating,created_at';
      const lines = rows.map((r) => {
        const safe = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        return [safe(r.response_id), safe(r.full_name), safe(r.email), safe(r.question_text), safe(r.rating), safe(r.created_at)].join(',');
      });
      const csv = [header, ...lines].join('\n');
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', `attachment; filename="survey_${surveyId}_${Date.now()}.csv"`);
      return res.send(csv);
    }

    return res.json({ data: { survey, rows } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ===== Word + AI Auto Create =====
async function importFromWord(req, res) {
  const creatorId = getAuthUserId(req);
  if (!creatorId) return res.status(401).json({ error: 'unauthenticated' });

  if (!req.file) return res.status(400).json({ message: 'Word dosyasi zorunludur (file)' });

  try {
    const name = String(req.file.originalname || '').toLowerCase();
    let extractedText = '';

    if (name.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      extractedText = String(result?.value || '').trim();
    } else if (name.endsWith('.txt')) {
      extractedText = req.file.buffer.toString('utf8');
    } else {
      return res.status(400).json({ message: 'Desteklenen formatlar: .docx, .txt' });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({ message: 'Dosyadan yeterli metin okunamadi' });
    }

    const draft = await extractSurveyDraftWithAI(extractedText);
    const created = await createSurveyWithQuestions({
      title: draft.title,
      description: draft.description,
      creatorId,
      questions: draft.questions
    });

    return res.status(201).json({
      data: created,
      draft,
      message: 'Word dosyasindan anket otomatik olusturuldu'
    });
  } catch (err) {
    return res.status(500).json({ message: 'Word dosyasi islenemedi', error: err.message });
  }
}

// ===== DEPRECATED (kept for backward compatibility) =====
async function getAnswers(req, res) {
  return getResponses(req, res);
}

async function stats(req, res) {
  const surveyId = Number(req.params.id);
  if (!surveyId) return res.status(400).json({ error: 'invalid id' });

  try {
    const survey = await knex('surveys').where({ survey_id: surveyId }).first();
    if (!survey) return res.status(404).json({ error: 'survey not found' });

    const [{ totalResponses } = { totalResponses: 0 }] = await knex('survey_responses')
      .where({ survey_id: surveyId })
      .countDistinct({ totalResponses: 'response_id' });

    const ratingRows = await knex('survey_responses')
      .where({ survey_id: surveyId })
      .groupBy('rating')
      .select('rating')
      .count({ count: '*' });

    const distributionMap = Object.fromEntries(ratingRows.map((r) => [Number(r.rating), Number(r.count || 0)]));
    const distribution = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: distributionMap[rating] || 0 }));

    return res.json({
      data: {
        survey: { title: survey.title },
        totalResponses: Number(totalResponses || 0),
        distribution
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  getQuestions,
  addQuestion,
  updateQuestion,
  removeQuestion,
  reorderQuestions,
  createResponse,
  submitAnswers,
  getResponses,
  getResponseRate,
  analyzeResponses,
  exportResponses,
  importFromWord,
  getAnswers,
  stats
};
