import apiClient, { withAiRequestConfig } from './api';

/** AI istekleri backend `/api/ai` — varsayılan yerel motor (MongoDB + ml-matrix + OCR). */

export async function smartParseImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/ai/smart-parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...withAiRequestConfig(),
  });
  return res.data;
}

export async function smartParseText(content) {
  const res = await apiClient.post('/ai/smart-parse-text', { content }, withAiRequestConfig());
  return res.data;
}

export async function solveFromImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await apiClient.post('/ai/solve-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    ...withAiRequestConfig(),
  });
  return res.data;
}

export async function generateQuiz({
  topic,
  difficulty,
  count,
  classLevel,
  subject,
  googleGrounding,
}) {
  const res = await apiClient.post(
    '/ai/generate-quiz',
    { topic, difficulty, count, classLevel, subject, googleGrounding },
    withAiRequestConfig()
  );
  return res.data;
}

export async function generatePatternQuestionPack(payload) {
  const res = await apiClient.post('/ai/generate-pattern-pack', payload ?? {}, withAiRequestConfig());
  return res.data;
}

export async function generatePracticeQuestions({ weakTopics, difficulty = 'Orta', count = 5 }) {
  const res = await apiClient.post(
    '/ai/practice',
    { weakTopics, difficulty, count },
    withAiRequestConfig()
  );
  return res.data;
}

export async function analyzePerformance({ examHistory = [], studentName = 'Öğrenci' }) {
  const res = await apiClient.post('/ai/analyze', { examHistory, studentName }, withAiRequestConfig());
  return res.data;
}

export async function createStudyPlan({ goal, hoursPerDay, daysLeft, weakTopics }) {
  const res = await apiClient.post('/ai/study-plan', { goal, hoursPerDay, daysLeft, weakTopics }, withAiRequestConfig());
  return res.data;
}

export async function teacherReport({ examResults }) {
  const res = await apiClient.post('/ai/teacher-report', { examResults }, withAiRequestConfig());
  return res.data;
}

export async function examResultAnalysis(payload) {
  const res = await apiClient.post('/ai/exam-result-analysis', payload, withAiRequestConfig());
  return res.data;
}

export async function getHint({ questionText, studentAnswer, questionId, topic, subject }) {
  const res = await apiClient.post(
    '/ai/get-hint',
    { questionText, studentAnswer, questionId, topic, subject },
    withAiRequestConfig()
  );
  return res.data;
}

export async function analyzeAndSuggest({ answer, studentId }) {
  const res = await apiClient.post('/ai/analyze-and-suggest', { answer, studentId }, withAiRequestConfig());
  return res.data;
}

export async function chatWithAI(message) {
  const res = await apiClient.post('/chat', { message }, withAiRequestConfig());
  return res.data;
}
