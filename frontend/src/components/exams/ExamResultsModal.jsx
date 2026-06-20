import React, { useEffect, useState } from 'react';
import { X, Users, TrendingDown, Clock, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import apiClient from '../../services/api';
import Button from '../ui/Button.jsx';
import { formatDuration } from '../../utils/formatDuration.js';
import { renderWithLatex } from '../../utils/latex.jsx';

const PHASE_LABELS = {
  scheduled: 'Henüz başlamadı',
  live: 'Aktif',
  ended: 'Süre doldu',
  draft: 'Taslak',
};

function formatStudentAnswer(value) {
  if (!value) return '—';
  const trimmed = String(value).trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.order)) {
        return parsed.order.join(' → ');
      }
      if (parsed && typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ');
      }
    } catch {
      /* plain text */
    }
  }
  return trimmed.length > 120 ? `${trimmed.slice(0, 120)}…` : trimmed;
}

export default function ExamResultsModal({ examId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  useEffect(() => {
    if (!examId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/teacher/exams/${examId}/results`);
        if (active) setData(res.data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Sonuçlar yüklenemedi');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [examId]);

  const exam = data?.exam;
  const summary = data?.summary;
  const students = data?.students || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {exam?.title || 'Sınav Sonuçları'}
            </h3>
            {exam && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {exam.classLevel} · {exam.duration} dk · {PHASE_LABELS[exam.schedulePhase] || exam.status}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {loading && <p className="text-slate-500">Yükleniyor…</p>}
          {error && <p className="text-rose-600">{error}</p>}

          {!loading && !error && summary && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900">
                  <div className="text-xs font-bold text-brand-600 uppercase">Katılım</div>
                  <div className="text-2xl font-black text-brand-700 dark:text-brand-300">{summary.participantCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                  <div className="text-xs font-bold text-emerald-600 uppercase">Ort. Puan</div>
                  <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">%{summary.avgScore}</div>
                </div>
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
                  <div className="text-xs font-bold text-violet-600 uppercase flex items-center gap-1">
                    <Clock size={12} /> Ort. Süre
                  </div>
                  <div className="text-lg font-black text-violet-700 dark:text-violet-300 mt-1">
                    {formatDuration(summary.avgTimeSpentSeconds)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="text-xs font-bold text-slate-500 uppercase">Sınıf</div>
                  <div className="text-2xl font-black text-slate-700 dark:text-slate-200">{summary.rosterCount ?? '—'}</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                  <div className="text-xs font-bold text-amber-600 uppercase">Oran</div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {summary.participationRate != null ? `%${summary.participationRate}` : '—'}
                  </div>
                </div>
              </div>

              {summary.difficultyAnalysis?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3">Zorluk bazlı yanlışlar</h4>
                  <div className="flex flex-wrap gap-2">
                    {summary.difficultyAnalysis.map((d) => (
                      <span
                        key={d.difficulty}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                          d.difficulty === 'Zor'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
                            : d.difficulty === 'Orta'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                        }`}
                      >
                        {d.difficulty}: {d.wrongCount} yanlış
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {summary.topicAnalysis?.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3">
                    <TrendingDown size={18} /> Zayıf Konu Analizi
                  </h4>
                  <div className="space-y-2">
                    {summary.topicAnalysis.slice(0, 8).map((t) => (
                      <div key={t.topic} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm">
                        <span className="text-slate-700 dark:text-slate-200 line-clamp-1">{t.topic}</span>
                        <span className="font-bold text-rose-600 shrink-0 ml-2">{t.wrongCount} yanlış</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3">
                  <Users size={18} /> Öğrenci Sonuçları
                </h4>
                {students.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center border border-dashed rounded-xl">Henüz sınav tamamlayan yok.</p>
                ) : (
                  <div className="space-y-3">
                    {students.map((s) => {
                      const sid = String(s.studentId);
                      const expanded = expandedStudentId === sid;
                      const details = s.answerDetails || [];
                      return (
                        <div key={sid} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedStudentId(expanded ? null : sid)}
                            className="w-full flex flex-wrap items-center gap-3 p-4 text-left bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <span className="font-semibold text-slate-800 dark:text-white flex-1 min-w-[120px]">{s.studentName}</span>
                            <span className="font-bold text-brand-600">%{s.score}</span>
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {s.correctCount}D / {s.wrongCount}Y
                            </span>
                            <span className="text-sm text-slate-500">{formatDuration(s.totalTimeSpentSeconds)}</span>
                            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                          {expanded ? (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                              {(s.weakTopics || []).length > 0 ? (
                                <p className="text-xs text-rose-600 dark:text-rose-400">
                                  Zayıf alanlar: {(s.weakTopics || []).join(', ')}
                                </p>
                              ) : null}
                              {details.length === 0 ? (
                                <p className="text-sm text-slate-500">Soru detayı kaydı yok (eski teslim).</p>
                              ) : (
                                <div className="space-y-2">
                                  {details.map((ad, idx) => (
                                    <div
                                      key={String(ad.questionId || idx)}
                                      className={`p-3 rounded-lg text-sm border ${
                                        ad.isCorrect
                                          ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20'
                                          : 'border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20'
                                      }`}
                                    >
                                      <div className="flex items-start gap-2 mb-1">
                                        {ad.isCorrect ? (
                                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                        ) : (
                                          <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <div className="font-medium text-slate-800 dark:text-slate-100">
                                            {idx + 1}. {renderWithLatex(ad.questionText || '—')}
                                          </div>
                                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-2">
                                            {ad.difficulty ? <span>{ad.difficulty}</span> : null}
                                            {ad.topic ? <span>{ad.topic}</span> : null}
                                            {ad.timeSpentSeconds != null ? (
                                              <span>{formatDuration(ad.timeSpentSeconds)}</span>
                                            ) : null}
                                          </div>
                                          <div className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                                            Cevap: {formatStudentAnswer(ad.studentAnswer)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        </div>
      </div>
    </div>
  );
}
