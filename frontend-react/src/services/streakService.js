// frontend-react/src/services/streakService.js

import api from './api';

const streakService = {
  // Get current streak information
  getStreak: async () => {
    try {
      const response = await api.get('/streak');
      return response.data;
    } catch (error) {
      console.error('Get streak error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update streak (called on daily login)
  updateStreak: async () => {
    try {
      const response = await api.post('/streak/update');
      return response.data;
    } catch (error) {
      console.error('Update streak error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Buy streak freeze (costs gems)
  buyStreakFreeze: async () => {
    try {
      const response = await api.post('/streak/buy-freeze');
      return response.data;
    } catch (error) {
      console.error('Buy streak freeze error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get streak history
  getStreakHistory: async () => {
    try {
      const response = await api.get('/streak/history');
      return response.data;
    } catch (error) {
      console.error('Get streak history error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default streakService;
