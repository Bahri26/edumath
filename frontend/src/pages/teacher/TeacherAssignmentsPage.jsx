import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, ClipboardList, Loader2, ChevronLeft, ChevronRight,
  Calendar, Clock, Users, X, Eye, Send,
} from 'lucide-react';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CLASS_LEVELS, SUBJECTS } from '../../data/classLevelsAndDifficulties';
import SkeletonCard from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import Select from '../../components/ui/Select.jsx';
import { useConfirmAction } from '../../hooks/useConfirmAction';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';

const emptyForm = {
  title: '',
  description: '',
  subject: SUBJECTS[0] || 'Matematik',
  classLevel: CLASS_LEVELS[0] || '5. Sınıf',
  dueDate: '',
  duration: 60,
  linkType: 'text',
  linkedExamId: '',
  linkedExerciseId: '',
};

function formatDate(value) {
  if (!value) return 'Tarih yok';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AssignmentDetailModal({ assignment, onClose, onGraded }) {
  const { showToast } = useToast();
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const g = {};
    const f = {};
    (assignment?.submissions || []).forEach((s) => {
      const id = s.studentId?._id || s.studentId;
      if (!id) return;
      g[id] = s.grade ?? '';
      f[id] = s.feedback || '';
    });
    setGrades(g);
    setFeedbacks(f);
  }, [assignment]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveGrade = async (studentId) => {
    setSavingId(studentId);
    try {
      await apiClient.put(`/assignments/${assignment._id}/grade/${studentId}`, {
        grade: grades[studentId] === '' ? undefined : Number(grades[studentId]),
        feedback: feedbacks[studentId] || '',
      });
      showToast('Not kaydedildi', 'success');
      onGraded?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Not kaydedilemedi', 'error');
    } finally {
      setSavingId(null);
    }
  };

  if (!assignment) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white">{assignment.title}</h3>
            <p className="text-sm text-slate-500 mt-1">
              {assignment.subject}
              {assignment.classLevel ? ` · ${assignment.classLevel}` : ''}
              {' · '}Son tarih: {formatDate(assignment.dueDate)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto space-y-4">
          {assignment.description ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{assignment.description}</p>
          ) : null}
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Teslimler ({assignment.submissions?.length || 0})
          </h4>
          {(assignment.submissions || []).length === 0 ? (
            <p className="text-sm text-slate-400">Henüz teslim yok.</p>
          ) : (
            (assignment.submissions || []).map((s) => {
              const studentId = s.studentId?._id || s.studentId;
              const name = s.studentId?.name || s.studentId?.email || 'Öğrenci';
              return (
                <Card key={String(studentId)} className="p-4 space-y-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{name}</p>
                      <p className="text-xs text-slate-500">{formatDate(s.submittedAt)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
                    {s.content || '—'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400">Not</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                        value={grades[studentId] ?? ''}
                        onChange={(e) => setGrades((prev) => ({ ...prev, [studentId]: e.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="text-[10px] font-black uppercase text-slate-400">Geri bildirim</label>
                      <input
                        type="text"
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                        value={feedbacks[studentId] ?? ''}
                        onChange={(e) => setFeedbacks((prev) => ({ ...prev, [studentId]: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      icon={Send}
                      disabled={savingId === studentId}
                      onClick={() => saveGrade(studentId)}
                    >
                      {savingId === studentId ? '…' : 'Kaydet'}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherAssignmentsPage() {
  const { showToast } = useToast();
  const { askConfirm, ConfirmDialog } = useConfirmAction();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [createMode, setCreateMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [branchApproved, setBranchApproved] = useState(true);
  const [examOptions, setExamOptions] = useState([]);
  const [exerciseOptions, setExerciseOptions] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/users/profile');
        setBranchApproved(res.data?.branchApproval === 'approved');
        if (res.data?.branch) {
          setForm((f) => ({ ...f, subject: res.data.branch }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!createMode) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [examsRes, exRes] = await Promise.all([
          apiClient.get('/teacher/my-exams', { params: { page: 1, limit: 50 } }).catch(() => ({ data: {} })),
          apiClient.get('/exercises/teacher/my-exercises', { params: { page: 1, limit: 50 } }).catch(() => ({ data: {} })),
        ]);
        if (cancelled) return;
        const exams = examsRes.data?.data || examsRes.data?.exams || (Array.isArray(examsRes.data) ? examsRes.data : []);
        const exercises = exRes.data?.data || (Array.isArray(exRes.data) ? exRes.data : []);
        setExamOptions(Array.isArray(exams) ? exams : []);
        setExerciseOptions(Array.isArray(exercises) ? exercises : []);
      } catch {
        /* ignore */
      }
    })();
    return () => { cancelled = true; };
  }, [createMode]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/assignments/teacher/my-assignments', {
        params: { page, limit: 9 },
      });
      setAssignments(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setTotal(res.data?.total || 0);
    } catch {
      showToast('Ödevler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject) {
      showToast('Başlık ve ders zorunludur', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        subject: form.subject,
        classLevel: form.classLevel,
        duration: Number(form.duration) || 60,
        dueDate: form.dueDate || undefined,
        linkType: form.linkType || 'text',
      };
      if (form.linkType === 'exam') payload.linkedExamId = form.linkedExamId;
      if (form.linkType === 'exercise') payload.linkedExerciseId = form.linkedExerciseId;
      await apiClient.post('/assignments', payload);
      showToast('Ödev oluşturuldu', 'success');
      setForm(emptyForm);
      setCreateMode(false);
      setPage(1);
      await fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Ödev oluşturulamadı', 'error');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/assignments/${id}`);
      setDetail(res.data);
    } catch {
      showToast('Ödev detayı yüklenemedi', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await askConfirm({
      title: 'Ödev silinsin mi?',
      description: 'Bu ödev ve tüm teslimler silinecek. Bu işlem geri alınamaz.',
    });
    if (!confirmed) return;
    try {
      await apiClient.delete(`/assignments/${id}`);
      showToast('Ödev silindi', 'success');
      fetchAssignments();
    } catch {
      showToast('Silinemedi', 'error');
    }
  };

  return (
    <TeacherPageShell
      maxWidthClass="max-w-6xl"
      title="Ödevler"
      subtitle={`Toplam ${total} ödev`}
      headerAside={(
        <Button
          variant={createMode ? 'outline' : 'primary'}
          icon={createMode ? X : Plus}
          disabled={!branchApproved && !createMode}
          title={!branchApproved ? 'Branş onayı gerekli' : undefined}
          onClick={() => setCreateMode((v) => !v)}
        >
          {createMode ? 'İptal' : 'Yeni ödev'}
        </Button>
      )}
    >
      {!branchApproved ? (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-sm">
          <p className="font-medium">Branş onayı bekleniyor. Onaylanınca yeni ödev oluşturabilirsiniz.</p>
          <Link to="/teacher/profile" className="inline-block mt-2 font-bold underline underline-offset-2">
            Profil — branş talebi
          </Link>
        </div>
      ) : null}

      {createMode ? (
        <Card className="p-5 space-y-4">
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Başlık</label>
              <input
                required
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 font-bold"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Örn: Örüntü çalışma ödevi"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400">Açıklama</label>
              <textarea
                rows={3}
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Öğrencilerin yapması gerekenler…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Ders</label>
                <Select
                  className="mt-1"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Sınıf</label>
                <Select
                  className="mt-1"
                  value={form.classLevel}
                  onChange={(e) => setForm((f) => ({ ...f, classLevel: e.target.value }))}
                >
                  {CLASS_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Son tarih</label>
                <input
                  type="date"
                  className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Süre (dk)</label>
                <input
                  type="number"
                  min={5}
                  className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400">Bağlantı türü</label>
                <Select
                  className="mt-1"
                  value={form.linkType}
                  onChange={(e) => setForm((f) => ({
                    ...f,
                    linkType: e.target.value,
                    linkedExamId: '',
                    linkedExerciseId: '',
                  }))}
                >
                  <option value="text">Metin ödevi</option>
                  <option value="exam">Sınava bağla</option>
                  <option value="exercise">Egzersize bağla</option>
                </Select>
              </div>
              {form.linkType === 'exam' ? (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Sınav</label>
                  <Select
                    className="mt-1"
                    required
                    value={form.linkedExamId}
                    onChange={(e) => setForm((f) => ({ ...f, linkedExamId: e.target.value }))}
                  >
                    <option value="">Sınav seç…</option>
                    {examOptions.map((ex) => (
                      <option key={ex._id} value={ex._id}>{ex.title || ex.name}</option>
                    ))}
                  </Select>
                </div>
              ) : null}
              {form.linkType === 'exercise' ? (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Egzersiz</label>
                  <Select
                    className="mt-1"
                    required
                    value={form.linkedExerciseId}
                    onChange={(e) => setForm((f) => ({ ...f, linkedExerciseId: e.target.value }))}
                  >
                    <option value="">Egzersiz seç…</option>
                    {exerciseOptions.map((ex) => (
                      <option key={ex._id} value={ex._id}>{ex.name}</option>
                    ))}
                  </Select>
                </div>
              ) : null}
            </div>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Ödevi yayınla'}
            </Button>
          </form>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Henüz ödev yok"
          description="Öğrencilere ödev vermek için «Yeni ödev»e tıklayın."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <Card key={a._id} className="p-5 flex flex-col h-full">
              <div className="flex justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-400">{a.subject}</p>
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">{a.title}</h3>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openDetail(a._id)}
                    className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600"
                    aria-label="Detay"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(a._id)}
                    className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600"
                    aria-label="Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                {a.classLevel ? (
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold">{a.classLevel}</span>
                ) : null}
                {a.linkType === 'exam' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold">Sınav</span>
                ) : null}
                {a.linkType === 'exercise' ? (
                  <span className="px-2 py-0.5 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 font-bold">Egzersiz</span>
                ) : null}
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold inline-flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(a.dueDate)}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold inline-flex items-center gap-1">
                  <Clock size={12} /> {a.duration || 60} dk
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100 dark:border-slate-700 inline-flex items-center gap-1">
                <Users size={12} /> {a.submissions?.length || 0} teslim
              </p>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Önceki
          </Button>
          <span className="text-sm font-bold text-slate-500">Sayfa {page} / {totalPages}</span>
          <Button variant="outline" size="sm" icon={ChevronRight} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Sonraki
          </Button>
        </div>
      ) : null}

      {detailLoading ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40">
          <Loader2 className="animate-spin text-white" size={36} />
        </div>
      ) : null}

      {detail ? (
        <AssignmentDetailModal
          assignment={detail}
          onClose={() => setDetail(null)}
          onGraded={() => openDetail(detail._id)}
        />
      ) : null}

      <ConfirmDialog />
    </TeacherPageShell>
  );
}
