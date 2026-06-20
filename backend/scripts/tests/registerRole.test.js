const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveSelfRegisterRole } = require('../../utils/registerRole');

test('resolveSelfRegisterRole allows student and teacher', () => {
  assert.equal(resolveSelfRegisterRole('student'), 'student');
  assert.equal(resolveSelfRegisterRole('teacher'), 'teacher');
  assert.equal(resolveSelfRegisterRole('STUDENT'), 'student');
});

test('resolveSelfRegisterRole rejects admin and unknown roles', () => {
  assert.equal(resolveSelfRegisterRole('admin'), 'student');
  assert.equal(resolveSelfRegisterRole('superuser'), 'student');
  assert.equal(resolveSelfRegisterRole(''), 'student');
  assert.equal(resolveSelfRegisterRole(undefined), 'student');
});
