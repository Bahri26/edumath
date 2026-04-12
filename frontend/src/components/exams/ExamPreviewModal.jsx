import React, { useEffect, useState } from 'react';
import { X, Eye, Clock, Layers } from 'lucide-react';
import apiClient from '../../services/api';
import { renderWithLatex } from '../../utils/latex.jsx';
import Button from '../ui/Button.jsx';
import Card from '../ui/Card.jsx';

const normalizeOptions = (options) => {
  if (!Array.isArray(options)) return [];
  return options.map((opt) => {
    if (typeof opt === 'string') return { text: opt, image: '' };
    return { text: opt?.text || '', image: opt?.image || '' };
  });
};

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
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Eye size={22} />
            <span className="font-black tracking-wide">Sınav Önizleme</span>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} ariaLabel="Kapat">
            <X size={16} />
          </Button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div>Yükleniyor...</div>
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
                  <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 flex items-center gap-2 text-sm"><Clock size={16} /> {exam.duration} dk</span>
                  <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 flex items-center gap-2 text-sm"><Layers size={16} /> {exam.questions?.length || 0} soru</span>
                </div>
              </div>

              {/* Questions */}
              <div className="grid grid-cols-1 gap-5">
                {exam.questions && exam.questions.map((q, idx) => {
                  const opts = normalizeOptions(q.options);
                  return (
                    <Card key={q._id || idx} className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-indigo-50 text-indigo-700">Soru {idx + 1}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${q.difficulty === 'Zor' ? 'bg-rose-50 text-rose-700' : q.difficulty === 'Orta' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{q.difficulty}</span>
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-200 mb-4 leading-relaxed">{renderWithLatex(q.text)}</div>
                      {q.image && (
                        <div className="mb-3">
                          <img src={q.image} alt="Soru Görseli" className="max-h-56 w-full object-contain rounded-xl border border-slate-200 dark:border-slate-700" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {opts.map((opt, i) => (
                          <div key={i} className={`flex items-start gap-2 p-3 rounded-xl border ${opt.text === q.correctAnswer ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 dark:border-slate-700'}`}>
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold">{String.fromCharCode(65 + i)}</span>
                            <span className="text-sm flex-1">{opt.text}</span>
                            {opt.image && (
                              <img src={opt.image} alt={`Şık ${String.fromCharCode(65 + i)} Görseli`} className="w-14 h-14 object-contain rounded-lg border border-slate-200 dark:border-slate-700" />
                            )}
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
