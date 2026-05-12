import React from 'react';
import { Clock } from 'lucide-react';

const ActivityRow = ({ activity }) => {
  if (!activity) return null;

  const student = activity.student || activity.name || 'Bilinmiyor';
  const score = typeof activity.score === 'number' ? activity.score : 0;
  const time = activity.time || '-';
  const action = activity.action || '-';
  const kind = activity.kind === 'question' ? 'question' : 'exam';
  const subtitle = typeof activity.subtitle === 'string' && activity.subtitle.trim() ? activity.subtitle.trim() : null;

  const getScoreColor = (value) => {
    if (value >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800';
    if (value >= 60) return 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800';
    if (value > 0) return 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800';
    return 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-600';
  };

  const badgeClass = 'px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold border';

  return (
    <tr className="border-b border-slate-50 dark:border-slate-700/80 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex-shrink-0 flex items-center justify-center font-bold text-xs md:text-sm">
            {student.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{student}</p>
            {subtitle ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="py-4 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">{action}</td>
      <td className="py-4">
        {kind === 'question' ? (
          <span className={`${badgeClass} text-slate-600 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300`}>
            Soru
          </span>
        ) : score > 0 ? (
          <span className={`${badgeClass} ${getScoreColor(score)}`}>{score} Puan</span>
        ) : (
          <span className={`${badgeClass} text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600`}>
            Sonuç yok
          </span>
        )}
      </td>
      <td className="py-4 text-right pr-4 text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center justify-end gap-1">
          <Clock size={12} aria-hidden />
          <span className="hidden sm:inline">{time}</span>
          <span className="sm:hidden">{time.replace(' dk önce', 'dk').replace(' saat önce', 'sa')}</span>
        </div>
      </td>
    </tr>
  );
};

export default ActivityRow;
