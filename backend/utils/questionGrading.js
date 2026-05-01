/**
 * Shared grading helpers for questions with optional interactive payloads.
 */

function parseMaybeJson(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function normalizeMcAnswer(value) {
  if (value == null) return '';
  if (typeof value === 'object' && value !== null && 'text' in value) {
    return String(value.text ?? '');
  }
  return String(value);
}

function gradeMatchingAnswer(question, userAnswer) {
  const correctPairs = question?.interactionData?.correctPairs || {};
  const prompts = question?.interactionData?.prompts || [];
  const parsed = typeof userAnswer === 'string' ? parseMaybeJson(userAnswer) : userAnswer;
  const selected = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  if (!selected) return false;
  return prompts.every((p) => selected[p.id] === correctPairs[p.id]);
}

function gradeSequenceAnswer(question, userAnswer) {
  const correctOrder = question?.interactionData?.correctOrder || [];
  const parsed = typeof userAnswer === 'string' ? parseMaybeJson(userAnswer) : userAnswer;
  const order = parsed && typeof parsed === 'object' && Array.isArray(parsed.order) ? parsed.order : null;
  if (!order || order.length !== correctOrder.length) return false;
  if (parsed.locked === false) return false;
  return order.every((id, i) => id === correctOrder[i]);
}

/**
 * @param {object} question Mongoose doc or lean object
 * @param {string} userAnswer
 */
function gradeQuestionAnswer(question, userAnswer) {
  if (!question) return false;

  const ca = question.correctAnswer;

  if (ca === '__interactive_matching__' || question.type === 'matching') {
    return gradeMatchingAnswer(question, userAnswer);
  }
  if (ca === '__interactive_sequence__' || question.type === 'sequence') {
    return gradeSequenceAnswer(question, userAnswer);
  }

  return normalizeMcAnswer(userAnswer).trim() === normalizeMcAnswer(ca).trim();
}

module.exports = {
  gradeQuestionAnswer,
  normalizeMcAnswer,
};
