/**
 * Yalnızca "Örüntüler" konusunda, görseli soruyla tutarlı MC sorular üretir.
 */
const {
  choice,
  buildSvgBoxPattern,
  buildSvgDotsGrid,
  wrapCanvas,
  centerInnerTranslate,
  buildNumberLineSvg,
  escapeXml,
} = require('./patternSvgCore');
const {
  PATTERN_TOPIC_LABELS,
  LEARNING_OUTCOME_BY_LABEL,
} = require('../../constants/patternTopics');

const CLASS_LEVELS = [
  '1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf',
  '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
  '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf',
];

function classNum(cl) {
  return parseInt(String(cl).trim().split('.')[0], 10);
}

function dIndex(difficulty) {
  if (difficulty === 'Kolay') return 0;
  if (difficulty === 'Orta') return 1;
  return 2;
}

const SHAPE_LABEL = {
  circle: 'Daire',
  square: 'Kare',
  triangle: 'Üçgen',
};

function shuffleOptions(correct, wrongPool, n = 4) {
  const need = n - 1;
  const picks = [...new Set(wrongPool.map(String))].filter((w) => w !== String(correct)).slice(0, need);
  let k = 0;
  while (picks.length < need) {
    k += 1;
    const num = Number(correct);
    if (Number.isFinite(num)) picks.push(String(num + k * 17));
    else picks.push(`${correct} (${k})`);
  }
  const all = [String(correct), ...picks].slice(0, n);
  for (let i = all.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function mc4(correctNum, wrongPool) {
  const correct = String(correctNum);
  return { options: shuffleOptions(correct, wrongPool), correctAnswer: correct };
}

/** Şekil tekrarı: doğru Türkçe şıklar */
function genShapeRepeat({ classLevel, difficulty, slot }) {
  const di = dIndex(difficulty);
  const cn = classNum(classLevel);
  const useThree = di === 2 || cn >= 7;
  const cycle = useThree ? ['circle', 'square', 'triangle'] : ['circle', 'square'];
  const lenBase = cn <= 3 ? 5 : cn <= 6 ? 6 : 7;
  const len = lenBase + (di === 2 ? 1 : 0) + (slot % 2);
  const seq = Array.from({ length: len }, (_, idx) => choice(cycle, idx));
  const correctKey = choice(cycle, len);
  const items = [...seq.slice(0, len - 1), '?'];
  const inner = centerInnerTranslate(buildSvgBoxPattern({ items, size: cn <= 4 ? 78 : 70 }));
  const svg = wrapCanvas(inner, '');
  const correctTr = SHAPE_LABEL[correctKey];
  const pool = Object.values(SHAPE_LABEL).filter((t) => t !== correctTr);
  return {
    text: 'Şekillerden oluşan örüntüye göre soru işareti yerine hangi şekil gelmelidir?',
    topic: PATTERN_TOPIC_LABELS.GEOMETRIC,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.GEOMETRIC],
    options: shuffleOptions(correctTr, [...pool, 'Düz çizgi', 'Beşgen']),
    correctAnswer: correctTr,
    solution: `Örüntü ${cycle.map((x) => SHAPE_LABEL[x] || x).join(' → ')} düzeninde tekrarlanır.`,
    svg,
  };
}

/** Sayı dizisi sabit artış */
function genArithmetic({ classLevel, difficulty, slot }) {
  const di = dIndex(difficulty);
  const cn = classNum(classLevel);
  let step = 2 + cn % 5 + slot % 3;
  if (di === 0) step = Math.max(2, Math.min(step, 4));
  else if (di === 1) step = Math.max(4, Math.min(step, 8));
  else step = Math.max(7, Math.min(step, 12));

  const start = 5 + ((cn + slot + di * 3) % 11);
  const len = di === 2 ? 7 : 6;
  const miss = (3 + slot + di) % (len - 1);
  const seq = Array.from({ length: len }, (_, i) => start + i * step);
  const correct = seq[miss];
  const line = seq.map((v, i) => (i === miss ? '?' : String(v))).join(', ');
  const svg = buildNumberLineSvg(line);
  const { options, correctAnswer } = mc4(correct, [correct - step, correct + step, correct + step * 2]);
  return {
    text: 'Sayıların oluşturduğu örüntüye göre soru işareti yerine hangi sayı gelmelidir?',
    topic: PATTERN_TOPIC_LABELS.ARITHMETIC,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.ARITHMETIC],
    options,
    correctAnswer,
    solution: `Örüntü her adımda ${step} artıyor: ${correct} doğru.`,
    svg,
  };
}

/** İki adımlı +/- kuralı (üst sınıflar için; küçük sınıflarda basit çift katlar) */
function genTwoStepOrDouble({ classLevel, difficulty, slot }) {
  const cn = classNum(classLevel);
  const di = dIndex(difficulty);
  if (cn <= 4) {
    const start = 2 + (slot % 6);
    const step = di + 2;
    const seq = Array.from({ length: 6 }, (_, i) => start + i * step);
    const miss = 3 + (slot % 2);
    const correct = seq[miss];
    const line = seq.map((v, i) => (i === miss ? '?' : String(v))).join(', ');
    const svg = buildNumberLineSvg(line);
    const { options, correctAnswer } = mc4(correct, [correct - step, correct + step, correct + step * 2]);
    return {
      text: 'Aşağıdaki sayı örüntüsünde soru işaretinin yerinde hangi sayı olmalıdır?',
      topic: PATTERN_TOPIC_LABELS.ARITHMETIC,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.ARITHMETIC],
      options,
      correctAnswer,
      solution: `Aynı fark ile ilerliyor: ${step}. Eksik terim ${correct}.`,
      svg,
    };
  }

  const a = di === 0 ? 2 : di === 1 ? 3 : 5;
  const b = di === 0 ? 1 : di === 1 ? 2 : 4;
  const start = 6 + ((cn + slot) % 8);
  const len = 7;
  const seq = [];
  let x = start;
  for (let k = 0; k < len; k += 1) {
    seq.push(x);
    x += (k % 2 === 0 ? a : -b);
  }
  const miss = 5;
  const correct = seq[miss];
  const line = seq.map((v, i) => (i === miss ? '?' : String(v))).join(', ');
  const subtitle = `(İpucu: önce +${a}, sonra -${b} tekrarı)`;
  const body = `
  <svg width="920" height="160" viewBox="0 0 920 160">
    <rect width="920" height="160" rx="18" fill="white" stroke="#E2E8F0"/>
    <text x="36" y="58" font-size="30" font-family="system-ui,sans-serif" font-weight="600" fill="#0F172A">${escapeXml(line)}</text>
    <text x="36" y="108" font-size="15" fill="#64748B" font-family="system-ui,sans-serif">${escapeXml(subtitle)}</text>
  </svg>`;
  const svg = wrapCanvas(`<g transform="translate(-460,-96)">${body}</g>`, '');
  const { options, correctAnswer } = mc4(correct, [correct + a, correct - b, correct + (a - b)]);
  return {
    text: 'Örüntüde soru işareti yerine hangi sayı gelmelidir?',
    topic: PATTERN_TOPIC_LABELS.RULE,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.RULE],
    options,
    correctAnswer,
    solution: `Kural sırayla +${a} ve -${b} uygulanır; eksik terim ${correct}.`,
    svg,
  };
}

/** Kare sayılar – nokta grupları */
function genSquareDots({ difficulty, slot }) {
  const di = dIndex(difficulty);
  const base = di === 0 ? 2 : di === 1 ? 3 : 5;
  const shift = slot % 5;
  const n1 = base + shift;
  const n2 = n1 + 1;
  const n3 = n1 + 2;
  const terms = [n1 * n1, n2 * n2, n3 * n3];
  const correct = (n1 + 3) * (n1 + 3);
  const line = [...terms.map(String), '?'].join(', ');
  const g1 = buildSvgDotsGrid({ n: terms[0], cols: Math.min(11, Math.ceil(Math.sqrt(terms[0]))), dot: 10 });
  const g2 = buildSvgDotsGrid({ n: terms[1], cols: Math.min(11, Math.ceil(Math.sqrt(terms[1]))), dot: 10 });
  const g3 = buildSvgDotsGrid({ n: terms[2], cols: Math.min(11, Math.ceil(Math.sqrt(terms[2]))), dot: 10 });
  const strip = [g1, g2, g3]
    .map((inner, idx) => {
      const tx = idx * 300 - 440;
      return `<g transform="translate(${tx},-20)">${inner.replace(/<\?xml[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/g, '')}</g>`;
    })
    .join('');
  const top = `
  <text x="500" y="36" text-anchor="middle" font-size="21" fill="#0F172A" font-family="system-ui,sans-serif">${escapeXml(line)}</text>`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360">
  <rect width="1000" height="360" rx="24" fill="#FAFBFF" stroke="#C7D2FE" stroke-width="2"/>
  ${top}
  <g transform="translate(520,208)">${strip}</g>
  <text x="500" y="340" text-anchor="middle" font-size="13" fill="#64748B" font-family="system-ui,sans-serif">Her blok bir tam karenin içindeki nokta sayısıdır.</text>
</svg>`;
  const { options, correctAnswer } = mc4(correct, [correct + 13, correct - (n2 * 2), (n1 + 4) * (n1 + 4)]);
  return {
    text: 'Kare sayı örüntüsünü göz önünde bulundurun. Soru işareti yerine hangi tam sayı gelmelidir?',
    topic: PATTERN_TOPIC_LABELS.SQUARES,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.SQUARES],
    options,
    correctAnswer,
    solution: squareSolutionText(n1, n2, n3, correct),
    svg,
  };
}

function squareSolutionText(n1, n2, n3, correct) {
  return `Üst sıra sırasıyla ${n1}²=${n1 * n1}, ${n2}²=${n2 * n2}, ${n3}²=${n3 * n3} değerlerini veriyor; sonraki terim (${n1 + 3})²=${correct}.`;
}

/** üçgensel sayılar 1,3,6,10 */
function genTriangular({ slot }) {
  const T = (k) => (k * (k + 1)) / 2;
  const base = 2 + (slot % 4);
  const t1 = T(base);
  const t2 = T(base + 1);
  const t3 = T(base + 2);
  const correct = Math.round(T(base + 3));
  const cols1 = Math.min(14, Math.max(6, Math.ceil((Math.sqrt(8 * t1 + 1) - 1) / 2)));
  const g1 = buildSvgDotsGrid({ n: t1, cols: cols1, dot: 9 });
  const g2 = buildSvgDotsGrid({ n: t2, cols: Math.min(14, cols1 + 1), dot: 9 });
  const g3 = buildSvgDotsGrid({ n: t3, cols: Math.min(14, cols1 + 2), dot: 9 });
  const line = `${t1}, ${t2}, ${t3}, ?`;
  const strip = [g1, g2, g3]
    .map((inner, idx) => `<g transform="translate(${idx * 300 - 440},10)">${inner.replace(/<\?xml[^>]*>/g, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/g, '')}</g>`)
    .join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="360" viewBox="0 0 1000 360">
  <rect width="1000" height="360" rx="24" fill="#FFFBF5" stroke="#FDE68A" stroke-width="2"/>
  <text x="500" y="40" text-anchor="middle" font-size="21" fill="#0F172A">${escapeXml(line)}</text>
  <g transform="translate(520,205)">${strip}</g>
  <text x="500" y="334" text-anchor="middle" font-size="13" fill="#92400E" font-family="system-ui,sans-serif">Üçgensel dizide sıradaki grup bir alt satırda bir nokta daha eklenir.</text>
</svg>`;
  const { options, correctAnswer } = mc4(correct, [correct - 6, correct + 10, Math.round(T(base + 2))]);
  return {
    text: 'Her gruptaki mavi nokta sayıları üçgensel bir örüntü oluşturmaktadır. Soru işareti yerindeki sayı kaçtır?',
    topic: PATTERN_TOPIC_LABELS.TRIANGULAR,
    learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.TRIANGULAR],
    options,
    correctAnswer,
    solution: `Sıradaki terim üçgensel sayı T(${base + 3}) = ${correct} (yani ${t1}, ${t2}, ${t3} sonrası).`,
    svg,
  };
}

/**
 * Ana fabrika: slot 0..6 sabit görev tipi döngüsü.
 */
function buildPatternQuestionDef(classLevel, difficulty, slot) {
  const t = slot % 7;
  if (t === 0 || t === 1) return genShapeRepeat({ classLevel, difficulty, slot: t });
  if (t === 2) return genArithmetic({ classLevel, difficulty, slot });
  if (t === 3) return genArithmetic({ classLevel, difficulty, slot: slot + 23 });
  if (t === 4) return genTwoStepOrDouble({ classLevel, difficulty, slot });
  if (t === 5) return genSquareDots({ difficulty, slot });
  return genTriangular({ slot });
}

module.exports = {
  CLASS_LEVELS,
  buildPatternQuestionDef,
};
