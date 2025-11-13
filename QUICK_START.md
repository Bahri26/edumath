# 🚀 EduMath - Hızlı Başlangıç

## Son Güncellemeler (13 Kasım 2025)

✅ **Homepage 404 sorunları düzeltildi**  
✅ **Route sıralaması optimize edildi**  
✅ **Leaderboard query params desteği eklendi**  
✅ **Frontend/Backend senkronizasyonu tamamlandı**

---

## 📦 Kurulum

### 1. Backend
```bash
cd backend-express
npm install
cp .env.example .env
# .env dosyasını düzenle (MONGO_URI, JWT_SECRET)
node server.js
```

**Backend**: `http://localhost:8000`

### 2. Frontend
```bash
cd frontend-react
npm install
cp .env.example .env
# VITE_API_BASE değişkenini kontrol et
npm run dev
```

**Frontend**: `http://localhost:5173`

---

## 🧪 Test

### Manuel Test
1. Backend'i başlat (`node server.js`)
2. Frontend'i başlat (`npm run dev`)
3. Browser'da `http://localhost:5173` aç
4. Öğretmen hesabıyla giriş yap
5. Homepage'de widget'ların yüklendiğini kontrol et

### Otomatik Test
```powershell
# PowerShell'de çalıştır
.\test-homepage.ps1
```

---

## 📊 Homepage Widget'ları

### Öğretmen Homepage
- **Hızlı İstatistikler**: Toplam sınav, ortalama skor, aktif öğrenci
- **Anket Önizlemesi**: Son 5 anket
- **Yaklaşan Sınavlar**: Aktif sınavlar + durum filtresi
- **Haftalık Liderler**: Top 5 öğrenci

### Öğrenci Homepage
- **İstatistik Şeridi**: XP, Seviye, Rozetler
- **Yaklaşan Sınavlar**: Aktif sınavlar
- **Günlük Meydan Okuma**: Günlük görev
- **Liderlik Tablosu**: Top 5 lider

---

## 🔧 Düzeltilen Sorunlar

### Route Sıralaması
```javascript
// ❌ ÖNCE (Yanlış)
router.route('/:id').get(...)  // "available" stringini ID olarak algılar
router.get('/available', ...)   // Asla çalışmaz

// ✅ SONRA (Doğru)
router.get('/available', ...)   // Spesifik route önce
router.route('/:id').get(...)   // Parametreli route sonda
```

### Query Params
```javascript
// Leaderboard artık query params destekliyor
GET /api/leaderboard?period=week&limit=5

// Response: [{ rank, name, xp, level, score }]
```

---

## 📚 Dokümantasyon

- **Ana README**: `/README.md`
- **Backend README**: `/backend-express/README.md`
- **Temizlik Raporu**: `/PROJECT_CLEANUP_SUMMARY.md`
- **Homepage Durum**: `/HOMEPAGE_STATUS.md`
- **Düzeltme Rehberi**: `/HOMEPAGE_FIX_GUIDE.md`

---

## 🐛 Sorun Giderme

### Backend başlamıyor
```bash
# Port kullanımda olabilir
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### 404 Hatası
- Backend çalışıyor mu? (`http://localhost:8000/api/health`)
- Token geçerli mi? (Yeniden login yap)
- Route sıralaması doğru mu? (Bu düzeltmede çözüldü)

### 403 Forbidden
- Öğretmen hesabıyla giriş yaptın mı?
- Token header'ı doğru mu? (`Authorization: Bearer <token>`)

---

## 🎯 Teknoloji Stack

**Backend**: Express 4.21, MongoDB, JWT, bcrypt  
**Frontend**: React 19, Vite 7, React Router 7, Axios  
**UI**: Bootstrap 5, Styled Components, Framer Motion  
**Charts**: Recharts  

---

## ✅ Çalışma Durumu

| Komponent | Status |
|-----------|--------|
| Backend API | ✅ Çalışıyor |
| Frontend SPA | ✅ Çalışıyor |
| MongoDB | ✅ Bağlı |
| Auth System | ✅ Çalışıyor |
| Analytics | ✅ Düzeltildi |
| Surveys | ✅ Düzeltildi |
| Leaderboard | ✅ Düzeltildi |
| Gamification | ✅ Çalışıyor |

---

**Proje Versiyonu**: 2.1.0-fixed  
**Son Güncelleme**: 13 Kasım 2025  
**Maintainer**: Bahadır Sarı (bahadir26@hotmail.com)
