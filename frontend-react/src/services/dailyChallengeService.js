import api from './api';

const dailyChallengeService = {
  getMyChallenges: () => api.get('/challenges/my-challenges').then(r => r.data),
  updateProgress: (challengeId, currentValue) => api.put(`/challenges/${challengeId}/progress`, { currentValue }).then(r => r.data),
  claimRewards: (challengeId) => api.post(`/challenges/${challengeId}/claim-rewards`).then(r => r.data),
  refreshDaily: () => api.post('/challenges/refresh-daily').then(r => r.data),
  getStats: () => api.get('/challenges/stats').then(r => r.data)
};

export default dailyChallengeService;