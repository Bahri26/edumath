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
      introText: { type: SchemaType.STRING, description: 'Üst açıklama / giriş cümlesi (varsa)' },
      questionText: { type: SchemaType.STRING, description: 'Asıl soru cümlesi (şıklar hariç)' },
      stepLabels: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: 'Adım etiketleri: 1. Adım, 2. Adım vb.',
      },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: '4-5 şık metni (A) öneki olmadan',
      },
      correctAnswer: { type: SchemaType.STRING, description: 'Doğru şıkkın tam metni' },
      solution: { type: SchemaType.STRING, description: 'Kısa adım adım çözüm' },
      topic: { type: SchemaType.STRING },
      classLevel: { type: SchemaType.STRING },
      difficulty: { type: SchemaType.STRING },
      hasDiagram: { type: SchemaType.BOOLEAN },
    },
    required: ['questionText', 'options'],
  };

  const instruction = `
Bu görseldeki TEK matematik sorusunu oku. Şekil/diyagram varsa metne dahil etme; yalnızca yazılı kısımları çıkar.
JSON döndür:
- introText: varsa üst giriş cümlesi
- questionText: asıl soru kökü (Türkçe, şıklar hariç)
- stepLabels: "1. Adım", "2. Adım" gibi etiketler (varsa)
- options: 4-5 şık (sadece değer; "A)" öneki yok)
- correctAnswer: doğru şık metni (mümkünse çözerek bul)
- solution: 2-4 adımlık kısa çözüm
- topic, classLevel, difficulty: tahmin
- hasDiagram: görselde şekil/diyagram var mı
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
  };
}

module.exports = {
  hasGeminiKey,
  shouldUseGeminiForSmartParse,
  parseQuestionImageWithGemini,
  normalizeOptions,
};
