import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";

export default function SkillTreeBuilder() {
  const [classLevel, setClassLevel] = useState("9. Sınıf");
  const [subject, setSubject] = useState("Matematik");
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    apiClient.get(`/topics?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`)
      .then(res => setTopics(res.data));
  }, [classLevel, subject, refresh]);

  const addTopic = async () => {
    if (!newTopic.trim()) return;
    await apiClient.post("/topics", { name: newTopic, classLevel, subject });
    setNewTopic("");
    setRefresh(r => !r);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-black mb-6">Konu/Ders Yönetimi</h1>
      <div className="flex gap-4 mb-6">
        <select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="p-2 rounded border">
          {["5. Sınıf","6. Sınıf","7. Sınıf","8. Sınıf","9. Sınıf","10. Sınıf","11. Sınıf","12. Sınıf"].map(l => <option key={l}>{l}</option>)}
        </select>
        <select value={subject} onChange={e => setSubject(e.target.value)} className="p-2 rounded border">
          {["Matematik","Fizik","Kimya","Biyoloji","Türkçe"].map(s => <option key={s}>{s}</option>)}
        </select>
        <input value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Yeni konu adı" className="p-2 rounded border flex-1" />
        <button onClick={addTopic} className="px-4 py-2 bg-indigo-600 text-white rounded">Konu Ekle</button>
      </div>
      <div className="space-y-6">
        {topics.map(topic => (
          <div key={topic._id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h2 className="text-lg font-bold mb-2">{topic.name}</h2>
            <div className="flex flex-wrap gap-3">
              {topic.lessons.map(lesson => (
                <span key={lesson._id} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg font-semibold text-emerald-700 dark:text-emerald-300">{lesson.title}</span>
              ))}
              <button className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded">+ Ders Ekle</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
