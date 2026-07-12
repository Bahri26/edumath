const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractGradeNumber,
  canonicalizeClassLevel,
  classLevelsMatch,
  classLevelQueryValues,
  sameStudentId,
} = require('../../utils/classLevel');

test('canonicalizeClassLevel', () => {
  assert.equal(canonicalizeClassLevel('9'), '9. Sınıf');
  assert.equal(canonicalizeClassLevel('9. Sınıf'), '9. Sınıf');
  assert.equal(canonicalizeClassLevel('1.Sınıf'), '1. Sınıf');
  assert.equal(canonicalizeClassLevel(''), null);
});

test('classLevelsMatch', () => {
  assert.equal(classLevelsMatch('1', '1. Sınıf'), true);
  assert.equal(classLevelsMatch('9. Sınıf', '9'), true);
  assert.equal(classLevelsMatch('8. Sınıf', '9. Sınıf'), false);
});

test('classLevelQueryValues includes variants', () => {
  const vals = classLevelQueryValues('1. Sınıf');
  assert.ok(vals.includes('1. Sınıf'));
  assert.ok(vals.includes('1'));
});

test('sameStudentId', () => {
  assert.equal(sameStudentId('abc', 'abc'), true);
  assert.equal(sameStudentId(null, 'abc'), false);
  assert.equal(sameStudentId({ toString: () => 'x' }, 'x'), true);
});

test('extractGradeNumber', () => {
  assert.equal(extractGradeNumber('10. Sınıf'), 10);
  assert.equal(extractGradeNumber('abc'), null);
});
