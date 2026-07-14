const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { DEFAULT_GEMINI_FLASH } = require('../constants/geminiDefaults');

const MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH;

function hasGeminiKey() {
  return Boolean(String(process.env.GEMINI_API_KEY || '').trim());
}

function shouldUseGeminiForSmartParse() {
  const mode = String(process.env.SMART_PARSE_VISION || 'auto').trim().toLowerCase();
  if (mode === 'off' || mode === 'ocr') return false;
  if (mode === 'gemini' || mode === 'auto') return hasGeminiKey();
  return false;
}

function imagePart(imagePath) {
  const buf = fs.readFileSync(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { inlineData: { data: buf.toString('base64'), mimeType } };
}

function normalizeOptions(raw) {
  const list = (Array.isArray(raw) ? raw : [])
    .map((o) => String(o || '').trim())
    .filter(Boolean);
  while (list.length < 4) list.push('');
  return list.slice(0, 5);
}

/**
 * Gemini Vision ile görselden yapılandırılmış soru alanları çıkarır.
 */
async function parseQuestionImageWithGemini(imagePath) {
  if (!hasGeminiKey()) return null;

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      introText: { type: SchemaType.STRING, description: 'Üst açıklama / ortak giriş (çoklu soruda ortak kök)' },
      sharedPrompt: { type: SchemaType.STRING, description: 'Aşağıdaki soruları… gibi yönerge' },
      questionText: { type: SchemaType.STRING, description: 'Tek soru ise asıl soru cümlesi' },
      stepLabels: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: 'Adım etiketleri: 1. Adım, 2. Adım vb.',
      },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: 'Tek soru ise 4-5 şık metni (A) öneki olmadan',
      },
      correctAnswer: { type: SchemaType.STRING, description: 'Tek soru doğru şık metni' },
      solution: { type: SchemaType.STRING, description: 'Kısa çözüm' },
      topic: { type: SchemaType.STRING },
      classLevel: { type: SchemaType.STRING },
      difficulty: { type: SchemaType.STRING },
      hasDiagram: { type: SchemaType.BOOLEAN },
      items: {
        type: SchemaType.ARRAY,
        description: 'Numaralı birden fazla soru varsa her madde; yoksa boş dizi',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            questionText: { type: SchemaType.STRING },
            options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            correctAnswer: { type: SchemaType.STRING },
            solution: { type: SchemaType.STRING },
          },
          required: ['questionText', 'options'],
        },
      },
    },
    required: ['questionText', 'options'],
  };

  const instruction = `
Bu görseldeki matematik soru(lar)ını oku. Şekil/diyagramı metne yazma; yalnızca yazılı kısımları çıkar.
JSON döndür:
- introText: ortak giriş / üst açıklama (varsa)
- sharedPrompt: "Aşağıdaki soruları…" gibi yönerge (varsa)
- Eğer görselde 1. 2. 3. gibi BİRDEN FAZLA soru varsa:
  - items: her madde için { questionText, options, correctAnswer, solution }
  - questionText/options: ilk maddeyi de doldur (uyumluluk)
- Tek soruysa items boş dizi [] bırak; questionText + options kullan
- options: 4-5 şık (sadece değer; "A)" öneki yok)
- correctAnswer: doğru şık metni (mümkünse çözerek bul)
- topic, classLevel, difficulty, hasDiagram
Sadece JSON.
`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.15,
    },
  });

  const result = await model.generateContent([instruction, imagePart(imagePath)]);
  const parsed = JSON.parse(result.response.text());
  const options = normalizeOptions(parsed.options);
  const introText = String(parsed.introText || '').trim();
  const questionText = String(parsed.questionText || parsed.text || '').trim();
  const stepLabels = Array.isArray(parsed.stepLabels)
    ? parsed.stepLabels.map((s) => String(s || '').trim()).filter(Boolean)
    : [];
  const text = [introText, questionText].filter(Boolean).join('\n\n').trim() || questionText;

  if (!text && !options.some((o) => o.trim())) return null;

  return {
    text,
    introText,
    questionText,
    stepLabels,
    options,
    correctAnswer: String(parsed.correctAnswer || '').trim(),
    solution: String(parsed.solution || '').trim(),
    subject: 'Matematik',
    classLevel: String(parsed.classLevel || '9. Sınıf').trim(),
    difficulty: String(parsed.difficulty || 'Orta').trim(),
    topic: String(parsed.topic || '').trim(),
    hasDiagram: Boolean(parsed.hasDiagram),
    sharedPrompt: String(parsed.sharedPrompt || '').trim(),
    items: Array.isArray(parsed.items) ? parsed.items : [],
  };
}

module.exports = {
  hasGeminiKey,
  shouldUseGeminiForSmartParse,
  parseQuestionImageWithGemini,
  normalizeOptions,
};
