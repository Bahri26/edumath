import React from 'react';
import { renderWithLatex } from '../../utils/latex.jsx';
import { getQuestionLayout } from '../../utils/questionLayout.js';
import QuestionTextWithPattern from './QuestionTextWithPattern.jsx';
import QuestionVisual from './QuestionVisual.jsx';

export default function QuestionStemCard({
  question,
  questionLabel = '',
  showMeta = true,
  showVisual = true,
  className = '',
}) {
  const { introText, questionText, hasStructuredStem } = getQuestionLayout(question);
  const topic = String(question?.topic || '').trim();
  const classLevel = String(question?.classLevel || '').trim();
  const type = question?.type && question.type !== 'multiple-choice'
    ? String(question.type)
    : '';
  const hasMeta = showMeta && (questionLabel || topic || classLevel || type);

  return (
    <section className={className}>
      {hasMeta ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {topic ? (
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-900/40 dark:text-teal-200">
              {topic}
            </span>
          ) : null}
          {questionLabel ? (
            <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-bold text-surface-600 dark:bg-surface-700 dark:text-surface-300">
              {questionLabel}
            </span>
          ) : null}
          {classLevel ? (
            <span className="rounded-full border border-surface-200 px-3 py-1 text-[11px] font-semibold text-surface-500 dark:border-surface-600 dark:text-surface-300">
              {classLevel}
            </span>
          ) : null}
          {type ? (
            <span className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-800 dark:bg-sky-900/30 dark:text-sky-200">
              {type}
            </span>
          ) : null}
        </div>
      ) : null}

      {hasStructuredStem ? (
        <div className="space-y-4">
          {introText ? (
            <div className="text-base font-medium leading-relaxed text-surface-700 dark:text-surface-200 sm:text-lg">
              {renderWithLatex(introText)}
            </div>
          ) : null}

          {showVisual ? (
            <QuestionVisual
              src={question?.image}
              alt={topic ? `${topic} soru görseli` : 'Soru görseli'}
            />
          ) : null}

          {questionText ? (
            <div className="text-lg font-semibold leading-relaxed text-surface-900 dark:text-white sm:text-xl">
              {renderWithLatex(questionText)}
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <QuestionTextWithPattern
            text={question?.text}
            mainClassName="text-lg font-medium leading-relaxed text-surface-800 dark:text-white sm:text-[1.15rem]"
          />
          {showVisual ? (
            <QuestionVisual
              src={question?.image}
              alt={topic ? `${topic} soru görseli` : 'Soru görseli'}
              className="mt-4"
            />
          ) : null}
        </>
      )}
    </section>
  );
}
