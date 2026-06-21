/**
 * IDOR erişim senaryoları — birim testleri (MongoDB mock).
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const mongoose = require('mongoose');

const teacherId = new mongoose.Types.ObjectId();
const studentUserId = new mongoose.Types.ObjectId();
const outsiderUserId = new mongoose.Types.ObjectId();

test('teacher cannot analyze-and-suggest for student outside roster', async () => {
  const Student = require('../../models/Student');
  const findOne = mock.method(Student, 'findOne', () => ({
    select: () => ({ lean: async () => null }),
  }));

  const { assertTeacherCanAccessStudentUser } = require('../../utils/teacherStudentAccess');
  const access = await assertTeacherCanAccessStudentUser(
    String(teacherId),
    String(outsiderUserId),
    'teacher',
  );

  assert.equal(access.allowed, false);
  assert.equal(access.status, 403);
  assert.match(access.message, /erişim/i);
  findOne.mock.restore();
});

test('student practice request ignores spoofed studentId in body', () => {
  const { resolveSelfStudentUserId } = require('../../utils/teacherStudentAccess');
  const self = String(studentUserId);
  const resolved = resolveSelfStudentUserId('student', self, String(outsiderUserId));
  assert.equal(resolved, self);
  assert.notEqual(resolved, String(outsiderUserId));
});

test('canViewExamResults denies teacher without roster overlap', async () => {
  const Student = require('../../models/Student');
  const find = mock.method(Student, 'find', () => ({
    select: () => ({
      lean: async () => [{ userId: studentUserId }],
    }),
  }));

  const { canViewExamResults } = require('../../utils/examAccess');
  const exam = {
    createdBy: new mongoose.Types.ObjectId(),
    results: [{ studentId: outsiderUserId, score: 80 }],
  };

  const allowed = await canViewExamResults(
    String(teacherId),
    { id: String(teacherId), role: 'teacher' },
    exam,
  );

  assert.equal(allowed, false);
  find.mock.restore();
});

test('canViewExamResults allows teacher when roster student participated', async () => {
  const Student = require('../../models/Student');
  const find = mock.method(Student, 'find', () => ({
    select: () => ({
      lean: async () => [{ userId: studentUserId }],
    }),
  }));

  const { canViewExamResults } = require('../../utils/examAccess');
  const exam = {
    createdBy: new mongoose.Types.ObjectId(),
    results: [{ studentId: studentUserId, score: 80 }],
  };

  const allowed = await canViewExamResults(
    String(teacherId),
    { id: String(teacherId), role: 'teacher' },
    exam,
  );

  assert.equal(allowed, true);
  find.mock.restore();
});

test('unapproved teacher cannot manage another teachers exam', () => {
  const { canManageExam } = require('../../utils/examAccess');
  const exam = { createdBy: 'other-teacher', subject: 'Matematik' };
  const user = {
    id: String(teacherId),
    role: 'teacher',
    branch: 'Matematik',
    branchApproval: 'pending',
  };
  assert.equal(canManageExam(user, exam), false);
});
