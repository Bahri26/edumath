import React, { useEffect, useState } from 'react';
import { Flame, Medal, TrendingUp, BookOpen } from 'lucide-react';
import { getMyProgress, getSkills, getTrends } from '../../services/progressService';

const ProgressPanel = ({ days = 14 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [skills, setSkills] = useState([]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const me = await getMyProgress();
        const sk = await getSkills();
        const tr = await getTrends(days);
        setXp(me?.xp || 0);
        setStreak(me?.streak || tr?.streak || 0);
        setSkills(sk?.skills || []);
        setTrends(tr?.days || []);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Yükleme hatası');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  if (loading) return <div className="p-4 text-slate-500">Yükleniyor...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500"><Medal size={18} /> Toplam XP</div>
          <div className="text-2xl font-bold">{xp}</div>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500"><Flame size={18} /> Streak</div>
          <div className="text-2xl font-bold">{streak} gün</div>
        </div>
        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 col-span-2">
          <div className="flex items-center gap-2 text-slate-500"><TrendingUp size={18} /> Son {days} gün XP</div>
          <div className="mt-2 flex items-end gap-1 h-20">
            {trends.map((d) => (
              <div key={d.day} title={`${d.day}: ${d.xp}`} className="bg-indigo-500/70 w-2 rounded" style={{ height: Math.min(100, d.xp) + '%' }} />
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 text-slate-500"><BookOpen size={18} /> Beceriler</div>
        <div className="mt-3 grid md:grid-cols-2 gap-3">
          {skills.length === 0 && <div className="text-slate-500">Henüz veri yok</div>}
          {skills.map((s, i) => (
            <div key={`${s.subject}-${s.topic}-${i}`} className="p-3 rounded-xl border">
              <div className="font-medium">{s.subject}{s.topic ? ` / ${s.topic}` : ''}</div>
              <div className="text-sm text-slate-500">Seviye {s.level} • Ustalık {s.mastery}% • Puan {s.points}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressPanel;
