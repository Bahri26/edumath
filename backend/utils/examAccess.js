/**
 * Sınav silme/güncelleme yetkisi:
 * - admin
 * - sınavı oluşturan öğretmen
 * - branşı onaylı öğretmen + sınav aynı branşta (paylaşılan havuz)
 */
function canManageExam(user, exam) {
  if (!user || !exam) return false;

  const userId = String(user._id || user.id || '');
  if (user.role === 'admin') return true;

  if (exam.createdBy && userId && String(exam.createdBy) === userId) {
    return true;
  }

  if (
    user.role === 'teacher'
    && user.branchApproval === 'approved'
    && user.branch
    && exam.subject
    && String(exam.subject).trim().toLowerCase() === String(user.branch).trim().toLowerCase()
  ) {
    return true;
  }

  return false;
}

function attachExamAccess(user, exams) {
  const list = Array.isArray(exams) ? exams : [exams];
  return list.map((exam) => attachExamAccessSingle(user, exam));
}

function attachExamAccessSingle(user, exam) {
  return {
    ...(exam?.toObject ? exam.toObject() : exam),
    canManage: canManageExam(user, exam),
  };
}

/**
 * Sınav sonuçlarını görüntüleme: sahip / branş yöneticisi veya kendi öğrencisi katıldıysa.
 */
async function canViewExamResults(userId, user, exam) {
  if (canManageExam({ ...user, id: userId }, exam)) {
    return true;
  }
  const results = exam.results || [];
  if (results.length === 0) {
    return false;
  }
  const Student = require('../models/Student');
  const roster = await Student.find({ teacherId: userId }).select('userId').lean();
  const rosterSet = new Set(roster.map((s) => String(s.userId)));
  return results.some((r) => rosterSet.has(String(r.studentId)));
}

module.exports = {
  canManageExam,
  attachExamAccess,
  attachExamAccessSingle,
  canViewExamResults,
};
