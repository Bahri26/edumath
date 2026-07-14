/**
 * Ortak köklü numaralı çoklu soruları (1. 2. 3. …) parçalara ayırır.
 */

function clean(value) {
  return String(value || '').trim();
}

function normalizeOptions(raw) {
  const list = (Array.isArray(raw) ? raw : [])
    .map((o) => String(o || '').trim())
    .filter(Boolean);
  while (list.length < 4) list.push('');
  return list.slice(0, 5);
}

/**
 * OCR / birleşik metinden numaralı maddeleri ayır.
 * @returns {{ introText: string, items: Array<{ questionText, options, correctAnswer, solution }> } | null}
 */
function splitNumberedMultiItems(rawText) {
  const text = clean(rawText).replace(/\r/g, '\n');
  if (!text) return null;

  const markerRe = /(?:^|\n)\s*(\d{1,2})\s*[.)]\s+(?=[A-ZÇĞİÖŞÜa-zçğıöşü(“"'])/gu;
  const markers = [];
  let match;
  while ((match = markerRe.exec(text)) !== null) {
    markers.push({ n: Number(match[1]), index: match.index + (match[0].startsWith('\n') ? 1 : 0), len: match[0].startsWith('\n') ? match[0].length - 1 : match[0].length });
  }

  if (markers.length < 2) return null;

  // Only keep ascending unique sequence starting near 1
  const filtered = [];
  for (const m of markers) {
    if (filtered.length === 0) {
      if (m.n <= 2) filtered.push(m);
      continue;
    }
    const prev = filtered[filtered.length - 1];
    if (m.n === prev.n + 1) filtered.push(m);
  }
  if (filtered.length < 2) return null;

  const introText = clean(text.slice(0, filtered[0].index));
  const sharedPromptMatch = introText.match(/Aşağıdaki soruları[^.]*\./i);
  const sharedPrompt = sharedPromptMatch ? sharedPromptMatch[0] : 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.';

  const items = filtered.map((m, i) => {
    const start = m.index + m.len;
    const end = i + 1 < filtered.length ? filtered[i + 1].index : text.length;
    const chunk = clean(text.slice(start, end));
    const optionMatches = [...chunk.matchAll(/(?:^|\n)\s*([A-E])\s*[).]\s*(.+?)(?=(?:\n\s*[A-E]\s*[).])|$)/gim)];
    const options = optionMatches.map((om) => clean(om[2]));
    let questionText = chunk;
    if (optionMatches.length) {
      questionText = clean(chunk.slice(0, optionMatches[0].index));
    }
    questionText = questionText.replace(/^[A-E]\s*[).].*/gim, '').trim();
    return {
      questionText,
      options: normalizeOptions(options),
      correctAnswer: '',
      solution: '',
    };
  }).filter((item) => item.questionText);

  if (items.length < 2) return null;

  return {
    introText: introText.replace(sharedPrompt, '').trim() || introText,
    sharedPrompt,
    items,
  };
}

/**
 * Gemini / parse çıktısındaki items alanını normalize et.
 */
function normalizeParsedMultiItems(parsed = {}) {
  const fromItems = Array.isArray(parsed.items) ? parsed.items : [];
  if (fromItems.length >= 2) {
    const introText = clean(parsed.introText || parsed.sharedStem || '');
    const sharedPrompt = clean(parsed.sharedPrompt)
      || 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.';
    const items = fromItems.map((item) => ({
      questionText: clean(item.questionText || item.text || ''),
      options: normalizeOptions(item.options),
      correctAnswer: clean(item.correctAnswer),
      solution: clean(item.solution),
    })).filter((item) => item.questionText);
    if (items.length >= 2) {
      return { introText, sharedPrompt, items };
    }
  }

  const blob = [parsed.introText, parsed.questionText, parsed.text].filter(Boolean).join('\n');
  return splitNumberedMultiItems(blob);
}

function buildGroupedQuestionPayloads({
  multi,
  sharedImage = '',
  classLevel = '5. Sınıf',
  topic = 'Şekil örüntüleri',
  difficulty = 'Orta',
  subject = 'Matematik',
  groupId = '',
}) {
  if (!multi?.items?.length) return [];
  const id = groupId || `multi-${Date.now().toString(36)}`;
  const size = multi.items.length;
  const stem = clean(multi.introText);
  const prompt = clean(multi.sharedPrompt);

  return multi.items.map((item, index) => {
    const questionLine = clean(item.questionText);
    const text = [stem, questionLine].filter(Boolean).join('\n\n');
    return {
      text,
      introText: stem,
      questionText: questionLine,
      options: normalizeOptions(item.options),
      correctAnswer: clean(item.correctAnswer),
      solution: clean(item.solution),
      subject,
      classLevel,
      topic,
      difficulty,
      type: 'multiple-choice',
      imagePath: sharedImage || undefined,
      assessmentMeta: {
        groupId: id,
        groupIndex: index + 1,
        groupSize: size,
        sharedStem: stem,
        sharedImage: sharedImage || '',
        sharedPrompt: prompt,
        source: 'smart-parse-multi',
        parseLayout: {
          introText: stem,
          questionLine,
        },
      },
    };
  });
}

module.exports = {
  splitNumberedMultiItems,
  normalizeParsedMultiItems,
  buildGroupedQuestionPayloads,
  normalizeOptions,
};
