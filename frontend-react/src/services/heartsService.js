// frontend-react/src/services/heartsService.js

import api from './api';

const heartsService = {
  // Get current hearts status (auto-refills)
  getHearts: async () => {
    try {
      const response = await api.get('/hearts');
      return response.data;
    } catch (error) {
      console.error('Get hearts error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Lose a heart (wrong answer)
  loseHeart: async (exerciseId, answerId) => {
    try {
      const response = await api.post('/hearts/lose', { 
        exerciseId,
        answerId 
      });
      return response.data;
    } catch (error) {
      console.error('Lose heart error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Manually refill hearts (costs gems)
  refillHearts: async () => {
    try {
      const response = await api.post('/hearts/refill');
      return response.data;
    } catch (error) {
      console.error('Refill hearts error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Buy unlimited hearts (one-time purchase)
  buyUnlimitedHearts: async () => {
    try {
      const response = await api.post('/hearts/buy-unlimited');
      return response.data;
    } catch (error) {
      console.error('Buy unlimited hearts error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Restore heart through practice
  practiceRestore: async (practiceExerciseId) => {
    try {
      const response = await api.post('/hearts/practice-restore', {
        practiceExerciseId
      });
      return response.data;
    } catch (error) {
      console.error('Practice restore error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get hearts history
  getHeartsHistory: async () => {
    try {
      const response = await api.get('/hearts/history');
      return response.data;
    } catch (error) {
      console.error('Get hearts history error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default heartsService;
