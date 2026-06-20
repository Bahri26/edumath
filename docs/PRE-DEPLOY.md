# Pre-deploy durum özeti

Son güncelleme: deploy öncesi eksik giderme sprinti.

## Tahmini kalite skoru

| Metrik | Değer |
|--------|--------|
| Genel | ~78–80 / 100 |
| Güvenlik (P0/P1) | ✅ Kodda |
| Test otomasyonu | 🟡 Unit iyi, E2E seed varsayılanlı |
| i18n | 🟡 Shell + ayarlar + progress + admin ipucu |
| a11y | 🟡 Modal focus trap, aria iyileştirmeleri |
| Operasyon | 🟡 Render env manuel, smoke script hazır |

## Otomatik doğrulama

```powershell
cd backend ; npm test ; npm run smoke:predeploy
cd ../frontend ; npm test ; npm run test:e2e
```

Tam smoke login için backend çalışırken:

```powershell
$env:SMOKE_STUDENT_EMAIL="student@edumath.local"
$env:SMOKE_STUDENT_PASSWORD="password123"
cd backend ; npm run smoke:predeploy
```

## Render’da sizin doldurmanız gerekenler

- `MONGODB_URI`
- `GOOGLE_DRIVE_CREDENTIALS_JSON` (inline JSON)
- `GOOGLE_DRIVE_OAUTH_CLIENT_ID` / `SECRET` / `REFRESH_TOKEN`
- İsteğe bağlı: `SENTRY_DSN`, `VITE_SENTRY_DSN`

Detay: [deploy-checklist.md](./deploy-checklist.md)

## Bilinçli olarak sonraya bırakılanlar

- Tüm sayfaların i18n’i (TeacherReports, SkillTreeBuilder, …)
- MongoDB ile tam HTTP integration testleri
- Admin tablo kart görünümü (mobil)
- WCAG kontrast denetimi
