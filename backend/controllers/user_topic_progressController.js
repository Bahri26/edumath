const repo = require('../repos/user_topic_progressRepo');

function getAuthUserId(req) {
  return Number(req.user?.id || req.user?.dbUser?.user_id || req.user?.user_id || 0) || null;
}

async function list(req, res) {
  const userId = getAuthUserId(req) || Number(req.query.user_id);
  if (!userId) return res.status(400).json({ error: 'user_id required' });
  try {
    const rows = await repo.getForUser(userId);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getOne(req, res) {
  const userId = getAuthUserId(req) || Number(req.query.user_id);
  const topicId = Number(req.params.topicId);
  if (!userId || !topicId) return res.status(400).json({ error: 'user_id and topicId required' });
  try {
    const row = await repo.getByUserAndTopic(userId, topicId);
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function recordReview(req, res) {
  const userId = getAuthUserId(req) || Number(req.body.user_id);
  const topicId = Number(req.params.topicId);
  const { correct } = req.body;
  if (!userId || !topicId || typeof correct !== 'boolean') {
    return res.status(400).json({ error: 'user_id, topicId and boolean correct required' });
  }
  try {
    const result = await repo.recordReview(userId, topicId, { correct });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { list, getOne, recordReview };
