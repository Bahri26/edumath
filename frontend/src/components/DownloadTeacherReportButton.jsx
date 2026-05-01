import React from "react";
import { teacherReport } from "../services/aiService";

export default function DownloadTeacherReportButton({ examResults }) {
  const handleDownload = async () => {
    const data = await teacherReport({ examResults });
    const csv = [
      ["Konu", "Doğru", "Toplam", "%"],
      ...data.topicReport.map(t => [t.topic, t.correct, t.total, t.percent])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button onClick={handleDownload} style={{marginTop:16, padding:8, background:'#4f8cff', color:'#fff', border:'none', borderRadius:4}}>
      Raporu CSV Olarak İndir
    </button>
  );
}
