import { parseTextToQuestion } from './parseSmartPaste';
import { enrichQuestionForm } from './patternQuestionSolver';

function extractOptionsFromContent(content) {
  const contentNoAnswer = content.replace(/(^|\n)\s*(?:C(e|ı|i)vap|Doğru\s*Cevap|Answer)\s*:.*/gim, '').trim();

  const inlinePattern = /([A-Ha-h])\)\s*([\s\S]*?)(?=\s+[A-Ha-h]\)|\s*$)/g;
  let options = [...contentNoAnswer.matchAll(inlinePattern)].map((m) =>
    m[2].replace(/\s+/g, ' ').trim()
  );

  if (options.length < 2) {
    const linePattern = /^\s*([A-Ha-h])\)\s*(.+)$/gm;
    options = [...content.matchAll(linePattern)].map((m) => m[2].trim());
  }

  return options;
}

function extractCorrectAnswer(content, options) {
  const answerLine = content.match(/(?:Cevap|Doğru\s*Cevap|Answer)\s*:?\s*(.+)$/im);
  if (!answerLine) return '';

  const ansStr = (answerLine[1] || '').trim();
  const letterMatch = ansStr.match(/^([A-Ha-h])\)/);
  const bareLetter = ansStr.match(/^([A-Ha-h])$/);
  const valueMatch = ansStr.replace(/^([A-Ha-h])\)\s*/, '').trim();

  if (letterMatch || bareLetter) {
    const letter = (letterMatch ? letterMatch[1] : bareLetter[1]).toUpperCase();
    const idx = letter.charCodeAt(0) - 65;
    return options[idx] || valueMatch || '';
  }

  if (valueMatch) {
    const found = options.find(
      (o) => String(o).trim().toLowerCase() === valueMatch.trim().toLowerCase()
    );
    return found || valueMatch;
  }

  return '';
}

function padOptions(options, size = 5) {
  const list = Array.isArray(options) ? options.map((o) => String(o || '').trim()) : [];
  while (list.length < size) list.push('');
  return list.slice(0, size);
}

/**
 * PDF / Word / ekrandan kopyalanan soru metnini forma dönüştürür.
 * @returns {object|null} enrichQuestionForm sonucu veya null
 */
export function parsePastedQuestionText(raw, baseForm = {}) {
  const content = String(raw || '').replace(/\r/g, '').trim();
  if (!content) return null;

  const parsed = parseTextToQuestion(content);
  let options = parsed.options?.filter((o) => String(o || '').trim()) || [];
  let text = parsed.text?.trim() || '';
  let correctAnswer = parsed.correctAnswer || '';

  if (options.length < 2) {
    options = extractOptionsFromContent(content);
  }

  if (!text && options.length >= 2) {
    const firstOptionIndex = content.search(/[A-Ha-h]\)/);
    text = firstOptionIndex > -1 ? content.slice(0, firstOptionIndex).trim() : content.trim();
  }

  if (!correctAnswer) {
    correctAnswer = extractCorrectAnswer(content, options);
  }

  if (!text && !options.some(Boolean)) {
    return null;
  }

  return enrichQuestionForm({
    ...baseForm,
    text: text || content.split(/\n[A-Ha-h]\)/i)[0]?.trim() || content,
    options: padOptions(options.length ? options : parsed.options),
    correctAnswer,
    solution: baseForm.solution || '',
    topic: baseForm.topic || '',
    subject: baseForm.subject || 'Matematik',
    classLevel: baseForm.classLevel || '9. Sınıf',
    difficulty: baseForm.difficulty || 'Orta',
  });
}
