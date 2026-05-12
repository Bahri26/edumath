import React, { useContext } from 'react';
import { leaderboard } from '../../data/studentData';
import { LanguageContext } from '../../context/LanguageContext';
import StudentPageShell from '../../components/student/StudentPageShell.jsx';

const StudentLeaderboard = () => {
  const { language } = useContext(LanguageContext);

  // --- DİL ÇEVIRILERI ---
  const t = {
    TR: {
      weeklyRanking: "Haftalık Sıralama 🏆",
      subtitle: "Bu hafta en çok çalışan 11-A sınıfı öğrencileri.",
      you: "(Sen)",
      classInfo: "11-A Sınıfı",
    },
    EN: {
      weeklyRanking: "Weekly Ranking 🏆",
      subtitle: "The most active 11-A class students this week.",
      you: "(You)",
      classInfo: "Class 11-A",
    }
  };

  const getText = (key) => t[language]?.[key] || t.TR[key];
  return (
      <StudentPageShell title={getText('weeklyRanking')} subtitle={getText('subtitle')} maxWidthClass="max-w-3xl">
          <p className="text-center text-[11px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold">
            Demo veri
          </p>
          <div className="bg-white/95 dark:bg-slate-800/95 rounded-[1.25rem] shadow-lg border border-sky-200/60 dark:border-slate-700 overflow-hidden">
              {leaderboard.map((user, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 ${user.active ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                      <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${
                              idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                              idx === 1 ? 'bg-gray-100 text-gray-600' :
                              idx === 2 ? 'bg-orange-100 text-orange-600' : 'text-slate-400'
                          }`}>
                              {idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} alt="avatar" />
                          </div>
                          <div>
                             <p className={`font-semibold ${user.active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>{user.name} {user.active && getText('you')}</p>
                             <p className="text-xs text-slate-400">{getText('classInfo')}</p>
                          </div>
                      </div>
                      <div className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{user.xp} XP</div>
                  </div>
              ))}
          </div>
      </StudentPageShell>
  );
};

export default StudentLeaderboard;