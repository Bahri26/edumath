const repo = require('../repos/responsesRepo');

async function list(req, res) {
  const { page = 1, limit = 50, q, sort } = req.query;
  const filters = {};
  // allow filtering by session_id or question_id
  if (req.query.session_id) filters.session_id = Number(req.query.session_id);
  if (req.query.question_id) filters.question_id = Number(req.query.question_id);
  try {
    const result = await repo.findAll({ page: Number(page), limit: Number(limit), q, filters, sort });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try { const item = await repo.findById(id); if (!item) return res.status(404).json({ error: 'not found' }); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); }
}

async function create(req, res) {
  const payload = req.body || {};
  if (!payload.session_id || !payload.question_id) return res.status(400).json({ error: 'session_id and question_id required' });
  try {
    const item = await repo.create({
      session_id: payload.session_id,
      question_id: payload.question_id,
      response: payload.response || null,
      correct: typeof payload.correct === 'boolean' ? payload.correct : null,
      response_time_ms: payload.response_time_ms || null
    });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function update(req, res) {
  const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' });
  try { const item = await repo.update(id, req.body); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); }
}

async function remove(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { await repo.remove(id); res.status(204).end(); } catch (err) { res.status(500).json({ error: err.message }); } }

module.exports = { list, getOne, create, update, remove };
