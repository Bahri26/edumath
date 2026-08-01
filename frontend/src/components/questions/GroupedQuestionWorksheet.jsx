import React, { useMemo } from 'react';
import QuestionStemCard from './QuestionStemCard.jsx';
import QuestionOptionGrid from './QuestionOptionGrid.jsx';
import { renderWithLatex } from '../../utils/latex.jsx';
import { shouldUseLetterOnlyOptions } from '../../utils/questionLayout.js';
import {
  getGroupedWorksheetMembers,
  resolveGroupedDisplayQuestion,
} from '../../utils/questionGroup.js';

/**
 * Ortak köklü çoklu soru çalışma sayfası (Matova tarzı):
 * üstte bir kez görsel/giriş, altında her madde için ayrı A–D şıkları.
 */
export default function GroupedQuestionWorksheet({
  questions = [],
  allQuestions = [],
  answers = {},
  pendingById = {},
  onPendingChange,
  onCommit,
  showCommitButton = true,
  commitLabel = 'Cevapla',
  disabledIds = {},
  showCorrect = false,
  framed = false,
  sharedPrompt,
}) {
  const members = useMemo(
    () => getGroupedWorksheetMembers(questions[0] || null, allQuestions.length ? allQuestions : questions),
    [questions, allQuestions],
  );

  const anchor = members[0];
  const displayAnchor = useMemo(
    () => (anchor ? resolveGroupedDisplayQuestion(anchor, allQuestions.length ? allQuestions : members) : null),
    [anchor, allQuestions, members],
  );

  if (!members.length || !displayAnchor) return null;

  const sharedStem = String(
    displayAnchor.assessmentMeta?.sharedStem
    || displayAnchor.assessmentMeta?.parseLayout?.introText
    || '',
  ).trim();

  const prompt = sharedPrompt
    || displayAnchor.assessmentMeta?.sharedPrompt
    || 'Aşağıdaki soruları yukarıdaki bilgilere göre cevaplayınız.';

  return (
    <div className="space-y-6">
      <QuestionStemCard
        question={{
          topic: displayAnchor.topic,
          classLevel: displayAnchor.classLevel,
          difficulty: displayAnchor.difficulty,
          image: displayAnchor.image,
          text: sharedStem,
          assessmentMeta: {
            contentMode: displayAnchor.assessmentMeta?.contentMode,
            parseLayout: {
              introText: sharedStem,
              questionLine: '',
            },
          },
        }}
        showMeta
        framed={framed}
        showImageInstruction={false}
      />

      {prompt ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {prompt}
        </p>
      ) : null}

      <div className="space-y-5">
        {members.map((raw, idx) => {
          const display = resolveGroupedDisplayQuestion(raw, allQuestions.length ? allQuestions : members);
          const line = String(
            display.assessmentMeta?.parseLayout?.questionLine
            || display.assessmentMeta?.parseLayout?.questionText
            || '',
          ).trim();
          const qId = String(raw._id || idx);
          const pending = pendingById[qId] ?? '';
          const committed = typeof answers[qId] === 'string' ? answers[qId] : '';
          const value = pending || committed;
          const disabled = Boolean(disabledIds[qId]);
          const letterOnly = shouldUseLetterOnlyOptions(display);
          const options = Array.isArray(raw.options) && raw.options.length >= 2
            ? raw.options
            : ['A', 'B', 'C', 'D'];

          return (
            <section
              key={qId}
              className="rounded-2xl border border-surface-200 bg-white/90 p-4 dark:border-surface-700 dark:bg-surface-800/80"
            >
              <p className="mb-3 text-base font-semibold text-surface-900 dark:text-white">
                <span className="mr-2 font-black text-teal-700 dark:text-teal-300">{idx + 1}.</span>
                {line ? renderWithLatex(line) : (
                  <span className="text-surface-500">Soru {idx + 1}</span>
                )}
              </p>

              <QuestionOptionGrid
                options={options}
                value={value}
                onChange={(v) => onPendingChange?.(qId, v)}
                disabled={disabled}
                correctAnswer={showCorrect ? raw.correctAnswer : ''}
                showCorrect={showCorrect}
                variant={letterOnly ? 'square' : 'list'}
                letterOnly={letterOnly}
                ariaLabel={`${idx + 1}. soru cevap seçenekleri`}
              />

              {showCommitButton ? (
                <button
                  type="button"
                  onClick={() => onCommit?.(qId, pending || value)}
                  disabled={disabled || !String(pending || value).trim()}
                  className="mt-3 w-full rounded-2xl bg-gradient-to-r from-teal-600 to-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {commitLabel}
                </button>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
