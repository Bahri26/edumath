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
 * Yapıştırılan çözüm metnini okunabilir satırlara böler.
 * Örn. "vardır.2. Adım:" → satır kırılımı.
 */
export function normalizeSolutionText(text = '') {
  let t = normalizeLatexSource(text).trim();
  if (!t) return '';

  // Sıkışık numaralı adımlar: "...vardır.2. Adım:"
  t = t.replace(/([^\n\d])(?=\d+\.\s*Ad[ıiIİ]m\b)/gi, '$1\n');
  t = t.replace(/([.!?…])\s*(?=\d+\.\s)/g, '$1\n');
  // "Doğru Cevap:" her zaman yeni satır
  t = t.replace(/([^\n])(?=Do[ğg]ru\s*Cevap\s*:)/gi, '$1\n');
  // "Kare sayısı her adımda..." gibi sonuç cümlesi (önceki adım bittikten sonra)
  t = t.replace(/(vard[ıi]r\.)\s*(?=[A-ZÇĞİÖŞÜ])/g, '$1\n');
  // Fazla boşlukları sadeleştir (satır içi)
  t = t
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');

  return t;
}

function renderKatexHtml(math) {
  const clean = normalizeLatexSource(math).trim();
  if (!clean) return '';
  try {
    return katex.renderToString(clean, {
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      output: 'html',
    });
  } catch {
    return clean;
  }
}

/**
 * Metin içinde $...$ ve $$...$$ LaTeX parçalarını render eder.
 */
export function renderWithLatex(text) {
  if (!text) return null;
  const normalized = normalizeLatexSource(text);
  // Önce display $$...$$, sonra inline $...$
  const parts = normalized.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);

  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const html = renderKatexHtml(part.slice(2, -2));
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto text-teal-700 dark:text-teal-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const html = renderKatexHtml(part.slice(1, -1));
          return (
            <span
              key={index}
              className="mx-0.5 inline-block align-middle text-teal-700 dark:text-teal-300"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }
        return (
          <span key={index} className="whitespace-pre-line">
            {part}
          </span>
        );
      })}
    </span>
  );
}
