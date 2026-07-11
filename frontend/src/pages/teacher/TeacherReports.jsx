import React, { useState, useContext, useEffect, useRef, useCallback } from 'react';
import {
  BarChart2,
  Users,
  AlertCircle,
  Download,
  Calendar,
  ChevronDown,
  CheckCircle,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LanguageContext } from '../../context/LanguageContext';
import apiClient from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { getClassReports } from '../../services/teacherService';
import TeacherPageShell from '../../components/teacher/TeacherPageShell.jsx';
import Button from '../../components/ui/Button.jsx';

const RANGE_OPTIONS = [7, 30, 90, 180];

const riskIssueTr = (avg) => {
  if (avg < 45) return 'Genel ortalama düşük; destek önerilir.';
  if (avg < 55) return 'Ortalama gelişim alanında; takip faydalı olur.';
  if (avg < 65) return 'Bazı konularda güçlendirme gerekebilir.';
  return 'Genel tablo stabil; bireysel takip yeterli.';
};

const riskIssueEn = (avg) => {
  if (avg < 45) return 'Low overall average; support recommended.';
  if (avg < 55) return 'Room to improve; follow-up helps.';
  if (avg < 65) return 'May need reinforcement in some topics.';
  return 'Stable overall; individual check-ins suffice.';
};

const REPORT_TRANSLATIONS = {
  TR: {
    title: 'Sınıf Raporları',
    subtitle: 'Soru havuzu, sınav sonuçları ve ipucu istekleri (canlı veri).',
    downloadPDF: 'Yazdır / PDF',
    periodAvg: 'Dönem sınav ort.',
    classAvg: 'Sınıf ortalaması',
    examParticipation: 'Sınava katılım',
    topTopic: 'En geniş soru havuzu',
    needsSupport: 'Sınavda zorlanılan konu',
    topicPerformance: 'Branş / konu soru dağılımı',
    topicPerformanceHint: 'Havuzdaki sorularınızın branşlara göre oranı.',
    riskAnalysis: 'Düşük ortalamalı öğrenciler',
    viewAll: 'Tüm listeyi gör',
    trendTitle: 'Günlük sınav ortalaması (teslim tarihi)',
    noTrend: 'Bu aralıkta sınav teslimi yok.',
    lastDays: (d) => `Son ${d} gün`,
    sixMonths: 'Son 6 ay',
    studentProgress: 'Öğrenci takibi',
  },
  EN: {
    title: 'Class Reports',
    subtitle: 'Question pool, exam results, and hint requests (live data).',
    downloadPDF: 'Print / PDF',
    periodAvg: 'Period exam avg.',
    classAvg: 'Class average',
    examParticipation: 'Exam participation',
    topTopic: 'Largest question pool',
    needsSupport: 'Struggling topic (exams)',
    topicPerformance: 'Subject question mix',
    topicPerformanceHint: 'Share of your authored questions by subject.',
    riskAnalysis: 'Lower average students',
    viewAll: 'View all',
    trendTitle: 'Daily exam average (submission date)',
    noTrend: 'No exam submissions in this range.',
    lastDays: (d) => `Last ${d} days`,
    sixMonths: 'Last 6 months',
    studentProgress: 'Student progress',
  },
};

const TeacherReports = () => {
  const { language } = useContext(LanguageContext);
  const { showToast } = useToast();
  const [rangeDays, setRangeDays] = useState(30);
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodRef = useRef(null);

  const [reportData, setReportData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [hintData, setHintData] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    const onDoc = (e) => {
      if (periodRef.current && !periodRef.current.contains(e.target)) {
        setPeriodOpen(false);
      }
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setReportsLoading(true);
    });
    getClassReports({ days: rangeDays })
      .then((data) => {
        if (active) setReportData(data);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.response?.data?.message || 'Raporlar alınamadı.';
        if (err?.response?.status !== 403) showToast(msg, 'error');
        setReportData(null);
      })
      .finally(() => active && setReportsLoading(false));
    return () => {
      active = false;
    };
  }, [rangeDays, showToast]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setHintLoading(true);
    });
    apiClient
      .get(`/teacher/hint-requests?days=${rangeDays}`)
      .then((res) => {
        if (active) setHintData(res?.data?.data || null);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.response?.data?.message || 'İpucu istekleri alınamadı.';
        if (err?.response?.status !== 403) showToast(msg, 'error');
        setHintData(null);
      })
      .finally(() => active && setHintLoading(false));
    return () => {
      active = false;
    };
  }, [rangeDays, showToast]);

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = language === 'EN' ? 'en-US' : 'tr-TR';
      return d.toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return '';
    }
  };

  const getText = (key) => REPORT_TRANSLATIONS[language]?.[key] || REPORT_TRANSLATIONS.TR[key];

  const dict = REPORT_TRANSLATIONS[language] || REPORT_TRANSLATIONS.TR;

  const stats = (() => {
    const s = reportData?.summary;
    if (!s) {
      return [
        { title: dict.classAvg, value: '—', icon: BarChart2, color: 'teal' },
        { title: dict.examParticipation, value: '—', icon: Users, color: 'blue' },
        { title: dict.topTopic, value: '—', icon: CheckCircle, color: 'green' },
        { title: dict.needsSupport, value: '—', icon: AlertCircle, color: 'red' },
      ];
    }
    const avgMain =
      s.periodAverage != null ? String(s.periodAverage) : String(s.classAverage ?? '—');
    const avgTitle = s.periodAverage != null ? dict.periodAvg : dict.classAvg;
    const part = `${s.participationRate ?? 0}%`;
    const top = s.topPoolSubject || '—';
    const weak = s.weakTopic || '—';
    return [
      {
        title: avgTitle,
        value: avgMain,
        sub:
          s.periodAverage != null && s.classAverage != null
            ? `${dict.classAvg}: ${s.classAverage}`
            : undefined,
        icon: BarChart2,
        color: 'teal',
      },
      {
        title: dict.examParticipation,
        value: part,
        sub:
          s.totalStudents > 0
            ? `${s.submissionsInPeriod || 0} ${language === 'EN' ? 'submissions' : 'teslim'}`
            : undefined,
        icon: Users,
        color: 'blue',
      },
      {
        title: dict.topTopic,
        value: top,
        sub: reportData?.topicPerformance?.[0]
          ? `${reportData.topicPerformance[0].poolShare}%`
          : undefined,
        icon: CheckCircle,
        color: 'green',
      },
      {
        title: dict.needsSupport,
        value: weak,
        sub: undefined,
        icon: AlertCircle,
        color: 'red',
      },
    ];
  })();

  const periodLabel = rangeDays === 180 ? dict.sixMonths : dict.lastDays(rangeDays);

  const getColorClass = (color) => {
    const colorMap = {
      teal: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return colorMap[color] || colorMap.teal;
  };

  const topicRows = reportData?.topicPerformance?.length
    ? reportData.topicPerformance
    : [];

  const riskRows = reportData?.studentRisks?.length ? reportData.studentRisks : [];

  const trendData = reportData?.dailyTrend?.length ? reportData.dailyTrend : [];

  const printReport = useCallback(() => {
    const style = document.createElement('style');
    style.setAttribute('data-teacher-report-print', '1');
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #teacher-report-print, #teacher-report-print * { visibility: visible !important; }
        #teacher-report-print { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
      }
    `;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  }, []);

  return (
    <TeacherPageShell
      maxWidthClass="max-w-6xl"
      title={getText('title')}
      subtitle={getText('subtitle')}
      headerAside={(
        <div className="flex gap-3">
          <div className="relative" ref={periodRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPeriodOpen((o) => !o);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm min-h-[44px]"
            >
              <Calendar size={16} />
              {periodLabel}
              <ChevronDown size={14} className={`opacity-50 transition ${periodOpen ? 'rotate-180' : ''}`} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1 z-20 min-w-[11rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1 text-sm">
                {RANGE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`block w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                      rangeDays === d ? 'text-teal-600 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setRangeDays(d);
                      setPeriodOpen(false);
                    }}
                  >
                    {d === 180 ? getText('sixMonths') : getText('lastDays')(d)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="success" size="md" onClick={printReport} icon={Download}>
            {getText('downloadPDF')}
          </Button>
        </div>
      )}
    >
      <div id="teacher-report-print" className="space-y-6">
        {reportsLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm py-6">
            <Loader2 className="animate-spin" size={16} />{' '}
            {language === 'EN' ? 'Loading reports…' : 'Raporlar yükleniyor…'}
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${getColorClass(stat.color)}`}>
                  <stat.icon size={24} />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
              {stat.sub && <p className="text-xs font-medium text-slate-400 mt-1">{stat.sub}</p>}
            </div>
          ))}
        </div>

        {trendData.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">
              {getText('trendTitle')}
            </h3>
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-600" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-slate-500" />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 11 }} width={36} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8 }}
                    formatter={(v, name) => [
                      v,
                      name === 'avgScore' ? (language === 'EN' ? 'Avg' : 'Ort') : name,
                    ]}
                    labelFormatter={(l) => l}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="#4f46e5" strokeWidth={2} dot={false} name="avgScore" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {!reportsLoading && trendData.length === 0 && reportData && (
          <div className="text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 px-6 py-4">
            {getText('noTrend')}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">
              {getText('topicPerformance')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{getText('topicPerformanceHint')}</p>
            <div className="space-y-5">
              {topicRows.length === 0 ? (
                <p className="text-sm text-slate-500">{language === 'EN' ? 'No authored questions yet.' : 'Henüz soru eklenmemiş.'}</p>
              ) : (
                topicRows.map((item) => (
                  <div key={item.subject}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.subject}</span>
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        %{item.poolShare}{' '}
                        <span className="text-xs font-normal text-slate-400">
                          ({item.total} {language === 'EN' ? 'q' : 'soru'})
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.poolShare >= 35
                            ? 'bg-teal-500'
                            : item.poolShare >= 20
                              ? 'bg-teal-400'
                              : 'bg-teal-300'
                        }`}
                        style={{ width: `${Math.min(100, item.poolShare)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">{getText('riskAnalysis')}</h3>
            </div>
            <div className="space-y-4">
              {riskRows.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {language === 'EN' ? 'No students in class yet.' : 'Sınıfta henüz öğrenci yok.'}
                </p>
              ) : (
                riskRows.map((student) => (
                  <Link
                    key={student._id}
                    to={`/teacher/student-progress?student=${student._id}`}
                    className="block p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 hover:border-teal-300 dark:hover:border-teal-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{student.name}</h4>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {language === 'EN' ? riskIssueEn(student.averageScore) : riskIssueTr(student.averageScore)}
                        </p>
                      </div>
                      <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-600 shrink-0">
                        {language === 'EN' ? 'Avg' : 'Ort'} {student.averageScore}
                      </span>
                    </div>
                  </Link>
                ))
              )}
              <Link
                to="/teacher/student-progress"
                className="block w-full py-2 text-center text-sm text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 font-medium"
              >
                {getText('viewAll')} → {getText('studentProgress')}
              </Link>
            </div>
          </div>
        </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-amber-500" size={20} />
            <div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {language === 'EN' ? 'Hint requests' : 'İpucu İstekleri'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'EN'
                  ? 'Topics where students asked for hints (same date range as above).'
                  : 'Öğrenciler hangi konularda en çok ipucu istedi? Üstteki dönemle aynı aralık.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {RANGE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  rangeDays === d
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {d === 180 ? getText('sixMonths') : getText('lastDays')(d)}
              </button>
            ))}
          </div>
        </div>

        {hintLoading ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Loader2 className="animate-spin" size={16} />{' '}
            {language === 'EN' ? 'Loading…' : 'Yükleniyor…'}
          </div>
        ) : !hintData || hintData.totalHints === 0 ? (
          <div className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">
            {language === 'EN' ? 'No hint requests in this range.' : 'Bu aralıkta öğrencilerden ipucu isteği yok.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                {language === 'EN' ? 'Top topics (hints)' : 'En Çok Zorlanılan Konular'}
              </h4>
              <ul className="space-y-2">
                {(hintData.byTopic || []).slice(0, 8).map((row, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-200 truncate pr-2">{row.topic || '—'}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{row.count}×</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                {language === 'EN' ? 'Most hints per student' : 'En Çok İpucu İsteyen Öğrenciler'}
              </h4>
              <ul className="space-y-2">
                {(hintData.byStudent || []).slice(0, 8).map((s, i) => (
                  <li
                    key={s.userId || i}
                    className="rounded-lg bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate pr-2">{s.name}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {s.count} {language === 'EN' ? 'hints' : 'ipucu'}
                      </span>
                    </div>
                    {s.topics?.length > 0 && (
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {s.topics.slice(0, 3).join(' · ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
                {language === 'EN' ? 'Recent requests' : 'Son İstekler'}
              </h4>
              <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(hintData.recent || []).slice(0, 12).map((r) => (
                  <li
                    key={r._id}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{r.studentName}</span>
                      <span className="text-slate-400 dark:text-slate-500">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.topic && <div className="text-amber-600 dark:text-amber-400 mt-0.5">{r.topic}</div>}
                    {r.questionPreview && (
                      <div className="mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">“{r.questionPreview}”</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4">
          {language === 'EN'
            ? 'Hints are recorded when a student explicitly requests a hint. This report shows where the class needs reinforcement.'
            : 'İpucu artık öğrenciye otomatik gösterilmez; öğrenci açıkça "İpucu al" düğmesine bastığında kaydedilir. Bu rapor, sınıfın hangi konularda eksiği olduğunu görmenizi sağlar.'}
        </p>
      </div>
    </TeacherPageShell>
  );
};

export default TeacherReports;
