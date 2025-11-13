// frontend-react/src/pages/student/ExercisesPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import Confetti from 'react-confetti';
import interactiveExerciseService from '../../services/interactiveExerciseService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 12px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const Subtitle = styled.p`
  font-size: 18px;
  opacity: 0.95;
  margin-bottom: 8px;
`;

const LevelSelector = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
`;

const LevelButton = styled.button`
  padding: 16px 32px;
  border-radius: 16px;
  border: 3px solid ${props => props.$isActive ? '#fff' : 'rgba(255, 255, 255, 0.3)'};
  background: ${props => {
    if (!props.$isActive) return 'rgba(255, 255, 255, 0.1)';
    if (props.$level === 'Kolay') return 'linear-gradient(135deg, #10B981, #059669)';
    if (props.$level === 'Orta') return 'linear-gradient(135deg, #F59E0B, #EF4444)';
    return 'linear-gradient(135deg, #EF4444, #DC2626)';
  }};
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  position: relative;
  backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  ${props => props.$isLocked && `
    &::after {
      content: '🔒';
      position: absolute;
      top: 8px;
      right: 8px;
      font-size: 20px;
    }
  `}
`;

const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
`;

const ExerciseCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${props => {
      if (props.$difficulty === 'easy') return 'linear-gradient(90deg, #10B981, #059669)';
      if (props.$difficulty === 'medium') return 'linear-gradient(90deg, #F59E0B, #EF4444)';
      return 'linear-gradient(90deg, #EF4444, #DC2626)';
    }};
  }
`;

const ExerciseIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ExerciseTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
`;

const ExerciseDescription = styled.p`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const ExerciseFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const ExerciseBadge = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => {
    if (props.$type === 'easy') return '#D1FAE5';
    if (props.$type === 'medium') return '#FEF3C7';
    return '#FEE2E2';
  }};
  color: ${props => {
    if (props.$type === 'easy') return '#065F46';
    if (props.$type === 'medium') return '#92400E';
    return '#991B1B';
  }};
`;

const ExerciseXP = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
  font-size: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  color: white;
  
  h3 {
    font-size: 32px;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 18px;
    opacity: 0.9;
  }
`;

const ProgressInfo = styled.div`
  text-align: center;
  color: rgba(255,255,255,0.95);
  margin-bottom: 24px;
  font-weight: 600;
`;

const ProgressBarsContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
`;

const ProgressBarWrapper = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px 24px;
  min-width: 200px;
  border: 2px solid ${props => props.$isUnlocked ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
`;

const ProgressBarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: white;
  font-weight: 700;
  font-size: 16px;
`;

const ProgressBarTrack = styled.div`
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.$level === 'Kolay') return 'linear-gradient(90deg, #10B981, #059669)';
    if (props.$level === 'Orta') return 'linear-gradient(90deg, #F59E0B, #EF4444)';
    return 'linear-gradient(90deg, #EF4444, #DC2626)';
  }};
  width: ${props => props.$progress}%;
  transition: width 0.5s ease;
  border-radius: 8px;
`;

const exerciseTypeIcons = {
  'multiple-choice': '✅',
  'fill-in-blank': '✏️',
  'drag-drop': '🎯',
  'matching': '🔗',
  'sorting': '🔢',
  'drawing': '🎨',
  'number-line': '📏',
  'fraction-visual': '🍕',
  'graph-plot': '📊',
  'equation-builder': '🧮'
};

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState('Kolay'); // Kolay, Orta, Zor
  const [progressCounts, setProgressCounts] = useState({ Kolay: 0, Orta: 0, Zor: 0 });
  const [unlockedLevels, setUnlockedLevels] = useState(['Kolay']);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowDimensions, setWindowDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const navigate = useNavigate();

  useEffect(() => {
    // on mount and when selected level changes, fetch exercises
    fetchExercises();
  }, [selectedLevel]);

  useEffect(() => {
    // fetch progress/unlocked levels on mount
    fetchProgress();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await interactiveExerciseService.listExercises({
        difficulty: selectedLevel
      });
      setExercises(data.exercises || []);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const previousUnlocked = [...unlockedLevels];
      const data = await interactiveExerciseService.getProgress();
      
      if (data && data.counts) setProgressCounts(data.counts);
      if (data && data.unlocked) {
        setUnlockedLevels(data.unlocked);
        
        // Check if a new level was unlocked
        const newlyUnlocked = data.unlocked.filter(level => !previousUnlocked.includes(level));
        if (newlyUnlocked.length > 0) {
          // Show confetti and toast
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          newlyUnlocked.forEach(level => {
            toast.success(`🎉 ${level} seviyesi açıldı! Tebrikler!`, { duration: 4000 });
          });
        }
      }
      
      // if current selected level is locked, fall back to first unlocked
      if (data && data.unlocked && !data.unlocked.includes(selectedLevel)) {
        setSelectedLevel(data.unlocked[0] || 'Kolay');
      }
    } catch (err) {
      console.warn('Could not fetch progress (maybe unauthenticated):', err.message || err);
      // leave defaults (Kolay unlocked)
      setProgressCounts({ Kolay: 0, Orta: 0, Zor: 0 });
      setUnlockedLevels(['Kolay']);
      setSelectedLevel('Kolay');
    }
  };

  const handleExerciseClick = (exerciseId) => {
    navigate(`/student/exercise/${exerciseId}`);
  };

  const handleLevelSelect = (level, isLocked) => {
    if (isLocked) {
      toast.error(`🔒 ${level} seviyesi kilitli! Önce önceki seviyelerde 3 alıştırma tamamlayın.`, {
        duration: 3000
      });
      return;
    }
    setSelectedLevel(level);
    toast.success(`${level} seviyesi seçildi!`, { duration: 1500 });
  };

  // Refresh progress when user returns from exercise player
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchProgress();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner>
          <div>🔄 Alıştırmalar yükleniyor...</div>
        </LoadingSpinner>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {showConfetti && (
        <Confetti
          width={windowDimensions.width}
          height={windowDimensions.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}
      <ContentWrapper>
        <Header>
          <Title>🎯 İnteraktif Alıştırmalar</Title>
          <Subtitle>Seviye seviye ilerle, matematik yeteneğini geliştir!</Subtitle>
        </Header>

        <LevelSelector>
          <LevelButton
            $level="Kolay"
            $isActive={selectedLevel === 'Kolay'}
            $isLocked={!unlockedLevels.includes('Kolay')}
            onClick={() => handleLevelSelect('Kolay', !unlockedLevels.includes('Kolay'))}
          >
            🌱 Kolay
          </LevelButton>
          <LevelButton
            $level="Orta"
            $isActive={selectedLevel === 'Orta'}
            $isLocked={!unlockedLevels.includes('Orta')}
            onClick={() => handleLevelSelect('Orta', !unlockedLevels.includes('Orta'))}
          >
            ⚡ Orta
          </LevelButton>
          <LevelButton
            $level="Zor"
            $isActive={selectedLevel === 'Zor'}
            $isLocked={!unlockedLevels.includes('Zor')}
            onClick={() => handleLevelSelect('Zor', !unlockedLevels.includes('Zor'))}
          >
            🔥 Zor
          </LevelButton>
        </LevelSelector>

        <ProgressBarsContainer>
          {['Kolay', 'Orta', 'Zor'].map(level => {
            const count = progressCounts[level] || 0;
            const progress = Math.min((count / 3) * 100, 100);
            const isUnlocked = unlockedLevels.includes(level);
            return (
              <ProgressBarWrapper key={level} $isUnlocked={isUnlocked}>
                <ProgressBarLabel>
                  <span>{level === 'Kolay' ? '🌱' : level === 'Orta' ? '⚡' : '🔥'} {level}</span>
                  <span>{count}/3</span>
                </ProgressBarLabel>
                <ProgressBarTrack>
                  <ProgressBarFill $level={level} $progress={progress} />
                </ProgressBarTrack>
              </ProgressBarWrapper>
            );
          })}
        </ProgressBarsContainer>

        <ProgressInfo>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            💡 Her seviyede 3 alıştırma tamamlayarak bir sonraki seviyeyi açabilirsiniz!
          </div>
        </ProgressInfo>

        {exercises.length === 0 ? (
          <EmptyState>
            <h3>🎉 Bu Seviyede Alıştırma Yok</h3>
            <p>Bu zorluk seviyesinde henüz soru eklenmemiş. Başka bir seviye deneyin!</p>
          </EmptyState>
        ) : (
          <ExerciseGrid>
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise._id}
                $difficulty={exercise.difficulty}
                onClick={() => handleExerciseClick(exercise._id)}
              >
                <ExerciseIcon>
                  {exerciseTypeIcons[exercise.exerciseType] || '📝'}
                </ExerciseIcon>
                <ExerciseTitle>{exercise.title}</ExerciseTitle>
                <ExerciseDescription>{exercise.description}</ExerciseDescription>
                
                <ExerciseFooter>
                  <ExerciseBadge $type={exercise.difficulty}>
                    {exercise.difficulty === 'easy' ? 'Kolay' : 
                     exercise.difficulty === 'medium' ? 'Orta' : 'Zor'}
                  </ExerciseBadge>
                  <ExerciseXP>
                    ⭐ {exercise.xpReward} XP
                  </ExerciseXP>
                </ExerciseFooter>
              </ExerciseCard>
            ))}
          </ExerciseGrid>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default ExercisesPage;
