const SELF_REGISTER_ROLES = new Set(['student', 'teacher']);

/** Public kayıtta izin verilen roller; admin ve diğerleri reddedilir. */
function resolveSelfRegisterRole(role) {
  const normalized = String(role || 'student').trim().toLowerCase();
  return SELF_REGISTER_ROLES.has(normalized) ? normalized : 'student';
}

module.exports = {
  SELF_REGISTER_ROLES,
  resolveSelfRegisterRole,
};
