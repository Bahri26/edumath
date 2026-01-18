import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";

export default function SkillTree({ classLevel = "9. Sınıf", subject = "Matematik" }) {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/topics?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`)
      .then(res => setTopics(res.data))
      .finally(() => setLoading(false));
  }, [classLevel, subject]);

  if (loading) return <div className="p-8">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-black mb-6">Konu Ağacı</h1>
      <div className="space-y-6">
        {topics.map(topic => (
          <div key={topic._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold mb-2">{topic.name}</h2>
            <div className="flex flex-wrap gap-3">
              {topic.lessons.map(lesson => (
                <a key={lesson._id} href={`/student/lesson/${lesson._id}`} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all">
                  {lesson.title}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
