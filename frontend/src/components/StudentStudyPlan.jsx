import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StudentStudyPlan({ weakTopics, goal, hoursPerDay, daysLeft }) {
  const [plan, setPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!weakTopics || !goal || !hoursPerDay || !daysLeft) return;
    setLoading(true);
    axios
      .post("/api/ai/study-plan", { weakTopics, goal, hoursPerDay, daysLeft })
      .then((res) => {
        setPlan(res.data.plan);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Hata oluştu");
        setLoading(false);
      });
  }, [weakTopics, goal, hoursPerDay, daysLeft]);

  if (loading) return <div>Çalışma planı hazırlanıyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  if (!plan) return <div>Çalışma planı yok</div>;

  return (
    <div>
      <h2>Kişiselleştirilmiş Çalışma Planı</h2>
      <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8 }}>
        <pre style={{ whiteSpace: "pre-wrap" }}>{plan}</pre>
      </div>
    </div>
  );
}
