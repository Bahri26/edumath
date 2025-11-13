// frontend-react/src/components/gamification/HeartsDisplay.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import heartsService from '../../services/heartsService';

const HeartsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: ${props => props.$hasUnlimited ? 
    'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 
    'linear-gradient(135deg, #FF1744 0%, #FF5252 100%)'
  };
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(255, 23, 68, 0.3);
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(255, 23, 68, 0.4);
  }
`;

const HeartsRow = styled.div`
  display: flex;
  gap: 6px;
`;

const Heart = styled.div`
  font-size: 24px;
  transition: transform 0.2s;
  opacity: ${props => props.$filled ? 1 : 0.3};
  filter: ${props => props.$filled ? 'none' : 'grayscale(100%)'};

  &:hover {
    transform: scale(1.15);
  }
`;

const HeartInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
`;

const HeartCount = styled.div`
  font-size: 16px;
  font-weight: 700;
`;

const RefillTimer = styled.div`
  font-size: 11px;
  opacity: 0.9;
`;

const UnlimitedBadge = styled.div`
  font-size: 12px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  padding: 6px 12px;
  border-radius: 10px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const HeartsDisplay = ({ onHeartChange }) => {
  const [heartsData, setHeartsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHearts();
    
    // Auto-refresh every minute to update refill timer
    const interval = setInterval(fetchHearts, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchHearts = async () => {
    try {
      setLoading(true);
      const data = await heartsService.getHearts();
      setHeartsData(data);
      setError(null);
      
      if (onHeartChange) {
        onHeartChange(data.currentHearts);
      }
    } catch (err) {
      console.error('Failed to fetch hearts:', err);
      setError('Kalpler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    if (!window.confirm('Tüm kalpleri doldurmak istiyor musun? (Maliyet: 5 gem)')) {
      return;
    }

    try {
      const updated = await heartsService.refillHearts();
      setHeartsData(updated);
      alert('Kalpler başarıyla dolduruldu! ❤️');
    } catch (err) {
      alert(err.response?.data?.message || 'Doldurma başarısız');
    }
  };

  const handleBuyUnlimited = async () => {
    if (!window.confirm('Sınırsız kalp satın almak istiyor musun? (Maliyet: 50 gem - Tek seferlik)')) {
      return;
    }

    try {
      const updated = await heartsService.buyUnlimitedHearts();
      setHeartsData(updated);
      alert('Sınırsız kalp aktif! 💛✨');
    } catch (err) {
      alert(err.response?.data?.message || 'Satın alma başarısız');
    }
  };

  const formatRefillTime = (lastRefillDate) => {
    if (!lastRefillDate) return '';
    
    const now = new Date();
    const lastRefill = new Date(lastRefillDate);
    const nextRefill = new Date(lastRefill.getTime() + 30 * 60000); // +30 min
    
    const diff = nextRefill - now;
    if (diff <= 0) return 'Şimdi dolacak';
    
    const minutes = Math.floor(diff / 60000);
    return `${minutes} dk`;
  };

  if (loading) {
    return (
      <HeartsContainer>
        <Heart $filled>❤️</Heart>
        <HeartInfo>
          <HeartCount>Yükleniyor...</HeartCount>
        </HeartInfo>
      </HeartsContainer>
    );
  }

  if (error) {
    return (
      <HeartsContainer style={{ background: '#6c757d' }}>
        <Heart>❌</Heart>
        <HeartInfo>
          <HeartCount>{error}</HeartCount>
        </HeartInfo>
      </HeartsContainer>
    );
  }

  if (!heartsData) return null;

  const { currentHearts, maxHearts, hasUnlimitedHearts, lastRefillDate } = heartsData;

  return (
    <HeartsContainer $hasUnlimited={hasUnlimitedHearts}>
      {hasUnlimitedHearts ? (
        <>
          <Heart $filled>💛</Heart>
          <HeartInfo>
            <UnlimitedBadge>
              ♾️ Sınırsız
            </UnlimitedBadge>
          </HeartInfo>
        </>
      ) : (
        <>
          <HeartsRow>
            {Array.from({ length: maxHearts }).map((_, i) => (
              <Heart key={i} $filled={i < currentHearts}>
                {i < currentHearts ? '❤️' : '🖤'}
              </Heart>
            ))}
          </HeartsRow>
          
          <HeartInfo>
            <HeartCount>
              {currentHearts}/{maxHearts}
            </HeartCount>
            {currentHearts < maxHearts && (
              <RefillTimer>
                +1 {formatRefillTime(lastRefillDate)}
              </RefillTimer>
            )}
          </HeartInfo>

          {currentHearts < maxHearts && (
            <ActionButton onClick={handleRefill}>
              Doldur 💎
            </ActionButton>
          )}

          <ActionButton onClick={handleBuyUnlimited}>
            ♾️ Satın Al
          </ActionButton>
        </>
      )}
    </HeartsContainer>
  );
};

export default HeartsDisplay;
