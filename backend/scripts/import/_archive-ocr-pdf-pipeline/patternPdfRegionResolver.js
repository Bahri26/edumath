/**
 * sequenceIndex → kaynak kırpım dosyası + sütun (2 sütunlu PDF düzeni).
 */
const path = require('path');
const fs = require('fs');

const DATA_ROOT = path.join(__dirname, '..', '..', 'data', 'pattern-pdf-import');

const PAGE_SPLITS = {
  '5-sinif': [4, 4, 4, 4, 3, 2],
  '6-sinif': [3, 3, 3, 3, 3, 2, 2, 2],
  '7-sinif': [4, 4, 4, 4, 3, 2],
  '9-sinif': [4, 4, 4, 4, 4, 1],
};

function slugFromClass(classLevel) {
  return classLevel.replace('. Sınıf', '-sinif');
}

function locateSlice(classLevel, sequenceIndex) {
  const slug = slugFromClass(classLevel);
  const splits = PAGE_SPLITS[slug];
  if (!splits) return null;
  let remaining = sequenceIndex;
  for (let pi = 0; pi < splits.length; pi += 1) {
    const count = splits[pi];
    if (remaining <= count) {
      return { page: pi + 1, slice: remaining, slicesOnPage: count };
    }
    remaining -= count;
  }
  return null;
}

/** 13–16. sorular ortak görsel */
function sharedCropPath(classLevel, sequenceIndex) {
  if (classLevel === '5. Sınıf' && sequenceIndex >= 13 && sequenceIndex <= 16) {
    const shared = path.join(DATA_ROOT, '5-sinif', 'crops', 'p4-s1.png');
    return fs.existsSync(shared) ? shared : null;
  }
  return null;
}

/**
 * @returns {{ cropPath: string|null, column: 'left'|'right'|'full'|'none', skipImage: boolean }}
 */
function resolveQuestionRegion(classLevel, sequenceIndex) {
  const shared = sharedCropPath(classLevel, sequenceIndex);
  if (shared) {
    return { cropPath: shared, column: 'full', skipImage: false };
  }

  const loc = locateSlice(classLevel, sequenceIndex);
  if (!loc) return { cropPath: null, column: 'full', skipImage: true };

  const slug = slugFromClass(classLevel);
  let cropSlice = loc.slice;
  let column = 'full';
  let skipImage = false;

  if (loc.slicesOnPage === 4) {
    if (loc.slice === 2) {
      skipImage = true;
      column = 'none';
    } else if (loc.slice === 4) {
      cropSlice = 1;
      column = 'right';
    } else if (loc.slice === 1 || loc.slice === 3) {
      column = 'left';
    }
  }

  const cropPath = path.join(DATA_ROOT, slug, 'crops', `p${loc.page}-s${cropSlice}.png`);
  if (!fs.existsSync(cropPath)) {
    return { cropPath: null, column, skipImage: true };
  }

  return { cropPath, column, skipImage };
}

module.exports = {
  DATA_ROOT,
  PAGE_SPLITS,
  slugFromClass,
  locateSlice,
  resolveQuestionRegion,
  sharedCropPath,
};
