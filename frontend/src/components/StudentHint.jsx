import React, { useState } from "react";
import axios from "axios";

export default function StudentHint({ questionText, studentAnswer }) {
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getHint = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/ai/get-hint", { questionText, studentAnswer });
      setHint(res.data.hint);
    } catch (err) {
      setError(err.response?.data?.message || "Hata oluştu");
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={getHint} style={{marginTop:8, padding:8, background:'#ffb14f', color:'#222', border:'none', borderRadius:4}}>
        İpucu Al
      </button>
      {loading && <div>İpucu hazırlanıyor...</div>}
      {error && <div>Hata: {error}</div>}
      {hint && (
        <div style={{ background: "#fffbe6", padding: 12, borderRadius: 6, marginTop: 8 }}>
          <b>İpucu:</b> {hint}
        </div>
      )}
    </div>
  );
}
