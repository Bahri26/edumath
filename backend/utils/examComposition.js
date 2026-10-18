const { mcAnswersMatch } = require('./questionGrading');
const { extractGradeNumber } = require('./classLevel');

function isQuestionReady(q) {
  if (!q || !String(q.text || '').trim() || !String(q.correctAnswer || '').trim() || q.assessmentMeta?.needsReview || q.assessmentMeta?.hasVisualPending) return false;
  if (q.type === 'multiple-choice') {
    const options = Array.isArray(q.options) ? q.options : [];
    const keys = options.map(o=>JSON.stringify([String(typeof o==='string'?o:o?.text||'').trim(),o?.image||'']));
    return options.length >= 2 && options.length <= 5 && new Set(keys).size === options.length
      && options.every(o=>String(typeof o==='string'?o:o?.text||'').trim() || o?.image)
      && options.some((o,i) => mcAnswersMatch(q,String.fromCharCode(65+i),q.correctAnswer));
  }
  return true;
}

function questionFingerprint(q) {
  const clean = value => String(value || '').normalize('NFKC').toLocaleLowerCase('tr').replace(/\s+/g,' ').trim();
  return JSON.stringify([q.classLevel,q.type,clean(q.text),(q.options||[]).map(o=>[clean(typeof o==='string'?o:o.text),o.image||'']),q.image||'']);
}

function validateExamBasics({ title, classLevel, duration, startAt, endAt }) {
  if (!String(title || '').trim()) return 'Sınav başlığı zorunludur.';
  if (!extractGradeNumber(classLevel)) return 'Geçerli bir sınıf seçiniz.';
  if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) return 'Sınav süresi pozitif bir sayı olmalıdır.';
  const start = startAt ? new Date(startAt) : new Date();
  const end = endAt ? new Date(endAt) : new Date(start.getTime() + 90 * 86400000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return 'Sınav tarihlerini kontrol edin; bitiş başlangıçtan sonra olmalıdır.';
  return '';
}

function validateManualQuestions(questions, classLevel, subject) {
  if (questions.length !== 21) return 'Sınav için 21 farklı soru gereklidir.';
  if (new Set(questions.map(q=>String(q._id))).size!==questions.length || new Set(questions.map(questionFingerprint)).size!==questions.length) return 'Aynı soru sınavda birden fazla kullanılamaz.';
  if (questions.some(q=>q.classLevel!==classLevel)) return 'Seçilen sorular sınavın sınıfına ait olmalıdır.';
  if (questions.some(q=>q.subject!==subject)) return 'Seçilen sorular aynı derse ait olmalıdır.';
  if (questions.some(q=>!isQuestionReady(q))) return 'Eksik veya inceleme bekleyen sorular sınavda kullanılamaz.';
  if (['Kolay','Orta','Zor'].some(d=>questions.filter(q=>q.difficulty===d).length!==7)) return 'Her zorluk seviyesinden 7 soru seçilmelidir (7-7-7).';
  return '';
}

function selectExamQuestions(pool, random = Math.random) {
  const seen=new Set(), unique=[];
  for (const q of pool) {
    const fingerprint=questionFingerprint(q);
    if (!isQuestionReady(q) || seen.has(fingerprint)) continue;
    seen.add(fingerprint); unique.push(q);
  }
  for (let i=unique.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1)); [unique[i],unique[j]]=[unique[j],unique[i]];
  }
  const counts={}, selected=[];
  for (const d of ['Kolay','Orta','Zor']) {
    const bucket=unique.filter(q=>q.difficulty===d); counts[d]=bucket.length;
    selected.push(...bucket.slice(0,7));
  }
  return { questions:selected, counts, sufficient:Object.values(counts).every(n=>n>=7) };
}

module.exports={isQuestionReady,questionFingerprint,validateExamBasics,validateManualQuestions,selectExamQuestions};
