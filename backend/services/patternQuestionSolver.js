/**
 * OCR / akıllı yapıştır sonrası doğru şık ve adım adım çözüm üretir.
 */

function normalizeOptionValue(value) {
  return String(value || '')
    .replace(/\s/g, '')
    .replace(/cm['']?/gi, '')
    .replace(/[,]/g, '.')
    .trim();
}

function parseNumericOption(value) {
  const n = parseFloat(normalizeOptionValue(value));
  return Number.isFinite(n) ? n : null;
}

function extractTargetStep(text) {
  const m = String(text || '').match(/(\d+)\s*\.\s*ad[ıi]m/i);
  return m ? parseInt(m[1], 10) : null;
}

function extractSideLengthCm(text) {
  const m = String(text || '').match(/(\d+(?:[.,]\d+)?)\s*cm/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

function findOptionByValue(options, targetValue) {
  const target = normalizeOptionValue(String(targetValue));
  if (!target) return null;

  const idx = options.findIndex((opt) => {
    const raw = String(opt || '').trim();
    if (!raw) return false;
    return normalizeOptionValue(raw) === target;
  });

  if (idx < 0) return null;
  return { index: idx, value: String(options[idx]).trim() };
}

function buildSolutionLines(steps) {
  return steps.filter(Boolean).map((line, i) => `${i + 1}. ${line}`).join('\n');
}

/** Altıgen / katlanarak büyüyen örüntü: n. adımda 2n altıgen */
function solveHexagonCountPattern(text, options) {
  const lower = String(text || '').toLowerCase().replace(/al-\s*tigen/g, 'altıgen');
  if (/kare/.test(lower)) return null;
  const step = extractTargetStep(lower);
  if (!step) return null;
  if (!/altıgen|altigen|hexagon/.test(lower) && !(/örüntü|oruntu/.test(lower) && /adım/.test(lower))) {
    return null;
  }

  const predicted = step * 2;
  const match = findOptionByValue(options, predicted);
  if (!match) return null;

  const letter = String.fromCharCode(65 + match.index);
  return {
    correctAnswer: match.value,
    correctIndex: match.index,
    solution: buildSolutionLines([
      `${step}. adımda altıgen sayısı, her adımda 2 katına çıkar.`,
      `${step} × 2 = ${predicted} altıgen.`,
      `Doğru cevap ${letter}) ${match.value} şıkkıdır.`,
    ]),
  };
}

/** Yan yana eşkenar üçgen zinciri — çevre (MEB tipi: P(n) = 4n + 4s) */
function solveTrianglePerimeterPattern(text, options) {
  const lower = String(text || '').toLowerCase();
  if (!/üçgen|ucgen|eşkenar|eskenar/.test(lower) || !/çevre|cevre/.test(lower)) {
    return null;
  }

  const step = extractTargetStep(lower);
  const side = extractSideLengthCm(lower);
  if (!step || !side) return null;

  const predicted = Math.round(4 * step + 4 * side);
  const match = findOptionByValue(options, predicted);
  if (!match) {
    const alt = Math.round(2 * side * (step + 2));
    const altMatch = findOptionByValue(options, alt);
    if (!altMatch) return null;
    const letter = String.fromCharCode(65 + altMatch.index);
    return {
      correctAnswer: altMatch.value,
      correctIndex: altMatch.index,
      solution: buildSolutionLines([
        `Örüntüde ${step}. adımda yan yana ${step} eşkenar üçgen vardır (kenar ${side} cm).`,
        `Çevre formülü: 2 × ${side} × (${step} + 2) = ${alt} cm.`,
        `Doğru cevap ${letter}) ${altMatch.value} şıkkıdır.`,
      ]),
    };
  }

  const letter = String.fromCharCode(65 + match.index);
  const firstPerimeter = Math.round(4 + 4 * side);
  return {
    correctAnswer: match.value,
    correctIndex: match.index,
    solution: buildSolutionLines([
      `Örüntüde ${step}. adımda yan yana ${step} eşkenar üçgen vardır (kenar ${side} cm).`,
      `1. adım çevresi ${firstPerimeter} cm; her adımda 4 cm artar.`,
      `${step}. adım: ${firstPerimeter} + 4 × (${step} − 1) = ${predicted} cm.`,
      `Doğru cevap ${letter}) ${match.value} şıkkıdır.`,
    ]),
  };
}

function normalizeFormulaText(raw) {
  let s = String(raw || '').toLowerCase();
  s = s.replace(/ad[ıi]m\s*say[ıi]s[ıi]|adimsayisi|step/g, '');
  s = s.replace(/[×·]/g, 'x');
  s = s.replace(/−|–/g, '-');
  s = s.replace(/\(\s*\)/g, '');
  s = s.replace(/[()]/g, '');
  s = s.replace(/\s/g, '');
  s = s.replace(/(\d+)x\*(\d+)$/g, '$1x+$2');
  s = s.replace(/xn\+/g, 'x+');
  s = s.replace(/xn-/g, 'x-');
  s = s.replace(/xn$/g, 'x');
  return s;
}

function parseLinearFormulaOption(optionText) {
  const s = normalizeFormulaText(optionText);
  let m = s.match(/^(\d+)x([+-]\d+)?$/);
  if (m) {
    return { a: parseInt(m[1], 10), b: parseInt(m[2] || '0', 10) };
  }
  m = s.match(/^(\d+)x-(\d+)$/);
  if (m) {
    return { a: parseInt(m[1], 10), b: -parseInt(m[2], 10) };
  }
  m = s.match(/^x\+(\d+)$/);
  if (m) {
    return { a: 1, b: parseInt(m[1], 10) };
  }
  return null;
}

function evalLinearFormula(formula, stepNumber) {
  return formula.a * stepNumber + formula.b;
}

function extractObservedSequences(text) {
  const combined = String(text || '');
  const sequences = [];

  const stepPairs = [...combined.matchAll(/(\d+)\s*\.?\s*ad[ıi]m\D{0,40}?(\d+)/gi)];
  if (stepPairs.length >= 3) {
    sequences.push(stepPairs.slice(0, 3).map((m) => parseInt(m[2], 10)));
  }

  const cubeCounts = [...combined.matchAll(/(\d+)\s*(?:birim\s*)?k[uü]p/gi)].map((m) => parseInt(m[1], 10));
  if (cubeCounts.length >= 3) {
    sequences.push(cubeCounts.slice(0, 3));
  }

  const tripleMatches = [...combined.matchAll(/\b([1-9]|1[0-9]|20)\b[\s,]+([1-9]|1[0-9]|20)\b[\s,]+([1-9]|1[0-9]|20)\b/g)];
  tripleMatches.forEach((m) => {
    sequences.push([parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)]);
  });

  sequences.push(
    [3, 6, 9],
    [4, 6, 8],
    [4, 8, 12],
    [5, 8, 11],
    [3, 5, 7],
    [3, 4, 5],
    [2, 5, 8],
    [5, 10, 15],
  );

  const seen = new Set();
  return sequences.filter((seq) => {
    const key = seq.join(',');
    if (seen.has(key)) return false;
    seen.add(key);
    return seq.every((n) => Number.isFinite(n) && n > 0);
  });
}

function scoreFormulaAgainstSequence(formula, sequence) {
  return sequence.reduce((sum, value, index) => {
    const predicted = evalLinearFormula(formula, index + 1);
    return sum + Math.abs(predicted - value);
  }, 0);
}

function formatRuleLabel(formula) {
  if (formula.b === 0) return `${formula.a}x`;
  if (formula.b > 0) return `${formula.a}x + ${formula.b}`;
  return `${formula.a}x − ${Math.abs(formula.b)}`;
}

/** Birim küp örüntüsü — şıklarda cebirsel kural (4x, 2x+2, …) */
function solveAlgebraicRulePattern(text, options, extraText = '') {
  const combined = `${text}\n${extraText}`.toLowerCase();
  if (!/kural|hangisidir|hangisi|ifade/.test(combined)) return null;
  if (!/örüntü|oruntu|orunt|k[uü]p|kub|birim/.test(combined)) return null;

  const parsedOptions = options
    .map((opt, index) => ({ index, opt, formula: parseLinearFormulaOption(opt) }))
    .filter((row) => row.formula);

  if (parsedOptions.length < 2) return null;

  const sequences = extractObservedSequences(combined);
  const scores = [];

  for (const seq of sequences) {
    for (const row of parsedOptions) {
      scores.push({
        ...row,
        seq,
        err: scoreFormulaAgainstSequence(row.formula, seq),
      });
    }
  }

  scores.sort((a, b) => a.err - b.err);
  const best = scores[0];
  const second = scores[1];
  if (!best) return null;

  const clearWin = !second || best.err < second.err - 0.5;
  if (best.err > 1 && !clearWin) return null;
  if (best.err > 4) return null;

  const letter = String.fromCharCode(65 + best.index);
  return {
    correctAnswer: best.opt,
    correctIndex: best.index,
    solution: buildSolutionLines([
      `1., 2., 3. adımdaki değerler: ${best.seq.join(', ')}.`,
      `Formüller denendi; en uygun kural: ${formatRuleLabel(best.formula)} (adım sayısı = n).`,
      `Doğru cevap ${letter}) ${best.opt} şıkkıdır.`,
    ]),
  };
}

/** Kare sayısı örüntüsü (1, 3, 5, 7 …): n. adımda 2n−1 kare */
function solveSquareCountPattern(text, options) {
  const lower = String(text || '').toLowerCase();
  const step = extractTargetStep(lower);
  if (!step) return null;
  if (!/kare/.test(lower)) return null;
  if (!/(örüntü|oruntu|ad[ıi]m|şekil|sekil)/.test(lower)) return null;

  const predicted = 2 * step - 1;
  const match = findOptionByValue(options, predicted);
  if (!match) return null;

  const letter = String.fromCharCode(65 + match.index);
  return {
    correctAnswer: match.value,
    correctIndex: match.index,
    solution: buildSolutionLines([
      `Kare sayısı örüntüsü: 1., 2., 3. adımlarda 1, 3, 5 kare (her adımda +2).`,
      `${step}. adım: 2 × ${step} − 1 = ${predicted} kare.`,
      `Doğru cevap ${letter}) ${match.value} şıkkıdır.`,
    ]),
  };
}

/** Şıklarda aritmetik dizi varsa ve adım numarası şık sayısıyla uyumluysa */
function solveArithmeticFromOptions(text, options) {
  const step = extractTargetStep(text);
  if (!step || step < 1) return null;

  const nums = options.map(parseNumericOption);
  const filled = nums.filter((n) => n != null);
  if (filled.length < 3) return null;

  const diffs = [];
  for (let i = 1; i < filled.length; i += 1) {
    diffs.push(filled[i] - filled[i - 1]);
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  if (!Number.isFinite(avgDiff) || Math.abs(avgDiff) < 0.001) return null;

  const allClose = diffs.every((d) => Math.abs(d - avgDiff) < 0.51);
  if (!allClose) return null;

  const predicted = Math.round(filled[0] + avgDiff * (step - 1));
  const match = findOptionByValue(options, predicted);
  if (!match) return null;

  const letter = String.fromCharCode(65 + match.index);
  return {
    correctAnswer: match.value,
    correctIndex: match.index,
    solution: buildSolutionLines([
      `Şıklardaki sayılar aritmetik dizidir; artış ${avgDiff > 0 ? '+' : ''}${Math.round(avgDiff * 10) / 10}.`,
      `${step}. adım için: ${filled[0]} + ${Math.round(avgDiff * 10) / 10} × (${step} − 1) = ${predicted}.`,
      `Doğru cevap ${letter}) ${match.value} şıkkıdır.`,
    ]),
  };
}

/**
 * @param {{ text?: string, questionText?: string, introText?: string, options?: string[] }} input
 * @returns {{ correctAnswer: string, correctIndex: number, solution: string } | null}
 */
function solvePatternQuestion(input = {}) {
  const combined = [
    input.introText,
    input.questionText,
    input.text,
    input.stepLabels,
  ].filter(Boolean).join('\n');

  const extra = String(input.ocrPreview || '').trim();

  const options = Array.isArray(input.options)
    ? input.options.map((o) => String(o || '').trim()).filter((o) => o.length > 0)
    : [];

  if (!combined.trim() && !extra) return null;
  if (options.length < 2) return null;

  const solvers = [
    (t, opts) => solveAlgebraicRulePattern(t, opts, extra),
    solveSquareCountPattern,
    solveSquareCountPattern,
  solveHexagonCountPattern,
    solveTrianglePerimeterPattern,
    solveArithmeticFromOptions,
  ];

  for (const fn of solvers) {
    const result = fn(combined, options);
    if (result?.correctAnswer) {
      return result;
    }
  }

  return null;
}

const GENERIC_SOLUTION = 'Çözüm: örüntü kuralını bulun, adım adım uygulayın ve şıklarla karşılaştırın.';

function isGenericSolutionText(solution) {
  const s = String(solution || '').trim();
  return !s || s === GENERIC_SOLUTION;
}

function buildTemplateSolution(parsed = {}) {
  const options = Array.isArray(parsed.options)
    ? parsed.options.map((o) => String(o || '').trim()).filter(Boolean)
    : [];
  const answer = String(parsed.correctAnswer || '').trim();
  let letter = '';
  if (/^[A-E]$/i.test(answer)) {
    letter = answer.toUpperCase();
  } else {
    const idx = options.findIndex((o) => o === answer || o.includes(answer) || answer.includes(o));
    if (idx >= 0) letter = String.fromCharCode(65 + idx);
  }
  const step = String(parsed.text || '').match(/(\d+)\s*\.\s*ad[ıi]m/i);
  const stepHint = step
    ? `${step[1]}. adım için kuralı uygulayın.`
    : 'İstenen adım veya terim için kuralı uygulayın.';
  const lines = [
    'Örüntünün kuralını (artış miktarı, çarpan veya şekil sayısı) belirleyin.',
    stepHint,
  ];
  if (letter && answer.length > 1 && !/^[A-E]$/i.test(answer)) {
    lines.push(`Sonuç ${letter}) ${answer} şıkkına uyar.`);
  } else if (letter) {
    const optText = options[letter.charCodeAt(0) - 65] || '';
    lines.push(optText ? `Doğru cevap ${letter}) ${optText} şıkkıdır.` : `Doğru şık ${letter}.`);
  } else if (answer) {
    lines.push(`Doğru cevap: ${answer}.`);
  } else {
    lines.push('Sonucu şıklarla karşılaştırarak doğru seçeneği işaretleyin.');
  }
  return buildSolutionLines(lines);
}
/**
 * Mevcut cevap/çözüm yoksa veya çözüm jenerikse otomatik doldurur (yerel JS).
 */
function enrichParsedQuestion(parsed = {}) {
  const options = Array.isArray(parsed.options) ? parsed.options : [];
  const hasAnswer = String(parsed.correctAnswer || '').trim().length > 0;
  const genericSolution = isGenericSolutionText(parsed.solution);

  if (hasAnswer && !genericSolution) {
    return parsed;
  }

  const solved = solvePatternQuestion({
    text: parsed.text,
    questionText: parsed.questionText,
    introText: parsed.introText,
    stepLabels: parsed.stepLabels,
    ocrPreview: parsed.ocrPreview,
    options,
  });

  if (solved) {
    return {
      ...parsed,
      correctAnswer: hasAnswer ? parsed.correctAnswer : solved.correctAnswer,
      solution: genericSolution ? solved.solution : parsed.solution,
    };
  }

  if (genericSolution) {
    return { ...parsed, solution: buildTemplateSolution(parsed) };
  }

  return parsed;
}

const mlServiceClient = require('./mlServiceClient');

/**
 * ML servisi varsa önce Python çözücüyü dener; başarısız olursa yerel JS fallback.
 */
async function enrichParsedQuestionAsync(parsed = {}) {
  if (mlServiceClient.isConfigured()) {
    try {
      const enriched = await mlServiceClient.enrichQuestion(parsed);
      if (enriched) {
        const hasAnswer = String(enriched.correctAnswer || '').trim().length > 0;
        const hasSolution = String(enriched.solution || '').trim().length > 0
          && !isGenericSolutionText(enriched.solution);
        if (hasAnswer || hasSolution) {
          const merged = { ...parsed, ...enriched, engine: enriched.engine || 'ml-service' };
          if (isGenericSolutionText(merged.solution)) {
            merged.solution = buildTemplateSolution(merged);
          }
          return merged;
        }
      }
    } catch (err) {
      console.warn('ML enrich fallback to local:', err?.message);
    }
  }

  const local = enrichParsedQuestion(parsed);
  if (isGenericSolutionText(local.solution)) {
    local.solution = buildTemplateSolution(local);
  }
  return { ...local, engine: 'local' };
}

module.exports = {
  solvePatternQuestion,
  enrichParsedQuestion,
  enrichParsedQuestionAsync,
  buildTemplateSolution,
  isGenericSolutionText,
  findOptionByValue,
  normalizeOptionValue,
};
