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

### A. API Token / Access Key (Adım adım)

> **Önemli:** Secret Key yalnızca bir kez gösterilir. O ekranı kapatmadan kopyalayın.

#### Yol 1 — S3 uyumlu anahtar (Edumath bunu kullanır)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → giriş yapın.
2. Sol menüden **R2 Object Storage** (veya **Storage & databases → R2**).
3. Sağ üst veya R2 ana sayfasında **Manage R2 API Tokens** (Türkçe arayüzde *R2 API belirteçlerini yönet*) linkine tıklayın.
4. **Create API token** / **Create Account API token**.
5. Formu doldurun:

   | Alan | Önerilen değer |
   |------|----------------|
   | Token name | `edumath-render` |
   | Permissions | **Object Read & Write** (veya sadece `edumath-assets` bucket’ına kısıtlı) |
   | TTL | Boş bırakın (süresiz) veya 1 yıl |

6. **Create API Token** → ekranda iki değer çıkar:
   - **Access Key ID** → Render’da `S3_ACCESS_KEY_ID`
   - **Secret Access Key** → Render’da `S3_SECRET_ACCESS_KEY`

7. Bu iki değeri bir yere kaydedin (1Password, Notepad vb.). Secret bir daha gösterilmez.

#### Yol 2 — Bucket ekranından (alternatif)

1. **R2 Object Storage** → bucket **`edumath-assets`** → **Settings**.
2. **S3 API** veya **Connect** bölümünde **Create Access Key** / **Create credentials**.
3. Yine **Access Key ID** + **Secret Access Key** alırsınız; Render env’e aynı şekilde girilir.

#### Render’a yapıştırma (Adım 2’nin sonu)

1. [Render Dashboard](https://dashboard.render.com) → servis **`edumath-api`** (veya `edumath-t10n`).
2. **Environment** → **Add Environment Variable**:
   - `S3_ACCESS_KEY_ID` = Cloudflare’den kopyaladığınız Access Key ID
   - `S3_SECRET_ACCESS_KEY` = Secret Access Key
3. **Save Changes** → **Manual Deploy** (Deploy latest commit).

#### S3 Endpoint (Account ID) nereden?

Aynı R2 sayfasında **Account ID** yazar (32 karakterlik hex). Endpoint:

```text
https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Örnek: Account ID `a1b2c3d4e5f6...` ise → `S3_ENDPOINT=https://a1b2c3d4e5f6....r2.cloudflarestorage.com`

Render env: `S3_ENDPOINT` = bu tam URL.

#### Public URL (görsellerin tarayıcıda açılması)

1. R2 → bucket **`edumath-assets`** → **Settings**.
2. **Public access** / **Allow Public Access** → **Enable**.
3. **R2.dev subdomain** açın → size verilen adres örneğin:
   `https://pub-abc123def456.r2.dev`
4. Render env: `S3_PUBLIC_BASE_URL=https://pub-abc123def456.r2.dev` (**sonunda `/` olmasın**).

#### Tüm backend env özeti (Render `edumath-api`)

```env
STORAGE_PROVIDER=r2
S3_BUCKET_NAME=edumath-assets
S3_REGION=auto
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=<Adım 2 Access Key ID>
S3_SECRET_ACCESS_KEY=<Adım 2 Secret Access Key>
S3_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
S3_FORCE_PATH_STYLE=false
```

Deploy sonrası kontrol: `https://edumath-t10n.onrender.com/health` → `"storage": { "provider": "r2", "objectStorageEnabled": true }`

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