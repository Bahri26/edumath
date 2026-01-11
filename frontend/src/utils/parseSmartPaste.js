// Parse text containing choices (A-E or 1-8), even when inline (e.g., "A) 4 B) 5 C) 6 ...")
export function parseTextToQuestion(raw) {
  // Normalize common OCR artifacts and whitespace
  let input = String(raw || '').replace(/\r/g, '');
  // Replace zero mistaken for D (e.g., "0)" -> "D)")
  input = input.replace(/(^|\s)0\)/g, '$1D)');
  // Collapse multiple spaces
  input = input.replace(/\s{2,}/g, ' ');

  // Find candidate letter tokens (A-E). Require >=3 distinct labels to treat as options.
  const options = [];
  let text = input.trim();
  let correctAnswer = '';

  const letterTokenRegex = /([A-Ea-e])[\)\.]\s*/g;
  const letterTokens = [];
  let lm;
  while ((lm = letterTokenRegex.exec(input)) !== null) {
    const idx = lm.index;
    // Must be at start or preceded by whitespace
    if (idx > 0 && !/\s|\n/.test(input[idx - 1])) continue;
    letterTokens.push({ idx, label: lm[1].toUpperCase(), len: lm[0].length });
  }
  const distinctLetters = Array.from(new Set(letterTokens.map(t => t.label))).length;

  // If letters look valid, use them; else fallback to numeric but only at line starts
  let tokens = [];
  if (distinctLetters >= 3) {
    tokens = letterTokens;
  } else {
    const numTokenRegex = /(^|\n)([1-8])[\)\.]\s*/g;
    let nm; const numTokens = [];
    while ((nm = numTokenRegex.exec(input)) !== null) {
      const idx = nm.index + (nm[1] ? nm[1].length : 0);
      numTokens.push({ idx, label: nm[2], len: nm[0].slice(nm[1] ? nm[1].length : 0).length });
    }
    const distinctNums = Array.from(new Set(numTokens.map(t => t.label))).length;
    if (distinctNums >= 3) tokens = numTokens; // otherwise leave tokens empty
  }

  if (tokens.length >= 2) {
    text = input.slice(0, tokens[0].idx).trim();
    for (let i = 0; i < tokens.length; i++) {
      const start = tokens[i].idx + tokens[i].len;
      const end = i + 1 < tokens.length ? tokens[i + 1].idx : input.length;
      const optText = input.slice(start, end).trim().replace(/^[-:\s]+/, '').trim();
      if (optText) options.push(optText);
      if (options.length >= 8) break;
    }
  }

  // Detect correct answer letter/number patterns
  const ans = input.match(/(?:Cevap|Doğru\s*Cevap|Doğru\s*Seçenek|Yanıt)\s*[:\-]?\s*([A-Ea-e1-8])/);
  if (ans && options.length) {
    const token = ans[1].toUpperCase();
    const letters = 'ABCDE';
    let idx = letters.indexOf(token);
    if (idx < 0 && /^[1-8]$/.test(token)) idx = parseInt(token, 10) - 1;
    if (idx >= 0 && options[idx]) correctAnswer = options[idx];
  }

  // Fallback: if no options found, attempt newline-based extraction
  if (options.length === 0) {
    const letterRegex = /(^|\s)([A-Ea-e])[\)\.]\s*([\s\S]*?)(?=(\s[A-Ea-e][\)\.]|$))/g;
    const matches = [...input.matchAll(letterRegex)];
    if (matches.length >= 2) {
      const firstIndex = matches[0].index ?? input.indexOf(matches[0][0]);
      text = input.slice(0, firstIndex).trim();
      for (const m of matches) {
        const t = (m[3] || '').trim();
        if (t) options.push(t);
      }
    }
  }

  // Ensure at least 4 slots and pad to 5 for UI
  const normalizedOptions = options.length ? options : ['', '', '', ''];
  return { text, options: normalizedOptions, correctAnswer };
}

// Helper: get the token length at index (e.g., "A) " => 3)
function matchLengthAt(str, index) {
  const m = str.slice(index).match(/^([A-Ea-e]|[1-8])[\)\.]\s*/);
  return m ? m[0].length : 0;
}
