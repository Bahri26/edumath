const UserActivity = require('../models/UserActivity');

const ADMIN_SUMMARIES = {
  approve_reset: 'Şifre sıfırlama talebini onayladı',
  set_password: 'Kullanıcıya yeni şifre atadı (sıfırlama talebi)',
  deny_reset: 'Şifre sıfırlama talebini reddetti',
  approve_user: 'Kullanıcı kaydını onayladı',
  admin_set_password: 'Kullanıcı şifresini yönetici olarak güncelledi',
  admin_internal_note: 'İç not ekledi',
  approve_branch: 'Öğretmen branş talebini onayladı',
  deny_branch: 'Öğretmen branş talebini reddetti',
  create_user: 'Yeni kullanıcı oluşturdu',
  update_user: 'Kullanıcı bilgilerini güncelledi',
  delete_user: 'Kullanıcıyı sildi',
  disable_user: 'Kullanıcı hesabını devre dışı bıraktı',
  enable_user: 'Kullanıcı hesabını yeniden etkinleştirdi',
  request_branch: 'Branş onay talebi gönderdi',
};

function getClientMeta(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = req.ip || (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || '';
  return {
    ip: String(ip).slice(0, 64),
    userAgent: String(req.get('user-agent') || '').slice(0, 500),
  };
}

function resolveUserFields(user, overrides = {}) {
  const uid = overrides.userId || user?._id || user?.id;
  return {
    userId: uid || undefined,
    userEmail: overrides.userEmail || user?.email || '',
    userName: overrides.userName || user?.name || '',
    userRole: overrides.userRole || user?.role || '',
  };
}

/**
 * Genel kullanıcı aktivitesi (fire-and-forget).
 */
async function recordUserActivity(req, payload = {}) {
  try {
    const {
      user = null,
      action,
      category = 'system',
      summary,
      targetType = '',
      targetId = null,
      targetLabel = '',
      metadata = {},
      userId,
      userEmail,
      userName,
      userRole,
    } = payload;

    if (!action || !summary) return;

    const { ip, userAgent } = getClientMeta(req);
    const fields = resolveUserFields(user, { userId, userEmail, userName, userRole });

    await UserActivity.create({
      ...fields,
      action,
      category,
      summary: String(summary).slice(0, 500),
      targetType: targetType || '',
      targetId: targetId || undefined,
      targetLabel: String(targetLabel || '').slice(0, 200),
      metadata,
      ip,
      userAgent,
    });
  } catch (err) {
    console.warn('[activityLogger]', payload?.action, err?.message);
  }
}

/** AdminAudit ile aynı anda UserActivity'ye yansıt */
async function recordAdminAudit(req, auditPayload) {
  const AdminAudit = require('../models/AdminAudit');
  try {
    await AdminAudit.create(auditPayload);
  } catch (err) {
    console.warn('[adminAudit]', auditPayload?.action, err?.message);
  }

  const User = require('../models/User');
  let actor = null;
  if (auditPayload.actorId) {
    actor = await User.findById(auditPayload.actorId).select('name email role').lean();
  }

  const target = auditPayload.targetEmail ? ` → ${auditPayload.targetEmail}` : '';
  const summary =
    ADMIN_SUMMARIES[auditPayload.action] ||
    auditPayload.action;

  await recordUserActivity(req, {
    user: actor,
    action: auditPayload.action,
    category: 'admin',
    summary: `${summary}${target}`,
    targetType: auditPayload.targetUserId ? 'user' : '',
    targetId: auditPayload.targetUserId,
    targetLabel: auditPayload.targetEmail || '',
    metadata: auditPayload.metadata || {},
  });
}

module.exports = {
  recordUserActivity,
  recordAdminAudit,
  getClientMeta,
  ADMIN_SUMMARIES,
};
