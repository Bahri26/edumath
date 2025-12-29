import React, { useEffect, useState, useCallback } from 'react';
import classData from '../../data/classLevelsAndDifficulties.json';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Layers, Loader2, 
  ChevronLeft, ChevronRight, Star, Copy, Clock, ImageIcon, 
  Sparkles, ClipboardList, CheckCircle
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

// Modallar (Dosya yollarını projenize göre kontrol edin)
import QuestionFormModal from '../../components/exams/QuestionFormModal';
import AIGenerateModal from '../../components/modals/AIGenerateModal';
import SmartPasteModal from '../../components/modals/SmartPasteModal';

// --- Utility Functions ---
const renderWithLatex = (text) => {
  if (!text) return null;
  const stringText = String(text);
  const parts = stringText.split(/(\$[^$]+\$)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const pureMath = part.slice(1, -1);
          return <span key={index} className="text-indigo-600 font-serif font-bold mx-1"><InlineMath math={pureMath} /></span>;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

const getImgUrl = (path) => path ? `http://localhost:8000${path}` : null;

// --- Question Card Component ---
const QuestionCard = ({ question, expanded, onToggle, onEdit, onDelete, onFavorite, onDuplicate }) => {
  const difficultyColors = {};
  classData.difficulties.forEach(d => {
    difficultyColors[d.key] = `bg-${d.color}-50 text-${d.color}-600 border-${d.color}-200 dark:bg-${d.color}-900/20 dark:text-${d.color}-400`;
  });

  const createdDate = question.createdAt 
    ? new Date(question.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
    : 'Tarih yok';

  return (
    <div className={`group bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 ${
      expanded 
        ? 'border-indigo-500 shadow-xl ring-1 ring-indigo-500/20' 
        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:shadow-lg'
    }`}>
      
      {/* Header */}
      <div 
        className="p-5 cursor-pointer relative"
        onClick={onToggle}
      >
        <div className="flex gap-4">
          {/* Sol: İkon veya Resim */}
          <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 items-center justify-center text-slate-400 font-bold">
             {question.image ? <ImageIcon size={20} /> : 'Q'}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                {question.subject}
              </span>
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300">
                {question.classLevel}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${difficultyColors[question.difficulty] || 'bg-slate-100'}`}>
                {question.difficulty}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-2 pr-8">
              {renderWithLatex(question.text)}
            </h3>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Clock size={12} /> {createdDate}</span>
            </div>
          </div>

          {/* Actions (Hover'da görünür, mobilde hep görünür) */}
          <div className="absolute top-4 right-4 flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
             <button onClick={() => onFavorite(question._id)} className="p-1.5 hover:bg-yellow-50 text-slate-300 hover:text-yellow-500 rounded-lg transition-colors">
                <Star size={18} className={question.isFavorite ? 'fill-yellow-500 text-yellow-500' : ''} />
             </button>
             <button onClick={() => onEdit(question)} className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                <Edit2 size={16} />
             </button>
             <button onClick={() => onDelete(question._id)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                <Trash2 size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
            
            {question.image && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <img src={getImgUrl(question.image)} alt="Soru görseli" className="max-h-60 w-auto mx-auto object-contain" />
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Seçenekler</p>
              {question.type === 'multiple-choice' && question.options ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((opt, idx) => {
                    const isCorrect = question.correctAnswer === (opt.text || opt);
                    return (
                      <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                        isCorrect 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' 
                          : 'bg-white border-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                      }`}>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                           isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                           {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{renderWithLatex(opt.text || opt)}</span>
                        {isCorrect && <CheckCircle size={16} />}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-300">
                   {question.correctAnswer}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
               <button 
                  onClick={() => onDuplicate(question)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
               >
                  <Copy size={14} /> Kopyala
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Page ---
export default function QuestionBank() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // States
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });

  // --- Handlers ---

  // 1. Soruları Çek
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 7,
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
      showToast('Sorular yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filters, showToast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 2. AI veya Smart Paste ile Gelen Soruları İşle
  const handleBulkQuestions = async (newQuestions) => {
    try {
      await apiClient.post('/teacher/questions/bulk', { questions: newQuestions });
      showToast(`${newQuestions.length} soru başarıyla eklendi!`, 'success');
      
      // Otomatik olarak sınav oluşturma sayfasına yönlendir (İsteğe bağlı)
      setTimeout(() => navigate('/teacher/exams'), 1000);
      
    } catch (error) {
      showToast('Sorular kaydedilirken hata oluştu.', 'error');
    }
  };

  // 3. Smart Paste Tek Soru Dönüşümü
  const handleSmartPasteConvert = (parsedData) => {
     setEditingQuestion(parsedData); // Formu bu veriyle doldur
     setIsFormModalOpen(true); // Form modalını aç
  };

  // 4. CRUD İşlemleri
  const handleDelete = async (id) => {
    if (!window.confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/questions/${id}`);
      showToast('Soru silindi', 'success');
      fetchQuestions();
    } catch (err) { showToast('Silinemedi', 'error'); }
  };

  const handleSave = () => {
    fetchQuestions();
    setIsFormModalOpen(false);
    setEditingQuestion(null);
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 pb-24 min-h-screen bg-slate-50/50 dark:bg-slate-900/50">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-6 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 tracking-tight flex items-center gap-3">
            <Layers className="text-indigo-600" size={32} /> Soru Bankası
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
            Tüm sorularınızı tek bir yerden yönetin, düzenleyin veya yapay zeka ile yenilerini oluşturun.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          {/* Yeni Soru */}
          <button 
            onClick={() => {setEditingQuestion(null); setIsFormModalOpen(true);}}
            className="flex-1 xl:flex-none px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={18} /> Yeni Ekle
          </button>

          {/* AI ile Üret */}
          <button 
            onClick={() => setIsAIModalOpen(true)}
            className="flex-1 xl:flex-none px-5 py-3 bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 hover:border-purple-500 dark:hover:border-purple-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 group"
          >
            <Sparkles size={18} className="group-hover:animate-pulse" /> AI Üret
          </button>

          {/* Metinden Yapıştır */}
          <button 
            onClick={() => setIsSmartPasteOpen(true)}
            className="flex-1 xl:flex-none px-5 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
          >
            <ClipboardList size={18} /> Metinden Al
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-2">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
               type="text" 
               placeholder="Soru metni veya konu ara..." 
               value={searchQuery}
               onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
               className="w-full pl-12 pr-4 py-3 bg-transparent outline-none text-slate-700 dark:text-white font-medium placeholder-slate-400"
            />
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 px-2 md:px-0">
            {['subject', 'classLevel', 'difficulty'].map(filterKey => (
               <select 
                  key={filterKey}
                  value={filters[filterKey]}
                  onChange={(e) => {setFilters({...filters, [filterKey]: e.target.value}); setPage(1);}}
                  className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm font-bold cursor-pointer min-w-[140px]"
               >
                  <option value="Tümü">Tüm {filterKey === 'subject' ? 'Dersler' : filterKey === 'classLevel' ? 'Sınıflar' : 'Zorluklar'}</option>
                  {filterKey === 'subject' && ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe'].map(o => <option key={o}>{o}</option>)}
                  {filterKey === 'classLevel' && classData.classLevels.map(level => <option key={level} value={level}>{level}</option>)}
                  {filterKey === 'difficulty' && classData.difficulties.map(o => <option key={o.key}>{o.label}</option>)}
               </select>
            ))}
         </div>
      </div>

      {/* QUESTIONS LIST */}
      <div className="space-y-4">
         {loading ? (
            <div className="py-20 text-center text-slate-400">
               <Loader2 className="animate-spin mx-auto mb-4 text-indigo-500" size={40} />
               <p className="font-medium">Sorularınız yükleniyor...</p>
            </div>
         ) : questions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl">
               <Layers className="mx-auto mb-4 text-slate-300" size={64} />
               <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">Henüz Soru Yok</h3>
               <p className="text-slate-500 max-w-sm mx-auto mt-2">Yeni bir soru ekleyin veya yapay zeka ile otomatik soru ürettirin.</p>
            </div>
         ) : (
            questions.map(q => (
               <QuestionCard 
                  key={q._id} 
                  question={q} 
                  expanded={expandedId === q._id}
                  onToggle={() => setExpandedId(expandedId === q._id ? null : q._id)}
                  onEdit={(item) => {setEditingQuestion(item); setIsFormModalOpen(true);}}
                  onDelete={handleDelete}
                  onFavorite={(id) => {/* Favori işlemleri */}}
                  onDuplicate={(item) => {setEditingQuestion({...item, _id: undefined}); setIsFormModalOpen(true);}}
               />
            ))
         )}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
         <div className="flex justify-center items-center gap-4 pt-4">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 disabled:opacity-50 transition-colors">
               <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-slate-600 dark:text-slate-300">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 disabled:opacity-50 transition-colors">
               <ChevronRight size={20} />
            </button>
         </div>
      )}

      {/* --- MODALLAR --- */}
      
      {/* 1. Manuel Soru Ekleme/Düzenleme */}
      <QuestionFormModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSave}
        editingId={editingQuestion?._id}
        manualForm={editingQuestion || {}}
        setManualForm={setEditingQuestion}
        mainImage={mainImage}
        setMainImage={setMainImage}
      />

      {/* 2. AI ile Soru Üretme */}
      <AIGenerateModal 
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onAddQuestions={handleBulkQuestions}
        classLevel={filters.classLevel !== 'Tümü' ? filters.classLevel : '9. Sınıf'}
      />

      {/* 3. Metinden Akıllı Yapıştırma */}
      <SmartPasteModal 
        isOpen={isSmartPasteOpen}
        onClose={() => setIsSmartPasteOpen(false)}
        onConvert={handleSmartPasteConvert}
      />

    </div>
  );
}