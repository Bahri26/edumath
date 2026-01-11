import apiClient from './api';

// Smart parse an image into structured question fields
export async function smartParseImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/ai/smart-parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { success, data: { text, options, correctAnswer, solution, subject, classLevel, difficulty } }
}

// Solve a question from plain text (and optional options)
export async function solveTextQuestion({ text, options }) {
  const res = await apiClient.post('/ai/solve-text', { text, options });
  return res.data; // { success, solution, correctAnswer }
}

// Analyze performance (markdown insights)
export async function analyzePerformance({ examHistory = [], studentName = 'Öğrenci' }) {
  const res = await apiClient.post('/ai/analyze', { examHistory, studentName });
  return res.data; // { analysis }
}

// Create a personalized study plan
export async function createStudyPlan({ goal, hoursPerDay, daysLeft, weakTopics }) {
  const res = await apiClient.post('/ai/study-plan', { goal, hoursPerDay, daysLeft, weakTopics });
  return res.data; // { plan }
}

// Recommend next topic for a course
export async function recommendNextTopic({ courseTitle, classLevel, recentWeakTopics }) {
  const res = await apiClient.post('/ai/next-topic', { courseTitle, classLevel, recentWeakTopics });
  return res.data; // { success, topic, rationale, suggestedPacePerWeek }
}

// Recommend courses based on weak topics and catalog
export async function recommendCourses({ weakTopics, coursesCatalog }) {
  const res = await apiClient.post('/ai/recommend-courses', { weakTopics, coursesCatalog });
  return res.data; // { success, recommendations: [{ title, reason, score }] }
}

export async function chatWithAI(message) {
  try {
    const res = await apiClient.post('/chat', { message });
    return res.data; // { reply }
  } catch (err) {
    const status = err?.response?.status;
    if (status === 401) {
      const res = await apiClient.post('/chat/public', { message });
      return res.data;
    }
    throw err;
  }
}
