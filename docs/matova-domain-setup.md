# Matova — `matova.app` domain ve e-posta kurulumu

Bu checklist **kod dışı (ops)** adımları kapsar. Uygulama zaten `FRONTEND_URL` / `VITE_PUBLIC_SITE_URL` / `EMAIL_FROM` ile custom domain’e hazır.

Şu an production hâlâ Render URL’lerinde çalışır:

| Servis | Geçici URL |
|--------|------------|
| Frontend | `https://edumath-client.onrender.com` |
| API | `https://edumath-t10n.onrender.com` |

Hedef:

| Servis | Hedef |
|--------|--------|
| Frontend | `https://matova.app` (isteğe bağlı `www.matova.app` → apex redirect) |
| Destek / yasal | `info@matova.app` |
| Sistem maili | `noreply@matova.app` (veya `no-reply@matova.app`) |

API için custom subdomain (`api.matova.app`) **zorunlu değil**; Render API URL’si kalabilir. Frontend domain’i asıl marka yüzüdür.

---

## 0. Önkoşullar

- [ ] Domain `matova.app` satın alındı (Namecheap, Cloudflare Registrar, Google Domains/Squarespace, vb.)
- [ ] DNS paneline erişim var
- [ ] Render hesabında **edumath-web** (static) ve **edumath-t10n** / **edumath-api** servisleri mevcut
- [ ] (E-posta için) SMTP sağlayıcı seçildi — öneriler aşağıda

---

## 1. Render — custom domain (frontend)

1. Render Dashboard → **edumath-web** (static site) → **Settings** → **Custom Domains**
2. `matova.app` ekle (isteğe bağlı ayrıca `www.matova.app`)
3. Render’ın verdiği DNS kayıtlarını kopyala (genelde CNAME → `*.onrender.com` veya Render’ın belirttiği hedef)

### Tipik DNS (registrar / Cloudflare)

| Tip | Host | Değer | Not |
|-----|------|--------|-----|
| CNAME | `www` | Render’ın verdiği hostname | `www.matova.app` |
| ALIAS / ANAME / CNAME flattening | `@` | Render hedefi | Apex (`matova.app`) — sağlayıcıya göre |

Cloudflare kullanıyorsan:

- Proxy (turuncu bulut) ilk kurulumda **DNS only** (gri) ile başla; SSL doğrulanınca Proxied açılabilir.
- SSL/TLS mode: **Full (strict)** tercih edilir.

4. Render’da domain **Verified** + **Certificate issued** olana kadar bekle (birkaç dakika–saat).
5. Tarayıcıda doğrula:

```text
https://matova.app/
https://www.matova.app/   # eklediysen
```

Landing Matova markası ile açılmalı; API login hâlâ eski URL ile çalışır (bir sonraki adımda CORS/env güncellenir).

---

## 2. Render env güncelle (zorunlu)

Domain canlı olduktan **hemen** sonra env’leri değiştir ve **redeploy** et.

### 2a. API (`edumath-t10n` / `edumath-api`)

| Env | Yeni değer |
|-----|------------|
| `FRONTEND_URL` | `https://matova.app` |
| `ALLOWED_ORIGINS` | `https://matova.app,https://www.matova.app,https://edumath-client.onrender.com` |

Eski Render frontend URL’sini bir süre `ALLOWED_ORIGINS` içinde tut — bookmark / cache kırılmaz.

### 2b. Frontend (`edumath-web`) — **build-time**

| Env | Yeni değer |
|-----|------------|
| `VITE_PUBLIC_SITE_URL` | `https://matova.app` |
| `VITE_API_URL` | Mevcut API (örn. `https://edumath-t10n.onrender.com/api`) — değişmeyebilir |

`VITE_*` değişkenleri **yalnızca build’de** gömülür → env değişince frontend’i **Clear build cache & deploy** ile yeniden derle.

Doğrulama (deploy sonrası):

```powershell
# OG / canonical matova.app olmalı
(Invoke-WebRequest https://matova.app/ -UseBasicParsing).Content | Select-String "og:url|canonical|matova.app"

# robots / sitemap
Invoke-WebRequest https://matova.app/robots.txt -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest https://matova.app/sitemap.xml -UseBasicParsing | Select-Object -ExpandProperty Content
```

Şifre sıfırlama mailindeki link de `FRONTEND_URL` üzerinden üretilir → `https://matova.app/reset-password?...`

---

## 3. (Opsiyonel) API subdomain

İstersen `api.matova.app` → Render API servisine CNAME:

1. Render API → Custom Domain → `api.matova.app`
2. DNS CNAME ekle
3. Frontend `VITE_API_URL=https://api.matova.app/api` (+ redeploy)
4. CORS zaten `FRONTEND_URL` / `ALLOWED_ORIGINS` ile frontend’e bağlı; API host değişimi CORS’u bozmaz

---

## 4. E-posta — `info@` ve `noreply@`

UI ve yasal metinler zaten `info@matova.app` gösteriyor. Gerçek gelen kutusu + sistem gönderimi ayrı kurulur.

### 4a. Gelen kutu (`info@matova.app`)

Seçenekler (birini seç):

| Sağlayıcı | Not |
|-----------|-----|
| **Cloudflare Email Routing** | Ücretsiz forward → kişisel Gmail; gönderim yok |
| **Google Workspace** | `@matova.app` profesyonel gelen/giden |
| **Zoho Mail / ImprovMX** | Düşük maliyet forward veya mailbox |

Minimum: Cloudflare Email Routing ile `info@` → senin Gmail’in.

### 4b. Sistem gönderimi (şifre sıfırlama / e-posta doğrulama)

Backend `SMTP_*` + `EMAIL_FROM` kullanır (`backend/services/mailerService.js`). SMTP yoksa mailler sadece loglanır.

Önerilen kolay yol: **Resend** veya **Brevo (Sendinblue)** veya **Mailgun** — domain doğrula (SPF/DKIM), sonra:

| Env (API) | Örnek |
|-----------|--------|
| `SMTP_HOST` | `smtp.resend.com` (sağlayıcıya göre) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | sağlayıcı kullanıcı / `resend` |
| `SMTP_PASS` | API key |
| `EMAIL_FROM` | `Matova <noreply@matova.app>` |

DNS’te sağlayıcının istediği **SPF**, **DKIM** (ve mümkünse **DMARC**) kayıtlarını ekle.

### 4c. Smoke test

```powershell
# API ayakta iken (üretim)
# Kayıtlı bir kullanıcı e-postası ile:
curl -X POST https://edumath-t10n.onrender.com/api/auth/request-password-reset `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"KAYITLI_EMAIL@ornek.com\"}"
```

- SMTP yapılandırıldıysa: gelen kutuda **Matova** From + `https://matova.app/reset-password?...` linki
- SMTP yoksa: Render API log’unda `📧 [MAIL LOG ONLY]` satırı

---

## 5. Go-live sırası (önerilen)

1. DNS + Render custom domain → HTTPS yeşil
2. API: `FRONTEND_URL` + `ALLOWED_ORIGINS` → redeploy
3. Frontend: `VITE_PUBLIC_SITE_URL` → clear cache & deploy
4. Login (öğrenci + öğretmen) `https://matova.app` üzerinden
5. Şifre sıfırlama maili (SMTP hazırsa)
6. [Google Search Console](https://search.google.com/search-console) → `matova.app` property + sitemap: `https://matova.app/sitemap.xml`
7. (İsteğe bağlı) Eski Render URL’den `matova.app`’e yönlendirme — Render custom domain genelde apex’i canonical tutar; ekstra 301 için Cloudflare Page Rule / Redirect Rule

---

## 6. Kod tarafı (bu repoda hazır)

| Parça | Durum |
|-------|--------|
| `VITE_PUBLIC_SITE_URL` → OG / canonical / robots / sitemap | ✅ `#9` |
| `FRONTEND_URL` → CORS + reset/verify linkleri | ✅ |
| `EMAIL_FROM` varsayılanı Matova | ✅ |
| UI / legal `info@matova.app` | ✅ |
| Mongo DB adı `Edumath`, seed `@edumath.local` | Bilinçli olarak değiştirilmedi |

Yerel örnekler: `backend/.env.example`, `frontend/.env.example`.

---

## 7. Sorun giderme

| Belirti | Kontrol |
|---------|---------|
| Login CORS hatası | API `FRONTEND_URL` / `ALLOWED_ORIGINS` tam origin (`https://matova.app`, trailing slash yok) |
| OG hâlâ eski URL | Frontend rebuild; `VITE_PUBLIC_SITE_URL` set mi? |
| Reset linki eski host | API `FRONTEND_URL` |
| Mail gelmiyor | SMTP env + SPF/DKIM; spam; Render log’da log-only mi? |
| SSL pending | DNS doğru mu; Cloudflare proxy kapatıp dene |

---

İlgili: [render-env-edumath.md](./render-env-edumath.md), [deploy-checklist.md](./deploy-checklist.md)
