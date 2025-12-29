import React from 'react';
import { X, Clock, BookOpen, BarChart2 } from 'lucide-react';

const ExamPreviewModal = ({ exam, onClose }) => {
  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{exam.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><Clock size={14}/> {exam.duration} Dk</span>
              <span className="flex items-center gap-1"><BookOpen size={14}/> {exam.subject || 'Genel'}</span>
              <span className="flex items-center gap-1"><BarChart2 size={14}/> {exam.classLevel}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        {/* Body (Questions) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white dark:bg-slate-900">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((q, index) => (
              <div key={q._id || index} className="group">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">
                      {q.text}
                    </p>
                    {/* Image if exists */}
                    {q.image && (
                      <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 inline-block">
                        <img src={`http://localhost:8000${q.image}`} alt="Soru" className="max-h-60 object-contain" />
                      </div>
                    )}
                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options && q.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-sm">{opt.text || opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {index < exam.questions.length - 1 && <hr className="my-8 border-slate-100 dark:border-slate-800" />}
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-10">Bu sınavda henüz soru bulunmuyor.</div>
          )}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPreviewModal;
