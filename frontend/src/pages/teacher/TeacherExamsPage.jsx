import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, FileText, Trash2, Eye, Search,
  Clock, Award, Layers, Save,
  ChevronLeft, ChevronRight, Calendar, ArrowLeft, GripVertical, BarChart3, Sparkles,
} from 'lucide-react';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import 'katex/dist/katex.min.css';
import { CLASS_LEVELS } from '../../data/classLevelsAndDifficulties';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Select from '../../components/ui/Select.jsx';
import ExamPreviewModal from '../../components/exams/ExamPreviewModal.jsx';
import ExamResultsModal from '../../components/exams/ExamResultsModal.jsx';
import CreateExamModal from '../../components/exams/CreateExamModal.jsx';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';

// --- Alt Bileşenler (Stüdyo için) ---

const DraggableQuestionCard = ({ question, onDragStart, onAddClick }) => {
  const imgSrc = resolveAssetUrl(question.image);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex overflow-hidden hover:shadow-xl transition-all">
      <div
        draggable
        title="Sürükleyip ilgili zorluk kutusuna bırakın (Kolay / Orta / Zor)"
        onDragStart={(e) => onDragStart(e)}
        className="shrink-0 w-11 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 cursor-grab active:cursor-grabbing text-slate-400 hover:text-brand-600 py-2"
        aria-label="Sürükleyip zorluk kutusuna bırak"
      >
        <GripVertical size={18} />
      </div>
      <button
        type="button"
        onClick={onAddClick}
        title="Tek tık: soru doğru zorluk sütununa eklenir (en fazla 7)"
        className="flex-1 text-left p-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-none"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
            question.difficulty === 'Zor' ? 'bg-rose-50 text-rose-600' : question.difficulty === 'Orta' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {question.difficulty}
          </span>
          <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">Tıkla → ekle</span>
        </div>
        {imgSrc ? (
          <div className="mb-2 h-14 w-full flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-brand-50/50 dark:from-slate-900 dark:to-brand-950/20 border border-slate-100 dark:border-slate-700 overflow-hidden">
            <img src={imgSrc} alt="" className="max-h-full max-w-full object-contain" />
          </div>
        ) : null}
        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 line-clamp-2">
          {renderWithLatex(question.text)}
        </p>
      </button>
    </div>
  );
};

const DropZone = ({ questions, onDropQuestion, onRemove, label, colorClass, icon, availableCount }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-[1.5rem] text-white flex items-center justify-between shadow-lg ${colorClass}`}>
      <div className="flex items-center gap-3">
        {React.createElement(icon, { size: 18 })}
        <span className="font-black text-xs uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-xs font-bold">{questions.length}/7 • Uygun: {availableCount}</span>
    </div>
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        try {
          const raw = e.dataTransfer.getData('question');
          if (!raw) return;
          const q = JSON.parse(raw);
          if (q?._id) onDropQuestion(q);
        } catch {
          /* geçersiz sürükleme */
        }
      }}
      className="rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 min-h-[250px] space-y-2 bg-slate-50/50 dark:bg-slate-900/30"
    >
      {questions.map((q, idx) => {
        const slotImg = resolveAssetUrl(q.image);
        return (
        <div key={q._id} className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 flex items-center gap-2 group">
          {slotImg ? (
            <img src={slotImg} alt="" className="h-9 w-9 shrink-0 object-contain rounded-lg border border-slate-100 dark:border-slate-700 bg-white" />
          ) : null}
          <p className="flex-1 text-[10px] font-bold line-clamp-2">{renderWithLatex(q.text)}</p>
          <button type="button" onClick={() => onRemove(idx)} className="text-slate-300 hover:text-rose-500 transition-all shrink-0"><Trash2 size={12} /></button>
        </div>
      );
      })}
    </div>
  </div>
);

// --- Ana Sayfa Bileşeni ---
export default function TeacherExamsPage() {
  const { showToast } = useToast();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const [profile, setProfile] = useState({ branch: '', branchApproval: 'none' });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [view, setView] = useState('list'); // 'list' veya 'studio'
  const [exams, setExams] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [examTotal, setExamTotal] = useState(0);
  const [examPage, setExamPage] = useState(1);
  const [examTotalPages, setExamTotalPages] = useState(1);
  const [examSearch, setExamSearch] = useState('');
  const [debouncedExamSearch, setDebouncedExamSearch] = useState('');
  const [examClassFilter, setExamClassFilter] = useState('Tümü');
  const [loading, setLoading] = useState(true);
  const [poolLoading, setPoolLoading] = useState(false);
  const [previewId, setPreviewId] = useState(null);
  const [resultsId, setResultsId] = useState(null);
  const [showQuickExam, setShowQuickExam] = useState(false);

  // Stüdyo State'leri
  const [examName, setExamName] = useState('');
  const [classLevel, setClassLevel] = useState('9. Sınıf');
  const [easyQ, setEasyQ] = useState([]);
  const [mediumQ, setMediumQ] = useState([]);
  const [hardQ, setHardQ] = useState([]);
  const [poolSubject, setPoolSubject] = useState('Tümü');
  const [poolSearch, setPoolSearch] = useState('');
  const [debouncedPoolSearch, setDebouncedPoolSearch] = useState('');
  const [poolPage, setPoolPage] = useState(1);
  const [poolTotalPages, setPoolTotalPages] = useState(1);
  const [poolTotal, setPoolTotal] = useState(0);
  const [poolDifficultyCounts, setPoolDifficultyCounts] = useState({ Kolay: 0, Orta: 0, Zor: 0 });
  const SUBJECTS = ['Tümü', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji'];
  // Zamanlama & Süre
  const [schedStart, setSchedStart] = useState('');
  const [schedEnd, setSchedEnd] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const lastFetchedClassLevelRef = useRef('9. Sınıf');

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
      } catch {
        /* profil isteği isteğe bağlı */
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPoolSearch(poolSearch.trim()), 250);
    return () => clearTimeout(timer);
  }, [poolSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedExamSearch(examSearch.trim()), 250);
    return () => clearTimeout(timer);
  }, [examSearch]);

  // Auto-refresh profile while pending approval
  useEffect(() => {
    let timer;
    if (profile.branch && profile.branchApproval === 'pending') {
      timer = setInterval(async () => {
        try {
          const res = await apiClient.get('/users/profile');
          const branch = res.data?.branch || '';
          const branchApproval = res.data?.branchApproval || 'none';
          if (branchApproval === 'approved') {
            setProfile({ branch, branchApproval });
            showToast('Branş onaylandı! Havuz ve sınavlar yenilendi.', 'success');
            // Immediately refresh data with branch scope
            fetchExams();
            fetchQuestions();
            clearInterval(timer);
          }
        } catch {
          /* aralık yenileme hatası yok sayılır */
        }
      }, 5000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [profile.branch, profile.branchApproval]);

  const fetchExams = async () => {
    if (!profileLoaded) {
      return;
    }

    try {
      setLoading(true);
      const params = {
        page: examPage,
        limit: 9,
        ...(debouncedExamSearch ? { search: debouncedExamSearch } : {}),
        ...(examClassFilter !== 'Tümü' ? { classLevel: examClassFilter } : {}),
      };
      let res;
      if (profile.branch && profile.branchApproval === 'approved') {
        res = await apiClient.get('/teacher/subject/exams', { params });
      } else {
        res = await apiClient.get('/teacher/my-exams', { params });
      }
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setExams(data);
      setExamTotal(res.data?.total || data.length || 0);
      setExamTotalPages(res.data?.pages || 1);
    } catch {
      showToast('Sınavlar yüklenemedi', 'error');
    }
    finally { setLoading(false); }
  };

  const fetchQuestions = async () => {
    if (!profileLoaded) {
      return;
    }

    try {
      setPoolLoading(true);
      const params = {
        page: poolPage,
        limit: 24,
        classLevel,
        ...(debouncedPoolSearch ? { search: debouncedPoolSearch } : {}),
      };
      let res;
      if (profile.branch && profile.branchApproval === 'approved') {
        res = await apiClient.get('/teacher/subject/questions', { params });
      } else {
        res = await apiClient.get('/teacher/questions', {
          params: {
            ...params,
            ...(poolSubject !== 'Tümü' ? { subject: poolSubject } : {}),
          },
        });
      }
      setAllQuestions(res.data.data || []);
      setPoolTotal(res.data.total || 0);
      setPoolTotalPages(res.data.totalPages || 1);
      setPoolDifficultyCounts(res.data.difficultyCounts || { Kolay: 0, Orta: 0, Zor: 0 });
    } catch {
      console.error('Sorular çekilemedi');
    }
    finally { setPoolLoading(false); }
  };

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    fetchExams();
  }, [profileLoaded, profile.branch, profile.branchApproval, examPage, debouncedExamSearch, examClassFilter]);

  useEffect(() => {
    if (!profileLoaded) {
      return;
    }

    if (lastFetchedClassLevelRef.current !== classLevel && (easyQ.length || mediumQ.length || hardQ.length)) {
      setEasyQ([]);
      setMediumQ([]);
      setHardQ([]);
      showToast('Sınıf filtresi değiştiği için seçili sorular temizlendi.', 'warning');
    }

    lastFetchedClassLevelRef.current = classLevel;
    fetchQuestions();
  }, [profileLoaded, profile.branch, profile.branchApproval, classLevel, poolSubject, debouncedPoolSearch, poolPage]);

  useEffect(() => {
    setPoolPage(1);
  }, [classLevel, poolSubject, debouncedPoolSearch]);

  useEffect(() => {
    setExamPage(1);
  }, [debouncedExamSearch, examClassFilter]);

  // Filtrelenmiş havuz soruları
  const poolQuestions = useMemo(() => allQuestions, [allQuestions]);

  const availableCounts = useMemo(() => ({
    Kolay: poolDifficultyCounts.Kolay || 0,
    Orta: poolDifficultyCounts.Orta || 0,
    Zor: poolDifficultyCounts.Zor || 0,
  }), [poolDifficultyCounts]);

  const studioBucketsRef = useRef({ easyQ, mediumQ, hardQ });
  studioBucketsRef.current = { easyQ, mediumQ, hardQ };

  const addQuestionCommon = useCallback((q) => {
    const { easyQ: ez, mediumQ: md, hardQ: hd } = studioBucketsRef.current;
    const merged = [...ez, ...md, ...hd];
    if (!q?._id) {
      return;
    }
    const id = String(q._id);
    if (merged.some((x) => String(x._id) === id)) {
      showToast('Bu soru zaten sınavda', 'error');
      return;
    }
    const d = q.difficulty;
    if (d === 'Kolay') {
      if (ez.length >= 7) {
        showToast('Kolay sütunu dolu — en fazla 7 soru (7/7)', 'error');
        return;
      }
      setEasyQ([...ez, q]);
      return;
    }
    if (d === 'Orta') {
      if (md.length >= 7) {
        showToast('Orta sütunu dolu — en fazla 7 soru (7/7)', 'error');
        return;
      }
      setMediumQ([...md, q]);
      return;
    }
    if (d === 'Zor') {
      if (hd.length >= 7) {
        showToast('Zor sütunu dolu — en fazla 7 soru (7/7)', 'error');
        return;
      }
      setHardQ([...hd, q]);
      return;
    }
    showToast('Bu sorunun zorluk etiketi eksik (Kolay / Orta / Zor bekleniyor)', 'error');
  }, [showToast]);

  const handleDropIntoZone = useCallback((q, zoneDifficulty) => {
    if (!q) {
      return;
    }
    if (q.difficulty !== zoneDifficulty) {
      showToast(
        `Bu soru "${q.difficulty}". ${zoneDifficulty} kutusuna sürükleyemezsiniz — doğru sütunu kullanın ya da kart üzerindeki metne tıklayın.`,
        'warning',
      );
      return;
    }
    addQuestionCommon(q);
  }, [addQuestionCommon, showToast]);

  const handleCreate = async () => {
    if (easyQ.length !== 7 || mediumQ.length !== 7 || hardQ.length !== 7) {
      return showToast('7-7-7 kuralını tamamlamalısın!', 'error');
    }
    try {
      const payload = {
        name: (examName || '').trim() || `Sınav • ${classLevel}`,
        classLevel,
        duration: durationMin || 60,
        questions: [...easyQ, ...mediumQ, ...hardQ].map(q => q._id),
        ...(schedStart ? { startAt: schedStart } : {}),
        ...(schedEnd ? { endAt: schedEnd } : {}),
      };
      await apiClient.post('/exams', payload);
      showToast('Sınav yayınlandı!', 'success');
      setView('list');
      fetchExams();
    } catch {
      showToast('Hata oluştu', 'error');
    }
  };

  const handleDeleteExam = async (exam) => {
    const confirmed = await askConfirm({
      title: 'Sınav silinsin mi?',
      description:
        'Bu sınav ve varsa öğrenci sonuçları kalıcı olarak silinecek. Öğrenciler artık bu sınava giremez. Bu işlem geri alınamaz.',
    });
    if (!confirmed) return;
    const prev = exams;
    setExams((p) => p.filter((e) => e._id !== exam._id));
    try {
      await apiClient.delete(`/exams/${exam._id}`);
      showToast('Sınav silindi', 'success');
    } catch (err) {
      setExams(prev);
      showToast(err.response?.data?.message || 'Sınav silinemedi', 'error');
    }
  };

  if (view === 'studio') {
    return (
      <div className="p-6 space-y-8 animate-in slide-in-from-right duration-500">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              const hasUnsaved = easyQ.length + mediumQ.length + hardQ.length > 0;
              if (hasUnsaved && !window.confirm('Stüdyodan çıkmak üzeresin. Eklenmiş sorular kaybolacak, emin misin?')) return;
              setView('list');
            }}
            className="shrink-0"
            icon={ArrowLeft}
          >
            Listeye dön
          </Button>
          <input
            type="text"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder={`Sınav başlığı (ör. ${classLevel} yazılısı)`}
            className="w-full sm:flex-1 sm:max-w-md order-last sm:order-none px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <div className="flex flex-wrap items-center gap-2 order-first sm:order-none">
            <span
              className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                easyQ.length >= 7 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              Kolay {easyQ.length}/7
            </span>
            <span
              className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                mediumQ.length >= 7 ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              Orta {mediumQ.length}/7
            </span>
            <span
              className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${
                hardQ.length >= 7 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              Zor {hardQ.length}/7
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleCreate}
            disabled={easyQ.length !== 7 || mediumQ.length !== 7 || hardQ.length !== 7}
            className="shrink-0 px-8 py-3 rounded-2xl font-black shadow-lg shadow-brand-200/50 dark:shadow-none"
            icon={Save}
          >
            Sınavı yayınla
          </Button>
        </div>
        {/* Üst Ayarlar: Sınıf ve Havuz filtreleri */}
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="px-2 space-y-1">
              <h2 className="text-xl font-black">Soru Havuzu</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Soruya <strong className="text-slate-700 dark:text-slate-300">tıklayın</strong> — otomatik olarak kendi zorluk sütununa eklenir (her sütunda en fazla <strong>7</strong> soru).
                Görsel veya metin düzenlemesi için{' '}
                <Link to="/teacher/questions" className="font-bold text-brand-600 hover:underline dark:text-brand-400">
                  Soru Bankası
                </Link>
                ’na gidin; bu ekranda dosya yükleme yoktur.
              </p>
            </div>
            <div className="flex items-center gap-2 px-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                  placeholder="Havuzda ara..."
                  className="w-full pl-9 p-2 rounded-lg border dark:bg-slate-800 dark:text-white"
                />
              </div>
              <select
                value={profile.branchApproval === 'approved' ? (profile.branch || 'Tümü') : poolSubject}
                onChange={(e) => setPoolSubject(e.target.value)}
                disabled={profile.branchApproval === 'approved'}
                className="p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white"
              >
                {profile.branchApproval === 'approved' 
                  ? [profile.branch || 'Tümü'].map(s => <option key={s} value={s}>{s}</option>)
                  : SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="px-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Sınıf Düzeyi</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white"
              >
                {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Süre (dk)</label>
                  <input type="number" min={10} max={180} value={durationMin} onChange={(e)=>setDurationMin(parseInt(e.target.value||'60'))} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Başlangıç</label>
                  <input type="datetime-local" value={schedStart} onChange={(e)=>setSchedStart(e.target.value)} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Bitiş</label>
                  <input type="datetime-local" value={schedEnd} onChange={(e)=>setSchedEnd(e.target.value)} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="px-2 flex items-center justify-between text-xs text-slate-500">
              <span>{poolTotal} soru</span>
              <span>Sayfa {poolPage}/{poolTotalPages}</span>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
              {poolLoading && <div className="text-xs text-slate-500 px-2">Havuz yükleniyor...</div>}
              {poolQuestions.map((q) => (
                <DraggableQuestionCard
                  key={q._id}
                  question={q}
                  onAddClick={() => addQuestionCommon(q)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('question', JSON.stringify(q));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                />
              ))}
            </div>
            <div className="px-2 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" disabled={poolPage <= 1 || poolLoading} onClick={() => setPoolPage((prev) => Math.max(1, prev - 1))}>
                <ChevronLeft size={14} /> Önceki
              </Button>
              <Button variant="outline" size="sm" disabled={poolPage >= poolTotalPages || poolLoading} onClick={() => setPoolPage((prev) => Math.min(poolTotalPages, prev + 1))}>
                Sonraki <ChevronRight size={14} />
              </Button>
            </div>
          </div>
          <div className="lg:col-span-3 grid md:grid-cols-3 gap-6">
            <DropZone label="7 Kolay" questions={easyQ} availableCount={availableCounts.Kolay} onDropQuestion={(q) => handleDropIntoZone(q, 'Kolay')} onRemove={(i) => setEasyQ(easyQ.filter((_, idx) => idx !== i))} colorClass="bg-emerald-500" icon={Award} />
            <DropZone label="7 Orta" questions={mediumQ} availableCount={availableCounts.Orta} onDropQuestion={(q) => handleDropIntoZone(q, 'Orta')} onRemove={(i) => setMediumQ(mediumQ.filter((_, idx) => idx !== i))} colorClass="bg-amber-500" icon={Award} />
            <DropZone label="7 Zor" questions={hardQ} availableCount={availableCounts.Zor} onDropQuestion={(q) => handleDropIntoZone(q, 'Zor')} onRemove={(i) => setHardQ(hardQ.filter((_, idx) => idx !== i))} colorClass="bg-rose-500" icon={Award} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <TeacherPageShell
      maxWidthClass="max-w-6xl"
      title="Sınavlar"
      subtitle={`Toplam ${examTotal} sınav`}
    >
      {profile.branchApproval !== 'approved' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm">
          <p className="font-medium">
            Branş onayı bekleniyor. Onaylanınca branşınızdaki ortak sınav ve soru havuzuna da erişebilirsiniz.
          </p>
          <Link
            to="/teacher/profile"
            className="inline-block mt-2 text-sm font-bold text-amber-950 dark:text-amber-200 underline underline-offset-2 hover:no-underline"
          >
            Profil — branş talebi
          </Link>
        </div>
      )}

      <Card className="p-5 border border-surface-200 dark:border-surface-600" interactive>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-surface-900 dark:text-white">Sınav oluştur</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              Manuel 7-7-7 stüdyosu veya havuzdan otomatik akıllı sınav.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="md"
              icon={Sparkles}
              className="min-h-[44px] border-teal-600 text-teal-700"
              disabled={profile.branchApproval !== 'approved'}
              title={profile.branchApproval !== 'approved' ? 'Branş onayı gerekli' : undefined}
              onClick={() => setShowQuickExam(true)}
            >
              Akıllı Sınav
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              className="min-h-[44px]"
              disabled={profile.branchApproval !== 'approved'}
              title={profile.branchApproval !== 'approved' ? 'Branş onayı gerekli' : undefined}
              onClick={() => {
                setExamName('');
                setEasyQ([]);
                setMediumQ([]);
                setHardQ([]);
                setView('studio');
              }}
            >
              Sınav oluştur
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 flex flex-col md:flex-row gap-4 md:items-end md:justify-between border border-surface-200 dark:border-surface-600">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" aria-hidden />
          <input
            type="text"
            value={examSearch}
            onChange={(e) => setExamSearch(e.target.value)}
            placeholder="Sınav başlığında ara…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 dark:bg-surface-900 dark:text-white text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={examClassFilter}
            onChange={(e) => setExamClassFilter(e.target.value)}
            className="min-w-[160px] py-2.5 text-sm"
            aria-label="Sınıf filtresi"
          >
            <option value="Tümü">Tüm sınıflar</option>
            {CLASS_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            Sayfa {examPage} / {examTotalPages}
          </span>
        </div>
      </Card>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.length === 0 && (
            <div className="md:col-span-2 lg:col-span-3">
              <EmptyState
                icon={FileText}
                title="Henüz sınav yok"
                description="7-7-7 stüdyoda kolay / orta / zor sorulardan sınav oluşturun."
                className="py-12 border border-dashed border-slate-200 dark:border-slate-600 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20"
              />
            </div>
          )}
          {exams.map((exam) => (
            <Card key={exam._id} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-600">
              <div className="flex justify-between gap-2 mb-4">
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 rounded-2xl shrink-0">
                  <Layers size={24} aria-hidden />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setResultsId(exam._id)} aria-label="Sonuçlar">
                    <BarChart3 size={16} />
                    <span className="hidden sm:inline">
                      Sonuçlar{exam.participantCount > 0 ? ` (${exam.participantCount})` : ''}
                    </span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreviewId(exam._id)} aria-label="Önizle">
                    <Eye size={16} />
                  </Button>
                  {exam.canManage !== false ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="!text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/40"
                    onClick={() => handleDeleteExam(exam)}
                    aria-label="Sınavı sil"
                  >
                    <Trash2 size={16} />
                  </Button>
                  ) : null}
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 line-clamp-2">
                {exam.title || exam.name}
              </h3>
              {exam.classLevel ? (
                <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2">{exam.classLevel}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                  <Calendar size={12} aria-hidden /> {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('tr-TR') : '—'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} aria-hidden />
                  <input
                    type="number"
                    min={10}
                    max={180}
                    defaultValue={exam.duration || 60}
                    disabled={exam.canManage === false}
                    onBlur={async (e) => {
                      if (exam.canManage === false) return;
                      const val = parseInt(e.target.value || '60', 10);
                      if (val === exam.duration) return;
                      const prev = exams;
                      setExams((p) => p.map((x) => (x._id === exam._id ? { ...x, duration: val } : x)));
                      try {
                        await apiClient.put(`/exams/${exam._id}`, { duration: val });
                        showToast('Süre güncellendi', 'success');
                      } catch (err) {
                        setExams(prev);
                        showToast(err.response?.data?.message || 'Süre güncellenemedi', 'error');
                      }
                    }}
                    className="ml-1 w-14 p-1 rounded bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold normal-case"
                  />{' '}
                  dk
                </span>
                <span
                  className={`px-2 py-0.5 rounded ${
                    exam.schedulePhase === 'live' || exam.status === 'active'
                      ? 'bg-green-600 text-white'
                      : exam.schedulePhase === 'scheduled'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-500 text-white'
                  }`}
                >
                  {exam.schedulePhase === 'live' ? 'aktif' : exam.schedulePhase === 'scheduled' ? 'bekliyor' : exam.schedulePhase === 'ended' ? 'bitti' : exam.status}
                </span>
                <span className="normal-case">{exam.participantCount ?? (exam.results?.length || 0)} katılım</span>
              </div>
              {(exam.recentParticipants?.length > 0 || exam.participantCount > 0) && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Son tamamlayanlar</p>
                  <ul className="space-y-1">
                    {(exam.recentParticipants || []).slice(-3).map((p, idx) => (
                      <li key={`${p.studentName}-${idx}`} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span className="truncate">{p.studentName}</span>
                        <span className="font-bold text-brand-600 shrink-0 ml-2">%{p.score}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        <Button variant="outline" size="sm" disabled={examPage <= 1 || loading} onClick={() => setExamPage((prev) => Math.max(1, prev - 1))}>
          <ChevronLeft size={14} /> Önceki
        </Button>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {examTotal} kayıt · sayfa {examPage}/{examTotalPages}
        </span>
        <Button variant="outline" size="sm" disabled={examPage >= examTotalPages || loading} onClick={() => setExamPage((prev) => Math.min(examTotalPages, prev + 1))}>
          Sonraki <ChevronRight size={14} />
        </Button>
      </div>
      {previewId && <ExamPreviewModal examId={previewId} onClose={() => setPreviewId(null)} />}
      {resultsId && <ExamResultsModal examId={resultsId} onClose={() => setResultsId(null)} />}
      {showQuickExam && (
        <CreateExamModal
          onClose={() => setShowQuickExam(false)}
          onSuccess={fetchExams}
        />
      )}
      <ConfirmDialog />
    </TeacherPageShell>
  );
}