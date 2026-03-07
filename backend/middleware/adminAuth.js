const jwt = require('jsonwebtoken');
const usersRepo = require('../repos/usersRepo');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || req.headers['x-access-token'];
    if (!auth) return res.status(401).json({ error: 'Authorization token required' });
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'invalid token' }); }

    // quick check if token contains role
    if (payload && (payload.role === 'admin' || payload.role === 'ADMIN' || payload.role === 'Admin')) {
      req.user = payload; return next();
    }

    // otherwise fetch user record to verify role
    if (!payload || !payload.id) return res.status(403).json({ error: 'forbidden' });
    const user = await usersRepo.findById(payload.id);
    if (!user) return res.status(403).json({ error: 'forbidden' });
    const roleField = user.role || user.role_name || user.role_id;
    if (roleField === 'admin' || roleField === 'ADMIN' || roleField === 'Admin' || Number(roleField) === 1) {
      req.user = Object.assign({}, payload, { dbUser: user });
      return next();
    }

    return res.status(403).json({ error: 'admin access required' });
  } catch (err) {
    console.error('adminAuth error', err.message);
    return res.status(500).json({ error: 'internal error' });
  }
}

module.exports = adminAuth;
