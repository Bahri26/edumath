import React from 'react';
import { Link } from 'react-router-dom';

function WelcomeTeacher({ user }) {
  return (
    <div className="kids-card mb-4">
      <h1 style={{ fontWeight: 800, fontSize: '2rem', margin: 0 }}>👩‍🏫 Hoşgeldiniz {user?.name || 'Öğretmen'}!</h1>
      <p className="muted mb-3">Bugün sınıflarınızı ileri taşımaya hazır mısınız? 🚀</p>
      <div className="d-flex gap-2 flex-wrap">
        <Link to="/teacher/exams/create" className="kids-btn primary">➕ Sınav Oluştur</Link>
        <Link to="/teacher/surveys" className="kids-btn turquoise">📝 Anketler</Link>
        <Link to="/teacher/classes" className="kids-btn warning">🏫 Sınıflar</Link>
        <Link to="/teacher/questions" className="kids-btn purple">❓ Soru Havuzu</Link>
      </div>
    </div>
  );
}

export default WelcomeTeacher;
