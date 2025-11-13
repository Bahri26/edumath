import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dailyChallengeService from '../../services/dailyChallengeService';

function DailyChallengePreview() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const data = await dailyChallengeService.getMyChallenges();
        // getMyChallenges returns array; find today's active challenge
        const today = Array.isArray(data) ? data.find(c => c.type === 'daily' && !c.isCompleted) : null;
        if (mounted) setChallenge(today || null);
      } catch (e) {
        const msg = e?.response?.status ? `Hata: ${e.response.status}` : 'Ağ hatası';
        if (mounted) setError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="kids-card mb-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <div className="d-flex justify-between align-center">
        <h3 className="m-0" style={{ fontWeight: 700 }}>🔥 Günlük Görev</h3>
        <small style={{ opacity: 0.9 }}>Bugüne özel!</small>
      </div>
      {loading && <div style={{ opacity: 0.8, marginTop: 8 }}>Yükleniyor…</div>}
      {!loading && error && <div style={{ marginTop: 8, opacity: 0.9 }}>{error}</div>}
      {!loading && !error && !challenge && (
        <div style={{ marginTop: 8, opacity: 0.9 }}>Bugün için görev yok, yarın tekrar kontrol et! 🎯</div>
      )}
      {!loading && !error && challenge && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>{challenge.title || 'Günlük Görev'}</div>
          <div style={{ opacity: 0.95, fontSize: '0.9rem', marginBottom: 12 }}>{challenge.description || ''}</div>
          <div className="d-flex justify-between align-center" style={{ paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <span>🏆 {challenge.pointValue || 10} puan</span>
            <Link to="/student/challenge" className="kids-btn" style={{ background: 'white', color: '#667eea', fontWeight: 600 }}>Hemen Çöz</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default DailyChallengePreview;
