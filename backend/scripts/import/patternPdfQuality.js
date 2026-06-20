/**
 * PDF içe aktarım sorularında OCR kalite kontrolü.
 */

function hasOcrNoise(text) {
  const t = String(text || '');
  return /[|¦©]|_{3,}|\\\\|^\s*A\s*$/m.test(t)
    || (t.match(/[A-E]\)/g) || []).length > 6
    || /[A-E]\s*[A-E]\s*[A-E]/.test(t);
}

function isFallbackText(text) {
  return /örüntü sorusu \d+$/i.test(String(text || '').trim());
}

function isWeakCorrectAnswer(answer, options) {
  const a = String(answer || '').trim();
  if (!a || a.length < 1) return true;
  if (/^[A-E]$/i.test(a)) return false;
  if (a.length > 80) return true;
  if (/[|¦]/.test(a)) return true;
  if (/^[A-E]\)/i.test(a)) return true;
  if (/^\d+\s+[A-E]\)/.test(a)) return true;
  if (/Yalnız|Örüntüdeki kibrit|İki basamaklı/i.test(a) && a.length > 40) return true;
  const optTexts = (options || []).map((o) => String(o.text || o || '').trim()).filter(Boolean);
  if (optTexts.length >= 2 && !optTexts.some((o) => o === a || o.includes(a) || a.includes(o))) {
    if (/[A-E]\)/.test(a) || a.split(/\s+/).length > 6) return true;
  }
  return false;
}

function isWeakOptions(options) {
  const opts = (options || []).map((o) => String(o.text || o || '').trim()).filter(Boolean);
  if (opts.length < 2) return true;
  const noisy = opts.filter((o) => o.length < 1 || /^[|)\s]+$/.test(o) || o.length > 120);
  return noisy.length >= Math.ceil(opts.length / 2);
}

function isGenericSolution(solution) {
  const s = String(solution || '').trim();
  return !s || s === 'Çözüm: örüntü kuralını bulun, adım adım uygulayın ve şıklarla karşılaştırın.';
}

function assessQuestion(q) {
  const issues = [];
  const options = q.options || [];
  const text = q.text || '';
  const answer = q.correctAnswer || '';
  const meta = q.assessmentMeta || {};

  if (isFallbackText(text)) issues.push('metin-eksik');
  if (text.length < 25) issues.push('metin-kisa');
  if (hasOcrNoise(text)) issues.push('metin-gurultu');
  if (isWeakOptions(options)) issues.push('sik-zayif');
  if (isWeakCorrectAnswer(answer, options)) issues.push('cevap-zayif');
  if (isGenericSolution(q.solution)) issues.push('cozum-jenerik');
  if (!q.image) issues.push('gorsel-yok');
  if (meta.answerLetter && options.length >= 2) {
    const idx = meta.answerLetter.charCodeAt(0) - 65;
    const expected = String(options[idx]?.text || options[idx] || '').trim();
    if (expected && answer !== expected && !answer.includes(expected.slice(0, 8))) {
      issues.push('anahtar-uyumsuz');
    }
  }

  const severity = issues.includes('cevap-zayif') || issues.includes('metin-eksik') ? 'kritik'
    : issues.includes('sik-zayif') || issues.includes('cozum-jenerik') ? 'orta'
    : issues.length ? 'dusuk' : 'ok';

  return { issues, severity, needsReview: issues.length > 0 && severity !== 'ok' };
}

module.exports = {
  assessQuestion,
  hasOcrNoise,
  isWeakCorrectAnswer,
  isWeakOptions,
  isGenericSolution,
};
