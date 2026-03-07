const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const bcrypt = require('bcrypt');
const usersRepo = require('../repos/usersRepo');
const questionsRepo = require('../repos/questionsRepo');
const examsRepo = require('../repos/examsRepo');
const auditLogsRepo = require('../repos/audit_logsRepo');
const adminAuth = require('../middleware/adminAuth');
const coursesRepo = require('../repos/coursesRepo');
const knex = require('../db/knex');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const GEMINI_FALLBACK_MODELS = [
  GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro'
];

function uniqueModels(models) {
  return [...new Set((models || []).filter(Boolean))];
}

async function safeCount(tableName) {
  try {
    const [{ count } = { count: 0 }] = await knex(tableName).count({ count: '*' });
    return Number(count || 0);
  } catch (_) {
    return 0;
  }
}

async function getRecentLogSummary(limit = 5) {
  try {
    const colInfo = await knex('audit_logs').columnInfo();
    const cols = Object.keys(colInfo || {});
    const idCol = cols.includes('audit_log_id') ? 'audit_log_id' : cols.includes('id') ? 'id' : null;
    const messageCol = cols.includes('message') ? 'message' : null;
    const levelCol = cols.includes('level') ? 'level' : (cols.includes('severity') ? 'severity' : null);
    const createdCol = cols.includes('created_at') ? 'created_at' : (cols.includes('timestamp') ? 'timestamp' : null);

    const selectCols = [idCol, messageCol, levelCol, createdCol].filter(Boolean);
    if (!selectCols.length) return [];

    let query = knex('audit_logs').select(selectCols);
    if (createdCol) query = query.orderBy(createdCol, 'desc');
    else if (idCol) query = query.orderBy(idCol, 'desc');

    const rows = await query.limit(limit);
    return rows.map((r) => ({
      id: idCol ? r[idCol] : null,
      level: levelCol ? r[levelCol] : 'info',
      message: messageCol ? r[messageCol] : '-',
      createdAt: createdCol ? r[createdCol] : null
    }));
  } catch (_) {
    return [];
  }
}

async function getOpsSnapshot() {
  const [
    totalUsers,
    totalQuestions,
    totalExams,
    totalCourses,
    totalAttempts,
    submittedAttempts,
    recentLogs
  ] = await Promise.all([
    safeCount('users'),
    safeCount('questions'),
    safeCount('exams'),
    safeCount('courses'),
    safeCount('student_exam_attempts'),
    (async () => {
      try {
        const [{ count } = { count: 0 }] = await knex('student_exam_attempts').where('status', 'submitted').count({ count: '*' });
        return Number(count || 0);
      } catch (_) {
        return 0;
      }
    })(),
    getRecentLogSummary(5)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    metrics: {
      totalUsers,
      totalQuestions,
      totalExams,
      totalCourses,
      totalAttempts,
      submittedAttempts
    },
    recentLogs
  };
}

function roleIdToName(roleId) {
  const n = Number(roleId);
  if (n === 1) return 'admin';
  if (n === 2) return 'teacher';
  if (n === 3) return 'student';
  return 'student';
}

function isArchivedUser(user) {
  const email = String(user?.email || '').toLowerCase();
  return email.endsWith('@local.invalid') || email.startsWith('deleted+');
}

async function getUserCourseMap(userIds) {
  if (!Array.isArray(userIds) || !userIds.length) return {};
  const rows = await knex('course_enrollments as ce')
    .leftJoin('courses as c', 'ce.course_id', 'c.course_id')
    .whereIn('ce.user_id', userIds)
    .select('ce.user_id', 'ce.course_id', 'c.course_name');

  const map = {};
  rows.forEach((row) => {
    const uid = Number(row.user_id);
    if (!map[uid]) map[uid] = { course_ids: [], courses: [] };
    if (!map[uid].course_ids.includes(row.course_id)) {
      map[uid].course_ids.push(row.course_id);
    }
    if (row.course_name && !map[uid].courses.includes(row.course_name)) {
      map[uid].courses.push(row.course_name);
    }
  });
  return map;
}

async function buildLessonResolver(trx) {
  const lessons = await trx('lessons').select('lesson_id', 'name', 'slug').orderBy('lesson_id', 'asc');
  const byId = new Set(lessons.map((l) => Number(l.lesson_id)));
  const firstLessonId = lessons.length ? Number(lessons[0].lesson_id) : null;

  const norm = (v) =>
    String(v || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const lessonByName = new Map();
  lessons.forEach((l) => {
    const n1 = norm(l.name);
    const n2 = norm(l.slug);
    if (n1 && !lessonByName.has(n1)) lessonByName.set(n1, Number(l.lesson_id));
    if (n2 && !lessonByName.has(n2)) lessonByName.set(n2, Number(l.lesson_id));
  });

  return async (courseId) => {
    const cid = Number(courseId);
    if (Number.isInteger(cid) && byId.has(cid)) return cid;

    const course = await trx('courses').where({ course_id: cid }).first();
    const cName = norm(course?.course_name);
    if (cName && lessonByName.has(cName)) return lessonByName.get(cName);

    for (const [k, v] of lessonByName.entries()) {
      if (cName && (k.includes(cName) || cName.includes(k))) return v;
    }

    return firstLessonId;
  };
}

function normalizeTargetRole(value) {
  const role = String(value || 'all').trim().toLowerCase();
  return ['all', 'admin', 'teacher', 'student'].includes(role) ? role : null;
}

function renderFallbackOpsAnswer(message, snapshot) {
  const m = snapshot?.metrics || {};
  const logs = Array.isArray(snapshot?.recentLogs) ? snapshot.recentLogs : [];
  const logLines = logs.length
    ? logs.map((l, i) => `${i + 1}. [${String(l.level || 'info').toUpperCase()}] ${String(l.message || '-').slice(0, 120)}`).join('\n')
    : 'Son log bulunamadi.';

  return [
    `Komut alindi: ${String(message || '').trim() || '-'}`,
    '',
    'Anlik sistem ozeti:',
    `- Kullanici: ${m.totalUsers || 0}`,
    `- Soru: ${m.totalQuestions || 0}`,
    `- Sinav: ${m.totalExams || 0}`,
    `- Kurs: ${m.totalCourses || 0}`,
    `- Deneme: ${m.totalAttempts || 0} (submitted: ${m.submittedAttempts || 0})`,
    '',
    'Son loglar:',
    logLines,
    '',
    'Not: AI modeline ulasilamadi, bu cevap fallback ozettir.'
  ].join('\n');
}

async function askAdminAssistant(message, snapshot) {
  if (!GEMINI_API_KEY) {
    return {
      answer: renderFallbackOpsAnswer(message, snapshot),
      modelUsed: 'fallback-no-api-key',
      usedFallback: true
    };
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const contextJson = JSON.stringify(snapshot || {}, null, 2);
  const prompt = `Sen EduMath Admin Operations asistanisin.
Yanit dili: Turkce.
Kisa, net, operasyon odakli cevap ver.
Mesaj: ${String(message || '').trim()}

Asagidaki CANLI sistem snapshot bilgisini kullan:
${contextJson}

Kurallar:
- Cevabina once 1 satirlik durum ozeti yaz.
- Ardindan kritik metrikleri madde madde ver.
- Eğer loglarda riskli bir durum sezersen "Aksiyon" basligi ile 2-3 net adim oner.
- Uydurma bilgi verme; sadece snapshot veya mesaja dayan.`;

  let lastError = null;
  for (const model of uniqueModels(GEMINI_FALLBACK_MODELS)) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const text = String(response?.text || '').trim();
      if (text) {
        return { answer: text, modelUsed: model, usedFallback: model !== GEMINI_MODEL };
      }
      return { answer: 'Yanit uretilemedi.', modelUsed: model, usedFallback: model !== GEMINI_MODEL };
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '');
      const isModelNotFound = msg.includes('NOT_FOUND') || msg.includes('not found') || msg.includes('not supported');
      if (!isModelNotFound) break;
      console.warn(`[Admin AI] Model başarısız, sıradaki modele geçiliyor: ${model}`);
    }
  }

  return {
    answer: `${renderFallbackOpsAnswer(message, snapshot)}\nModel hatasi: ${String(lastError?.message || 'bilinmiyor')}`,
    modelUsed: 'fallback-on-error',
    usedFallback: true
  };
}

// Dev-only: mint a JWT for testing purposes (only when not in production)
router.get('/dev-token', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(404).json({ error: 'not found' });
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
    const role = req.query.role || 'admin';
    const userId = req.query.user_id ? Number(req.query.user_id) : undefined;
    let payload = { role };
    if (userId) payload.id = userId;
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, payload });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

// apply admin auth for all admin routes
router.use(adminAuth);

// GET /api/v1/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [u, q, e] = await Promise.all([
      usersRepo.findAll({ page: 1, limit: 1 }),
      questionsRepo.findAll({ page: 1, limit: 1 }),
      examsRepo.findAll({ page: 1, limit: 1 })
    ]);

    const payload = {
      users: {
        totalUsers: u.total || 0,
        totalTeachers: (await countByRole('teacher')) || 0,
        totalStudents: (await countByRole('student')) || 0
      },
      content: {
        totalQuestions: q.total || 0,
        totalExams: e.total || 0
      }
    };

    return res.json({ data: payload });
  } catch (err) {
    console.error('admin/stats error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// helper to count users by role quickly
async function countByRole(role) {
  try {
    const { rows, total } = await usersRepo.findAll({ page: 1, limit: 1, filters: { role } });
    return total;
  } catch (e) { return 0; }
}

// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, q, sort } = req.query;
    const includeDeleted = String(req.query?.includeDeleted || '') === '1';
    const result = await usersRepo.findAll({ page: Number(page), limit: Number(limit), q, sort });

    const userIds = (result.rows || []).map((u) => Number(u.user_id)).filter(Boolean);
    const courseMap = await getUserCourseMap(userIds);

    const safeRows = (result.rows || []).map((u) => {
      const { password_hash, password, passwordHash, api_token, reset_token, ...safe } = u || {};
      const uid = Number(safe.user_id);
      const courseInfo = courseMap[uid] || { course_ids: [], courses: [] };
      return {
        ...safe,
        role: roleIdToName(safe.role_id),
        course_ids: courseInfo.course_ids,
        courses: courseInfo.courses
      };
    });

    const filteredRows = includeDeleted ? safeRows : safeRows.filter((u) => !isArchivedUser(u));

    return res.json({ data: filteredRows, total: filteredRows.length });
  } catch (err) {
    console.error('admin/users error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pending-registrations
router.get('/pending-registrations', async (req, res) => {
  try {
    const rows = await knex('users')
      .where('is_active', 0)
      .whereNot('role_id', 1)
      .orderBy('created_at', 'desc')
      .select('user_id', 'full_name', 'email', 'role_id', 'created_at');

    const data = rows.map((u) => ({
      ...u,
      role: roleIdToName(u.role_id)
    }));

    return res.json({ data });
  } catch (err) {
    console.error('admin/pending-registrations error', err.message);
    return res.status(500).json({ message: 'Bekleyen kayitlar getirilemedi', error: err.message });
  }
});

// POST /api/admin/approve-registration
router.post('/approve-registration', async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    if (!userId) return res.status(400).json({ message: 'Geçerli userId zorunludur' });

    const user = await usersRepo.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanici bulunamadi' });

    await usersRepo.update(userId, { is_active: 1 });
    return res.json({ message: 'Kullanici onaylandi' });
  } catch (err) {
    console.error('admin/approve-registration error', err.message);
    return res.status(500).json({ message: 'Kullanici onaylanamadi', error: err.message });
  }
});

// GET /api/admin/password-requests
router.get('/password-requests', async (req, res) => {
  try {
    const rows = await knex('password_reset_requests as pr')
      .join('users as u', 'pr.user_id', 'u.user_id')
      .where('pr.status', 'pending')
      .orderBy('pr.created_at', 'desc')
      .select('pr.request_id', 'pr.user_id', 'pr.created_at', 'u.full_name', 'u.email');

    return res.json({ data: rows });
  } catch (err) {
    console.error('admin/password-requests error', err.message);
    return res.status(500).json({ message: 'Sifre talepleri getirilemedi', error: err.message });
  }
});

// POST /api/admin/approve-password
router.post('/approve-password', async (req, res) => {
  const trx = await knex.transaction();
  try {
    const requestId = Number(req.body?.requestId);
    if (!requestId) {
      await trx.rollback();
      return res.status(400).json({ message: 'Geçerli requestId zorunludur' });
    }

    const reqRow = await trx('password_reset_requests')
      .where({ request_id: requestId })
      .first();

    if (!reqRow) {
      await trx.rollback();
      return res.status(404).json({ message: 'Sifre talebi bulunamadi' });
    }
    if (reqRow.status !== 'pending') {
      await trx.rollback();
      return res.status(400).json({ message: 'Bu talep zaten islenmis' });
    }

    await trx('users')
      .where({ user_id: reqRow.user_id })
      .update({ password_hash: reqRow.new_password_hash });

    await trx('password_reset_requests')
      .where({ request_id: requestId })
      .update({ status: 'approved' });

    await trx.commit();
    return res.json({ message: 'Kullanici sifresi guncellendi' });
  } catch (err) {
    await trx.rollback();
    console.error('admin/approve-password error', err.message);
    return res.status(500).json({ message: 'Sifre talebi onaylanamadi', error: err.message });
  }
});

// PUT /api/admin/users/update-role
router.put('/users/update-role', async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    const newRoleId = Number(req.body?.newRoleId);
    if (!userId || ![1, 2, 3].includes(newRoleId)) {
      return res.status(400).json({ message: 'Geçerli userId ve newRoleId zorunludur' });
    }

    const user = await usersRepo.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanici bulunamadi' });

    await usersRepo.update(userId, { role_id: newRoleId });
    return res.json({ message: 'Kullanici rolu guncellendi' });
  } catch (err) {
    console.error('admin/users/update-role error', err.message);
    return res.status(500).json({ message: 'Rol guncellenemedi', error: err.message });
  }
});

// PUT /api/admin/users/update-courses
router.put('/users/update-courses', async (req, res) => {
  const trx = await knex.transaction();
  try {
    const userId = Number(req.body?.userId);
    const courseIds = Array.isArray(req.body?.courseIds) ? req.body.courseIds : [];
    if (!userId) {
      await trx.rollback();
      return res.status(400).json({ message: 'Geçerli userId zorunludur' });
    }

    const normalizedIds = [...new Set(courseIds.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))];

    const user = await usersRepo.findById(userId);
    if (!user) {
      await trx.rollback();
      return res.status(404).json({ message: 'Kullanici bulunamadi' });
    }

    await trx('course_enrollments').where({ user_id: userId }).del();
    if (normalizedIds.length) {
      const now = new Date();
      const adminId = Number(req.user?.id || req.user?.dbUser?.user_id) || null;
      const resolveLessonId = await buildLessonResolver(trx);
      const rows = [];

      for (const courseId of normalizedIds) {
        const lessonId = await resolveLessonId(courseId);
        if (!lessonId) {
          await trx.rollback();
          return res.status(400).json({ message: `Ders atamasi yapilamadi: course_id ${courseId} icin lesson_id bulunamadi` });
        }

        rows.push({
          user_id: userId,
          course_id: courseId,
          lesson_id: lessonId,
          assigned_by: adminId,
          created_at: now
        });
      }

      await trx('course_enrollments').insert(rows);
    }

    await trx.commit();
    return res.json({ message: 'Ders atamalari guncellendi' });
  } catch (err) {
    await trx.rollback();
    console.error('admin/users/update-courses error', err.message);
    return res.status(500).json({ message: 'Ders atamalari guncellenemedi', error: err.message });
  }
});

// PUT /api/admin/users/update-password
router.put('/users/update-password', async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    const newPassword = String(req.body?.newPassword || '').trim();
    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'Geçerli userId ve newPassword zorunludur' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Sifre en az 6 karakter olmali' });
    }

    const user = await usersRepo.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanici bulunamadi' });

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await usersRepo.update(userId, { password_hash });
    return res.json({ message: 'Kullanici sifresi guncellendi' });
  } catch (err) {
    console.error('admin/users/update-password error', err.message);
    return res.status(500).json({ message: 'Sifre guncellenemedi', error: err.message });
  }
});

// PUT /api/admin/users/toggle-status
router.put('/users/toggle-status', async (req, res) => {
  try {
    const userId = Number(req.body?.userId);
    if (!userId) return res.status(400).json({ message: 'Geçerli userId zorunludur' });

    const user = await usersRepo.findById(userId);
    if (!user) return res.status(404).json({ message: 'Kullanici bulunamadi' });

    const nextStatus = Number(user.is_active) === 1 ? 0 : 1;
    await usersRepo.update(userId, { is_active: nextStatus });
    return res.json({ message: 'Kullanici durumu guncellendi', is_active: nextStatus });
  } catch (err) {
    console.error('admin/users/toggle-status error', err.message);
    return res.status(500).json({ message: 'Kullanici durumu guncellenemedi', error: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const trx = await knex.transaction();
  try {
    const userId = Number(req.params.id);
    const currentAdminId = Number(req.user?.id || req.user?.dbUser?.user_id);
    if (!userId) {
      await trx.rollback();
      return res.status(400).json({ message: 'Geçerli userId zorunludur' });
    }
    if (currentAdminId && userId === currentAdminId) {
      await trx.rollback();
      return res.status(400).json({ message: 'Kendi hesabinizi silemezsiniz' });
    }

    const user = await trx('users').where({ user_id: userId }).first();
    if (!user) {
      await trx.rollback();
      return res.status(404).json({ message: 'Kullanici bulunamadi' });
    }

    const fkRowsRaw = await trx.raw(
      "SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME='users'"
    );
    const fkRows = Array.isArray(fkRowsRaw) ? fkRowsRaw[0] : fkRowsRaw;

    let hasDependency = false;
    for (const fk of fkRows) {
      const tableName = String(fk.TABLE_NAME || '');
      const colName = String(fk.COLUMN_NAME || '');
      if (!tableName || !colName || tableName === 'users') continue;

      const row = await trx(tableName).where(colName, userId).first();
      if (row) {
        hasDependency = true;
        break;
      }
    }

    if (!hasDependency) {
      await trx('course_enrollments').where({ user_id: userId }).del();
      await trx('password_reset_requests').where({ user_id: userId }).del();
      await trx('users').where({ user_id: userId }).del();
      await trx.commit();
      return res.status(204).end();
    }

    // FK baglantilari olan kayitlari fiziksel silmek yerine arsivliyoruz.
    const stamp = Date.now();
    const archivedEmail = `deleted+${userId}+${stamp}@local.invalid`;
    await trx('password_reset_requests').where({ user_id: userId, status: 'pending' }).update({ status: 'rejected' });
    await trx('users').where({ user_id: userId }).update({
      full_name: `Silinmis Kullanici #${userId}`,
      email: archivedEmail,
      is_active: 0
    });

    await trx.commit();
    return res.status(200).json({ message: 'Kullanici arsivlendi (FK baglantilari nedeniyle fiziksel silinmedi)' });
  } catch (err) {
    await trx.rollback();
    console.error('admin/users/:id delete error', err.message);
    return res.status(500).json({ message: 'Kullanici silinemedi', error: err.message });
  }
});

// GET /api/v1/admin/logs
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, q, sort } = req.query;
    const result = await auditLogsRepo.findAll({ page: Number(page), limit: Number(limit), q, sort });
    return res.json({ data: result.rows, total: result.total });
  } catch (err) {
    console.error('admin/logs error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/admin/courses
router.get('/courses', async (req, res) => {
  try {
    const { page = 1, limit = 50, q, sort } = req.query;
    const result = await coursesRepo.findAll({ page: Number(page), limit: Number(limit), q, sort });
    return res.json({ data: result.rows, total: result.total });
  } catch (err) {
    console.error('admin/courses error', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    const includeInactive = String(req.query?.includeInactive || '') === '1';
    let qb = knex('announcements').select('*').orderBy('id', 'desc');
    if (!includeInactive) qb = qb.where('is_active', 1);
    const rows = await qb;
    return res.json({ data: rows, total: rows.length });
  } catch (err) {
    console.error('admin/announcements list error', err.message);
    return res.status(500).json({ message: 'Duyurular getirilemedi', error: err.message });
  }
});

// POST /api/admin/announcements
router.post('/announcements', async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const message = String(req.body?.message || '').trim();
    const targetRole = normalizeTargetRole(req.body?.target_role);

    if (!title || !message) {
      return res.status(400).json({ message: 'Baslik ve mesaj zorunludur' });
    }
    if (!targetRole) {
      return res.status(400).json({ message: 'Gecersiz hedef kitle' });
    }

    const payload = {
      title,
      message,
      target_role: targetRole,
      is_active: 1,
      created_at: new Date()
    };

    const [id] = await knex('announcements').insert(payload);
    const created = await knex('announcements').where({ id }).first();
    return res.status(201).json({ data: created, message: 'Duyuru olusturuldu' });
  } catch (err) {
    console.error('admin/announcements create error', err.message);
    return res.status(500).json({ message: 'Duyuru olusturulamadi', error: err.message });
  }
});

// PUT /api/admin/announcements/:id
router.put('/announcements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Gecerli id zorunludur' });

    const existing = await knex('announcements').where({ id }).first();
    if (!existing) return res.status(404).json({ message: 'Duyuru bulunamadi' });

    const toUpdate = {};
    if (typeof req.body?.title !== 'undefined') {
      const title = String(req.body.title || '').trim();
      if (!title) return res.status(400).json({ message: 'Baslik bos olamaz' });
      toUpdate.title = title;
    }
    if (typeof req.body?.message !== 'undefined') {
      const message = String(req.body.message || '').trim();
      if (!message) return res.status(400).json({ message: 'Mesaj bos olamaz' });
      toUpdate.message = message;
    }
    if (typeof req.body?.target_role !== 'undefined') {
      const role = normalizeTargetRole(req.body.target_role);
      if (!role) return res.status(400).json({ message: 'Gecersiz hedef kitle' });
      toUpdate.target_role = role;
    }
    if (typeof req.body?.is_active !== 'undefined') {
      toUpdate.is_active = Number(req.body.is_active) ? 1 : 0;
    }

    if (!Object.keys(toUpdate).length) {
      return res.status(400).json({ message: 'Guncellenecek alan yok' });
    }

    await knex('announcements').where({ id }).update(toUpdate);
    const updated = await knex('announcements').where({ id }).first();
    return res.json({ data: updated, message: 'Duyuru guncellendi' });
  } catch (err) {
    console.error('admin/announcements update error', err.message);
    return res.status(500).json({ message: 'Duyuru guncellenemedi', error: err.message });
  }
});

// DELETE /api/admin/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'Gecerli id zorunludur' });

    const deleted = await knex('announcements').where({ id }).del();
    if (!deleted) return res.status(404).json({ message: 'Duyuru bulunamadi' });

    return res.status(204).end();
  } catch (err) {
    console.error('admin/announcements delete error', err.message);
    return res.status(500).json({ message: 'Duyuru silinemedi', error: err.message });
  }
});

// POST /api/admin/ai-assistant
router.post('/ai-assistant', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'message zorunludur' });
    }

    const snapshot = await getOpsSnapshot();
    const aiResult = await askAdminAssistant(message, snapshot);
    return res.json({
      data: {
        answer: aiResult.answer,
        modelUsed: aiResult.modelUsed,
        usedFallback: aiResult.usedFallback,
        snapshot
      }
    });
  } catch (err) {
    console.error('admin/ai-assistant error', err.message);
    return res.status(500).json({ message: 'AI asistan yanit uretemedi', error: err.message });
  }
});

module.exports = router;
