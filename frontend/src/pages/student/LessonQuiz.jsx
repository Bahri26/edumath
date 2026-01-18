import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";
import { useParams } from "react-router-dom";

export default function LessonQuiz() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    apiClient.get(`/lessons/${lessonId}`).then(res => setLesson(res.data));
  }, [lessonId]);

  if (!lesson) return <div className="p-8">Yükleniyor...</div>;

  const handleSubmit = async () => {
    const res = await apiClient.post(`/lessons/${lessonId}/submit`, { answers });
    setResult(res.data);
  };

  if (result) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-4">Quiz Sonucu</h2>
        <div className="mb-4">Doğru: <b>{result.correct}</b> • Yanlış: <b>{result.wrong}</b> • XP: <b>{result.xp}</b></div>
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold" onClick={() => setResult(null)}>Tekrar Çöz</button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-8 animate-fade-in">
      <h2 className="text-xl font-bold mb-6">{lesson.title}</h2>
      <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
        {lesson.quiz.map((q, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="mb-2 font-semibold">{i + 1}. {q.question}</div>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, j) => (
                <label key={j} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name={`q${i}`} value={opt.text} checked={answers[i] === opt.text} onChange={() => setAnswers(a => { const b = [...a]; b[i] = opt.text; return b; })} />
                  <span>{opt.text}</span>
                </label>
              ))}
            </div>
            {q.explanation && <div className="mt-2 text-xs text-slate-500">{q.explanation}</div>}
          </div>
        ))}
        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">Gönder</button>
      </form>
    </div>
  );
}
