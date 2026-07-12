import React, { useEffect, useState, useCallback, Fragment, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuestionFormModal from '../../components/exams/QuestionFormModal';
import SmartPasteModal from '../../components/modals/SmartPasteModal';
import AiGenerateQuizModal from '../../components/modals/AiGenerateQuizModal';
import {
  Plus, Edit2, Trash2, Search, FileText,
  ChevronLeft, ChevronRight, Star,
  Sparkles, Hash,
  LayoutGrid, Wand2,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import SkeletonCard from '../../components/ui/SkeletonCard';
import { renderWithLatex } from '../../utils/latex.jsx';
import QuestionVisual from '../../components/questions/QuestionVisual.jsx';
import QuestionSourceBadge from '../../components/questions/QuestionSourceBadge.jsx';
import SolutionDisplay from '../../components/questions/SolutionDisplay.jsx';
import CollapsiblePanel from '../../components/ui/CollapsiblePanel.jsx';
import QuestionTextWithPattern from '../../components/questions/QuestionTextWithPattern.jsx';
import { sourceFilterOptions, sourceFilterToApi } from '../../utils/questionSourceLabel';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import { useTranslation } from '../../i18n/useTranslation';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';
import {
  PATTERN_TOPIC_ORDER,
  PATTERN_TOPIC_ALL_UNDER,
  sortPatternTopicsUi,
} from '../../constants/patternTopicsUi';
import { enrichQuestionForm } from '../../utils/patternQuestionSolver';

function optionLabel(opt) {
  if (typeof opt === 'string') return opt.trim();
  if (opt && typeof opt.text === 'string') return opt.text.trim();
  return '';
}

function optionMatchesAnswer(opt, correctAnswer) {
  const label = optionLabel(opt);
  const answer = String(correctAnswer || '').trim();
  return label && answer && (label === answer || label.includes(answer) || answer.includes(label));
}

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
    <div className={`group relative bg-white/95 dark:bg-surface-800/95 rounded-card border transition-all duration-300 ${
      expanded 
        ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-soft' 
        : 'border-surface-200 dark:border-surface-700 hover:border-teal-300 hover:shadow-md'
    }`}>
      <button
        type="button"
        className="w-full text-left p-6 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-card"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={expanded ? 'Soru detayını gizle' : 'Soru detayını göster'}
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300">
                <Hash size={12} /> {question.classLevel}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${difficultyStyles[question.difficulty] || difficultyStyles['Orta']}`}>
                {question.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                {question.subject}
              </span>
              {topicLabel && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-50 dark:bg-sky-900/25 text-sky-800 dark:text-sky-300 border border-sky-100 dark:border-sky-800/40">
                  {topicLabel}
                </span>
              )}
              {topicCode && (
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-800/40">
                  {topicCode}
                </span>
              )}
              <QuestionSourceBadge question={question} size="sm" />
            </div>
            <QuestionTextWithPattern text={question.text} />
          </div>
          <div className="flex md:flex-col gap-2 opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300" onClick={e => e.stopPropagation()}>
            <button type="button" onClick={() => onEdit(question)} aria-label="Soruyu düzenle" className="p-2.5 bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-teal-600 transition-all">
              <Edit2 size={18} aria-hidden />
            </button>
            <button type="button" onClick={() => onDelete(question._id)} aria-label="Soruyu sil" className="p-2.5 bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 rounded-xl text-slate-400 hover:text-rose-600 transition-all">
              <Trash2 size={18} aria-hidden />
            </button>
          </div>
        </div>
      </button>

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
            {question.options?.map((opt, idx) => {
              const label = optionLabel(opt);
              const isCorrect = optionMatchesAnswer(opt, question.correctAnswer);
              return (
              <div key={idx} className={`p-4 rounded-2xl border-2 flex items-start gap-4 ${
                isCorrect
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10'
                  : 'border-slate-100 dark:border-slate-700'
              }`}>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold">
                    {label ? renderWithLatex(label) : <span className="text-slate-400 italic">—</span>}
                  </span>
                </div>
              </div>
              );
            })}
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

          <CollapsiblePanel title="Adım adım çözüm" defaultOpen={false} className="bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/50">
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
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const [fetchError, setFetchError] = useState(null);
  const [profile, setProfile] = useState({ branch: '', branchApproval: 'none' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartPasteOpen, setIsSmartPasteOpen] = useState(false);
  const [isAiGenerateOpen, setIsAiGenerateOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [manualForm, setManualForm] = useState(null);
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü', topic: 'Tümü', source: 'Tümü' });
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
              showToast(t('questionBank.branchApprovedToast'), 'success');
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
    if (searchParams.get('aiGenerate') === '1') {
      setIsAiGenerateOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aiFilterDefaults = useMemo(() => {
    const subject =
      profile.branch && profile.branchApproval === 'approved'
        ? profile.branch
        : filters.subject !== 'Tümü'
          ? filters.subject
          : 'Matematik';
    const isMath = subject === 'Matematik';
    let topic = filters.topic;
    if (!topic || topic === 'Tümü' || topic === PATTERN_TOPIC_ALL_UNDER) {
      topic = isMath ? PATTERN_TOPIC_ORDER[0] : '';
    }
    return {
      subject,
      classLevel: filters.classLevel !== 'Tümü' ? filters.classLevel : '9. Sınıf',
      difficulty: filters.difficulty !== 'Tümü' ? filters.difficulty : 'Orta',
      topic,
    };
  }, [filters, profile.branch, profile.branchApproval]);

  // Durumu URL'e yaz
  useEffect(() => {
    const params = {};
    if (debouncedSearch) params.search = debouncedSearch;
    Object.entries(filters).forEach(([k, v]) => { if (v !== 'Tümü') params[k] = v; });
    if (page !== 1) params.page = String(page);
    if (isAiGenerateOpen) params.aiGenerate = '1';
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, filters, page, isAiGenerateOpen, setSearchParams]);

  const fetchQuestions = useCallback(async () => {
    if (!profileLoaded) {
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const filterEntries = Object.entries(filters)
        .filter(([, v]) => v !== 'Tümü')
        .map(([k, v]) => (k === 'source' ? [k, sourceFilterToApi(v) || v] : [k, v]))
        .filter(([, v]) => v);
      const params = {
        page,
        limit: 8,
        search: debouncedSearch,
        sortBy: 'topic',
        ...Object.fromEntries(filterEntries),
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
      setFetchError(t('questionBank.errSyncInline'));
      showToast(t('questionBank.errSync'), 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filters, profile, profileLoaded, showToast, t]);

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

  const openNewQuestionModal = () => {
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
            source: 'Manuel',
          }
        : null
    );
    setMainImage({ file: null, preview: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await askConfirm({
      title: t('questionBank.deleteTitle'),
      description: t('questionBank.deleteDesc'),
    });
    if (!confirmed) return;
    const prev = questions;
    setQuestions(prev.filter(q => q._id !== id));
    setTotalQuestions((count) => (count > 0 ? count - 1 : 0));
    try {
      await apiClient.delete(`/questions/${id}`);
      showToast(t('questionBank.deleted'), 'success');
    } catch {
      setQuestions(prev);
      setTotalQuestions((count) => count + 1);
      showToast(t('questionBank.deleteFailed'), 'error');
    }
  };

  const hasActiveFilters =
    debouncedSearch ||
    Object.entries(filters).some(([, v]) => v && v !== 'Tümü');

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters({ subject: 'Tümü', difficulty: 'Tümü', classLevel: 'Tümü', topic: 'Tümü', source: 'Tümü' });
    setPage(1);
  };

  return (
    <TeacherPageShell
      maxWidthClass="max-w-7xl"
      className="pb-24 sm:pb-32"
      title={t('questionBank.title')}
      subtitle={t('questionBank.subtitle')}
      headerAside={(
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 w-full lg:w-auto lg:justify-end">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsAiGenerateOpen(true)}
            disabled={profile.branchApproval !== 'approved'}
            title={profile.branchApproval !== 'approved' ? t('questionBank.branchPending') : t('questionBank.aiGenerateTitle')}
            className="w-full sm:w-auto justify-center border-2 border-sky-600 text-sky-700 dark:text-sky-300"
            icon={Wand2}
          >
            {t('questionBank.aiGenerate')}
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsSmartPasteOpen(true)}
            disabled={profile.branchApproval !== 'approved'}
            title={profile.branchApproval !== 'approved' ? t('questionBank.branchPending') : ''}
            className="w-full sm:w-auto justify-center border-2 border-teal-600 text-teal-700 dark:text-teal-300"
            icon={Sparkles}
          >
            {t('questionBank.smartPaste')}
          </Button>

          <Button
            variant="primary"
            size="md"
            disabled={profile.branchApproval !== 'approved'}
            title={profile.branchApproval !== 'approved' ? t('questionBank.branchPending') : ''}
            onClick={openNewQuestionModal}
            className="w-full sm:w-auto justify-center"
            icon={Plus}
          >
            {t('questionBank.addQuestion')}
          </Button>
        </div>
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300 -mt-2">
        # {t('questionBank.total', { n: totalQuestions })}
      </p>

      {fetchError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-3" role="alert">
          <p className="text-sm text-rose-800 dark:text-rose-200">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={() => fetchQuestions()}>{t('common.retry')}</Button>
        </div>
      )}

      {/* Filtre Paneli */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center bg-white/70 dark:bg-surface-800/60 backdrop-blur-md p-3 sm:p-4 rounded-card border border-surface-200 dark:border-surface-700 shadow-card">
        <div className="lg:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
          <input 
            type="text"
            placeholder={t('questionBank.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setPage(1);}}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-900 border-none rounded-2xl focus:ring-4 focus:ring-teal-500/15 font-medium outline-none"
          />
        </div>
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <FilterSelect icon={<Hash size={14}/>} value={filters.classLevel} onChange={(v) => setFilters({...filters, classLevel: v})} options={['Tümü', ...Array.from({length:12}, (_,i)=>`${i+1}. Sınıf`)]} />
          <FilterSelect icon={<Star size={14}/>} value={filters.difficulty} onChange={(v) => setFilters({...filters, difficulty: v})} options={['Tümü', 'Kolay', 'Orta', 'Zor']} />
          <FilterSelect icon={<Sparkles size={14}/>} value={filters.source} onChange={(v) => { setFilters({ ...filters, source: v }); setPage(1); }} options={sourceFilterOptions()} />
        </div>
      </div>
      <p className="text-xs text-surface-400 px-1 lg:hidden">{t('questionBank.filterScrollHint')}</p>

      {/* Approval gate */}
      {profile.branchApproval !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 mb-4">
          {t('questionBank.branchPendingBanner')}
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
          <EmptyState
            icon={FileText}
            title={hasActiveFilters ? t('questionBank.emptyFilteredTitle') : t('questionBank.emptyTitle')}
            description={hasActiveFilters ? t('questionBank.emptyFilteredDesc') : t('questionBank.emptyNoDataDesc')}
            action={
              hasActiveFilters ? (
                <Button variant="outline" size="md" onClick={clearAllFilters}>
                  {t('questionBank.clearFilters')}
                </Button>
              ) : profile.branchApproval === 'approved' ? (
                <Button variant="primary" size="md" onClick={openNewQuestionModal}>
                  <Plus size={18} /> {t('questionBank.addFirstQuestion')}
                </Button>
              ) : null
            }
          />
        ) : (
          questions.map((q, idx) => {
            const topicLine = q.topic || 'Konu belirtilmemiş';
            const showTopicHeading = ['Tümü', PATTERN_TOPIC_ALL_UNDER, 'Örüntüler'].includes(filters.topic)
              && (idx === 0 || (questions[idx - 1].topic || 'Konu belirtilmemiş') !== topicLine);
            return (
              <Fragment key={q._id}>
                {showTopicHeading && (
                  <div className={`flex items-center gap-3 px-2 ${idx === 0 ? '' : 'mt-8 pt-2 border-t border-slate-100 dark:border-slate-800'}`}>
                    <LayoutGrid size={16} className="text-sky-500 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-300">
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
                      source: question.source || 'Manuel',
                      assessmentMeta: question.assessmentMeta || null,
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
          <PaginationButton onClick={() => setPage(p => p - 1)} disabled={page === 1} icon={<ChevronLeft size={20}/>} ariaLabel={t('questionBank.pagePrev')} />
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest px-4">
            Sayfa <span className="text-teal-600">{page}</span> / {totalPages}
          </span>
          <PaginationButton onClick={() => setPage(p => p + 1)} disabled={page === totalPages} icon={<ChevronRight size={20}/>} ariaLabel={t('questionBank.pageNext')} />
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
            const enriched = enrichQuestionForm({
              text: parsed.text || '',
              subject: resolvedSubject,
              topic: resolvedSubject === 'Matematik' ? (parsed.topic || PATTERN_TOPIC_ORDER[0]) : (parsed.topic || ''),
              learningOutcome: parsed.learningOutcome || '',
              classLevel: parsed.classLevel || '9. Sınıf',
              difficulty: parsed.difficulty || 'Orta',
              correctAnswer: parsed.correctAnswer || '',
              solution: parsed.solution || '',
              options: Array.isArray(parsed.options) ? parsed.options.concat(Array(5).fill('')).slice(0,5) : ['', '', '', '', ''],
              source: 'Manuel',
              assessmentMeta: parsed.assessmentMeta || { origin: 'smart-parse', parseMode: parsed.parseMode || 'smart-parse' },
            });
            setManualForm(enriched);
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

      {isAiGenerateOpen && (
        <AiGenerateQuizModal
          isOpen={isAiGenerateOpen}
          onClose={() => setIsAiGenerateOpen(false)}
          profile={profile}
          filterDefaults={aiFilterDefaults}
          onSaved={() => {
            fetchQuestions();
            setIsAiGenerateOpen(false);
          }}
          onRequestEditOne={(form) => {
            setEditingQuestion(null);
            setManualForm(form);
            setMainImage({ file: null, preview: '' });
            setIsAiGenerateOpen(false);
            setIsModalOpen(true);
          }}
        />
      )}
      <ConfirmDialog />
    </TeacherPageShell>
  );
}

// --- Yardımcı Küçük Bileşenler ---
const FilterSelect = ({ icon, value, onChange, options }) => (
  <div className="relative group">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 group-hover:scale-110 transition-transform">{icon}</div>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-9 pr-4 py-3 bg-white dark:bg-surface-900 border-none rounded-xl text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors shadow-sm"
    >
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </div>
);

const PaginationButton = ({ onClick, disabled, icon, ariaLabel }) => (
  <button 
    type="button"
    onClick={onClick} 
    disabled={disabled}
    aria-label={ariaLabel}
    className="p-3 bg-white dark:bg-surface-800 rounded-xl border-2 border-surface-100 dark:border-surface-700 text-surface-500 hover:border-teal-600 hover:text-teal-700 disabled:opacity-20 transition-all shadow-sm active:scale-95"
  >
    {icon}
  </button>
);