import React from 'react';
import { Clock } from 'lucide-react';

const ActivityRow = ({ activity }) => {
  // Null/undefined kontrolü
  if (!activity) return null;
  
  const student = activity.student || activity.name || 'Bilinmiyor';
  const score = activity.score || 0;
  const time = activity.time || '-';
  const action = activity.action || '-';

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-100';
    if (score > 0) return 'text-rose-600 bg-rose-50 border-rose-100';
    return 'text-slate-600 bg-slate-50 border-slate-100'; // score === 0
  };

  return (
    <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center font-bold text-xs md:text-sm">
            {student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{student}</p>
            <p className="text-xs text-slate-400 hidden sm:block">10. Sınıf - A Şubesi</p>
          </div>
        </div>
      </td>
      <td className="py-4 text-sm text-slate-600 hidden sm:table-cell">{action}</td>
      <td className="py-4">
        <span className={`px-2 py-1 md:px-3 rounded-full text-[10px] md:text-xs font-bold border ${getScoreColor(score)}`}>
          {score > 0 ? `${score} Puan` : 'Tamamlandı'}
        </span>
      </td>
      <td className="py-4 text-right pr-4 text-xs text-slate-400">
        <div className="flex items-center justify-end gap-1">
           <Clock size={12} />
           <span className="hidden sm:inline">{time}</span>
           <span className="sm:hidden">{time.replace(' dk önce', 'dk').replace(' saat önce', 'sa')}</span>
        </div>
      </td>
    </tr>
  );
};

export default ActivityRow;