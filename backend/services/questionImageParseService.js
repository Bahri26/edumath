const Tesseract = require('tesseract.js');
const pathLib = require('path');
const { isLocalAi, isOllamaAi } = require('../config/aiProvider');

function buildDefaultParsedQuestion(overrides = {}) {
  return {
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solution: '',
    subject: 'Matematik',
    classLevel: '9. Sınıf',
    difficulty: 'Orta',
    topic: '',
    ...overrides,
  };
}

function normalizeOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return ['', '', '', ''];
  }
  const trimmed = options.map((v) => String(v || '').trim()).filter((v) => v.length > 0);
  if (trimmed.length === 0) return ['', '', '', ''];
  const padded = trimmed.slice(0, 8);
  while (padded.length < 4) padded.push('');
  return padded.slice(0, 4);
}

/** OCR çıktısını soru ayrıştırması için sadeleştir */
function cleanOcrText(raw) {
  return String(raw || '')
    .replace(/\r/g, '\n')
    .replace(/[|¦]/g, 'I')
    .replace(/(\d)\s+(\d)/g, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function inferTopicFromText(text) {
  const t = String(text || '').toLowerCase();
  if (/örüntü|oruntu|dizi|sıra\s*:/.test(t)) return 'Örüntüler';
  if (/geometri|üçgen|açı|alan|çevre/.test(t)) return 'Geometri';
  if (/denklem|eşitlik|x\s*=|bilinmeyen/.test(t)) return 'Cebir';
  if (/kesir|ondalık|yüzde|%/.test(t)) return 'Sayılar';
  if (/olasılık|zar|kart/.test(t)) return 'Olasılık';
  return '';
}

function inferDifficulty(text, optionCount) {
  const len = String(text || '').length;
  if (len > 220 || optionCount > 4) return 'Zor';
  if (len < 80) return 'Kolay';
  return 'Orta';
}

function buildBasicSolution(text, options, correctAnswer) {
  if (!correctAnswer) return '';
  const nums = String(text || '').match(/-?\d+(?:[.,]\d+)?/g) || [];
  if (nums.length >= 3 && /örüntü|oruntu|dizi|,/.test(String(text).toLowerCase())) {
    return 'Önce terimler arasındaki farkı veya tekrar kuralını bulun. Bulduğunuz kuralı son boş terime uygulayın ve sonucu şıklarla karşılaştırın.';
  }
  const idx = options.findIndex((o) => String(o).trim() === String(correctAnswer).trim());
  if (idx >= 0) {
    return `Doğru seçenek ${String.fromCharCode(65 + idx)}) şıkkıdır: ${correctAnswer}. Gerekirse adımları deftere yazarak kontrol edin.`;
  }
  return `Doğru cevap: ${correctAnswer}. İşlemi adım adım kontrol ederek doğrulayın.`;
}

/**
 * Metinden yapılandırılmış soru — satır içi A) B) C) D) ve Türkçe cevap satırı destekli
 */
function parseStructuredQuestionText(content, defaults = {}) {
  const fallback = buildDefaultParsedQuestion(defaults);
  let normalized = cleanOcrText(content);
  if (!normalized) return fallback;

  normalized = normalized.replace(/([A-Da-d])\s*[\)\.\:]\s*/g, (m, letter) => `\n${letter.toUpperCase()}) `);

  const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const options = [];
  const questionTextLines = [];
  let correctAnswer = '';

  const pushOption = (letter, value) => {
    const idx = 'ABCDEFGH'.indexOf(String(letter).toUpperCase());
    if (idx < 0) return;
    options[idx] = String(value || '').trim();
  };

  for (const line of lines) {
    const answerLine = line.match(/^(?:Doğru\s*Cevap|Dogru\s*Cevap|Cevap|Answer)\s*[:=]\s*(.+)$/i);
    if (answerLine) {
      const ans = answerLine[1].trim();
      const letterOnly = ans.match(/^([A-D])$/i);
      const letterWithParen = ans.match(/^([A-D])[\)\.\:]/i);
      const letter = letterOnly?.[1] || letterWithParen?.[1];
      if (letter) {
        const idx = 'ABCD'.indexOf(letter.toUpperCase());
        correctAnswer = options[idx] || ans.replace(/^[A-D][\)\.\:\s]*/i, '').trim();
      } else {
        const found = options.find((o) => o && String(o).toLowerCase() === ans.toLowerCase());
        correctAnswer = found || ans;
      }
      continue;
    }

    const marked = line.match(/^\*?\s*([A-H])\s*[\)\.\:]\s*(.+)$/i);
    if (marked) {
      pushOption(marked[1], marked[2]);
      if (line.startsWith('*')) correctAnswer = options['ABCDEFGH'.indexOf(marked[1].toUpperCase())];
      continue;
    }

    const inline = [...line.matchAll(/([A-H])\s*[\)\.\:]\s*([^A-H]+?)(?=\s+[A-H]\s*[\)\.\:]|$)/gi)];
    if (inline.length > 0) {
      inline.forEach((m) => pushOption(m[1], m[2]));
      continue;
    }

    if (!/^[A-H]\s*[\)\.\:]/.test(line)) {
      questionTextLines.push(line);
    }
  }

  const normalizedOptions = normalizeOptions(options);
  if (!correctAnswer) {
    const tail = normalized.match(/(?:Cevap|Doğru)\s*[:=]\s*([A-D])/i);
    if (tail) {
      const idx = 'ABCD'.indexOf(tail[1].toUpperCase());
      if (idx >= 0 && normalizedOptions[idx]) correctAnswer = normalizedOptions[idx];
    }
  }

  const text = questionTextLines.join(' ').trim() || normalized.split(/\n[A-D]\)/i)[0]?.trim() || '';
  const topic = defaults.topic || inferTopicFromText(text);
  const difficulty = defaults.difficulty || inferDifficulty(text, normalizedOptions.filter(Boolean).length);

  return buildDefaultParsedQuestion({
    ...defaults,
    text,
    options: normalizedOptions,
    correctAnswer: correctAnswer || normalizedOptions.find(Boolean) || '',
    solution: defaults.solution || buildBasicSolution(text, normalizedOptions, correctAnswer),
    topic,
    difficulty,
  });
}

async function extractTextFromImageWithOcr(filePath) {
  try {
    const result = await Tesseract.recognize(filePath, 'tur+eng', { logger: () => {} });
    return cleanOcrText(result?.data?.text || '');
  } catch (primaryError) {
    console.warn('OCR tur+eng failed, retry eng:', primaryError?.message);
    const retry = await Tesseract.recognize(filePath, 'eng', { logger: () => {} });
    return cleanOcrText(retry?.data?.text || '');
  }
}

async function parseWithOllamaVision(filePath, imageUrl) {
  if (!isOllamaAi()) return null;
  try {
    const ollama = require('./ollamaService');
    const parsed = await ollama.generateVisionJson(
      `Bu görseldeki matematik sorusunu JSON olarak çıkar. Alanlar: text, options (4 string), correctAnswer, solution, topic, classLevel, difficulty. Sadece JSON.`,
      filePath
    );
    if (!parsed?.text && !(parsed?.options || []).length) return null;
    return buildDefaultParsedQuestion({
      text: parsed.text || '',
      options: normalizeOptions(parsed.options),
      correctAnswer: parsed.correctAnswer || '',
      solution: parsed.solution || '',
      subject: parsed.subject || 'Matematik',
      classLevel: parsed.classLevel || '9. Sınıf',
      difficulty: parsed.difficulty || 'Orta',
      topic: parsed.topic || inferTopicFromText(parsed.text),
      imagePath: imageUrl,
    });
  } catch (e) {
    console.warn('Ollama vision parse failed:', e?.message);
    return null;
  }
}

/**
 * Görsel dosyasından soru alanları üretir.
 * @returns {{ data, parseMode, message, ocrPreview }}
 */
async function parseQuestionFromImage(filePath, mimeType) {
  const imageUrl = `/uploads/temp/${pathLib.basename(filePath)}`;

  if (isOllamaAi()) {
    const ollamaData = await parseWithOllamaVision(filePath, imageUrl);
    if (ollamaData) {
      return {
        data: ollamaData,
        parseMode: 'ollama-vision',
        message: 'Görsel yerel Ollama ile ayrıştırıldı.',
        ocrPreview: '',
      };
    }
  }

  let ocrText = '';
  try {
    ocrText = await extractTextFromImageWithOcr(filePath);
  } catch (e) {
    return {
      data: buildDefaultParsedQuestion({ imagePath: imageUrl }),
      parseMode: 'manual',
      message: 'OCR başarısız; alanları manuel doldurun.',
      ocrPreview: '',
    };
  }

  const data = parseStructuredQuestionText(ocrText, { imagePath: imageUrl });
  const autoFilled = Boolean(data.text.trim() || data.options.some((o) => o.trim()));

  return {
    data,
    parseMode: 'ocr',
    message: autoFilled
      ? 'Görsel metne çevrildi ve soru alanları dolduruldu. Lütfen kontrol edin.'
      : 'Metin okundu ancak şıklar net değil; alanları düzenleyin.',
    ocrPreview: ocrText.slice(0, 2000),
  };
}

module.exports = {
  parseQuestionFromImage,
  parseStructuredQuestionText,
  extractTextFromImageWithOcr,
  cleanOcrText,
  buildDefaultParsedQuestion,
  normalizeOptions,
};
