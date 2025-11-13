// frontend-react/src/components/gamification/StreakCalendar.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import streakAdvancedService from '../../services/streakAdvancedService';

const CalendarContainer = styled.div`
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #333;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
`;

const LegendBox = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 4px;
  background: ${props => props.color};
  border: 1px solid #ddd;
`;

const MonthGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const MonthRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MonthLabel = styled.div`
  min-width: 80px;
  font-size: 14px;
  font-weight: 600;
  color: #666;
`;

const DaysRow = styled.div`
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
`;

const DayBox = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${props => 
    props.level === 3 ? '#10b981' : // Bonus XP - green
    props.level === 2 ? '#60a5fa' : // Maintained - blue
    props.level === 1 ? '#ef4444' : // Broken - red
    '#e5e7eb' // No data - gray
  };
  border: 1px solid ${props => 
    props.freezeUsed ? '#fbbf24' : 'transparent'
  };
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.5);
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Tooltip = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
`;

const StatsSection = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 12px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const StreakCalendar = () => {
  const [calendar, setCalendar] = useState([]);
  const [tooltip, setTooltip] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendar();
    loadHistory();
  }, []);

  const loadCalendar = async () => {
    try {
      const data = await streakAdvancedService.getCalendar();
      setCalendar(data.calendar || []);
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await streakAdvancedService.getHistory(365);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleDayHover = (e, day) => {
    setTooltip({
      x: e.clientX + 10,
      y: e.clientY + 10,
      content: `${day.date}\n${day.maintained ? `✅ ${day.xpEarned} XP` : '❌ Seri kırıldı'}${day.freezeUsed ? '\n🧊 Freeze kullanıldı' : ''}`
    });
  };

  const handleDayLeave = () => {
    setTooltip(null);
  };

  // Group by month
  const groupedByMonth = calendar.reduce((acc, day) => {
    const month = day.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(day);
    return acc;
  }, {});

  const months = Object.keys(groupedByMonth).sort().reverse().slice(0, 12);

  if (loading) {
    return <LoadingText>Takvim yükleniyor...</LoadingText>;
  }

  return (
    <CalendarContainer>
      <Header>
        <Title>🔥 Seri Takvimi (Son 12 Ay)</Title>
        <Legend>
          <LegendItem>
            <LegendBox color="#10b981" />
            Bonus XP
          </LegendItem>
          <LegendItem>
            <LegendBox color="#60a5fa" />
            Devam
          </LegendItem>
          <LegendItem>
            <LegendBox color="#ef4444" />
            Kırıldı
          </LegendItem>
          <LegendItem>
            <LegendBox color="#e5e7eb" />
            Veri yok
          </LegendItem>
          <LegendItem>
            <div style={{ width: 16, height: 16, border: '2px solid #fbbf24', borderRadius: 4 }} />
            Freeze
          </LegendItem>
        </Legend>
      </Header>

      <MonthGrid>
        {months.map(month => (
          <MonthRow key={month}>
            <MonthLabel>
              {new Date(month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </MonthLabel>
            <DaysRow>
              {groupedByMonth[month].map((day, index) => (
                <DayBox
                  key={index}
                  level={day.level}
                  freezeUsed={day.freezeUsed}
                  onMouseEnter={(e) => handleDayHover(e, day)}
                  onMouseLeave={handleDayLeave}
                />
              ))}
            </DaysRow>
          </MonthRow>
        ))}
      </MonthGrid>

      {stats && (
        <StatsSection>
          <h3 style={{ margin: 0, marginBottom: 12 }}>📊 İstatistikler</h3>
          <StatsGrid>
            <StatItem>
              <StatValue>{stats.currentStreak}</StatValue>
              <StatLabel>Mevcut Seri</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.longestStreak}</StatValue>
              <StatLabel>En Uzun Seri</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.totalDaysActive}</StatValue>
              <StatLabel>Toplam Gün</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.streakFreezes}</StatValue>
              <StatLabel>Freeze Hakkı</StatLabel>
            </StatItem>
          </StatsGrid>
        </StatsSection>
      )}

      {tooltip && (
        <Tooltip style={{ left: tooltip.x, top: tooltip.y }}>
          {tooltip.content.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </Tooltip>
      )}
    </CalendarContainer>
  );
};

export default StreakCalendar;
