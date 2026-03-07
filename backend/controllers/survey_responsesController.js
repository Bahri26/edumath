const repo = require('../repos/survey_responsesRepo');

async function list(req, res) {
  const { page = 1, limit = 20, q, sort } = req.query;
  const filters = {};
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
async function create(req, res) { try { const item = await repo.create(req.body); res.status(201).json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function update(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { const item = await repo.update(id, req.body); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function remove(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { await repo.remove(id); res.status(204).end(); } catch (err) { res.status(500).json({ error: err.message }); } }

module.exports = { list, getOne, create, update, remove };
