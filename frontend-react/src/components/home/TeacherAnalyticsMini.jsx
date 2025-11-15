import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Skeleton from '../ui/common/Skeleton';
import useAuthReady from '../../hooks/useAuthReady';
import { AuthContext } from '../../contexts/AuthContext.jsx';

function TeacherAnalyticsMini() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const authReady = useAuthReady();
  const { user } = React.useContext(AuthContext);

  useEffect(() => {
    if (!authReady) return; // wait for auth
    if (!user || !(user.roles?.isTeacher || user.isTeacher)) {
      // Not a teacher; hide widget
      setLoading(false);
      return;
    }
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        // Fetch teacher summary stats (adjust endpoint as needed)
        const res = await api.get('/analytics/teacher/summary');
        if (mounted) setStats(res.data);
      } catch (e) {
        // Fail silently; optional widget
        if (mounted) setStats(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [authReady, user]);

  if (loading) {
    return (
      <div className="kids-card mb-4">
        <h3 className="m-0" style={{ fontWeight: 700, marginBottom: 12 }}>📊 Hızlı İstatistikler</h3>
        <Skeleton height="80px" count={2} mb="12px" />
      </div>
    );
  }

  if (!stats) return null; // Hide if no data or not teacher

  return (
    <div className="kids-card mb-4">
      <h3 className="m-0" style={{ fontWeight: 700, marginBottom: 12 }}>📊 Hızlı İstatistikler</h3>
      <div className="kids-grid-3">
        <div className="page-card text-center">
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>🧪</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4834d4' }}>{stats.totalExams || 0}</div>
          <div className="muted" style={{ fontSize: 12 }}>Toplam Sınav</div>
        </div>
        <div className="page-card text-center">
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>📈</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2ecc71' }}>{stats.avgScore || 0}%</div>
          <div className="muted" style={{ fontSize: 12 }}>Ortalama Puan</div>
        </div>
        <div className="page-card text-center">
          <div style={{ fontSize: '2rem', marginBottom: 4 }}>👨‍🎓</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e67e22' }}>{stats.activeStudents || 0}</div>
          <div className="muted" style={{ fontSize: 12 }}>Aktif Öğrenci</div>
        </div>
      </div>
      {stats.recentActivity && (
        <div style={{ marginTop: 12, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>📌 Son 7 Gün</div>
          <div style={{ fontSize: 12, color: '#666' }}>
            • {stats.recentActivity.examAttempts || 0} deneme yapıldı<br />
            • {stats.recentActivity.newStudents || 0} yeni öğrenci katıldı
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherAnalyticsMini;
