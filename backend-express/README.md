# EduMath Backend - Express API

Modern eğitim platformu için Node.js/Express backend API'si.

## 📋 Özellikler

- ✅ JWT tabanlı kimlik doğrulama
- ✅ Rol bazlı yetkilendirme (Öğretmen/Öğrenci)
- ✅ Sınav ve ödev yönetimi
- ✅ Anket sistemi
- ✅ Oyunlaştırma (gamification)
- ✅ Analitik ve raporlama
- ✅ Sınıf ve öğrenci yönetimi
- ✅ Soru havuzu (question pool)

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env

# MongoDB bağlantısını yapılandır
# .env dosyasında MONGO_URI'yi düzenle
```

## 🔧 Yapılandırma

`.env` dosyası:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/edumathDB
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

## 🏃 Çalıştırma

```bash
# Development
npm run dev

# Production
npm start
```

## 📁 Proje Yapısı

```
backend-express/
├── controllers/      # İş mantığı (business logic)
├── models/          # Mongoose şemaları
├── routes/          # API route tanımlamaları
├── middleware/      # Auth ve diğer middleware'ler
├── utils/           # Yardımcı fonksiyonlar
└── server.js        # Ana sunucu dosyası
```

## 🔐 API Endpoints

### Auth
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yapma
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Teacher (Öğretmen)
- `GET /api/teacher/students` - Öğrencileri listele
- `POST /api/teacher/students/remove` - Öğrenciyi sınıftan çıkar
- `POST /api/teacher/seed-demo-data` - Demo veri oluştur

### Classes (Sınıflar)
- `GET /api/classes` - Sınıfları listele
- `POST /api/classes` - Yeni sınıf oluştur
- `PUT /api/classes/:id` - Sınıf güncelle
- `DELETE /api/classes/:id` - Sınıf sil

### Exams (Sınavlar)
- `GET /api/exams` - Sınavları listele
- `POST /api/exams` - Yeni sınav oluştur
- `GET /api/exams/:id` - Sınav detayı
- `PUT /api/exams/:id` - Sınav güncelle
- `DELETE /api/exams/:id` - Sınav sil

### Surveys (Anketler)
- `GET /api/surveys` - Anketleri listele (öğretmen)
- `POST /api/surveys` - Yeni anket oluştur
- `GET /api/surveys/available` - Mevcut anketler (öğrenci)
- `POST /api/surveys/:id/answer` - Ankete yanıt ver

### Analytics
- `GET /api/analytics/teacher/summary` - Öğretmen özet istatistikleri

### Leaderboard
- `GET /api/leaderboard` - Liderlik tablosu

## 🛠️ Teknolojiler

- **Express.js 4.x** - Web framework
- **MongoDB** - Veritabanı
- **Mongoose** - ODM
- **JWT** - Token tabanlı kimlik doğrulama
- **bcryptjs** - Şifre hashleme
- **CORS** - Cross-origin kaynak paylaşımı

## 📝 Notlar

- Production ortamında `NODE_ENV=production` ayarlanmalı
- JWT_SECRET güvenli ve uzun bir string olmalı
- CORS yapılandırması production için güncellenmelidir
