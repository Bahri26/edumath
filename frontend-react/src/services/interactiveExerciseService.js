// frontend-react/src/services/interactiveExerciseService.js

import api from './api';

const interactiveExerciseService = {
  // List exercises with filters
  listExercises: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.topic) queryParams.append('topic', filters.topic);
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.exerciseType) queryParams.append('exerciseType', filters.exerciseType);
      if (filters.gradeLevel) queryParams.append('gradeLevel', filters.gradeLevel);
      if (filters.curriculum) queryParams.append('curriculum', filters.curriculum);
      if (filters.classLevel) queryParams.append('classLevel', filters.classLevel);
      
      const response = await api.get(`/interactive-exercises?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('List exercises error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Start an exercise (checks hearts availability)
  startExercise: async (exerciseId) => {
    try {
      const response = await api.get(`/interactive-exercises/${exerciseId}/start`);
      return response.data;
    } catch (error) {
      console.error('Start exercise error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Submit exercise answer
  submitExercise: async (exerciseId, answers, timeSpent) => {
    try {
      const response = await api.post(`/interactive-exercises/${exerciseId}/submit`, {
        answers,
        timeSpent
      });
      return response.data;
    } catch (error) {
      console.error('Submit exercise error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Mark single question as completed (useful for leveling)
  completeExercise: async (exerciseId, payload = {}) => {
    try {
      const response = await api.post(`/interactive-exercises/${exerciseId}/complete`, payload);
      return response.data;
    } catch (error) {
      console.error('Complete exercise error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get current user's progress (counts per difficulty and unlocked levels)
  getProgress: async () => {
    try {
      const response = await api.get('/interactive-exercises/my-progress');
      return response.data;
    } catch (error) {
      console.error('Get progress error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Reveal hint (costs XP)
  revealHint: async (exerciseId, hintIndex) => {
    try {
      const response = await api.post(`/interactive-exercises/${exerciseId}/hint`, {
        hintIndex
      });
      return response.data;
    } catch (error) {
      console.error('Reveal hint error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Get explanation after completion
  getExplanation: async (exerciseId) => {
    try {
      const response = await api.get(`/interactive-exercises/${exerciseId}/explanation`);
      return response.data;
    } catch (error) {
      console.error('Get explanation error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default interactiveExerciseService;
