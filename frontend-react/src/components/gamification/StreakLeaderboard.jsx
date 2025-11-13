// frontend-react/src/components/gamification/StreakLeaderboard.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import streakAdvancedService from '../../services/streakAdvancedService';

const Container = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 24px;
  text-align: center;
`;

const UserRankCard = styled.div`
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
  text-align: center;
`;

const RankText = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const RankLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const LeaderboardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const LeaderboardItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  background: ${props => {
    if (props.rank === 1) return 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    if (props.rank === 2) return 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)';
    if (props.rank === 3) return 'linear-gradient(135deg, #fb923c 0%, #ea580c 100%)';
    return props.isCurrentUser ? '#e0e7ff' : '#f9fafb';
  }};
  border-radius: 12px;
  border: 2px solid ${props => props.isCurrentUser ? '#6366f1' : 'transparent'};
  color: ${props => props.rank <= 3 ? 'white' : '#333'};
  transition: all 0.2s;

  &:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const Rank = styled.div`
  font-size: 24px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
`;

const Trophy = styled.div`
  font-size: 32px;
  min-width: 50px;
  text-align: center;
`;

const UserInfo = styled.div`
  flex: 1;
  margin: 0 16px;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 14px;
  opacity: ${props => props.rank <= 3 ? 0.9 : 0.7};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StreakBadge = styled.div`
  padding: 8px 16px;
  background: ${props => props.rank <= 3 ? 'rgba(255, 255, 255, 0.3)' : 'linear-gradient(135deg, #f59e0b, #ef4444)'};
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.rank <= 3 ? 'white' : 'white'};
  white-space: nowrap;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
`;

const StreakLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [userStreak, setUserStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await streakAdvancedService.getLeaderboard(50);
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank);
      setUserStreak(data.userStreak);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  if (loading) {
    return <LoadingText>Sıralama yükleniyor...</LoadingText>;
  }

  if (leaderboard.length === 0) {
    return (
      <Container>
        <Title>🏆 Seri Liderlik Tablosu</Title>
        <EmptyState>Henüz veri yok</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏆 Seri Liderlik Tablosu</Title>

      {userRank && userStreak && (
        <UserRankCard>
          <RankText>#{userRank}</RankText>
          <RankLabel>Sıralaman</RankLabel>
          <div style={{ marginTop: 12, fontSize: 18 }}>
            🔥 {userStreak.currentStreak} gün (En uzun: {userStreak.longestStreak})
          </div>
        </UserRankCard>
      )}

      <LeaderboardList>
        {leaderboard.map((item) => (
          <LeaderboardItem 
            key={item.userId}
            rank={item.rank}
            isCurrentUser={false}
          >
            {getTrophyIcon(item.rank) ? (
              <Trophy>{getTrophyIcon(item.rank)}</Trophy>
            ) : (
              <Rank rank={item.rank}>#{item.rank}</Rank>
            )}
            <UserInfo>
              <UserName>{item.userName}</UserName>
              <Stats rank={item.rank}>
                <StatItem>
                  <span>🔥</span>
                  <span>{item.currentStreak} gün</span>
                </StatItem>
                <StatItem>
                  <span>⭐</span>
                  <span>En uzun: {item.longestStreak}</span>
                </StatItem>
                <StatItem>
                  <span>📅</span>
                  <span>{item.totalDaysActive} toplam</span>
                </StatItem>
              </Stats>
            </UserInfo>
            <StreakBadge rank={item.rank}>
              {item.currentStreak} 🔥
            </StreakBadge>
          </LeaderboardItem>
        ))}
      </LeaderboardList>
    </Container>
  );
};

export default StreakLeaderboard;
