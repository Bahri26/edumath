import React from 'react';
import PropTypes from 'prop-types';

export default function DifficultyBar({ level }) {
  const getBarCount = () => {
    if (level === 'Kolay') return 1;
    if (level === 'Orta') return 2;
    return 3;
  };
  const getBarColor = () => {
    if (level === 'Kolay') return 'bg-emerald-500';
    if (level === 'Orta') return 'bg-amber-500';
    return 'bg-rose-500';
  };
  const barCount = getBarCount();
  const barColor = getBarColor();
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className={`h-5 w-1.5 rounded-full transition-all ${
            i <= barCount ? barColor : 'bg-slate-200 dark:bg-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

DifficultyBar.propTypes = {
  level: PropTypes.string.isRequired,
};
