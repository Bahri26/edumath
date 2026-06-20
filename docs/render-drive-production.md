# Render Production — Google Drive Geçiş Kılavuzu

Bu belge **Render API servisini Cloudinary → Google Drive** storage’a taşımak için adım adım talimat içerir.

## Mevcut prod durumu (doğrulama)

```powershell
curl https://edumath-t10n.onrender.com/health
```

**Beklenen (hedef):**

```json
"storage": {
  "provider": "gdrive",
  "googleDriveEnabled": true,
  ...
}
```

**Şu anki prod (2026-05):** `provider: "cloudinary"`, `googleDriveEnabled: false` — Drive env Render dashboard’da henüz uygulanmamış.

| Servis | URL |
|--------|-----|
| Frontend | https://edumath-client.onrender.com |
| API | https://edumath-t10n.onrender.com |
| ML | https://edumath-ml.onrender.com |

---

## Ön koşullar

1. Google Cloud projesi + service account (`edumath-drive@edumath-499309.iam.gserviceaccount.com`) veya kişisel Gmail OAuth
2. Drive klasörleri oluşturulmuş ve paylaşılmış — bkz. [google-drive-setup.md](./google-drive-setup.md)
3. Yerelde Drive testi başarılı:

```powershell
cd c:\Projects\edumath-main\backend
npm run verify:drive
npm run check:drive
```

`/health` yerelde → `"provider": "gdrive"`

---

## Senaryo A — Service account (önerilen, Workspace / paylaşımlı klasör)

### Adım 1: JSON anahtarını hazırlayın

Yerel dosya: `backend/gcp-service-account.json` (**Git’e eklemeyin**)

Render’a **inline JSON** olarak yapıştıracaksınız (tek satır veya çok satır — Render her ikisini de kabul eder).

PowerShell ile tek satır (opsiyonel):

```powershell
(Get-Content backend\gcp-service-account.json -Raw) -replace "`r`n", "" | Set-Clipboard
```

### Adım 2: Drive klasör ID’leri

| Klasör | Env değişkeni | Örnek ID |
|--------|---------------|----------|
| Soru görselleri | `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | `1XlKbtgJEtGgWF3jkH3KfB4bMF-KvWSze` |
| Örüntü / SVG | `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | `1t1fV32CQI_YAoJkIYdosU3mmbikeMQIh` |

Klasörü service account e-postasına **Düzenleyici** olarak paylaşın.

### Adım 3: Render Dashboard → API servisi → Environment

Aşağıdaki değişkenleri **ekleyin veya güncelleyin**:

| Değişken | Değer |
|----------|--------|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | `{ "type": "service_account", ... }` (tam JSON) |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | Klasör ID |
| `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | Klasör ID |
| `GOOGLE_DRIVE_PUBLIC` | `true` |

**Kaldırın veya boş bırakın (Cloudinary devre dışı):**

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Adım 4: Deploy tetikleyin

Render → Manual Deploy → **Clear build cache & deploy** (env değişince önerilir)

Deploy bitince (~3–5 dk):

```powershell
curl https://edumath-t10n.onrender.com/health
```

`storage.provider` = **`gdrive`** olmalı.

### Adım 5: Görsel smoke test

1. Öğretmen olarak login → Soru Bankası
2. Görseli olan bir soru aç — görsel yüklenmeli (`drive.google.com/uc?export=view&id=...`)
3. Yeni görsel yükle — Drive klasöründe dosya görünmeli

---

## Senaryo B — Kişisel Gmail Drive (OAuth)

Service account kişisel Drive’a yazamaz. OAuth gerekir.

### Adım 1: Yerelde OAuth token alın

```powershell
cd c:\Projects\edumath-main\backend
npm run media:auth-drive
```

Çıktıdaki değerleri kaydedin:

- `GOOGLE_DRIVE_OAUTH_CLIENT_ID`
- `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET`
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`

### Adım 2: Render env

| Değişken | Değer |
|----------|--------|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | Sizin klasör ID |
| `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | Sizin klasör ID |
| `GOOGLE_DRIVE_PUBLIC` | `true` |
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID` | OAuth client |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` | OAuth secret |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | Refresh token |

Service account JSON **gerekmez** (OAuth yolu `driveOAuth.js` üzerinden).

### Adım 3: Token yenileme

Refresh token süresizdir (Google hesabı iptal edilmedikçe). Client secret sızarsa Google Cloud Console’dan rotate edin ve Render’ı güncelleyin.

---

## Senaryo C — Mevcut Cloudinary görsellerini Drive’a taşıma

Prod geçişten **önce** veya **sonra** bir kez:

```powershell
cd c:\Projects\edumath-main\backend
# Yerel .env: STORAGE_PROVIDER=gdrive + Mongo URI (prod read-only dikkat!)
npm run import:migrate-images-drive
```

Örüntü SVG toplu:

```powershell
$env:CONFIRM_PATTERN_SVG_DRIVE='YES'
npm run import:pattern-svg-drive
```

**Uyarı:** Prod MongoDB’ye migration çalıştırmadan önce **Atlas backup** alın.

---

## Tam Render env referansı (API servisi)

### Zorunlu (mevcut prod)

| Değişken | Örnek |
|----------|--------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | 64+ karakter |
| `JWT_REFRESH_SECRET` | farklı 64+ karakter |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://edumath-client.onrender.com` |
| `PORT` | Render otomatik (`10000`) |

### Drive (geçiş sonrası)

| Değişken | Not |
|----------|-----|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | Senaryo A |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | Zorunlu |
| `GOOGLE_DRIVE_PATTERNS_FOLDER_ID` | Örüntü varsa |
| `GOOGLE_DRIVE_PUBLIC` | `true` |
| `GOOGLE_DRIVE_OAUTH_*` | Senaryo B |

### ML (prod’da yapılandırılmış)

| Değişken | Not |
|----------|-----|
| `ML_SERVICE_URL` | `https://edumath-ml.onrender.com` |
| `ML_SERVICE_API_KEY` | Backend + ML serviste aynı |
| `ML_SERVICE_TIMEOUT_MS` | `8000` |

Health örneği: `"mlService": { "configured": true, "url": "https://edumath-ml.onrender.com", "hasApiKey": true }`

### Opsiyonel

| Değişken | Not |
|----------|-----|
| `SENTRY_DSN` | Backend hata izleme |
| `ALLOWED_ORIGINS` | Ek frontend origin |
| `SWAGGER_ENABLED` | Prod’da `false` bırakın |

---

## Frontend env (Render static site)

| Değişken | Değer |
|----------|--------|
| `VITE_API_URL` | `https://edumath-t10n.onrender.com` |
| `VITE_SENTRY_DSN` | Opsiyonel |

Drive URL’leri tam `https://` olduğu için **`VITE_ASSET_BASE_URL` gerekmez**.

Frontend’i API env değişikliğinden sonra yeniden deploy edin (Vite build-time env).

---

## Sorun giderme

| Belirti | Olası neden | Çözüm |
|---------|-------------|--------|
| `provider: cloudinary` | `STORAGE_PROVIDER` güncellenmemiş | Render env + redeploy |
| `googleDriveEnabled: false` | Eksik JSON veya folder ID | `GOOGLE_DRIVE_*` kontrol |
| Görseller 403 | Klasör paylaşımı yok | Service account’a Editor |
| Upload 500 OAuth | Refresh token geçersiz | `npm run media:auth-drive` yenile |
| SVG görünmüyor | Drive SVG content-type | PNG’ye dön veya Cloudinary fallback |
| Cold start 30–60 sn | Render free/starter | İlk istekten sonra normal |

### Log kontrolü

Render Dashboard → API servisi → **Logs** → `Google Drive` veya `storage` ara.

Yerel teşhis:

```powershell
cd backend
npm run verify:drive
npm run check:drive
```

---

## Deploy sonrası checklist

- [ ] `GET /health` → `provider: gdrive`, `googleDriveEnabled: true`
- [ ] `GET /ready` → `ready`
- [ ] Öğretmen: soru görseli görüntüleme
- [ ] Öğretmen: yeni görsel yükleme
- [ ] Öğrenci: egzersizde görsel
- [ ] Cloudinary env kaldırıldı (maliyet / karışıklık önleme)
- [ ] `npm run smoke:predeploy` prod URL ile (opsiyonel login)

```powershell
$env:SMOKE_API_URL="https://edumath-t10n.onrender.com"
cd backend
npm run smoke:predeploy
```

---

## Güvenlik hatırlatması

- Service account JSON **asla** Git commit
- Render env’de JSON görünür — ekip erişimini sınırlayın
- Anahtar sızıntısında GCP IAM → key rotate → Render env güncelle
- OAuth client secret’ı public repo’ya koymayın

İlgili: [google-drive-setup.md](./google-drive-setup.md), [deploy-checklist.md](./deploy-checklist.md), [owasp-security-checklist.md](./owasp-security-checklist.md)
