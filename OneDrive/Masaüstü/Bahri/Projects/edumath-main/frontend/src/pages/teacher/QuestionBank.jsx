import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Sparkles, Layers, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import useDebounce from '../../hooks/useDebounce'; 

// --- Ayrıştırılmış Bileşenler ---
import QuestionFormModal from '../../components/exams/QuestionFormModal';
import QuestionCard from '../../components/questions/QuestionCard';
import QuestionSkeleton from '../../components/questions/QuestionSkeleton';
import SmartPasteModal from '../../components/questions/SmartPasteModal';
import PdfUploadModal from './PdfUploadModal';

// --- Sabitler ---
const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe'];
const CLASSES = Array.from({ length: 12 }, (_, i) => `${i + 1}. Sınıf`);

export default function QuestionBank() {
  const { showToast } = useToast();

  // --- State Yönetimi ---
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Modallar
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  // Filtreleme & Arama
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500); // 500ms gecikme ile arama
  const [filters, setFilters] = useState({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü' });

  // Pagination
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ totalPages: 1, totalQuestions: 0 });

  // --- API Veri Çekme ---
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 7,
        search: debouncedSearch, // Debounced değer kullanılıyor
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== 'Tümü')),
      };

      const res = await apiClient.get('/teacher/questions', { params });

      if (res.data.data) {
        setQuestions(res.data.data);
        setStats({
          totalPages: res.data.totalPages || 1,
          totalQuestions: res.data.total || 0,
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Sorular yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, showToast]);

  // Arama veya Filtre değişince sayfayı başa al
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters]);

  // Veri Çekme Tetikleyicisi
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // --- Handler Fonksiyonları ---

  // Optimistic Delete: API cevabını beklemeden arayüzden siler (Hız hissi için)
  const handleDelete = async (id) => {
    if (!window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) return;

    // Önce UI'dan sil
    const previousQuestions = [...questions];
    setQuestions(prev => prev.filter(q => q._id !== id));
    setStats(prev => ({ ...prev, totalQuestions: prev.totalQuestions - 1 }));

    try {
      await apiClient.delete(`/questions/${id}`);
      showToast('Soru silindi', 'success');
    } catch (err) {
      // Hata olursa geri al (Rollback)
      setQuestions(previousQuestions);
      setStats(prev => ({ ...prev, totalQuestions: prev.totalQuestions + 1 }));
      showToast('Silinemedi, işlem geri alındı.', 'error');
    }
  };

  const handleSmartPasteData = (parsedData) => {
    setEditingQuestion(parsedData);
    setIsPasteModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleDuplicate = (question) => {
    setEditingQuestion({ ...question, _id: undefined, text: `${question.text} (Kopya)` });
    setIsFormModalOpen(true);
  };

  return (
    <div className="flex-1 p-6 space-y-6 pb-20 max-w-7xl mx-auto">
      
      {/* --- MODALLAR --- */}
      <QuestionFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingQuestion(null);
          setMainImage({ file: null, preview: '' });
        }}
        onSave={() => { fetchQuestions(); setIsFormModalOpen(false); }}
        manualForm={editingQuestion || {}}
        setManualForm={setEditingQuestion}
        mainImage={mainImage}
        setMainImage={setMainImage}
      />

      <SmartPasteModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onParsed={handleSmartPasteData}
      />

      <PdfUploadModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onQuestionsReady={(newQuestions) => {
          setQuestions(prev => [...newQuestions, ...prev]);
          showToast(`${newQuestions.length} soru eklendi!`, 'success');
        }}
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-6 pb-6 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex-1 w-full">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
            <Layers className="text-indigo-600" /> Soru Bankası
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-bold">
              {stats.totalQuestions} Soru
            </span>
            <span>Müfredat uyumlu soru havuzu</span>
          </div>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <button
            onClick={() => { setEditingQuestion(null); setIsFormModalOpen(true); }}
            className="flex-1 flex justify-center gap-2 items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus size={18} /> Yeni Soru
          </button>
          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="flex-1 flex justify-center gap-2 items-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Sparkles size={18} /> Akıllı Yapıştır
          </button>
          <button
            onClick={() => setPdfModalOpen(true)}
            className="btn-secondary flex-1 flex justify-center gap-2 items-center"
          >
            PDF'ten Soru Yükle
          </button>
        </div>
      </div>

      {/* --- FİLTRELER --- */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Soru metni içinde ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="md:col-span-2">
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.subject}
            onChange={e => setFilters({ ...filters, subject: e.target.value })}
          >
            <option value="Tümü">Ders Seçin</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.classLevel}
            onChange={e => setFilters({ ...filters, classLevel: e.target.value })}
          >
            <option value="Tümü">Sınıf</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={filters.difficulty}
            onChange={e => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="Tümü">Zorluk Seviyesi</option>
            <option>Kolay</option>
            <option>Orta</option>
            <option>Zor</option>
          </select>
        </div>
      </div>

      {/* --- SORU LİSTESİ --- */}
      <div className="space-y-4 min-h-[400px]">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <QuestionSkeleton key={i} />)
        ) : questions.length > 0 ? (
          questions.map(q => (
            <QuestionCard
              key={q._id}
              question={q}
              expanded={expandedId === q._id}
              onToggle={() => setExpandedId(expandedId === q._id ? null : q._id)}
              onEdit={() => { setEditingQuestion(q); setIsFormModalOpen(true); }}
              onDelete={handleDelete}
              onFavorite={id => setQuestions(questions.map(q2 => q2._id === id ? { ...q2, isFavorite: !q2.isFavorite } : q2))}
              onDuplicate={handleDuplicate}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText size={64} strokeWidth={1} className="mb-4 text-slate-300 dark:text-slate-700" />
            <p className="text-lg font-medium">Bu kriterlere uygun soru bulunamadı.</p>
          </div>
        )}
      </div>

      {/* --- SAYFALAMA --- */}
      {!loading && stats.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-8 pb-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="p-3 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} className="text-indigo-600 dark:text-indigo-400" />
          </button>

          <span className="font-bold text-slate-600 dark:text-slate-300">
            Sayfa {page} / {stats.totalPages}
          </span>

          <button
            disabled={page === stats.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-3 bg-white dark:bg-slate-800 border-2 border-indigo-500 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} className="text-indigo-600 dark:text-indigo-400" />
          </button>
        </div>
      )}
    </div>
  );
}