// frontend-react/src/components/gamification/AchievementsModal.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import achievementService from '../../services/achievementService';
import soundService from '../../services/soundService';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 32px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  color: white;
`;

const Title = styled.h2`
  font-size: 32px;
  font-weight: 800;
  margin: 0;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
`;

const AchievementCard = styled.div`
  background: ${props => props.$completed ? 
    'linear-gradient(135deg, #10B981, #059669)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid ${props => {
    if (props.$completed) return '#10B981';
    return 'rgba(255, 255, 255, 0.2)';
  }};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  opacity: ${props => props.$completed ? 1 : 0.7};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  ${props => props.$rarity === 'legendary' && `
    border: 2px solid gold;
    animation: glow 2s ease-in-out infinite;
    
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
      50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.8); }
    }
  `}
`;

const AchievementIcon = styled.div`
  font-size: 48px;
  margin-bottom: 12px;
  filter: ${props => props.$completed ? 'none' : 'grayscale(100%)'};
`;

const AchievementTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
`;

const AchievementDescription = styled.p`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 12px 0;
  line-height: 1.4;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #10B981, #059669);
  width: ${props => props.$progress}%;
  transition: width 0.5s ease;
`;

const ProgressText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
`;

const ClaimButton = styled.button`
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  margin-top: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const RarityBadge = styled.span`
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${props => {
    switch(props.$rarity) {
      case 'legendary': return 'linear-gradient(135deg, gold, orange)';
      case 'epic': return 'linear-gradient(135deg, #9333EA, #7C3AED)';
      case 'rare': return 'linear-gradient(135deg, #3B82F6, #2563EB)';
      default: return 'rgba(255, 255, 255, 0.2)';
    }
  }};
  color: white;
`;

const AchievementsModal = ({ isOpen, onClose }) => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAchievements();
    }
  }, [isOpen]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementService.getUserAchievements();
      setAchievements(data.achievements || []);
    } catch (error) {
      toast.error('Başarılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (achievementId) => {
    try {
      const result = await achievementService.claimRewards(achievementId);
      toast.success(`🎉 ${result.rewards.xp} XP kazandınız!`);
      soundService.play('xpGain');
      soundService.play('unlock');
      fetchAchievements(); // Refresh
    } catch (error) {
      toast.error('Ödül alınamadı.');
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>🏆 Başarılar</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>

        {loading ? (
          <div style={{ color: 'white', textAlign: 'center', padding: '40px' }}>
            Yükleniyor...
          </div>
        ) : (
          <AchievementsGrid>
            {achievements.map((achievement) => {
              const progress = (achievement.progress / achievement.requirement.target) * 100;
              const canClaim = achievement.completed && !achievement.claimed;
              
              return (
                <AchievementCard
                  key={achievement.id}
                  $completed={achievement.completed}
                  $rarity={achievement.rarity}
                >
                  <RarityBadge $rarity={achievement.rarity}>
                    {achievement.rarity}
                  </RarityBadge>
                  
                  <AchievementIcon $completed={achievement.completed}>
                    {achievement.icon}
                  </AchievementIcon>
                  
                  <AchievementTitle>{achievement.title}</AchievementTitle>
                  <AchievementDescription>{achievement.description}</AchievementDescription>
                  
                  {!achievement.completed && (
                    <>
                      <ProgressBar>
                        <ProgressFill $progress={progress} />
                      </ProgressBar>
                      <ProgressText>
                        {achievement.progress}/{achievement.requirement.target}
                      </ProgressText>
                    </>
                  )}
                  
                  {achievement.completed && (
                    <div style={{ color: 'white', fontSize: 14, marginTop: 8 }}>
                      ✅ Tamamlandı! {achievement.claimed && '(Ödül Alındı)'}
                    </div>
                  )}
                  
                  {canClaim && (
                    <ClaimButton onClick={() => handleClaim(achievement.id)}>
                      🎁 Ödül Al (+{achievement.rewards.xp} XP)
                    </ClaimButton>
                  )}
                </AchievementCard>
              );
            })}
          </AchievementsGrid>
        )}
      </ModalContainer>
    </Overlay>
  );
};

export default AchievementsModal;
