const DEFAULT_MAX_LEN = 2000;
const CHAT_MAX_LEN = 1200;
const HINT_FIELD_MAX_LEN = 1500;
const ANALYSIS_ANSWER_MAX_LEN = 4000;

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /disregard\s+(all\s+)?(previous|prior)\s/i,
  /\bsystem\s*:/i,
  /\bassistant\s*:/i,
  /you\s+are\s+now\s+/i,
  /jailbreak/i,
  /do\s+not\s+follow/i,
  /forget\s+(everything|all|your)/i,
  /reveal\s+(your\s+)?(system|hidden)\s+prompt/i,
];

function sanitizeAiUserText(input, { maxLength = DEFAULT_MAX_LEN } = {}) {
  let text = String(input ?? '')
    .replace(/\0/g, '')
    .trim();
  if (!text) return '';
  text = text.replace(/\s+/g, ' ');
  if (text.length > maxLength) {
    text = text.slice(0, maxLength);
  }
  return text;
}

function hasPromptInjectionPattern(text) {
  const value = String(text || '');
  if (!value) return false;
  return INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * @returns {{ ok: true, text: string } | { ok: false, status: number, message: string }}
 */
function assertSafeAiUserText(input, options = {}) {
  const {
    maxLength = DEFAULT_MAX_LEN,
    required = false,
    emptyMessage = 'Metin boş olamaz.',
    blockedMessage = 'Mesaj güvenlik filtresine takıldı. Lütfen sorunuzu yeniden yazın.',
  } = options;

  const text = sanitizeAiUserText(input, { maxLength });

  if (!text) {
    if (required) {
      return { ok: false, status: 400, message: emptyMessage };
    }
    return { ok: true, text: '' };
  }

  if (hasPromptInjectionPattern(text)) {
    return { ok: false, status: 400, message: blockedMessage };
  }

  return { ok: true, text };
}

module.exports = {
  DEFAULT_MAX_LEN,
  CHAT_MAX_LEN,
  HINT_FIELD_MAX_LEN,
  ANALYSIS_ANSWER_MAX_LEN,
  sanitizeAiUserText,
  hasPromptInjectionPattern,
  assertSafeAiUserText,
};
