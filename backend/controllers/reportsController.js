const repo = require('../repos/reportsRepo');
const { GoogleGenAI } = require('@google/genai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getAuthUser(req) {
  return req.user || {};
}

function getAuthUserId(req) {
  return Number(req.user?.id || req.user?.dbUser?.user_id || req.user?.user_id || 0) || null;
}

function mapScoreToCefr(score) {
  const n = Number(score || 0);
  if (n >= 80) return 'C2';
  if (n >= 65) return 'C1';
  if (n >= 50) return 'B2';
  if (n >= 35) return 'B1';
  if (n >= 20) return 'A2';
  return 'A1';
}

async function classStats(req, res) {
  try {
    const limit = Number(req.query.limit || 200);
    const currentUser = getAuthUser(req);
    const role = repo.toRoleName(currentUser);
    const teacherId = role === 'teacher' ? getAuthUserId(req) : null;
    const rows = await repo.classStats({ limit, teacherId });
    res.json({ data: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function studentDetailed(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'invalid id' });
    const currentUser = getAuthUser(req);
    const role = repo.toRoleName(currentUser);
    const teacherId = role === 'teacher' ? getAuthUserId(req) : null;
    const data = await repo.studentDetailed(id, { teacherId });
    if (!data) return res.status(404).json({ error: 'student not found' });
    res.json({ data });
  } catch (err) {
    if (err?.code === 'ACCESS_DENIED') {
      return res.status(403).json({ error: 'access denied' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function generateAIAnalysis(req, res) {
  try {
    const studentId = Number(req.body?.studentId || req.params?.id);
    if (!studentId) return res.status(400).json({ error: 'invalid studentId' });

    const currentUser = getAuthUser(req);
    const role = repo.toRoleName(currentUser);
    const teacherId = role === 'teacher' ? getAuthUserId(req) : null;
    const details = await repo.studentDetailed(studentId, { teacherId });
    if (!details) return res.status(404).json({ error: 'student not found' });

    const weakTopics = (details.topics || []).filter((t) => Number(t.score || 0) < 60).map((t) => t.name).slice(0, 5);
    const fallback = {
      studentLevel: mapScoreToCefr(details.stats?.avgScore || 0),
      weakTopics,
      recommendedActions: [
        'Haftalik tekrar plani olustur.',
        'Zayif konularda kisa konu ozetleri ile basla.',
        'Her gun en az 20 dakika hedefli soru cozumu yap.'
      ],
      topicNarrative: `${details.profile?.full_name || 'Ogrenci'} icin son performansa gore destek gerektiren alanlar belirlendi.`,
      confidenceScore: Number(details.stats?.avgScore || 0)
    };

    if (!GEMINI_API_KEY) {
      return res.json({ data: fallback, source: 'fallback' });
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `Asagidaki ogrenci verisine gore ogretmen icin kisa analiz uret.
Sadece JSON dondur.
Sema:
{
  "studentLevel": "A1|A2|B1|B2|C1|C2",
  "weakTopics": ["..."],
  "recommendedActions": ["..."],
  "topicNarrative": "...",
  "confidenceScore": 0-100
}

Ogrenci: ${details.profile?.full_name || '-'}
Ortalama Puan: ${details.stats?.avgScore || 0}
Basari Orani: ${details.stats?.successRate || 0}
Toplam Sinav: ${details.stats?.totalExams || 0}
Konu Skorlari: ${JSON.stringify(details.topics || [])}`;

    try {
      const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt });
      const raw = String(response?.text || '').replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(raw);
      const payload = {
        studentLevel: String(parsed?.studentLevel || fallback.studentLevel),
        weakTopics: Array.isArray(parsed?.weakTopics) ? parsed.weakTopics : fallback.weakTopics,
        recommendedActions: Array.isArray(parsed?.recommendedActions) ? parsed.recommendedActions : fallback.recommendedActions,
        topicNarrative: String(parsed?.topicNarrative || fallback.topicNarrative),
        confidenceScore: Number(parsed?.confidenceScore ?? fallback.confidenceScore)
      };
      return res.json({ data: payload, source: 'ai' });
    } catch (_) {
      return res.json({ data: fallback, source: 'fallback' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function listAssessments(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });

    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const studentId = req.query.studentId ? Number(req.query.studentId) : null;

    const result = await repo.listAssessments({ teacherId, studentId, page, limit });
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getAssessment(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    const assessmentId = Number(req.params.id);
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });
    if (!assessmentId) return res.status(400).json({ error: 'invalid id' });

    const item = await repo.getAssessmentById({ assessmentId, teacherId });
    if (!item) return res.status(404).json({ error: 'not found' });
    return res.json({ data: item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function upsertAssessment(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    const userId = Number(req.body?.user_id || req.body?.userId);
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });
    if (!userId) return res.status(400).json({ error: 'invalid user id' });

    const item = await repo.upsertAssessment({ teacherId, userId, payload: req.body || {} });
    return res.json({ data: item, message: 'Degerlendirme kaydedildi' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateAssessment(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    const assessmentId = Number(req.params.id);
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });
    if (!assessmentId) return res.status(400).json({ error: 'invalid id' });

    const item = await repo.updateAssessmentById({ assessmentId, teacherId, payload: req.body || {} });
    if (!item) return res.status(404).json({ error: 'not found' });
    return res.json({ data: item, message: 'Degerlendirme guncellendi' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function removeAssessment(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    const assessmentId = Number(req.params.id);
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });
    if (!assessmentId) return res.status(400).json({ error: 'invalid id' });

    const affected = await repo.deleteAssessment({ assessmentId, teacherId });
    if (!affected) return res.status(404).json({ error: 'not found' });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function exportAssessments(req, res) {
  try {
    const teacherId = getAuthUserId(req);
    const format = String(req.query?.format || 'json').toLowerCase();
    if (!teacherId) return res.status(401).json({ error: 'unauthenticated' });

    const exported = await repo.exportAssessments({ teacherId, format });
    if (exported.format === 'csv') {
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.header('Content-Disposition', `attachment; filename="teacher_assessments_${teacherId}_${Date.now()}.csv"`);
      return res.send(exported.content);
    }

    return res.json({ data: exported.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  classStats,
  studentDetailed,
  generateAIAnalysis,
  listAssessments,
  getAssessment,
  upsertAssessment,
  updateAssessment,
  removeAssessment,
  exportAssessments
};
