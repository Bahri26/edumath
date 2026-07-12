import { normalizeStemFields } from './normalizeStemFields.js';
import { hasQuestionImage } from './questionImage.js';

const clean = (value) => String(value || '').trim();

export const PATTERN_INTRO_PLACEHOLDER =
  'Belirli bir kurala göre oluşturulan örüntü aşağıda verilmiştir.';

export const PATTERN_QUESTION_PLACEHOLDER =
  'Buna göre sıradaki değeri bulunuz.';

const GENERIC_STEM_PATTERNS = [
  /^aşağıdaki soruyu çözünüz\.?$/iu,
  /^yukarıdaki soruyu çözünüz\.?$/iu,
  /^soruyu çözünüz\.?$/iu,
  /^aşağıdaki soruyu inceley(iniz)?\.?$/iu,
  /^görsele bakınız\.?$/iu,
];

export function buildCombinedQuestionText(introText = '', questionText = '') {
  return [introText, questionText].map((part) => clean(part)).filter(Boolean).join('\n\n');
}

export function isGenericStemPlaceholder(text) {
  const value = clean(text);
  if (!value) return false;
  return GENERIC_STEM_PATTERNS.some((pattern) => pattern.test(value));
}

export function normalizeDisplayOptions(options = [], max = 5) {
  const list = (Array.isArray(options) ? options : [])
    .map((opt) => (typeof opt === 'string' ? opt : String(opt?.text || '')).trim())
    .filter(Boolean);
  return list.slice(0, max);
}

export function getQuestionLayout(question = {}) {
  const parseLayout = question?.assessmentMeta?.parseLayout || {};
  const fullText = clean(question.text);
  let introText = clean(parseLayout.introText || question.introText);
  let questionText = clean(
    parseLayout.questionLine
      || parseLayout.questionText
      || question.questionText,
  );

  if (!introText && !questionText && fullText) {
    const split = normalizeStemFields('', fullText);
    introText = split.introText;
    questionText = split.questionText;
    if (!questionText && fullText.includes('\n\n')) {
      const parts = fullText.split(/\n\n+/).map((part) => clean(part)).filter(Boolean);
      if (parts.length >= 2) {
        introText = parts.slice(0, -1).join('\n\n');
        questionText = parts[parts.length - 1];
      }
    }
    if (!introText && !questionText) {
      questionText = fullText;
    }
  }

  if (introText && !questionText && fullText.startsWith(introText)) {
    questionText = clean(fullText.slice(introText.length));
  } else if (questionText && !introText && fullText.endsWith(questionText)) {
    introText = clean(fullText.slice(0, -questionText.length));
  }

  return {
    introText,
    questionText,
    hasStructuredStem: Boolean(introText || questionText),
  };
}

export function resolveQuestionStem(question = {}) {
  const hasImage = hasQuestionImage(question?.image);
  const layout = getQuestionLayout(question);
  let introText = layout.introText;
  let questionText = layout.questionText;

  if (isGenericStemPlaceholder(introText)) {
    introText = '';
  }
  if (isGenericStemPlaceholder(questionText)) {
    questionText = '';
  }

  if (hasImage && !introText && !questionText) {
    introText = '';
    questionText = '';
  }

  const showIntro = Boolean(introText);
  const showQuestion = Boolean(questionText);
  const useStructuredLayout = showIntro || showQuestion || hasImage;

  return {
    introText,
    questionText,
    hasImage,
    showIntro,
    showQuestion,
    useStructuredLayout,
    visualVariant: hasImage ? 'compact' : 'default',
    fallbackText: !useStructuredLayout ? clean(question?.text) : '',
  };
}
