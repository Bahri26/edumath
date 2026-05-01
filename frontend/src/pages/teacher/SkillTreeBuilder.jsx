import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function SkillTreeBuilder() {
  const { showToast } = useToast();
  const [classLevel, setClassLevel] = useState("9. Sınıf");
  const [subject, setSubject] = useState("Matematik");
  const [topics, setTopics] = useState([]);
  const [newTopic, setNewTopic] = useState("");
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingLessonFor, setAddingLessonFor] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .get(`/topics?classLevel=${encodeURIComponent(classLevel)}&subject=${encodeURIComponent(subject)}`)
      .then((res) => {
        if (active) setTopics(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (active) {
          setTopics([]);
          showToast("Konular yüklenemedi", "error");
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [classLevel, subject, refresh, showToast]);

  const addTopic = async () => {
    const name = newTopic.trim();
    if (!name) {
      showToast("Konu adı boş olamaz", "error");
      return;
    }
    try {
      await apiClient.post("/topics", { name, classLevel, subject });
      setNewTopic("");
      setRefresh((r) => !r);
      showToast("Konu eklendi", "success");
    } catch (err) {
      showToast(err?.response?.data?.message || "Konu eklenemedi", "error");
    }
  };

  const addLesson = async (topicId) => {
    const title = newLessonTitle.trim();
    if (!title) {
      showToast("Ders adı boş olamaz", "error");
      return;
    }
    try {
      await apiClient.post(`/topics/${topicId}/lessons`, { title });
      setNewLessonTitle("");
      setAddingLessonFor(null);
      setRefresh((r) => !r);
      showToast("Ders eklendi", "success");
    } catch (err) {
      const msg = err?.response?.data?.message || "Ders eklenemedi";
      showToast(msg, "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-black mb-6">Konu / Ders Yönetimi</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          className="p-2 rounded border focus:ring-2 focus:ring-indigo-500"
          aria-label="Sınıf"
        >
          {["5. Sınıf", "6. Sınıf", "7. Sınıf", "8. Sınıf", "9. Sınıf", "10. Sınıf", "11. Sınıf", "12. Sınıf"].map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="p-2 rounded border focus:ring-2 focus:ring-indigo-500"
          aria-label="Ders"
        >
          {["Matematik", "Fizik", "Kimya", "Biyoloji", "Türkçe"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Yeni konu adı"
          className="p-2 rounded border flex-1 min-w-[200px] focus:ring-2 focus:ring-indigo-500"
          aria-label="Yeni konu adı"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTopic();
            }
          }}
        />
        <button onClick={addTopic} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Konu Ekle
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-500">
          Bu sınıf ve ders için henüz konu yok. Yukarıdan ekleyebilirsiniz.
        </div>
      ) : (
        <div className="space-y-6">
          {topics.map((topic) => (
            <div
              key={topic._id}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <h2 className="text-lg font-bold mb-2">{topic.name}</h2>
              <div className="flex flex-wrap gap-3 items-center">
                {(topic.lessons || []).map((lesson) => (
                  <span
                    key={lesson._id}
                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {lesson.title}
                  </span>
                ))}
                {addingLessonFor === topic._id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      autoFocus
                      value={newLessonTitle}
                      onChange={(e) => setNewLessonTitle(e.target.value)}
                      placeholder="Ders adı"
                      className="p-2 rounded border focus:ring-2 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLesson(topic._id);
                        }
                        if (e.key === "Escape") {
                          setAddingLessonFor(null);
                          setNewLessonTitle("");
                        }
                      }}
                    />
                    <button
                      onClick={() => addLesson(topic._id)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded text-sm font-semibold"
                    >
                      Kaydet
                    </button>
                    <button
                      onClick={() => {
                        setAddingLessonFor(null);
                        setNewLessonTitle("");
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded text-sm"
                    >
                      İptal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingLessonFor(topic._id)}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded hover:bg-indigo-200"
                  >
                    + Ders Ekle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
