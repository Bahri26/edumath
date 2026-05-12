import React from 'react';

const padBtn =
  'min-h-[52px] rounded-2xl text-xl font-black bg-indigo-600 text-white shadow-md active:scale-[0.98] hover:bg-indigo-500 disabled:opacity-40';

/** Sayı cevapları için dokunmatik pad (cevap metni sunucudaki correctAnswer ile aynı biçimde tutulur) */
export function ExerciseNumberPad({ value, onChange, maxDigits = 10 }) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const append = (d) => {
    const cur = value || '';
    if (cur.length >= maxDigits) return;
    onChange(cur + d);
  };

  return (
    <div className="space-y-4">
      <div className="text-center font-mono text-4xl font-black tracking-widest text-slate-800 dark:text-white min-h-[3rem] flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        {value || '·'}
      </div>
      <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
        {digits.map((d) => (
          <button key={d} type="button" className={padBtn} onClick={() => append(d)}>
            {d}
          </button>
        ))}
      </div>
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          className="px-4 py-2 rounded-xl font-bold text-sm bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100"
          onClick={() => onChange((value || '').slice(0, -1))}
        >
          Sil
        </button>
        <button
          type="button"
          className="px-4 py-2 rounded-xl font-bold text-sm bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300"
          onClick={() => onChange('')}
        >
          Temizle
        </button>
      </div>
    </div>
  );
}

/** İki şıklı çoktan seçmeli: büyük bloklar */
export function ExerciseTwoChoiceBlocks({ leftLabel, rightLabel, value, onChange }) {
  const l = leftLabel || 'A';
  const r = rightLabel || 'B';
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => onChange(l)}
        className={`min-h-[120px] rounded-2xl border-4 p-4 text-left font-bold text-lg transition-all ${
          value === l
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100'
            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-emerald-300'
        }`}
      >
        {l}
      </button>
      <button
        type="button"
        onClick={() => onChange(r)}
        className={`min-h-[120px] rounded-2xl border-4 p-4 text-left font-bold text-lg transition-all ${
          value === r
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-900 dark:text-violet-100'
            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-violet-300'
        }`}
      >
        {r}
      </button>
    </div>
  );
}

const SHAPES = ['●', '■', '▲', '◆', '★', '⬡'];

/** 3–6 şık: şekil + metin (cevap yine şık metni) */
export function ExerciseShapeOptionRow({ options, optionLabel, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {options.map((opt, i) => {
        const label = optionLabel(opt);
        const shape = SHAPES[i % SHAPES.length];
        const active = value === label;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(label)}
            className={`flex flex-col items-center gap-2 min-w-[100px] max-w-[160px] p-4 rounded-2xl border-4 transition-all ${
              active
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-lg scale-[1.02]'
                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300'
            }`}
          >
            <span className="text-4xl leading-none" aria-hidden>
              {shape}
            </span>
            <span className="text-xs font-semibold text-center text-slate-700 dark:text-slate-200 line-clamp-4">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Boşluk doldurma — büyük dokunmatik alan */
export function ExerciseFillPlay({ value, onChange, placeholder = 'Cevabını yaz…' }) {
  return (
    <textarea
      rows={3}
      placeholder={placeholder}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xl font-medium px-4 py-4 rounded-2xl border-4 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-amber-400/40"
    />
  );
}

/** Doğru / yanlış veya iki metin şıkkı */
export function ExerciseTfPlay({ optionA, optionB, value, onChange }) {
  const a = optionA || 'Doğru';
  const b = optionB || 'Yanlış';
  return <ExerciseTwoChoiceBlocks leftLabel={a} rightLabel={b} value={value} onChange={onChange} />;
}
