const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

module.exports = function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization || req.headers.Authorization || req.headers['x-access-token'];
    if (!auth) return res.status(401).json({ error: 'Authorization token required' });
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'invalid token' }); }
    req.user = payload;
    return next();
  } catch (err) {
    console.error('authenticate error', err.message);
    return res.status(500).json({ error: 'internal error' });
  }
};
