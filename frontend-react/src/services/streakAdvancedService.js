// frontend-react/src/services/streakAdvancedService.js
import api from './api';

const streakAdvancedService = {
  // Get streak history with stats (last N days)
  getHistory: async (days = 30) => {
    const response = await api.get(`/streak-advanced/history?days=${days}`);
    return response.data;
  },

  // Get calendar view (365 days)
  getCalendar: async () => {
    const response = await api.get('/streak-advanced/calendar');
    return response.data;
  },

  // Buy a streak freeze
  buyFreeze: async () => {
    const response = await api.post('/streak-advanced/freeze/buy');
    return response.data;
  },

  // Get streak leaderboard
  getLeaderboard: async (limit = 50) => {
    const response = await api.get(`/streak-advanced/leaderboard?limit=${limit}`);
    return response.data;
  },

  // Get streak milestones
  getMilestones: async () => {
    const response = await api.get('/streak-advanced/milestones');
    return response.data;
  }
};

export default streakAdvancedService;
