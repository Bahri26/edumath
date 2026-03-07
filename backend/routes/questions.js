const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/questionsController');
const requireRole = require('../middleware/requireRole');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers['x-access-token'];
    if (!auth) {
      // No token provided - continue without user
      return next();
    }
    
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = payload;
      console.log(`🔐 [AUTH] User: id=${payload.id}, role=${payload.role}, subject=${payload.subject}`);
      console.log(`📦 Full payload:`, JSON.stringify(payload));
    } catch (e) {
      // Invalid token - continue without user
      console.warn('⚠️ [AUTH] Invalid/Expired token:', e.message);
    }
    return next();
  } catch (err) {
    console.error('optionalAuth error', err.message);
    return next(); // Continue anyway
  }
};

// ===== QUESTION CRUD =====
router.get('/', optionalAuth, ctrl.list);
router.post('/', requireRole('teacher', 'admin'), ctrl.create);
router.get('/my-questions', requireRole('teacher', 'admin'), ctrl.myQuestions);
router.get('/:id', ctrl.getOne);
router.put('/:id', requireRole('teacher', 'admin'), ctrl.update);
router.delete('/:id', requireRole('teacher', 'admin'), ctrl.remove);

// ===== QUESTION OPTIONS =====
router.get('/:id/options', ctrl.getOptions);
router.post('/:id/options', requireRole('teacher', 'admin'), ctrl.addOption);
router.put('/:id/options/:optionId', requireRole('teacher', 'admin'), ctrl.updateOption);
router.delete('/:id/options/:optionId', requireRole('teacher', 'admin'), ctrl.removeOption);
router.post('/:id/options/reorder', requireRole('teacher', 'admin'), ctrl.reorderOptions);
router.post('/:id/shuffle-options', requireRole('teacher', 'admin'), ctrl.shuffleOptions);

// ===== QUESTION ANALYSIS =====
router.get('/:id/analysis', requireRole('teacher', 'admin'), ctrl.analyzePerformance);

// ===== BULK OPERATIONS =====
router.post('/bulk-import', requireRole('teacher', 'admin'), ctrl.bulkImport);
router.get('/search', optionalAuth, ctrl.search);

// ===== AI GENERATION =====
router.post('/generate-ai', requireRole('teacher', 'admin'), ctrl.generateAI);

module.exports = router;
