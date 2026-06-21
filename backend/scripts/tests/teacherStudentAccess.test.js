const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const mongoose = require('mongoose');

const teacherId = new mongoose.Types.ObjectId();
const studentUserId = new mongoose.Types.ObjectId();
const otherStudentUserId = new mongoose.Types.ObjectId();

test('resolveSelfStudentUserId forces student to own id', () => {
  const { resolveSelfStudentUserId } = require('../../utils/teacherStudentAccess');
  const self = String(studentUserId);
  assert.equal(
    resolveSelfStudentUserId('student', self, String(otherStudentUserId)),
    self,
  );
});

test('resolveSelfStudentUserId allows teacher to pass roster student', () => {
  const { resolveSelfStudentUserId } = require('../../utils/teacherStudentAccess');
  const requested = String(otherStudentUserId);
  assert.equal(
    resolveSelfStudentUserId('teacher', String(teacherId), requested),
    requested,
  );
});

test('assertTeacherCanAccessStudentUser allows admin without roster lookup', async () => {
  const Student = require('../../models/Student');
  const findOne = mock.method(Student, 'findOne', async () => {
    throw new Error('Student.findOne should not be called for admin');
  });

  const { assertTeacherCanAccessStudentUser } = require('../../utils/teacherStudentAccess');
  const result = await assertTeacherCanAccessStudentUser(
    String(teacherId),
    String(studentUserId),
    'admin',
  );
  assert.equal(result.allowed, true);
  assert.equal(findOne.mock.callCount(), 0);
  findOne.mock.restore();
});

test('assertTeacherCanAccessStudentUser denies teacher when not on roster', async () => {
  const Student = require('../../models/Student');
  const findOne = mock.method(Student, 'findOne', () => ({
    select: () => ({ lean: async () => null }),
  }));

  const { assertTeacherCanAccessStudentUser } = require('../../utils/teacherStudentAccess');
  const result = await assertTeacherCanAccessStudentUser(
    String(teacherId),
    String(otherStudentUserId),
    'teacher',
  );
  assert.equal(result.allowed, false);
  assert.equal(result.status, 403);
  findOne.mock.restore();
});

test('assertTeacherCanAccessStudentUser allows teacher when linked on roster', async () => {
  const Student = require('../../models/Student');
  const findOne = mock.method(Student, 'findOne', () => ({
    select: () => ({ lean: async () => ({ _id: 'link-1' }) }),
  }));

  const { assertTeacherCanAccessStudentUser } = require('../../utils/teacherStudentAccess');
  const result = await assertTeacherCanAccessStudentUser(
    String(teacherId),
    String(studentUserId),
    'teacher',
  );
  assert.equal(result.allowed, true);
  findOne.mock.restore();
});

test('isStudentLinkedToTeacher returns false for invalid ids', async () => {
  const { isStudentLinkedToTeacher } = require('../../utils/teacherStudentAccess');
  assert.equal(await isStudentLinkedToTeacher('', studentUserId), false);
  assert.equal(await isStudentLinkedToTeacher(String(teacherId), 'not-an-id'), false);
});
