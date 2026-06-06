/**
 * Soru havuzundan esinlenerek YENİ sorular üretir (birebir kopya değil).
 * Önce ml-service, sonra yerel JS fallback.
 */

const {
  fetchQuestionPoolRows,
  formatSamplesForPrompt,
} = require('./questionPoolSamplesService');
const {
  filterPoolSamplesForGeneration,
  resolveTemplateKind,
  templateElementaryPattern,
  isSampleTooAdvancedForGrade,
  parseGradeFromClassLevel,
} = require('./gradeAwareQuestionTemplates');
const mlServiceClient = require('./mlServiceClient');
const { solvePatternQuestion } = require('./patternQuestionSolver');
const { generateFallbackPatternQuestions } = require('./aiQuestionGeneratorService');

const CONTEXT_THEMES = [
  ['boncuk', 'renkli boncuklar'],
  ['kutu', 'karton kutular'],
  ['mozaik', 'mozaik parçaları'],
  ['kitap', 'kütüphane rafları'],
  ['kare', 'kare fayanslar'],
  ['top', 'renkli toplar'],
];

const MEB_REF = 'MEB Matematik Öğretim Programı (2018) — öğretmen havuzu stiline uyumlu yerel üretim';

function seededIndex(key, max) {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h % max;
}

function replaceNumbers(text, seed, scale = null) {
  return String(text || '').replace(/-?\d+(?:[.,]\d+)?/g, (match) => {
    const val = parseFloat(match.replace(',', '.'));
    if (!Number.isFinite(val) || Math.abs(val) >= 1000) return match;
    const base = Math.round(val);
    if (scale != null) {
      return String(Math.max(1, Math.round(base * scale)));
    }
    const delta = (seededIndex(`${seed}-${match}`, 9) - 3);
    return String(Math.max(1, base + delta));
  });
}

function classifySample(text) {
  const t = String(text || '').toLowerCase();
  if (/alt[ıi]gen|altigen/.test(t) && /ad[ıi]m/.test(t)) return 'hexagon';
  if (/üçgen|ucgen|eşkenar|eskenar/.test(t) && /çevre|cevre/.test(t)) return 'triangle_perimeter';
  if (/kural|hangisi|ifade/.test(t) && /örüntü|oruntu|k[uü]p|birim/.test(t)) return 'algebraic_rule';
  if (/terim|dizi|oruntu|örüntü|art[ıi]/.test(t)) return 'arithmetic';
  return 'generic';
}

function difficultyRange(difficulty) {
  const d = String(difficulty || 'Orta').toLowerCase();
  if (d.startsWith('kol')) return [2, 6];
  if (d.startsWith('zor')) return [8, 18];
  return [4, 12];
}

function buildSolutionLines(lines) {
  return lines.filter(Boolean).map((line, i) => `${i + 1}. ${line}`).join('\n');
}

function templateHexagon(step, themeIdx, difficulty) {
  const theme = CONTEXT_THEMES[themeIdx % CONTEXT_THEMES.length][1];
  const predicted = step * 2;
  let opts = [predicted, predicted + 2, Math.max(2, predicted - 2), predicted + 4];
  opts = [...new Set(opts)].slice(0, 4).map(String);
  const correct = String(predicted);
  if (!opts.includes(correct)) opts[0] = correct;
  const idx = opts.indexOf(correct);
  return {
    text: `${theme.charAt(0).toUpperCase() + theme.slice(1)} örüntüsünde her adımda altıgen sayısı iki katına çıkmaktadır. Buna göre ${step}. adımda kaç altıgen vardır?`,
    options: opts,
    correctAnswer: correct,
    solution: buildSolutionLines([
      'Her adımda altıgen sayısı 2 katına çıkar.',
      `${step}. adım: ${step} × 2 = ${predicted} altıgen.`,
      `Doğru cevap ${String.fromCharCode(65 + idx)}) ${correct} şıkkıdır.`,
    ]),
    learningOutcome: 'Örüntüdeki çarpan kuralını kullanarak istenen adımdaki değeri bulur.',
    generatorMethod: 'template',
  };
}

function templateArithmetic(difficulty, themeIdx, seed) {
  const theme = CONTEXT_THEMES[themeIdx % CONTEXT_THEMES.length][1];
  const [lo, hi] = difficultyRange(difficulty);
  const first = lo + seededIndex(`${seed}-first`, hi - lo + 1);
  const diff = difficulty === 'Zor' ? 4 + seededIndex(`${seed}-d`, 6) : 2 + seededIndex(`${seed}-d`, 4);
  const askStep = difficulty === 'Zor' ? 5 + seededIndex(`${seed}-s`, 5) : 4 + seededIndex(`${seed}-s`, 4);
  const predicted = first + diff * (askStep - 1);
  let opts = [predicted, predicted + diff, predicted - diff, predicted + 2 * diff]
    .filter((n) => n > 0)
    .map(String);
  opts = [...new Set(opts)].slice(0, 4);
  const correct = String(predicted);
  if (!opts.includes(correct)) opts[0] = correct;
  const idx = opts.indexOf(correct);
  const seq = [first, first + diff, first + 2 * diff, first + 3 * diff].join(', ');
  return {
    text: `${theme.charAt(0).toUpperCase() + theme.slice(1)} tablosunda ${seq}, ... örüntüsü devam etmektedir. Buna göre ${askStep}. terim kaçtır?`,
    options: opts,
    correctAnswer: correct,
    solution: buildSolutionLines([
      `Terimler arası fark sabit: +${diff}.`,
      `${askStep}. terim: ${first} + ${diff} × (${askStep} − 1) = ${predicted}.`,
      `Doğru cevap ${String.fromCharCode(65 + idx)}) ${correct} şıkkıdır.`,
    ]),
    learningOutcome: 'Aritmetik dizide istenen terimi hesaplar.',
    generatorMethod: 'template',
  };
}

function variantFromSample(sample, params, index) {
  const text = String(sample.text || '').trim();
  if (!text) return null;

  const seed = `${params.topic}-${params.classLevel}-${index}`;
  const scale = 0.9 + (seededIndex(seed, 10) / 20);
  const newText = replaceNumbers(text, seed, scale);
  const newOpts = (sample.options || []).slice(0, 4).map((o) => replaceNumbers(o, `${seed}-opt`, scale));
  while (newOpts.length < 4) newOpts.push('');

  const payload = {
    text: newText,
    options: newOpts,
    topic: params.topic || sample.topic,
    difficulty: params.difficulty || sample.difficulty,
    ocrPreview: text.slice(0, 500),
  };

  const solved = solvePatternQuestion(payload);
  let correct = String(sample.correctAnswer || '').trim();
  let solution = String(sample.solution || '').trim();

  if (solved?.correctAnswer) {
    correct = solved.correctAnswer;
    solution = solved.solution || solution;
  } else if (correct) {
    correct = replaceNumbers(correct, `${seed}-ans`, scale);
    if (solution) solution = replaceNumbers(solution, `${seed}-sol`, scale);
  }

  if (!correct || newOpts.filter(Boolean).length < 2) return null;

  return {
    text: newText,
    options: newOpts,
    correctAnswer: correct,
    solution: solution || `Doğru cevap: ${correct}. Adımları deftere yazarak kontrol edin.`,
    learningOutcome: sample.learningOutcome || '',
    mebReference: MEB_REF,
    topic: params.topic || sample.topic || '',
    difficulty: params.difficulty || sample.difficulty || 'Orta',
    classLevel: params.classLevel || sample.classLevel || '',
    subject: params.subject || sample.subject || 'Matematik',
    type: 'multiple-choice',
    source: 'AI',
    generatorMethod: 'pool-variant',
  };
}

function templateTrianglePerimeter(step, side, themeIdx) {
  const theme = CONTEXT_THEMES[themeIdx % CONTEXT_THEMES.length][1];
  const predicted = 4 * step + 4 * side;
  let opts = [predicted, predicted + 4, Math.max(4, predicted - 4), predicted + 8]
    .map(String);
  opts = [...new Set(opts)].slice(0, 4);
  const correct = String(predicted);
  if (!opts.includes(correct)) opts[0] = correct;
  const idx = opts.indexOf(correct);
  return {
    text: `Kenar uzunluğu ${side} cm olan eşkenar üçgenler ${theme} ile yan yana diziliyor. ${step}. adımdaki şeklin çevresi kaç cm'dir?`,
    options: opts,
    correctAnswer: correct,
    solution: buildSolutionLines([
      `${step}. adımda yan yana ${step} eşkenar üçgen vardır (kenar ${side} cm).`,
      `Çevre: 4 × ${step} + 4 × ${side} = ${predicted} cm.`,
      `Doğru cevap ${String.fromCharCode(65 + idx)}) ${correct} şıkkıdır.`,
    ]),
    learningOutcome: 'Geometrik örüntüde çevre ile adım sayısı arasındaki ilişkiyi kurar.',
    generatorMethod: 'template',
  };
}

function templateAlgebraicRule(seed, themeIdx) {
  const theme = CONTEXT_THEMES[themeIdx % CONTEXT_THEMES.length][1];
  const multiplier = 2 + seededIndex(`${seed}-m`, 3);
  const seq = [multiplier, multiplier * 2, multiplier * 3];
  const options = ['4x', '2x+2', `x+${multiplier}`, `${multiplier}x`];
  const correct = `${multiplier}x`;
  const idx = options.indexOf(correct);
  return {
    text: `${theme.charAt(0).toUpperCase() + theme.slice(1)} örüntüsünde 1., 2. ve 3. adımlardaki birim küp sayıları sırasıyla ${seq[0]}, ${seq[1]} ve ${seq[2]}'dir. Bu örüntüyü veren kural hangisidir?`,
    options,
    correctAnswer: correct,
    solution: buildSolutionLines([
      `Adım değerleri: ${seq.join(', ')}.`,
      `Her adımda değer ${multiplier} ile çarpılıyor → kural ${multiplier}x (n = adım sayısı).`,
      `Doğru cevap ${String.fromCharCode(65 + idx)}) ${correct} şıkkıdır.`,
    ]),
    learningOutcome: 'Cebirsel kuralı örüntü verilerinden çıkarır.',
    generatorMethod: 'template',
    ocrPreview: `1. adım ${seq[0]} birim küp 2. adım ${seq[1]} birim küp 3. adım ${seq[2]} birim küp`,
  };
}

function templateQuestion(kind, params, index) {
  const resolvedKind = resolveTemplateKind(kind, params.classLevel);
  if (resolvedKind === 'elementary') {
    const seed = `el-${index}-${params.classLevel}-${params.difficulty}`;
    return {
      ...templateElementaryPattern(params.classLevel, params.difficulty, seed),
      ...params,
      mebReference: MEB_REF,
      source: 'AI',
      type: 'multiple-choice',
      generatorMethod: 'elementary-template',
    };
  }

  const seed = `tpl-${resolvedKind}-${params.topic}-${index}`;
  const themeIdx = seededIndex(seed, CONTEXT_THEMES.length);
  const [lo, hi] = difficultyRange(params.difficulty);
  const step = Math.max(3, lo + seededIndex(`${seed}-step`, hi - lo + 1));
  const baseParams = { ...params, mebReference: MEB_REF, source: 'AI', type: 'multiple-choice' };

  if (kind === 'hexagon') {
    return { ...templateHexagon(step, themeIdx, params.difficulty), ...baseParams };
  }
  if (resolvedKind === 'triangle_perimeter') {
    const side = 2 + seededIndex(`${seed}-side`, 5);
    return { ...templateTrianglePerimeter(step, side, themeIdx), ...baseParams };
  }
  if (resolvedKind === 'algebraic_rule') {
    return { ...templateAlgebraicRule(seed, themeIdx), ...baseParams };
  }
  return { ...templateArithmetic(params.difficulty, themeIdx, seed), ...baseParams };
}

function generateLocalFromPool({ poolSamples, topic, difficulty, count, classLevel, subject }) {
  const desired = Math.min(20, Math.max(1, Number(count) || 5));
  const params = { topic, difficulty, classLevel, subject: subject || 'Matematik' };
  const samples = filterPoolSamplesForGeneration(poolSamples, { classLevel, difficulty });
  const grade = parseGradeFromClassLevel(classLevel);
  const defaultKind = grade <= 4 ? 'elementary' : (/geometri/.test(String(topic || '').toLowerCase()) ? 'triangle_perimeter' : 'arithmetic');

  const questions = [];
  const seen = new Set();

  for (let i = 0; i < desired; i += 1) {
    let q = null;
    if (samples.length) {
      const sample = samples[i % samples.length];
      if (!isSampleTooAdvancedForGrade(sample.text, classLevel)) {
        q = variantFromSample(sample, params, i);
        if (q && isSampleTooAdvancedForGrade(q.text, classLevel)) {
          q = null;
        }
      }
    }
    if (!q) {
      const sampleForKind = samples[i % Math.max(samples.length, 1)];
      const rawKind = samples.length ? classifySample(sampleForKind?.text) : 'generic';
      q = templateQuestion(rawKind, params, i);
    }
    if (!q) q = templateQuestion(defaultKind, params, i);

    const key = String(q.text || '').slice(0, 120).toLowerCase();
    if (seen.has(key)) {
      q = templateQuestion(defaultKind, params, i + desired);
    }
    seen.add(key);
    q.classLevel = classLevel;
    q.difficulty = difficulty;
    questions.push(q);
  }

  return {
    questions,
    generator: 'local-pool',
    poolSampleCount: samples.length,
    hint: samples.length
      ? `${classLevel} / ${difficulty}: havuzdaki ${samples.length} uygun metin örneğinden ${questions.length} soru üretildi.`
      : `${classLevel} / ${difficulty}: uygun havuz örneği yok; sınıf düzeyine uygun şablonlar kullanıldı.`,
  };
}

async function generateQuestionsFromPool({
  topic,
  difficulty,
  count = 5,
  classLevel,
  subject = 'Matematik',
  poolLimit = 12,
} = {}) {
  const poolSamples = await fetchQuestionPoolRows({
    subject,
    topic,
    classLevel,
    difficulty,
    limit: poolLimit,
  });

  if (mlServiceClient.isConfigured()) {
    try {
      const data = await mlServiceClient.generateQuestionsFromPool({
        topic,
        difficulty,
        count,
        classLevel,
        subject,
        poolSamples,
      });
      if (data?.questions?.length) {
        return {
          questions: data.questions,
          generator: data.generator || 'ml-service',
          pipeline: 'db-ml-js',
          poolSampleCount: data.poolSampleCount ?? poolSamples.length,
          hint: data.hint || `Metin tabanlı havuz örneklerinden ${data.questions.length} soru üretildi (ml-service).`,
          poolBlock: formatSamplesForPrompt(
            poolSamples.map((q) => ({
              summary: String(q.text || '').slice(0, 220),
              topic: q.topic,
              difficulty: q.difficulty,
            })),
            { textOnly: true }
          ),
        };
      }
    } catch (err) {
      console.warn('ML pool generate fallback to local:', err?.message);
    }
  }

  const local = generateLocalFromPool({
    poolSamples,
    topic,
    difficulty,
    count,
    classLevel,
    subject,
  });

  if (!local.questions.length) {
    const fb = await generateFallbackPatternQuestions({
      classLevel,
      difficulty,
      count,
      topic,
      subject,
    });
    return {
      questions: (fb.questions || []).map((q) => ({
        ...q,
        explanation: q.solution,
        mebReference: q.mebReference || MEB_REF,
      })),
      generator: fb.generator || 'fallback',
      poolSampleCount: poolSamples.length,
      hint: 'Havuz ve şablon yetersiz; varsayılan örüntü paketi kullanıldı.',
    };
  }

  return {
    ...local,
    pipeline: 'db-js',
    generator: local.generator || 'local-pool',
    questions: local.questions.map((q) => ({
      ...q,
      explanation: q.solution,
    })),
  };
}

module.exports = {
  generateQuestionsFromPool,
  generateLocalFromPool,
  variantFromSample,
};
