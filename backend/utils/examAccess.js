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
  return list.map((exam) => ({
    ...exam,
    canManage: canManageExam(user, exam),
  }));
}

module.exports = {
  canManageExam,
  attachExamAccess,
};
