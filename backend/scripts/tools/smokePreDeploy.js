#!/usr/bin/env node
/**
 * Pre-deploy API smoke checks (no DB writes).
 * Usage:
 *   node scripts/tools/smokePreDeploy.js
 *   SMOKE_API_URL=https://edumath-t10n.onrender.com SMOKE_STUDENT_EMAIL=... SMOKE_STUDENT_PASSWORD=... node scripts/tools/smokePreDeploy.js
 */
const base = (process.env.SMOKE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const expectStorage = (process.env.SMOKE_EXPECT_STORAGE || '').trim().toLowerCase();

async function request(path, options = {}) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body, ok: res.ok };
}

function pass(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ''}`);
  process.exitCode = 1;
}

function warn(label) {
  console.log(`  ⚠ ${label}`);
}

async function main() {
  console.log(`Smoke: ${base}\n`);

  try {
    const health = await request('/health');
    if (health.ok && health.body?.status === 'ok') {
      pass(`GET /health (db: ${health.body.db || '?'})`);
      const provider = health.body.storage?.provider;
      if (provider) {
        if (expectStorage && provider !== expectStorage) {
          fail(`Storage provider`, `expected ${expectStorage}, got ${provider}`);
        } else {
          pass(`Storage provider: ${provider}`);
        }
      }
    } else {
      fail('GET /health', JSON.stringify(health.body));
    }

    const fullHealth = await request('/health?full=1');
    if (fullHealth.ok && fullHealth.body?.mlService) {
      const ml = fullHealth.body.mlService;
      if (!ml.configured) {
        console.log('  ○ ML service not configured');
      } else if (ml.reachable) {
        pass(`ML service reachable (${ml.url || 'ok'})`);
      } else {
        warn(`ML service down: ${ml.error || ml.status || 'unknown'}`);
      }
    }

    const ready = await request('/ready');
    if (ready.body?.status === 'ready') {
      pass('GET /ready — database ready');
    } else {
      fail('GET /ready', ready.body?.status || ready.status);
    }

    const unauth = await request('/api/teacher/students');
    if (unauth.status === 401) {
      pass('Protected route returns 401 without token');
    } else {
      fail('Protected route auth', `expected 401, got ${unauth.status}`);
    }

    const email = process.env.SMOKE_STUDENT_EMAIL || process.env.E2E_STUDENT_EMAIL;
    const password = process.env.SMOKE_STUDENT_PASSWORD || process.env.E2E_STUDENT_PASSWORD;
    if (email && password) {
      const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const token = login.body?.token || login.body?.accessToken;
      if (login.ok && token) {
        pass(`POST /api/auth/login (${email})`);
        const exercises = await request('/api/exercises/student/my-exercises', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (exercises.status === 200) {
          pass('GET /api/exercises/student/my-exercises');
        } else {
          fail('Student exercises', exercises.status);
        }
      } else {
        fail('POST /api/auth/login', login.body?.message || login.status);
      }
    } else {
      console.log('  ○ Login smoke skipped (set SMOKE_STUDENT_EMAIL + SMOKE_STUDENT_PASSWORD)');
    }

    const teacherEmail = process.env.SMOKE_TEACHER_EMAIL || process.env.E2E_TEACHER_EMAIL;
    const teacherPassword = process.env.SMOKE_TEACHER_PASSWORD || process.env.E2E_TEACHER_PASSWORD;
    if (teacherEmail && teacherPassword) {
      const login = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword }),
      });
      const token = login.body?.token || login.body?.accessToken;
      if (login.ok && token) {
        pass(`POST /api/auth/login teacher (${teacherEmail})`);
        const questions = await request('/api/teacher/questions?page=1&limit=1', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (questions.status === 200) {
          pass('GET /api/teacher/questions');
        } else {
          fail('Teacher questions', questions.status);
        }
      } else {
        fail('Teacher login', login.body?.message || login.status);
      }
    }

    if (expectStorage === 'gdrive') {
      console.log('  ○ Drive upload: verify GOOGLE_DRIVE_CREDENTIALS_JSON on Render + npm run verify:drive locally');
    }
  } catch (err) {
    fail('Smoke runner', err.message);
  }

  console.log(process.exitCode ? '\nSmoke FAILED' : '\nSmoke OK');
}

main();
