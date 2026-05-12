import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  BookOpen,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  X,
  Trophy,
  ListOrdered,
  Wand2,
  MousePointerClick,
} from 'lucide-react';
import apiClient, { resolveAssetUrl } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CLASS_LEVELS, SUBJECTS } from '../../data/classLevelsAndDifficulties';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Select from '../../components/ui/Select.jsx';
import { renderWithLatex } from '../../utils/latex.jsx';
import ExerciseQuestionPicker from '../../components/exercises/ExerciseQuestionPicker.jsx';
import 'katex/dist/katex.min.css';

/**
 * /teacher/exercises — Plan & IA (özet)
 * - Üst şerit: başlık + kısa açıklama + birincil eylem (Yeni egzersiz).
 * - Araç çubuğu: sınıf filtresi (liste); oluşturma formu ayrı state ile (form sınıfı ≠ "Tümü").
 * - Liste: kart ızgarası, sayfalama, boş durum (EmptyState).
 * - Önizleme: GET /exercises/:id ile detay modal (soru metinleri LaTeX ile).
 * - Sonraki iterasyonlar (API gerekir): arama, düzenleme, öğrenci paylaşım linki, istatistik.
 */

const getDifficultyColor = (level) => {
  const colors = {
    Kolay: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400',
    Orta: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400',
    Zor: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/20 dark:text-rose-400',
  };
  return colors[level] || colors.Orta;
};

const DifficultyToggle = ({ difficulty, selected, onToggle }) => {
  const bgColor = {
    Kolay: 'bg-emerald-500',
    Orta: 'bg-amber-500',
    Zor: 'bg-rose-500',
  };

  return (
    <button
      type="button"
      onClick={() => onToggle(difficulty)}
      className={`px-4 py-2 rounded-lg font-bold transition-all ${
        selected.includes(difficulty)
          ? `${bgColor[difficulty]} text-white shadow-lg`
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:shadow'
      }`}
    >
      {difficulty}
    </button>
  );
};

const ExerciseCard = ({ exercise, onView, onEditQuestions, onDelete }) => (
  <Card className="p-5 flex flex-col h-full hover:border-brand-200 dark:hover:border-brand-800">
    <div className="flex justify-between items-start gap-3 mb-3">
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-surface-900 dark:text-white truncate">{exercise.name}</h3>
        {exercise.description ? (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">{exercise.description}</p>
        ) : null}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onView(exercise._id)}
          className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
          aria-label="Önizle"
        >
          <Eye size={18} />
        </button>
        <button
          type="button"
          onClick={() => onEditQuestions(exercise._id)}
          className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          aria-label="Soruları düzenle"
        >
          <ListOrdered size={18} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(exercise._id)}
          className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          aria-label="Sil"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mb-3">
      <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-200 text-xs font-bold rounded-lg">
        {exercise.classLevel}
      </span>
      <span className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 text-xs font-bold rounded-lg">
        {exercise.totalQuestions} soru
      </span>
      {(exercise.difficulty || []).map((d) => (
        <span key={d} className={`px-2 py-0.5 text-xs font-bold rounded-lg border ${getDifficultyColor(d)}`}>
          {d}
        </span>
      ))}
      {exercise.gameMode === 'timed' && exercise.timeLimit ? (
        <span className="px-2 py-0.5 bg-violet-100 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 text-xs font-bold rounded-lg inline-flex items-center gap-1">
          <Clock size={12} /> {exercise.timeLimit} dk
        </span>
      ) : null}
      {exercise.playTransform === 'game_show' ? (
        <span className="px-2 py-0.5 bg-fuchsia-100 dark:bg-fuchsia-900/25 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-bold rounded-lg">
          Oyun gösterimi
        </span>
      ) : null}
    </div>
    <p className="text-xs text-surface-500 dark:text-surface-400 mt-auto pt-3 border-t border-surface-100 dark:border-surface-700">
      {exercise.submissions?.length || 0} öğrenci kaydı
    </p>
  </Card>
);

function ExercisePreviewModal({ exerciseId, onClose }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!exerciseId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setData(null);
      try {
        const res = await apiClient.get(`/exercises/${exerciseId}`);
        if (!cancelled) setData(res.data?.data || null);
      } catch {
        if (!cancelled) {
          showToast('Egzersiz yüklenemedi', 'error');
          onCloseRef.current();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, showToast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!exerciseId) return null;

  const modeLabel =
    data?.gameMode === 'timed' ? 'Süreli' : data?.gameMode === 'challenge' ? 'Challenge' : 'Pratik';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-preview-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <h2 id="exercise-preview-title" className="text-lg font-bold text-slate-900 dark:text-white truncate pr-2">
            {loading ? 'Yükleniyor…' : data?.name || 'Egzersiz'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-brand-600" size={36} />
            </div>
          ) : data ? (
            <>
              {data.description ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">{data.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">{data.classLevel}</span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">{data.subject || 'Matematik'}</span>
                <span className="px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold">
                  {modeLabel}
                </span>
                <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">
                  {(data.questions || []).length} soru
                </span>
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Sorular</p>
                <ol className="space-y-3 list-decimal list-inside marker:text-brand-600">
                  {(data.questions || []).map((q, i) => {
                    const imgSrc = resolveAssetUrl(q.image);
                    return (
                      <li
                        key={q._id || i}
                        className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 bg-slate-50/80 dark:bg-slate-800/40"
                      >
                        <div className="inline text-sm font-medium text-slate-800 dark:text-slate-100 pl-1">
                          {renderWithLatex(q.text || '—')}
                        </div>
                        {imgSrc ? (
                          <div className="mt-2 flex justify-center">
                            <img src={imgSrc} alt="" className="max-h-28 object-contain rounded-lg border border-slate-200 dark:border-slate-600" />
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ManageExerciseQuestionsModal({ exerciseId, branchApproved, onClose, onSaved }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ name: '', classLevel: '', subject: 'Matematik' });
  const [selectedIds, setSelectedIds] = useState([]);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!exerciseId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/exercises/${exerciseId}`);
        const data = res.data?.data;
        if (!cancelled && data) {
          setMeta({
            name: data.name || '',
            classLevel: data.classLevel || '',
            subject: data.subject || 'Matematik',
          });
          const ids = (data.questions || []).map((q) => String(q._id || q));
          setSelectedIds(ids);
        }
      } catch {
        if (!cancelled) {
          showToast('Egzersiz yüklenemedi', 'error');
          onCloseRef.current();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exerciseId, showToast]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      showToast('En az bir soru seçin', 'error');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put(`/exercises/${exerciseId}`, { questionIds: selectedIds });
      showToast('Sorular güncellendi', 'success');
      onSaved();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || 'Kaydedilemedi', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!exerciseId) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-edit-title"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-3">
          <h2 id="exercise-edit-title" className="text-lg font-bold text-slate-900 dark:text-white truncate">
            Soruları düzenle · {loading ? '…' : meta.name}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={onClose}>
              İptal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Kaydediliyor
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto p-4 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="animate-spin text-brand-600" size={36} />
            </div>
          ) : (
            <ExerciseQuestionPicker
              classLevel={meta.classLevel}
              subject={meta.subject}
              branchApproved={branchApproved}
              selectedIds={selectedIds}
              onSelectedIdsChange={setSelectedIds}
              maxSelected={30}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherExerciseCreator() {
  const { showToast } = useToast();

  const [createMode, setCreateMode] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseDescription, setExerciseDescription] = useState('');
  /** Liste filtresi — API’ye "Tümü" gönderilmez */
  const [filterClass, setFilterClass] = useState('Tümü');
  /** Yeni egzersiz formu — her zaman somut sınıf */
  const [formClass, setFormClass] = useState('9. Sınıf');
  const [formSubject, setFormSubject] = useState('Matematik');
  const [selectedDifficulties, setSelectedDifficulties] = useState(['Kolay', 'Orta']);
  const [gameMode, setGameMode] = useState('practice');
  const [playTransform, setPlayTransform] = useState('classic');
  const [timeLimit, setTimeLimit] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [previewId, setPreviewId] = useState(null);
  const closePreview = useCallback(() => setPreviewId(null), []);

  const [profile, setProfile] = useState({ branch: '', branchApproval: 'none' });
  const [buildMode, setBuildMode] = useState('auto');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [editExerciseId, setEditExerciseId] = useState(null);
  const closeEdit = useCallback(() => setEditExerciseId(null), []);

  const branchApproved = Boolean(profile.branch && profile.branchApproval === 'approved');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const branch = res.data?.branch || '';
        const branchApproval = res.data?.branchApproval || 'none';
        if (active) setProfile({ branch, branchApproval });
      } catch {
        /* profil isteğe bağlı */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (filterClass !== 'Tümü') params.classLevel = filterClass;
      const res = await apiClient.get('/exercises/teacher/my-exercises', { params });
      if (res.data.data) {
        setExercises(res.data.data);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total ?? res.data.data.length);
      }
    } catch {
      showToast('Egzersizler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterClass, showToast]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    setSelectedQuestionIds([]);
  }, [formClass, formSubject]);

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      showToast('Egzersiz adı boş olamaz', 'error');
      return;
    }
    if (buildMode === 'manual') {
      if (selectedQuestionIds.length === 0) {
        showToast('Manuel modda havuzdan en az bir soru ekleyin', 'error');
        return;
      }
    } else if (selectedDifficulties.length === 0) {
      showToast('Otomatik mod için en az bir zorluk seviyesi seçin', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: exerciseName,
        description: exerciseDescription,
        classLevel: formClass,
        subject: formSubject,
        difficulty: buildMode === 'manual' ? [] : selectedDifficulties,
        gameMode,
        playTransform,
        timeLimit: timeLimit ? parseInt(String(timeLimit), 10) : null,
        pointsPerQuestion: 10,
        ...(buildMode === 'manual' && selectedQuestionIds.length > 0 ? { questionIds: selectedQuestionIds } : {}),
      };
      await apiClient.post('/exercises', payload);
      showToast('Egzersiz oluşturuldu', 'success');
      setExerciseName('');
      setExerciseDescription('');
      setSelectedDifficulties(['Kolay', 'Orta']);
      setGameMode('practice');
      setPlayTransform('classic');
      setTimeLimit(null);
      setBuildMode('auto');
      setSelectedQuestionIds([]);
      setCreateMode(false);
      setPage(1);
      if (filterClass !== 'Tümü' && filterClass !== formClass) {
        setFilterClass(formClass);
      }
      fetchExercises();
    } catch (err) {
      showToast(err.response?.data?.message || 'Egzersiz oluşturulamadı', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!window.confirm('Bu egzersizi silmek istediğinizden emin misiniz?')) return;
    try {
      await apiClient.delete(`/exercises/${id}`);
      showToast('Egzersiz silindi', 'success');
      fetchExercises();
    } catch {
      showToast('Silinemedi', 'error');
    }
  };

  const handleToggleDifficulty = (difficulty) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty) ? prev.filter((d) => d !== difficulty) : [...prev, difficulty],
    );
  };

  const openCreate = () => {
    if (filterClass !== 'Tümü') setFormClass(filterClass);
    setBuildMode('auto');
    setSelectedQuestionIds([]);
    setCreateMode(true);
  };

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 pb-20 max-w-6xl mx-auto w-full">
      {previewId ? <ExercisePreviewModal exerciseId={previewId} onClose={closePreview} /> : null}
      {editExerciseId ? (
        <ManageExerciseQuestionsModal
          exerciseId={editExerciseId}
          branchApproved={branchApproved}
          onClose={closeEdit}
          onSaved={fetchExercises}
        />
      ) : null}

      {/* Üst şerit */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-1">
            <Trophy size={22} aria-hidden />
            <span className="text-[11px] font-black uppercase tracking-widest">Öğretmen</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-surface-900 dark:text-white tracking-tight">Egzersizler</h1>
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-1 max-w-xl">
            Havuzdaki sorulardan sınıf ve zorluk seçerek AI ile paket oluşturun; öğrenciler sınıfına uygun egzersizleri görür.
          </p>
        </div>
        <Button
          variant={createMode ? 'secondary' : 'primary'}
          size="lg"
          icon={createMode ? X : Plus}
          onClick={() => {
            if (createMode) {
              setCreateMode(false);
              setSelectedQuestionIds([]);
              setBuildMode('auto');
              setPlayTransform('classic');
            } else {
              openCreate();
            }
          }}
          ariaLabel={createMode ? 'Formu kapat' : 'Yeni egzersiz'}
        >
          {createMode ? 'Kapat' : 'Yeni egzersiz'}
        </Button>
      </header>

      {/* Oluşturma */}
      {createMode ? (
        <Card className="space-y-4 border-brand-100 dark:border-brand-900/40">
          <h2 className="text-lg font-bold flex items-center gap-2 text-surface-900 dark:text-white">
            <Sparkles size={22} className="text-brand-500 shrink-0" />
            Yeni paket
          </h2>
          <input
            type="text"
            placeholder="Örn. Rasyonel sayılar — hızlı tekrar"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
          <textarea
            placeholder="Kısa açıklama (isteğe bağlı)"
            value={exerciseDescription}
            onChange={(e) => setExerciseDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-surface-600 dark:text-surface-400 block mb-1">Sınıf</label>
              <Select value={formClass} onChange={(e) => setFormClass(e.target.value)}>
                {CLASS_LEVELS.map((lv) => (
                  <option key={lv} value={lv}>
                    {lv}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-surface-600 dark:text-surface-400 block mb-1">Ders</label>
              <Select value={formSubject} onChange={(e) => setFormSubject(e.target.value)}>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-surface-700 dark:text-surface-300 mb-2">Nasıl oluşturulsun?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setBuildMode('auto');
                  setSelectedQuestionIds([]);
                }}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  buildMode === 'auto'
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 ring-2 ring-brand-500/30'
                    : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-surface-900 dark:text-white">
                  <Wand2 size={20} className="text-brand-600 shrink-0" />
                  Otomatik paket
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">
                  Zorluk seçilir; havuzdan en fazla 15 soru rastgele seçilir.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setBuildMode('manual')}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  buildMode === 'manual'
                    ? 'border-brand-500 bg-brand-50/80 dark:bg-brand-950/40 ring-2 ring-brand-500/30'
                    : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-surface-900 dark:text-white">
                  <MousePointerClick size={20} className="text-brand-600 shrink-0" />
                  Sorularımı seçerek
                </div>
                <p className="text-xs text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">
                  Havuzdan tıklayarak ekleyin; sırayı değiştirin (en fazla 30 soru).
                </p>
              </button>
            </div>
          </div>

          {buildMode === 'auto' ? (
            <div>
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300 mb-2">Zorluk (havuzdan seçilir)</p>
              <div className="flex flex-wrap gap-2">
                {['Kolay', 'Orta', 'Zor'].map((diff) => (
                  <DifficultyToggle
                    key={diff}
                    difficulty={diff}
                    selected={selectedDifficulties}
                    onToggle={handleToggleDifficulty}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-surface-700 dark:text-surface-300">
                Soru havuzu · {branchApproved ? 'Onaylı branş havuzu' : 'Kendi sorularınız'}
              </p>
              <ExerciseQuestionPicker
                classLevel={formClass}
                subject={formSubject}
                branchApproved={branchApproved}
                selectedIds={selectedQuestionIds}
                onSelectedIdsChange={setSelectedQuestionIds}
                maxSelected={30}
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-surface-600 dark:text-surface-400 block mb-1">Oyun modu</label>
              <Select value={gameMode} onChange={(e) => setGameMode(e.target.value)}>
                <option value="practice">Pratik (sınırsız)</option>
                <option value="challenge">Challenge (puan)</option>
                <option value="timed">Süreli</option>
              </Select>
            </div>
            {gameMode === 'timed' ? (
              <div>
                <label className="text-xs font-bold text-surface-600 dark:text-surface-400 block mb-1">Süre (dk)</label>
                <input
                  type="number"
                  value={timeLimit ?? ''}
                  onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value, 10) : null)}
                  min={1}
                  max={120}
                  placeholder="15"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ) : (
              <div className="hidden md:block" aria-hidden />
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-surface-600 dark:text-surface-400 block mb-1">
              Öğrenci ekranı (soru havuzu aynı; sunum değişir)
            </label>
            <Select value={playTransform} onChange={(e) => setPlayTransform(e.target.value)}>
              <option value="classic">Klasik — çoktan seçmeli / metin, soru tipine göre</option>
              <option value="game_show">
                Oyun gösterimi — sayı padı, şekil düğmeleri, büyük iki şık, boşluk alanı (eşleştirme/sıra aynı kalır)
              </option>
            </Select>
            <p className="text-[11px] text-surface-500 dark:text-surface-400 mt-1.5 leading-relaxed">
              Oyun gösteriminde cevap anahtarı değişmez; aynı doğru cevap farklı dokunmatik arayüzlerle verilir. İleride
              özel sayı/şekil üretimi için ayrı şablonlar eklenebilir.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-surface-100 dark:border-surface-700">
            <Button
              variant="outline"
              fullWidth
              className="sm:flex-1"
              onClick={() => {
                setCreateMode(false);
                setSelectedQuestionIds([]);
                setBuildMode('auto');
                setPlayTransform('classic');
              }}
            >
              İptal
            </Button>
            <Button fullWidth className="sm:flex-1" onClick={handleCreateExercise} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 size={18} className="animate-spin shrink-0" aria-hidden />
                  Oluşturuluyor…
                </>
              ) : (
                <>
                  <Sparkles size={18} className="shrink-0" aria-hidden />
                  Oluştur
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Araç çubuğu */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <BookOpen className="text-surface-400 shrink-0" size={20} aria-hidden />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">Liste</span>
          <Select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-56"
          >
            <option value="Tümü">Tüm sınıflar</option>
            {CLASS_LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv}
              </option>
            ))}
          </Select>
          {!loading && total > 0 ? (
            <span className="text-xs text-surface-500">
              {total} kayıt · sayfa {page}/{totalPages}
            </span>
          ) : null}
        </div>
      </Card>

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Henüz egzersiz yok"
          description="Öğrenci havuzunda eşleşen soru bulunan bir sınıf ve zorluk seçerek ilk paketinizi oluşturun."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Yeni egzersiz
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex._id}
              exercise={ex}
              onView={setPreviewId}
              onEditQuestions={setEditExerciseId}
              onDelete={handleDeleteExercise}
            />
          ))}
        </div>
      )}

      {!loading && totalPages > 1 ? (
        <div className="flex justify-center items-center gap-4 pt-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="p-3 rounded-xl border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-800 px-4 py-2 rounded-xl text-sm">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="p-3 rounded-xl border border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
