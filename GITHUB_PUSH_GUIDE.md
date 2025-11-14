# GitHub'a Yükleme Rehberi

## Otomatik Yükleme (Önerilen)

PowerShell'de:
```powershell
.\push-to-github.ps1
```

## Manuel Yükleme

### 1. Değişiklikleri Kontrol Et
```bash
git status
```

### 2. Dosyaları Ekle

Tüm yeni dosyaları ekle:
```bash
git add .
```

Veya sadece belirli dosyaları:
```bash
git add ARCHITECTURE.md
git add ai-fastapi/
```

### 3. Commit Yap
```bash
git commit -m "feat: AI-FastAPI servisi ve mimari dokümantasyonu eklendi"
```

### 4. GitHub'a Gönder
```bash
git push origin main
```

## Sorun Çözme

### "Git bulunamadı" hatası
```bash
# Git yüklü mü kontrol et
git --version
```

### "Authentication failed" hatası
```bash
# GitHub Personal Access Token kullan
git config --global credential.helper store
git push
# Kullanıcı adı ve token iste
```

### "Branch ahead" uyarısı
```bash
# Önce pull yap
git pull origin main
# Sonra push
git push origin main
```

## Yüklenen Dosyalar

✅ ARCHITECTURE.md - Servisler arası bağlantılar
✅ ai-fastapi/main.py - FastAPI ana dosya
✅ ai-fastapi/requirements.txt - Python paketleri
✅ ai-fastapi/README.md - AI servis dokümantasyonu
✅ ai-fastapi/QUICKSTART.md - Hızlı başlangıç
✅ ai-fastapi/OZET.md - Özet bilgiler
✅ ai-fastapi/START_HERE.md - İlk adımlar
✅ ai-fastapi/setup_project.py - Kurulum scripti
✅ ai-fastapi/.env.example - Çevre değişkenleri
✅ ai-fastapi/.gitignore - Git ignore kuralları
✅ ai-fastapi/aiService.js.example - Backend entegrasyon
✅ ai-fastapi/aiService.jsx.example - Frontend entegrasyon

## GitHub'da Görüntüleme

Yükleme sonrası GitHub repository'nde göreceksin:
- Ana sayfada ARCHITECTURE.md
- ai-fastapi klasörü ve içindeki dosyalar
- Markdown dosyaları otomatik formatlanmış görünecek
