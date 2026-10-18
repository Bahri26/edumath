import React, { useEffect, useState } from 'react';
import { Clock, Layers } from 'lucide-react';
import apiClient from '../../services/api';
import { renderWithLatex } from '../../utils/latex.jsx';
import Card from '../ui/Card.jsx';
import PreviewDialog from '../ui/PreviewDialog.jsx';
import QuestionStemCard from '../questions/QuestionStemCard.jsx';
import QuestionOptionGrid from '../questions/QuestionOptionGrid.jsx';
import { shouldUseLetterOnlyOptions } from '../../utils/questionLayout.js';

export default function ExamPreviewModal({ examId, onClose }) {
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await apiClient.get(`/exams/${examId}`);
        setExam(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Ön izleme yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    if (examId) load();
  }, [examId]);

  return (
    <PreviewDialog title="Sınav önizleme" onClose={onClose}>
          {loading ? (
            <div className="space-y-8 animate-pulse">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-slate-700" />
                  <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="h-8 w-20 rounded-xl bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-5 w-12 rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 mb-2" />
                    <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Array.from({ length: 4 }).map((__, j) => (
                        <div key={j} className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : exam ? (
            <div className="space-y-8">
              {/* Exam Summary */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">{exam.title || exam.name}</h2>
                  <p className="text-slate-500 text-sm">Oluşturulma: {new Date(exam.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 flex items-center gap-2 text-sm"><Clock size={16} /> {exam.duration} dk</span>
                  <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 flex items-center gap-2 text-sm"><Layers size={16} /> {exam.questions?.length || 0} soru</span>
                </div>
              </div>

              {/* Questions */}
              <div className="grid grid-cols-1 gap-5">
                {exam.questions && exam.questions.map((q, idx) => {
                  const hintText = String(q?.assessmentMeta?.hint || '').trim();
                  return (
                    <Card key={q._id || idx} className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-teal-50 text-teal-700">Soru {idx + 1}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${q.difficulty === 'Zor' ? 'bg-rose-50 text-rose-700' : q.difficulty === 'Orta' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{q.difficulty}</span>
                      </div>
                      <QuestionStemCard question={q} showMeta={false} className="mb-4" />
                      <QuestionOptionGrid options={q.options} correctAnswer={q.correctAnswer}
                        variant="list" showCorrect disabled letterOnly={shouldUseLetterOnlyOptions(q)} />
                      {hintText && (
                        <div className="mt-3 px-4 py-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/40 text-amber-800 dark:text-amber-200 text-sm">
                          <span className="font-black uppercase tracking-wider text-[10px] text-amber-700/80 dark:text-amber-200/80">İpucu</span>
                          <div className="mt-1">{renderWithLatex(hintText)}</div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
    </PreviewDialog>
  );
}
