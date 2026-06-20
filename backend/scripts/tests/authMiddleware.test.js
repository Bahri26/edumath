const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'unit-test-jwt-secret';

const protect = require('../../middlewares/authMiddleware');
const role = require('../../middlewares/roleMiddleware');

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

test('protect rejects missing token', () => {
  const req = { header: () => undefined };
  const res = mockRes();
  let nextCalled = false;
  protect(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('protect accepts valid bearer token', () => {
  const token = jwt.sign({ id: 'u1', role: 'teacher' }, process.env.JWT_SECRET);
  const req = { header: (name) => (name === 'Authorization' ? `Bearer ${token}` : undefined) };
  const res = mockRes();
  let nextCalled = false;
  protect(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, 'u1');
});

test('role middleware blocks wrong role', () => {
  const req = { user: { role: 'student' } };
  const res = mockRes();
  let nextCalled = false;
  role(['teacher'])(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('role middleware allows matching role', () => {
  const req = { user: { role: 'teacher' } };
  const res = mockRes();
  let nextCalled = false;
  role(['teacher', 'admin'])(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
});
