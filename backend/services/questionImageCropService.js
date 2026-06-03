const path = require('path');
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

module.exports = {
  extractQuestionImageRegions,
  computeRowDensity,
  findContentBands,
};
