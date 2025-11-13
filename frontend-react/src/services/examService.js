import api from './api';

// Exam related API functions
export async function getExams() {
  const data = await api.get('/exams').then(r => r.data);
  return data;
}

export async function getExamById(examId) {
  if (!examId) throw new Error('examId is required');
  return api.get(`/exams/${examId}`).then(r => r.data);
}

export async function startExam(examId) {
  if (!examId) throw new Error('examId is required');
  return api.get(`/exams/${examId}/start`).then(r => r.data);
}

export async function createExam(payload) {
  return api.post('/exams', payload).then(r => r.data);
}

export async function updateExamQuestions(examId, questions) {
  return api.put(`/exams/${examId}/questions`, { questions }).then(r => r.data);
}

// Optional: update general exam fields (if backend supports PUT /api/exams/:id)
export async function updateExam(examId, data) {
  return api.put(`/exams/${examId}`, data).then(r => r.data);
}

// Optional: delete exam (if backend supports DELETE /api/exams/:id)
export async function deleteExam(examId) {
  return api.delete(`/exams/${examId}`).then(r => r.data);
}
