import React from 'react';
import katex from 'katex';

/**
 * Windows CR, bozulmuş satırlar ve sıkışık yapıştırma metnini normalize eder.
 */
export function normalizeLatexSource(text = '') {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ');
}

/**
 * Yaygın LaTeX komutlarını okunabilir düz metne çevirir.
 */
export function mathToPlain(math = '') {
  let s = normalizeLatexSource(math);

  s = s.replace(/\\times/g, '×');
  s = s.replace(/\\cdot/g, '·');
  s = s.replace(/\\div/g, '÷');
  s = s.replace(/\\pm/g, '±');
  s = s.replace(/\\mp/g, '∓');
  s = s.replace(/\\rightarrow/g, '→');
  s = s.replace(/\\to\b/g, '→');
  s = s.replace(/\\Rightarrow/g, '⇒');
  s = s.replace(/\\leftarrow/g, '←');
  s = s.replace(/\\leq/g, '≤');
  s = s.replace(/\\geq/g, '≥');
  s = s.replace(/\\neq/g, '≠');
  s = s.replace(/\\approx/g, '≈');
  s = s.replace(/\\infty/g, '∞');
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  s = s.replace(/\\text\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  s = s.replace(/\\mathbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\textbf\{([^}]*)\}/g, '$1');
  s = s.replace(/\\left/g, '');
  s = s.replace(/\\right/g, '');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\;/g, ' ');
  s = s.replace(/\\!/g, '');
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\\_/g, '_');
  s = s.replace(/\\\{/g, '{');
  s = s.replace(/\\\}/g, '}');
  // Kalan tek backslash komutları (örn. \cm) kaldır
  s = s.replace(/\\[a-zA-Z]+/g, '');
  s = s.replace(/\\/g, '');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * Eksik $ kapanışları ve sık görülen yapıştırma hatalarını onarır.
 */
export function repairMathDelimiters(text = '') {
  let t = normalizeLatexSource(text);

  // `$5\text{ cm} olduğuna` → `$5\text{ cm}$ olduğuna`
  t = t.replace(/\$([^$\n]*\\text\{[^}]+\})(?=\s*[a-zçğıöşüA-ZÇĞİÖŞÜ])/g, '$$$1$');

  // `çevre $= 8` → `çevre = $8` değil; `çevre $=` → `çevre $=$` zaten ok; düzelt:
  // `çevre $= 8 \times 5 = 40\text{ cm}$` kalsın ama açılış yoksa ekle
  // Tek başına kalan `$` işaretlerini temizle (çift sayıda değilse sonda)
  const dollarCount = (t.match(/\$/g) || []).length;
  if (dollarCount % 2 === 1) {
    t = t.replace(/\$$/, '');
  }

  return t;
}

/**
 * Çözüm/açıklama için: LaTeX'i okunabilir düz metne çevir (KaTeX hatası / üst üste binme yok).
 */
export function latexToReadableText(text = '') {
  let t = repairMathDelimiters(text);
  if (!t) return '';

  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => mathToPlain(math));
  t = t.replace(/\$([^$\n]+)\$/g, (_, math) => mathToPlain(math));
  // Matematik dışı kalan komutlar
  if (t.includes('\\')) {
    t = mathToPlain(t);
  }
  return t.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

/**
 * Yapıştırılan çözüm metnini okunabilir satırlara böler.
 */
export function normalizeSolutionText(text = '') {
  let t = latexToReadableText(normalizeLatexSource(text)).trim();
  if (!t) return '';

  t = t.replace(/([^\n\d])(?=\d+\.\s*Ad[ıiIİ]m\b)/gi, '$1\n');
  t = t.replace(/([.!?…])\s*(?=\d+\.\s)/g, '$1\n');
  t = t.replace(/([^\n])(?=Do[ğg]ru\s*Cevap\s*:)/gi, '$1\n');
  t = t.replace(/(vard[ıi]r\.)\s*(?=[A-ZÇĞİÖŞÜ])/g, '$1\n');
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return t;
}

function renderKatexHtml(math) {
  const clean = normalizeLatexSource(math).trim();
  if (!clean) return { ok: false, html: '', plain: '' };
  // Çok fazla düz Türkçe kelime varsa matematik değil — düz metin
  const turkishWords = (clean.match(/[a-zçğıöşüA-ZÇĞİÖŞÜ]{4,}/g) || [])
    .filter((w) => !/^(times|text|mathrm|frac|left|right|cdot)$/i.test(w));
  if (turkishWords.length >= 2) {
    return { ok: false, html: '', plain: mathToPlain(clean) };
  }
  try {
    const html = katex.renderToString(clean, {
      throwOnError: true,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
    if (html.includes('katex-error')) {
      return { ok: false, html: '', plain: mathToPlain(clean) };
    }
    return { ok: true, html, plain: mathToPlain(clean) };
  } catch {
    return { ok: false, html: '', plain: mathToPlain(clean) };
  }
}

/**
 * Soru gövdesi vb. için: mümkünse KaTeX, olmazsa okunabilir düz metin.
 */
export function renderWithLatex(text) {
  if (!text) return null;
  const normalized = repairMathDelimiters(text);
  const parts = normalized.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const result = renderKatexHtml(part.slice(2, -2));
          if (result.ok) {
            return (
              <span
                key={index}
                className="my-2 block overflow-x-auto text-inherit"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            );
          }
          return (
            <span key={index} className="my-1 block whitespace-pre-wrap font-medium">
              {result.plain}
            </span>
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const result = renderKatexHtml(part.slice(1, -1));
          if (result.ok) {
            return (
              <span
                key={index}
                className="mx-0.5 inline-block align-middle text-inherit"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
            );
          }
          return (
            <span key={index} className="mx-0.5 inline font-medium">
              {result.plain}
            </span>
          );
        }
        return (
          <span key={index} className="whitespace-pre-line">
            {part.includes('\\') ? mathToPlain(part) : part}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Çözüm/açıklama gösterimi: her zaman okunabilir düz metin (kırmızı KaTeX hatası yok).
 */
export function renderSolutionText(text) {
  const readable = latexToReadableText(text);
  if (!readable) return null;
  return (
    <span className="leading-relaxed whitespace-pre-line">
      {readable}
    </span>
  );
}
