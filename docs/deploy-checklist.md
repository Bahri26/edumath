# EduMath — Deploy checklist

Use this before and after each production deploy. **Commit/push is the last step** after local verification.

## 1. Local verification

- [ ] `cd backend && npm test` — all unit tests pass
- [ ] `cd frontend && npm test` — Vitest passes
- [ ] `cd backend && npm run smoke:predeploy` — health + auth checks
- [ ] Backend starts: `cd backend && npm run dev`
- [ ] Frontend starts: `cd frontend && npm run dev`
- [ ] Smoke: login (student + teacher), open Study Hub, teacher Student Progress

### E2E (Playwright)

Seed users first: `cd backend && npm run seed:test-users`

```powershell
cd frontend
# Varsayılan seed kullanıcıları (E2E_USE_SEED=0 ile kapatılır)
$env:E2E_API_URL="http://localhost:8000"
npm run test:e2e
```

Özel hesap için: `E2E_STUDENT_EMAIL`, `E2E_STUDENT_PASSWORD`, `E2E_TEACHER_EMAIL`, `E2E_TEACHER_PASSWORD`

## 2. Render — API (`edumath-api`)

### Required env

| Variable | Notes |
|----------|--------|
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Strong random values |
| `FRONTEND_URL` | e.g. `https://edumath-client.onrender.com` → custom domain: `https://matova.app` ([matova-domain-setup.md](./matova-domain-setup.md)) |
| `NODE_ENV` | `production` |

### Google Drive (images)

| Variable | Notes |
|----------|--------|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | Inline service account JSON |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | Question images folder |
| `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | Patterns / video assets |
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID` | Personal Gmail uploads |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` | |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | From `npm run media:auth-drive` locally |

Verify after deploy:

```bash
curl https://YOUR-API.onrender.com/health
curl https://YOUR-API.onrender.com/ready
```

**Adım adım Drive geçişi:** [render-drive-production.md](./render-drive-production.md)  
**Güvenlik denetimi:** [owasp-security-checklist.md](./owasp-security-checklist.md)  
**Erişilebilirlik denetimi:** [wcag-accessibility-checklist.md](./wcag-accessibility-checklist.md)

## 3. Render — Frontend client

| Variable | Notes |
|----------|--------|
| `VITE_API_URL` | Backend URL (no trailing slash) |
| `VITE_PUBLIC_SITE_URL` | Public origin for OG/canonical (`https://matova.app` when live) |
| `VITE_SENTRY_DSN` | Optional — error tracking |

**Custom domain + e-posta:** [matova-domain-setup.md](./matova-domain-setup.md)

## 4. Sentry (optional)

1. Create a Sentry project (React + Node).
2. Backend: set `SENTRY_DSN` on Render API service.
3. Frontend: set `VITE_SENTRY_DSN` on static site build env.
4. Trigger a test error in staging; confirm event appears in Sentry.

If DSN is unset, monitoring modules no-op safely.

## 5. Post-deploy smoke (production)

- [ ] `/health` returns `status: ok`, `db: up`
- [ ] Login / logout / token refresh (wait 15+ min or force 401)
- [ ] Upload or view a question image (Drive)
- [ ] Student: complete or open an exercise; time displays
- [ ] Teacher: Student Progress shows lesson + exercise rows
- [ ] Admin: user list scrolls on mobile

## 6. Git (last step)

- [ ] Review diff — no `.env`, `gcp-service-account.json`, oauth tokens
- [ ] Commit in logical chunks or one release commit
- [ ] Push and confirm GitHub Actions CI green
- [ ] Tag release if applicable

## Rollback

- Render: redeploy previous successful deploy from dashboard.
- Drive: images remain in folder; DB URLs unchanged on rollback.
- MongoDB: restore from Atlas backup if a bad migration ran.
