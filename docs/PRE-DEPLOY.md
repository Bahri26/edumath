# Pre-deploy durum özeti

Son güncelleme: deploy öncesi eksik giderme sprinti (admin mobil, i18n, boş durumlar).

## Tahmini kalite skoru

| Metrik | Değer |
|--------|--------|
| Genel | ~82–84 / 100 |
| Güvenlik (P0/P1) | ✅ Kodda |
| Test otomasyonu | 🟡 Unit iyi, E2E seed varsayılanlı |
| i18n | 🟢 Shell, admin users/activity, study hub, chat, exercise player |
| a11y | 🟡 Modal focus trap, aria iyileştirmeleri |
| Operasyon | 🟡 Render env manuel, smoke script hazır |

## Bu sprintte tamamlananlar

- **AdminUsers / AdminUserActivity:** TR+EN `messages.js`, mobil kart görünümü (`lg` altı), boş liste mesajı
- **Admin tablolar:** Audit / branch / reset için kaydırma ipucu (`AdminScrollHint`)
- **Onay diyaloğu:** `useConfirmAction` locale-aware (Evet/Hayır → Yes/No)
- **TeacherReports:** Tarih formatı dil ile uyumlu
- **StudentExercisePlayer:** Tamamlanma ekranı i18n
- **Chatbox / Study Hub / Weak topics:** önceki sprint (misafir modu, konu filtresi)

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

- TeacherExerciseCreator, QuestionBank, ExamsPage tam i18n
- AdminLayout, AdminLogin, AdminDashboard tam i18n
- Admin branch/reset/dashboard mobil kart görünümü
- WCAG kontrast denetimi
