/**
 * Programmatic login for E2E — requires running API + seeded user.
 * Set E2E_API_URL, E2E_STUDENT_EMAIL, E2E_STUDENT_PASSWORD (or teacher variants).
 */
export async function loginViaApi(page, { email, password, apiUrl }) {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  const token = data.token || data.accessToken;
  const refreshToken = data.refreshToken;
  const user = data.user || data;
  if (!token || !user) {
    throw new Error('Login response missing token or user');
  }

  await page.addInitScript(
    ({ userPayload, accessToken, refresh }) => {
      localStorage.setItem('user', JSON.stringify(userPayload));
      localStorage.setItem('token', accessToken);
      if (refresh) localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('loginTime', Date.now().toString());
      localStorage.setItem('lastActivity', Date.now().toString());
    },
    { userPayload: user, accessToken: token, refresh: refreshToken },
  );
}

export function e2eCredentials(role = 'student') {
  const prefix = role === 'teacher' ? 'E2E_TEACHER' : 'E2E_STUDENT';
  const useSeed = process.env.E2E_USE_SEED !== '0';
  const seedDefaults =
    role === 'teacher'
      ? { email: 'teacher@edumath.local', password: 'password123' }
      : { email: 'student@edumath.local', password: 'password123' };
  const email = process.env[`${prefix}_EMAIL`] || (useSeed ? seedDefaults.email : undefined);
  const password = process.env[`${prefix}_PASSWORD`] || (useSeed ? seedDefaults.password : undefined);
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:8000';
  return { email, password, apiUrl, ready: Boolean(email && password) };
}
