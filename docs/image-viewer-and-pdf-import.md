# Resimli soru görüntüleyicisi — 16 Ekim 2026

Ortak `QuestionVisual` bileşenine tıklanabilir büyük görünüm, yükleme durumu ve gerçek yeniden deneme düğmesi eklendi. Yeni `QuestionImageViewer` portal üzerinden açılır; yakınlaştırma/uzaklaştırma, ekrana sığdırma, özgün boyut ve fare/dokunmatik sürükleme destekler. Görsel alanı klavye odağı alabilir. Escape yalnızca üstteki görsel penceresini kapatır; alttaki soru önizlemesi ve kaydırma kilidi korunur. Kapanınca odak açan kontrole döner.

Kontroller:

- İlgili 25 frontend ve 13 kaynak/sınav testi geçti.
- Üretim derlemesi ve değişen görsel bileşenlerinin ESLint kontrolü başarılı.
- Tarayıcıda özgün boyut, %125 yakınlaştırma, ekrana sığdırma ve sürükleme doğrulandı; sürükleme sonucunda görsel alanı 400 piksel yatay, 200 piksel dikey kaydı.
- 375×667 mobil görünümde sayfada yatay taşma yok; görsel penceresi ekran içinde.
- Aktarım öncesi 95 kaynak sorunun yedeği `tmp/pattern-questions-before-2026-10-16.json` dosyasına alındı. Yerel paket 95 soru ve 95 görsel olarak doğrulandı.

Bu görüntüleyici taranmış bir görselin kaynak çözünürlüğünü artırmaz. Kırpma/döndürme editörü ve kalıcı soru sürüm geçmişi bu değişikliğin parçası değildir.


## Tamamlanan aktarım

95 kaynak soru mevcut kimlikleriyle güncellendi: 5. sınıf 22, 6. sınıf 30, 7. sınıf 22, 9. sınıf 21. Tümünde tam soru görseli mevcut. 95 kimlik korundu, soru sahipliğinde değişiklik yok. Yeni sınav oluşturulmadı. Bir yeni Drive görseli herkese açık adresten HTTP 200 ve image/png döndürdü.

Aktarım sonrası denetim: 480 soru, 8 sınav; birebir tekrar 0, kaynak kimliği tekrarı 0, tanımlı soru sorunu 0, tanımlı sınav sorunu 0, düzeltilmiş PDF paketiyle fark 0. Bu denetim 480 sorunun tamamının matematiksel çözümünü yeniden kanıtlamaz; 95 kaynak sorunun düzeltilmiş yerel paketle eşleşmesini ve kayıt tutarlılığını doğrular. Ayrıntılar `docs/question-exam-audit.json` dosyasında güncellendi.
