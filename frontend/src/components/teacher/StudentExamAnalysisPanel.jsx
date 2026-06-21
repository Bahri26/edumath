import React, { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, TrendingDown } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { formatDuration } from '../../utils/formatDuration.js';
import { renderWithLatex } from '../../utils/latex.jsx';

const PIE_COLORS = ['#10b981', '#f43f5e'];
const DIFF_COLORS = { Kolay: '#10b981', Orta: '#f59e0b', Zor: '#f43f5e' };

function formatStudentAnswer(value) {
  if (!value) return '—';
  const trimmed = String(value).trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.order)) {
        return parsed.order.join(' → ');
      }
    } catch {
      /* plain text */
    }
  }
  return trimmed.length > 100 ? `${trimmed.slice(0, 100)}…` : trimmed;
}

export default function StudentExamAnalysisPanel({ exam, labels, language = 'TR' }) {
  const [showQuestions, setShowQuestions] = useState(false);
  const analysis = exam.analysis || {};
  const isEn = language === 'EN';

  const pieData = useMemo(
    () => [
      { name: isEn ? 'Correct' : 'Doğru', value: analysis.correct ?? exam.correctCount ?? 0 },
      { name: isEn ? 'Wrong' : 'Yanlış', value: analysis.wrong ?? exam.wrongCount ?? 0 },
    ],
    [analysis.correct, analysis.wrong, exam.correctCount, exam.wrongCount, isEn],
  );

  const difficultyData = analysis.difficultyBreakdown || [];
  const topicData = (analysis.topicWrong || []).slice(0, 8);
  const timeData = analysis.questionTimes || [];
  const hasCharts = pieData.some((d) => d.value > 0);

  return (
    <Card className="p-0 overflow-hidden border border-violet-100 dark:border-violet-900/40">
      <div className="px-4 py-4 sm:px-5 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 border-b border-violet-100 dark:border-violet-900/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">{exam.title || '—'}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2">
              {exam.classLevel && <span>{exam.classLevel}</span>}
              {exam.duration != null && <span>{exam.duration} dk</span>}
              {exam.totalTimeSpentSeconds != null && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} aria-hidden />
                  {formatDuration(exam.totalTimeSpentSeconds, language)}
                </span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-black text-brand-600 dark:text-brand-400 tabular-nums">%{exam.score ?? 0}</p>
            <p className="text-xs text-slate-500">
              {exam.correctCount ?? 0}D / {exam.wrongCount ?? 0}Y
            </p>
          </div>
        </div>
      </div>

      {hasCharts && (
        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {labels.chartScoreSplit}
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={2}
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {difficultyData.some((d) => d.total > 0) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                {labels.chartDifficulty}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={difficultyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="difficulty" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="correct" name={isEn ? 'Correct' : 'Doğru'} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="wrong" name={isEn ? 'Wrong' : 'Yanlış'} stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {topicData.length > 0 && (
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <TrendingDown size={14} aria-hidden />
            {labels.chartTopics}
          </p>
          <ResponsiveContainer width="100%" height={Math.max(160, topicData.length * 36)}>
            <BarChart layout="vertical" data={topicData} margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="topic" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="wrongCount" name={isEn ? 'Wrong' : 'Yanlış'} fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {timeData.length > 3 && (
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            {labels.chartQuestionTime}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timeData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="question" tick={{ fontSize: 10 }} label={{ value: 'Soru', position: 'insideBottom', offset: -2, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="s" />
              <Tooltip formatter={(v) => [`${v} sn`, isEn ? 'Time' : 'Süre']} />
              <Line type="monotone" dataKey="seconds" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(exam.weakTopics?.length > 0) && (
        <div className="px-4 sm:px-5 py-3 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
            {labels.weakTopics}: {(exam.weakTopics || []).join(', ')}
          </p>
        </div>
      )}

      {(exam.answerDetails?.length > 0) && (
        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={() => setShowQuestions((v) => !v)}
            className="w-full flex items-center justify-between gap-2 text-sm font-bold text-slate-800 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 min-h-[44px]"
            aria-expanded={showQuestions}
          >
            {labels.questionDetails} ({exam.answerDetails.length})
            {showQuestions ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {showQuestions && (
            <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto">
              {exam.answerDetails.map((ad, idx) => (
                <div
                  key={String(ad.questionId || idx)}
                  className={`p-3 rounded-xl text-sm border ${
                    ad.isCorrect
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                      : 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {ad.isCorrect ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    ) : (
                      <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {idx + 1}. {renderWithLatex(ad.questionText || '—')}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                        {ad.difficulty && (
                          <span
                            className="font-semibold px-1.5 py-0.5 rounded"
                            style={{ color: DIFF_COLORS[ad.difficulty] || '#64748b' }}
                          >
                            {ad.difficulty}
                          </span>
                        )}
                        {ad.topic && <span>{ad.topic}</span>}
                        {ad.timeSpentSeconds != null && (
                          <span>{formatDuration(ad.timeSpentSeconds, language)}</span>
                        )}
                      </div>
                      <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                        {labels.answer}: {formatStudentAnswer(ad.studentAnswer)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
