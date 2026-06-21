const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { uploadBuffer } = require('./storageService');

const ANALYSIS_WIDTH = 420;
const GAP_THRESHOLD = Number(process.env.CROP_GAP_THRESHOLD || 0.045);
const GAP_MIN_ROWS = Number(process.env.CROP_GAP_MIN_ROWS || 5);
const MIN_BAND_ROWS = Number(process.env.CROP_MIN_BAND_ROWS || 10);
const CROP_PADDING_PX = Number(process.env.CROP_PADDING_PX || 8);

function smoothRowDensity(values, window = 7) {
  const out = new Float32Array(values.length);
  const half = Math.floor(window / 2);
  for (let i = 0; i < values.length; i += 1) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(values.length - 1, i + half); j += 1) {
      sum += values[j];
      count += 1;
    }
    out[i] = sum / count;
  }
  return out;
}

function averageDensity(density, y0, y1) {
  let sum = 0;
  for (let y = y0; y < y1; y += 1) sum += density[y];
  return sum / Math.max(1, y1 - y0);
}

async function computeRowDensity(filePath) {
  const { data, info } = await sharp(filePath)
    .grayscale()
    .resize({ width: ANALYSIS_WIDTH, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  const density = new Float32Array(h);
  for (let y = 0; y < h; y += 1) {
    let ink = 0;
    for (let x = 0; x < w; x += 1) {
      ink += (255 - data[y * w + x]) / 255;
    }
    density[y] = ink / w;
  }

  return { density: smoothRowDensity(density), scaledHeight: h };
}

function findContentBands(density) {
  const bands = [];
  let inGap = true;
  let bandStart = 0;

  for (let y = 0; y < density.length; y += 1) {
    const isGap = density[y] < GAP_THRESHOLD;
    if (inGap && !isGap) {
      bandStart = y;
      inGap = false;
    } else if (!inGap && isGap) {
      if (y - bandStart >= MIN_BAND_ROWS) {
        bands.push({
          y0: bandStart,
          y1: y,
          score: averageDensity(density, bandStart, y),
          height: y - bandStart,
        });
      }
      inGap = true;
    }
  }

  if (!inGap && density.length - bandStart >= MIN_BAND_ROWS) {
    bands.push({
      y0: bandStart,
      y1: density.length,
      score: averageDensity(density, bandStart, density.length),
      height: density.length - bandStart,
    });
  }

  return bands;
}

function pickDiagramBand(bands, scaledHeight) {
  if (!bands.length) return null;

  const optionsBand = pickOptionsBand(bands, scaledHeight);
  const maxY = optionsBand ? optionsBand.y0 : scaledHeight * 0.9;

  const eligible = bands.filter((band) => {
    const centerY = (band.y0 + band.y1) / 2;
    return centerY > scaledHeight * 0.15
      && band.y1 <= maxY + 2
      && band.height >= scaledHeight * 0.12;
  });

  if (eligible.length) {
    return eligible.reduce((best, band) => (band.height > best.height ? band : best), eligible[0]);
  }

  let best = null;
  let bestMetric = 0;
  for (let i = 0; i < bands.length; i += 1) {
    const band = bands[i];
    const centerY = (band.y0 + band.y1) / 2;
    const heightRatio = band.height / scaledHeight;
    if (i === bands.length - 1 && heightRatio < 0.1) continue;
    if (centerY < scaledHeight * 0.12) continue;
    const middleBonus = centerY > scaledHeight * 0.2 && centerY < scaledHeight * 0.78 ? 1.35 : 0.75;
    const metric = band.height * band.score * middleBonus;
    if (metric > bestMetric) {
      bestMetric = metric;
      best = band;
    }
  }
  return best;
}

function pickOptionsBand(bands, scaledHeight) {
  if (bands.length < 2) return null;
  const last = bands[bands.length - 1];
  const centerY = (last.y0 + last.y1) / 2;
  if (centerY < scaledHeight * 0.55) return null;
  if (last.height > scaledHeight * 0.22) return null;
  return last;
}

function pickStemBand(bands) {
  if (!bands.length) return null;
  return bands[0];
}

function scaleBandToPixels(band, imageHeight, scaledHeight) {
  const scale = imageHeight / scaledHeight;
  const top = Math.max(0, Math.floor(band.y0 * scale) - CROP_PADDING_PX);
  const bottom = Math.min(imageHeight, Math.ceil(band.y1 * scale) + CROP_PADDING_PX);
  return {
    top,
    height: Math.max(1, bottom - top),
  };
}

async function extractBandPng(filePath, band, scaledHeight) {
  const meta = await sharp(filePath).metadata();
  const region = scaleBandToPixels(band, meta.height, scaledHeight);
  return sharp(filePath)
    .extract({
      left: 0,
      top: region.top,
      width: meta.width,
      height: region.height,
    })
    .png()
    .toBuffer();
}

async function saveTempCrop(buffer, baseName, suffix) {
  const uploaded = await uploadBuffer(buffer, {
    originalName: `${path.parse(baseName).name}-${suffix}.png`,
    mimeType: 'image/png',
    prefix: 'temp/crops',
    extension: '.png',
  });
  return uploaded.url;
}

/**
 * Sınav ekran görüntüsünden diyagram ve (varsa) şık şeridini kırpar.
 * @returns {Promise<{ diagramImagePath, optionsStripImagePath, cropRegions, cropMethod }|null>}
 */
async function extractQuestionImageRegions(filePath) {
  try {
    const meta = await sharp(filePath).metadata();
    if (!meta.width || !meta.height || meta.height < 120) {
      return null;
    }

    const { density, scaledHeight } = await computeRowDensity(filePath);
    const bands = findContentBands(density);
    if (bands.length < 2) {
      return fallbackRatioCrop(filePath, meta);
    }

    const diagramBand = pickDiagramBand(bands, scaledHeight);
    if (!diagramBand) {
      return fallbackRatioCrop(filePath, meta);
    }

    const baseName = path.basename(filePath);
    const diagramBuffer = await extractBandPng(filePath, diagramBand, scaledHeight);
    const diagramImagePath = await saveTempCrop(diagramBuffer, baseName, 'diagram');

    const optionsBand = pickOptionsBand(bands, scaledHeight);
    let optionsStripImagePath = '';
    if (optionsBand && optionsBand !== diagramBand) {
      const optionsBuffer = await extractBandPng(filePath, optionsBand, scaledHeight);
      optionsStripImagePath = await saveTempCrop(optionsBuffer, baseName, 'options');
    }

    const stemBand = pickStemBand(bands);
    const diagramRegion = scaleBandToPixels(diagramBand, meta.height, scaledHeight);
    const stemRegion = stemBand ? scaleBandToPixels(stemBand, meta.height, scaledHeight) : null;

    return {
      diagramImagePath,
      optionsStripImagePath,
      cropMethod: 'sharp-row-density',
      cropRegions: {
        diagram: diagramRegion,
        stem: stemRegion,
        imageSize: { width: meta.width, height: meta.height },
      },
    };
  } catch (error) {
    console.warn('questionImageCrop failed:', error?.message);
    return null;
  }
}

/** OCR başarısız olsa da orta bant için sabit oranlı kırpma */
async function fallbackRatioCrop(filePath, meta) {
  try {
    const top = Math.floor(meta.height * 0.2);
    const height = Math.floor(meta.height * 0.42);
    const buffer = await sharp(filePath)
      .extract({ left: 0, top, width: meta.width, height: Math.min(height, meta.height - top) })
      .png()
      .toBuffer();
    const diagramImagePath = await saveTempCrop(buffer, path.basename(filePath), 'diagram-ratio');
    return {
      diagramImagePath,
      optionsStripImagePath: '',
      cropMethod: 'sharp-ratio-fallback',
      cropRegions: {
        diagram: { top, height },
        imageSize: { width: meta.width, height: meta.height },
      },
    };
  } catch (error) {
    console.warn('fallbackRatioCrop failed:', error?.message);
    return null;
  }
}

function pickPatternDiagramBand(bands, scaledHeight) {
  if (!bands.length) return null;

  const optionsBand = pickOptionsBand(bands, scaledHeight);
  const maxY = optionsBand ? optionsBand.y0 - 2 : scaledHeight * 0.82;

  const candidates = bands.filter((band) => {
    const centerY = (band.y0 + band.y1) / 2;
    return centerY > scaledHeight * 0.14
      && band.y1 <= maxY + 1
      && band.height >= scaledHeight * 0.06;
  });

  if (!candidates.length) return null;

  const withoutStem = candidates.length > 1 ? candidates.slice(1) : candidates;
  return withoutStem.reduce((best, band) => {
    const metric = band.height * band.score * (band.height / scaledHeight);
    const bestMetric = best.height * best.score * (best.height / scaledHeight);
    return metric > bestMetric ? band : best;
  }, withoutStem[0]);
}

function pickBestPatternRatioRegion(density, scaledHeight) {
  const candidates = [
    { topRatio: 0.22, heightRatio: 0.28 },
    { topRatio: 0.32, heightRatio: 0.35 },
    { topRatio: 0.48, heightRatio: 0.42 },
  ];

  let best = candidates[0];
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const y0 = Math.floor(scaledHeight * candidate.topRatio);
    const y1 = Math.min(scaledHeight, Math.floor(scaledHeight * (candidate.topRatio + candidate.heightRatio)));
    let diagramScore = 0;
    let textPenalty = 0;
    let inkRows = 0;
    let maxRun = 0;
    let run = 0;
    for (let y = y0; y < y1; y += 1) {
      const rowInk = density[y];
      if (rowInk < 0.02) {
        run = 0;
        continue;
      }
      inkRows += 1;
      run += 1;
      maxRun = Math.max(maxRun, run);
      if (rowInk > 0.11 && rowInk < 0.4) textPenalty += 2;
      if (rowInk >= 0.02 && rowInk <= 0.12) diagramScore += 1;
      else if (rowInk > 0.02) diagramScore += 0.5;
    }
    const coverage = inkRows / Math.max(1, y1 - y0);
    const coverageBonus = coverage > 0.12 && coverage < 0.55 ? 5 : 0;
    const coveragePenalty = coverage > 0.65 ? (coverage - 0.65) * 40 : 0;
    const score = diagramScore - textPenalty + coverageBonus + Math.min(maxRun, 20) * 0.15 - coveragePenalty;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

async function extractPatternPdfDiagramBuffer(workPath, workMeta, inputBuffer = null) {
  const load = inputBuffer
    ? sharp(inputBuffer)
    : sharp(workPath);
  const { density, scaledHeight } = inputBuffer
    ? await computeRowDensityFromSharp(load)
    : await computeRowDensity(workPath);
  const bands = findContentBands(density);

  const singleLargeBand = bands.length === 1 && bands[0].height >= scaledHeight * 0.2;
  if (singleLargeBand) {
    const diagramBand = bands[0];
    const buffer = inputBuffer
      ? await extractBandFromSharp(load, diagramBand, scaledHeight, workMeta.height, workMeta.width)
      : await extractBandPng(workPath, diagramBand, scaledHeight);
    return { buffer, cropMethod: 'pattern-diagram-band' };
  }

  if (bands.length >= 3) {
    const diagramBand = pickPatternDiagramBand(bands, scaledHeight);
    if (diagramBand && diagramBand.height >= scaledHeight * 0.1) {
      const buffer = inputBuffer
        ? await extractBandFromSharp(load, diagramBand, scaledHeight, workMeta.height, workMeta.width)
        : await extractBandPng(workPath, diagramBand, scaledHeight);
      return { buffer, cropMethod: 'pattern-diagram-band' };
    }
  }

  const ratio = pickBestPatternRatioRegion(density, scaledHeight);
  const top = Math.floor(workMeta.height * ratio.topRatio);
  const height = Math.floor(workMeta.height * ratio.heightRatio);
  const buffer = await load
    .extract({
      left: 0,
      top,
      width: workMeta.width,
      height: Math.min(height, workMeta.height - top),
    })
    .png()
    .toBuffer();
  return { buffer, cropMethod: 'pattern-ratio' };
}

async function computeRowDensityFromSharp(image) {
  const { data, info } = await image
    .clone()
    .grayscale()
    .resize({ width: ANALYSIS_WIDTH, withoutEnlargement: true })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const density = new Float32Array(h);
  for (let y = 0; y < h; y += 1) {
    let ink = 0;
    for (let x = 0; x < w; x += 1) {
      ink += (255 - data[y * w + x]) / 255;
    }
    density[y] = ink / w;
  }
  return { density: smoothRowDensity(density), scaledHeight: h };
}

async function extractBandFromSharp(image, band, scaledHeight, imageHeight, imageWidth) {
  const region = scaleBandToPixels(band, imageHeight, scaledHeight);
  return image
    .clone()
    .extract({
      left: 0,
      top: region.top,
      width: imageWidth,
      height: region.height,
    })
    .png()
    .toBuffer();
}

/**
 * Soru diliminden yalnızca diyagram bandını PNG buffer olarak döndürür.
 * @param {string} filePath
 * @param {{ column?: 'left'|'right'|'full' }} [options]
 * @returns {Promise<{ buffer: Buffer, cropMethod: string }|null>}
 */
async function extractDiagramBufferFromFile(filePath, options = {}) {
  const { column = 'full' } = options;
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const meta = await sharp(filePath).metadata();
    if (!meta.width || !meta.height) return null;

    let image = sharp(filePath);
    const isWide = meta.width > meta.height * 1.15;
    if (isWide && (column === 'left' || column === 'right')) {
      const gutter = Math.floor(meta.width * 0.02);
      const half = Math.floor(meta.width * 0.48);
      const left = column === 'left' ? 0 : Math.floor(meta.width * 0.5) + gutter;
      const width = column === 'left' ? half : meta.width - left;
      const colBuffer = await sharp(filePath)
        .extract({ left, top: 0, width: Math.max(40, width), height: meta.height })
        .png()
        .toBuffer();
      image = sharp(colBuffer);
    }

    const workMeta = await image.metadata();
    const inputBuffer = isWide && (column === 'left' || column === 'right')
      ? await image.png().toBuffer()
      : null;
    return extractPatternPdfDiagramBuffer(filePath, workMeta, inputBuffer);
  } catch (error) {
    console.warn('extractDiagramBufferFromFile failed:', error?.message);
    return null;
  }
}

/**
 * Diyagram bandını hariç tutarak üst (giriş) ve alt (soru+şık) OCR bölgelerini üretir.
 */
async function extractTextRegionsExcludingDiagram(filePath) {
  const cropAssets = await extractQuestionImageRegions(filePath);
  const meta = await sharp(filePath).metadata();
  if (!meta.width || !meta.height) {
    return { topTextBuffer: null, bottomTextBuffer: null, cropAssets };
  }

  const diagram = cropAssets?.cropRegions?.diagram;
  if (!diagram || !diagram.height) {
    return { topTextBuffer: null, bottomTextBuffer: null, cropAssets };
  }

  const gap = CROP_PADDING_PX + 4;
  const topEnd = Math.max(0, Math.min(meta.height, diagram.top - gap));
  const bottomStart = Math.min(meta.height, diagram.top + diagram.height + gap);
  const bottomHeight = meta.height - bottomStart;

  let topTextBuffer = null;
  let bottomTextBuffer = null;

  if (topEnd >= 48) {
    topTextBuffer = await sharp(filePath)
      .extract({ left: 0, top: 0, width: meta.width, height: topEnd })
      .png()
      .toBuffer();
  }

  if (bottomHeight >= 48) {
    bottomTextBuffer = await sharp(filePath)
      .extract({ left: 0, top: bottomStart, width: meta.width, height: bottomHeight })
      .png()
      .toBuffer();
  }

  return { topTextBuffer, bottomTextBuffer, cropAssets };
}

module.exports = {
  extractQuestionImageRegions,
  extractTextRegionsExcludingDiagram,
  extractDiagramBufferFromFile,
  computeRowDensity,
  findContentBands,
  pickDiagramBand,
};
