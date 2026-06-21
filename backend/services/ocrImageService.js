const sharp = require('sharp');
const Tesseract = require('tesseract.js');

const PREPROCESS_WIDTH = Number(process.env.OCR_PREPROCESS_WIDTH || 1800);

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await Tesseract.createWorker('tur+eng', Tesseract.OEM.LSTM_ONLY, { logger: () => {} });
      return worker;
    })();
  }
  return workerPromise;
}

/**
 * OCR öncesi görseli büyütür, gri tonlar, kontrast ve keskinlik uygular.
 */
async function preprocessForOcr(input) {
  const meta = await sharp(input).metadata();
  let pipeline = sharp(input).rotate();

  const width = meta.width || PREPROCESS_WIDTH;
  if (width < PREPROCESS_WIDTH) {
    pipeline = pipeline.resize({ width: PREPROCESS_WIDTH, withoutEnlargement: false });
  } else if (width > PREPROCESS_WIDTH * 1.4) {
    pipeline = pipeline.resize({ width: PREPROCESS_WIDTH, withoutEnlargement: true });
  }

  return pipeline.grayscale().normalize().sharpen({ sigma: 1.2 }).png().toBuffer();
}

/**
 * Görsel yolundan veya buffer'dan metin okur.
 */
async function recognizeText(input, { preprocess = true } = {}) {
  const worker = await getWorker();
  let source = input;

  if (preprocess) {
    source = await preprocessForOcr(input);
  }

  try {
    const { data } = await worker.recognize(source);
    return String(data?.text || '').trim();
  } catch (primaryError) {
    console.warn('OCR tur+eng failed, retry without preprocess:', primaryError?.message);
    const { data } = await worker.recognize(input);
    return String(data?.text || '').trim();
  }
}

/**
 * Diyagram hariç üst/alt metin bölgelerini ayrı OCR edip birleştirir.
 */
async function recognizeTextFromRegions({ topBuffer, bottomBuffer, fullPath }) {
  const parts = [];

  if (topBuffer) {
    const top = await recognizeText(topBuffer);
    if (top) parts.push(top);
  }
  if (bottomBuffer) {
    const bottom = await recognizeText(bottomBuffer);
    if (bottom) parts.push(bottom);
  }

  if (parts.length) return parts.join('\n\n');
  if (fullPath) return recognizeText(fullPath);
  return '';
}

module.exports = {
  getWorker,
  preprocessForOcr,
  recognizeText,
  recognizeTextFromRegions,
  PREPROCESS_WIDTH,
};
