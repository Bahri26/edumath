import React, { useMemo } from 'react';
import { renderWithLatex } from '../../utils/latex.jsx';

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function countEmojiLike(text) {
  const matches = String(text || '').match(new RegExp(EMOJI_RE.source, 'gu'));
  return matches ? matches.length : 0;
}

function isPatternLine(line) {
  const l = String(line || '').trim();
  if (!l) return false;
  const emojiCount = countEmojiLike(l);
  if (emojiCount >= 3) return true;
  if (/__/.test(l) && (emojiCount >= 1 || /\d/.test(l))) return true;
  if (/adım/i.test(l) && emojiCount >= 1) return true;
  return false;
}

/** Tek satırda "1. adım 6, 2. adım 9, ... . Soru kısmı" biçimini ana metin + adım satırlarına ayırır. */
function splitInlineNumericSteps(line) {
  const t = String(line || '').trim();
  const adimTagCount = (t.match(/\d+\.\s*adım/gi) || []).length;
  if (adimTagCount < 2) return null;

  const m = t.match(
    /^([\s\S]+?:\s*)((?:\d+\.\s*adım\s+\d+)(?:,\s*\d+\.\s*adım\s+\d+)+)\.\s+([\s\S]+)$/
  );
  if (!m) return null;

  const intro = m[1].trim().replace(/:\s*$/, '');
  const stepsBlob = m[2].trim();
  const questionRest = m[3].trim();

  const stepLines = stepsBlob.split(/\s*,\s*/).filter(Boolean);
  if (stepLines.length < 2) return null;

  const mainBlock = [intro, questionRest].filter(Boolean).join('\n');

  return { mainBlock, stepLines };
}

/**
 * "A örüntüsü: 2, 4, 6, 8,… B örüntüsü: 2, 5, 8, 11,… Hangisi ...?"
 * iki diziyi kutuya alır; asıl soru cümlesi üstte kalır.
 */
function splitAbOruntu(line) {
  const t = String(line || '').trim();
  const m = t.match(
    /^([\s\S]*?)(A\s*örüntüsü\s*:\s*)(\d+(?:\s*,\s*\d+)+(?:\s*,\s*(?:…|\.\.\.))?)\s+(B\s*örüntüsü\s*:\s*)(\d+(?:\s*,\s*\d+)+(?:\s*,\s*(?:…|\.\.\.))?)\s+([\s\S]+)$/iu
  );
  if (!m) return null;
  const prefix = m[1].trim();
  const seqA = m[3].trim();
  const seqB = m[5].trim();
  const rest = m[6].trim();
  const mainBlock = [prefix, rest].filter(Boolean).join(' ');
  return {
    mainBlock,
    stepLines: [`A: ${seqA}`, `B: ${seqB}`],
  };
}

/** En az üç virgüllü sayı veya "__" ile biten sayı dizisi; … veya ... desteklenir. */
function splitCommaNumberRuns(line) {
  const t = String(line || '').trim();
  if (!t) return null;

  const runRe = /\d+(?:\s*,\s*\d+){2,}(?:(?:\s*,\s*(?:…|\.\.\.))|(?:\s*,\s*__))?/gu;
  const matchObjs = [...t.matchAll(runRe)]
    .map((m) => ({
      text: m[0],
      index: m.index,
      numCount: (m[0].match(/\d+/g) || []).length,
      hasBlank: /,\s*__\s*$/.test(m[0]),
    }))
    .filter((o) => o.numCount >= 3 || o.hasBlank);
  if (!matchObjs.length) return null;

  let main = t;
  for (const o of [...matchObjs].sort((a, b) => b.index - a.index)) {
    // Replace the raw sequence in the main sentence with a single placeholder.
    main = main.slice(0, o.index) + ' ? ' + main.slice(o.index + o.text.length);
  }
  main = main.replace(/\s+/g, ' ').trim();

  // If the whole line is basically just numbers/sequences, keep it as-is (no '?' placeholder UI).
  // This prevents turning pure numeric questions into a lone "?".
  const hasAnyLetter = /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(main);
  const onlyPlaceholder = main.replace(/[?.!,;:()\[\]{}"'\s]/g, '') === '';
  if (!main || !hasAnyLetter || onlyPlaceholder) return null;

  return {
    mainBlock: cleanStemAfterSequenceRemovedFromSentence(main),
    stepLines: matchObjs.map((o) => o.text),
  };
}

/** Dizi altta gösterildiğinde üst cümlede "örüntüsünde" vb. tekrarları ve gereksiz "?" kırıntılarını sadeleştirir. */
function capitalizeTrFirst(s) {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);
}

function cleanStemAfterSequenceRemovedFromSentence(raw) {
  let m = String(raw || '').trim();
  // "… 5'er sayılıyor: ? Boşluğa …" gibi kural anlatımını düşür (dizi altta gösterildiği için).
  m = m.replace(/^.*?sayılıyor\s*:\s*\?\s*/i, '');
  m = m.replace(/^.*?sayılıyor\s*:\s*/i, '');
  m = m.replace(/^\?\s*örüntüsünde\s+/i, '');
  m = m.replace(/^\?\s*örüntüde\s+/i, '');
  m = m.replace(/^\?\s*örüntüsünün\s+kuralı\s+/i, 'Kuralı ');
  m = m.replace(/^\?\s*örüntüsünün\s+/i, '');
  m = m.replace(/^\?\s*örüntünün\s+/i, '');
  m = m.replace(/^\?\s+/u, '');
  m = m.replace(/\s+/g, ' ').trim();
  if (/^[a-zçğıöşü]/.test(m)) m = capitalizeTrFirst(m);
  return m;
}

const NUMBER_COLOR_CLASSES = [
  'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800/40',
  'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/40',
  'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/40',
  'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40',
  'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/40',
  'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800/40',
];

function renderPatternLine(line) {
  const t = String(line || '');
  // If it looks like LaTeX, keep existing renderer to avoid breaking formulas.
  if (t.includes('$') || t.includes('\\')) return renderWithLatex(t);

  const nums = t.match(/\d+/g) || [];
  const hasSequenceLike = /,\s*\d+/.test(t) && nums.length >= 3;
  const hasAb = /^(A|B)\s*:/i.test(t.trim()) && nums.length >= 3;
  const hasStep = /adım/i.test(t) && nums.length >= 1;
  if (!hasSequenceLike && !hasAb && !hasStep) return renderWithLatex(t);

  let nIdx = 0;
  const parts = t.split(/(\d+)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) => {
        if (!p) return null;
        if (/^\d+$/.test(p)) {
          const cls = NUMBER_COLOR_CLASSES[nIdx % NUMBER_COLOR_CLASSES.length];
          nIdx += 1;
          return (
            <span
              key={i}
              className={`inline-flex items-center justify-center px-2 py-0.5 mx-0.5 rounded-lg border font-black tabular-nums ${cls}`}
            >
              {p}
            </span>
          );
        }
        return (
          <span key={i} className="text-slate-800 dark:text-slate-200">
            {p}
          </span>
        );
      })}
    </span>
  );
}

export default function QuestionTextWithPattern({ text, className = '', mainClassName = '' }) {
  const { mainLines, patternLines } = useMemo(() => {
    const lines = String(text || '')
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const pattern = [];
    const main = [];
    let structuredPattern = false;
    for (const line of lines) {
      const numericSplit = splitInlineNumericSteps(line);
      if (numericSplit) {
        structuredPattern = true;
        main.push(numericSplit.mainBlock);
        for (const s of numericSplit.stepLines) {
          pattern.push(s);
        }
        continue;
      }
      const abSplit = splitAbOruntu(line);
      if (abSplit) {
        structuredPattern = true;
        main.push(abSplit.mainBlock);
        for (const s of abSplit.stepLines) {
          pattern.push(s);
        }
        continue;
      }
      const commaSplit = splitCommaNumberRuns(line);
      if (commaSplit) {
        structuredPattern = true;
        if (commaSplit.mainBlock) main.push(commaSplit.mainBlock);
        for (const s of commaSplit.stepLines) {
          pattern.push(s);
        }
        continue;
      }
      (isPatternLine(line) ? pattern : main).push(line);
    }

    // If her satır sadece emoji/__ gibi "tamamen örüntü satırı" sayıldıysa, kutuya ayırma.
    if (main.length === 0 && pattern.length > 0 && !structuredPattern) {
      return { mainLines: pattern, patternLines: [] };
    }

    return { mainLines: main, patternLines: pattern };
  }, [text]);

  return (
    <div className={className}>
      {mainLines.length > 0 && (
        <div
          className={
            mainClassName.trim()
              ? mainClassName
              : 'text-slate-800 dark:text-slate-200 font-medium text-base md:text-lg'
          }
        >
          {renderWithLatex(mainLines.join('\n'))}
        </div>
      )}

      {patternLines.length > 0 && (
        <div className="mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/20 px-4 py-3">
          <div className="space-y-1.5 text-[15px] leading-relaxed text-slate-900 dark:text-slate-100">
            {patternLines.map((line, idx) => (
              <div key={idx} className="whitespace-pre-wrap">
                {renderPatternLine(line)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

