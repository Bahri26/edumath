# Cloudinary + Render (Edumath görsel depolama)

R2’den daha kolay kurulum: Cloudinary panelinden 3 değer → Render env.

## 1. Cloudinary değerleri

[Cloudinary Console → API Keys](https://console.cloudinary.com/app/settings/api-keys)

| Cloudinary | Render env |
|------------|------------|
| Cloud name | `CLOUDINARY_CLOUD_NAME` |
| API Key | `CLOUDINARY_API_KEY` |
| API Secret | `CLOUDINARY_API_SECRET` |

## 2. Render backend (`edumath-api`)

```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=dy0mfpili
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Save** → **Manual Deploy**.

## 3. Frontend

Cloudinary URL’leri tam `https://res.cloudinary.com/...` olduğu için ekstra `VITE_ASSET_BASE_URL` gerekmez.
Yine de API adresi doğru olmalı:

```env
VITE_API_URL=https://edumath-t10n.onrender.com/api
```

## 4. Yerel test

```bash
cd backend
# backend/.env içine yukarıdaki 4 satırı yazın (git'e eklemeyin)
node scripts/tools/testCloudinary.js
```

## 5. Canlı kontrol

`GET https://<api-host>/health` → `"storage": { "provider": "cloudinary", ... }`

Soru görseli yükleyince MongoDB `questions.image` alanı `https://res.cloudinary.com/...` olmalı.

## Güvenlik

API Secret’ı asla GitHub’a commit etmeyin. Sızıntı olursa Cloudinary panelinden anahtarı yenileyin.
