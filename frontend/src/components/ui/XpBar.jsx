import React from 'react';

const XpBar = ({ current, max, level }) => {
  const percentage = (current / max) * 100;
  return (
    <div className="flex flex-col w-full max-w-xs">
      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
        <span>Seviye {level}</span>
        <span>{current}/{max} XP</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-yellow-400 to-orange-500 h-full rounded-full" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default XpBar;