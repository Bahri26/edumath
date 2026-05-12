import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/api";
import { useToast } from "../../context/ToastContext";
import StudentHint from "../../components/StudentHint.jsx";
import StudentPageShell from "../../components/student/StudentPageShell.jsx";

export default function LessonQuiz() {
  const { lessonId } = useParams();
  const { showToast } = useToast();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/lessons/${lessonId}`)
      .then((res) => {
        if (active) setLesson(res.data);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.response?.data?.message || "Ders yüklenemedi";
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [lessonId, showToast]);

  if (loading) {
    return (
      <StudentPageShell title="Quiz yükleniyor…" subtitle="" maxWidthClass="max-w-xl">
        <div className="space-y-3 animate-pulse">
          <div className="h-7 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
      </StudentPageShell>
    );
  }

  if (error) {
    return (
      <StudentPageShell title="Ders Quiz" maxWidthClass="max-w-xl">
        <div className="p-6 rounded-[1.25rem] bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      </StudentPageShell>
    );
  }

  if (!lesson) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/lessons/${lessonId}/submit`, { answers });
      setResult(res.data);
    } catch (err) {
      showToast(err?.response?.data?.message || "Cevaplar gönderilemedi", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <StudentPageShell title="Quiz Sonucu" subtitle="Sonuçların kaydedildi. İstersen tekrar dene!" maxWidthClass="max-w-xl">
        <div className="text-center space-y-4">
        <div className="mb-4 text-slate-700 dark:text-slate-200">
          Doğru: <b>{result.correct}</b> • Yanlış: <b>{result.wrong}</b> • XP: <b>{result.xp}</b>
        </div>
        <button
          className="min-h-[44px] px-8 py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-2xl font-bold hover:brightness-105"
          type="button"
          onClick={() => {
            setResult(null);
            setAnswers([]);
          }}
        >
          Tekrar Çöz
        </button>
        </div>
      </StudentPageShell>
    );
  }

  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];

  if (quiz.length === 0) {
    return (
      <StudentPageShell title={lesson.title} maxWidthClass="max-w-xl">
        <p className="text-center text-slate-500 dark:text-slate-400 rounded-[1.25rem] border border-sky-200/60 dark:border-slate-700 bg-white/80 dark:bg-slate-800/60 py-12 px-6">Bu derste henüz quiz yok.</p>
      </StudentPageShell>
    );
  }

  return (
    <StudentPageShell title={lesson.title} subtitle="Her soruda bir seçenek işaretle, ipucunu gerektiğinde kullan." maxWidthClass="max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-6"
      >
        {quiz.map((q, i) => (
          <div
            key={i}
            className="bg-white/95 dark:bg-slate-800/95 p-5 rounded-[1.25rem] border border-sky-200/60 dark:border-slate-700 shadow-sm"
          >
            <div className="mb-2 font-semibold">
              {i + 1}. {q.question}
            </div>
            <div className="flex flex-col gap-2">
              {(q.options || []).map((opt, j) => (
                <label key={j} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={opt.text}
                    checked={answers[i] === opt.text}
                    onChange={() =>
                      setAnswers((a) => {
                        const b = [...a];
                        b[i] = opt.text;
                        return b;
                      })
                    }
                  />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
            <StudentHint
              questionText={q.question}
              studentAnswer={answers[i] || ''}
              topic={lesson.title}
              compact
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="w-full min-h-[48px] py-3 bg-gradient-to-r from-sky-500 to-teal-500 text-white rounded-2xl font-bold hover:brightness-105 disabled:opacity-50"
        >
          {submitting ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>
    </StudentPageShell>
  );
}
