import React from 'react';
import { Sparkles, UserCheck } from 'lucide-react';
import { getQuestionSourceMeta } from '../../utils/questionSourceLabel';

export default function QuestionSourceBadge({ question, lang = 'TR', size = 'sm', className = '' }) {
  const meta = getQuestionSourceMeta(question, lang);
  const isAi = meta.source === 'AI';
  const Icon = isAi ? Sparkles : UserCheck;
  const sizeClass =
    size === 'lg'
      ? 'px-3 py-1 text-[11px] gap-1.5'
      : 'px-2.5 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-black uppercase tracking-wider ${sizeClass} ${meta.badgeClass} ${className}`.trim()}
      title={meta.detail ? `${meta.label} · ${meta.detail}` : meta.label}
    >
      <Icon size={size === 'lg' ? 14 : 12} aria-hidden />
      {meta.label}
      {meta.detail && size === 'lg' ? (
        <span className="font-semibold normal-case tracking-normal opacity-80">· {meta.detail}</span>
      ) : null}
    </span>
  );
}
