// frontend-react/src/pages/student/StreakPage.jsx
import React, { useState } from 'react';
import styled from 'styled-components';
import StreakCalendar from '../../components/gamification/StreakCalendar';
import StreakMilestones from '../../components/gamification/StreakMilestones';
import StreakLeaderboard from '../../components/gamification/StreakLeaderboard';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
`;

const TabBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0;
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: ${props => props.active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  border: none;
  border-radius: 8px 8px 0 0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;

  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
      : 'rgba(102, 126, 234, 0.1)'
    };
  }

  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  `}
`;

const Content = styled.div`
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StreakPage = () => {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <Container>
      <Header>
        <Title>🔥 Seri Takibi</Title>
        <Subtitle>Günlük seri gelişimini takip et ve ödüller kazan!</Subtitle>
      </Header>

      <TabBar>
        <Tab active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
          📅 Takvim
        </Tab>
        <Tab active={activeTab === 'milestones'} onClick={() => setActiveTab('milestones')}>
          🏆 Kilometre Taşları
        </Tab>
        <Tab active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')}>
          👑 Liderlik Tablosu
        </Tab>
      </TabBar>

      <Content>
        {activeTab === 'calendar' && <StreakCalendar />}
        {activeTab === 'milestones' && <StreakMilestones />}
        {activeTab === 'leaderboard' && <StreakLeaderboard />}
      </Content>
    </Container>
  );
};

export default StreakPage;
