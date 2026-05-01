import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import apiClient from "../../services/api";
import { useToast } from "../../context/ToastContext";
import StudentHint from "../../components/StudentHint.jsx";

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
      <div className="max-w-xl mx-auto p-8 space-y-3 animate-pulse">
        <div className="h-7 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      </div>
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
      <div className="max-w-xl mx-auto p-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Quiz Sonucu</h2>
        <div className="mb-4">
          Doğru: <b>{result.correct}</b> • Yanlış: <b>{result.wrong}</b> • XP: <b>{result.xp}</b>
        </div>
        <button
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
          onClick={() => {
            setResult(null);
            setAnswers([]);
          }}
        >
          Tekrar Çöz
        </button>
      </div>
    );
  }

  const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : [];

  if (quiz.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center text-slate-500">
        Bu derste henüz quiz yok.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 animate-fade-in">
      <h2 className="text-xl font-bold mb-6">{lesson.title}</h2>
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
            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700"
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
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Gönderiliyor…' : 'Gönder'}
        </button>
      </form>
    </div>
  );
}
