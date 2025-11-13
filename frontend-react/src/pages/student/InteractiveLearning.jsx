// frontend-react/src/pages/student/InteractiveLearning.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
  font-size: 20px;
  opacity: 0.95;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 40px;
  flex-wrap: wrap;
`;

const ContentCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 32px;
`;

const FeatureCard = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, ${props => props.$color1} 0%, ${props => props.$color2} 100%);
  border-radius: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
`;

const FeatureIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const FeatureTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const FeatureDescription = styled.p`
  font-size: 14px;
  opacity: 0.95;
  line-height: 1.6;
`;

const ComingSoonBadge = styled.div`
  display: inline-block;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 12px;
  font-size: 12px;
  margin-top: 12px;
  font-weight: 600;
`;

const InteractiveLearning = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: '🎯',
      title: 'İnteraktif Alıştırmalar',
      description: 'Sürükle-bırak, eşleştirme, grafik çizimi ve daha fazlası ile etkileşimli matematik problemleri çöz.',
      color1: '#4F46E5',
      color2: '#7C3AED',
      available: true,
      link: '/student/exercises'
    },
    {
      icon: '🏆',
      title: 'Liderlik Tablosu',
      description: 'Sınıf arkadaşlarınla yarış, haftalık ve aylık sıralamalarda zirveye çık!',
      color1: '#F59E0B',
      color2: '#EF4444',
      available: true,
      link: '/student/dashboard' // Mevcut leaderboard özelliği
    },
    {
      icon: '🎓',
      title: 'Beceri Ağacı',
      description: 'Adım adım öğren, konuları kilitle ve becerilerini geliştir.',
      color1: '#10B981',
      color2: '#059669',
      available: false
    },
    {
      icon: '💪',
      title: 'Pratik Modu',
      description: 'Yanlış yaptığın soruları tekrar çöz, kalp kazan ve pekiştir.',
      color1: '#8B5CF6',
      color2: '#6D28D9',
      available: false
    },
    {
      icon: '🎖️',
      title: 'Başarım Rozetleri',
      description: 'Özel görevleri tamamla, rozetler kazan ve koleksiyonunu oluştur.',
      color1: '#EC4899',
      color2: '#BE185D',
      available: true
    },
    {
      icon: '📜',
      title: 'Sertifikalar',
      description: 'Konuları tamamla, sınavları geç ve resmi sertifikalarını al.',
      color1: '#06B6D4',
      color2: '#0891B2',
      available: false
    }
  ];

  return (
    <PageContainer>
      <ContentWrapper>
        <Header>
          <Title>🚀 İnteraktif Öğrenme</Title>
          <Subtitle>Duolingo ve DataCamp'ten ilham alan etkileşimli matematik öğrenme platformu</Subtitle>
        </Header>

        <ContentCard>
          <SectionTitle>
            ✨ Özellikler
          </SectionTitle>
          
          <FeatureGrid>
            {features.map((feature, index) => (
              <FeatureCard 
                key={index}
                $color1={feature.color1}
                $color2={feature.color2}
                onClick={() => feature.available && feature.link && navigate(feature.link)}
                style={{ cursor: feature.available && feature.link ? 'pointer' : 'default' }}
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
                {!feature.available && (
                  <ComingSoonBadge>Yakında</ComingSoonBadge>
                )}
              </FeatureCard>
            ))}
          </FeatureGrid>

          <div style={{ marginTop: '40px', padding: '24px', background: '#F3F4F6', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1F2937', marginBottom: '16px' }}>
              📊 Duolingo & DataCamp'ten Eklenen Özellikler:
            </h3>
            <ul style={{ lineHeight: '2', color: '#4B5563', paddingLeft: '24px' }}>
              <li><strong>Streak Sistemi:</strong> Günlük giriş takibi, donma hakkı, mil taşı bonusları</li>
              <li><strong>Kalp/Can Sistemi:</strong> 5 maksimum kalp, 30 dakikada +1 dolum, pratikle kazanma</li>
              <li><strong>10 Farklı Soru Tipi:</strong> Çoktan seçmeli, boşluk doldurma, sürükle-bırak, eşleştirme, sıralama, çizim, sayı doğrusu, kesir görseli, grafik çizimi, denklem kurma</li>
              <li><strong>Anlık Geri Bildirim:</strong> Her sorudan sonra doğru/yanlış açıklaması</li>
              <li><strong>İpucu Sistemi:</strong> XP karşılığında ipucu açma (Duolingo tarzı)</li>
              <li><strong>XP ve Seviye:</strong> Temel + mükemmel bonus + streak bonusu hesaplama</li>
              <li><strong>Gamification:</strong> Başarımlar, liderlik tablosu, günlük challenge'lar</li>
            </ul>
          </div>
        </ContentCard>
      </ContentWrapper>
    </PageContainer>
  );
};

export default InteractiveLearning;
