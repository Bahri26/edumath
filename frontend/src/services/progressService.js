// Get user skills
export async function getSkills() {
  const res = await apiClient.get('/progress/skills');
  return res.data?.data || res.data;
}

// Get user progress trends
export async function getTrends(days = 30) {
  const res = await apiClient.get(`/progress/trends?days=${days}`);
  return res.data?.data || res.data;
}
import apiClient from './api';

export async function getMyProgress() {
  const res = await apiClient.get('/progress/me');
  return res.data;
}

export async function getLeaderboard() {
  const res = await apiClient.get('/progress/leaderboard');
  return res.data;
}

export async function addXP(xp, subject = 'Matematik') {
  const res = await apiClient.post('/progress/add', { xp, subject });
  return res.data;
}
