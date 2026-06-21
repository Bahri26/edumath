const mongoose = require('mongoose');
const Student = require('../models/Student');

function toObjectId(id) {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
}

/**
 * Öğretmenin roster'ında (Student.userId) bu öğrenci var mı?
 * @param {string} teacherId - User._id (öğretmen)
 * @param {string} studentUserId - User._id (öğrenci)
 */
async function isStudentLinkedToTeacher(teacherId, studentUserId) {
  const tid = toObjectId(teacherId);
  const uid = toObjectId(studentUserId);
  if (!tid || !uid) return false;

  const link = await Student.findOne({ teacherId: tid, userId: uid }).select('_id').lean();
  return Boolean(link);
}

/**
 * Öğretmen/admin bir öğrenci kullanıcısına erişebilir mi?
 */
async function teacherCanAccessStudentUser(teacherId, studentUserId, role) {
  if (role === 'admin') return true;
  if (role !== 'teacher') return false;
  return isStudentLinkedToTeacher(teacherId, studentUserId);
}

/**
 * HTTP handler'lar için roster kontrolü.
 * @returns {{ allowed: boolean, status?: number, message?: string }}
 */
async function assertTeacherCanAccessStudentUser(teacherId, studentUserId, role) {
  if (!studentUserId) {
    return { allowed: false, status: 400, message: 'Öğrenci kimliği gerekli.' };
  }
  if (role === 'admin') {
    return { allowed: true };
  }
  if (role !== 'teacher') {
    return { allowed: false, status: 403, message: 'Bu işlem için öğretmen yetkisi gerekli.' };
  }
  const linked = await isStudentLinkedToTeacher(teacherId, studentUserId);
  if (!linked) {
    return {
      allowed: false,
      status: 403,
      message: 'Bu öğrenciye erişim yetkiniz yok.',
    };
  }
  return { allowed: true };
}

/**
 * AI / practice isteklerinde hedef öğrenci User._id çözümü.
 * - student: yalnızca kendi id
 * - teacher: roster doğrulaması async (ayrı assert)
 * - admin: istenen veya kendi
 */
function resolveSelfStudentUserId(role, actorUserId, requestedStudentUserId) {
  const selfId = String(actorUserId || '').trim();
  if (role === 'student') {
    return selfId;
  }
  if (role === 'admin') {
    return String(requestedStudentUserId || selfId).trim();
  }
  if (role === 'teacher') {
    return String(requestedStudentUserId || selfId).trim();
  }
  return '';
}

module.exports = {
  toObjectId,
  isStudentLinkedToTeacher,
  teacherCanAccessStudentUser,
  assertTeacherCanAccessStudentUser,
  resolveSelfStudentUserId,
};
