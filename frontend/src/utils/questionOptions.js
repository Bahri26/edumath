/** Soru şıklarını { text, image } biçimine normalize eder. */
export function normalizeOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === 'string') {
      return { text: opt, image: '' };
    }
    return {
      text: String(opt?.text ?? ''),
      image: typeof opt?.image === 'string' ? opt.image : '',
    };
  });
}

export function optionText(opt) {
  if (opt == null) return '';
  if (typeof opt === 'string') return opt;
  return String(opt.text ?? '');
}
