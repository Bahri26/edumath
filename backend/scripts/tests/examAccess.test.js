const test = require('node:test');
const assert = require('node:assert/strict');
const { canManageExam } = require('../../utils/examAccess');

test('owner teacher can manage exam', () => {
  const exam = { createdBy: 'abc', subject: 'Matematik' };
  const user = { id: 'abc', role: 'teacher', branch: 'Matematik', branchApproval: 'approved' };
  assert.equal(canManageExam(user, exam), true);
});

test('approved branch teacher can manage subject pool exam', () => {
  const exam = { createdBy: 'other', subject: 'Matematik' };
  const user = { id: 'me', role: 'teacher', branch: 'Matematik', branchApproval: 'approved' };
  assert.equal(canManageExam(user, exam), true);
});

test('unapproved teacher cannot manage others exam', () => {
  const exam = { createdBy: 'other', subject: 'Matematik' };
  const user = { id: 'me', role: 'teacher', branch: 'Matematik', branchApproval: 'pending' };
  assert.equal(canManageExam(user, exam), false);
});

test('admin can manage any exam', () => {
  const exam = { createdBy: 'other', subject: 'Fizik' };
  const user = { id: 'admin1', role: 'admin' };
  assert.equal(canManageExam(user, exam), true);
});

test('attachExamAccess returns array of enriched exams', () => {
  const { attachExamAccess } = require('../../utils/examAccess');
  const exam = { _id: '1', title: 'Test', createdBy: 'abc', subject: 'Matematik' };
  const user = { id: 'abc', role: 'teacher', branch: 'Matematik', branchApproval: 'approved' };
  const [enriched] = attachExamAccess(user, exam);
  assert.equal(enriched.title, 'Test');
  assert.equal(enriched.canManage, true);
});
