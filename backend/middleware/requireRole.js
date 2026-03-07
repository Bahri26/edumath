const jwt = require('jsonwebtoken');
const usersRepo = require('../repos/usersRepo');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function normalize(v) {
  if (v === undefined || v === null) return undefined;
  return String(v).toLowerCase();
}

module.exports = function requireRole(...allowed) {
  const allowedNorm = allowed.map(a => normalize(a));
  return async function (req, res, next) {
    try {
      const auth = req.headers.authorization || req.headers.Authorization || req.headers['x-access-token'];
      if (!auth) return res.status(401).json({ error: 'Authorization token required' });
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
      let payload;
      try { payload = jwt.verify(token, JWT_SECRET); } catch (e) { return res.status(401).json({ error: 'invalid token' }); }

      // check role in token
      if (payload && payload.role) {
        const r = normalize(payload.role);
        if (allowedNorm.includes(r)) {
          // Enrich payload with DB user so fields like subject/branch are always available
          if (payload.id) {
            try {
              const user = await usersRepo.findById(payload.id);
              if (user) {
                req.user = Object.assign({}, payload, {
                  dbUser: user,
                  subject: payload.subject || user.subject || null,
                  role_id: payload.role_id || user.role_id || null
                });
                return next();
              }
            } catch (_) {
              // fallback to token payload only
            }
          }
          req.user = payload;
          return next();
        }
      }

      // if token doesn't include role name, try DB lookup
      if (!payload || !payload.id) return res.status(403).json({ error: 'forbidden' });
      const user = await usersRepo.findById(payload.id);
      if (!user) return res.status(403).json({ error: 'forbidden' });
      const roleVal = normalize(user.role || user.role_name || user.role_id || user.roleId);
      // If DB stores numeric role ids, map them to role names so checks like 'teacher' work.
      const roleIdNum = Number(user.role_id || user.role || user.roleId);
      let mappedRoleName;
      if (!Number.isNaN(roleIdNum)) {
        if (roleIdNum === 1) mappedRoleName = 'admin';
        else if (roleIdNum === 2) mappedRoleName = 'teacher';
        else if (roleIdNum === 3) mappedRoleName = 'student';
      }
      if (allowedNorm.includes(roleVal) || (mappedRoleName && allowedNorm.includes(normalize(mappedRoleName)))) {
        req.user = Object.assign({}, payload, { dbUser: user });
        return next();
      }
      // check if any allowed entry is numeric and matches user's numeric role id
      for (const a of allowed) {
        const num = Number(a);
        if (!Number.isNaN(num) && Number(user.role_id || user.role || user.roleId) === num) {
          req.user = Object.assign({}, payload, { dbUser: user });
          return next();
        }
      }

      return res.status(403).json({ error: 'access denied' });
    } catch (err) {
      console.error('requireRole error', err.message);
      return res.status(500).json({ error: 'internal error' });
    }
  };
};
