# Öğretmen kılavuzu (kısa)

## Giriş ve branş

- Branş değişikliği yönetici onayına düşebilir; durumu **Profil** sayfasından takip edin.

## Soru bankası

- Soru ekleme, filtreleme, AI/smart paste ile toplu içe aktarma.
- Görseller Google Drive’a yüklenir (prod’da OAuth yapılandırması gerekir).

## Egzersiz ve sınav

- **Egzersiz oluştur** → havuzdan soru seç → öğrencilere Study Hub’da görünür.
- **Sınav** → zaman penceresi ve sonuç modalları ile takip.

## Öğrenci takibi

**Öğrenci takibi** menüsünden:

- Ders quiz ilerlemesi (doğru/yanlış, XP)
- Egzersiz puanı ve harcanan süre

Roster, sizin içeriklerinizi tamamlayan öğrencilerden oluşur.

## Sonuçlar

- Egzersiz/sınav sonuç modallarında süre ve soru bazlı detay.

## Deploy / prod notu

Render’da `GOOGLE_DRIVE_OAUTH_*` ve klasör ID’leri tanımlı olmalı. Yerelde `npm run verify:drive` ile doğrulayın.
