const clean = (value) => String(value || '').trim();

export function getQuestionLayout(question = {}) {
  const parseLayout = question?.assessmentMeta?.parseLayout || {};
  const fullText = clean(question.text);
  let introText = clean(parseLayout.introText || question.introText);
  let questionText = clean(
    parseLayout.questionLine
      || parseLayout.questionText
      || question.questionText,
  );

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
