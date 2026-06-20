/**
 * Question origin labels for teacher question bank.
 * Backend: source enum 'Manuel' | 'AI'
 */
const AI_METHOD_LABELS = {
  TR: {
    ai: 'Gemini',
    'ollama-vision': 'Ollama görsel',
    'ocr+crop': 'OCR + kırpma',
    ocr: 'OCR',
    manual: 'Manuel düzenleme',
    'smart-parse': 'Akıllı yapıştır',
    'ai-generate': 'AI üretici',
    'pattern-pack': 'Örüntü paketi',
  },
  EN: {
    ai: 'Gemini',
    'ollama-vision': 'Ollama vision',
    'ocr+crop': 'OCR + crop',
    ocr: 'OCR',
    manual: 'Manual edit',
    'smart-parse': 'Smart paste',
    'ai-generate': 'AI generator',
    'pattern-pack': 'Pattern pack',
  },
};

export function getQuestionSourceMeta(question, lang = 'TR') {
  const source = question?.source === 'AI' ? 'AI' : 'Manuel';
  const method =
    question?.assessmentMeta?.parseMode ||
    question?.assessmentMeta?.origin ||
    question?.assessmentMeta?.source ||
    '';
  const methodMap = AI_METHOD_LABELS[lang] || AI_METHOD_LABELS.TR;

  if (source === 'AI') {
    return {
      source: 'AI',
      label: lang === 'EN' ? 'AI' : 'AI',
      detail: methodMap[method] || (method ? String(method) : lang === 'EN' ? 'Generated' : 'Üretildi'),
      badgeClass:
        'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/50 dark:text-violet-200 dark:border-violet-800/50',
      icon: 'sparkles',
    };
  }

  return {
    source: 'Manuel',
    label: lang === 'EN' ? 'Expert' : 'Uzman',
    detail: lang === 'EN' ? 'Teacher verified' : 'Öğretmen doğruladı',
    badgeClass:
      'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800/50',
    icon: 'user',
  };
}

export function sourceFilterOptions(lang = 'TR') {
  if (lang === 'EN') {
    return ['All', 'AI', 'Expert'];
  }
  return ['Tümü', 'AI', 'Uzman'];
}

export function sourceFilterToApi(value) {
  if (value === 'AI') return 'AI';
  if (value === 'Uzman' || value === 'Expert') return 'Manuel';
  return '';
}
