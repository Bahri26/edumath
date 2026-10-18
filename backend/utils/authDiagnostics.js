const fs = require('fs');
const path = require('path');

function buildAuthDiagnostic(stage, error) {
  return {
    timestamp: new Date().toISOString(),
    stage,
    errorName: error?.name || 'Error',
    errorCode: error?.code,
    fields: Object.keys(error?.keyPattern || error?.errors || {}),
    // Exclude the error message, request body, token values and database key values.
    frames: String(error?.stack || '').split('\n').filter(line => /^\s+at /.test(line)).slice(0, 6),
  };
}

function recordAuthDiagnostic(stage, error) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    const target = path.join(__dirname, '..', 'logs', 'auth-errors.jsonl');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.appendFileSync(target, JSON.stringify(buildAuthDiagnostic(stage, error)) + '\n');
  } catch {
    console.warn('[auth] Diagnostic log could not be written.');
  }
}

module.exports = { buildAuthDiagnostic, recordAuthDiagnostic };
