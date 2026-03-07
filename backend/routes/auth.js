const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Çok fazla istek, lütfen daha sonra tekrar deneyin.' }
});

// Helpful GET so visiting the API path in a browser shows a friendly message
router.get('/', (req, res) => {
	res.json({ message: 'EduMath Auth API. Use POST /api/v1/auth/login to authenticate and POST /api/v1/auth/register to create an account.' });
});

router.post('/login', authLimiter, ctrl.login);
router.post('/register', authLimiter, ctrl.register);
router.post('/request-password-reset', authLimiter, ctrl.requestPasswordReset);

// Compatibility endpoint used by frontend to fetch current user
const jwt = require('jsonwebtoken');
const usersRepo = require('../repos/usersRepo');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

router.get('/me', async (req, res) => {
	try {
		const auth = req.headers.authorization || '';
		if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
		const token = auth.slice(7);
		let payload;
		try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'invalid token' }); }
		const uid = payload.id || payload.user_id || payload.sub;
		if (!uid) return res.status(400).json({ error: 'invalid token payload' });
		const user = await usersRepo.findById(uid);
		if (!user) return res.status(404).json({ error: 'user not found' });
		// remove sensitive fields
		delete user.password_hash; delete user.password; delete user.passwordHash;
		res.json({ data: { user } });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;
