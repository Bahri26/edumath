import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

export default function TeacherReportView({ examResults }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!examResults) return;
    setLoading(true);
    axios
      .post("/api/ai/teacher-report", { examResults })
      .then((res) => {
        setReport(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Hata oluştu");
        setLoading(false);
      });
  }, [examResults]);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  if (!report) return <div>Rapor yok</div>;

  // Grafik verileri
  const topicLabels = report.topicReport.map((t) => t.topic);
  const topicPercents = report.topicReport.map((t) => t.percent);
  const studentLabels = report.allScores.map((s) => s.studentId);
  const studentScores = report.allScores.map((s) => s.score);

  return (
    <div>
      <h2>Öğretmen Raporu</h2>
      <div style={{ maxWidth: 600 }}>
        <Bar
          data={{
            labels: topicLabels,
            datasets: [
              {
                label: "Konu Bazlı Başarı (%)",
                data: topicPercents,
                backgroundColor: "#4f8cff",
              },
            ],
          }}
        />
      </div>
      <div style={{ maxWidth: 600, marginTop: 40 }}>
        <Pie
          data={{
            labels: studentLabels,
            datasets: [
              {
                label: "Öğrenci Skorları",
                data: studentScores,
                backgroundColor: [
                  "#4f8cff",
                  "#ffb14f",
                  "#4fff8c",
                  "#ff4f8c",
                  "#8c4fff",
                ],
              },
            ],
          }}
        />
      </div>
      <div style={{ marginTop: 40 }}>
        <h3>AI Özet ve Öneriler</h3>
        <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>{report.summary}</pre>
        </div>
      </div>
    </div>
  );
}
