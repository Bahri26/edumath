import React, { useEffect, useState } from "react";
import apiClient from "../../services/api";

export default function StudentProgressDashboard() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    apiClient.get("/teacher/students").then(res => setStudents(res.data.students || []));
  }, []);

  const loadProgress = (studentId) => {
    apiClient.get(`/teacher/students/${studentId}/progress`).then(res => setProgress(res.data.progress || []));
    setSelected(studentId);
  };

  return (
    <div className="max-w-5xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl font-black mb-6">Öğrenci Takibi</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <h2 className="font-bold mb-2">Sınıf Listesi</h2>
          {students.map(s => (
            <button key={s._id} onClick={() => loadProgress(s._id)} className={`block w-full text-left px-4 py-2 rounded-lg ${selected===s._id ? 'bg-indigo-600 text-white' : 'bg-slate-100 hover:bg-indigo-50'}`}>{s.name} <span className="text-xs text-slate-400">({s.grade})</span></button>
          ))}
        </div>
        <div className="md:col-span-2">
          {selected && (
            <div>
              <h2 className="font-bold mb-4">İlerleme</h2>
              {progress.length === 0 ? <div>Henüz veri yok.</div> : (
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-2">Ders</th>
                      <th>Quiz Doğru</th>
                      <th>Quiz Yanlış</th>
                      <th>XP</th>
                      <th>Son Deneme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map(p => (
                      <tr key={p.lessonId} className="border-t">
                        <td className="p-2">{p.lessonTitle}</td>
                        <td className="text-green-600 font-bold">{p.correctCount}</td>
                        <td className="text-rose-600 font-bold">{p.wrongCount}</td>
                        <td className="text-indigo-700 font-bold">{p.xp}</td>
                        <td>{p.lastAttempt ? new Date(p.lastAttempt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
