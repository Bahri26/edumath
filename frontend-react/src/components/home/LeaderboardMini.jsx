import React, { useEffect, useState } from 'react';
import api from '../../services/api';

function LeaderboardMini() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/leaderboard?period=week&limit=5');
        // Backend artık simplified array dönüyor: [{ rank, name, score, xp, level }]
        const data = Array.isArray(res.data) ? res.data : [];
        if (mounted) setLeaders(data);
      } catch (e) {
        // fail silently; leaderboard is optional
        if (mounted) setLeaders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return null; // hide during load
  if (leaders.length === 0) return null; // hide if empty

  return (
    <div className="kids-card mb-4">
      <h3 className="m-0" style={{ fontWeight: 700, marginBottom: 12 }}>🏆 Haftalık Liderler</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {leaders.map((l, idx) => (
          <div key={l.userId || idx} className="page-card d-flex justify-between align-center">
            <div className="d-flex align-center gap-2">
              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{l.rank || idx + 1}</span>
              <div>
                <div style={{ fontWeight: 600 }}>{l.name || 'Öğrenci'}</div>
                <div className="muted" style={{ fontSize: 12 }}>{l.xp || l.score || 0} XP</div>
              </div>
            </div>
            {idx === 0 && <span style={{ fontSize: '1.5rem' }}>🥇</span>}
            {idx === 1 && <span style={{ fontSize: '1.5rem' }}>🥈</span>}
            {idx === 2 && <span style={{ fontSize: '1.5rem' }}>🥉</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeaderboardMini;
