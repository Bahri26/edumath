import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/api";
import { useToast } from "../../context/ToastContext";
import StudentPageShell from "../../components/student/StudentPageShell.jsx";

export default function SkillTree({ classLevel = "9. Sınıf", subject = "Matematik" }) {
  const { showToast } = useToast();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    apiClient
      .get(`/topics?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`)
      .then((res) => {
        if (active) setTopics(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!active) return;
        const msg = err?.response?.data?.message || "Konular yüklenemedi";
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [classLevel, subject, showToast]);

  if (loading) {
    return (
      <StudentPageShell title="Konu Ağacı" subtitle={`${classLevel} · ${subject}`} maxWidthClass="max-w-4xl">
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem]" />
          ))}
        </div>
      </StudentPageShell>
    );
  }

  if (error) {
    return (
      <StudentPageShell title="Konu Ağacı" maxWidthClass="max-w-4xl">
        <div className="p-6 rounded-[1.25rem] bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      </StudentPageShell>
    );
  }

  return (
    <StudentPageShell
      title="Konu Ağacı"
      subtitle={`${classLevel} · ${subject} — Konulara tıklayarak ders quizlerine git.`}
      maxWidthClass="max-w-4xl"
    >
      {topics.length === 0 ? (
        <div className="p-8 text-center bg-white/80 dark:bg-slate-800/80 rounded-[1.25rem] border border-sky-200/70 dark:border-slate-700 text-slate-500">
          Bu sınıf ve ders için henüz konu yok.
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white/95 dark:bg-slate-800/95 p-6 rounded-[1.25rem] border border-sky-200/60 dark:border-slate-700 shadow-sm"
            >
              <h2 className="text-lg font-bold mb-3 text-slate-800 dark:text-white">{topic.name}</h2>
              <div className="flex flex-wrap gap-3">
                {(topic.lessons || []).length === 0 ? (
                  <span className="text-xs text-slate-400">Henüz ders eklenmemiş</span>
                ) : (
                  topic.lessons.map((lesson) => (
                    <Link
                      key={lesson._id}
                      to={`/student/lesson/${lesson._id}`}
                      className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-2xl font-semibold bg-gradient-to-r from-sky-500/15 to-teal-500/15 dark:from-sky-500/20 dark:to-teal-500/20 text-sky-800 dark:text-sky-200 border border-sky-200/80 dark:border-slate-600 hover:brightness-95 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
                    >
                      {lesson.title}
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentPageShell>
  );
}
