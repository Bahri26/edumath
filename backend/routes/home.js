const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/homeController');

router.get('/summary', ctrl.summary);
router.get('/daily-fact', ctrl.dailyFact);
router.get('/announcements', ctrl.announcements);

// Backwards-compatible aliases expected by frontend
// /api/v1/home/stats  -> summary
// /api/v1/home/fact   -> dailyFact
router.get('/stats', ctrl.summary);
router.get('/fact', ctrl.dailyFact);

module.exports = router;
