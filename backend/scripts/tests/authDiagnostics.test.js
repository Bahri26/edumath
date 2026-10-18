const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAuthDiagnostic } = require('../../utils/authDiagnostics');

test('auth diagnostics retain the failure stage without credentials or token values', () => {
  const error = Object.assign(new Error('password=private token=secret'), {
    code:11000, keyPattern:{hashedToken:1}, keyValue:{hashedToken:'secret-hash'},
    request:{body:{password:'private'}},
  });
  const record = buildAuthDiagnostic('session-storage',error);
  assert.equal(record.errorCode,11000);
  assert.deepEqual(record.fields,['hashedToken']);
  assert.equal(record.stage,'session-storage');
  assert.ok(record.frames.length>0);
  assert.doesNotMatch(JSON.stringify(record),/private|secret/);
});
