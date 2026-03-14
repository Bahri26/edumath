const adaptiveLearningService = require('../services/adaptiveLearningService');

function getAuthUserId(req) {
  return Number(req.user?.id || req.user?.dbUser?.user_id || req.user?.user_id || 0) || null;
}

async function next(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const payload = await adaptiveLearningService.getNextAction(userId);
    res.json({ data: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function answer(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const payload = await adaptiveLearningService.submitAnswer(userId, req.body || {});
    res.json({ data: payload });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

async function progress(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const payload = await adaptiveLearningService.getTodayProgress(userId);
    res.json({ data: payload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function activity(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ error: 'unauthenticated' });
  try {
    const payload = await adaptiveLearningService.submitLearningActivity(userId, req.body || {});
    res.json({ data: payload });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { next, answer, progress, activity };