const usersRepo = require('../repos/usersRepo');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

async function getStudentLessonContext(userId, email) {
  try {
    const relatedUserIds = new Set();
    if (Number.isFinite(Number(userId))) {
      relatedUserIds.add(Number(userId));
    }

    if (email) {
      const sameEmailUsers = await knex('users')
        .whereRaw('LOWER(email) = LOWER(?)', [String(email).trim()])
        .select('user_id');
      sameEmailUsers.forEach((u) => {
        if (Number.isFinite(Number(u?.user_id))) relatedUserIds.add(Number(u.user_id));
      });
    }

    const idList = Array.from(relatedUserIds);
    if (!idList.length) {
      return { lessonOrCourse: null, lessonNames: [], courseNames: [] };
    }

    const rows = await knex('course_enrollments as ce')
      .leftJoin('lessons as l', 'ce.lesson_id', 'l.lesson_id')
      .leftJoin('courses as c', 'ce.course_id', 'c.course_id')
      .whereIn('ce.user_id', idList)
      .select('l.name as lesson_name', 'c.course_name')
      .orderBy('ce.created_at', 'desc');

    const lessonNames = Array.from(new Set(rows.map((r) => r.lesson_name).filter(Boolean)));
    const courseNames = Array.from(new Set(rows.map((r) => r.course_name).filter(Boolean)));
    const lessonOrCourse = lessonNames[0] || courseNames[0] || null;

    return { lessonOrCourse, lessonNames, courseNames };
  } catch (_) {
    return { lessonOrCourse: null, lessonNames: [], courseNames: [] };
  }
}

async function list(req, res) {
  const { page = 1, limit = 20, q, sort } = req.query;
  const filters = {};
  // allow filtering by role_id or is_active
  if (req.query.role_id) filters.role_id = req.query.role_id;
  if (req.query.is_active) filters.is_active = req.query.is_active;
  try {
    const result = await usersRepo.findAll({ page: Number(page), limit: Number(limit), q, filters, sort });
    // remove sensitive fields before returning
    result.rows = result.rows.map(u => {
      const { password_hash, api_token, reset_token, ...safe } = u || {};
      return safe;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    const user = await usersRepo.findById(id);
    if (!user) return res.status(404).json({ error: 'not found' });
    const { password_hash, api_token, reset_token, ...safe } = user || {};
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  const payload = req.body;
  try {
    // hash password_hash before storing
    if (payload.password_hash) {
      payload.password_hash = await bcrypt.hash(payload.password_hash, SALT_ROUNDS);
    }
    const user = await usersRepo.create(payload);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  const payload = req.body;
  try {
    if (payload.password_hash) {
      payload.password_hash = await bcrypt.hash(payload.password_hash, SALT_ROUNDS);
    }
    const user = await usersRepo.update(id, payload);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try {
    await usersRepo.remove(id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateTheme(req, res) {
  try {
    const theme = req.body && (req.body.theme || req.body.theme_preference);
    if (!theme) return res.status(400).json({ error: 'theme required' });
    // req.user should be set by requireRole middleware
    const uid = (req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id))) || null;
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });
    // update only the theme field
    const user = await usersRepo.update(Number(uid), { theme_preference: theme });
    if (!user) return res.status(404).json({ error: 'user not found' });
    const { password_hash, api_token, reset_token, ...safe } = user || {};
    return res.json(safe);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function me(req, res) {
  try {
    const uid = (req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id))) || null;
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });
    const user = await usersRepo.findById(Number(uid));
    if (!user) return res.status(404).json({ error: 'user not found' });
    const { password_hash, api_token, reset_token, ...safe } = user || {};

    if (Number(safe.role_id) === 3 || String(safe.role || '').toLowerCase() === 'student') {
      const lessonContext = await getStudentLessonContext(Number(uid), safe.email);
      safe.lesson_or_course = lessonContext.lessonOrCourse;
      safe.lesson_names = lessonContext.lessonNames;
      safe.course_names = lessonContext.courseNames;
    }

    return res.json({ data: safe });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function updateMe(req, res) {
  try {
    const uid = (req.user && (req.user.id || (req.user.dbUser && req.user.dbUser.user_id))) || null;
    if (!uid) return res.status(401).json({ error: 'unauthenticated' });

    const payload = req.body || {};
    const allowed = ['full_name', 'email', 'subject', 'phone_number', 'avatar_url'];
    const toUpdate = {};
    allowed.forEach((k) => {
      if (typeof payload[k] !== 'undefined') toUpdate[k] = payload[k];
    });

    if (Object.keys(toUpdate).length === 0) {
      return res.status(400).json({ error: 'no updatable fields provided' });
    }

    const user = await usersRepo.update(Number(uid), toUpdate);
    if (!user) return res.status(404).json({ error: 'user not found' });

    const { password_hash, api_token, reset_token, ...safe } = user || {};
    return res.json({ data: safe, message: 'Profil güncellendi' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { list, getOne, create, update, remove, updateTheme, me, updateMe };
