// components/analytics/PerformanceChart.jsx
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin: 20px 0;
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #333;
`;

const CustomTooltip = styled.div`
  background: white;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const PerformanceChart = ({ data, title }) => {
  return (
    <ChartContainer>
      <ChartTitle>{title}</ChartTitle>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <CustomTooltip>
                  <p>Tarih: {label}</p>
                  <p>Skor: {payload[0].value}</p>
                </CustomTooltip>
              );
            }
            return null;
          }} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#8884d8" 
            activeDot={{ r: 8 }}
          />
          <Line 
            type="monotone" 
            dataKey="average" 
            stroke="#82ca9d" 
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PerformanceChart;