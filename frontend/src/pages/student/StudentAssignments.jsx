import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Calendar, Clock, CheckCircle2, AlertCircle, Loader2, X, Send, ExternalLink,
} from 'lucide-react';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';

const StudentAssignments = () => {
  const { language } = useContext(LanguageContext);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const t = {
    TR: {
      pageTitle: 'Ödevlerim',
      pageSubtitle: 'Ders başarılarını artırmak için ödevlerini zamanında tamamla.',
      allTasks: 'Hepsi',
      pending: 'Bekleyenler',
      completed: 'Tamamlanan',
      noDueTasks: 'Bu kategoride görüntülenecek ödev yok.',
      detailsBtn: 'Detaylar',
      dueDate: 'Son Tarih',
      urgent: 'Acil',
      loading: 'Yükleniyor...',
      submit: 'Teslim et',
      submitting: 'Gönderiliyor…',
      yourAnswer: 'Cevabın / çalışman',
      alreadySubmitted: 'Teslim edildi',
      grade: 'Not',
      feedback: 'Geri bildirim',
      teacher: 'Öğretmen',
      close: 'Kapat',
      placeholder: 'Çözümünü veya ödev metnini buraya yaz…',
      openExam: 'Sınava git',
      openExercise: 'Egzersize git',
      linkedExam: 'Bu ödev bir sınava bağlı',
      linkedExercise: 'Bu ödev bir egzersize bağlı',
    },
    EN: {
      pageTitle: 'My Assignments',
      pageSubtitle: 'Complete your assignments on time to improve your grades.',
      allTasks: 'All',
      pending: 'Pending',
      completed: 'Completed',
      noDueTasks: 'No assignments to display in this category.',
      detailsBtn: 'Details',
      dueDate: 'Due Date',
      urgent: 'Urgent',
      loading: 'Loading...',
      submit: 'Submit',
      submitting: 'Submitting…',
      yourAnswer: 'Your work',
      alreadySubmitted: 'Submitted',
      grade: 'Grade',
      feedback: 'Feedback',
      teacher: 'Teacher',
      close: 'Close',
      placeholder: 'Write your solution or assignment text here…',
      openExam: 'Open exam',
      openExercise: 'Open exercise',
      linkedExam: 'This assignment is linked to an exam',
      linkedExercise: 'This assignment is linked to an exercise',
    },
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/assignments/student/my-assignments', {
        params: { page, limit: 10 },
      });
      if (res.data.data) {
        setAssignments(res.data.data);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      showToast('Ödevler yüklenemedi', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openDetail = (task) => {
    setSelected(task);
    setContent(task.submission?.content || '');
  };

  const handleSubmit = async () => {
    if (!selected?._id) return;
    if (!content.trim()) {
      showToast('Lütfen içerik yazın', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/assignments/${selected._id}/submit`, { content: content.trim() });
      showToast('Ödev teslim edildi', 'success');
      setSelected(null);
      setContent('');
      await fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Teslim başarısız', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((task) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return !task.completed;
    if (activeTab === 'completed') return task.completed;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Tarih yok';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === tomorrow.toDateString()) return 'Yarın';
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isUrgent = (dueDate) => {
    if (!dueDate) return false;
    const date = new Date(dueDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date <= tomorrow;
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all min-h-[44px] ${
        activeTab === id
          ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-md'
          : 'text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} /> {label}
    </button>
  );

  return (
    <StudentPageShell
      title={getText('pageTitle')}
      subtitle={getText('pageSubtitle')}
      headerAside={(
        <div className="flex flex-wrap bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-sky-200/70 dark:border-slate-700 gap-1">
          <TabButton id="all" label={getText('allTasks')} icon={BookOpen} />
          <TabButton id="pending" label={getText('pending')} icon={Clock} />
          <TabButton id="completed" label={getText('completed')} icon={CheckCircle2} />
        </div>
      )}
    >
      <div className="grid gap-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-teal-600 dark:text-teal-400" size={32} />
          </div>
        ) : filteredAssignments.length > 0 ? (
          filteredAssignments.map((task) => (
            <div
              key={task._id}
              className="group bg-white/95 dark:bg-slate-800/95 rounded-[1.25rem] p-5 border border-sky-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 items-start md:items-center"
            >
              <div className="p-4 rounded-2xl flex-shrink-0 bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                <BookOpen size={24} />
              </div>

              <div className="flex-1 space-y-2 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {task.subject || 'Matematik'}
                      {task.classLevel ? ` · ${task.classLevel}` : ''}
                    </span>
                    <h4 className="font-bold text-lg text-slate-800 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
                      {task.title}
                    </h4>
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    {isUrgent(task.dueDate) && !task.completed && (
                      <span className="bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold animate-pulse">
                        <AlertCircle size={12} /> {getText('urgent')}
                      </span>
                    )}
                    {task.completed && (
                      <span className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">
                        <CheckCircle2 size={12} /> {getText('completed')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} className="text-teal-400 dark:text-teal-500" />
                    {getText('dueDate')}:{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(task.dueDate)}</span>
                  </span>
                </div>

                {!task.completed ? (
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-teal-500 to-sky-500 h-1.5 rounded-full" style={{ width: '0%' }} />
                  </div>
                ) : task.submission?.grade != null ? (
                  <p className="text-sm font-bold text-emerald-600">
                    {getText('grade')}: {task.submission.grade}
                  </p>
                ) : null}
              </div>

              <div className="w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => openDetail(task)}
                  className="w-full px-6 py-3 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 hover:border-teal-600 dark:hover:border-teal-500 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  {getText('detailsBtn')}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <CheckCircle2 size={48} className="mx-auto mb-3 opacity-20" />
            <p>{getText('noDueTasks')}</p>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40"
            >
              ←
            </button>
            <span className="text-sm font-bold text-slate-500 self-center">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-40"
            >
              →
            </button>
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white">{selected.title}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selected.subject}
                  {selected.createdBy?.name ? ` · ${getText('teacher')}: ${selected.createdBy.name}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
                aria-label={getText('close')}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              {selected.description ? (
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selected.description}</p>
              ) : null}
              <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={14} /> {getText('dueDate')}: {formatDate(selected.dueDate)}
              </p>

              {selected.linkType === 'exam' && selected.linkedExamId ? (
                <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/30 p-3 space-y-2">
                  <p className="text-sm font-bold text-rose-800 dark:text-rose-200">{getText('linkedExam')}</p>
                  <Link
                    to={`/student/quizzes?start=${selected.linkedExamId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold"
                    onClick={() => setSelected(null)}
                  >
                    <ExternalLink size={16} /> {getText('openExam')}
                  </Link>
                </div>
              ) : null}

              {selected.linkType === 'exercise' && selected.linkedExerciseId ? (
                <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/30 p-3 space-y-2">
                  <p className="text-sm font-bold text-sky-800 dark:text-sky-200">{getText('linkedExercise')}</p>
                  <Link
                    to={`/student/exercises/${selected.linkedExerciseId}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-bold"
                    onClick={() => setSelected(null)}
                  >
                    <ExternalLink size={16} /> {getText('openExercise')}
                  </Link>
                </div>
              ) : null}

              {selected.completed && selected.submission ? (
                <div className="space-y-3">
                  <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {getText('alreadySubmitted')}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">{getText('yourAnswer')}</label>
                    <p className="mt-1 text-sm whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/40 rounded-xl p-3">
                      {selected.submission.content}
                    </p>
                  </div>
                  {selected.submission.grade != null ? (
                    <p className="text-sm font-bold text-teal-600">
                      {getText('grade')}: {selected.submission.grade}
                    </p>
                  ) : null}
                  {selected.submission.feedback ? (
                    <p className="text-sm text-slate-600">
                      <span className="font-bold">{getText('feedback')}:</span> {selected.submission.feedback}
                    </p>
                  ) : null}
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400">Güncelle</label>
                    <textarea
                      rows={4}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">{getText('yourAnswer')}</label>
                  <textarea
                    rows={6}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 text-sm"
                    placeholder={getText('placeholder')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              )}

              <button
                type="button"
                disabled={submitting || !content.trim()}
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                {submitting ? getText('submitting') : getText('submit')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </StudentPageShell>
  );
};

export default StudentAssignments;
