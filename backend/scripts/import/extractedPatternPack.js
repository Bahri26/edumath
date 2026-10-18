const fs = require('fs');
const path = require('path');

function sourceIdentity(slug, q) {
  return `${slug}:p${q.page}:q${q.questionNumber}`;
}

function validatePack(data, root, slug) {
  if (!data?.source?.classLevel || !Array.isArray(data.questions) || !data.questions.length) {
    throw new Error(`${slug}: sınıf ve sorular zorunlu`);
  }
  const seen = new Set();
  for (const q of data.questions) {
    const id = sourceIdentity(slug, q);
    if (!Number.isInteger(q.page) || q.page < 1 || !Number.isInteger(q.questionNumber) || q.questionNumber < 1 || seen.has(id)) {
      throw new Error(`${id}: geçersiz veya yinelenen kaynak kimliği`);
    }
    seen.add(id);
    if (!q.text?.trim() || !q.solution?.trim() || !['Kolay', 'Orta', 'Zor'].includes(q.difficulty)) {
      throw new Error(`${id}: metin, çözüm veya zorluk eksik`);
    }
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5 || q.options.some(o => typeof o !== 'string' || !o.trim()) || new Set(q.options).size !== q.options.length) {
      throw new Error(`${id}: geçersiz şıklar`);
    }
    if (!q.correctAnswer || !q.options.includes(q.correctAnswer) || q.needsReview) {
      throw new Error(`${id}: doğru cevap doğrulanmadan aktarım yapılamaz`);
    }
    if (q.hasVisual) {
      const target = path.resolve(root, q.diagramFile || '');
      const relative = path.relative(root, target);
      if (!q.diagramFile || relative.startsWith('..') || path.isAbsolute(relative) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
        throw new Error(`${id}: görsel eksik veya paket dışında`);
      }
    }
  }
  return { classLevel: data.source.classLevel, count: data.questions.length,
    images: data.questions.filter(q => q.hasVisual).length,
    difficulty: data.questions.reduce((r,q) => { r[q.difficulty] = (r[q.difficulty] || 0) + 1; return r; }, {}) };
}

module.exports = { sourceIdentity, validatePack };
