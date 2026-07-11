import React from 'react';

const isSequenceCorrect = (target, state) => {
  if (!Array.isArray(target) || !Array.isArray(state) || target.length !== state.length) {
    return false;
  }
  return target.every((itemId, index) => state[index] === itemId);
};

export const MatchingPracticeCard = ({ question, state, onChange, examMode = false }) => {
  const prompts = question.interactionData?.prompts || [];
  const options = question.interactionData?.options || [];
  const correctPairs = question.interactionData?.correctPairs || {};
  const selectedMap = state?.selected || {};
  const isComplete = prompts.every((prompt) => selectedMap[prompt.id]);
  const isCorrect = isComplete && prompts.every((prompt) => selectedMap[prompt.id] === correctPairs[prompt.id]);

  const shellClass = examMode
    ? 'space-y-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5'
    : `space-y-4 rounded-2xl border-2 p-5 ${
        isComplete ? (isCorrect ? 'border-green-200 bg-green-50/40' : 'border-rose-200 bg-rose-50/40') : 'border-slate-200 dark:border-slate-700'
      }`;

  return (
    <div className={shellClass}>
      {prompts.map((prompt) => (
        <div key={prompt.id} className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
          <div className="font-medium text-slate-800 dark:text-slate-100">{prompt.label}</div>
          <select
            value={selectedMap[prompt.id] || ''}
            onChange={(event) => onChange(prompt.id, event.target.value, correctPairs)}
            className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            disabled={!examMode && isComplete}
          >
            <option value="">Eşleştirme seç</option>
            {options.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      ))}
      {!examMode && isComplete && (
        <div className={`rounded-xl p-4 text-sm ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
          <strong>{isCorrect ? 'Doğru eşleştirme.' : 'Bir veya daha fazla eşleştirme yanlış.'}</strong>
        </div>
      )}
    </div>
  );
};

export const SequencePracticeCard = ({ question, state, onMove, examMode = false }) => {
  const items = question.interactionData?.items || [];
  const correctOrder = question.interactionData?.correctOrder || [];
  const currentOrder = Array.isArray(state?.selected) && state.selected.length ? state.selected : items.map((item) => item.id);
  const isLocked = !!state?.checked;
  const isCorrect = state?.checked ? isSequenceCorrect(correctOrder, currentOrder) : false;

  const shellClass = examMode
    ? 'space-y-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 p-5'
    : `space-y-3 rounded-2xl border-2 p-5 ${state?.checked ? (isCorrect ? 'border-green-200 bg-green-50/40' : 'border-rose-200 bg-rose-50/40') : 'border-slate-200 dark:border-slate-700'}`;

  return (
    <div className={shellClass}>
      {currentOrder.map((itemId, index) => {
        const item = items.find((entry) => entry.id === itemId);
        return (
          <div key={itemId} className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700 font-bold text-sm">{index + 1}</span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{item?.label}</span>
            </div>
            {!isLocked && (
              <div className="flex gap-2">
                <button type="button" onClick={() => onMove(index, -1, currentOrder)} disabled={index === 0} className="rounded-lg border px-3 py-1 text-xs disabled:opacity-40">Yukarı</button>
                <button type="button" onClick={() => onMove(index, 1, currentOrder)} disabled={index === currentOrder.length - 1} className="rounded-lg border px-3 py-1 text-xs disabled:opacity-40">Aşağı</button>
              </div>
            )}
          </div>
        );
      })}
      {!isLocked ? (
        <button type="button" onClick={() => onMove(-1, 0, currentOrder, true)} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white">{examMode ? 'Sırayı Kilitle (Gönderim İçin)' : 'Sıralamayı Kontrol Et'}</button>
      ) : (
        <div className={`rounded-xl p-4 text-sm ${examMode ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' : (isCorrect ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800')}`}>
          <strong>{examMode ? 'Sıra kaydedildi.' : (isCorrect ? 'Sıralama doğru.' : 'Sıralama hatalı.')}</strong>
        </div>
      )}
    </div>
  );
};
