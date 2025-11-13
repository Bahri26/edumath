import React from 'react';
import { Link } from 'react-router-dom';

function QuickActionsTeacher() {
  return (
    <div className="kids-card mb-4">
      <h3 className="m-0" style={{ fontWeight: 700, marginBottom: 12 }}>⚡ Hızlı Aksiyonlar</h3>
      <div className="d-flex gap-2 flex-wrap">
        <Link to="/teacher/exams/create" className="kids-btn primary">➕ Sınav Oluştur</Link>
        <Link to="/teacher/surveys" className="kids-btn turquoise">📝 Anket Oluştur</Link>
        <Link to="/teacher/classes" className="kids-btn warning">🏫 Sınıf Ekle</Link>
        <Link to="/teacher/questions" className="kids-btn purple">❓ Soru Havuzu</Link>
      </div>
    </div>
  );
}

export default QuickActionsTeacher;
