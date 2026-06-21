const pathLib = require('path');
const { isOllamaAi } = require('../config/aiProvider');
const { extractQuestionImageRegions, extractTextRegionsExcludingDiagram } = require('./questionImageCropService');
const { enrichParsedQuestionAsync } = require('./patternQuestionSolver');
const { recognizeText, recognizeTextFromRegions } = require('./ocrImageService');
const { shouldUseGeminiForSmartParse, parseQuestionImageWithGemini } = require('./geminiVisionParseService');
const mlServiceClient = require('./mlServiceClient');

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
  const cleaned = String(raw || '')
    .replace(/\r/g, '\n')
    .replace(/[|¦]/g, 'I')
    .replace(/(\d)\s+(\d)/g, '$1$2')
    .replace(/al-\s*tigen/gi, 'altıgen')
    .replace(/(\p{L})-\s*\n\s*(\p{L})/giu, '$1$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return stripLeadingOcrGarbage(cleaned);
}

/** Diyagram OCR gürültüsü: "Ty Eg i a İlk..." → "İlk..." */
function stripLeadingOcrGarbage(text) {
  let s = String(text || '').trim();
  if (!s) return '';

  const head = s.slice(0, 64);
  const starters = /(?:^|\s)(İlk |Bu |Verilen |Buna |Aşağı |Yukarı |Dizisinde |Soru |Kaç |Hangisi |Görselde )/gi;
  let cutAt = -1;
  let match;
  while ((match = starters.exec(head)) !== null) {
    const idx = match.index + (match[0].startsWith(' ') ? 1 : 0);
    if (cutAt < 0 || idx < cutAt) cutAt = idx;
    if (idx === 0) break;
  }
  if (cutAt > 0 && cutAt < 48) {
    s = s.slice(cutAt);
  }

  s = s.replace(
    /^((?:[A-Za-zÇçĞğİıÖöŞşÜü]{1,3}\s+){1,8})(?=[İi]lk|[Öö]rüntü|[Şş]ekil|Bu\s|Buna\s|Kaç\s|Hangisi)/u,
    ''
  );

  return s.trim();
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
  if (/buna göre|kaç\s|bulunuz|hesaplay|vardır\?|var\s*mı\?|\?\s*$/i.test(trimmed)) return 'question';
  if (/(?:^|\s)\d+\s*\.?\s*adım(?:\s|$)/i.test(trimmed) && !/\?\s*$/.test(trimmed)) return 'step';
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
async function parseStructuredQuestionText(content, defaults = {}) {
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

  const base = {
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

  if (mlServiceClient.isConfigured()) {
    try {
      const mlParsed = await mlServiceClient.parseQuestionText(normalized, defaults);
      if (mlParsed?.text || mlParsed?.options?.some((o) => String(o).trim())) {
        const merged = {
          ...base,
          ...mlParsed,
          layout: base.layout,
          assessmentMeta: base.assessmentMeta,
          introText: mlParsed.introText || base.introText,
          questionText: mlParsed.questionText || base.questionText,
          stepLabels: mlParsed.stepLabels || base.stepLabels,
        };
        return enrichParsedQuestionAsync(merged);
      }
    } catch (err) {
      console.warn('ML parse-text fallback to local:', err?.message);
    }
  }

  return enrichParsedQuestionAsync(base);
}

async function extractTextFromImageWithOcr(filePath) {
  const { topTextBuffer, bottomTextBuffer, cropAssets } = await extractTextRegionsExcludingDiagram(filePath);
  const hasRegional = Boolean(topTextBuffer || bottomTextBuffer);

  let raw = '';
  if (hasRegional) {
    raw = await recognizeTextFromRegions({ topTextBuffer, bottomTextBuffer, fullPath: null });
  }
  if (!raw.trim()) {
    raw = await recognizeText(filePath);
  }

  return {
    text: cleanOcrText(raw),
    regional: hasRegional && Boolean(cropAssets?.diagramImagePath),
  };
}

async function finalizeImageParseResult(parsed, filePath, imageUrl, { parseMode, message, ocrPreview = '' }) {
  const enriched = await enrichParsedQuestionAsync(parsed);
  const options = normalizeOptions(enriched.options || parsed.options);
  const text = enriched.text || parsed.text || '';

  let layout = parsed.layout || enriched.layout || null;
  let introText = enriched.introText ?? parsed.introText ?? '';
  let questionText = enriched.questionText ?? parsed.questionText ?? '';
  let stepLabels = enriched.stepLabels ?? parsed.stepLabels ?? [];

  if (!layout && text) {
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const separated = buildSeparatedStemContent(lines);
    layout = buildParseLayout(lines, options, separated);
    introText = introText || separated.introText;
    questionText = questionText || separated.questionText;
    stepLabels = stepLabels.length ? stepLabels : separated.stepLabels;
  }

  const assessmentMeta = {
    ...(parsed.assessmentMeta || enriched.assessmentMeta || {}),
    parseLayout: layout || parsed.assessmentMeta?.parseLayout || {},
    source: 'smart-parse',
  };

  const cropAssets = await extractQuestionImageRegions(filePath);
  const mergedLayout = {
    ...(layout || {}),
    ...(cropAssets || {}),
    hasDiagram: Boolean(layout?.hasDiagram || cropAssets?.diagramImagePath),
  };
  const mergedMeta = {
    ...assessmentMeta,
    parseLayout: mergedLayout,
  };

  const data = {
    ...enriched,
    options,
    introText: introText || mergedLayout.introText || '',
    questionText: questionText || mergedLayout.questionLine || '',
    stepLabels: stepLabels.length ? stepLabels : (mergedLayout.stepLabels || []),
    imagePath: imageUrl,
    assessmentMeta: mergedMeta,
  };

  delete data.layout;

  return {
    data,
    layout: mergedLayout,
    parseMode,
    message,
    ocrPreview,
  };
}

async function buildGeminiParseResult(geminiFields, filePath, imageUrl) {
  const options = normalizeOptions(geminiFields.options);
  const introText = geminiFields.introText || '';
  const questionText = geminiFields.questionText || geminiFields.text || '';
  const stepLabels = Array.isArray(geminiFields.stepLabels) ? geminiFields.stepLabels : [];
  const text = geminiFields.text || [introText, questionText].filter(Boolean).join('\n\n');
  const separated = buildSeparatedStemContent(
    [introText, questionText].filter(Boolean).length
      ? [introText, questionText].filter(Boolean)
      : text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  );
  const layout = buildParseLayout(
    text.split(/\n+/).map((l) => l.trim()).filter(Boolean),
    options,
    separated
  );

  const base = {
    ...buildDefaultParsedQuestion({
      text: separated.text || text,
      introText: separated.introText || introText,
      questionText: separated.questionText || questionText,
      stepLabels: separated.stepLabels.length ? separated.stepLabels : stepLabels,
      visualPrompt: separated.visualPrompt || stepLabels.join(' · '),
      options,
      correctAnswer: geminiFields.correctAnswer || '',
      solution: geminiFields.solution || '',
      subject: geminiFields.subject || 'Matematik',
      classLevel: geminiFields.classLevel || '9. Sınıf',
      difficulty: geminiFields.difficulty || 'Orta',
      topic: geminiFields.topic || inferTopicFromText(text),
      imagePath: imageUrl,
    }),
    layout: {
      ...layout,
      hasDiagram: Boolean(geminiFields.hasDiagram || layout.hasDiagram),
    },
    assessmentMeta: { parseLayout: layout, source: 'smart-parse' },
  };

  return finalizeImageParseResult(base, filePath, imageUrl, {
    parseMode: 'gemini-vision',
    message: 'Görsel Gemini Vision ile ayrıştırıldı. Alanları kontrol edin.',
    ocrPreview: '',
  });
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

  if (shouldUseGeminiForSmartParse()) {
    try {
      const geminiFields = await parseQuestionImageWithGemini(filePath);
      if (geminiFields) {
        return buildGeminiParseResult(geminiFields, filePath, imageUrl);
      }
    } catch (err) {
      console.warn('Gemini smart-parse failed, fallback OCR:', err?.message);
    }
  }

  if (isOllamaAi()) {
    const ollamaData = await parseWithOllamaVision(filePath, imageUrl);
    if (ollamaData) {
      const result = await finalizeImageParseResult(ollamaData, filePath, imageUrl, {
        parseMode: 'ollama-vision',
        message: 'Görsel yerel Ollama ile ayrıştırıldı.',
        ocrPreview: '',
      });
      return result;
    }
  }

  let ocrText = '';
  let regionalOcr = false;
  try {
    const ocrResult = await extractTextFromImageWithOcr(filePath);
    ocrText = ocrResult.text;
    regionalOcr = ocrResult.regional;
  } catch (e) {
    return {
      data: buildDefaultParsedQuestion({ imagePath: imageUrl }),
      parseMode: 'manual',
      message: 'OCR başarısız; alanları manuel doldurun.',
      ocrPreview: '',
    };
  }

  const parsed = await parseStructuredQuestionText(ocrText, { imagePath: imageUrl });
  const result = await finalizeImageParseResult(parsed, filePath, imageUrl, {
    parseMode: regionalOcr ? 'ocr-regional+crop' : 'ocr+crop',
    message: regionalOcr
      ? 'Diyagram hariç metin okundu (sharp + bölgesel OCR). Alanları kontrol edin.'
      : 'Görsel metne çevrildi. Alanları kontrol edin.',
    ocrPreview: ocrText.slice(0, 2000),
  });

  const autoFilled = Boolean(result.data.text?.trim() || result.data.options?.some((o) => String(o).trim()));
  if (!autoFilled) {
    result.message = 'Metin okundu ancak şıklar net değil; alanları düzenleyin.';
    result.parseMode = 'ocr';
  }

  return result;
}

module.exports = {
  parseQuestionFromImage,
  parseStructuredQuestionText,
  extractTextFromImageWithOcr,
  cleanOcrText,
  stripLeadingOcrGarbage,
  buildDefaultParsedQuestion,
  normalizeOptions,
  buildParseLayout,
  buildSeparatedStemContent,
  tryInferPatternCorrectAnswer,
};
