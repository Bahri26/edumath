const Tesseract = require('tesseract.js');
const pathLib = require('path');
const { isLocalAi, isOllamaAi } = require('../config/aiProvider');
const { extractQuestionImageRegions } = require('./questionImageCropService');

function buildDefaultParsedQuestion(overrides = {}) {
  return {
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    solution: '',
    visualPrompt: '',
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
    .replace(/al-\s*tigen/gi, 'altıgen')
    .replace(/(\p{L})-\s*\n\s*(\p{L})/giu, '$1$2')
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
  const lower = String(text || '').toLowerCase().replace(/al-\s*tigen/g, 'altıgen');
  const ask = lower.match(/(\d+)\s*\.\s*adım[ıi]nda/);
  if (ask && /altıgen|altigen|örüntü|oruntu/.test(lower)) {
    const n = parseInt(ask[1], 10);
    const optNums = options.map((o) => parseInt(String(o).replace(/\s/g, ''), 10)).filter((x) => !Number.isNaN(x));
    if (optNums.length >= 2 && optNums[1] === optNums[0] * 2) {
      return `${n}. adımda altıgen sayısı: her adımda 2 katı → ${n} × 2 = ${n * 2}. Şıklarda ${correctAnswer} seçeneğini işaretleyin.`;
    }
  }
  const nums = String(text || '').match(/-?\d+(?:[.,]\d+)?/g) || [];
  if (nums.length >= 3 && /örüntü|oruntu|dizi|,/.test(lower)) {
    return 'Önce terimler arasındaki farkı veya tekrar kuralını bulun. Bulduğunuz kuralı son boş terime uygulayın ve sonucu şıklarla karşılaştırın.';
  }
  const idx = options.findIndex((o) => String(o).trim() === String(correctAnswer).trim());
  if (idx >= 0) {
    return `Doğru seçenek ${String.fromCharCode(65 + idx)}) şıkkıdır: ${correctAnswer}. Gerekirse adımları deftere yazarak kontrol edin.`;
  }
  return `Doğru cevap: ${correctAnswer}. İşlemi adım adım kontrol ederek doğrulayın.`;
}

function classifyStemLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed) return 'skip';
  if (/buna göre|kaç tane|bulunuz|hesaplay|vardır\?|var\s*mı\?/i.test(trimmed)) return 'question';
  if (/(?:^|\s)\d+\s*\.?\s*adım(?:\s|$)/i.test(trimmed) && !/buna göre|kaç tane|\?\s*$/.test(trimmed)) return 'step';
  return 'intro';
}

/** Giriş + soru metni (şık ve adım etiketleri hariç) */
function buildSeparatedStemContent(questionTextLines) {
  const intro = [];
  const stepLabels = [];
  const question = [];

  for (const line of questionTextLines) {
    const kind = classifyStemLine(line);
    if (kind === 'skip') continue;
    if (kind === 'step') stepLabels.push(line.trim());
    else if (kind === 'question') question.push(line.trim());
    else intro.push(line.trim());
  }

  const introText = intro.join(' ').trim();
  const questionText = question.join(' ').trim();
  const text = [introText, questionText].filter(Boolean).join('\n\n').trim();
  const visualPrompt = stepLabels.length > 0
    ? stepLabels.join(' · ')
    : (introText && /örüntü|şekil|diyagram/i.test(introText) ? introText : '');

  return { introText, questionText, stepLabels, text, visualPrompt };
}

function buildParseLayout(questionTextLines, normalizedOptions, separated) {
  const introText = separated.introText || '';
  const questionLine = separated.questionText || '';
  const stepLabels = separated.stepLabels || [];
  const hasDiagram = stepLabels.length > 0
    || /altıgen|altigen|şekil|diyagram|görsel|örüntü|oruntu/i.test(introText + questionLine);

  return {
    introText,
    questionLine,
    stepLabels,
    stemText: separated.text || '',
    optionsBlock: normalizedOptions.filter(Boolean),
    hasDiagram,
    diagramNote: hasDiagram
      ? 'Şekil ayrı görsel alanında; soru metni yalnızca yazıdır.'
      : '',
    storageHint: 'Tam görsel: question.image · Kırpılmış diyagram: assessmentMeta.parseLayout.diagramImagePath',
  };
}

function tryInferPatternCorrectAnswer(text, options) {
  const lower = String(text || '').toLowerCase().replace(/al-\s*tigen/g, 'altıgen');
  const ask = lower.match(/(\d+)\s*\.\s*adım[ıi]nda/);
  if (!ask) return '';

  const n = parseInt(ask[1], 10);
  const compactOpts = options.map((o) => String(o || '').replace(/\s/g, '').trim()).filter(Boolean);
  if (!compactOpts.length) return '';

  if (/altıgen|altigen|hexagon/i.test(lower) || (/örüntü|oruntu/.test(lower) && /adım/.test(lower))) {
    const doubled = String(n * 2);
    if (compactOpts.includes(doubled)) return doubled;
  }

  const nums = compactOpts.map((o) => parseInt(o, 10)).filter((x) => !Number.isNaN(x));
  if (nums.length >= 2) {
    const ratio = nums[1] / nums[0];
    if (Math.abs(ratio - 2) < 0.05 || Math.abs(ratio - 3) < 0.05) {
      const predicted = String(Math.round(n * ratio));
      if (compactOpts.includes(predicted)) return predicted;
    }
  }

  return '';
}

/**
 * Metinden yapılandırılmış soru — satır içi A) B) C) D) ve Türkçe cevap satırı destekli
 */
function parseStructuredQuestionText(content, defaults = {}) {
  const fallback = buildDefaultParsedQuestion(defaults);
  let normalized = cleanOcrText(content);
  if (!normalized) {
    const emptyLayout = buildParseLayout([], ['', '', '', ''], { text: '', introText: '', questionText: '', stepLabels: [] });
    return {
      ...fallback,
      layout: emptyLayout,
      assessmentMeta: { parseLayout: emptyLayout, source: 'smart-parse' },
    };
  }

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

  const rawStem = questionTextLines.join(' ').trim() || normalized.split(/\n[A-D]\)/i)[0]?.trim() || '';
  const separated = buildSeparatedStemContent(questionTextLines);
  const text = separated.text || rawStem;
  const topic = defaults.topic || inferTopicFromText(text);
  const difficulty = defaults.difficulty || inferDifficulty(text, normalizedOptions.filter(Boolean).length);
  const inferredAnswer = tryInferPatternCorrectAnswer(rawStem || text, normalizedOptions);
  const finalAnswer = correctAnswer || inferredAnswer || '';

  const layout = buildParseLayout(questionTextLines, normalizedOptions, separated);

  return {
    ...buildDefaultParsedQuestion({
      ...defaults,
      text,
      visualPrompt: separated.visualPrompt || defaults.visualPrompt || '',
      options: normalizedOptions,
      correctAnswer: finalAnswer,
      solution: defaults.solution || buildBasicSolution(text, normalizedOptions, finalAnswer),
      topic,
      difficulty,
    }),
    introText: separated.introText,
    questionText: separated.questionText,
    stepLabels: separated.stepLabels,
    layout,
    assessmentMeta: {
      parseLayout: layout,
      source: 'smart-parse',
    },
  };
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

  const parsed = parseStructuredQuestionText(ocrText, { imagePath: imageUrl });
  const {
    layout,
    assessmentMeta,
    introText,
    questionText,
    stepLabels,
    ...questionFields
  } = parsed;

  const cropAssets = await extractQuestionImageRegions(filePath);
  const mergedLayout = {
    ...(layout || {}),
    ...(cropAssets || {}),
    hasDiagram: Boolean(layout?.hasDiagram || cropAssets?.diagramImagePath),
  };
  const mergedMeta = {
    ...(assessmentMeta || {}),
    parseLayout: mergedLayout,
    source: assessmentMeta?.source || 'smart-parse',
  };

  const data = {
    ...questionFields,
    introText: introText || mergedLayout.introText || '',
    questionText: questionText || mergedLayout.questionLine || '',
    stepLabels: stepLabels || mergedLayout.stepLabels || [],
    imagePath: imageUrl,
    assessmentMeta: mergedMeta,
  };
  const autoFilled = Boolean(data.text.trim() || data.options.some((o) => o.trim()));
  const cropped = Boolean(cropAssets?.diagramImagePath);

  return {
    data,
    layout: mergedLayout,
    parseMode: cropped ? 'ocr+crop' : 'ocr',
    message: autoFilled
      ? cropped
        ? 'Metin ve diyagram bölgesi ayrıldı (OCR + sharp). Alanları kontrol edin.'
        : 'Görsel metne çevrildi: soru gövdesi, şıklar ve diyagram notu ayrıldı. Lütfen kontrol edin.'
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
  buildParseLayout,
  buildSeparatedStemContent,
  tryInferPatternCorrectAnswer,
};
