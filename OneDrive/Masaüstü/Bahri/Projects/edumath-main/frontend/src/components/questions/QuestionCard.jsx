import React from 'react';
import { 
  Edit2, Trash2, Star, Clock, FileText, CheckCircle, 
  ChevronDown, ChevronUp, Lightbulb, Share2, Copy 
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// Yardımcı Fonksiyon: LaTeX ve Metni ayırma
const renderWithLatex = (text) => {
  if (!text) return null;
  const stringText = String(text);
  const parts = stringText.split(/(\$[^$]+\$)/g);
  return (
    <span className="leading-relaxed text-slate-700 dark:text-slate-300">
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const pureMath = part.slice(1, -1);
          // Matematik ifadelerini biraz daha büyük ve belirgin yapıyoruz
          return (
            <span key={index} className="text-indigo-600 dark:text-indigo-400 font-serif px-1 text-lg">
              <InlineMath math={pureMath} />
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

// Zorluk Seviyesi Göstergesi (Modern Çubuklar)
const DifficultyIndicator = ({ level }) => {
  const colors = {
    'Kolay': 'bg-emerald-400',
    'Orta': 'bg-amber-400',
    'Zor': 'bg-rose-500'
  };
  
  return (
    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
      <div className="flex gap-0.5 items-end h-3">
        <div className={`w-1 rounded-sm ${colors[level] || 'bg-slate-300'} h-1.5`}></div>
        <div className={`w-1 rounded-sm ${level !== 'Kolay' ? colors[level] : 'bg-slate-200 dark:bg-slate-600'} h-2`}></div>
        <div className={`w-1 rounded-sm ${level === 'Zor' ? colors[level] : 'bg-slate-200 dark:bg-slate-600'} h-3`}></div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{level}</span>
    </div>
  );
};

const QuestionCard = ({ question, expanded, onToggle, onEdit, onDelete, onFavorite, onDuplicate }) => {
  const createdDate = question.createdAt 
    ? new Date(question.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
    : 'Tarih yok';

  return (
    <div className={`group relative bg-white dark:bg-slate-800 rounded-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700/50 overflow-hidden ${
      expanded 
        ? 'shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50' 
        : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
    }`}>
      
      {/* Sol Kenar Çizgisi (Ders Rengi) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${
        expanded ? 'bg-indigo-500' : 'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
      }`}></div>

      {/* --- Üst Kısım (Header) --- */}
      <div className="p-5 pl-7 cursor-pointer" onClick={onToggle}>
        <div className="flex justify-between items-start gap-4">
          
          <div className="flex-1 space-y-4">
            {/* Etiketler */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                {question.subject}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                {question.classLevel}
              </span>
              <DifficultyIndicator level={question.difficulty} />
            </div>

            {/* Soru Metni */}
            <div className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-8">
              {renderWithLatex(question.text)}
            </div>

            {/* Alt Bilgi */}
            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium pt-1">
              <span className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                <Clock size={14} /> {createdDate}
              </span>
              <span className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors">
                <FileText size={14} /> {question.type === 'multiple-choice' ? 'Çoktan Seçmeli' : 'Klasik'}
              </span>
            </div>
          </div>

          {/* Aksiyon Butonları (Sağ Üst) */}
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
             <button onClick={() => onFavorite(question._id)} className="p-2 hover:bg-yellow-50 text-slate-400 hover:text-yellow-500 rounded-lg transition-colors">
                <Star size={18} className={question.isFavorite ? "fill-yellow-400 text-yellow-400" : ""} />
             </button>
             <button onClick={() => onEdit(question)} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 rounded-lg transition-colors">
                <Edit2 size={18} />
             </button>
             <button onClick={() => onDelete(question._id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors">
                <Trash2 size={18} />
             </button>
          </div>
        </div>
        
        {/* Genişlet/Daralt İkonu */}
        <div className="flex justify-center mt-2 -mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
           {expanded ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* --- Genişletilmiş Alan (Detaylar) --- */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30 p-6 animate-in slide-in-from-top-2 duration-200">
          
          {/* Görsel Varsa */}
          {question.image && (
            <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm max-w-lg mx-auto">
              <img src={`http://localhost:8000${question.image}`} alt="Soru görseli" className="w-full h-auto" />
            </div>
          )}

          {/* Şıklar */}
          {question.type === 'multiple-choice' && (
            <div className="space-y-3 mb-6">
              {question.options.map((opt, idx) => {
                const isCorrect = question.correctAnswer === (opt.text || opt);
                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                      isCorrect 
                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 shadow-sm' 
                        : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                      isCorrect 
                        ? 'bg-emerald-500 text-white ring-2 ring-emerald-200 dark:ring-emerald-900' 
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className={`flex-1 text-base ${isCorrect ? 'font-semibold text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                      {renderWithLatex(opt.text || opt)}
                    </div>
                    {isCorrect && <CheckCircle className="text-emerald-500" size={20} />}
                  </div>
                )
              })}
            </div>
          )}

          {/* Çözüm Kartı */}
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Lightbulb size={100} className="text-amber-500" />
             </div>
             <h4 className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 mb-3 text-sm uppercase tracking-wide">
                <Lightbulb size={18} className="fill-amber-400 text-amber-600" />
                Çözüm Açıklaması
             </h4>
             <div className="relative z-10 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
                {renderWithLatex(question.solution)}
             </div>
          </div>

          {/* Alt Aksiyonlar */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
             <button onClick={() => onDuplicate(question)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <Copy size={16} /> Kopyala
             </button>
             <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors">
                <Share2 size={16} /> Paylaş
             </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default QuestionCard;
