/** Soru şıklarını metin-only { text } biçimine normalize eder. */
export function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === 'string') {
      return { text: opt };
    }
    return {
      text: String(opt?.text ?? ''),
    };
  });
}

export function optionText(opt) {
  if (opt == null) return '';
  if (typeof opt === 'string') return opt;
  return String(opt.text ?? '');
}
