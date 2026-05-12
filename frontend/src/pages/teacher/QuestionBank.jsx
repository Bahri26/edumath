import React, { useEffect, useState, useCallback, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuestionFormModal from '../../components/exams/QuestionFormModal';
import SmartPasteModal from '../../components/modals/SmartPasteModal'; // AI Yapıştır Modalı
import {
  Plus, Edit2, Trash2, Search, FileText, Layers,
  ChevronLeft, ChevronRight, Star,
  Sparkles, Hash,
  LayoutGrid,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { renderWithLatex } from '../../utils/latex.jsx';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import SolutionDisplay from '../../components/questions/SolutionDisplay.jsx';
import CollapsiblePanel from '../../components/ui/CollapsiblePanel.jsx';
import QuestionTextWithPattern from '../../components/questions/QuestionTextWithPattern.jsx';
import {
  PATTERN_TOPIC_ORDER,
  PATTERN_TOPIC_ALL_UNDER,
  sortPatternTopicsUi,
} from '../../constants/patternTopicsUi';

const MATH_TOPIC_OPTIONS_FALLBACK = [
  'Tümü',
  PATTERN_TOPIC_ALL_UNDER,
  ...PATTERN_TOPIC_ORDER,
];

const extractTopicAndCode = (question) => {
  const rawTopic = String(question?.topic || '').trim();
  const metaCode = String(question?.assessmentMeta?.code || '').trim();
  if (metaCode) {
    return { topicLabel: rawTopic || 'Örüntüler', code: metaCode };
  }

  // Backward compatibility: topic like "Örüntüler — P-A1"
  if (/^Örüntüler\s+—\s+P-[A-Z]\d$/iu.test(rawTopic)) {
    const [left, right] = rawTopic.split('—').map((p) => p.trim());
    return { topicLabel: left || 'Örüntüler', code: right || '' };
  }

  return { topicLabel: rawTopic, code: '' };
};

const getHintText = (question) => String(question?.assessmentMeta?.hint || '').trim();
const getCodeText = (question) => String(question?.assessmentMeta?.code || '').trim();

const QuestionCard = ({ question, expanded, onToggle, onEdit, onDelete }) => {
  const difficultyStyles = {
    'Kolay': 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400',
    'Orta': 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400',
    'Zor': 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400',
  };

  const { topicLabel, code: topicCode } = extractTopicAndCode(question);
  const hintText = getHintText(question);
  const codeText = getCodeText(question);

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
              {topicLabel && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/40">
                  {topicLabel}
                </span>
              )}
              {topicCode && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-100 dark:border-fuchsia-800/40">
                  {topicCode}
                </span>
              )}
            </div>
            <QuestionTextWithPattern text={question.text} />
          </div>
          <div className="flex md:flex-col gap-2 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
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
          <QuestionVisual src={question.image} alt="" className="w-full" />
          {question.learningOutcome && (
            <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              <span className="font-black uppercase tracking-wider text-[9px] text-slate-400">Kazanım</span>
              {' '}{question.learningOutcome}
            </div>
          )}
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
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-semibold flex-1">{renderWithLatex(opt.text || opt)}</span>
                </div>
              </div>
            ))}
          </div>

          {(hintText || codeText) && (
            <CollapsiblePanel title="İpucu" className="bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40">
              {codeText && (
                <div className="mb-2 text-[11px] font-black uppercase tracking-widest text-amber-700/80 dark:text-amber-200/80">
                  Kod: <span className="text-amber-900 dark:text-amber-100">{codeText}</span>
                </div>
              )}
              {hintText ? (
                <div className="text-sm text-amber-900 dark:text-amber-100">{renderWithLatex(hintText)}</div>
              ) : (
                <div className="text-sm text-amber-800/80 dark:text-amber-200/80">İpucu eklenmemiş.</div>
              )}
            </CollapsiblePanel>
          )}

          <CollapsiblePanel title="Adım adım çözüm" defaultOpen={false} className="bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800/50">
            {question.solution ? (
              <SolutionDisplay text={question.solution} className="italic" />
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-300">Çözüm eklenmemiş.</div>
            )}
          </CollapsiblePanel>
        </div>
      )}
    </div>
  );
};

export default function QuestionBank() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ branch: '', branchApproval: 'none' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [manualForm, setManualForm] = useState(null);
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü', topic: 'Tümü' });
  const [topics, setTopics] = useState([]);
    // Load teacher profile for branch/approval
    useEffect(() => {
      let active = true;
      (async () => {
        try {
          const res = await apiClient.get('/users/profile');
          const branch = res.data?.branch || '';
          const branchApproval = res.data?.branchApproval || 'none';
          if (!active) {
            return;
          }
          setProfile({ branch, branchApproval });
          if (branch && branchApproval === 'approved') {
            setFilters(f => ({ ...f, subject: branch }));
          }
        } catch {
          /* profil yüklemede sorun sessiz geçilir */
        }
        finally {
          if (active) {
            setProfileLoaded(true);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, []);
    // Auto-refresh profile while pending approval (without referencing fetchQuestions before init)
    useEffect(() => {
      let timer;
      if (profile.branch && profile.branchApproval === 'pending') {
        const tick = async () => {
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
          try {
            const res = await apiClient.get('/users/profile');
            const branch = res.data?.branch || '';
            const branchApproval = res.data?.branchApproval || 'none';
            if (branchApproval === 'approved') {
              setProfile({ branch, branchApproval });
              setFilters(f => ({ ...f, subject: branch }));
              showToast('Branş onaylandı! İçerikleriniz yükleniyor…', 'success');
              setPage(1);
              clearInterval(timer);
            }
          } catch {
            /* periyot içi profil yenileme hatası göz ardı edilir */
          }
        };
        timer = setInterval(tick, 8000);
      }
      return () => { if (timer) clearInterval(timer); };
    }, [profile.branch, profile.branchApproval, showToast]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Debounce search input to reduce fetch frequency
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1);
  }, [filters]);

  // URL'den ilk değerleri al
  useEffect(() => {
    const s = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || 'Tümü';
    const classLevel = searchParams.get('classLevel') || 'Tümü';
    const difficulty = searchParams.get('difficulty') || 'Tümü';
    const topic = searchParams.get('topic') || 'Tümü';
    const p = parseInt(searchParams.get('page') || '1');
    setSearchQuery(s);
    setFilters({ subject, classLevel, difficulty, topic });
    setPage(Number.isNaN(p) ? 1 : p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Durumu URL'e yaz
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    Object.entries(filters).forEach(([k, v]) => { if (v !== 'Tümü') params[k] = v; });
    if (page !== 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters, page, setSearchParams]);

  // (aiFilterDefaults removed along with AI generate modal)

  const fetchQuestions = useCallback(async () => {
    if (!profileLoaded) {
      return;
    }

    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search: debouncedSearch,
        sortBy: 'topic',
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== 'Tümü')),
      };
      // If branch approved, use subject-wide endpoint (ignores external subject filter and uses teacher branch)
      let res;
      const shouldUseSubjectEndpoint = (profile.branch && profile.branchApproval === 'approved') || (filters.subject && filters.subject !== 'Tümü');
      if (shouldUseSubjectEndpoint) {
        const rest = { ...params };
        delete rest.subject;
        const subjectParam = profile.branch && profile.branchApproval === 'approved' ? profile.branch : filters.subject;
        try {
          res = await apiClient.get('/teacher/subject/questions', { params: rest });
        } catch {
          res = await apiClient.get('/questions', { params: { ...rest, subject: subjectParam } });
        }
      } else {
        res = await apiClient.get('/teacher/questions', { params });
      }
      if (res.data.data) {
        setQuestions(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotalQuestions(res.data.total || 0);
      }
    } catch {
      showToast('Veriler senkronize edilemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, profile, profileLoaded, showToast]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // Branş onaylıysa konu listesini yükle
  useEffect(() => {
    (async () => {
      if (profile.branch && profile.branchApproval === 'approved') {
        try {
          const params = {};
          if (filters.classLevel && filters.classLevel !== 'Tümü') {
            params.classLevel = filters.classLevel;
          }
          const res = await apiClient.get('/teacher/subject/topics', { params });
          const prioritized = sortPatternTopicsUi(res.data?.topics || []);
          setTopics(prioritized);
          const allowedTopics = new Set(['Tümü', PATTERN_TOPIC_ALL_UNDER, 'Örüntüler', ...prioritized]);
          if (!allowedTopics.has(filters.topic)) {
            setFilters(f => ({ ...f, topic: 'Tümü' }));
          }
        } catch {
          /* konu listesi alınamadı; filtre yine de çalışır */
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.branch, profile.branchApproval, filters.classLevel]);

  const handleDelete = async (id) => {
    if (window.confirm("Bu soruyu silmek istediğinizden emin misiniz?")) {
      const prev = questions;
      // Optimistic removal
      setQuestions(prev.filter(q => q._id !== id));
      setTotalQuestions(t => (t > 0 ? t - 1 : 0));
      try {
        await apiClient.delete(`/questions/${id}`);
        showToast("Soru başarıyla silindi", "success");
      } catch {
        setQuestions(prev);
        setTotalQuestions(t => t + 1);
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
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Matematik soruları örüntü alt konularına göre gruplanır (şekil dizileri, sabit adımlı sayı örüntüsü,
            kare/üçgensel sayılar vb.); kazanım metinleri MEB matematik programındaki örüntü çerçevesiyle uyumludur.
          </p>
          <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">
            <span className="text-indigo-600 font-black">#</span> TOPLAM {totalQuestions} SORU
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsSmartPasteOpen(true)}
            disabled={profile.branchApproval !== 'approved'}
            title={profile.branchApproval !== 'approved' ? 'Branş onayından sonra kullanılabilir' : ''}
            className="px-6 py-4 rounded-2xl border-2 border-indigo-600 text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={20} /> Akıllı Yapıştır
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={profile.branchApproval !== 'approved'}
            title={profile.branchApproval !== 'approved' ? 'Branş onayından sonra kullanılabilir' : ''}
            onClick={() => {
              setEditingQuestion(null);
              const subj =
                profile.branchApproval === 'approved' && profile.branch
                  ? profile.branch
                  : filters.subject !== 'Tümü'
                    ? filters.subject
                    : 'Matematik';
              const isMath =
                subj === 'Matematik' ||
                (profile.branchApproval === 'approved' && profile.branch === 'Matematik');
              setManualForm(
                isMath
                  ? {
                      text: '',
                      subject: subj,
                      topic: PATTERN_TOPIC_ORDER[0],
                      learningOutcome: '',
                      classLevel: '2. Sınıf',
                      difficulty: 'Kolay',
                      correctAnswer: '',
                      solution: '',
                      options: ['', '', '', '', ''],
                    }
                  : null
              );
              setMainImage({ file: null, preview: '' });
              setIsModalOpen(true);
            }}
            className="px-8 py-4 rounded-2xl"
          >
            <Plus size={24} /> Yeni Soru Ekle
          </Button>
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
        <div className="lg:col-span-7 grid grid-cols-4 gap-3">
          <FilterSelect 
            icon={<Layers size={14}/>} 
            value={profile.branch && profile.branchApproval === 'approved' ? profile.branch : filters.subject}
            onChange={(v) => setFilters({...filters, subject: v})}
            options={profile.branch && profile.branchApproval === 'approved' ? [profile.branch] : ['Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji']}
            disabled={profile.branchApproval === 'approved'}
          />
          <FilterSelect
            icon={<Layers size={14} />}
            value={filters.topic}
            onChange={(v) => { setFilters({ ...filters, topic: v }); setPage(1); }}
            options={
              filters.subject === 'Matematik' || (profile.branchApproval === 'approved' && profile.branch === 'Matematik')
                ? (topics.length > 0
                    ? ['Tümü', PATTERN_TOPIC_ALL_UNDER, ...sortPatternTopicsUi(topics)]
                    : MATH_TOPIC_OPTIONS_FALLBACK)
                : ['Tümü', ...sortPatternTopicsUi(topics)]
            }
          />
          <FilterSelect icon={<Hash size={14}/>} value={filters.classLevel} onChange={(v) => setFilters({...filters, classLevel: v})} options={['Tümü', ...Array.from({length:12}, (_,i)=>`${i+1}. Sınıf`)]} />
          <FilterSelect icon={<Star size={14}/>} value={filters.difficulty} onChange={(v) => setFilters({...filters, difficulty: v})} options={['Tümü', 'Kolay', 'Orta', 'Zor']} />
        </div>
      </div>

      {(filters.subject === 'Matematik' || (profile.branchApproval === 'approved' && profile.branch === 'Matematik')) && (
        <div className="flex flex-wrap items-center gap-2 px-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hızlı filtre</span>
          <button
            type="button"
            onClick={() => { setFilters((f) => ({ ...f, topic: 'Örüntüler' })); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filters.topic === 'Örüntüler' || filters.topic === PATTERN_TOPIC_ALL_UNDER
                ? 'border-indigo-600 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200'
                : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300'
            }`}
          >
            Yalnız örüntü
          </button>
          <button
            type="button"
            onClick={() => { setFilters((f) => ({ ...f, topic: 'Tümü' })); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              filters.topic === 'Tümü'
                ? 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:bg-slate-800 dark:border-slate-600'
            }`}
          >
            Tüm alt konular
          </button>
        </div>
      )}

      {/* Approval gate */}
      {profile.branchApproval !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mb-4">
          Branş onayı bekleniyor. Onaylanınca branşınızdaki tüm sorulara erişebileceksiniz.
        </div>
      )}

      {/* Soru Listesi */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/30 rounded-[3rem] border border-dashed border-slate-200">
            <FileText size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">Aranan kriterlere uygun soru bulunamadı.</p>
          </div>
        ) : (
          questions.map((q, idx) => {
            const topicLine = q.topic || 'Konu belirtilmemiş';
            const showTopicHeading = ['Tümü', PATTERN_TOPIC_ALL_UNDER, 'Örüntüler'].includes(filters.topic)
              && (idx === 0 || (questions[idx - 1].topic || 'Konu belirtilmemiş') !== topicLine);
            return (
              <Fragment key={q._id}>
                {showTopicHeading && (
                  <div className={`flex items-center gap-3 px-2 ${idx === 0 ? '' : 'mt-8 pt-2 border-t border-slate-100 dark:border-slate-800'}`}>
                    <LayoutGrid size={16} className="text-violet-500 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-violet-700 dark:text-violet-300">
                      {topicLine}
                    </span>
                  </div>
                )}
                <QuestionCard
                  question={q}
                  expanded={expandedId === q._id}
                  onToggle={() => setExpandedId(expandedId === q._id ? null : q._id)}
                  onDelete={handleDelete}
                  onEdit={(question) => {
                    setEditingQuestion(question);
                    const opts = (question.options || []).map((o) => (typeof o === 'string' ? o : (o?.text ?? '')));
                    const padded = [...opts, '', '', '', '', ''].slice(0, 5);
                    const subj =
                      profile.branchApproval === 'approved' && profile.branch
                        ? profile.branch
                        : (question.subject || 'Matematik');
                    setManualForm({
                      text: question.text || '',
                      subject: subj,
                      topic: question.topic || '',
                      learningOutcome: question.learningOutcome || '',
                      classLevel: question.classLevel || '9. Sınıf',
                      difficulty: question.difficulty || 'Orta',
                      correctAnswer: typeof question.correctAnswer === 'string' ? question.correctAnswer : String(question.correctAnswer ?? ''),
                      solution: question.solution || '',
                      options: padded,
                    });
                    setMainImage(question.image ? { file: null, preview: question.image } : { file: null, preview: '' });
                    setIsModalOpen(true);
                  }}
                />
              </Fragment>
            );
          })
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
          editingId={editingQuestion?._id || null}
          manualForm={manualForm}
          setManualForm={setManualForm}
          mainImage={mainImage}
          setMainImage={setMainImage}
          lockedSubject={profile.branchApproval === 'approved' ? profile.branch : undefined}
          onClose={() => { setIsModalOpen(false); setEditingQuestion(null); setManualForm(null); setMainImage({file:null, preview:''}); }}
          onSave={() => { fetchQuestions(); setIsModalOpen(false); setEditingQuestion(null); setManualForm(null); setMainImage({file:null, preview:''}); }}
        />
      )}

      {isSmartPasteOpen && (
        <SmartPasteModal 
          isOpen={isSmartPasteOpen}
          onClose={() => setIsSmartPasteOpen(false)}
          onParsed={(parsed, imageFile) => {
            const resolvedSubject =
              profile.branchApproval === 'approved'
                ? (profile.branch || 'Matematik')
                : (parsed.subject || 'Matematik');
            setManualForm({
              text: parsed.text || '',
              subject: resolvedSubject,
              topic: resolvedSubject === 'Matematik' ? (parsed.topic || PATTERN_TOPIC_ORDER[0]) : (parsed.topic || ''),
              learningOutcome: parsed.learningOutcome || '',
              classLevel: parsed.classLevel || '9. Sınıf',
              difficulty: parsed.difficulty || 'Orta',
              correctAnswer: parsed.correctAnswer || '',
              solution: parsed.solution || '',
              options: Array.isArray(parsed.options) ? parsed.options.concat(Array(5).fill('')).slice(0,5) : ['', '', '', '', '']
            });
            if (imageFile) {
              const preview = URL.createObjectURL(imageFile);
              setMainImage({ file: imageFile, preview });
            } else {
              setMainImage({ file: null, preview: '' });
            }
            setIsSmartPasteOpen(false);
            setIsModalOpen(true);
          }}
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