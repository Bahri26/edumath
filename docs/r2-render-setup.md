# Cloudflare R2 + Render Kurulumu

Bu proje, `backend/services/storageService.js` üzerinden R2 odakli ve S3 uyumlu calisir.

Amaç:
- Upload edilen soru gorsellerini kalici depolamak
- AI tarafinda uretilen SVG gorselleri bucket'a koymak
- Render'in gecici diskine bagimli kalmamak

## 1. Cloudflare R2 Tarafı

Cloudflare Dashboard:
- `R2 Object Storage` -> `Create bucket`

Onerilen bucket adi:
- `edumath-assets`

Bucket olustuktan sonra 3 sey gerekir:

### A. API Token / Access Key

Cloudflare Dashboard:
- `R2` -> `Manage R2 API Tokens`
- `Create API token`

Buradan alacagin degerler:
- `Access Key ID`
- `Secret Access Key`

Bunlar Render backend env alanlarina gidecek:
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

### B. S3 Endpoint

Cloudflare R2 hesabinda account bazli endpoint olur:

Format:
```text
https://<account-id>.r2.cloudflarestorage.com
```

Bu deger Render backend env alanina gider:
- `S3_ENDPOINT`

### C. Public URL

Bucket'i public kullanacaksan iki tip yayin yolu olur:

1. `r2.dev` public URL
2. kendi domainin altinda custom domain

Ornek:
```text
https://pub-xxxxxxxxxxxxxxxx.r2.dev
```

veya

```text
https://cdn.edumath.com
```

Bu deger Render backend env alanina gider:
- `S3_PUBLIC_BASE_URL`

Not:
Bu alan cok onemli. Backend dosyayi bucket'a yuklese bile, frontend'in kullanacagi public URL buradan uretilir.

## 2. Render Backend Env Ayarları

Render servis:
- `edumath-api`

Girilmesi gereken alanlar:

```env
STORAGE_PROVIDER=r2
S3_BUCKET_NAME=edumath-assets
S3_REGION=auto
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<r2-access-key-id>
S3_SECRET_ACCESS_KEY=<r2-secret-access-key>
S3_PUBLIC_BASE_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev
S3_FORCE_PATH_STYLE=false
```

Bu projede R2 icin tipik ayar:
- `STORAGE_PROVIDER=r2`
- `S3_REGION=auto`
- `S3_FORCE_PATH_STYLE=false`

## 3. Hangi Alan Nereden Geliyor

Cloudflare -> Render map'i:

| Cloudflare R2 Alani | Render Env Alani |
|---|---|
| Bucket name | `S3_BUCKET_NAME` |
| Access Key ID | `S3_ACCESS_KEY_ID` |
| Secret Access Key | `S3_SECRET_ACCESS_KEY` |
| Account endpoint | `S3_ENDPOINT` |
| Public bucket URL / custom domain | `S3_PUBLIC_BASE_URL` |

Ek sabit alanlar:

| Render Env Alani | Deger |
|---|---|
| `STORAGE_PROVIDER` | `r2` |
| `S3_REGION` | `auto` |
| `S3_FORCE_PATH_STYLE` | `false` |

## 4. Local ve Production Davranışı

Kod davranisi:

- `STORAGE_PROVIDER=local` veya R2 alanlari eksikse:
  - dosyalar `backend/uploads` altina yazilir
- `STORAGE_PROVIDER=r2` ve gerekli env alanlari doluysa:
  - dosyalar R2 bucket'a gider

Bu fallback su dosyada yonetilir:
- `backend/services/storageService.js`

## 5. Bu Projede Neler R2'ye Gider

R2 acildiginda su akislarda dosyalar bucket'a yazilir:

- ogretmen soru gorseli yuklemesi
- soru sikki gorselleri
- AI ile uretilen SVG soru gorselleri
- vision upload akisi

Bagli dosyalar:
- `backend/controllers/questionController.js`
- `backend/controllers/visionController.js`
- `backend/services/svgPatternRenderer.js`

## 6. Deploy Sonrası Kontrol

Render backend redeploy olduktan sonra su davranislar beklenir:

1. Yeni soru gorseli upload edilince `Question.image` artik `/uploads/...` yerine public R2 URL olur.
2. AI pattern question pack akisi yeni gorseller icin `image` alanini dolu dondurur.
3. Frontend bu URL'leri dogrudan gosterebilir.

## 7. Hata Durumları

En sik hatalar:

1. `S3_PUBLIC_BASE_URL` bos
   - upload olur ama public URL dogru uretilemez

2. `S3_ENDPOINT` yanlis
   - R2'ye baglanamaz

3. bucket public degil
   - URL olusur ama gorsel tarayicida acilmaz

4. Render env guncellenip servis redeploy edilmedi
   - uygulama hala local `/uploads` davranisinda kalir

## 8. Onerilen Sonraki Kontrol

Env girildikten sonra sunlari test et:

1. Ogretmen panelinden manuel bir soru gorseli yukle
2. MongoDB'de `questions.image` alaninin `https://...r2.dev/...` oldugunu kontrol et
3. AI pattern pack endpoint'inin `image` alani dondugunu kontrol et
4. Frontend soru kartinda gorselin acildigini kontrol et