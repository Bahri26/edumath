import React from 'react';

const CourseCard = ({ title, progress, color, icon }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group">
    <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h3 className="font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-xs text-slate-400 mb-4">% {progress} Tamamlandı</p>
    
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full rounded-full ${color.replace('bg-', 'bg-')}`} 
        style={{ width: `${progress}%`, backgroundColor: 'currentColor' }}
      ></div>
    </div>
  </div>
);

export default CourseCard;