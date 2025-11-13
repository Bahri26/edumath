// frontend-react/src/pages/student/ExercisePlayer.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import interactiveExerciseService from '../../services/interactiveExerciseService';
import soundService from '../../services/soundService';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const ExerciseCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
  position: relative;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
`;

const Timer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: ${props => props.$timeLeft < 30 ? '#EF4444' : '#667eea'};
  animation: ${props => props.$timeLeft < 30 ? 'pulse 1s infinite' : 'none'};
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

const HintButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
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

const StreakBonusBadge = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #F59E0B, #EF4444);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  animation: bounce 2s ease infinite;
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
`;

const QuestionTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 24px;
  line-height: 1.4;
`;

const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
`;

const OptionButton = styled.button`
  padding: 16px 24px;
  border: 2px solid ${props => props.$isSelected ? '#667eea' : '#e2e8f0'};
  background: ${props => props.$isSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
  color: ${props => props.$isSelected ? 'white' : '#1a202c'};
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SubmitButton = styled.button`
  padding: 16px 32px;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  margin-top: 24px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const FeedbackCard = styled.div`
  background: ${props => props.$isCorrect ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #EF4444, #DC2626)'};
  color: white;
  padding: 24px;
  border-radius: 16px;
  margin-top: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const FeedbackTitle = styled.h3`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
`;

const FeedbackText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 8px;
`;

const NextButton = styled.button`
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.3);
  border: 2px solid white;
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
  font-size: 24px;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  
  h3 {
    font-size: 28px;
    color: #EF4444;
    margin-bottom: 16px;
  }
  
  p {
    font-size: 16px;
    color: #4a5568;
    margin-bottom: 24px;
  }
`;

const ExercisePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [startTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hint, setHint] = useState(null);
  const [streakBonus, setStreakBonus] = useState(null);

  useEffect(() => {
    loadExercise();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (!exercise || feedback) return;
    
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [exercise, feedback, startTime]);

  const loadExercise = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await interactiveExerciseService.startExercise(id);
      setExercise(data);
    } catch (err) {
      console.error('Load exercise error:', err);
      setError(err.response?.data?.message || 'Alıştırma yüklenemedi. Can sayınız yetersiz olabilir.');
    } finally {
      setLoading(false);
    }
  };

  const handleHint = async () => {
    try {
      const hintData = await interactiveExerciseService.revealHint(id, 0);
      setHint(hintData.hint);
      setShowHint(true);
      toast('💡 İpucu gösteriliyor!', { icon: '💡' });
    } catch (err) {
      toast.error('İpucu alınamadı.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedAnswer) {
      toast.error('Lütfen bir cevap seçin!');
      return;
    }
    
    try {
      setSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000); // seconds
      
      // Submit answer to backend
      const result = await interactiveExerciseService.submitExercise(id, selectedAnswer, timeSpent);
      setFeedback(result);
      
      // Show toast feedback + sound effects
      if (result.isCorrect) {
        soundService.play('correct');
        soundService.play('xpGain');
        toast.success(`🎉 Doğru cevap! +${result.xpEarned} XP`);
      } else {
        soundService.play('wrong');
        if (result.heartsLost > 0) {
          soundService.play('heartLoss');
        }
        toast.error('😔 Yanlış cevap. Tekrar dene!');
      }
      
      // If correct, call completeExercise to record progress and unlock levels
      if (result.isCorrect) {
        try {
          const completeResult = await interactiveExerciseService.completeExercise(id, {
            isCorrect: true,
            xpEarned: result.xpEarned || 0,
            timeSpent
          });
          
          // Check if new level unlocked
          if (completeResult.unlocked && completeResult.unlocked.length > 0) {
            const newUnlocked = completeResult.unlocked[completeResult.unlocked.length - 1];
            soundService.play('unlock');
            soundService.play('levelUp');
            toast.success(`🎊 ${newUnlocked} seviyesi açıldı!`, { duration: 4000 });
          }
          
          console.log('✅ Progress updated!', completeResult);
        } catch (completeErr) {
          console.warn('Could not record completion:', completeErr);
          // Non-fatal — user still got feedback
        }
      }
      
      // Show achievement unlocks
      if (result.newAchievements && result.newAchievements.length > 0) {
        result.newAchievements.forEach(ach => {
          soundService.play('unlock');
          toast.success(`🏆 Yeni Başarı: ${ach.title}!\n${ach.description}`, { 
            duration: 5000,
            icon: ach.icon 
          });
        });
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.response?.data?.message || 'Cevap gönderilemedi.');
      setError(err.response?.data?.message || 'Cevap gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToExercises = () => {
    navigate('/student/exercises');
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <LoadingSpinner>🔄 Alıştırma yükleniyor...</LoadingSpinner>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentWrapper>
          <BackButton onClick={handleBackToExercises}>⬅ Alıştırmalara Dön</BackButton>
          <ErrorCard>
            <h3>❌ Hata</h3>
            <p>{error}</p>
            <NextButton onClick={handleBackToExercises}>Alıştırmalara Geri Dön</NextButton>
          </ErrorCard>
        </ContentWrapper>
      </PageContainer>
    );
  }

  if (!exercise) {
    return (
      <PageContainer>
        <ContentWrapper>
          <BackButton onClick={handleBackToExercises}>⬅ Alıştırmalara Dön</BackButton>
          <ErrorCard>
            <h3>🤔 Alıştırma Bulunamadı</h3>
            <p>Bu alıştırma mevcut değil veya silinmiş olabilir.</p>
            <NextButton onClick={handleBackToExercises}>Alıştırmalara Geri Dön</NextButton>
          </ErrorCard>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <BackButton onClick={handleBackToExercises}>⬅ Alıştırmalara Dön</BackButton>
        
        <ExerciseCard>
          {streakBonus && <StreakBonusBadge>🔥 Streak Bonus: +{streakBonus} XP</StreakBonusBadge>}
          
          <TopBar>
            <Timer $timeLeft={120 - timeElapsed}>
              ⏱️ {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}
            </Timer>
            {!feedback && (
              <HintButton onClick={handleHint} disabled={showHint}>
                {showHint ? '✅ İpucu Gösterildi' : '💡 İpucu Al'}
              </HintButton>
            )}
          </TopBar>

          {showHint && hint && (
            <div style={{ 
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '20px',
              border: '2px solid #F59E0B'
            }}>
              <strong>💡 İpucu:</strong> {hint}
            </div>
          )}
          
          <QuestionTitle>{exercise.question?.text || exercise.title}</QuestionTitle>
          
          {!feedback && exercise.question?.options && (
            <>
              <OptionsContainer>
                {exercise.question.options.map((option, index) => (
                  <OptionButton
                    key={index}
                    $isSelected={selectedAnswer === option}
                    onClick={() => setSelectedAnswer(option)}
                    disabled={submitting}
                  >
                    {String.fromCharCode(65 + index)}) {option}
                  </OptionButton>
                ))}
              </OptionsContainer>
              
              <SubmitButton
                onClick={handleSubmit}
                disabled={!selectedAnswer || submitting}
              >
                {submitting ? '⏳ Gönderiliyor...' : '✅ Cevabı Gönder'}
              </SubmitButton>
            </>
          )}
          
          {feedback && (
            <FeedbackCard $isCorrect={feedback.isCorrect}>
              <FeedbackTitle>
                {feedback.isCorrect ? '🎉 Tebrikler!' : '😔 Yanlış Cevap'}
              </FeedbackTitle>
              <FeedbackText>{feedback.feedback}</FeedbackText>
              {feedback.xpEarned > 0 && (
                <FeedbackText>⭐ {feedback.xpEarned} XP kazandınız!</FeedbackText>
              )}
              {feedback.heartsLost > 0 && (
                <FeedbackText>💔 {feedback.heartsLost} can kaybettiniz. Kalan: {feedback.currentHearts}</FeedbackText>
              )}
              {feedback.explanation && (
                <FeedbackText style={{ marginTop: 12, fontStyle: 'italic' }}>
                  💡 {feedback.explanation}
                </FeedbackText>
              )}
              <NextButton onClick={handleBackToExercises}>
                {feedback.isCorrect ? '🎯 Başka Alıştırma Çöz' : '🔄 Alıştırmalara Dön'}
              </NextButton>
            </FeedbackCard>
          )}
        </ExerciseCard>
      </ContentWrapper>
    </PageContainer>
  );
};

export default ExercisePlayer;
