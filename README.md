# Edumath

Modern bir eğitim platformu: öğrenci ve öğretmen panelleri, sınav/ödev yönetimi, yapay zeka destekli alıştırmalar, bildirimler ve admin denetimleri.

## Özellikler
- Öğrenci ve öğretmen panelleri (React + Vite)
- Sınav, soru, anket ve ödev yönetimi (Express + MongoDB)
- Yapay zeka pratik ekranı ve sohbet bileşeni
- JWT tabanlı kimlik doğrulama, Refresh Token rotasyonu
- Şifre sıfırlama: token üretimi veya admin tarafından doğrudan şifre atama
- E-posta doğrulama (mailer servisi ile)
- Bildirim sistemi (okundu/okunmadı, son bildirimler)
- Admin paneli: şifre talepleri, kullanıcı onayları, ayarlar ve hızlı özetler
- Güvenlik: Helmet, rate-limit, compression, temel CSP ve sağlık/readiness uç noktaları

## Mimari
- Frontend: `frontend/` (React, Vite, Tailwind)
- Backend: `backend/` (Express, Mongoose)
- Veritabanı: MongoDB Atlas veya lokal MongoDB
- Kimlik doğrulama: Access + Refresh JWT, rota bazlı yetki (student/teacher/admin)

## Kurulum
### 1) Gerekli yazılımlar
- Node.js 18+
- MongoDB (Atlas veya lokal)
- Git

### 2) Çevre değişkenleri
Backend için `backend/.env` içine aşağıdakileri ekleyin:
```
MONGO_URI="<MongoDB Atlas veya lokal bağlantı>")
JWT_SECRET="<rastgele-gizli>"
JWT_REFRESH_SECRET="<rastgele-gizli>"
ACCESS_TOKEN_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN_DAYS="30"
FRONTEND_URL="http://localhost:5173"
AUTH_RATE_LIMIT_WINDOW_MS="900000"
AUTH_RATE_LIMIT_MAX="20"
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX="100"
SMTP_HOST="<opsiyonel>"
SMTP_PORT="<opsiyonel>"
SMTP_USER="<opsiyonel>"
SMTP_PASS="<opsiyonel>"
```
Frontend için (opsiyonel) `frontend/.env`:
```
VITE_API_URL="http://localhost:8000"
```

### 3) Çalıştırma
Backend:
```
cd backend
npm install
npm start
```
Frontend:
```
cd frontend
npm install
npm run dev
```

## Hızlı Kullanım
- Landing sayfasından giriş/kayıt modali açılır.
- Kayıt olan kullanıcılar admin onayı bekler (`status=pending`). Admin onaylayınca `active` olur.
- Şifre sıfırlama talebi, login modaldan veya `/reset-password` akışıyla yapılır.
- Admin Paneli (`/admin`):
  - Şifre Sıfırlama Talepleri: 
    - "Token Üret": kullanıcı için zaman sınırlı token oluşturur.
    - "Onayla ve Şifre Ata": güçlü şifre politikası ile doğrudan şifre atar (isteğe bağlı ilk girişte değiştirme).
  - Kullanıcı Onayları: durum/rol filtreleri, arama ve sayfalama; satırda geçici şifre girerek onaylama.
  - Ayarlar: profil bilgileri ve çıkış.
  - Panel Özeti: bekleyen talepler, bekleyen kullanıcılar, kısa istatistikler ve hızlı geçişler.

## Önemli API Uç Noktaları
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- Reset Talebi (public): `POST /api/auth/password-reset-request`
- Şifreyi Token ile Güncelle: `POST /api/auth/reset-password`
- Admin:
  - Reset talepleri: `GET /api/admin/password-reset-requests?status=pending|approved|denied`
  - Onayla (token üret): `POST /api/admin/password-reset-requests/:id/approve`
  - Onayla ve şifre ata: `POST /api/admin/password-reset-requests/:id/approve-set-password` (body: `{ newPassword, mustChange }`)
  - Reddet: `POST /api/admin/password-reset-requests/:id/deny`
  - Kullanıcı listesi: `GET /api/admin/users?status=all&role=all&q=&page=1&limit=10`
  - Kullanıcı onayla: `POST /api/admin/users/:id/approve` (opsiyonel `{ tempPassword }`)
  - Kullanıcıya şifre ata: `POST /api/admin/users/:id/set-password`
- Bildirimler: `GET /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/mark-all-read`

## Güvenlik ve İyileştirmeler
- Helmet + rate limiting + compression + temel CSP etkin.
- Refresh Token rotasyonu, revoke ve süre yönetimi.
- Güçlü şifre politikası (admin şifre atamada): en az 8 karakter, büyük/küçük harf, rakam ve sembol.
- AdminAudit (backend/models/AdminAudit.js): admin işlemleri (onay, reddetme, şifre atama) kayıt altına alınır.

## Proje Komutları
- Backend: `npm start`, `npm run dev` (varsa nodemon), `npm test` (eklendiğinde)
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

## Render Deploy
Bu repo Render icin hazir `render.yaml` dosyasi icerir: [render.yaml](render.yaml).

Servisler:
- `edumath-api`: Node.js backend web service
- `edumath-web`: Vite frontend static site

Render uzerinde izlenecek sira:
1. Repo olarak `Bahri26/edumath` sec ve `Blueprint` ile deploy et.
2. Backend service icin `MONGODB_URI` degerini Render panelinden gir.
3. Frontend deploy olduktan sonra `edumath-web` URL'sini backend'deki `FRONTEND_URL` env degerine yaz.
4. Backend URL'sini frontend'deki `VITE_API_URL` env degerine yaz.
5. Eger gorselleri ayri bir bucket veya CDN'den vereceksen `VITE_ASSET_BASE_URL` tanimla. Bos birakilirsa frontend, `VITE_API_URL` uzerinden devam eder.

Notlar:
- React Router icin tum istekler `index.html` e rewrite edilir.
- Frontend build komutu Render'da `npm ci --include=dev && npm run build` olmali; aksi halde `vite: not found` hatasi alinabilir.
- Repo icindeki SVG pattern gorselleri deploy ile gelir.
- Calisma aninda yuklenen dosyalar Render'da kalici degildir. Kalici medya icin Google Cloud Storage, Cloudinary veya benzeri object storage kullan.

## Geliştirme Notları
- .env dosyaları repoya gönderilmez (.gitignore dahil).
- MongoDB bağlantınız yoksa backend `GET /ready` ve `GET /health` uç noktaları ile durumu kontrol edebilirsiniz.
- Admin kullanıcıyı manuel eklemek isterseniz MongoDB’de `users` koleksiyonuna rolü `admin` olan bir kayıt ekleyin (şifre `bcrypt` hash olmalı).

## Katkı ve Yol Haritası
- Swagger dokümantasyonu ve CI (GitHub Actions) eklenebilir.
- Bildirim merkezi için ayrı bir sayfa ve gelişmiş filtreleme.
- Audit log görselleştirmeleri ve yönetim raporları.

---
Herhangi bir sorunuz veya katkı isteğiniz için pull request açabilirsiniz. İyi çalışmalar! 🚀
