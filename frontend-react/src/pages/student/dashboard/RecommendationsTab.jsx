// pages/student/dashboard/RecommendationsTab.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  padding: 20px;
`;

const RecommendationCard = styled(motion.div)`
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;

  .icon {
    width: 40px;
    height: 40px;
    background: #f0f0f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    color: #4caf50;
  }

  .title {
    h4 {
      margin: 0;
      color: #333;
    }

    p {
      margin: 5px 0 0;
      color: #666;
      font-size: 14px;
    }
  }
`;

const CardContent = styled.div`
  .reason {
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
  }

  .stats {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;

    .stat {
      text-align: center;

      .value {
        font-size: 20px;
        font-weight: bold;
        color: #333;
      }

      .label {
        font-size: 12px;
        color: #666;
      }
    }
  }
`;

const ActionButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;

  &:hover {
    background: #388e3c;
  }
`;

const RecommendationsTab = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await axios.get('/api/analytics/recommendations');
        setRecommendations(response.data);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <Container>
      {recommendations.map((rec, index) => (
        <RecommendationCard
          key={rec.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CardHeader>
            <div className="icon">
              <i className={`fas fa-${rec.icon}`}></i>
            </div>
            <div className="title">
              <h4>{rec.title}</h4>
              <p>{rec.topic}</p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="reason">{rec.reason}</div>
            
            <div className="stats">
              <div className="stat">
                <div className="value">{rec.currentMastery}%</div>
                <div className="label">Mevcut Seviye</div>
              </div>
              <div className="stat">
                <div className="value">{rec.targetMastery}%</div>
                <div className="label">Hedef Seviye</div>
              </div>
              <div className="stat">
                <div className="value">{rec.estimatedTime}dk</div>
                <div className="label">Tahmini Süre</div>
              </div>
            </div>

            <ActionButton onClick={() => window.location.href = rec.actionUrl}>
              <i className="fas fa-play me-2"></i>
              Çalışmaya Başla
            </ActionButton>
          </CardContent>
        </RecommendationCard>
      ))}
    </Container>
  );
};

export default RecommendationsTab;