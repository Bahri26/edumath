# Render Environment — EduMath (yerel `.env` eşlemesi)

Bu belge **yerel `backend/.env` yapınızı** Render production servislerine taşımak içindir.  
**Gizli değerleri buraya yazmayın** — sadece Render Dashboard’a kopyalayın.

Yerel ortamınızda Drive zaten yapılandırılmış (`STORAGE_PROVIDER=gdrive`). Prod hâlâ Cloudinary gösteriyorsa aşağıdaki adımları uygulayın.

---

## Servis eşlemesi

| Render servisi | URL | Yerel karşılık |
|----------------|-----|----------------|
| API (edumath-t10n) | https://edumath-t10n.onrender.com | `backend/` — port 8000 |
| Frontend | https://edumath-client.onrender.com | `frontend/` — Vite |
| ML | https://edumath-ml.onrender.com | `ml-service/` — port 8100 |

---

## 1. API servisi — zorunlu değişkenler

Render → **edumath-api** (veya edumath-t10n) → **Environment**

| Render env | Yerel `.env` anahtarı | Render değeri (nasıl doldurulur) |
|------------|----------------------|----------------------------------|
| `NODE_ENV` | `NODE_ENV` | `production` |
| `PORT` | — | Render otomatik (`10000`) — genelde set etmeyin |
| `MONGODB_URI` | `MONGODB_URI` | Atlas connection string (yerel ile aynı veya prod DB) |
| `JWT_SECRET` | `JWT_SECRET` | Yerel değeri kopyala veya yeni 64+ char hex üret |
| `JWT_REFRESH_SECRET` | `JWT_REFRESH_SECRET` | JWT ile **farklı** secret |
| `FRONTEND_URL` | `FRONTEND_URL` | `https://edumath-client.onrender.com` |
| `BCRYPT_ROUNDS` | `BCRYPT_ROUNDS` | `12` |
| `AUTO_APPROVE_USERS` | `AUTO_APPROVE_USERS` | `false` |

**JWT üretmek (yeni secret istiyorsanız):**

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 2. Google Drive (yerelinizde hazır — prod’a taşıyın)

Yerel `.env`:

```env
STORAGE_PROVIDER=gdrive
GOOGLE_DRIVE_CREDENTIALS_JSON=./gcp-service-account.json
GOOGLE_DRIVE_IMAGES_FOLDER_ID=1XlKbtgJEtGgWF3jkH3KfB4bMF-KvWSze
GOOGLE_DRIVE_PATTERNS_FOLDER_ID=1t1fV32CQI_YAoJkIYdosU3mmbikeMQIh
GOOGLE_DRIVE_PUBLIC=true
```

### Render’a nasıl girilir

| Render env | Değer |
|------------|--------|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | `1XlKbtgJEtGgWF3jkH3KfB4bMF-KvWSze` |
| `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | `1t1fV32CQI_YAoJkIYdosU3mmbikeMQIh` |
| `GOOGLE_DRIVE_PUBLIC` | `true` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | **Dosya yolu değil** — JSON içeriğinin tamamı |

**JSON’u panoya kopyala (PowerShell):**

```powershell
cd c:\Projects\edumath-main\backend
Get-Content .\gcp-service-account.json -Raw | Set-Clipboard
```

Render’da `GOOGLE_DRIVE_CREDENTIALS_JSON` alanına yapıştırın (`{ "type": "service_account", ... }`).

### Cloudinary’yi kaldırın

Prod’da Drive kullanırken şunları **silin veya boş bırakın**:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### OAuth (yalnızca kişisel Gmail Drive kullanıyorsanız)

Service account yeterliyse OAuth gerekmez. Kişisel Drive için:

| Render env | Kaynak |
|------------|--------|
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID` | `npm run media:auth-drive` |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` | aynı |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | aynı |

---

## 3. Rate limit & güvenlik

| Render env | Yerel | Prod önerisi |
|------------|-------|--------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | `900000` |
| `RATE_LIMIT_MAX` | `100` | `100` |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `900000` | `900000` |
| `AUTH_RATE_LIMIT_MAX` | `20` | `20` |
| `SWAGGER_ENABLED` | — | `false` veya boş |
| `RATE_LIMIT_DISABLED` | — | **asla** `true` yapmayın |

---

## 4. AI & ML

| Render env | Yerel | Prod |
|------------|-------|------|
| `AI_PROVIDER` | `local` / `gemini` | Tercihinize göre |
| `GEMINI_API_KEY` | varsa | Render secret (Git’e koymayın) |
| `ML_SERVICE_URL` | `http://localhost:8100` | `https://edumath-ml.onrender.com` |
| `ML_SERVICE_API_KEY` | boş veya local | **Güçlü random** — ML servisinde de aynı |
| `ML_SERVICE_TIMEOUT_MS` | `8000` | `8000` |
| `ML_WEAK_TOPIC_THRESHOLD` | `0.55` | `0.55` |

---

## 5. Frontend servisi (static site)

| Render env | Değer |
|------------|--------|
| `VITE_API_URL` | `https://edumath-t10n.onrender.com` |
| `VITE_SENTRY_DSN` | Opsiyonel |
| `VITE_PUBLIC_SITE_URL` | `https://edumath-client.onrender.com` (OG/canonical; `matova.app` olunca güncelle) |

Drive kullanıldığında `VITE_ASSET_BASE_URL` **gerekmez**.

---

## 6. ML servisi (ayrı Render servisi)

| Render env | Değer |
|------------|--------|
| `ML_SERVICE_API_KEY` | API ile **aynı** key |
| `PORT` | Render otomatik |

---

## 7. Deploy sırası

1. API env güncelle (Drive + JWT + Mongo)
2. API → **Clear build cache & deploy**
3. Health doğrula:

```powershell
curl https://edumath-t10n.onrender.com/health
```

Beklenen:

```json
"storage": { "provider": "gdrive", "googleDriveEnabled": true }
```

4. Frontend env (`VITE_API_URL`) kontrol → redeploy
5. Smoke:

```powershell
$env:SMOKE_API_URL="https://edumath-t10n.onrender.com"
cd backend
npm run smoke:predeploy
```

---

## 8. Yerel → Render farkları (kontrol listesi)

| Konu | Yerel | Render |
|------|-------|--------|
| Drive credentials | `./gcp-service-account.json` dosya yolu | Inline JSON string |
| `FRONTEND_URL` | `http://localhost:5173` | `https://edumath-client.onrender.com` |
| `ML_SERVICE_URL` | `http://localhost:8100` | `https://edumath-ml.onrender.com` |
| Rate limit | `NODE_ENV=development` → kapalı | `production` → açık |
| Cold start | Yok | İlk istek 30–60 sn |

---

## 9. Asla commit etmeyin

- `backend/.env`
- `gcp-service-account.json`
- `GEMINI_API_KEY`, `JWT_*`, `MONGODB_URI`
- OAuth refresh token

İlgili: [render-drive-production.md](./render-drive-production.md), [google-drive-setup.md](./google-drive-setup.md)
