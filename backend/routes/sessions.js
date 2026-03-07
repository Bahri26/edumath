const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sessionsController');
const authenticate = require('../middleware/authenticate');
const responsesCtrl = require('../controllers/responsesController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
// record a response for a session: POST /api/v1/sessions/:id/response
router.post('/:id/response', authenticate, async (req, res) => {
	try {
		const sessionId = Number(req.params.id);
		if (!sessionId) return res.status(400).json({ error: 'invalid session id' });
		const payload = req.body || {};
		// minimal validation
		if (!payload.question_id) return res.status(400).json({ error: 'question_id required' });
		// attach session id from URL
		const created = await responsesCtrl.create({ body: { session_id: sessionId, question_id: payload.question_id, response: payload.response, correct: payload.correct, response_time_ms: payload.response_time_ms } }, res);
		// responsesController.create sends response; nothing more to do here
	} catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
