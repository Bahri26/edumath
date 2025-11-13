# EduMath Frontend - React Application

Modern, interaktif matematik eğitim platformu frontend uygulaması.

## 🎨 Özellikler

- ✅ Rol bazlı arayüz (Öğretmen/Öğrenci/Misafir)
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Çoklu dil desteği (i18n)
- ✅ Tema desteği (light/dark)
- ✅ Oyunlaştırılmış öğrenme deneyimi
- ✅ Gerçek zamanlı analitikler
- ✅ İnteraktif soru çözme
- ✅ Sınav ve ödev yönetimi
- ✅ Anket sistemi

## 🚀 Hızlı Başlangıç

```bash
# Bağımlılıkları yükle
npm install

# Development modunda çalıştır
npm run dev

# Production build
npm run build

# Build'i önizle
npm run preview
```

## 🔧 Yapılandırma

Proje Vite kullanır. Ortam değişkenleri için `.env` dosyası:

```env
VITE_API_BASE=http://localhost:8000/api
```

## 📁 Proje Yapısı

```
src/
├── assets/          # Statik dosyalar (resimler, stiller)
├── components/      # React bileşenleri
│   ├── home/        # Ana sayfa bileşenleri
│   ├── interactive/ # İnteraktif soru tipleri
│   ├── layout/      # Layout bileşenleri (Navbar, Sidebar, Footer)
│   ├── ui/          # Ortak UI bileşenleri
│   └── features/    # Özellik bazlı bileşenler
├── contexts/        # React Context (Auth, i18n, Theme)
├── hooks/           # Custom React hooks
├── pages/           # Sayfa bileşenleri
│   ├── teacher/     # Öğretmen sayfaları
│   ├── student/     # Öğrenci sayfaları
│   └── public/      # Genel sayfalar
├── services/        # API servisleri
├── data/            # Statik veri ve müfredat
└── App.jsx          # Ana uygulama
```

## 🎯 Kullanıcı Rolleri

### 👨‍🏫 Öğretmen
- Sınıf ve öğrenci yönetimi
- Sınav oluşturma ve düzenleme
- Soru havuzu yönetimi
- Analitik ve raporlar
- Anket oluşturma

### 👨‍🎓 Öğrenci
- Sınav çözme
- Ödev takibi
- İlerleme izleme
- Rozet ve başarı sistemi
- Liderlik tablosu
- Anket doldurma

### 🌐 Misafir
- Platform tanıtımı
- Örnek içerikler
- Kayıt/Giriş

## 🛠️ Teknolojiler

- **React 19** - UI framework
- **React Router** - Sayfa yönlendirme
- **Axios** - HTTP client
- **Styled Components** - CSS-in-JS
- **Recharts** - Grafik ve analitikler
- **Framer Motion** - Animasyonlar
- **Bootstrap 5** - CSS framework
- **Vite** - Build tool

## 📱 Responsive Tasarım

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🎨 Tema Sistemi

Uygulama kids-friendly renkli tema kullanır:
- Canlı renkler (#ff6b6b, #4ecdc4, #95e1d3, vb.)
- Yuvarlatılmış köşeler (border-radius: 1rem)
- Oyunlaştırılmış UI elemanları
- Emoji ve icon kullanımı

## 🌍 Çoklu Dil

Türkçe ve İngilizce dil desteği mevcuttur.
Dil değiştirmek için: Ayarlar > Dil

## 🔐 Kimlik Doğrulama

JWT token tabanlı kimlik doğrulama:
- Token localStorage'da saklanır
- Otomatik token yenileme
- Protected routes
- Role-based access control

## 📊 Analitik ve Raporlar

- Öğrenci performans grafikleri
- Sınıf bazlı istatistikler
- Konu başarı oranları
- Zaman serisi grafikleri

## 🎮 Gamification

- Rozet sistemi
- XP puanları
- Günlük challenge'lar
- Liderlik tablosu
- Seviye sistemi

## 🧪 Test

```bash
npm run lint    # ESLint kontrolü
```

## 🚀 Production Deployment

```bash
# Build oluştur
npm run build

# dist/ klasörünü sunucuya deploy et
```

## 📝 Notlar

- Backend API'nin çalışıyor olması gerekir
- CORS yapılandırması backend'de ayarlanmalı
- Production build için VITE_API_BASE güncellenmeli

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
