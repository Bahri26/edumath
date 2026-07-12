import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Clock, Download, Loader2 } from 'lucide-react';
import apiClient from '../../services/api';
import MatovaMark from '../../components/ui/MatovaMark.jsx';
import { printElementById } from '../../utils/printElement.js';
import { formatDuration } from '../../utils/formatDuration.js';

export default function SharedExamResultPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get(`/public/exam-results/${encodeURIComponent(token)}`);
        if (cancelled) return;
        setData(res.data?.data || res.data);
      } catch (err) {
        if (cancelled) return;
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          (status === 410 ? 'Bağlantının süresi dolmuş.' : 'Sonuç yüklenemedi.');
        setError(msg);
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const score = Number(data?.score ?? 0);
  const ok = score >= 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50/40 dark:from-slate-950 dark:to-slate-900 text-slate-800 dark:text-slate-100">
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-10 no-print">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 font-bold">
            <MatovaMark size={32} className="rounded-lg shadow-sm" />
            <span className="text-lg tracking-tight">
              Mato<span className="text-teal-600">va</span>
            </span>
          </Link>
          {data ? (
            <button
              type="button"
              onClick={() =>
                printElementById('shared-exam-result-print', {
                  title: `Matova — ${data.examTitle || 'Sınav sonucu'}`,
                })
              }
              className="inline-flex items-center gap-2 min-h-[40px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Download size={16} />
              Yazdır / PDF
            </button>
          ) : null}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 py-16" role="status">
            <Loader2 className="animate-spin" size={22} />
            Yükleniyor…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-900 p-6 text-center">
            <AlertTriangle className="mx-auto text-rose-500 mb-3" size={28} />
            <p className="font-semibold text-rose-800 dark:text-rose-200">{error}</p>
            <Link to="/" className="inline-block mt-4 text-sm font-bold text-teal-700 hover:underline">
              Matova ana sayfa
            </Link>
          </div>
        ) : (
          <div
            id="shared-exam-result-print"
            className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 sm:p-8 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300 mb-2">
              Sınav sonucu özeti
            </p>
            <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
              {data.examTitle}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{data.studentName}</p>

            <div className="mt-6 flex flex-col items-center">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                  ok
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                }`}
              >
                {ok ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                {ok ? 'Başarılı' : 'Geliştirme alanı'}
              </div>
              <p className={`font-display text-5xl font-semibold tabular-nums ${ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                {score}
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">puan</p>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
                <dt className="text-slate-500 text-xs">Doğru</dt>
                <dd className="font-bold text-lg">{data.correctCount ?? '—'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3">
                <dt className="text-slate-500 text-xs">Yanlış</dt>
                <dd className="font-bold text-lg">{data.wrongCount ?? '—'}</dd>
              </div>
              {data.totalTimeSpentSeconds != null ? (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 p-3 col-span-2 flex items-center gap-2">
                  <Clock size={16} className="text-slate-400" />
                  <div>
                    <dt className="text-slate-500 text-xs">Süre</dt>
                    <dd className="font-bold">{formatDuration(data.totalTimeSpentSeconds)}</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            {Array.isArray(data.weakTopics) && data.weakTopics.length > 0 ? (
              <div className="mt-5 rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 p-4">
                <h2 className="text-sm font-bold text-rose-800 dark:text-rose-200 mb-2">
                  Geliştirilecek konular
                </h2>
                <ul className="text-sm text-rose-700 dark:text-rose-300 space-y-1">
                  {data.weakTopics.map((topic, i) => (
                    <li key={i}>• {topic}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-5 text-sm text-emerald-700 dark:text-emerald-300 font-medium text-center">
                Belirgin bir eksik konu yok.
              </p>
            )}

            {data.submittedAt ? (
              <p className="mt-6 text-center text-xs text-slate-400">
                Teslim: {new Date(data.submittedAt).toLocaleString('tr-TR')}
              </p>
            ) : null}

            <p className="mt-4 text-center text-[11px] text-slate-400 no-print">
              Bu özet Matova üzerinden paylaşıldı. Cevap detayları gizlidir.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
