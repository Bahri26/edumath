// frontend-react/src/components/gamification/StreakDisplay.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import streakService from '../../services/streakService';
import streakAdvancedService from '../../services/streakAdvancedService';
import toast from 'react-hot-toast';

const StreakContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
  }
`;

const FireIcon = styled.div`
  font-size: 28px;
  animation: ${props => props.$isActive ? 'flame 2s ease-in-out infinite' : 'none'};

  @keyframes flame {
    0%, 100% { transform: scale(1) rotate(-5deg); }
    50% { transform: scale(1.1) rotate(5deg); }
  }
`;

const StreakInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CurrentStreak = styled.div`
  font-size: 18px;
  font-weight: 700;
`;

const LongestStreak = styled.div`
  font-size: 11px;
  opacity: 0.9;
`;

const FreezeCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const StreakDisplay = () => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      setLoading(true);
      const data = await streakService.getStreak();
      setStreakData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch streak:', err);
      setError('Streak yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyFreeze = async () => {
    if (!window.confirm('Streak Freeze satın almak istiyor musun? (Maliyet: 100 XP)')) {
      return;
    }

    try {
      const result = await streakAdvancedService.buyFreeze();
      toast.success('🧊 Streak Freeze başarıyla satın alındı!');
      // Refresh streak data
      await fetchStreak();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Satın alma başarısız');
    }
  };

  if (loading) {
    return (
      <StreakContainer>
        <FireIcon>🔥</FireIcon>
        <StreakInfo>
          <CurrentStreak>Yükleniyor...</CurrentStreak>
        </StreakInfo>
      </StreakContainer>
    );
  }

  if (error) {
    return (
      <StreakContainer style={{ background: '#6c757d' }}>
        <FireIcon>❌</FireIcon>
        <StreakInfo>
          <CurrentStreak>{error}</CurrentStreak>
        </StreakInfo>
      </StreakContainer>
    );
  }

  if (!streakData) return null;

  const isActive = streakData.currentStreak > 0;

  return (
    <StreakContainer>
      <FireIcon $isActive={isActive}>
        {isActive ? '🔥' : '💨'}
      </FireIcon>
      
      <StreakInfo>
        <CurrentStreak>
          {streakData.currentStreak} Gün Streak
        </CurrentStreak>
        {streakData.longestStreak > 0 && (
          <LongestStreak>
            En Uzun: {streakData.longestStreak} gün
          </LongestStreak>
        )}
      </StreakInfo>

      {streakData.streakFreezes > 0 && (
        <FreezeCount title="Streak Freeze sayısı">
          🧊 {streakData.streakFreezes}
        </FreezeCount>
      )}

      <FreezeCount onClick={handleBuyFreeze} title="Streak Freeze satın al">
        + 🧊
      </FreezeCount>
    </StreakContainer>
  );
};

export default StreakDisplay;
