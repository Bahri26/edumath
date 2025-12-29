import React from 'react';
import { Clock, FileText, Trash2, Play, AlertTriangle } from 'lucide-react';

const ExamCard = ({ exam, role, onStart, onDelete }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
          <FileText size={24} />
        </div>
        {role === 'teacher' && (
          <button 
            onClick={() => onDelete(exam._id)} 
            className="text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Sınavı Sil"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{exam.title}</h3>
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
        <span className="flex items-center gap-1">
          <Clock size={14}/> {exam.duration} Dk
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle size={14}/> {exam.questions.length} Soru
        </span>
      </div>
      {role === 'student' ? (
        <button onClick={() => onStart(exam)} className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 flex items-center justify-center gap-2">
          <Play size={18} /> Başla
        </button>
      ) : (
        <div className="w-full bg-slate-100 dark:bg-slate-700 text-slate-500 py-2.5 rounded-xl text-center text-sm font-medium">
          {exam.results.length} Katılım
        </div>
      )}
    </div>
  );
};

export default ExamCard;
