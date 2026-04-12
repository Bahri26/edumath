import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StudentExamAnalysis({ examAnswers }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!examAnswers) return;
    setLoading(true);
    axios
      .post("/api/ai/exam-result-analysis", { answers: examAnswers, studentId: "currentStudent" })
      .then((res) => {
        setResult(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Hata oluştu");
        setLoading(false);
      });
  }, [examAnswers]);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  if (!result) return <div>Analiz yok</div>;

  return (
    <div>
      <h2>Sınav Sonucu Analizi</h2>
      <div>Puan: {result.score} / 100</div>
      <div>Doğru: {result.correct} / {result.total}</div>
      <div>Toplam Süre: {Math.round((result.totalTimeMs || 0) / 1000)} sn</div>
      <h3>Konu Bazlı Başarı</h3>
      <ul>
        {result.topicReport.map((t) => (
          <li key={t.topic}>{t.topic}: {t.percent}% ({t.correct}/{t.total})</li>
        ))}
      </ul>
      <h3>AI Analiz ve Öneriler</h3>
      <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
        <pre style={{ whiteSpace: "pre-wrap" }}>{result.analysis}</pre>
      </div>
      <h3>Detaylı Geri Bildirimler</h3>
      <ul>
        {result.feedbacks.map((f, i) => (
          <li key={f.questionId || i}>
            Soru: {f.questionId} | {f.isCorrect ? "Doğru" : "Yanlış"} | {f.feedback} | Süre: {f.timeMs ? Math.round(f.timeMs/1000) + " sn" : "-"} | Konu: {f.topic}
          </li>
        ))}
      </ul>
    </div>
  );
}
