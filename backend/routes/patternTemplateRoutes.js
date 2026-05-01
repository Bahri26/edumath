const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const { generatePatternTemplateQuestions } = require('../services/patternTemplateService');

// POST /api/pattern-templates/generate
router.post('/generate', protect, role(['teacher', 'admin']), async (req, res) => {
  try {
    const questions = await generatePatternTemplateQuestions(req.body || {});
    return res.json({ success: true, questions });
  } catch (err) {
    const code = err.statusCode || 500;
    return res.status(code).json({ success: false, message: err.message || 'Şablon üretimi başarısız.' });
  }
});

module.exports = router;

