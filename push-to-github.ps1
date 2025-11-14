# GitHub'a Yükleme Script'i
# Yeni eklenen dosyalar için

Write-Host "🚀 GitHub'a Yükleme Başlatılıyor..." -ForegroundColor Green
Write-Host ""

# Git durumunu kontrol et
Write-Host "📊 Değişiklikleri kontrol ediliyor..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "📁 Yeni dosyalar ekleniyor..." -ForegroundColor Yellow

# ARCHITECTURE.md dosyasını ekle
git add ARCHITECTURE.md

# ai-fastapi klasöründeki tüm dosyaları ekle
git add ai-fastapi/*

Write-Host ""
Write-Host "✅ Dosyalar eklendi!" -ForegroundColor Green
Write-Host ""

# Durumu tekrar göster
Write-Host "📊 Güncel durum:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "💾 Commit mesajı yazılıyor..." -ForegroundColor Yellow

# Commit yap
git commit -m "feat: AI-FastAPI servisi eklendi

- FastAPI ile yapay zeka mikro servisi oluşturuldu
- OpenAI GPT entegrasyonu hazırlandı
- 6 ana özellik için altyapı (soru üretme, çözüm analizi, öneriler, OCR, chatbot, tahmin)
- Backend ve Frontend entegrasyon örnekleri eklendi
- Kapsamlı dokümantasyon (README, QUICKSTART, OZET, START_HERE)
- ARCHITECTURE.md ile servisler arası bağlantılar dokümante edildi
- setup_project.py ile otomatik kurulum scripti"

Write-Host ""
Write-Host "✅ Commit başarılı!" -ForegroundColor Green
Write-Host ""

Write-Host "🌐 GitHub'a gönderiliyor (push)..." -ForegroundColor Magenta
Write-Host ""

# GitHub'a gönder
git push origin main

Write-Host ""
Write-Host "🎉 GitHub'a yükleme tamamlandı!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ İşlemler:" -ForegroundColor Cyan
Write-Host "  • ARCHITECTURE.md eklendi"
Write-Host "  • ai-fastapi/ klasörü ve içeriği eklendi"
Write-Host "  • Commit yapıldı"
Write-Host "  • GitHub'a push edildi"
Write-Host ""
Write-Host "🔗 GitHub'da kontrol et:" -ForegroundColor Yellow
Write-Host "  https://github.com/kullanici_adin/edumath_"
Write-Host ""
