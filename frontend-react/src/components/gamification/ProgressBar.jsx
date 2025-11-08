// components/gamification/ProgressBar.jsx
import React from 'react';
import styled from 'styled-components';

const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: #f0f0f0;
  border-radius: 10px;
  margin: 10px 0;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 20px;
  background-color: #4caf50;
  border-radius: 10px;
  width: ${props => props.progress}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
`;

const ProgressBar = ({ current, total }) => {
  const progress = Math.min((current / total) * 100, 100);
  
  return (
    <ProgressBarContainer>
      <ProgressFill progress={progress}>
        <ProgressText>
          {current} / {total} XP
        </ProgressText>
      </ProgressFill>
    </ProgressBarContainer>
  );
};

export default ProgressBar;