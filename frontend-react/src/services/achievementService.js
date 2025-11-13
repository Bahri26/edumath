// frontend-react/src/services/achievementService.js

import api from './api';

const achievementService = {
  // Initialize achievements (admin only)
  initializeAchievements: async () => {
    try {
      const response = await api.post('/achievements/initialize');
      return response.data;
    } catch (error) {
      console.error('Initialize achievements error:', error);
      throw error;
    }
  },

  // Get all achievement definitions
  getAllAchievements: async () => {
    try {
      const response = await api.get('/achievements/all');
      return response.data;
    } catch (error) {
      console.error('Get all achievements error:', error);
      throw error;
    }
  },

  // Get user's achievements with progress
  getUserAchievements: async () => {
    try {
      const response = await api.get('/achievements/my');
      return response.data;
    } catch (error) {
      console.error('Get user achievements error:', error);
      throw error;
    }
  },

  // Claim achievement rewards
  claimRewards: async (achievementId) => {
    try {
      const response = await api.post(`/achievements/${achievementId}/claim`);
      return response.data;
    } catch (error) {
      console.error('Claim rewards error:', error);
      throw error;
    }
  }
};

export default achievementService;
