const { uploadSvg } = require('./storageService');
const {
  PATTERN_TOPIC_LABELS,
  LEARNING_OUTCOME_BY_LABEL,
} = require('../constants/patternTopics');

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function choice(list, index) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list[((index % list.length) + list.length) % list.length];
}

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildSvgBoxPattern({ items = [], size = 64, gap = 12, padding = 12 } = {}) {
  const w = padding * 2 + items.length * size + Math.max(0, items.length - 1) * gap;
  const h = padding * 2 + size;

  const renderItem = (item, idx) => {
    const x = padding + idx * (size + gap);
    const y = padding;
    const box = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="14" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2" />`;

    if (!item || item === '?') {
      return (
        box +
        `<text x="${x + size / 2}" y="${y + size / 2 + 8}" text-anchor="middle" font-size="28" font-family="ui-sans-serif, system-ui" fill="#64748B">?</text>`
      );
    }

    const cx = x + size / 2;
    const cy = y + size / 2;
    const s = size * 0.28;
    if (item === 'circle') {
      return box + `<circle cx="${cx}" cy="${cy}" r="${s}" fill="#4F46E5" />`;
    }
    if (item === 'square') {
      return box + `<rect x="${cx - s}" y="${cy - s}" width="${s * 2}" height="${s * 2}" rx="10" fill="#10B981" />`;
    }
    if (item === 'triangle') {
      const p1 = `${cx},${cy - s * 1.1}`;
      const p2 = `${cx - s * 1.1},${cy + s * 1.0}`;
      const p3 = `${cx + s * 1.1},${cy + s * 1.0}`;
      return box + `<polygon points="${p1} ${p2} ${p3}" fill="#F59E0B" />`;
    }
    return box + `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="16" font-family="ui-sans-serif, system-ui" fill="#0F172A">${escapeXml(item)}</text>`;
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="18" fill="white" />
  ${items.map(renderItem).join('\n  ')}
</svg>`;
}

function assessmentMetaBase({ strand = 'patterns', skillTags = [], adaptiveBand = {}, templateKey, topicLabel }) {
  return {
    strand,
    topic: topicLabel || 'Örüntüler',
    templateKey,
    skillTags,
    adaptiveBand,
  };
}

function buildSvgDotsGrid({ n = 1, cols = 6, dot = 14, gap = 8, pad = 16 } = {}) {
  const rows = Math.ceil(n / cols);
  const w = pad * 2 + cols * dot + Math.max(0, cols - 1) * gap;
  const h = pad * 2 + rows * dot + Math.max(0, rows - 1) * gap;

  let dots = '';
  for (let i = 0; i < n; i += 1) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = pad + c * (dot + gap) + dot / 2;
    const y = pad + r * (dot + gap) + dot / 2;
    dots += `<circle cx="${x}" cy="${y}" r="${dot / 2 - 1}" fill="#4F46E5" />`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" rx="18" fill="white" />
  ${dots}
</svg>`;
}

async function generateRepeatTemplate({ classLevel = '2. Sınıf', difficulty = 'Kolay', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const symbols = ['circle', 'square', 'triangle'];
  const cycle = difficulty === 'Zor' ? ['circle', 'square', 'triangle'] : ['circle', 'square'];
  const out = [];

  for (let i = 0; i < total; i += 1) {
    const len = difficulty === 'Zor' ? 7 : 6;
    const seq = Array.from({ length: len }, (_, idx) => choice(cycle, idx));
    const correct = choice(cycle, len);
    const items = [...seq.slice(0, len - 1), '?'];
    const svg = buildSvgBoxPattern({ items });
    const uploaded = await uploadSvg(svg, 'pattern-templates', `repeat-${Date.now()}-${i}.svg`);

    const options = symbols
      .map((s) => ({ key: s, label: s }))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    if (!options.some((o) => o.key === correct)) {
      options[0] = { key: correct, label: correct };
    }
    const optionTexts = options.map((o) => o.label);

    out.push({
      text: 'Örüntüyü inceleyin. Soru işareti yerine hangisi gelmelidir?',
      topic: PATTERN_TOPIC_LABELS.GEOMETRIC,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.GEOMETRIC],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      options: optionTexts.map((t) => ({ text: t })),
      correctAnswer: options.find((o) => o.key === correct)?.label || correct,
      solution: [
        `1. Örüntü sırasına bak: görünen şekiller ${cycle.join(' → ')} döngüsünü oluşturur.`,
        `2. Bu sıra sürekli tekrarlanır.`,
        `3. Soru işareti, döngünün bir sonraki elemanına karşılık gelir; eşleşen seçenek doğru cevaptır.`,
      ].join('\n'),
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.GEOMETRIC,
        templateKey: 'repeat',
        skillTags: ['pattern_repeat', 'visual_sequence'],
        adaptiveBand: { minClass: '1. Sınıf', maxClass: '4. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'repeat', cycle },
    });
  }

  return out;
}

async function generateArithmeticTemplate({ classLevel = '5. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const out = [];
  for (let i = 0; i < total; i += 1) {
    const step = difficulty === 'Kolay' ? 2 : difficulty === 'Zor' ? 7 : 4;
    const start = 3 + (i % 5);
    const len = 6;
    const seq = Array.from({ length: len }, (_, idx) => start + idx * step);
    const missingIndex = difficulty === 'Kolay' ? 4 : 3;
    const correct = seq[missingIndex];
    const shown = seq.map((v, idx) => (idx === missingIndex ? '?' : String(v))).join(', ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="760" height="140" viewBox="0 0 760 140">
  <rect width="760" height="140" rx="18" fill="white"/>
  <text x="38" y="86" font-size="30" font-family="ui-sans-serif, system-ui" fill="#0F172A">${escapeXml(shown)}</text>
</svg>`;
    const uploaded = await uploadSvg(svg, 'pattern-templates', `arith-${Date.now()}-${i}.svg`);

    const distractors = [correct - step, correct + step, correct + step * 2].map(String);
    const optionPool = Array.from(new Set([String(correct), ...distractors])).slice(0, 4);
    while (optionPool.length < 4) optionPool.push(String(correct + optionPool.length + 1));
    optionPool.sort(() => Math.random() - 0.5);

    out.push({
      text: 'Aşağıdaki örüntüde soru işareti yerine gelecek sayı kaçtır?',
      topic: PATTERN_TOPIC_LABELS.ARITHMETIC,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.ARITHMETIC],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      options: optionPool.map((t) => ({ text: t })),
      correctAnswer: String(correct),
      solution: [
        `1. İki komşu sayı arasındaki farka bak (${step}); ortak artış sabit mi kontrol et.`,
        `2. Soru işaretinden önce gelen terime ${step} ekle.`,
        `3. Elde ettiğin sayı doğru seçenektir.`,
      ].join('\n'),
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.ARITHMETIC,
        templateKey: 'arithmetic',
        skillTags: ['pattern_arithmetic', 'constant_difference'],
        adaptiveBand: { minClass: '3. Sınıf', maxClass: '8. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'arithmetic', start, step, missingIndex },
    });
  }
  return out;
}

async function generateTwoStepTemplate({ classLevel = '6. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const out = [];

  for (let i = 0; i < total; i += 1) {
    const a = difficulty === 'Kolay' ? 2 : difficulty === 'Zor' ? 5 : 3;
    const b = difficulty === 'Kolay' ? 1 : difficulty === 'Zor' ? 4 : 2;
    const start = 5 + ((i + a) % 4);
    const len = 7;
    const seq = [];
    let x = start;
    for (let k = 0; k < len; k += 1) {
      seq.push(x);
      x += (k % 2 === 0 ? a : -b);
    }

    const missingIndex = 5;
    const correct = seq[missingIndex];
    const shown = seq.map((v, idx) => (idx === missingIndex ? '?' : String(v))).join(', ');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="840" height="150" viewBox="0 0 840 150">
  <rect width="840" height="150" rx="18" fill="white"/>
  <text x="34" y="90" font-size="28" font-family="ui-sans-serif, system-ui" fill="#0F172A">${escapeXml(shown)}</text>
  <text x="34" y="128" font-size="16" fill="#64748B">Kural: art arda +${a} sonra -${b} uygulanır.</text>
</svg>`;

    const uploaded = await uploadSvg(svg, 'pattern-templates', `twostep-${Date.now()}-${i}.svg`);
    const distractors = [correct + a, correct - b, correct + (a - b)].map(String);
    const optionPool = Array.from(new Set([String(correct), ...distractors])).slice(0, 4);
    while (optionPool.length < 4) optionPool.push(String(correct + optionPool.length + 1));
    optionPool.sort(() => Math.random() - 0.5);

    out.push({
      text: 'Örüntüde soru işareti yerine gelen sayı kaçtır? (İki adımlı kural)',
      topic: PATTERN_TOPIC_LABELS.RULE,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.RULE],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      options: optionPool.map((t) => ({ text: t })),
      correctAnswer: String(correct),
      solution: [
        `1. Kural iki adım: sıra sıfırdan başlarsa çift sıradaki adımda +${a}, tek sıradakinde −${b} uygulanır.`,
        `2. Soru işaretine kadar bu kuralı adım adım uygula.`,
        `3. Bulduğun değeri seçeneklerle karşılaştır.`,
      ].join('\n'),
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.RULE,
        templateKey: 'two_step',
        skillTags: ['pattern_two_step', 'alternating_rule'],
        adaptiveBand: { minClass: '5. Sınıf', maxClass: '9. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'two_step', a, b, missingIndex },
    });
  }

  return out;
}

async function generateSquareNumbersTemplate({ classLevel = '7. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const out = [];
  const nStart = difficulty === 'Kolay' ? 2 : difficulty === 'Zor' ? 5 : 3;

  for (let i = 0; i < total; i += 1) {
    const base = nStart + i;
    const terms = [base, base + 1, base + 2].map((n) => n * n);
    const correct = (base + 3) * (base + 3);
    const shownNums = [...terms, '?'].join(', ');
    const svgPieces = terms.map((t, idx) => buildSvgDotsGrid({ n: t, cols: Math.min(10, Math.ceil(Math.sqrt(t))) }));
    const combined = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="240" viewBox="0 0 980 240">
  <rect width="980" height="240" rx="18" fill="white"/>
  <text x="28" y="44" font-size="22" font-family="ui-sans-serif, system-ui" fill="#0F172A">${escapeXml(shownNums)}</text>
  <g transform="translate(20, 70)">
    ${svgPieces
      .map((inner, idx) => {
        const tx = idx * 320;
        return `<g transform="translate(${tx},0)">${inner.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</g>`;
      })
      .join('')}
  </g>
</svg>`;

    const uploaded = await uploadSvg(combined, 'pattern-templates', `squares-${Date.now()}-${i}.svg`);
    const distractors = [(base + 2) * (base + 4), (base + 4) * (base + 4), (base + 3) * (base + 2)].map(String);
    const optionPool = Array.from(new Set([String(correct), ...distractors])).slice(0, 4);
    while (optionPool.length < 4) optionPool.push(String(Number(correct) + optionPool.length));
    optionPool.sort(() => Math.random() - 0.5);

    out.push({
      text: 'Aşağıdaki sayı dizisi kare sayı örüntüsüdür. Soru işareti yerine hangi sayı gelmelidir?',
      topic: PATTERN_TOPIC_LABELS.SQUARES,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.SQUARES],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      options: optionPool.map((t) => ({ text: t })),
      correctAnswer: String(correct),
      solution: [
        '1. Terimlerin kare sayı dizisi (n²) olduğunu fark et.',
        '2. Verilen sıradaki n değeri bir artırıldığında bir sonraki terim gelir.',
        '3. Soru işareti için sıradaki n² değeri doğru cevaptır.',
      ].join('\n'),
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.SQUARES,
        templateKey: 'square_numbers',
        skillTags: ['pattern_square_numbers', 'quadratic_growth_visual'],
        adaptiveBand: { minClass: '6. Sınıf', maxClass: '10. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'square_numbers', base },
    });
  }

  return out;
}

async function generateTriangularNumbersTemplate({ classLevel = '8. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const triangular = (k) => (k * (k + 1)) / 2;
  const total = clampInt(count, 5, 1, 20);
  const out = [];

  const nStart = difficulty === 'Kolay' ? 2 : difficulty === 'Zor' ? 5 : 3;
  for (let i = 0; i < total; i += 1) {
    const base = nStart + i;
    const terms = [base, base + 1, base + 2].map((n) => triangular(n));
    const correct = triangular(base + 3);
    const shownNums = [...terms, '?'].join(', ');

    const svgPieces = terms.map((t) => buildSvgDotsGrid({ n: t, cols: Math.min(10, Math.ceil((Math.sqrt(8 * t + 1) - 1) / 2)) }));
    const combined = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="980" height="240" viewBox="0 0 980 240">
  <rect width="980" height="240" rx="18" fill="white"/>
  <text x="28" y="44" font-size="22" font-family="ui-sans-serif, system-ui" fill="#0F172A">${escapeXml(shownNums)}</text>
  <text x="28" y="72" font-size="14" fill="#64748B">Üçgensel sayı: T_n = n(n+1)/2</text>
  <g transform="translate(20, 90)">
    ${svgPieces
      .map((inner, idx) => {
        const tx = idx * 320;
        return `<g transform="translate(${tx},0)">${inner.replace(/<\?xml[^>]*>/, '').replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</g>`;
      })
      .join('')}
  </g>
</svg>`;

    const uploaded = await uploadSvg(combined, 'pattern-templates', `triangular-${Date.now()}-${i}.svg`);
    const wrong1 = triangular(base + 2);
    const wrong2 = triangular(base + 4);
    const distractors = [wrong1 + 3, wrong2 - 5, triangular(base + 3) + 2].map((v) => String(Math.round(v)));
    const optionPool = Array.from(new Set([String(correct), ...distractors])).slice(0, 4);
    while (optionPool.length < 4) optionPool.push(String(Number(correct) + optionPool.length));
    optionPool.sort(() => Math.random() - 0.5);

    out.push({
      text: 'Aşağıdaki sayı dizisi üçgensel sayı örüntüsüdür. Soru işareti yerine hangi sayı gelmelidir?',
      topic: PATTERN_TOPIC_LABELS.TRIANGULAR,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.TRIANGULAR],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'multiple-choice',
      interactiveType: 'none',
      interactionData: null,
      image: uploaded.url,
      imageKey: uploaded.key,
      imageProvider: uploaded.provider,
      options: optionPool.map((t) => ({ text: t })),
      correctAnswer: String(correct),
      solution: [
        '1. Dizinin üçgensel sayı olduğunu ve T_n = n(n+1)/2 kuralına uyduğunu göz önünde tut.',
        `2. Verilen sıraya göre bir sonraki terim için n değeri ${base + 3} olmalı.`,
        `3. T_${base + 3} = ${base + 3} × ${base + 4} / 2 olarak hesaplanır; çıkan sonuç doğru seçenektir.`,
      ].join('\n'),
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.TRIANGULAR,
        templateKey: 'triangular_numbers',
        skillTags: ['pattern_triangular_numbers'],
        adaptiveBand: { minClass: '7. Sınıf', maxClass: '12. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'triangular_numbers', base },
    });
  }

  return out;
}

async function generateMatchingTemplate({ classLevel = '5. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const out = [];

  const sets = [
    {
      prompts: [
        { id: 'repeat', label: '2, 4, 2, 4, ...' },
        { id: 'arith', label: '5, 9, 13, ...' },
        { id: 'square', label: '1, 4, 9, 16, ...' },
      ],
      options: ['Tekrarlayan örüntü', 'Sabit artan örüntü (+4)', 'Kare sayı örüntüsü'],
      correctPairs: { repeat: 'Tekrarlayan örüntü', arith: 'Sabit artan örüntü (+4)', square: 'Kare sayı örüntüsü' },
      skillTags: ['pattern_matching', 'classification'],
    },
    {
      prompts: [
        { id: 'triangle', label: '1, 3, 6, 10, ...' },
        { id: 'doubling', label: '3, 6, 12, 24, ...' },
      ],
      options: ['Üçgensel sayı', 'Katlanarak büyüme (×2)'],
      correctPairs: { triangle: 'Üçgensel sayı', doubling: 'Katlanarak büyüme (×2)' },
      skillTags: ['pattern_matching_triangular_vs_geometric'],
    },
  ];

  for (let i = 0; i < total; i += 1) {
    const pick = sets[i % sets.length];
    const scrambledOptions = [...pick.options].sort(() => Math.random() - 0.5);

    out.push({
      text: difficulty === 'Zor'
        ? 'Örüntüleri kuralına göre eşleştirin.'
        : 'Her örneği doğru örüntü türüyle eşleştirin.',
      topic: PATTERN_TOPIC_LABELS.MATCHING,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.MATCHING],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'matching',
      interactiveType: 'matching',
      interactionData: {
        prompts: pick.prompts,
        options: scrambledOptions,
        correctPairs: pick.correctPairs,
      },
      image: '',
      imageKey: '',
      imageProvider: '',
      options: [],
      correctAnswer: '__interactive_matching__',
      solution: `Doğru eşleştirmeler: ${JSON.stringify(pick.correctPairs)}`,
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.MATCHING,
        templateKey: 'interactive_matching',
        skillTags: pick.skillTags,
        adaptiveBand: { minClass: '4. Sınıf', maxClass: '9. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'interactive_matching', pickIndex: i % sets.length },
    });
  }

  return out;
}

async function generateSequenceTemplate({ classLevel = '6. Sınıf', difficulty = 'Orta', count = 5 } = {}) {
  const total = clampInt(count, 5, 1, 20);
  const out = [];

  for (let i = 0; i < total; i += 1) {
    const items = [
      { id: 'rule', label: 'Örüntüdeki kuralı yaz / seç' },
      { id: 'delta', label: 'Artış veya çarpım farkını kontrol et' },
      { id: 'predict', label: 'Eksik terimi tahmin et' },
      { id: 'verify', label: 'Tahmini örüntüye doğrula' },
    ];

    let correctOrder = ['delta', 'rule', 'predict', 'verify'];
    if (difficulty === 'Kolay') {
      correctOrder = ['rule', 'delta', 'predict', 'verify'];
    } else if (difficulty === 'Zor') {
      correctOrder = ['delta', 'predict', 'verify', 'rule'];
    }

    const shuffled = [...items.map((entry) => entry.id)].sort(() => Math.random() - 0.5);

    out.push({
      text: 'Aşağıdaki adımları, bir örüntü sorununu doğru çözmek için en uygun sıraya koyun.',
      topic: PATTERN_TOPIC_LABELS.SEQUENCE,
      learningOutcome: LEARNING_OUTCOME_BY_LABEL[PATTERN_TOPIC_LABELS.SEQUENCE],
      subject: 'Matematik',
      classLevel,
      difficulty,
      type: 'sequence',
      interactiveType: 'sequence',
      interactionData: {
        items,
        correctOrder,
        scrambleSeed: `${Date.now()}-${i}`,
      },
      image: '',
      imageKey: '',
      imageProvider: '',
      options: [],
      correctAnswer: '__interactive_sequence__',
      solution: `Doğru sıra: ${correctOrder.join(' → ')}`,
      source: 'AI',
      assessmentMeta: assessmentMetaBase({
        topicLabel: PATTERN_TOPIC_LABELS.SEQUENCE,
        templateKey: 'interactive_sequence',
        skillTags: ['pattern_problem_solving_process'],
        adaptiveBand: { minClass: '5. Sınıf', maxClass: '10. Sınıf', estimated: classLevel },
      }),
      meta: { template: 'interactive_sequence', shuffledPreview: shuffled },
    });
  }

  return out;
}

async function generatePatternTemplateQuestions(payload = {}) {
  const templateKey = String(payload.templateKey || '').trim();
  const classLevel = payload.classLevel || '5. Sınıf';
  const difficulty = payload.difficulty || 'Orta';
  const count = payload.count ?? 5;

  if (templateKey === 'repeat') {
    return generateRepeatTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'arithmetic') {
    return generateArithmeticTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'two_step') {
    return generateTwoStepTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'square_numbers') {
    return generateSquareNumbersTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'triangular_numbers') {
    return generateTriangularNumbersTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'interactive_matching') {
    return generateMatchingTemplate({ classLevel, difficulty, count });
  }
  if (templateKey === 'interactive_sequence') {
    return generateSequenceTemplate({ classLevel, difficulty, count });
  }

  const err = new Error('Geçersiz templateKey');
  err.statusCode = 400;
  throw err;
}

module.exports = {
  generatePatternTemplateQuestions,
};

