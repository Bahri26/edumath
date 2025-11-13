// frontend-react/src/services/studentAnalyticsService.js
import api from './api';

const studentAnalyticsService = {
  // Get overview statistics
  getOverview: async () => {
    const response = await api.get('/student-analytics/overview');
    return response.data;
  },

  // Get performance by topic
  getTopicPerformance: async () => {
    const response = await api.get('/student-analytics/topic-performance');
    return response.data;
  },

  // Get daily activity (last N days)
  getDailyActivity: async (days = 30) => {
    const response = await api.get(`/student-analytics/daily-activity?days=${days}`);
    return response.data;
  },

  // Get weekly stats (last 12 weeks)
  getWeeklyStats: async () => {
    const response = await api.get('/student-analytics/weekly-stats');
    return response.data;
  },

  // Get attempt history
  getAttemptHistory: async (limit = 20) => {
    const response = await api.get(`/student-analytics/attempt-history?limit=${limit}`);
    return response.data;
  },

  // Get performance trends
  getPerformanceTrends: async () => {
    const response = await api.get('/student-analytics/performance-trends');
    return response.data;
  },

  // Get strongest and weakest topics
  getStrongestWeakest: async () => {
    const response = await api.get('/student-analytics/strongest-weakest');
    return response.data;
  },

  // Compare with class average
  getComparison: async (classId) => {
    const response = await api.get(`/student-analytics/comparison?classId=${classId}`);
    return response.data;
  }
};

export default studentAnalyticsService;
