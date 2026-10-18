const { mcAnswersMatch } = require('./questionGrading');

function validateQuestionEdit({ text, type, options, correctAnswer }) {
  if (!String(text || '').trim()) return 'Soru metni gereklidir.';
  if (type !== 'multiple-choice') return '';
  const texts = (options || []).map(o => String(typeof o === 'string' ? o : o?.text || '').trim());
  if (texts.length < 2 || texts.length > 5 || texts.some(t => !t)) return '2–5 dolu şık gereklidir.';
  if (new Set(texts).size !== texts.length) return 'Şık metinleri birbirinden farklı olmalıdır.';
  if (!texts.some((_, i) => mcAnswersMatch({ options: texts }, String.fromCharCode(65 + i), correctAnswer))) return 'Doğru cevap mevcut şıklardan biri olmalıdır.';
  return '';
}

module.exports = { validateQuestionEdit };
