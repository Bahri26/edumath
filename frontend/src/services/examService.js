import apiClient from '../services/api';

export const createExam = async ({ title, duration, classLevel, subject }) => {
  return apiClient.post('/exams/auto-generate', {
    title,
    duration: parseInt(duration),
    classLevel,
    subject,
  });
};
