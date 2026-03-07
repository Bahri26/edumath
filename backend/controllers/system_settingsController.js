const repo = require('../repos/system_settingsRepo');
const { ADMIN_SETTINGS_VALIDATION_CODES } = require('../constants/adminSettingsValidationCodes');

const ADMIN_SETTINGS_KEY = 'admin_system_settings';

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function validateAdminSettings(rawValue) {
  let parsed;
  try {
    parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
  } catch (_) {
    return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.INVALID_JSON, error: 'setting_value geçerli bir JSON olmalı.' };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.INVALID_JSON_OBJECT, error: 'setting_value JSON object olmalı.' };
  }

  const allowedKeys = [
    'systemName', 'systemDescription', 'maintenanceMode', 'allowRegistrations',
    'defaultExamDuration', 'maxQuestionsPerExam', 'autoGrading',
    'aiEnabled', 'aiModel', 'maxAIRequestsPerDay',
    'requireEmailVerification', 'passwordMinLength', 'sessionTimeout', 'twoFactorEnabled',
    'emailNotifications', 'examResultNotifications', 'announcementNotifications'
  ];

  const unknownKey = Object.keys(parsed).find((k) => !allowedKeys.includes(k));
  if (unknownKey) return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.UNKNOWN_FIELD, error: `Bilinmeyen ayar alanı: ${unknownKey}` };

  const boolKeys = [
    'maintenanceMode', 'allowRegistrations', 'autoGrading', 'aiEnabled',
    'requireEmailVerification', 'twoFactorEnabled', 'emailNotifications',
    'examResultNotifications', 'announcementNotifications'
  ];

  for (const key of boolKeys) {
    if (typeof parsed[key] !== 'boolean') {
      return { ok: false, code: `ERR_${key.toUpperCase()}_TYPE`, error: `${key} boolean olmalı.` };
    }
  }

  if (typeof parsed.systemName !== 'string' || parsed.systemName.trim().length < 2 || parsed.systemName.trim().length > 80) {
    return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.SYSTEM_NAME_LENGTH, error: 'systemName 2-80 karakter olmalı.' };
  }

  if (typeof parsed.systemDescription !== 'string' || parsed.systemDescription.trim().length < 5 || parsed.systemDescription.trim().length > 300) {
    return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.SYSTEM_DESCRIPTION_LENGTH, error: 'systemDescription 5-300 karakter olmalı.' };
  }

  if (typeof parsed.aiModel !== 'string' || !['gemini-1.5-flash', 'gemini-1.5-pro'].includes(parsed.aiModel)) {
    return { ok: false, code: ADMIN_SETTINGS_VALIDATION_CODES.AI_MODEL_INVALID, error: 'aiModel desteklenmeyen bir değer.' };
  }

  const ranges = [
    ['defaultExamDuration', 10, 180],
    ['maxQuestionsPerExam', 5, 100],
    ['maxAIRequestsPerDay', 10, 5000],
    ['passwordMinLength', 6, 20],
    ['sessionTimeout', 1, 168]
  ];

  for (const [key, min, max] of ranges) {
    const value = toNumber(parsed[key]);
    if (Number.isNaN(value) || value < min || value > max) {
      const codeMap = {
        defaultExamDuration: ADMIN_SETTINGS_VALIDATION_CODES.DEFAULT_EXAM_DURATION_RANGE,
        maxQuestionsPerExam: ADMIN_SETTINGS_VALIDATION_CODES.MAX_QUESTIONS_PER_EXAM_RANGE,
        maxAIRequestsPerDay: ADMIN_SETTINGS_VALIDATION_CODES.MAX_AI_REQUESTS_PER_DAY_RANGE,
        passwordMinLength: ADMIN_SETTINGS_VALIDATION_CODES.PASSWORD_MIN_LENGTH_RANGE,
        sessionTimeout: ADMIN_SETTINGS_VALIDATION_CODES.SESSION_TIMEOUT_RANGE
      };
      return { ok: false, code: codeMap[key], error: `${key} ${min}-${max} aralığında olmalı.` };
    }
    parsed[key] = Math.round(value);
  }

  parsed.systemName = parsed.systemName.trim();
  parsed.systemDescription = parsed.systemDescription.trim();

  return { ok: true, value: JSON.stringify(parsed) };
}

async function list(req, res) {
  const { page = 1, limit = 20, q, sort } = req.query;
  const filters = {};
  try {
    const result = await repo.findAll({ page: Number(page), limit: Number(limit), q, filters, sort });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function getOne(req, res) {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'invalid id' });
  try { const item = await repo.findById(id); if (!item) return res.status(404).json({ error: 'not found' }); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); }
}
async function getByKey(req, res) {
  const key = String(req.params.key || '').trim();
  if (!key) return res.status(400).json({ error: 'invalid key' });
  try {
    const item = await repo.findByKey(key);
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function create(req, res) { try { const item = await repo.create(req.body); res.status(201).json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function update(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { const item = await repo.update(id, req.body); res.json(item); } catch (err) { res.status(500).json({ error: err.message }); } }
async function upsertByKey(req, res) {
  const key = String(req.params.key || '').trim();
  if (!key) return res.status(400).json({ error: 'invalid key' });
  if (typeof req.body?.setting_value === 'undefined') return res.status(400).json({ error: 'missing setting_value' });
  try {
    let settingValue = req.body.setting_value;
    if (key === ADMIN_SETTINGS_KEY) {
      const validation = validateAdminSettings(settingValue);
      if (!validation.ok) return res.status(400).json({ code: validation.code, error: validation.error });
      settingValue = validation.value;
    }

    const item = await repo.upsertByKey(key, settingValue);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
async function remove(req, res) { const id = Number(req.params.id); if (!id) return res.status(400).json({ error: 'invalid id' }); try { await repo.remove(id); res.status(204).end(); } catch (err) { res.status(500).json({ error: err.message }); } }

module.exports = { list, getOne, getByKey, create, update, upsertByKey, remove };
