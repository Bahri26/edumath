// AI içerik API'sine proxy endpoint (Gemini ile)
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

function uniqueModels(models) {
  return [...new Set(models.filter(Boolean))];
}

async function generateWithFallback(ai, contents) {
  const modelsToTry = uniqueModels(GEMINI_FALLBACK_MODELS);
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      return await ai.models.generateContent({ model, contents });
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');
      const isModelNotFound = msg.includes('not found') || msg.includes('NOT_FOUND') || msg.includes('not supported');
      if (!isModelNotFound) break;
      console.warn(`[Gemini] Model başarısız, sıradaki modele geçiliyor: ${model}`);
    }
  }

  throw lastError || new Error('Gemini çağrısı başarısız');
}

// /api/ai-content?topic=KONU
router.get('/ai-content', async (req, res) => {
  const topic = req.query.topic || 'Matematik';

  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set');
    return res.json({
      topic,
      title: topic,
      content: `${topic} hakkında ilginç bilgiler...`,
      explanation: `${topic} hakkında ilginç bilgiler...`,
      did_you_know: `${topic} hakkında ilginç bilgiler...`,
      image_url: '',
      timestamp: new Date()
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `Konu: ${topic}
Türkçe, öğrenciler için anlaşılır, 2-3 cümlelik ilginç bir bilgi üret.
Sadece JSON dön:
{"title":"${topic}","explanation":"...","did_you_know":"...","image_url":""}`;

    const response = await generateWithFallback(ai, prompt);
    const raw = String(response?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = {
        title: topic,
        explanation: raw || `${topic} hakkında ilginç bilgiler...`,
        did_you_know: raw || `${topic} hakkında ilginç bilgiler...`,
        image_url: ''
      };
    }

    res.json({
      topic,
      title: parsed.title || topic,
      content: parsed.explanation || parsed.did_you_know || `${topic} hakkında ilginç bilgiler...`,
      explanation: parsed.explanation || parsed.did_you_know || `${topic} hakkında ilginç bilgiler...`,
      did_you_know: parsed.did_you_know || parsed.explanation || `${topic} hakkında ilginç bilgiler...`,
      image_url: parsed.image_url || '',
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    res.json({
      topic,
      title: topic,
      content: `${topic} hakkında ilginç bilgiler...`,
      explanation: `${topic} hakkında ilginç bilgiler...`,
      did_you_know: `${topic} hakkında ilginç bilgiler...`,
      image_url: '',
      timestamp: new Date()
    });
  }
});

module.exports = router;
