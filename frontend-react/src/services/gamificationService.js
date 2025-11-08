import api from './api';

export const gamificationService = {
  getDashboard: () => api.get('/gamification/dashboard').then(r => r.data),
  getDailyGoal: () => api.get('/gamification/daily-goal').then(r => r.data),
  useHeart: () => api.post('/gamification/use-heart').then(r => r.data),
  refillHearts: () => api.post('/gamification/refill-hearts').then(r => r.data),
  buyHearts: () => api.post('/gamification/buy-hearts').then(r => r.data),
  getAchievements: () => api.get('/gamification/achievements').then(r => r.data),
  getNewAchievements: () => api.get('/gamification/achievements/new').then(r => r.data),
  claimAchievement: (achievementId) => api.post(`/gamification/achievements/${achievementId}/claim`).then(r => r.data),
  getRecentActivity: (days=7) => api.get('/gamification/recent-activity', { params: { days } }).then(r => r.data),
  getDailySummary: (date) => api.get('/gamification/daily-summary', { params: { date } }).then(r => r.data),
  getWeeklyXP: () => api.get('/gamification/weekly-xp').then(r => r.data),
  updateStreak: () => api.post('/gamification/update-streak').then(r => r.data),
  addXP: (userId, amount, source) => api.post('/gamification/add-xp', { userId, amount, source }).then(r => r.data),
};

export default gamificationService;
