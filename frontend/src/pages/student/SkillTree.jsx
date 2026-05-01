import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../services/api";
import { useToast } from "../../context/ToastContext";

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
      <div className="max-w-4xl mx-auto p-8 space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-black mb-6">Konu Ağacı</h1>
      {topics.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500">
          Bu sınıf ve ders için henüz konu yok.
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <h2 className="text-lg font-bold mb-2">{topic.name}</h2>
              <div className="flex flex-wrap gap-3">
                {(topic.lessons || []).length === 0 ? (
                  <span className="text-xs text-slate-400">Henüz ders eklenmemiş</span>
                ) : (
                  topic.lessons.map((lesson) => (
                    <Link
                      key={lesson._id}
                      to={`/student/lesson/${lesson._id}`}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
    </div>
  );
}
