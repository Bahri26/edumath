// frontend-react/src/pages/student/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import studentAnalyticsService from '../../services/studentAnalyticsService';
import toast from 'react-hot-toast';

const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  padding: 24px;
  background: ${props => props.gradient || 'white'};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: ${props => props.gradient ? 'white' : '#333'};
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
`;

const StatValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  opacity: ${props => props.gradient ? 0.9 : 0.7};
  font-weight: 500;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChartCard = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
`;

const TopicsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const TopicCard = styled.div`
  padding: 16px;
  background: ${props => props.type === 'strong' 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  };
  border-radius: 12px;
  color: white;
`;

const TopicTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const TopicStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  opacity: 0.9;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
`;

const TrendBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: ${props => 
    props.trend === 'improving' ? '#10b981' :
    props.trend === 'declining' ? '#ef4444' :
    '#6b7280'
  };
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [topicPerformance, setTopicPerformance] = useState([]);
  const [dailyActivity, setDailyActivity] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [trends, setTrends] = useState(null);
  const [strongestWeakest, setStrongestWeakest] = useState({ strongest: [], weakest: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [
        overviewData,
        topicData,
        dailyData,
        weeklyData,
        trendsData,
        swData
      ] = await Promise.all([
        studentAnalyticsService.getOverview(),
        studentAnalyticsService.getTopicPerformance(),
        studentAnalyticsService.getDailyActivity(30),
        studentAnalyticsService.getWeeklyStats(),
        studentAnalyticsService.getPerformanceTrends(),
        studentAnalyticsService.getStrongestWeakest()
      ]);

      setOverview(overviewData);
      setTopicPerformance(topicData.topicPerformance || []);
      setDailyActivity(dailyData.dailyActivity || []);
      setWeeklyStats(weeklyData.weeklyStats || []);
      setTrends(trendsData);
      setStrongestWeakest(swData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Analitik verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingText>📊 Analitikler yükleniyor...</LoadingText>;
  }

  return (
    <Container>
      <Header>
        <Title>📊 Performans Analizi</Title>
        <Subtitle>Öğrenme yolculuğunu detaylı incele</Subtitle>
      </Header>

      {/* Overview Stats */}
      <StatsGrid>
        <StatCard gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <StatValue>{overview.totalExercises}</StatValue>
          <StatLabel>Tamamlanan Egzersiz</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <StatValue>{overview.overallAccuracy}%</StatValue>
          <StatLabel>Genel Başarı Oranı</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <StatValue>{overview.totalXP}</StatValue>
          <StatLabel>Toplam XP</StatLabel>
        </StatCard>
        <StatCard gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
          <StatValue>{Math.round(overview.totalTimeSpent / 60)}h</StatValue>
          <StatLabel>Toplam Süre</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Performance Trend */}
      {trends && (
        <Section>
          <SectionTitle>
            📈 Performans Trendi
            <TrendBadge trend={trends.overallTrend}>
              {trends.overallTrend === 'improving' && '📈 Gelişiyor'}
              {trends.overallTrend === 'declining' && '📉 Düşüyor'}
              {trends.overallTrend === 'neutral' && '➡️ Stabil'}
            </TrendBadge>
          </SectionTitle>
          
          <ChartCard>
            <ChartTitle>Son 30 Günlük Başarı Oranı</ChartTitle>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends.accuracyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Başarı (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Section>
      )}

      {/* Weekly Stats */}
      <Section>
        <SectionTitle>📅 Haftalık İstatistikler</SectionTitle>
        <ChartCard>
          <ChartTitle>Son 12 Haftanın Karşılaştırması</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyStats.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="weekStart" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalExercises" fill="#667eea" name="Egzersiz" />
              <Bar dataKey="totalXP" fill="#f093fb" name="XP" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>

      {/* Topic Performance */}
      <Section>
        <SectionTitle>📚 Konu Bazlı Performans</SectionTitle>
        <ChartCard>
          <ChartTitle>Konu Başarı Dağılımı</ChartTitle>
          {topicPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={topicPerformance.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.topic}: ${entry.accuracy}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="accuracy"
                  nameKey="topic"
                >
                  {topicPerformance.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              Henüz veri yok
            </div>
          )}
        </ChartCard>
      </Section>

      {/* Strongest & Weakest Topics */}
      <Section>
        <SectionTitle>💪 En İyi & 📉 Geliştirilmesi Gereken Konular</SectionTitle>
        <TopicsGrid>
          {strongestWeakest.strongest.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 12, color: '#10b981' }}>✨ En İyi Konular</h4>
              {strongestWeakest.strongest.map((topic, index) => (
                <TopicCard key={index} type="strong">
                  <TopicTitle>{topic.topic}</TopicTitle>
                  <TopicStats>
                    <span>{topic.level}</span>
                    <span>{topic.accuracy.toFixed(1)}% başarı</span>
                  </TopicStats>
                </TopicCard>
              ))}
            </div>
          )}
          
          {strongestWeakest.weakest.length > 0 && (
            <div>
              <h4 style={{ marginBottom: 12, color: '#ef4444' }}>🎯 Geliştirilmesi Gerekenler</h4>
              {strongestWeakest.weakest.map((topic, index) => (
                <TopicCard key={index} type="weak">
                  <TopicTitle>{topic.topic}</TopicTitle>
                  <TopicStats>
                    <span>{topic.level}</span>
                    <span>{topic.accuracy.toFixed(1)}% başarı</span>
                  </TopicStats>
                </TopicCard>
              ))}
            </div>
          )}
        </TopicsGrid>
      </Section>

      {/* Daily Activity */}
      <Section>
        <SectionTitle>📆 Günlük Aktivite (Son 30 Gün)</SectionTitle>
        <ChartCard>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyActivity.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="exercisesCompleted" fill="#43e97b" name="Egzersiz" />
              <Bar dataKey="xpEarned" fill="#4facfe" name="XP" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </Section>
    </Container>
  );
};

export default AnalyticsPage;
