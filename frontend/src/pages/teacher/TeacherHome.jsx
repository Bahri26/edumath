import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Bell,
  BookOpen,
  RefreshCw,
  Wand2,
  FileText,
  Trophy,
  Users,
  TrendingUp,
  BarChart3,
  LineChart,
  ChevronDown,
} from 'lucide-react';
import ActivityRow from '../../components/ui/ActivityRow';
import apiClient from '../../services/api';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import GuideDrawer from '../../components/help/GuideDrawer.jsx';
import { AuthContext } from '../../context/AuthContext';

const formatRelativeTime = (value) => {
  if (!value) return '-';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '-';
  const diffMs = Date.now() - then;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} dk önce`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} saat önce`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} gün önce`;
};

const truncate = (text, max = 44) => {
  const s = String(text || '').trim();
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max)}…`;
};

const difficultyLabel = (avg) => {
  if (avg == null || Number.isNaN(avg)) return '—';
  if (avg < 1.5) return 'Kolay';
  if (avg < 2.5) return 'Orta';
  return 'Zor';
};

const KpiStripSkeleton = () => (
  <Card className="p-6 col-span-full animate-pulse">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((k) => (
        <div key={k} className="space-y-2">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-600 rounded" />
          <div className="h-8 w-14 bg-slate-200 dark:bg-slate-600 rounded" />
        </div>
      ))}
    </div>
  </Card>
);

const KPI_ITEMS = [
  { key: 'students', title: 'Toplam öğrenci', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', getValue: (s) => s.totalStudents ?? 0 },
  { key: 'average', title: 'Sınıf ortalaması', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/30', getValue: (s) => `${s.classAverage ?? 0}%` },
  { key: 'exams', title: 'Aktif sınavlar', icon: BarChart3, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/30', getValue: (s) => s.activeExams ?? 0 },
  { key: 'questions', title: 'Soru bankası', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', getValue: (s) => s.totalQuestions ?? 0 },
];

const TeacherHome = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [stats, setStats] = useState(null);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState(null);
  const [students, setStudents] = useState([]);
  const [dashboardReports, setDashboardReports] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  const displayName = (user?.name && String(user.name).trim()) || 'Hocam';

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const res = await apiClient.get('/teacher/dashboard-summary');
      setStats(res.data?.stats ?? null);
      setDashboardReports(res.data?.reports ?? null);
    } catch (err) {
      setStats(null);
      setDashboardReports(null);
      const msg = err?.response?.data?.message || err?.message || 'Özet verileri yüklenemedi.';
      setDashboardError(msg);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    setStudentsError(null);
    try {
      const res = await apiClient.get('/teacher/students');
      setStudents(Array.isArray(res.data?.students) ? res.data.students : []);
    } catch (err) {
      setStudents([]);
      const msg = err?.response?.data?.message || err?.message || 'Öğrenci listesi yüklenemedi.';
      setStudentsError(msg);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadDashboard(), loadStudents()]);
  }, [loadDashboard, loadStudents]);

  const handleRetryAll = () => {
    void Promise.all([loadDashboard(), loadStudents()]);
  };

  const recentQuestionActivities = (dashboardReports?.recentQuestions || []).map((question, index) => {
    const title =
      (question.topic && String(question.topic).trim()) ||
      truncate(question.text) ||
      'Yeni soru';
    return {
      id: `question-${question._id || index}`,
      kind: 'question',
      name: title,
      subtitle: question.classLevel ? String(question.classLevel) : undefined,
      action: `${question.difficulty || 'Soru'} eklendi`,
      score: 0,
      time: formatRelativeTime(question.createdAt),
      sortValue: new Date(question.createdAt || 0).getTime(),
    };
  });

  const recentExamActivities = (dashboardReports?.recentExams || []).map((exam, index) => ({
    id: `exam-${exam._id || index}`,
    kind: 'exam',
    name: exam.title || 'Sınav',
    subtitle: exam.classLevel ? String(exam.classLevel) : undefined,
    action: `${exam.status === 'draft' ? 'Taslak' : 'Sınav'} kaydı`,
    score:
      Array.isArray(exam.results) && exam.results.length > 0
        ? Math.round(exam.results.reduce((sum, item) => sum + (item.score || 0), 0) / exam.results.length)
        : 0,
    time: formatRelativeTime(exam.createdAt),
    sortValue: new Date(exam.createdAt || 0).getTime(),
  }));

  const recentActivities = [...recentQuestionActivities, ...recentExamActivities]
    .sort((left, right) => (right.sortValue || 0) - (left.sortValue || 0))
    .slice(0, 8);

  const topicRows = (dashboardReports?.topicPerformance || []).slice(0, 6);
  const trendRows = (dashboardReports?.dailyTrend || []).slice(-7);

  return (
    <>
      <div className="animate-fade-in space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Hoş geldiniz, {displayName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {dashboardLoading
                ? 'Özet yükleniyor...'
                : dashboardError
                  ? 'Özet şu an gösterilemiyor. Aşağıdan tekrar deneyin.'
                  : stats
                    ? `${stats.totalStudents ?? 0} öğrenciniz var; sınıf ortalaması: ${stats.classAverage ?? 0}`
                    : 'Henüz özet yok.'}
            </p>
            {!dashboardLoading && stats && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Soru, sınav ve anket sayıları yalnızca sizin oluşturduğunuz kayıtları içerir.
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            size="md"
            className="self-start lg:self-auto"
            onClick={() => setIsGuideOpen(true)}
          >
            <div className="bg-brand-100 dark:bg-brand-900/40 p-2 rounded text-brand-600 dark:text-brand-300">
              <BookOpen size={16} />
            </div>
            <span>Kullanım Kılavuzu</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {dashboardError && !dashboardLoading && (
            <div className="col-span-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
              <span>{dashboardError}</span>
              <Button variant="outline" size="sm" onClick={loadDashboard} className="shrink-0">
                <RefreshCw size={14} /> Özeti yenile
              </Button>
            </div>
          )}
          {dashboardLoading ? (
            <KpiStripSkeleton />
          ) : stats ? (
            <Card className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {KPI_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 min-w-0 rounded-xl p-2 sm:p-0"
                    >
                      <div className={`shrink-0 p-2.5 rounded-xl ${item.bg}`}>
                        <Icon size={20} className={item.color} aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
                          {item.title}
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tabular-nums">
                          {item.getValue(stats)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : dashboardError ? null : (
            <div className="col-span-full flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-slate-600 dark:text-slate-300">Özet verisi henüz yok.</p>
              <Button variant="primary" size="md" onClick={handleRetryAll}>
                <RefreshCw size={16} /> Yeniden dene
              </Button>
            </div>
          )}
        </div>

        {!dashboardLoading && !dashboardError && stats && (topicRows.length > 0 || trendRows.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {topicRows.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-brand-600 dark:text-brand-400" size={20} aria-hidden />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Konu dağılımı (tüm sorularınız)</h3>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {topicRows.map((row) => (
                    <li key={row._id} className="flex justify-between gap-3 py-2.5 text-slate-700 dark:text-slate-200">
                      <span className="font-medium truncate">{row._id || '—'}</span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">
                        {row.total ?? 0} soru · ort. zorluk: {difficultyLabel(row.avgDifficulty)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            {trendRows.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <LineChart className="text-brand-600 dark:text-brand-400" size={20} aria-hidden />
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Son 7 gün — sınavlarınız</h3>
                </div>
                <ul className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                  {trendRows.map((row) => (
                    <li key={row._id} className="flex justify-between gap-3 py-2.5 text-slate-700 dark:text-slate-200">
                      <span className="font-mono text-xs sm:text-sm text-slate-600 dark:text-slate-300">{row._id}</span>
                      <span className="text-slate-500 dark:text-slate-400 shrink-0">{row.count ?? 0} sınav</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <Card className="p-6 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Son aktiviteler</h3>
              {!dashboardLoading && (
                <Button variant="outline" size="sm" onClick={loadDashboard} aria-label="Aktiviteleri yenile">
                  <RefreshCw size={14} /> Güncelle
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-xs uppercase">
                  <tr>
                    <th className="py-3 pl-4">Kayıt</th>
                    <th className="py-3 hidden sm:table-cell">İşlem</th>
                    <th className="py-3">Puan / tür</th>
                    <th className="py-3 text-right pr-4">Zaman</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {recentActivities.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                        Henüz gösterilecek aktivite yok
                      </td>
                    </tr>
                  ) : (
                    recentActivities.map((activity) => <ActivityRow key={activity.id} activity={activity} />)
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Öğrenci önizleme</h3>
                {!studentsLoading && (
                  <Button variant="outline" size="sm" onClick={loadStudents} aria-label="Öğrenci listesini yenile">
                    <RefreshCw size={14} />
                  </Button>
                )}
              </div>
              {studentsLoading ? (
                <ul className="space-y-3 animate-pulse">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <div className="h-4 flex-1 max-w-[60%] rounded bg-slate-200 dark:bg-slate-600" />
                      <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-600" />
                    </li>
                  ))}
                </ul>
              ) : studentsError ? (
                <div className="text-sm text-rose-600 dark:text-rose-400 space-y-2">
                  <p>{studentsError}</p>
                  <Button variant="outline" size="sm" onClick={loadStudents}>
                    Listeyi yenile
                  </Button>
                </div>
              ) : students.length === 0 ? (
                <div className="text-slate-500 dark:text-slate-400 text-sm">Öğrenci bulunamadı</div>
              ) : (
                <ul className="space-y-3">
                  {students.map((s) => (
                    <li key={s._id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-medium text-slate-700 dark:text-slate-200 block truncate">
                          {s.name || s.email}
                        </span>
                        {s.grade ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{s.grade}</span>
                        ) : null}
                      </div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                        Ort: {typeof s.averageScore === 'number' ? s.averageScore : 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-xl shadow-brand-900/20 dark:shadow-none">
              <h3 className="font-bold text-lg mb-2">Hızlı işlemler</h3>
              <p className="text-brand-100 text-sm mb-5">En sık kullandığınız kısayollar.</p>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 min-h-[44px]"
                onClick={() => navigate('/teacher/questions')}
              >
                <div className="bg-white p-2 rounded text-brand-600">
                  <Plus size={16} />
                </div>
                <span>Soru bankasına git</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 mt-3 min-h-[44px]"
                onClick={() => navigate('/teacher/exams')}
              >
                <div className="bg-white p-2 rounded text-rose-600">
                  <FileText size={16} />
                </div>
                <span>Sınav oluştur</span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 mt-3 min-h-[44px]"
                onClick={() => navigate('/teacher/exercises')}
              >
                <div className="bg-white p-2 rounded text-amber-500">
                  <Trophy size={16} />
                </div>
                <span>Egzersiz oluştur</span>
              </Button>
              <button
                type="button"
                onClick={() => setShowMoreActions((v) => !v)}
                className="mt-4 w-full flex items-center justify-center gap-2 text-sm font-semibold text-brand-100 hover:text-white min-h-[44px] rounded-xl hover:bg-white/10 transition-colors"
                aria-expanded={showMoreActions}
              >
                Diğer işlemler
                <ChevronDown size={16} className={`transition-transform ${showMoreActions ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {showMoreActions && (
                <div className="mt-2 space-y-2 pt-2 border-t border-white/15">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full bg-white/5 hover:bg-white/15 text-white border-white/10 min-h-[44px]"
                    onClick={() => navigate('/teacher/questions?aiGenerate=1')}
                  >
                    <div className="bg-white p-2 rounded text-violet-600">
                      <Wand2 size={16} />
                    </div>
                    <span>AI ile soru üret</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full bg-white/5 hover:bg-white/15 text-white border-white/10 min-h-[44px]"
                    onClick={() => navigate('/teacher/pattern-builder')}
                  >
                    <div className="bg-white p-2 rounded text-violet-600">
                      <Wand2 size={16} />
                    </div>
                    <span>Örüntü şablonu</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    className="w-full bg-white/5 hover:bg-white/15 text-white border-white/10 min-h-[44px]"
                    onClick={() => navigate('/teacher/surveys')}
                    title="Sınıfa anket veya duyuru"
                  >
                    <div className="bg-white p-2 rounded text-brand-600">
                      <Bell size={16} />
                    </div>
                    <span>Anket / duyuru</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <GuideDrawer audience="teacher" open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </>
  );
};

export default TeacherHome;
