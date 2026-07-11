import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  BookOpen,
  Target,
  Zap,
  Clock,
  GraduationCap,
  Mail,
  Loader2,
  AlertCircle,
  BarChart3,
  Sparkles,
  X,
  Dumbbell,
  FileText,
} from 'lucide-react';
import apiClient from '../../services/api';
import Card from '../../components/ui/Card.jsx';
import StudentExamAnalysisPanel from '../../components/teacher/StudentExamAnalysisPanel.jsx';
import { useProgressLabels } from '../../i18n/useTranslation';
import { useToast } from '../../context/ToastContext';
import { formatDuration } from '../../utils/formatDuration';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const formatRelativeTime = (value, lang) => {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) {
    return lang === 'EN' ? `${diffMinutes} min ago` : `${diffMinutes} dk önce`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return lang === 'EN' ? `${diffHours} h ago` : `${diffHours} saat önce`;
  }
  const diffDays = Math.round(diffHours / 24);
  return lang === 'EN' ? `${diffDays} d ago` : `${diffDays} gün önce`;
};

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function StudentProgressDashboard() {
  const t = useProgressLabels();
  const { language } = t;
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryStudent = searchParams.get('student');

  const [students, setStudents] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exams, setExams] = useState([]);
  const [detailAverageScore, setDetailAverageScore] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setListLoading(true);
      setListError(null);
    });
    apiClient
      .get('/teacher/students')
      .then((res) => {
        if (!active) return;
        setStudents(Array.isArray(res.data?.students) ? res.data.students : []);
      })
      .catch((err) => {
        if (!active) return;
        setStudents([]);
        const msg = err?.response?.data?.message || t.loadError;
        setListError(msg);
        if (err?.response?.status !== 403) showToast(msg, 'error');
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast, language, t.loadError]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        String(s.name || '')
          .toLowerCase()
          .includes(q) ||
        String(s.email || '')
          .toLowerCase()
          .includes(q)
    );
  }, [students, search]);

  const selectedStudent = useMemo(
    () => students.find((s) => String(s._id) === String(queryStudent)) || null,
    [students, queryStudent]
  );

  const classAverage = useMemo(() => {
    if (!students.length) return null;
    const sum = students.reduce((acc, s) => acc + (Number(s.averageScore) || 0), 0);
    return (sum / students.length).toFixed(1);
  }, [students]);

  useEffect(() => {
    let active = true;

    if (!queryStudent) {
      queueMicrotask(() => {
        if (!active) return;
        setProgress([]);
        setExercises([]);
        setExams([]);
        setDetailAverageScore(null);
        setProgressError(null);
        setProgressLoading(false);
      });
      return () => {
        active = false;
      };
    }

    if (students.length === 0) {
      return () => {
        active = false;
      };
    }

    const inClass = students.some((s) => String(s._id) === String(queryStudent));
    if (!inClass) {
      queueMicrotask(() => {
        if (!active) return;
        setProgress([]);
        setExercises([]);
        setExams([]);
        setDetailAverageScore(null);
        setProgressError(t.invalidStudent);
        setProgressLoading(false);
      });
      return () => {
        active = false;
      };
    }

    queueMicrotask(() => {
      if (!active) return;
      setProgressLoading(true);
      setProgressError(null);
    });

    apiClient
      .get(`/teacher/students/${queryStudent}/progress`)
      .then((res) => {
        if (!active) return;
        setProgress(Array.isArray(res.data?.progress) ? res.data.progress : []);
        setExercises(Array.isArray(res.data?.exercises) ? res.data.exercises : []);
        setExams(Array.isArray(res.data?.exams) ? res.data.exams : []);
        setDetailAverageScore(
          typeof res.data?.averageScore === 'number' ? res.data.averageScore : null,
        );
      })
      .catch((err) => {
        if (!active) return;
        setProgress([]);
        setExercises([]);
        setExams([]);
        setDetailAverageScore(null);
        const msg = err?.response?.data?.message || t.progressError;
        setProgressError(msg);
        if (err?.response?.status !== 403) showToast(msg, 'error');
      })
      .finally(() => {
        if (active) setProgressLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queryStudent, students, showToast, language, t.invalidStudent, t.progressError]);

  const statusLabel = (status) => {
    if (status === 'completed') return t.statusCompleted;
    if (status === 'abandoned') return t.statusAbandoned;
    return t.statusStarted;
  };

  const selectStudent = useCallback(
    (id) => {
      setSearchParams({ student: String(id) });
    },
    [setSearchParams]
  );

  const clearSelection = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const totals = useMemo(() => {
    const lessonCorrect = progress.reduce((a, p) => a + (Number(p.correctCount) || 0), 0);
    const lessonWrong = progress.reduce((a, p) => a + (Number(p.wrongCount) || 0), 0);
    const examCorrect = exams.reduce((a, e) => a + (Number(e.correctCount) || 0), 0);
    const examWrong = exams.reduce((a, e) => a + (Number(e.wrongCount) || 0), 0);
    const correct = lessonCorrect + examCorrect;
    const wrong = lessonWrong + examWrong;
    const xp = progress.reduce((a, p) => a + (Number(p.xp) || 0), 0);
    const attempts = correct + wrong;
    const accuracy = attempts > 0 ? Math.round((100 * correct) / attempts) : null;
    const exerciseTime = exercises.reduce((a, e) => a + (Number(e.totalTimeSpent) || 0), 0);
    const examAvg = exams.length
      ? Math.round(exams.reduce((a, e) => a + (Number(e.score) || 0), 0) / exams.length)
      : null;
    return {
      correct,
      wrong,
      xp,
      accuracy,
      lessons: progress.length,
      exams: exams.length,
      exercises: exercises.length,
      exerciseTime,
      examAvg,
    };
  }, [progress, exercises, exams]);

  const displayAverage = detailAverageScore ?? selectedStudent?.averageScore ?? 0;

  const examTrendData = useMemo(
    () =>
      [...exams]
        .sort((a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0))
        .map((ex, idx) => ({
          label: ex.title?.length > 18 ? `${ex.title.slice(0, 16)}…` : ex.title || `#${idx + 1}`,
          score: ex.score ?? 0,
        })),
    [exams],
  );

  const chartLabels = useMemo(
    () => ({
      chartScoreSplit: t.chartScoreSplit,
      chartDifficulty: t.chartDifficulty,
      chartTopics: t.chartTopics,
      chartQuestionTime: t.chartQuestionTime,
      weakTopics: t.weakTopics,
      questionDetails: t.questionDetails,
      answer: t.answer,
    }),
    [t],
  );

  return (
    <TeacherPageShell
      maxWidthClass="max-w-6xl"
      title={t.title}
      subtitle={t.subtitle}
      headerAside={
        !listLoading && students.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
              <Users size={16} className="text-teal-500 shrink-0" aria-hidden />
              {t.studentsCount(students.length)}
            </span>
            {classAverage != null && (
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200">
                <BarChart3 size={16} className="text-emerald-500 shrink-0" aria-hidden />
                {t.classAvg}: <strong className="text-slate-900 dark:text-white">{classAverage}</strong>
              </span>
            )}
          </div>
        ) : null
      }
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 -mt-2">
        <Sparkles size={14} aria-hidden />
        {language === 'EN' ? 'Live class data' : 'Canlı sınıf verisi'}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <aside className="lg:col-span-4 space-y-4">
          <Card className="p-0 overflow-hidden">
            <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-2">
              <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                <Users size={18} className="text-teal-500" aria-hidden />
                {t.classList}
              </h2>
              {queryStudent && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline shrink-0"
                >
                  {t.clearSelection}
                </button>
              )}
            </div>
            <div className="p-3 border-b border-slate-100 dark:border-slate-700">
              <label className="relative block">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/80 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </label>
            </div>

            <div className="max-h-[min(520px,55vh)] overflow-y-auto p-2">
              {listLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-sm">
                  <Loader2 className="animate-spin" size={18} aria-hidden />
                  …
                </div>
              ) : listError ? (
                <div className="flex items-start gap-2 p-4 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-xl m-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} aria-hidden />
                  {listError}
                </div>
              ) : students.length === 0 ? (
                <div className="px-4 py-8 text-center space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t.noStudents}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.rosterEmptyHint}</p>
                </div>
              ) : (
                <ul className="space-y-1">
                  {filteredStudents.map((s) => {
                    const active = String(queryStudent) === String(s._id);
                    return (
                      <li key={s._id}>
                        <button
                          type="button"
                          onClick={() => selectStudent(s._id)}
                          className={`w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                            active
                              ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25 ring-1 ring-teal-500/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                              active
                                ? 'bg-white/20 text-white'
                                : 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-200'
                            }`}
                          >
                            {initials(s.name)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold truncate">{s.name || '—'}</span>
                            <span
                              className={`block text-xs truncate ${
                                active ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                              }`}
                            >
                              {s.grade || '—'} · {t.avgShort} {s.averageScore ?? 0}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!listLoading && !listError && students.length > 0 && filteredStudents.length === 0 && (
                <p className="text-sm text-slate-500 px-4 py-6 text-center">—</p>
              )}
            </div>
          </Card>
        </aside>

        <section className="lg:col-span-8 space-y-4">
          {!queryStudent ? (
            <Card className="p-10 text-center border-dashed">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 mb-4">
                <GraduationCap size={32} aria-hidden />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t.selectPrompt}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{t.selectHint}</p>
            </Card>
          ) : progressError && !progressLoading ? (
            <Card className="p-8">
              <div className="flex flex-col sm:flex-row items-start gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle className="shrink-0" size={22} aria-hidden />
                <div>
                  <p className="font-semibold">{progressError}</p>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <X size={14} aria-hidden />
                    {t.clearSelection}
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {selectedStudent && (
                <Card className="p-5 sm:p-6 bg-gradient-to-br from-white to-teal-50/50 dark:from-slate-800 dark:to-teal-950/20 border-teal-100 dark:border-teal-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-lg font-bold text-white shadow-lg shadow-teal-600/30">
                      {initials(selectedStudent.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                        {selectedStudent.name}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {selectedStudent.email && (
                          <span className="inline-flex items-center gap-1.5 min-w-0">
                            <Mail size={14} className="shrink-0 text-slate-400" aria-hidden />
                            <span className="truncate">{selectedStudent.email}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={14} className="text-slate-400" aria-hidden />
                          {t.grade}: {selectedStudent.grade || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Target size={14} className="text-slate-400" aria-hidden />
                          {t.avgExamHint}{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {displayAverage}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t.summaryLessons, value: totals.lessons, icon: BookOpen, tone: 'text-sky-600 dark:text-sky-400' },
                  { label: t.summaryCorrect, value: totals.correct, icon: Target, tone: 'text-emerald-600 dark:text-emerald-400' },
                  { label: t.summaryWrong, value: totals.wrong, icon: AlertCircle, tone: 'text-rose-600 dark:text-rose-400' },
                  { label: t.summaryXp, value: totals.xp, icon: Zap, tone: 'text-amber-600 dark:text-amber-400' },
                ].map((m) => (
                  <Card key={m.label} className="p-4">
                    <div className={`inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/80 p-2 ${m.tone}`}>
                      <m.icon size={18} aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{m.value}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {m.label}
                    </p>
                  </Card>
                ))}
              </div>

              {exams.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4">
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/80 p-2 text-sky-600 dark:text-sky-400">
                      <FileText size={18} aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {totals.exams}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t.summaryExams}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/80 p-2 text-brand-600 dark:text-brand-400">
                      <BarChart3 size={18} aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {totals.examAvg != null ? `%${totals.examAvg}` : '—'}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t.avgExamHint}
                    </p>
                  </Card>
                </div>
              )}

              {exercises.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-4">
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/80 p-2 text-sky-600 dark:text-sky-400">
                      <Dumbbell size={18} aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {totals.exercises}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t.summaryExercises}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700/80 p-2 text-teal-600 dark:text-teal-400">
                      <Clock size={18} aria-hidden />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatDuration(totals.exerciseTime, language)}
                    </p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {t.summaryExerciseTime}
                    </p>
                  </Card>
                </div>
              )}

              {totals.accuracy != null && totals.accuracy >= 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.accuracy}</span>
                    <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{totals.accuracy}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, totals.accuracy)}%` }}
                    />
                  </div>
                </Card>
              )}

              {exams.length > 0 && (
                <div className="space-y-4">
                  {exams.length > 1 && (
                    <Card className="p-5">
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-brand-500" aria-hidden />
                        {t.examTrendTitle}
                      </h3>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={examTrendData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={56} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                          <Tooltip formatter={(v) => [`%${v}`, t.examScore]} />
                          <Line type="monotone" dataKey="score" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 px-1">
                      <FileText size={18} className="text-sky-500" aria-hidden />
                      {t.examAnalysisTitle}
                    </h3>
                    <div className="space-y-4">
                      {exams.map((ex) => (
                        <StudentExamAnalysisPanel
                          key={String(ex.examId)}
                          exam={ex}
                          labels={chartLabels}
                          language={language}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Card className="p-0 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2">
                  <BarChart3 size={18} className="text-teal-500" aria-hidden />
                  <h3 className="font-bold text-slate-800 dark:text-white">{t.lessons}</h3>
                </div>

                {progressLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
                    <Loader2 className="animate-spin" size={18} aria-hidden />
                    {t.loadingProgress}
                  </div>
                ) : progress.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 px-4 py-12 text-center">{t.noProgress}</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {progress.map((p) => {
                      const c = Number(p.correctCount) || 0;
                      const w = Number(p.wrongCount) || 0;
                      const sum = c + w;
                      const pct = sum > 0 ? Math.round((100 * c) / sum) : 0;
                      return (
                        <div
                          key={String(p.lessonId)}
                          className="px-4 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 dark:text-white truncate">
                                {p.lessonTitle || '—'}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Target size={12} aria-hidden /> {c} {t.correctCol.toLowerCase()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                                  <AlertCircle size={12} aria-hidden /> {w} {t.wrongCol.toLowerCase()}
                                </span>
                                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                  <Zap size={12} aria-hidden /> {p.xp ?? 0} XP
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock size={12} aria-hidden />
                                  {formatRelativeTime(p.lastAttempt, language)}
                                </span>
                              </div>
                            </div>
                            <div className="w-full sm:w-40 shrink-0">
                              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
                                {sum > 0 ? (
                                  <>
                                    <div
                                      className="h-full bg-emerald-500"
                                      style={{ width: `${pct}%` }}
                                      title={`${pct}%`}
                                    />
                                    <div className="h-full flex-1 bg-rose-400/80" />
                                  </>
                                ) : (
                                  <div className="h-full w-full bg-slate-200 dark:bg-slate-600" />
                                )}
                              </div>
                              <p className="mt-1 text-[10px] text-center text-slate-400 uppercase tracking-wider">
                                {sum > 0 ? t.correctPct(pct) : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card className="p-0 overflow-hidden">
                <div className="border-b border-slate-100 dark:border-slate-700 px-4 py-3 flex items-center gap-2">
                  <Dumbbell size={18} className="text-sky-500" aria-hidden />
                  <h3 className="font-bold text-slate-800 dark:text-white">{t.exercises}</h3>
                </div>

                {progressLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
                    <Loader2 className="animate-spin" size={18} aria-hidden />
                    {t.loadingProgress}
                  </div>
                ) : exercises.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 px-4 py-12 text-center">{t.noExercises}</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {exercises.map((ex) => (
                      <div
                        key={String(ex.exerciseId)}
                        className="px-4 py-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">{ex.name || '—'}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                                <Target size={12} aria-hidden />
                                {ex.score ?? '—'} {t.exerciseScore.toLowerCase()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BookOpen size={12} aria-hidden />
                                {ex.completedQuestions ?? 0}/{ex.totalQuestions ?? '—'} {t.questionsDone.toLowerCase()}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock size={12} aria-hidden />
                                {formatDuration(ex.totalTimeSpent, language)}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 font-medium">
                                {statusLabel(ex.status)}
                              </span>
                              {ex.completedAt && (
                                <span className="inline-flex items-center gap-1">
                                  {formatRelativeTime(ex.completedAt, language)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </section>
      </div>
    </TeacherPageShell>
  );
}
