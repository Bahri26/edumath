// frontend-react/src/components/gamification/StreakMilestones.jsx
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
`;

const MilestoneList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MilestoneCard = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  background: ${props => props.achieved 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : props.achievedBefore
    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    : '#f9fafb'
  };
  border-radius: 12px;
  border: 2px solid ${props => props.achieved || props.achievedBefore ? 'transparent' : '#e5e7eb'};
  color: ${props => props.achieved || props.achievedBefore ? 'white' : '#333'};
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  ${props => props.achieved && `
    &::before {
      content: '✅';
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 24px;
    }
  `}

  ${props => props.achievedBefore && !props.achieved && `
    &::before {
      content: '🔒';
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 24px;
    }
  `}
`;

const Icon = styled.div`
  font-size: 48px;
  margin-right: 20px;
  filter: ${props => props.achieved || props.achievedBefore ? 'none' : 'grayscale(100%)'};
  opacity: ${props => props.achieved || props.achievedBefore ? 1 : 0.5};
`;

const Info = styled.div`
  flex: 1;
`;

const MilestoneTitle = styled.div`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const MilestoneReward = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => props.achieved || props.achievedBefore ? 'white' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)'};
  width: ${props => props.progress}%;
  transition: width 0.5s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.8;
`;

const Summary = styled.div`
  display: flex;
  gap: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
`;

const SummaryItem = styled.div`
  text-align: center;
  flex: 1;
`;

const SummaryValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const StreakMilestones = () => {
  const [milestones, setMilestones] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    try {
      const data = await streakAdvancedService.getMilestones();
      setMilestones(data.milestones || []);
      setCurrentStreak(data.currentStreak || 0);
      setLongestStreak(data.longestStreak || 0);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const achievedCount = milestones.filter(m => m.achieved).length;

  if (loading) {
    return <LoadingText>Kilometre taşları yükleniyor...</LoadingText>;
  }

  return (
    <Container>
      <Title>🏆 Seri Kilometre Taşları</Title>
      
      <Summary>
        <SummaryItem>
          <SummaryValue>{currentStreak}</SummaryValue>
          <SummaryLabel>Mevcut Seri</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryValue>{longestStreak}</SummaryValue>
          <SummaryLabel>En Uzun Seri</SummaryLabel>
        </SummaryItem>
        <SummaryItem>
          <SummaryValue>{achievedCount}/{milestones.length}</SummaryValue>
          <SummaryLabel>Başarı</SummaryLabel>
        </SummaryItem>
      </Summary>

      <MilestoneList>
        {milestones.map((milestone, index) => (
          <MilestoneCard 
            key={index}
            achieved={milestone.achieved}
            achievedBefore={milestone.achievedBefore}
          >
            <Icon achieved={milestone.achieved} achievedBefore={milestone.achievedBefore}>
              {milestone.icon}
            </Icon>
            <Info>
              <MilestoneTitle>
                {milestone.title}
                {milestone.achievedBefore && !milestone.achieved && ' (Daha önce kazanılmış)'}
              </MilestoneTitle>
              <MilestoneReward>🎁 {milestone.reward}</MilestoneReward>
              {!milestone.achieved && (
                <>
                  <ProgressBar>
                    <ProgressFill 
                      progress={milestone.progress} 
                      achieved={milestone.achieved}
                      achievedBefore={milestone.achievedBefore}
                    />
                  </ProgressBar>
                  <ProgressText>
                    {milestone.remaining > 0 
                      ? `${milestone.remaining} gün kaldı`
                      : 'Tamamlandı!'
                    }
                  </ProgressText>
                </>
              )}
            </Info>
          </MilestoneCard>
        ))}
      </MilestoneList>
    </Container>
  );
};

export default StreakMilestones;
