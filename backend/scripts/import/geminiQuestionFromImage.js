/**
 * Gemini Vision ile soru görselinden yapılandırılmış alan çıkarımı.
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const { DEFAULT_GEMINI_FLASH } = require('../../constants/geminiDefaults');
const { PATTERN_TOPIC_LABELS, LEARNING_OUTCOME_BY_LABEL } = require('../../constants/patternTopics');

const MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_FLASH;

function getGenAI() {
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY tanımlı değil');
  return new GoogleGenerativeAI(key);
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

function pickCorrectFromLetter(options, letter) {
  const L = String(letter || '').trim().toUpperCase();
  if (!L) return '';
  const idx = L.charCodeAt(0) - 65;
  if (idx >= 0 && idx < options.length) return options[idx] || '';
  return '';
}

function inferPatternSubtopic(text) {
  const t = String(text || '').toLowerCase();
  if (/alt[ıi]gen|şekil|kibrit|kutu|karelerden|geometrik|üçgen/.test(t)) {
    return PATTERN_TOPIC_LABELS.GEOMETRIC;
  }
  if (/kare\s*say|n[\^²2]/.test(t)) return PATTERN_TOPIC_LABELS.SQUARES;
  if (/üçgensel|ucgensel/.test(t)) return PATTERN_TOPIC_LABELS.TRIANGULAR;
  if (/iki\s*ad[ıi]ml|karma|yanlıştır/.test(t)) return PATTERN_TOPIC_LABELS.RULE;
  if (/kural|hangisi|ifade|adım\s*say/.test(t)) return PATTERN_TOPIC_LABELS.RULE;
  return PATTERN_TOPIC_LABELS.ARITHMETIC;
}

async function parseQuestionFromImage(imagePath, {
  classLevel = '9. Sınıf',
  difficulty = 'Orta',
  answerLetter = '',
  sequenceIndex = 1,
} = {}) {
  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      text: { type: SchemaType.STRING, description: 'Tam soru metni, Türkçe' },
      options: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
        description: '4 veya 5 şık metni (A-E), sadece değerler',
      },
      correctAnswer: { type: SchemaType.STRING, description: 'Doğru şıkkın tam metni' },
      solution: { type: SchemaType.STRING, description: 'Adım adım çözüm, numaralı' },
      hasDiagram: { type: SchemaType.BOOLEAN, description: 'Şekil/diyagram var mı' },
    },
    required: ['text', 'options', 'correctAnswer', 'solution'],
  };

  const letterHint = answerLetter
    ? `Bilinen doğru şık harfi: ${answerLetter}. correctAnswer bu şıkkın metni olmalı.`
    : 'Doğru cevabı matematiksel olarak çöz ve şıklarla eşleştir.';

  const instruction = `
Bu görsel bir matematik "örüntüler" sorusudur (${classLevel}, ${difficulty}, sıra ${sequenceIndex}/21).
Görseldeki TEK soruyu oku (varsa yalnızca bu bölgedeki soruyu al).
JSON döndür:
- text: Soru kökü (Türkçe, şıklar hariç)
- options: 4-5 şık (sadece metin; "A)" öneki olmadan)
- correctAnswer: Doğru şık metni
- solution: 2-4 adımlık çözüm (1. 2. 3. şeklinde)
- hasDiagram: şekil/örüntü diyagramı var mı
${letterHint}
Sadece JSON.
`;

  const genAI = getGenAI();
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
  let correctAnswer = String(parsed.correctAnswer || '').trim();
  const fromLetter = pickCorrectFromLetter(options, answerLetter);
  if (fromLetter) correctAnswer = fromLetter;
  if (!correctAnswer) {
    correctAnswer = pickCorrectFromLetter(options, answerLetter) || options[0] || '';
  }

  const text = String(parsed.text || '').trim();
  const topic = inferPatternSubtopic(text);

  return {
    text,
    options,
    correctAnswer,
    solution: String(parsed.solution || '').trim(),
    topic,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[topic] || '',
    hasDiagram: Boolean(parsed.hasDiagram),
    engine: 'gemini-vision',
  };
}

module.exports = {
  parseQuestionFromImage,
  normalizeOptions,
  pickCorrectFromLetter,
};
