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
