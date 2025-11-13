import api from './api';

export async function getExamResults(examId) {
  return api.get(`/results/${examId}`).then(r => r.data);
}

export async function submitExamResult(payload) {
  return api.post('/results/submit', payload).then(r => r.data);
}
