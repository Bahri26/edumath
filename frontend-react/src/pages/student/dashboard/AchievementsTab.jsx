// pages/student/dashboard/AchievementsTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import AchievementCard from '../../../components/gamification/AchievementCard';
import ProgressBar from '../../../components/gamification/ProgressBar';

const Container = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;

  h3 {
    margin: 0;
    color: #333;
    font-size: 24px;
  }

  p {
    margin: 5px 0 0;
    color: #666;
    font-size: 14px;
  }
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
`;

const AchievementsTab = () => {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState({
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    totalAchievements: 0,
    gems: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [achievementsRes, statsRes] = await Promise.all([
          axios.get('/api/gamification/achievements'),
          axios.get('/api/gamification/stats')
        ]);

        setAchievements(achievementsRes.data);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Container>
      <Header>
        <h2>Başarımlarım</h2>
        <ProgressBar 
          current={stats.xp} 
          total={stats.nextLevelXp} 
        />
      </Header>

      <StatsGrid>
        <StatCard>
          <h3>{stats.level}</h3>
          <p>Seviye</p>
        </StatCard>
        <StatCard>
          <h3>{stats.totalAchievements}</h3>
          <p>Toplam Başarım</p>
        </StatCard>
        <StatCard>
          <h3>{stats.gems}</h3>
          <p>Gem</p>
        </StatCard>
      </StatsGrid>

      <AchievementsGrid>
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement._id}
            achievement={achievement}
            isNew={achievement.isNew}
          />
        ))}
      </AchievementsGrid>
    </Container>
  );
};

export default AchievementsTab;