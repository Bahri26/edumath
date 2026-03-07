const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const knex = require('../db/knex');
const repo = require('../repos/questionsRepo');
const question_optionsRepo = require('../repos/question_optionsRepo');

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

async function generateWithFallback(contents) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY missing');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const modelsToTry = uniqueModels(GEMINI_FALLBACK_MODELS);
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({ model, contents });
      return response;
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

// Araç Metodu: Gemini ile Mesajlaş
async function callGeminiText(prompt) {
  if (!GEMINI_API_KEY) {
    return "Yapay zeka asistanı şu an devre dışı (API Key eksik).";
  }
  try {
    const response = await generateWithFallback(prompt);
    return response.text;
  } catch (err) {
    console.error('Gemini API Error:', err.message);
    return "Bir hata oluştu, lütfen daha sonra tekrar deneyin.";
  }
}

async function callGeminiJSON(prompt, fallback = null) {
  const text = await callGeminiText(prompt);
  try {
    const jsonStr = String(text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (_) {
    return fallback;
  }
}

function cleanVisionText(value) {
  let text = String(value || '');

  // Remove ANSI escape sequences and malformed color-code residues (e.g. [48;2;255;165;0m).
  text = text
    .replace(/\u001b\[[0-9;]*m/gi, ' ')
    .replace(/�?\[[0-9;]{2,}m/gi, ' ')
    .replace(/\[[0-9;]+(?:;[0-9;]+)+m/gi, ' ')
    .replace(/�?\[0m/gi, ' ')
    .replace(/\[0m/gi, ' ');

  // Remove common OCR artifacts while preserving Turkish chars and math symbols.
  text = text
    .replace(/[\uFFFD]/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return text;
}

function normalizeVisionPayload(parsed) {
  const content = cleanVisionText(parsed?.content_text || '');
  const topic = cleanVisionText(parsed?.topic || 'Genel Matematik');

  let options = Array.isArray(parsed?.options) ? parsed.options : [];
  options = options.slice(0, 4).map((opt, idx) => ({
    option_text: cleanVisionText(opt?.option_text || String.fromCharCode(65 + idx)),
    is_correct: Number(opt?.is_correct) === 1 ? 1 : 0
  }));

  while (options.length < 4) {
    options.push({ option_text: String.fromCharCode(65 + options.length), is_correct: 0 });
  }

  // Ensure exactly one correct option to keep form logic stable.
  if (!options.some((o) => o.is_correct === 1)) {
    options[1].is_correct = 1;
  }

  return {
    content_text: content,
    difficulty_level: Number(parsed?.difficulty_level) || 2,
    topic,
    options
  };
}

function toNumericOption(optionText) {
  const cleaned = String(optionText || '').replace(',', '.').trim();
  if (!cleaned) return null;
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function mostLikelyStep(numbers) {
  if (!Array.isArray(numbers) || numbers.length < 3) return null;
  const diffs = [];
  for (let i = 1; i < numbers.length; i++) {
    const d = numbers[i] - numbers[i - 1];
    if (Number.isFinite(d) && d > 0) diffs.push(d);
  }
  if (!diffs.length) return null;

  const freq = new Map();
  diffs.forEach((d) => freq.set(d, (freq.get(d) || 0) + 1));
  const ranked = [...freq.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0] - b[0];
  });
  return ranked[0]?.[0] || null;
}

function inferNonMemberOptionIndex(contentText, options) {
  const text = String(contentText || '').toLocaleLowerCase('tr-TR');
  const asksNonMember = /bulunmaz|olamaz|değildir|değil/.test(text);
  if (!asksNonMember) return null;

  const seq = (String(contentText || '').match(/\d+(?:[.,]\d+)?/g) || [])
    .map((s) => Number(String(s).replace(',', '.')))
    .filter((n) => Number.isFinite(n));

  if (seq.length < 4 || !Array.isArray(options) || options.length < 2) return null;

  const step = mostLikelyStep(seq);
  if (!step || step <= 0) return null;

  const minVal = Math.min(...seq);
  const maxVal = Math.max(...seq);
  const expected = new Set();
  for (let v = minVal; v <= maxVal + step * 2; v += step) {
    expected.add(Number(v.toFixed(6)));
  }

  const numericOptions = options.map((o) => toNumericOption(o?.option_text));
  if (numericOptions.some((v) => v === null)) return null;

  const nonMembers = numericOptions
    .map((v, idx) => ({ v: Number(v.toFixed(6)), idx }))
    .filter(({ v }) => !expected.has(v));

  if (nonMembers.length === 1) {
    return nonMembers[0].idx;
  }

  return null;
}

function postProcessVisionMath(payload) {
  const normalized = { ...(payload || {}) };
  if (!Array.isArray(normalized.options) || normalized.options.length === 0) {
    return normalized;
  }

  const inferredNonMemberIndex = inferNonMemberOptionIndex(normalized.content_text, normalized.options);
  if (inferredNonMemberIndex !== null) {
    normalized.options = normalized.options.map((opt, idx) => ({
      ...opt,
      is_correct: idx === inferredNonMemberIndex ? 1 : 0
    }));
    normalized.pattern_hint = 'Örüntü kuralına göre diziye uymayan seçenek otomatik işaretlendi.';
  }

  return normalized;
}

function normalizeTopicName(value) {
  return String(value || '').trim();
}

function mapScoreToStudentLevel(score) {
  const n = Number(score || 0);
  if (n >= 85) return 'İleri';
  if (n >= 70) return 'Üst-Orta';
  if (n >= 55) return 'Orta';
  if (n >= 40) return 'Gelişiyor';
  return 'Temel';
}

async function fetchPracticeQuestionsFromBank({ weakTopics = [], gradeLevel = null, total = 12 }) {
  const maxQuestions = Math.max(3, Math.min(Number(total) || 12, 30));
  const topics = (Array.isArray(weakTopics) ? weakTopics : [])
    .map(normalizeTopicName)
    .filter(Boolean);

  const baseQuery = knex('questions').select(
    'question_id',
    'content_text',
    'topic',
    'difficulty_level',
    'class_level',
    'grade_level'
  );

  if (gradeLevel) {
    baseQuery.andWhere((qb) => {
      qb.where('grade_level', Number(gradeLevel)).orWhere('class_level', Number(gradeLevel));
    });
  }

  if (topics.length) {
    baseQuery.andWhere((qb) => {
      topics.forEach((topic, idx) => {
        const method = idx === 0 ? 'where' : 'orWhere';
        qb[method]('topic', 'like', `%${topic}%`);
      });
    });
  }

  const rows = await baseQuery.orderByRaw('RAND()').limit(maxQuestions);
  if (!rows.length) return [];

  const questionIds = rows.map((q) => q.question_id);
  const options = await knex('question_options')
    .select('option_id', 'question_id', 'option_text', 'is_correct', 'option_order')
    .whereIn('question_id', questionIds)
    .orderBy('option_order', 'asc');

  const optionsByQuestion = new Map();
  options.forEach((opt) => {
    const key = Number(opt.question_id);
    const list = optionsByQuestion.get(key) || [];
    list.push(opt);
    optionsByQuestion.set(key, list);
  });

  return rows.map((q) => {
    const qOptions = optionsByQuestion.get(Number(q.question_id)) || [];
    const answer = qOptions.find((o) => Number(o.is_correct) === 1);

    return {
      questionId: q.question_id,
      questionText: q.content_text,
      topic: q.topic || 'Genel Matematik',
      difficulty: q.difficulty_level || 'medium',
      options: qOptions.map((o) => ({ optionId: o.option_id, text: o.option_text })),
      correctAnswer: answer?.option_text || null
    };
  });
}

// 1. Analyze Mistake (Öğrencinin hatasını açıkla)
router.post('/analyze-mistake', async (req, res) => {
  const { questionText, studentAnswer, correctAnswer, topic } = req.body;

  const prompt = `Sen yardımsever bir "EduMath" yapay zeka öğretmenisin.
Bir öğrenci "${topic}" konusuyla ilgili şu soruyu yanlış cevapladı:

Soru: "${questionText}"
Öğrencinin Cevabı: "${studentAnswer}"
Doğru Cevap: "${correctAnswer}"

Öğrenciye neden yanlış yaptığını kısa, motive edici ve yapılandırıcı (Sokratik) bir şekilde açıkla. Doğrudan ezber cevap verme, konunun mantığına odaklan. Ortalama 3-4 cümle olsun.`;

  const explanation = await callGeminiText(prompt);
  res.json({ success: true, data: { explanation } });
});

// 1.1 AI Companion (Öğrenci paneli motivasyon kartı)
router.get('/companion', async (req, res) => {
  const prompt = `Sen EduMath öğrenci koçusun. Öğrenci panelinde gösterilecek çok kısa bir motivasyon mesajı üret.
Sadece JSON dön:
{"message":"...", "action_text":"..."}
Kurallar: Türkçe, sıcak, motive edici, 1-2 cümle.`;

  const fallback = {
    message: 'Bugün küçük bir adım at: 10 dakikalık odaklı tekrar bile büyük fark yaratır.',
    action_text: 'Bugünkü Göreve Başla'
  };

  const data = await callGeminiJSON(prompt, fallback);
  res.json({ success: true, data: data || fallback });
});

// 2. Socratic Hint (Öğrenciye soruyu çözmesi için ipucu ver)
router.post('/hint', async (req, res) => {
  const { questionText, topic } = req.body;

  const prompt = `Sen "EduMath" akıllı öğretmen asistanısın. Öğrenci şu soruda takıldı ve ipucu istiyor:

Konu: ${topic}
Soru: "${questionText}"

Öğrenciye cevabı KESİNLİKLE söyleme. Bunun yerine soruyu çözmesi için ona rehberlik edecek, düşünmesini sağlayacak (Sokratik yöntem) 1-2 cümlelik ufak bir zihinsel ipucu (hint) ver.`;

  const hint = await callGeminiText(prompt);
  res.json({ success: true, data: { hint } });
});

// 3. Auto-Grading (Kod veya Açık Uçlu Soru Puanlama)
router.post('/check-code', async (req, res) => {
  const { code, problemDescription, language } = req.body;

  const prompt = `Sen "EduMath" yazılım eğitmenisin. Öğrencinin yazdığı ${language} kodunu değerlendir.
Problem: "${problemDescription}"

Öğrencinin Kodu:
\`\`\`
${code}
\`\`\`

Lütfen kodu çalışabilirliği, zaman/alan karmaşıklığı (Big O) ve kod kalitesi (temiz kod) açısından değerlendir.
1'den 10'a kadar bir puan ver. Ve neleri daha iyi yapabileceğine dair kısa geri bildirim oluştur.
Lütfen sadece saf JSON formatında dön: {"score": 8, "feedback": "...", "complexity": "O(N)"}`;

  try {
    const feedbackText = await callGeminiText(prompt);
    const jsonStr = feedbackText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);
    res.json({ success: true, data: result });
  } catch (err) {
    res.json({ success: true, data: { score: 0, feedback: "Değerlendirme esnasında bir hata oluştu: " + err.message, complexity: "Bilinmiyor" }});
  }
});

// 4. Otomatik Ders Materyali/Özet Üretme (Öğretmen Destekleyici)
router.post('/generate-material', async (req, res) => {
  const { title, context, length = 'kısa' } = req.body;

  const prompt = `Sen deneyimli bir "EduMath" ders ve müfredat tasarımcısısın.
Başlık: "${title}"
Ek Notlar/Bağlam: "${context}"

Lütfen bu konuda öğrencilerin anlayacağı dilde, ${length} bir ders özeti hazırla. HTML formatında olsun (<h2>, <p>, <ul>, <li>, <strong> etiketleri kullan). Kod örnekleri varsa <pre><code> etiketleriyle göster. Akıcı ve eğitici bir dil kullan.`;

  const materialContent = await callGeminiText(prompt);
  res.json({ success: true, data: { htmlString: materialContent } });
});

// 4.1 Öğrenci Analizi (risk + zayıf konu + öneri)
router.post('/student-analysis', async (req, res) => {
  const {
    studentName = 'Öğrenci',
    examAverage = 0,
    weakTopics = [],
    topicStats = [],
    gradeLevel = null,
    mistakeSamples = [],
    hintUsage = 0,
    streakDays = 0,
    recentResults = []
  } = req.body || {};

  const numericAverage = Number(examAverage || 0);
  const level = mapScoreToStudentLevel(numericAverage);
  const normalizedTopicStats = Array.isArray(topicStats) ? topicStats : [];
  const topWeakTopics = normalizedTopicStats.length
    ? normalizedTopicStats
        .sort((a, b) => Number(a.accuracy || 0) - Number(b.accuracy || 0))
        .slice(0, 4)
        .map((x) => normalizeTopicName(x.topic))
        .filter(Boolean)
    : (Array.isArray(weakTopics) ? weakTopics.map(normalizeTopicName).filter(Boolean) : []);

  let practiceQuestions = [];
  try {
    practiceQuestions = await fetchPracticeQuestionsFromBank({
      weakTopics: topWeakTopics,
      gradeLevel,
      total: 15
    });
  } catch (_) {
    practiceQuestions = [];
  }

  const prompt = `Sen EduMath öğrenme analitiği asistanısın.
Öğrenci: ${studentName}
Ortalama: ${examAverage}
Öğrenci Seviyesi: ${level}
Zayıf Konular: ${topWeakTopics.join(', ')}
Konu İstatistikleri: ${JSON.stringify(normalizedTopicStats)}
İpucu Kullanımı: ${hintUsage}
Süreklilik (gün): ${streakDays}
Sonuçlar: ${JSON.stringify(recentResults)}
Örnek Hatalar: ${JSON.stringify(mistakeSamples)}

Sadece JSON dön:
{
  "riskScore": 0,
  "riskLevel": "low|medium|high",
  "studentLevel": "Temel|Gelişiyor|Orta|Üst-Orta|İleri",
  "weakTopics": ["..."],
  "feedbackPlan": "...",
  "recommendedActions": ["...","..."],
  "topicNarrative": "Öğrencinin zorlandığı konuların kısa konu anlatımı",
  "practiceQuestionPrompts": ["Bu konu için 3 yeni soru üret: ...", "..."],
  "nextStudyPlan": ["1. gün ...", "2. gün ..."]
}`;

  const fallback = {
    riskScore: numericAverage < 40 ? 80 : numericAverage < 60 ? 60 : 35,
    riskLevel: numericAverage < 40 ? 'high' : numericAverage < 60 ? 'medium' : 'low',
    studentLevel: level,
    weakTopics: topWeakTopics,
    feedbackPlan: 'Öğrencinin zayıf konularında kısa tekrar + kademeli soru seti uygulanmalı.',
    recommendedActions: [
      'Önce kolay 5 soru ile konu pekiştirme',
      'Ardından orta seviye 5 soru çözümü',
      'Yanlışlarda ipucu destekli tekrar'
    ],
    topicNarrative: 'Temel kavramları sade örneklerle tekrar ederek ilerlemek önerilir.',
    practiceQuestionPrompts: [
      'Öğrencinin yanlış yaptığı konularda 5 kolay ve 5 orta seviye soru üret.',
      'Sorularda adım adım düşünmeyi teşvik eden kısa ipuçları ekle.'
    ],
    nextStudyPlan: [
      '1. Gün: Zayıf konu özeti + 10 temel soru',
      '2. Gün: Karışık 15 soru + yanlış analizi',
      '3. Gün: Süreli mini deneme (10 soru / 10 dk)'
    ]
  };

  const analysis = await callGeminiJSON(prompt, fallback);
  const merged = {
    ...(analysis || fallback),
    studentLevel: analysis?.studentLevel || fallback.studentLevel,
    weakTopics: Array.isArray(analysis?.weakTopics) && analysis.weakTopics.length
      ? analysis.weakTopics
      : fallback.weakTopics,
    practiceQuestions
  };

  res.json({ success: true, data: merged });
});

// 4.2 Soru varyant üretimi (havuzdaki sorudan farklılaştırma)
router.post('/generate-variants', async (req, res) => {
  const { baseQuestionId, baseQuestionText, variantCount = 3, topic = 'Matematik', difficulty = 2 } = req.body || {};

  let sourceQuestionText = baseQuestionText;
  let sourceOptions = [];

  if (baseQuestionId && !sourceQuestionText) {
    try {
      const q = await repo.findById(Number(baseQuestionId));
      if (q) sourceQuestionText = q.content_text;
      sourceOptions = await question_optionsRepo.getQuestionOptions(Number(baseQuestionId));
    } catch (_) {
      // no-op, fallback to text-only generation
    }
  }

  if (!sourceQuestionText) {
    return res.status(400).json({ error: 'baseQuestionId veya baseQuestionText gerekli' });
  }

  const n = Math.min(Math.max(Number(variantCount) || 3, 1), 10);
  const optText = (sourceOptions || []).map(o => o.option_text).filter(Boolean);

  const prompt = `Sen EduMath soru tasarımcısısın.
Temel soru: "${sourceQuestionText}"
Konu: ${topic}
Hedef zorluk: ${difficulty}
Orijinal şıklar: ${JSON.stringify(optText)}

${n} adet farklı ama aynı kazanımı ölçen çoktan seçmeli soru üret.
Kurallar:
- Soru metinleri birbirinden farklı olsun.
- Her soruda 4 şık olsun.
- Tek doğru cevap olsun.
- Cevabı doğrudan metinde ifşa etme.

Sadece JSON dön:
{
  "variants": [
    {
      "content_text": "...",
      "topic": "...",
      "difficulty_level": 2,
      "options": [
        {"option_text":"...","is_correct":0},
        {"option_text":"...","is_correct":1},
        {"option_text":"...","is_correct":0},
        {"option_text":"...","is_correct":0}
      ]
    }
  ]
}`;

  const fallback = {
    variants: Array.from({ length: n }).map((_, i) => ({
      content_text: `${sourceQuestionText} (Varyant ${i + 1})`,
      topic,
      difficulty_level: Number(difficulty) || 2,
      options: [
        { option_text: 'A seçeneği', is_correct: 0 },
        { option_text: 'B seçeneği', is_correct: 1 },
        { option_text: 'C seçeneği', is_correct: 0 },
        { option_text: 'D seçeneği', is_correct: 0 }
      ]
    }))
  };

  const result = await callGeminiJSON(prompt, fallback);
  const variants = (result && Array.isArray(result.variants)) ? result.variants : fallback.variants;

  res.json({ success: true, data: { variants, sourceQuestionText } });
});

// 5. Vision API - Kağıttan Çözüm Okuma (Gelecekteki geliştirme)
router.post('/analyze-vision', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 gerekli' });
  }

  if (!GEMINI_API_KEY) {
    return res.json({
      success: true,
      data: {
        content_text: 'Resimdeki soru metni okunamadı (API key eksik).',
        difficulty_level: 2,
        topic: 'Genel Matematik',
        options: [
          { option_text: 'A', is_correct: 0 },
          { option_text: 'B', is_correct: 1 },
          { option_text: 'C', is_correct: 0 },
          { option_text: 'D', is_correct: 0 }
        ]
      }
    });
  }

  try {
    const prompt = `Bu görseldeki matematik sorusunu OCR ile çıkar ve yapılandır.
Kurallar:
- ANSI/terminal kaçış kodları ASLA yazma (ör: [48;2;255;165;0m, [0m, \u001b...).
- Renkli kutu/semboller varsa metinde bunları [SARI_KARE], [MAVI_KARE], [KIRMIZI_KARE] gibi açık etiketlere çevir.
- Görselde ortada eksik/boş bırakılan nesneler varsa bunları [BOSLUK] veya [BOSLUK_1], [BOSLUK_2] olarak açıkça göster.
- Sayı örüntüsü sorularında görünen sayılardan kuralı çıkar; boşluklar görünmüyorsa bile metni mantıksal olarak tamamla.
- Şıkları görselde yazdığı gibi ayıkla (A/B/C/D).
- Soru "hangisi bulunmaz" gibi ters mantık içeriyorsa, doğru şıkkı buna göre işaretle.
- Metni okunabilir Türkçe cümleler halinde ver.
- Şıkları ayrı ve temiz ver.
Sadece JSON dön:
{
  "content_text": "...",
  "difficulty_level": 1,
  "topic": "...",
  "pattern_hint": "...",
  "options": [
    {"option_text":"...","is_correct":0},
    {"option_text":"...","is_correct":1},
    {"option_text":"...","is_correct":0},
    {"option_text":"...","is_correct":0}
  ]
}
Eğer şıklar kısmen görünüyorsa mevcut olanları koru, sadece eksik olanları tamamla.

Örnek:
- Dizi: 12 - 16 - 20 - 24 - [BOSLUK_1] - [BOSLUK_2] - [BOSLUK_3] - 40
- Şıklar: 28, 32, 35, 36
- "Bulunmaz" sorusunda doğru şık: 35.`;

    const response = await generateWithFallback([
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          }
        ]
      }
    ]);

    const raw = String(response?.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_) {
      parsed = {
        content_text: 'Görselden soru metni çıkarıldı ancak JSON ayrıştırılamadı.',
        difficulty_level: 2,
        topic: 'Genel Matematik',
        options: [
          { option_text: 'A', is_correct: 0 },
          { option_text: 'B', is_correct: 1 },
          { option_text: 'C', is_correct: 0 },
          { option_text: 'D', is_correct: 0 }
        ]
      };
    }

    const normalized = postProcessVisionMath(normalizeVisionPayload(parsed));

    return res.json({ success: true, data: normalized });
  } catch (err) {
    console.error('Gemini vision error:', err.message);
    return res.status(500).json({ error: 'Görsel analizi başarısız' });
  }
});

module.exports = router;
