// pages/student/dashboard/LeaderboardTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Container = styled.div`
  padding: 20px;
`;

const LeaderboardCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const LeaderboardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  .filters {
    display: flex;
    gap: 10px;

    button {
      padding: 8px 15px;
      border: none;
      border-radius: 5px;
      background: #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;

      &.active {
        background: #4caf50;
        color: white;
      }
    }
  }
`;

const LeaderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const LeaderItem = styled(motion.div)`
  display: flex;
  align-items: center;
  padding: 15px;
  background: ${props => props.isUser ? '#e8f5e9' : '#f8f9fa'};
  border-radius: 8px;
  position: relative;

  .rank {
    width: 30px;
    font-weight: bold;
    color: ${props => props.rank <= 3 ? '#4caf50' : '#666'};
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin: 0 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e0e0e0;
    color: #666;
  }

  .info {
    flex: 1;

    .name {
      font-weight: bold;
      color: #333;
    }

    .stats {
      font-size: 12px;
      color: #666;
    }
  }

  .score {
    font-weight: bold;
    color: #4caf50;
  }

  ${props => props.rank <= 3 && `
    &::before {
      content: '🏆';
      position: absolute;
      top: -10px;
      right: 10px;
      font-size: 20px;
    }
  `}
`;

const TimeframeButton = styled.button`
  background: none;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  color: ${props => props.active ? '#4caf50' : '#666'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  border-bottom: ${props => props.active ? '2px solid #4caf50' : 'none'};
`;

const LeaderboardTab = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeframe, setTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);
  const [userId] = useState(null); // Giriş yapmış kullanıcının ID'si

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/gamification/leaderboard?timeframe=${timeframe}`);
        setLeaderboard(response.data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeframe]);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Container>
      <LeaderboardCard>
        <LeaderboardHeader>
          <h3>Lider Tablosu</h3>
          <div className="filters">
            <TimeframeButton 
              active={timeframe === 'week'} 
              onClick={() => setTimeframe('week')}
            >
              Bu Hafta
            </TimeframeButton>
            <TimeframeButton 
              active={timeframe === 'month'} 
              onClick={() => setTimeframe('month')}
            >
              Bu Ay
            </TimeframeButton>
            <TimeframeButton 
              active={timeframe === 'all'} 
              onClick={() => setTimeframe('all')}
            >
              Tüm Zamanlar
            </TimeframeButton>
          </div>
        </LeaderboardHeader>

        <LeaderList>
          <AnimatePresence>
            {leaderboard.map((user, index) => (
              <LeaderItem
                key={user._id}
                rank={index + 1}
                isUser={user._id === userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="rank">#{index + 1}</div>
                <div className="avatar">
                  {user.firstName[0] + user.lastName[0]}
                </div>
                <div className="info">
                  <div className="name">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="stats">
                    Seviye {user.gamification.level} • {user.gamification.xp} XP
                  </div>
                </div>
                <div className="score">
                  {user.score} puan
                </div>
              </LeaderItem>
            ))}
          </AnimatePresence>
        </LeaderList>
      </LeaderboardCard>
    </Container>
  );
};

export default LeaderboardTab;