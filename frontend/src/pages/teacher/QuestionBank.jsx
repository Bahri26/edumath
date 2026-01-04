import React, { useEffect, useState, useCallback } from 'react';
import QuestionFormModal from '../../components/exams/QuestionFormModal';
import SmartPasteModal from '../../components/modals/SmartPasteModal'; // AI Yapıştır Modalı
import { 
  Plus, Edit2, Trash2, Search, FileText, Layers, Loader2, 
  ChevronLeft, ChevronRight, CheckCircle, Star, Copy, Download,
  Clock, ImageIcon, Filter, Sparkles, Hash
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// --- Tasarım Odaklı Yardımcı Fonksiyonlar ---
const renderWithLatex = (text) => {
  if (!text) return null;
  const parts = String(text).split(/(\$[^$]+\$)/g);
  return (
    <span className="leading-relaxed">
      {parts.map((part, index) => (
        part.startsWith('$') && part.endsWith('$') 
          ? <span key={index} className="mx-1 text-indigo-600 font-serif bg-indigo-50/50 dark:bg-indigo-900/20 px-1 rounded">
              <InlineMath math={part.slice(1, -1)} />
            </span>
          : <span key={index}>{part}</span>
      ))}
    </span>
  );
};

const QuestionCard = ({ question, expanded, onToggle, onEdit, onDelete }) => {
  const difficultyStyles = {
    'Kolay': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Orta': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
    'Zor': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400',
  };

  return (
    <div className={`group relative bg-white dark:bg-slate-800 rounded-[1.5rem] border transition-all duration-300 ${
      expanded 
        ? 'border-indigo-500 ring-4 ring-indigo-500/10 shadow-xl' 
        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-lg'
    }`}>
      <div className="p-6 cursor-pointer" onClick={onToggle}>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                <Hash size={12} /> {question.classLevel}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${difficultyStyles[question.difficulty] || difficultyStyles['Orta']}`}>
                {question.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                {question.subject}
              </span>
            </div>
            <div className="text-slate-800 dark:text-slate-200 font-medium text-base md:text-lg">
              {renderWithLatex(question.text)}
            </div>
          </div>
          <div className="flex md:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
            <button onClick={() => onEdit(question)} className="p-2.5 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
              <Edit2 size={18} />
            </button>
            <button onClick={() => onDelete(question._id)} className="p-2.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-rose-600 transition-all">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-700 space-y-6 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.options?.map((opt, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border-2 flex items-center gap-4 ${
                question.correctAnswer === (opt.text || opt)
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                  : 'border-slate-100 dark:border-slate-700'
              }`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  question.correctAnswer === (opt.text || opt) ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm font-semibold">{renderWithLatex(opt.text || opt)}</span>
              </div>
            ))}
          </div>
          {question.solution && (
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex items-center gap-2 mb-2 text-indigo-600 font-black text-[10px] uppercase">
                <Sparkles size={14} /> Çözüm & İpucu
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 italic">{renderWithLatex(question.solution)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function QuestionBank() {
  const { showToast } = useToast();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: searchQuery,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== 'Tümü'))
      };
      const res = await apiClient.get('/teacher/questions', { params });
      if (res.data.data) {
        setQuestions(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalQuestions(res.data.total || 0);
      }
    } catch (err) {
      showToast('Veriler senkronize edilemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filters, showToast]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDelete = async (id) => {
    if (window.confirm("Bu soruyu silmek istediğinizden emin misiniz?")) {
      try {
        await apiClient.delete(`/questions/${id}`);
        showToast("Soru başarıyla silindi", "success");
        fetchQuestions();
      } catch (err) {
        showToast("Soru silinemedi", "error");
      }
    }
  };

  return (
    <div className="p-8 space-y-10 pb-32 max-w-7xl mx-auto">
      
      {/* Üst Header: Görseldeki Tasarım */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 px-2">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Soru Bankası
          </h1>
          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
            <span className="text-indigo-600 font-black">#</span> TOPLAM {totalQuestions} ESER BULUNUYOR
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={() => setIsSmartPasteOpen(true)}
            className="px-6 py-4 bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
          >
            <Sparkles size={20} /> Akıllı Yapıştır
          </button>

          <button 
            onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
          >
            <Plus size={24} /> Yeni Soru Ekle
          </button>
        </div>
      </div>

      {/* Filtre Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="lg:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Kazanım, konu veya soru metni ara..."
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/10 font-medium outline-none"
          />
        </div>
        <div className="lg:col-span-7 grid grid-cols-3 gap-3">
          <FilterSelect icon={<Layers size={14}/>} value={filters.subject} onChange={(v) => setFilters({...filters, subject: v})} options={['Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji']} />
          <FilterSelect icon={<Hash size={14}/>} value={filters.classLevel} onChange={(v) => setFilters({...filters, classLevel: v})} options={['Tümü', ...Array.from({length:12}, (_,i)=>`${i+1}. Sınıf`)]} />
          <FilterSelect icon={<Star size={14}/>} value={filters.difficulty} onChange={(v) => setFilters({...filters, difficulty: v})} options={['Tümü', 'Kolay', 'Orta', 'Zor']} />
        </div>
      </div>

      {/* Soru Listesi */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <span className="text-slate-400 font-bold animate-pulse uppercase tracking-widest">Veriler Çekiliyor...</span>
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/30 rounded-[3rem] border border-dashed border-slate-200">
            <FileText size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Aranan kriterlere uygun soru bulunamadı.</p>
          </div>
        ) : (
          questions.map(q => (
            <QuestionCard 
              key={q._id} 
              question={q} 
              expanded={expandedId === q._id}
              onToggle={() => setExpandedId(expandedId === q._id ? null : q._id)}
              onDelete={handleDelete}
              onEdit={(q) => { setEditingQuestion(q); setIsModalOpen(true); }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <PaginationButton onClick={() => setPage(p => p - 1)} disabled={page === 1} icon={<ChevronLeft size={20}/>} />
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest px-4">
            Sayfa <span className="text-indigo-600">{page}</span> / {totalPages}
          </span>
          <PaginationButton onClick={() => setPage(p => p + 1)} disabled={page === totalPages} icon={<ChevronRight size={20}/>} />
        </div>
      )}

      {/* Modallar */}
      {isModalOpen && (
        <QuestionFormModal 
          isOpen={isModalOpen}
          initial={editingQuestion}
          onClose={() => { setIsModalOpen(false); setEditingQuestion(null); }}
          onSaved={() => { fetchQuestions(); setIsModalOpen(false); setEditingQuestion(null); }}
        />
      )}

      {isSmartPasteOpen && (
        <SmartPasteModal 
          isOpen={isSmartPasteOpen}
          onClose={() => setIsSmartPasteOpen(false)}
          onParsed={() => { fetchQuestions(); setIsSmartPasteOpen(false); }}
        />
      )}
    </div>
  );
}

// --- Yardımcı Küçük Bileşenler ---
const FilterSelect = ({ icon, value, onChange, options }) => (
  <div className="relative group">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:scale-110 transition-transform">{icon}</div>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const PaginationButton = ({ onClick, disabled, icon }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className="p-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-20 transition-all shadow-sm active:scale-95"
  >
    {icon}
  </button>
);