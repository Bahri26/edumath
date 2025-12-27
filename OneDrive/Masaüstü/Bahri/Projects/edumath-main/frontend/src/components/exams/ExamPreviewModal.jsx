import React from 'react';
import { X, Clock, BookOpen, BarChart2, CheckCircle, AlertCircle } from 'lucide-react';

const ExamPreviewModal = ({ exam, onClose }) => {
  if (!exam) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* --- 1. ÜST BİLGİ PANELI (HEADER) --- */}
        <div className="bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                Önizleme Modu
              </span>
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                <Clock size={12} /> Süre İşlemiyor
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">
              {exam.title || 'İsimsiz Sınav'}
            </h2>
            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <BookOpen size={16} className="text-indigo-500" />
                <span className="font-medium">{exam.subject || 'Genel'}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-1.5">
                <BarChart2 size={16} className="text-indigo-500" />
                <span>{exam.classLevel ? `${exam.classLevel}. Sınıf` : 'Seviye Belirsiz'}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-indigo-500" />
                <span>Süre: {exam.duration || 40} dk</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- 2. SORU İÇERİĞİ (SCROLLABLE BODY) --- */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-900/50">
          {exam.questions && exam.questions.length > 0 ? (
            exam.questions.map((q, index) => (
              <div 
                key={q._id || index} 
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 relative group hover:shadow-md transition-shadow"
              >
                {/* Soru Numarası ve Zorluk */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soru</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    q.difficulty === 'Zor' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                    q.difficulty === 'Orta' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    {q.difficulty || 'Orta'}
                  </span>
                </div>

                {/* Soru Metni */}
                <div className="text-lg text-slate-800 dark:text-slate-200 font-medium leading-relaxed mb-6 pl-1">
                  {q.text}
                </div>

                {/* Şıklar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options && q.options.map((opt, optIndex) => {
                    // Şık harfi (A, B, C, D)
                    const letter = String.fromCharCode(65 + optIndex);
                    // Doğru cevap kontrolü (Metin eşleşmesi veya şık harfi kontrolü)
                    const isCorrect = q.correctAnswer && (
                        (typeof opt === 'object' ? opt.text : opt) === q.correctAnswer ||
                        (typeof opt === 'object' ? opt.text : opt)?.startsWith?.(q.correctAnswer) || // "A) 5" formatı için
                        letter === q.correctAnswer // Sadece "A" formatı için
                      );

                    return (
                      <div 
                        key={optIndex}
                        className={`relative flex items-center p-3.5 rounded-xl border-2 transition-all ${
                          isCorrect 
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm' // Doğru cevap stili
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500' // Normal şık stili
                        }`}
                      >
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm mr-3 ${
                          isCorrect 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                        }`}>
                          {letter}
                        </div>
                        <span className={`text-sm font-medium ${isCorrect ? 'text-emerald-900' : 'text-slate-600 dark:text-slate-300'}`}>
                          {typeof opt === 'object' ? opt.text : opt}
                        </span>
                        
                        {/* Doğru Cevap İkonu */}
                        {isCorrect && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                            <CheckCircle size={20} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle size={48} className="mb-4 opacity-50" />
              <p>Bu sınavda henüz soru bulunmuyor.</p>
            </div>
          )}
        </div>

        {/* --- 3. FOOTER --- */}
        <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 z-10">
            <div className="flex-1 flex items-center text-xs text-slate-400 px-2">
                * Yeşil işaretli şıklar doğru cevapları göstermektedir. Öğrenciler bu işaretleri görmez.
            </div>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-all shadow-lg shadow-slate-300 dark:shadow-none"
            >
              Kapat
            </button>
        </div>

      </div>
    </div>
  );
};

export default ExamPreviewModal;