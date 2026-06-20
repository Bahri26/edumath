# Google Drive + Render (Edumath soru görselleri)

Banking projesindeki `gcp-service-account.json` yapısının aynısı. Service account:

`edumath-drive@edumath-499309.iam.gserviceaccount.com`

## Klasörler (Edumath)

| Klasör | ID | Kullanım |
|--------|-----|----------|
| [İmage](https://drive.google.com/drive/folders/1XlKbtgJEtGgWF3jkH3KfB4bMF-KvWSze) | `1XlKbtgJEtGgWF3jkH3KfB4bMF-KvWSze` | Soru görselleri |
| [Video / örüntü](https://drive.google.com/drive/folders/1t1fV32CQI_YAoJkIYdosU3mmbikeMQIh) | `1t1fV32CQI_YAoJkIYdosU3mmbikeMQIh` | Örüntü SVG (`pattern` prefix) |

Kişisel Gmail Drive kullanıyorsanız **OAuth zorunlu** (service account yükleyemez).

```powershell
# Banking'deki dosyayı kopyalayın (Git'e eklemeyin!)
copy C:\Projects\Banking\backend\gcp-service-account.json C:\Projects\edumath-main\backend\gcp-service-account.json
```

`backend/.env`:

```env
STORAGE_PROVIDER=gdrive
GOOGLE_DRIVE_CREDENTIALS_JSON=./gcp-service-account.json
GOOGLE_DRIVE_IMAGES_FOLDER_ID=<Drive klasör ID>
GOOGLE_DRIVE_PUBLIC=true
```

Klasör ID: Drive'da klasörü açın → URL'deki `folders/XXXX` kısmı.

**Kişisel Gmail Drive** kullanıyorsanız service account dosya yükleyemez — OAuth gerekir (Banking ile aynı):

```powershell
cd backend
npm run media:auth-drive
# Render için çıkan GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN değerini kaydedin
```

## 2. Erişim testi

```powershell
cd backend
npm run verify:drive
npm run check:drive
```

`/health` → `"storage": { "provider": "gdrive", ... }`

## 3. İlkokul örüntü SVG toplu taşıma

Cloudinary yerine Drive:

```powershell
$env:CONFIRM_PATTERN_SVG_DRIVE='YES'; npm run import:pattern-svg-drive
```

## 4. Render (production)

Backend env:

| Değişken | Değer |
|----------|--------|
| `STORAGE_PROVIDER` | `gdrive` |
| `GOOGLE_DRIVE_IMAGES_FOLDER_ID` | klasör ID |
| `GOOGLE_DRIVE_PUBLIC` | `true` |
| `GOOGLE_DRIVE_CREDENTIALS_JSON` | JSON içeriği (tek satır) veya Render secret file |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | Kişisel Drive için (Banking'deki gibi) |
| `GOOGLE_DRIVE_OAUTH_CLIENT_ID` | OAuth desktop client |
| `GOOGLE_DRIVE_OAUTH_CLIENT_SECRET` | OAuth secret |

Cloudinary env'lerini kaldırabilirsiniz.

Frontend: Drive URL'leri tam `https://` olduğu için ekstra `VITE_ASSET_BASE_URL` gerekmez.

## 5. Klasör paylaşımı

Drive klasörünü **Düzenleyici** olarak paylaşın:

- Service account: `edumath-drive@edumath-499309.iam.gserviceaccount.com`
- OAuth kullanıyorsanız: kendi Gmail hesabınız klasör sahibi olmalı

## Güvenlik

- `gcp-service-account.json` asla Git'e commit edilmez
- Sızıntı olursa GCP Console → IAM → anahtarı yenileyin

## SVG notu

Google Drive bazen SVG'yi indirme olarak sunar; PNG/JPG daha sorunsuz. Örüntü SVG'lerinde sorun olursa Cloudinary veya PNG'ye dönüşüm düşünün.
