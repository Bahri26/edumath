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

function normalizeFocusReason(value) {
  const key = String(value || '').trim();
  if (!key) return 'Genel tekrar';
  if (key === 'weak_skill') return 'Bu beceri su an zayif gorunuyor';
  if (key === 'due_review') return 'Bu becerinin tekrar zamani gelmis';
  if (key === 'weak_topic_history') return 'Gecmis sonuclarinda bu alan dalgalaniyor';
  if (key === 'daily_plan') return 'Bugunku plana once bu beceriyle baslaman oneriliyor';
  return key;
}

function buildLearningFallback(topic, mode, context = {}) {
  const words = String(topic || 'Matematik')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const stage = String(context.stage || 'A1');
  const mastery = Number(context.masteryScore || 0);
  const focusReason = normalizeFocusReason(context.focusReason);

  if (mode === 'flashcards') {
    return [
      { q: `${topic} nedir?`, a: `${topic}, belirli bir kurali veya iliskiyi fark edip uygulama becerisidir.` },
      { q: `${topic} cozerken ilk neye bakilir?`, a: 'Verilen bilgi ile istenen bilgi arasindaki iliskiye bakilir.' },
      { q: `${topic} icin hizli bir ipucu ver.`, a: 'Ornegi incele, duzenli artisi veya kurali bul, sonra yeni duruma uygula.' },
      { q: `${topic} calisirken en yaygin hata nedir?`, a: 'Kurali genel yerine tek ornekten ezbere cikarim yapmak.' },
      { q: `${topic} nasil pekistirilir?`, a: 'Kisa tekrar, benzer soru ve bosluk doldurma ile kalicilik saglanir.' }
    ];
  }

  if (mode === 'fillblank') {
    return {
      text: `${topic} calisirken once ____ fark edilir, sonra ____ yazilir ve son olarak ____ ile dogrulanir.`,
      answers: ['kural', 'ornek cozum', 'kontrol']
    };
  }

  if (mode === 'matching') {
    return {
      pairs: [
        { left: 'Temel fikir', right: `${topic} icin kurali veya yapisal iliskiyi bulmak` },
        { left: 'Ilk adim', right: 'Verilen bilgileri inceleyip ortak duzeni yakalamak' },
        { left: 'Pekistirme', right: 'Kisa tekrar ve benzer orneklerle kalicilik saglamak' },
        { left: 'Kontrol', right: 'Bulunan kurali yeni soru uzerinde test etmek' }
      ]
    };
  }

  if (mode === 'miniquiz') {
    return {
      questions: [
        {
          question: `${topic} konusunda temel kurali bulmaya yonelik ilk adim hangisidir?`,
          options: ['Soruyu atlamak', 'Verilen duzeni incelemek', 'Dogrudan sonucu tahmin etmek', 'Sadece son satira bakmak'],
          answer_index: 1,
          explanation: 'Dogru baslangic, verilen bilgi ve duzeni dikkatlice incelemektir.'
        },
        {
          question: `${topic} sorusunda yaptigin islemi nasil guvenceye alirsin?`,
          options: ['Kontrol adimi ekleyerek', 'Yeni sayilar uydurarak', 'Sadece ilk fikri kullanarak', 'Soru metnini kisaltarak'],
          answer_index: 0,
          explanation: 'Sonucu kontrol etmek, hata riskini ciddi bicimde azaltir.'
        },
        {
          question: `${topic} becerisini gelistirmek icin en iyi tekrar yontemi hangisidir?`,
          options: ['Tek bir soruya uzun sure bakmak', 'Kurali farkli orneklerde uygulamak', 'Cevabi ezberlemek', 'Sadece zor sorular cozmeye calismak'],
          answer_index: 1,
          explanation: 'Ayni mantigi farkli orneklerde uygulamak transfer becerisini gelistirir.'
        }
      ]
    };
  }

  return {
    lesson_title: `${topic} icin kisisellestirilmis ders`,
    summary: `${topic} konusunda once temel kuralin ne oldugunu fark et, sonra bu kurali kisa orneklerle uygula.`,
    why_this_matters: `${focusReason}. ${stage} seviyesinde amac, konunun mantigini gorup ayni duzeni yeni soruya tasiyabilmek.`,
    misconception: mastery < 40
      ? 'En yaygin hata, sorudaki duzeni tam anlamadan cevaba gitmeye calismak.'
      : 'En yaygin hata, kurali biliyor olsan da farkli soru tiplerinde ayni mantigi uygulamayi unutmak.',
    steps: [
      `${topic} sorusunda once verilenleri duzenli sekilde listele.`,
      'Kurali veya iliskiyi tek bir cumleyle yaz.',
      'Kurali yeni duruma uygula ve sonucu son kez kontrol et.'
    ],
    worked_example: {
      question: `${topic} ile ilgili basit bir ornek dusun ve kuralin nasil uygulandigini adim adim goster.`,
      solution: 'Verilenler okunur, ortak duzen fark edilir, kural yazilir ve yeni duruma uygulanir.'
    },
    checkpoints: [
      'Kurali kendi cumlenle soyleyebiliyor musun?',
      'Benzer soruda ayni mantigi kullanabiliyor musun?',
      'Sonucu kontrol etmek icin bir adim ekledin mi?'
    ],
    encouragement: mastery < 40
      ? 'Bu ders once temeli kurmak icin yazildi; hiz degil dogru mantik oncelikli.'
      : 'Temelin var; bu ders amaci, onu daha tutarli ve hizli kullanmani saglamak.'
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
function makeLearningPrompt(topic, mode, context = {}) {
  const stage = context.stage || 'A1';
  const masteryScore = Number(context.masteryScore || 0);
  const focusReason = normalizeFocusReason(context.focusReason);

  switch (mode) {
    case 'explanation':
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Dersin onerilme nedeni: ${focusReason}
Ogrenciye Turkce, ogretici ve moral verici ama net bir mini ders hazirla.
Ozellikle eksik oldugu noktayi toparlayacak sekilde anlat.
Sadece JSON don:
{
  "lesson_title":"...",
  "summary":"...",
  "why_this_matters":"...",
  "misconception":"...",
  "steps":["...","...","..."],
  "worked_example":{"question":"...","solution":"..."},
  "checkpoints":["...","...","..."],
  "encouragement":"..."
}`;
    case 'flashcards':
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Ogrenci icin 5 adet kisa flash-card sorusu ve cevabi JSON array seklinde olustur. Kartlar ogrencinin eksigini toparlayacak kadar aciklayici olsun. Format: [{"q":"...","a":"..."},...]`;
    case 'fillblank':
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Kisa bir aciklama veya soru cikar ve icinden 3 anahtar kelimeyi boslukla (____) degistir. JSON:{"text":"...","answers":["...","...","..."]}`;
    case 'matching':
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Ogrenci icin 4 adet eslestirme cifti olustur. Ciftler kavram ve anlam iliskisini net gostersin. JSON formatinda don:{"pairs":[{"left":"...","right":"..."}]}`;
    case 'miniquiz':
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Ogrencinin eksigini anlamaya yarayacak 3 soruluk kisa bir mini quiz hazirla.
Her soru 4 secenekli olsun, tek dogru cevap olsun.
Sadece JSON don:
{"questions":[{"question":"...","options":["...","...","...","..."],"answer_index":0,"explanation":"..."}]}`;
    default:
      return `Konu: ${topic}
Seviye: ${stage}
Tahmini mastery skoru: ${masteryScore}
Turkce, 3-4 cumlelik aciklayici konu anlatimi hazirla. JSON olarak don:{"explanation":"..."}`;
  }
}

router.get('/learning', async (req, res) => {
  const topic = req.query.topic || 'Matematik';
  const mode = req.query.mode || 'explanation';
  const context = {
    masteryScore: Number(req.query.mastery || req.query.masteryScore || 0),
    stage: req.query.stage || 'A1',
    focusReason: req.query.focus || req.query.focusReason || ''
  };
  if (!GEMINI_API_KEY) {
    return res.json({ topic, mode, result: buildLearningFallback(topic, mode, context), fallback: true, context });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = makeLearningPrompt(topic, mode, context);
    const response = await generateWithFallback(ai, prompt);
    let text = String(response?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const parsed = JSON.parse(text);
      return res.json({ topic, mode, result: parsed, context });
    } catch (e) {
      return res.json({ topic, mode, result: text, context });
    }
  } catch (err) {
    console.error('learning ai error', err.message);
    res.json({ topic, mode, result: buildLearningFallback(topic, mode, context), fallback: true, context });
  }
});

module.exports = router;
