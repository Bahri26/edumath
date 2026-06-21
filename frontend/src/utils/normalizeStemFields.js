/** OCR birleşik metni giriş + soru cümlesine ayırır (backend ile uyumlu). */
export function stripLeadingOcrGarbage(text) {
  let s = String(text || '').trim();
  if (!s) return '';

  const head = s.slice(0, 64);
  const starters = /(?:^|\s)(İlk |Bu |Verilen |Buna |Aşağı |Yukarı |Dizisinde |Soru |Kaç |Hangisi |Görselde )/gi;
  let cutAt = -1;
  let match;
  while ((match = starters.exec(head)) !== null) {
    const idx = match.index + (match[0].startsWith(' ') ? 1 : 0);
    if (cutAt < 0 || idx < cutAt) cutAt = idx;
    if (idx === 0) break;
  }
  if (cutAt > 0 && cutAt < 48) {
    s = s.slice(cutAt);
  }

  s = s.replace(
    /^((?:[A-Za-zÇçĞğİıÖöŞşÜü]{1,3}\s+){1,8})(?=[İi]lk|[Öö]rüntü|[Şş]ekil|Bu\s|Buna\s|Kaç\s|Hangisi)/u,
    ''
  );

  return s.trim();
}

export function normalizeStemFields(introText = '', questionText = '') {
  let intro = stripLeadingOcrGarbage(String(introText || '').trim());
  let question = stripLeadingOcrGarbage(String(questionText || '').trim());

  if (!question && intro) {
    const askMatch = intro.match(
      /((?:İlk|Bu|Verilen|Buna|Aşağı|Yukarı)[^?\n]{8,300}[?？])|([^?\n]{12,300}(?:kaç|hangi|bulun|hesapla)[^?\n]*[?？])/i
    );
    if (askMatch) {
      question = (askMatch[1] || askMatch[2] || '').trim();
      intro = intro.replace(askMatch[0], '').trim();
    }
  }

  if (intro && question && intro.includes(question)) {
    intro = intro.replace(question, '').trim();
  }

  return { introText: intro, questionText: question };
}
