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

const DAILY_CACHE = new Map();

const MATH_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518131678677-a32b58d4a5f9?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1574607383476-f517f260d30b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1400&q=80'
];

function getDailyKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDailyImageUrl(topic, date = new Date()) {
  const day = Math.floor(date.getTime() / 86400000);
  const seededIndex = Math.abs(day + String(topic || '').length) % MATH_IMAGE_POOL.length;
  return MATH_IMAGE_POOL[seededIndex];
}

function defaultPayload(topic, date = new Date()) {
  const dailyKey = getDailyKey(date);
  return {
    topic,
    title: topic,
    content: `${topic} hakkinda ilginc bilgiler...`,
    explanation: `${topic} hakkinda ilginc bilgiler...`,
    did_you_know: `${topic} hakkinda ilginc bilgiler...`,
    image_url: getDailyImageUrl(topic, date),
    daily_key: dailyKey,
    timestamp: date
  };
}

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
  const now = new Date();
  const dailyKey = getDailyKey(now);
  const cacheKey = `${topic}:${dailyKey}`;

  if (DAILY_CACHE.has(cacheKey)) {
    return res.json(DAILY_CACHE.get(cacheKey));
  }

  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set');
    const fallback = defaultPayload(topic, now);
    DAILY_CACHE.set(cacheKey, fallback);
    return res.json(fallback);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `Konu: ${topic}
  Tarih: ${dailyKey}
  Turkce, ogrenciler icin anlasilir, 2-3 cumlelik gunluk ilginc bir matematik bilgisi uret.
  Sadece JSON don:
  {"title":"${topic}","explanation":"...","did_you_know":"...","image_query":"math"}`;

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

    const payload = {
      topic,
      title: parsed.title || topic,
      content: parsed.explanation || parsed.did_you_know || `${topic} hakkinda ilginc bilgiler...`,
      explanation: parsed.explanation || parsed.did_you_know || `${topic} hakkinda ilginc bilgiler...`,
      did_you_know: parsed.did_you_know || parsed.explanation || `${topic} hakkinda ilginc bilgiler...`,
      image_url: parsed.image_url || getDailyImageUrl(parsed.image_query || topic, now),
      daily_key: dailyKey,
      timestamp: now
    };

    DAILY_CACHE.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    const fallback = defaultPayload(topic, now);
    DAILY_CACHE.set(cacheKey, fallback);
    res.json(fallback);
  }
});

// learning-specific helpers and endpoint
function makeLearningPrompt(topic, mode) {
  switch (mode) {
    case 'explanation':
      return `Konu: ${topic}\nTurkce, 3-4 cumlelik aciklayici konu anlatimi hazirla. JSON olarak don:{"explanation":"..."}`;
    case 'flashcards':
      return `Konu: ${topic}\nOgrenci icin 5 adet kisa flash-card sorusu ve cevabi JSON array seklinde olustur. Format: [{"q":"...","a":"..."},...]`;
    case 'fillblank':
      return `Konu: ${topic}\nKisa bir aciklama veya soru cikar ve icinden 3 anahtar kelimeyi boslukla (____) degistir. JSON:{"text":"...","answers":["...","...","..."]}`;
    default:
      return `Konu: ${topic}\nTurkce, 3-4 cumlelik aciklayici konu anlatimi hazirla. JSON olarak don:{"explanation":"..."}`;
  }
}

router.get('/learning', async (req, res) => {
  const topic = req.query.topic || 'Matematik';
  const mode = req.query.mode || 'explanation';
  if (!GEMINI_API_KEY) {
    return res.json({ error: 'gemini not configured' });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = makeLearningPrompt(topic, mode);
    const response = await generateWithFallback(ai, prompt);
    let text = String(response?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(text);
      return res.json({ topic, mode, result: parsed });
    } catch (e) {
      return res.json({ topic, mode, result: text });
    }
  } catch (err) {
    console.error('learning ai error', err.message);
    res.status(500).json({ error: 'AI failure' });
  }
});

module.exports = router;
