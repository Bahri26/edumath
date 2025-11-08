// components/gamification/AchievementCard.jsx
import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Card = styled(motion.div)`
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
`;

const IconContainer = styled.div`
  width: 50px;
  height: 50px;
  background: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #4caf50;
`;

const Content = styled.div`
  flex: 1;
`;

const Title = styled.h4`
  margin: 0;
  color: #333;
`;

const Description = styled.p`
  margin: 5px 0;
  color: #666;
  font-size: 14px;
`;

const Rewards = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 5px;
`;

const RewardBadge = styled.span`
  background: #f8f8f8;
  padding: 3px 8px;
  border-radius: 15px;
  font-size: 12px;
  color: #333;
`;

const AchievementCard = ({ achievement, isNew }) => {
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <Card
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
    >
      <IconContainer>
        <i className={`fas fa-${achievement.icon}`}></i>
      </IconContainer>
      
      <Content>
        <Title>{achievement.name}</Title>
        <Description>{achievement.description}</Description>
        
        <Rewards>
          {achievement.rewards.xp && (
            <RewardBadge>
              <i className="fas fa-star"></i> {achievement.rewards.xp} XP
            </RewardBadge>
          )}
          {achievement.rewards.gems && (
            <RewardBadge>
              <i className="fas fa-gem"></i> {achievement.rewards.gems} Gem
            </RewardBadge>
          )}
        </Rewards>
      </Content>

      {isNew && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="badge badge-success">Yeni!</span>
        </motion.div>
      )}
    </Card>
  );
};

export default AchievementCard;