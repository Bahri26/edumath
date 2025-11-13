import React, { useEffect, useState } from 'react';

const TARGETS = { students: 1250, lessons: 3420, success: 98 };

function StatsStrip() {
  const [stats, setStats] = useState({ students: 0, lessons: 0, success: 0 });

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const inc = {
      students: TARGETS.students / steps,
      lessons: TARGETS.lessons / steps,
      success: TARGETS.success / steps
    };
    let cur = { students: 0, lessons: 0, success: 0 };
    const timer = setInterval(() => {
      cur.students = Math.min(cur.students + inc.students, TARGETS.students);
      cur.lessons = Math.min(cur.lessons + inc.lessons, TARGETS.lessons);
      cur.success = Math.min(cur.success + inc.success, TARGETS.success);
      setStats({
        students: Math.floor(cur.students),
        lessons: Math.floor(cur.lessons),
        success: Math.floor(cur.success)
      });
      if (cur.students >= TARGETS.students) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="kids-grid-3 mb-4">
      <div className="kids-card purple text-center">
        <div style={{ fontSize: '2rem' }}>👨‍🎓</div>
        <h3 className="m-0" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.students}+</h3>
        <p className="muted m-0">Mutlu Öğrenci</p>
      </div>
      <div className="kids-card turquoise text-center">
        <div style={{ fontSize: '2rem' }}>📚</div>
        <h3 className="m-0" style={{ fontSize: '1.75rem', fontWeight: 800 }}>{stats.lessons}+</h3>
        <p className="muted m-0">Eğlenceli Ders</p>
      </div>
      <div className="kids-card yellow text-center">
        <div style={{ fontSize: '2rem' }}>🏆</div>
        <h3 className="m-0" style={{ fontSize: '1.75rem', fontWeight: 800 }}>%{stats.success}</h3>
        <p className="muted m-0">Başarı Oranı</p>
      </div>
    </div>
  );
}

export default StatsStrip;
