import { useState, useEffect } from 'react';
import axios from 'axios';
import ResumeLearningCard from '../components/dashboard/ResumeLearningCard';
import GamificationHeader from '../components/dashboard/GamificationHeader';
import ProgressChart from '../components/dashboard/ProgressChart';

const StudentDashboard = () => {
  const [isDarkMode] = useState(false); // Replace with ThemeContext if available
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [progressSummary, setProgressSummary] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/dashboard/student');
        setUserStats(res.data.userStats);
        setActiveCourse(res.data.activeCourse);
        setProgressSummary(res.data.progressSummary);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {userStats && (
        <GamificationHeader xp={userStats.xp} streak={userStats.streak} level={userStats.level} gems={userStats.diamonds} />
      )}
      <ResumeLearningCard
        topic={activeCourse?.lesson?.title || 'Henüz ders yok'}
        progress={activeCourse?.completionPercentage || 0}
        onContinue={() => alert('Devam ediliyor...')}
      />
      <ProgressChart data={progressSummary} isDarkMode={isDarkMode} />
      {/* Diğer öğrenciye özel widgetlar buraya eklenebilir */}
    </div>
  );
};

export default StudentDashboard;
