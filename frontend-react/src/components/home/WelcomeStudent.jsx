import React from 'react';
import { Link } from 'react-router-dom';

function WelcomeStudent({ user }) {
  return (
    <div className="kids-card mb-4">
      <h1 style={{ fontWeight: 800, fontSize: '2rem', margin: 0 }}>👨‍🎓 Merhaba {user?.name || 'Öğrenci'}!</h1>
      <p className="muted mb-3">Öğrenme macerana devam etmeye hazır mısın? 🌈</p>
      <div className="d-flex gap-2 flex-wrap">
        <Link to="/student/learning-path" className="kids-btn primary">📚 Öğrenmeye Devam Et</Link>
        <Link to="/student/exams" className="kids-btn turquoise">🧪 Sınavlarım</Link>
        <Link to="/student/surveys" className="kids-btn warning">📝 Anketler</Link>
        <Link to="/student/challenge" className="kids-btn purple">🔥 Günlük Görev</Link>
      </div>
    </div>
  );
}

export default WelcomeStudent;
