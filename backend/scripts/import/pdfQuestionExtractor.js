/**
 * PDF sayfa görüntüsünden soru blokları çıkarır (OCR + sabit bölme).
 */

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { extractQuestionImageRegions } = require('../../services/questionImageCropService');

const QUESTION_LINE_RE = /^\s*(\d{1,2})\s*[.)]\s*(.*)$/;
const OPTION_LINE_RE = /^\s*([A-Ea-e])\s*[\).:\-]\s*(.+)$/;
const ANSWER_KEY_LINE_RE = /^\d{1,2}\s*[-–]\s*[A-E]/i;

let sharedWorker = null;

async function getWorker() {
  if (!sharedWorker) {
    sharedWorker = await Tesseract.createWorker('tur+eng', Tesseract.OEM.LSTM_ONLY, { logger: () => {} });
  }
  return sharedWorker;
}

async function terminateWorker() {
  if (sharedWorker) {
    await sharedWorker.terminate();
    sharedWorker = null;
  }
}

async function ocrImage(imagePath) {
  const worker = await getWorker();
  const { data } = await worker.recognize(imagePath, {}, { text: true, blocks: true });
  const lines = [];
  for (const block of data.blocks || []) {
    for (const para of block.paragraphs || []) {
      for (const line of para.lines || []) {
        const text = String(line.text || '').replace(/\s+/g, ' ').trim();
        if (!text) continue;
        lines.push({
          text,
          y0: line.bbox?.y0 ?? 0,
          y1: line.bbox?.y1 ?? 0,
        });
      }
    }
  }
  return {
    fullText: String(data.text || '').trim(),
    lines,
  };
}

function parseInlineOptions(text) {
  const found = new Map();
  const s = String(text || '').replace(/\r/g, '');

  const lead = s.match(/^([\d.,+\-n°²\s]{1,50}?)\s+([B-E])\s*[\).:\-]/i);
  if (lead) found.set('A', lead[1].trim());

  const markers = [...s.matchAll(/\b([A-E])\s*[\).:\-]\s*/gi)];
  for (let i = 0; i < markers.length; i += 1) {
    const letter = markers[i][1].toUpperCase();
    const start = markers[i].index + markers[i][0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index : s.length;
    let val = s.slice(start, end).trim();
    val = val.replace(/[|¦©]+/g, '').replace(/\s+/g, ' ').trim();
    if (val && !found.has(letter)) found.set(letter, val);
  }

  return ['A', 'B', 'C', 'D', 'E'].map((letter) => ({ letter, text: found.get(letter) || '' }));
}

function parseOptionsFromText(text) {
  const found = new Map();
  const lines = String(text || '').split(/\r?\n/);
  for (const line of lines) {
    const m = line.trim().match(OPTION_LINE_RE);
    if (m) found.set(m[1].toUpperCase(), m[2].trim());
  }
  for (const o of parseInlineOptions(text)) {
    if (o.text && !found.has(o.letter)) found.set(o.letter, o.text);
  }
  return ['A', 'B', 'C', 'D', 'E']
    .map((letter) => ({ letter, text: found.get(letter) || '' }))
    .filter((o) => o.text);
}

function optionText(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value.text === 'string') return value.text.trim();
  if (value && value.text && typeof value.text === 'object') {
    return String(value.text.text || '').trim();
  }
  return String(value?.text || value || '').trim();
}

function mergeOptionSources(...sources) {
  const map = new Map();
  const letters = ['A', 'B', 'C', 'D', 'E'];

  const absorb = (parsed) => {
    for (const o of parsed) {
      const letter = String(o.letter || '').toUpperCase();
      let text = optionText(o.text || o);
      if (!letter || !text || text.startsWith('[object')) continue;
      if (/\b[B-E]\s*[\).:\-]/.test(text) && text.length > 12) {
        for (const nested of parseInlineOptions(text)) {
          if (nested.text && !map.has(nested.letter)) map.set(nested.letter, nested.text);
        }
      }
      if (!map.has(letter)) map.set(letter, text);
    }
  };

  for (const src of sources) {
    if (!src) continue;
    if (Array.isArray(src)) {
      src.forEach((item, idx) => {
        if (typeof item === 'string') {
          absorb(parseInlineOptions(item));
          if (item.trim() && !map.has(letters[idx])) map.set(letters[idx], item.trim());
        } else {
          absorb([{ letter: item.letter || letters[idx], text: item.text || '' }]);
          if (item.text) absorb(parseInlineOptions(item.text));
        }
      });
    } else {
      absorb(parseOptionsFromText(src));
      absorb(parseInlineOptions(src));
    }
  }

  return letters.map((letter) => ({ letter, text: map.get(letter) || '' }));
}

function isGarbageAnswer(answer) {
  const a = String(answer || '').trim();
  if (!a || a.startsWith('[object')) return true;
  if (/[|¦]/.test(a)) return true;
  if (/^\d+\s+[A-E]\)/i.test(a)) return true;
  if (a.length > 55 && /[A-E]\)/i.test(a)) return true;
  if (/Yalnız|Örüntüdeki kibrit|İki basamaklı/i.test(a) && a.length > 35) return true;
  return false;
}

function resolveCorrectAnswer(options, { letter, currentAnswer } = {}) {
  const opts = Array.isArray(options) && options[0]?.letter
    ? options
    : mergeOptionSources(options);

  if (letter) {
    const fromLetter = letterToCorrectAnswer(opts, letter);
    if (fromLetter && !isGarbageAnswer(fromLetter)) return fromLetter;
  }

  const cur = String(currentAnswer || '').trim();
  if (cur && !isGarbageAnswer(cur)) {
    const hit = opts.find((o) => o.text === cur || o.text.startsWith(cur) || cur.startsWith(o.text));
    if (hit) return hit.text;
    if (!/[A-E]\)/i.test(cur)) return cur;
  }

  const salvaged = mergeOptionSources(cur);
  if (letter) {
    const fromSalvage = letterToCorrectAnswer(salvaged, letter);
    if (fromSalvage) return fromSalvage;
  }

  const num = cur.match(/^(\d+(?:[.,]\d+)?)/);
  if (num) return num[1];

  return opts.find((o) => o.text)?.text || '';
}

function cleanOcrText(text) {
  let t = String(text || '');
  t = t.replace(/[|¦©\\]+/g, ' ');
  t = t.replace(/\[\s*\|[^\]]*\]/g, ' ');
  t = t.replace(/\|\s*\|/g, ' ');
  t = t.replace(/_{3,}/g, ' ');
  t = t.replace(/\s{2,}/g, ' ').trim();
  t = t.replace(/i tigen/ig, 'üçgen');
  t = t.replace(/Aim Say[ıi]s[ıi]/gi, 'Adım Sayısı');
  t = t.replace(/ÇÖPd/gi, 'çöp');
  t = t.replace(/COÖPd/gi, 'çöp');
  t = t.replace(/—+/g, ' — ');
  const optStart = t.search(/\bA\s*[\).:\-]\s*\S/i);
  if (optStart > 35) t = t.slice(0, optStart).trim();
  const nextQ = t.search(/\b\d{1,2}\s*[.)]\s+[A-ZÇĞİÖŞÜ]/);
  if (nextQ > 50) t = t.slice(0, nextQ).trim();
  return t.trim();
}

function buildQuestionText(rawText) {
  const lines = String(rawText || '').split(/\r?\n/);
  const body = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (OPTION_LINE_RE.test(trimmed)) break;
    if (ANSWER_KEY_LINE_RE.test(trimmed)) break;
    if (/^(KTT|BTT|TEST|TEMA|KONU|SINIF|ORUNT)/i.test(trimmed)) continue;
    body.push(trimmed.replace(QUESTION_LINE_RE, '$2').trim());
  }
  return body.join('\n').trim();
}

function buildQuestionTextClean(rawText) {
  return cleanOcrText(buildQuestionText(rawText) || String(rawText || '').slice(0, 600));
}

function letterToCorrectAnswer(options, letter) {
  const upper = String(letter || '').trim().toUpperCase();
  if (!upper) return '';
  const hit = options.find((o) => o.letter === upper);
  if (hit) return hit.text;
  const idx = upper.charCodeAt(0) - 65;
  if (idx >= 0 && idx < options.length) return options[idx].text;
  return '';
}

async function detectVisualQuestion(cropPath) {
  try {
    const regions = await extractQuestionImageRegions(cropPath);
    return Boolean(regions?.diagramImagePath);
  } catch {
    const meta = await sharp(cropPath).metadata();
    const stats = await sharp(cropPath).grayscale().stats();
    const ink = 1 - (stats.channels[0]?.mean || 255) / 255;
    return ink > 0.04 && (meta.height || 0) > 180;
  }
}

async function cropSlice(imagePath, top, height, outPath) {
  const meta = await sharp(imagePath).metadata();
  const safeTop = Math.max(0, Math.min(Math.floor(top), meta.height - 40));
  const safeHeight = Math.min(Math.ceil(height), meta.height - safeTop);
  await sharp(imagePath)
    .extract({ left: 0, top: safeTop, width: meta.width, height: Math.max(40, safeHeight) })
    .png()
    .toFile(outPath);
  return outPath;
}

/**
 * Manifest'teki y0/y1 bölgelerine göre soru kırpır; yoksa eşit bölme yapar.
 */
async function splitPageIntoQuestions(imagePath, questionCount, { pageNumber = 1, answerKeys = {}, regions = [] } = {}) {
  if (!questionCount || questionCount < 1) return [];

  const meta = await sharp(imagePath).metadata();
  const outDir = path.join(path.dirname(imagePath), 'crops');
  fs.mkdirSync(outDir, { recursive: true });

  const slices = regions.length === questionCount
    ? regions.map((r) => ({ top: r.y0, height: r.y1 - r.y0 }))
    : (() => {
      const header = Math.floor(meta.height * 0.09);
      const footer = Math.floor(meta.height * 0.07);
      const contentHeight = meta.height - header - footer;
      const sliceHeight = contentHeight / questionCount;
      return Array.from({ length: questionCount }, (_, i) => ({
        top: header + i * sliceHeight,
        height: sliceHeight,
      }));
    })();

  const questions = [];
  for (let i = 0; i < questionCount; i += 1) {
    const { top, height } = slices[i];
    const cropPath = path.join(outDir, `p${pageNumber}-s${i + 1}.png`);
    await cropSlice(imagePath, top, height, cropPath);

    const ocr = await ocrImage(cropPath);
    const options = parseOptionsFromText(ocr.fullText);
    const text = buildQuestionText(ocr.fullText) || ocr.fullText;
    const numMatch = ocr.fullText.match(/^\s*(\d{1,2})\s*[.)]/m);
    const localNumber = numMatch ? parseInt(numMatch[1], 10) : null;
    const answerLetter = (localNumber && answerKeys[localNumber]) || answerKeys[String(localNumber)] || '';
    const hasVisual = await detectVisualQuestion(cropPath);

    questions.push({
      localNumber,
      pageNumber,
      sliceIndex: i + 1,
      text,
      options,
      answerLetter,
      cropPath,
      hasVisual,
      ocrPreview: ocr.fullText.slice(0, 2500),
    });
  }

  return questions;
}

/** @deprecated Tam sayfa satır tespiti — taranmış PDF'lerde splitPageIntoQuestions tercih edilir */
async function extractQuestionsFromPage(imagePath, opts = {}) {
  const count = opts.questionCount || opts.expectedCount || 0;
  if (count > 0) {
    return splitPageIntoQuestions(imagePath, count, opts);
  }
  return splitPageIntoQuestions(imagePath, 4, opts);
}

module.exports = {
  ocrImage,
  splitPageIntoQuestions,
  extractQuestionsFromPage,
  parseOptionsFromText,
  parseInlineOptions,
  mergeOptionSources,
  resolveCorrectAnswer,
  isGarbageAnswer,
  optionText,
  buildQuestionText,
  buildQuestionTextClean,
  cleanOcrText,
  letterToCorrectAnswer,
  terminateWorker,
};
