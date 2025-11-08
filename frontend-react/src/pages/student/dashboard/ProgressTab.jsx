// pages/student/dashboard/ProgressTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import PerformanceChart from '../../../components/analytics/PerformanceChart';

const Container = styled.div`
  padding: 20px;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatBox = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);

  h4 {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
    margin: 10px 0;
  }

  .trend {
    font-size: 12px;
    color: ${props => props.trend > 0 ? '#4caf50' : '#f44336'};

    i {
      margin-right: 5px;
    }
  }
`;

const TopicsContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin: 20px 0;
`;

const TopicList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 15px;
`;

const TopicCard = styled.div`
  background: ${props => props.mastery > 80 ? '#e8f5e9' : props.mastery > 50 ? '#fff3e0' : '#ffebee'};
  padding: 15px;
  border-radius: 8px;

  h5 {
    margin: 0;
    color: #333;
  }

  .mastery {
    font-size: 20px;
    font-weight: bold;
    margin: 10px 0;
  }

  .status {
    font-size: 12px;
    color: #666;
  }
`;

const ProgressTab = () => {
  const [stats, setStats] = useState({
    accuracy: 0,
    completedTopics: 0,
    averageScore: 0,
    studyStreak: 0
  });
  const [topics, setTopics] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, topicsRes, performanceRes] = await Promise.all([
          axios.get('/api/analytics/stats'),
          axios.get('/api/analytics/topics'),
          axios.get('/api/analytics/performance')
        ]);

        setStats(statsRes.data);
        setTopics(topicsRes.data);
        setPerformanceData(performanceRes.data);
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Container>
      <StatsContainer>
        <StatBox trend={5}>
          <h4>Doğruluk Oranı</h4>
          <div className="value">{stats.accuracy}%</div>
          <div className="trend">
            <i className="fas fa-arrow-up"></i>
            %5 artış
          </div>
        </StatBox>

        <StatBox trend={2}>
          <h4>Tamamlanan Konular</h4>
          <div className="value">{stats.completedTopics}</div>
          <div className="trend">
            <i className="fas fa-arrow-up"></i>
            2 yeni
          </div>
        </StatBox>

        <StatBox trend={-1}>
          <h4>Ortalama Skor</h4>
          <div className="value">{stats.averageScore}</div>
          <div className="trend">
            <i className="fas fa-arrow-down"></i>
            %1 düşüş
          </div>
        </StatBox>

        <StatBox trend={3}>
          <h4>Çalışma Serisi</h4>
          <div className="value">{stats.studyStreak} gün</div>
          <div className="trend">
            <i className="fas fa-arrow-up"></i>
            3 gün arttı
          </div>
        </StatBox>
      </StatsContainer>

      <PerformanceChart 
        data={performanceData}
        title="Performans Gelişimi"
      />

      <TopicsContainer>
        <h3>Konu Bazlı İlerleme</h3>
        <TopicList>
          {topics.map((topic) => (
            <TopicCard key={topic.id} mastery={topic.mastery}>
              <h5>{topic.name}</h5>
              <div className="mastery">{topic.mastery}%</div>
              <div className="status">
                {topic.mastery > 80 ? 'Uzmanlaşıldı' : 
                 topic.mastery > 50 ? 'Öğreniliyor' : 
                 'Geliştirilmeli'}
              </div>
            </TopicCard>
          ))}
        </TopicList>
      </TopicsContainer>
    </Container>
  );
};

export default ProgressTab;