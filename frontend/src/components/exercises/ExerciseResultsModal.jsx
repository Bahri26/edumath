import React, { useEffect, useState } from 'react';
import { X, Users, BarChart3, Clock } from 'lucide-react';
import apiClient from '../../services/api';
import Button from '../ui/Button.jsx';
import { formatDuration } from '../../utils/formatDuration.js';

export default function ExerciseResultsModal({ exerciseId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!exerciseId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/exercises/${exerciseId}/results`);
        if (active) setData(res.data);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Sonuçlar yüklenemedi');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [exerciseId]);

  const exercise = data?.exercise;
  const summary = data?.summary;
  const students = data?.students || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {exercise?.name || 'Egzersiz Sonuçları'}
            </h3>
            {exercise && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {exercise.classLevel} · {exercise.totalQuestions} soru
                {exercise.timeLimit ? ` · ${exercise.timeLimit} dk limit` : ''}
                {exercise.topic ? ` · ${exercise.topic}` : ''}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900">
                  <div className="text-xs font-bold text-brand-600 uppercase">Tamamlayan</div>
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
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
                  <div className="text-xs font-bold text-amber-600 uppercase">Katılım</div>
                  <div className="text-2xl font-black text-amber-700 dark:text-amber-300">
                    {summary.participationRate != null ? `%${summary.participationRate}` : '—'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-3">
                  <Users size={18} /> Öğrenci Sonuçları
                </h4>
                {students.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center border border-dashed rounded-xl">
                    Henüz egzersizi tamamlayan öğrenci yok.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 pr-2">Öğrenci</th>
                          <th className="py-2 pr-2">Puan</th>
                          <th className="py-2 pr-2">D/Y</th>
                          <th className="py-2 pr-2">Süre</th>
                          <th className="py-2">Ort. soru/sn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={String(s.studentId)} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 pr-2 font-medium text-slate-800 dark:text-white">{s.studentName}</td>
                            <td className="py-3 pr-2 font-bold text-brand-600">%{s.score}</td>
                            <td className="py-3 pr-2">{s.correctCount}/{s.wrongCount}</td>
                            <td className="py-3 pr-2 text-slate-600 dark:text-slate-300">{formatDuration(s.totalTimeSpent)}</td>
                            <td className="py-3 text-slate-500">{formatDuration(s.avgTimePerQuestion)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
