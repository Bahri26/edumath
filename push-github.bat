@echo off
echo ========================================
echo GitHub'a Yukleme Baslatiyor...
echo ========================================
echo.

cd /d "C:\Users\kocba\OneDrive\Masaustu\Projects\edumath_"

echo [1/5] Git durumunu kontrol ediliyor...
git status
echo.

echo [2/5] Yeni dosyalar ekleniyor...
git add ARCHITECTURE.md
git add ai-fastapi
git add GITHUB_PUSH_GUIDE.md
git add push-to-github.ps1
echo Dosyalar eklendi!
echo.

echo [3/5] Durum kontrol ediliyor...
git status
echo.

echo [4/5] Commit yapiliyor...
git commit -m "feat: AI-FastAPI servisi ve mimari dokumantasyonu eklendi - FastAPI ile yapay zeka mikro servisi olusturuldu - OpenAI GPT entegrasyonu hazirlandi - 6 ana ozellik icin altyapi eklendi - ARCHITECTURE.md ile servisler arasi baglanti dokumante edildi - Kapsamli dokumantasyon (README, QUICKSTART, OZET, START_HERE)"
echo.

echo [5/5] GitHub'a gonderiliyor (push)...
git push origin main
echo.

echo ========================================
echo TAMAMLANDI!
echo ========================================
echo.
echo Yuklenen dosyalar:
echo - ARCHITECTURE.md
echo - ai-fastapi/ klasoru
echo - GITHUB_PUSH_GUIDE.md
echo - push-to-github.ps1
echo.
echo GitHub'da kontrol et!
echo.
pause
