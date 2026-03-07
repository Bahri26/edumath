const usersRepo = require('../repos/usersRepo');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../db/knex');
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await knex('users')
      .whereRaw('LOWER(email) = ?', [normalizedEmail])
      .first();

    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const hash = user.password_hash || user.password || user.passwordHash;
    const ok = await bcrypt.compare(password, hash || '');
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    const roleName = user.role || (Number(user.role_id) === 1 ? 'admin' : Number(user.role_id) === 2 ? 'teacher' : 'student');
    // remove sensitive fields
    const out = Object.assign({}, user);
    out.role = roleName;
    delete out.password_hash; delete out.password; delete out.passwordHash;
    // sign jwt - include subject/branch for teachers
    const token = jwt.sign({ 
      id: out.id || out.user_id || out.id, 
      role: roleName,
      subject: out.subject || null
    }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ data: { user: out, token } });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function register(req, res) {
  const payload = req.body || {};
  if (!payload.email || !payload.password_hash && !payload.password) return res.status(400).json({ error: 'email and password required' });
  try {
    // accept either password or password_hash
    const pw = payload.password || payload.password_hash;
    payload.password_hash = await bcrypt.hash(pw, SALT_ROUNDS);
    // prepare insert object (avoid inserting unexpected fields)
    const toInsert = {
      email: payload.email,
      full_name: payload.full_name || payload.name,
      password_hash: payload.password_hash,
      role: payload.role || 'student'
    };
    const created = await usersRepo.create(toInsert);
    const out = Object.assign({}, created);
    delete out.password_hash; delete out.password; delete out.passwordHash;
    const token = jwt.sign({ id: out.id || out.user_id || out.id, role: out.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ data: { user: out, token }, message: 'Kayıt başarılı' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function requestPasswordReset(req, res) {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const newPassword = String(req.body?.newPassword || '').trim();
  if (!email || !newPassword) {
    return res.status(400).json({ message: 'email ve newPassword zorunludur' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Sifre en az 6 karakter olmali' });
  }

  try {
    const found = await usersRepo.findAll({ filters: { email } });
    const user = (found?.rows || [])[0];
    if (!user) return res.status(404).json({ message: 'Bu e-posta ile kullanici bulunamadi' });

    const new_password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const pending = await knex('password_reset_requests')
      .where({ user_id: user.user_id, status: 'pending' })
      .first();

    if (pending) {
      await knex('password_reset_requests')
        .where({ request_id: pending.request_id })
        .update({ new_password_hash, created_at: new Date() });
    } else {
      await knex('password_reset_requests').insert({
        user_id: user.user_id,
        new_password_hash,
        status: 'pending',
        created_at: new Date()
      });
    }

    return res.json({ message: 'Sifre degistirme talebiniz yoneticilere iletildi.' });
  } catch (err) {
    return res.status(500).json({ message: 'Sifre talebi olusturulamadi', error: err.message });
  }
}

module.exports = { login, register, requestPasswordReset };
