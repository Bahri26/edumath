const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const Assignment = require('../models/Assignment');
const Exercise = require('../models/Exercise');
const Survey = require('../models/Survey');
const User = require('../models/User');
const Student = require('../models/Student');

const toObjectId = (id) => {
  try {
    return new mongoose.Types.ObjectId(String(id));
  } catch {
    return null;
  }
};

async function upsertStudentLinks(teacherId, userIdStrings) {
  const tid = toObjectId(teacherId);
  if (!tid || !userIdStrings.length) return;

  const oidList = [...new Set(userIdStrings)]
    .map((id) => toObjectId(id))
    .filter(Boolean);
  if (oidList.length === 0) return;

  const alreadyLinked = await Student.find({
    teacherId: tid,
    userId: { $in: oidList },
  }).distinct('userId');

  const linkedSet = new Set(alreadyLinked.map((id) => String(id)));
  const missing = oidList.filter((id) => !linkedSet.has(String(id)));
  if (missing.length === 0) return;

  const users = await User.find({
    _id: { $in: missing },
    role: 'student',
  })
    .select('_id grade')
    .lean();

  for (const u of users) {
    const grade =
      u.grade && String(u.grade).trim() ? u.grade : '9. Sınıf';
    try {
      await Student.updateOne(
        { userId: u._id, teacherId: tid },
        { $setOnInsert: { grade, averageScore: 0 } },
        { upsert: true }
      );
    } catch {
      // ignore duplicate
    }
  }
}

/**
 * Öğrenci bu öğretmenin sınavını tamamladığında sınıf roster'ında görünsün diye
 * Student (userId + teacherId) kaydı yoksa oluşturur.
 */
async function ensureStudentLinkedToTeacher(teacherId, userId) {
  await upsertStudentLinks(teacherId, [String(userId)]);
}

/**
 * Bu öğretmenin içerikleriyle etkileşen öğrenciler (sınav, ödev, egzersiz, anket)
 * için eksik Student satırlarını tamamlar.
 */
async function syncTeacherRosterFromTeacherContent(teacherId) {
  const tid = toObjectId(teacherId);
  if (!tid) return;

  const [fromExams, fromAssignments, fromExercises, fromSurveys] = await Promise.all([
    Exam.aggregate([
      { $match: { createdBy: tid } },
      { $unwind: { path: '$results', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$results.studentId' } },
    ]),
    Assignment.aggregate([
      { $match: { createdBy: tid } },
      { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$submissions.studentId' } },
    ]),
    Exercise.aggregate([
      { $match: { createdBy: tid } },
      { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$submissions.studentId' } },
    ]),
    Survey.aggregate([
      { $match: { createdBy: tid } },
      { $unwind: { path: '$responses', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$responses.studentId' } },
    ]),
  ]);

  const ids = new Set();
  for (const row of [...fromExams, ...fromAssignments, ...fromExercises, ...fromSurveys]) {
    if (row._id) ids.add(String(row._id));
  }

  await upsertStudentLinks(teacherId, [...ids]);
}

module.exports = {
  ensureStudentLinkedToTeacher,
  syncTeacherRosterFromTeacherContent,
};
