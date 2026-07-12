const { enrichParsedQuestionAsync, isGenericSolutionText } = require('../services/patternQuestionSolver');

function parseAssessmentMeta(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function optionTextsFromPayload(options = []) {
  return options
    .map((opt) => (typeof opt === 'string' ? opt : String(opt?.text || '')).trim())
    .filter(Boolean);
}

function buildAutoEnrichInput({
  text = '',
  correctAnswer = '',
  solution = '',
  options = [],
  assessmentMeta = null,
  visualPrompt = '',
}) {
  const meta = assessmentMeta || {};
  const parseLayout = meta.parseLayout || {};
  const stepLabels = Array.isArray(parseLayout.stepLabels)
    ? parseLayout.stepLabels.join(' · ')
    : String(parseLayout.stepLabels || visualPrompt || '').trim();

  return {
    text: String(text || '').trim(),
    introText: String(parseLayout.introText || '').trim(),
    questionText: String(parseLayout.questionLine || parseLayout.questionText || '').trim(),
    stepLabels,
    options: optionTextsFromPayload(options),
    correctAnswer: String(correctAnswer || '').trim(),
    solution: String(solution || '').trim(),
    ocrPreview: String(meta.ocrPreview || parseLayout.ocrPreview || '').trim(),
  };
}

async function autoEnrichQuestionPayload({
  text = '',
  correctAnswer = '',
  solution = '',
  options = [],
  assessmentMeta = null,
  visualPrompt = '',
}) {
  const input = buildAutoEnrichInput({
    text,
    correctAnswer,
    solution,
    options,
    assessmentMeta,
    visualPrompt,
  });

  const needsAnswer = !input.correctAnswer;
  const needsSolution = !input.solution || isGenericSolutionText(input.solution);
  if (!needsAnswer && !needsSolution) {
    return {
      correctAnswer: input.correctAnswer,
      solution: input.solution,
      assessmentMeta,
    };
  }

  const enriched = await enrichParsedQuestionAsync(input);
  const nextMeta = {
    ...(assessmentMeta || {}),
    autoSolveEngine: enriched.engine || 'local',
    autoSolvedAt: new Date().toISOString(),
  };

  return {
    correctAnswer: String(enriched.correctAnswer || input.correctAnswer || '').trim(),
    solution: String(enriched.solution || input.solution || '').trim(),
    assessmentMeta: nextMeta,
  };
}

module.exports = {
  parseAssessmentMeta,
  buildAutoEnrichInput,
  autoEnrichQuestionPayload,
  isGenericSolutionText,
};
