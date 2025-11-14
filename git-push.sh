#!/bin/bash

# GitHub'a Yükleme Script'i
cd "C:\Users\kocba\OneDrive\Masaüstü\Projects\edumath_"

echo "=== Git Status ==="
git status

echo ""
echo "=== Dosyalar Ekleniyor ==="
git add ARCHITECTURE.md
git add ai-fastapi/
git add GITHUB_PUSH_GUIDE.md
git add push-to-github.ps1

echo ""
echo "=== Commit Yapılıyor ==="
git commit -m "feat: AI-FastAPI servisi eklendi

- FastAPI yapay zeka mikro servisi oluşturuldu
- OpenAI GPT entegrasyonu hazırlandı  
- 6 ana özellik altyapısı (soru üretme, çözüm analizi, öneriler, OCR, chatbot, tahmin)
- ARCHITECTURE.md ile servisler arası bağlantılar dokümante edildi
- Kapsamlı dokümantasyon eklendi (README, QUICKSTART, OZET)
- Backend ve Frontend entegrasyon örnekleri
- setup_project.py ile otomatik kurulum"

echo ""
echo "=== GitHub'a Push Ediliyor ==="
git push origin main

echo ""
echo "✅ TAMAMLANDI!"
