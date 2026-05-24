import React from 'react';

const COLOR_MAP = {
  indigo: { bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200' },
  emerald: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' },
  amber: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200' },
  sky: { bar: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200' },
  violet: { bar: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200' },
  rose: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200' },
  teal: { bar: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-200' },
  orange: { bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200' },
};

const motivationalLine = (progress, completedModules, totalModules) => {
  if (totalModules === 0) return 'Yakında dersler eklenecek — takipte kal!';
  if (progress >= 100) return 'Harika! Bu konuyu tamamladın 🎉';
  if (progress >= 75) return 'Bitişe az kaldı, devam et!';
  if (progress >= 40) return 'Güzel gidiyorsun, bir ders daha!';
  if (progress > 0) return 'İlk adımı attın, devam!';
  return 'Keşfetmeye hazır mısın?';
};

const CourseCard = ({
  title,
  progress = 0,
  color = 'indigo',
  icon = '📚',
  completedModules = 0,
  totalModules = 0,
  isPattern = false,
  onClick,
  className = '',
}) => {
  const palette = COLOR_MAP[color] || COLOR_MAP.indigo;
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${palette.chip} group-hover:scale-105 transition-transform`}
        >
          {icon}
        </div>
        {isPattern ? (
          <span className="text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
            Örüntü
          </span>
        ) : null}
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-2 leading-snug">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
        {totalModules > 0
          ? `${completedModules}/${totalModules} ders · %${safeProgress}`
          : 'Dersler hazırlanıyor'}
      </p>
      <p className="text-xs font-medium text-teal-700 dark:text-teal-300 mb-3 min-h-[1rem]">
        {motivationalLine(safeProgress, completedModules, totalModules)}
      </p>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${palette.bar}`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </>
  );

  const cardClass = `bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all hover:-translate-y-0.5 group text-left w-full ${className}`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClass}>
        {inner}
      </button>
    );
  }

  return <div className={cardClass}>{inner}</div>;
};

export default CourseCard;
