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
  ].filter(Boolean).join('\n');

  const options = Array.isArray(input.options)
    ? input.options.map((o) => String(o || '').trim()).filter((o) => o.length > 0)
    : [];

  if (!combined.trim() || options.length < 2) {
    return null;
  }

  const solvers = [
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

/**
 * Mevcut cevap/çözüm yoksa otomatik doldurur.
 */
function enrichParsedQuestion(parsed = {}) {
  const options = Array.isArray(parsed.options) ? parsed.options : [];
  const hasAnswer = String(parsed.correctAnswer || '').trim().length > 0;
  const hasSolution = String(parsed.solution || '').trim().length > 0;

  if (hasAnswer && hasSolution) {
    return parsed;
  }

  const solved = solvePatternQuestion({
    text: parsed.text,
    questionText: parsed.questionText,
    introText: parsed.introText,
    options,
  });

  if (!solved) {
    return parsed;
  }

  return {
    ...parsed,
    correctAnswer: hasAnswer ? parsed.correctAnswer : solved.correctAnswer,
    solution: hasSolution ? parsed.solution : solved.solution,
  };
}

module.exports = {
  solvePatternQuestion,
  enrichParsedQuestion,
  findOptionByValue,
  normalizeOptionValue,
};
