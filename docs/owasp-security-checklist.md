# EduMath — OWASP Güvenlik Kontrol Listesi

Bu belge [OWASP Top 10 (2021)](https://owasp.org/Top10/) ve web API güvenliği pratiklerine göre EduMath kod tabanını denetlemek içindir. Her madde için **durum**, **kanıt (kod/konfig)** ve **aksiyon** verilmiştir.

**Son prod kontrol:** `https://edumath-t10n.onrender.com/health` → `status: ok`, `db: up`

---

## Özet skor tablosu

| OWASP kategorisi | Durum | Puan (/10) |
|------------------|-------|------------|
| A01 Broken Access Control | 🟡 Kısmi | 7,5 |
| A02 Cryptographic Failures | 🟢 İyi | 8,0 |
| A03 Injection | 🟢 İyi | 8,0 |
| A04 Insecure Design | 🟡 Kısmi | 7,0 |
| A05 Security Misconfiguration | 🟡 Kısmi | 6,5 |
| A06 Vulnerable Components | 🟡 Periyodik | 7,0 |
| A07 Auth Failures | 🟢 İyi | 7,5 |
| A08 Software/Data Integrity | 🟡 Kısmi | 7,0 |
| A09 Logging & Monitoring | 🟡 Kısmi | 6,5 |
| A10 SSRF | 🟢 Düşük risk | 8,0 |
| **Ortalama** | | **~7,4 / 10** |

---

## A01 — Broken Access Control (Erişim kontrolü)

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | JWT korumalı API rotaları | ✅ | `authMiddleware.js` — token yoksa 401 |
| 2 | Rol tabanlı erişim (RBAC) | ✅ | `roleMiddleware` — exam, admin, teacher rotaları |
| 3 | Kayıtta admin rolü engeli | ✅ | `registerRole.js` — sadece `student` / `teacher` |
| 4 | Öğrenci → öğretmen verisi izolasyonu | 🟡 | Teacher rotaları korumalı; IDOR için manuel test gerekli |
| 5 | Sınav erişimi (sınıf / atama) | ✅ | `examAccess` testleri, `/take` ve `/submit` auth |
| 6 | AI endpoint auth | ✅ | `aiRoutes.js` — `protect` middleware |
| 7 | Chat misafir modu (sadece FAQ) | ✅ | Guest → statik yanıt; API token gerektirmez |
| 8 | Swagger prod kapalı | ✅ | `server.js` — prod’da `SWAGGER_ENABLED=true` olmadıkça kapalı |
| 9 | IDOR manuel test seti | ⬜ | Aşağıdaki “Manuel test” bölümünü çalıştırın |

**Manuel test (deploy sonrası):**

```powershell
# Token olmadan korumalı rota → 401
curl -s -o NUL -w "%{http_code}" https://edumath-t10n.onrender.com/api/teacher/students

# Öğrenci token ile öğretmen-only rota → 403
# (login sonrası Bearer token ile deneyin)
curl -H "Authorization: Bearer STUDENT_TOKEN" https://edumath-t10n.onrender.com/api/questions/teacher
```

**Aksiyon:** Her yeni rota için “auth + role” checklist’i PR şablonuna ekleyin. IDOR senaryolarını E2E’ye taşıyın.

---

## A02 — Cryptographic Failures

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | JWT secret zorunluluğu | ✅ | `server.js` — `JWT_SECRET`, `JWT_REFRESH_SECRET` fail-fast |
| 2 | Parola hash (bcrypt) | ✅ | `BCRYPT_ROUNDS=12` (.env.example) |
| 3 | HTTPS prod | ✅ | Render TLS |
| 4 | Token refresh ayrı secret | ✅ | `JWT_REFRESH_SECRET` |
| 5 | Hassas veri loglanmıyor | 🟡 | Morgan combined prod’da; body log yok — periyodik audit |
| 6 | `.env` / credential Git dışı | ✅ | `.gitignore`; deploy checklist |

**Aksiyon:** JWT secret rotation prosedürü yazın (Atlas + Render env güncelleme, kullanıcıları yeniden login).

---

## A03 — Injection

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | NoSQL injection sanitization | ✅ | `mongoSanitize` middleware |
| 2 | Mongoose şema validasyonu | 🟡 | Modellerde kısmi; `validationMiddleware` route bazlı |
| 3 | Kullanıcı girdisi AI prompt’a | 🟡 | Rate limit + auth; prompt injection için içerik filtresi yok |
| 4 | File upload tipi / boyut | 🟡 | Storage servisleri; MIME whitelist audit edilmeli |
| 5 | XSS (stored) — frontend | 🟡 | React default escape; `dangerouslySetInnerHTML` grep ile tarayın |

```powershell
cd c:\Projects\edumath-main\frontend
rg "dangerouslySetInnerHTML" src
```

**Aksiyon:** Upload endpoint’lerinde max size + allowed MIME listesi dokümante edin.

---

## A04 — Insecure Design

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | Rate limiting (genel) | ✅ | `express-rate-limit` — prod only |
| 2 | Auth rate limiting | ✅ | `AUTH_RATE_LIMIT_*` login/signup |
| 3 | Admin onay akışı | ✅ | `AUTO_APPROVE_USERS=false` prod önerisi |
| 4 | AI kaynak etiketleme (AI vs Uzman) | ✅ | Question source badge, teacher doğrulama |
| 5 | Threat modeling dokümanı | ⬜ | Yok — öğrenci verisi + KVKK/GDPR için eklenmeli |

**Aksiyon:** Veri saklama süresi ve silme (`deleteAccount`) politikası kullanıcı sözleşmesiyle hizalanmalı.

---

## A05 — Security Misconfiguration

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | Helmet | ✅ | `server.js` — CSP, default headers |
| 2 | CORS whitelist | ✅ | `FRONTEND_URL`, `ALLOWED_ORIGINS` |
| 3 | `NODE_ENV=production` | ✅ | Render |
| 4 | `TRUST_PROXY` Render | ✅ | Prod’da `trust proxy` 1 |
| 5 | Debug endpoint kapalı | 🟡 | `/health` storage detayı prod’da — bilgi sızıntısı düşük |
| 6 | Storage provider prod | ⚠️ | **Şu an `cloudinary`** — hedef `gdrive`; bkz. [render-drive-production.md](./render-drive-production.md) |
| 7 | ML API key prod | ✅ | Health: `hasApiKey: true` |
| 8 | RATE_LIMIT_DISABLED prod | ⬜ | Render’da **asla** `true` olmamalı |

**Aksiyon:** Render env audit (aşağıdaki tablo) her deploy öncesi.

---

## A06 — Vulnerable and Outdated Components

| # | Kontrol | Durum | Aksiyon |
|---|---------|-------|---------|
| 1 | `npm audit` backend | ⬜ | `cd backend && npm audit` |
| 2 | `npm audit` frontend | ⬜ | `cd frontend && npm audit` |
| 3 | Dependabot / Renovate | ⬜ | GitHub repo ayarlarından açın |
| 4 | CI güvenlik taraması | ⬜ | `.github/workflows/ci.yml`’e `npm audit --audit-level=high` eklenebilir |

**Periyot:** Ayda bir major dependency güncellemesi; deploy öncesi `npm audit fix` (breaking değişikliklere dikkat).

---

## A07 — Identification and Authentication Failures

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | Login brute-force koruması | ✅ | Auth rate limit |
| 2 | Token süresi / refresh | ✅ | Frontend `api.js` 401 → refresh |
| 3 | Logout / token invalidation | 🟡 | Stateless JWT — refresh blacklist yok |
| 4 | Parola politikası | 🟡 | Minimum uzunluk controller’da kontrol edin |
| 5 | ML service API key | ✅ | `ML_SERVICE_API_KEY` header |

**Aksiyon:** Refresh token rotation veya server-side revoke listesi (enterprise ihtiyacında).

---

## A08 — Software and Data Integrity Failures

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | CI pipeline (push/PR) | ✅ | `.github/workflows/ci.yml` |
| 2 | Git hook / secret scan | ⬜ | `gitleaks` veya GitHub secret scanning |
| 3 | npm supply chain | 🟡 | `package-lock.json` commit ediliyor |
| 4 | Unsigned CDN assets | 🟢 | Vite bundle, self-hosted |

---

## A09 — Security Logging and Monitoring Failures

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | HTTP access log | ✅ | Morgan `combined` (prod) |
| 2 | Merkezi hata izleme | 🟡 | Sentry opsiyonel — prod’da DSN doğrulanmalı |
| 3 | Auth failure alerting | ⬜ | Yok |
| 4 | Structured JSON logs | ⬜ | Yok — Render log drain için önerilir |
| 5 | Smoke script | ✅ | `npm run smoke:predeploy` |

**Aksiyon:** Prod’da `SENTRY_DSN` + `VITE_SENTRY_DSN` set edin; test exception fırlatın.

---

## A10 — Server-Side Request Forgery (SSRF)

| # | Kontrol | Durum | Kanıt / not |
|---|---------|-------|-------------|
| 1 | Kullanıcı URL fetch | 🟢 | Genel SSRF vektörü yok |
| 2 | ML / Gemini outbound | 🟡 | Sadece env’deki sabit URL’ler |
| 3 | Webhook callback | 🟢 | Yok |

---

## Render env güvenlik tablosu (API servisi)

| Değişken | Prod değeri | Güvenlik notu |
|----------|-------------|---------------|
| `JWT_SECRET` | 64+ char random | Asla repo’ya koymayın |
| `JWT_REFRESH_SECRET` | Farklı random | JWT ile aynı olmasın |
| `NODE_ENV` | `production` | Rate limit aktif |
| `SWAGGER_ENABLED` | `false` veya boş | API şeması gizli |
| `RATE_LIMIT_DISABLED` | `false` veya boş | |
| `AUTO_APPROVE_USERS` | `false` | Admin onayı |
| `FRONTEND_URL` | `https://edumath-client.onrender.com` | CORS |
| `ML_SERVICE_API_KEY` | Güçlü random | ML servisinde aynı key |
| `SENTRY_DSN` | Sentry projesi | Opsiyonel ama önerilir |

**Asla commit etmeyin:** `.env`, `gcp-service-account.json`, OAuth refresh token, Cloudinary secret.

---

## Deploy öncesi güvenlik komutları

```powershell
cd c:\Projects\edumath-main\backend
npm test
npm run smoke:predeploy

# Prod smoke (test kullanıcısı varsa)
$env:SMOKE_API_URL="https://edumath-t10n.onrender.com"
$env:SMOKE_STUDENT_EMAIL="..."
$env:SMOKE_STUDENT_PASSWORD="..."
npm run smoke:predeploy
```

---

## 90 günlük güvenlik yol haritası

| Hafta | Görev | Hedef puan |
|-------|-------|------------|
| 1 | Render env audit + Drive geçişi | A05 → 8 |
| 2 | Sentry prod + auth failure log | A09 → 7,5 |
| 3 | IDOR E2E testleri (student/teacher) | A01 → 8,5 |
| 4 | `npm audit` + Dependabot | A06 → 8 |
| 6–8 | JWT refresh blacklist veya rotation doc | A07 → 8 |
| 12 | Harici penetration test (opsiyonel) | Genel → 8,5+ |

İlgili: [deploy-checklist.md](./deploy-checklist.md), [render-drive-production.md](./render-drive-production.md)
