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
  /^verilen soruyu çözünüz\.?$/iu,
  /^soruyu çözünüz\.?$/iu,
  /^aşağıdaki soruyu inceley(iniz)?\.?$/iu,
  /^görsele bakınız\.?$/iu,
  /^aşağıda(kilerden|ki)?\.?$/iu,
  /^yukarıda(ki)?\.?$/iu,
  /^buna\s+göre\.?$/iu,
];

const WEAK_STEM_PATTERNS = [
  /^aşağıda\.?$/iu,
  /^yukarıda\.?$/iu,
  /^verilen\.?$/iu,
  /^buna\s+göre\.?$/iu,
  /^aşağıdaki\.?$/iu,
  /^yukarıdaki\.?$/iu,
];

export function buildCombinedQuestionText(introText = '', questionText = '') {
  return [introText, questionText].map((part) => clean(part)).filter(Boolean).join('\n\n');
}

export function isGenericStemPlaceholder(text) {
  const value = clean(text);
  if (!value) return false;
  return GENERIC_STEM_PATTERNS.some((pattern) => pattern.test(value));
}

export function isWeakStemFragment(text) {
  const value = clean(text);
  if (!value) return true;
  if (WEAK_STEM_PATTERNS.some((pattern) => pattern.test(value))) return true;
  if (value.length <= 14 && !/[?？]/.test(value) && value.split(/\s+/).length <= 2) {
    return /^(aşağı|yukarı|verilen|buna)/iu.test(value);
  }
  return false;
}

export function sanitizeStemPart(text) {
  const value = clean(text);
  if (!value) return '';
  if (isGenericStemPlaceholder(value) || isWeakStemFragment(value)) return '';
  if (value.includes('\n')) {
    const meaningful = value
      .split(/\n+/)
      .map((line) => clean(line))
      .filter(Boolean)
      .filter((line) => !isGenericStemPlaceholder(line) && !isWeakStemFragment(line));
    return meaningful.join('\n');
  }
  return value;
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
  const fullText = clean(question?.text);
  const layout = getQuestionLayout(question);
  let introText = sanitizeStemPart(layout.introText);
  let questionText = sanitizeStemPart(layout.questionText);

  if ((!introText || !questionText) && fullText) {
    const split = normalizeStemFields(introText || layout.introText, questionText || layout.questionText || fullText);
    introText = sanitizeStemPart(split.introText) || introText;
    questionText = sanitizeStemPart(split.questionText) || questionText;
  }

  if (!introText && !questionText && fullText) {
    const parts = fullText.split(/\n\n+/).map((part) => sanitizeStemPart(part)).filter(Boolean);
    if (parts.length >= 2) {
      introText = parts.slice(0, -1).join('\n\n');
      questionText = parts[parts.length - 1];
    } else if (parts.length === 1) {
      questionText = parts[0];
    } else {
      questionText = sanitizeStemPart(fullText);
    }
  }

  if (introText && questionText && introText === questionText) {
    introText = '';
  }

  if (introText && questionText && introText.includes(questionText)) {
    introText = sanitizeStemPart(introText.replace(questionText, ''));
  }

  if (hasImage && !introText && !questionText) {
    introText = '';
    questionText = '';
  }

  const showIntro = Boolean(introText);
  const showQuestion = Boolean(questionText);
  const imageOnly = hasImage && !showIntro && !showQuestion;
  const useStructuredLayout = showIntro || showQuestion || hasImage;

  return {
    introText,
    questionText,
    hasImage,
    showIntro,
    showQuestion,
    imageOnly,
    useStructuredLayout,
    visualVariant: hasImage ? 'compact' : 'default',
    fallbackText: !useStructuredLayout ? fullText : '',
  };
}

export function getQuestionPreviewText(question = {}) {
  const stem = resolveQuestionStem(question);
  const line = stem.questionText || stem.introText || stem.fallbackText;
  if (line) return line;
  if (stem.hasImage) return 'Görsel soru';
  return fullTextOrEmpty(question?.text) || 'Soru';
}

function fullTextOrEmpty(value) {
  const text = clean(value);
  return isGenericStemPlaceholder(text) || isWeakStemFragment(text) ? '' : text;
}
