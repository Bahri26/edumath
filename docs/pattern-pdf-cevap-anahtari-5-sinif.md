# 5. Sınıf Örüntü PDF — Çıkarılan Sorular ve Cevap Anahtarı

**Kaynak:** `5 sınıf örüntü başlık.pdf` (5. Sınıf Matematik Banko Soru Bankası, s. 223–228)
**Yöntem:** PDF'te ayrı bir cevap anahtarı yok (9. sınıf paketinin aksine). Sorular görsel olarak okunup matematiksel çözümle cevaplar bulundu.

## Neden 3 zorluk seviyesi bu şekilde ayrıldı

PDF'te 3 farklı renk/logo ile ayrılmış test var:

| Kod | Test adı | Renk | Sayfa | Soru sayısı | Zorluk etiketi |
|-----|----------|------|-------|-------------|-----------------|
| KTT | Konu Tarama/Kavrama Testi (Test 14) | Turuncu | 1–2 | 12 | Kolay |
| YGT | Yeni Nesile Geçiş Testi (Test 15) | Mavi | 3–4 | 6 | Orta |
| BTT | Beceri Temelli Test (Test 16) | Kırmızı | 5–6 | 4 | Zor |

**Toplam: 22 soru** (mevcut `importPatternPdfPack.js` script'indeki sabit "21 soru, 7-7-7 sıralı bölme" varsayımı bu PDF'in gerçek yapısına uymuyor — zorluk artık sıraya göre değil, kaynak teste göre atanmalı).

## Kolay — KTT (Test 14, 12 soru)

1. 3-9-▧-21-27-▧ toplamı → **48** (C)
2. 15-19-23-25-27-31, çıkarılacak sayı → **25** (C)
3. Dosya numaraları 12-16-20-24-…-40, bulunmayan → **35** (C)
4. Kareli şekil örüntüsü, 4. adım → **7** (B) — ⚠️ görselden kare sayımı kontrol edilmeli
5. Fidan boyu, 4. hafta → **23** (B)
6. 6-12-18-24-30 kuralı → **Adım sayısının 6 katı** (C)
7. Birim küp örüntüsü kuralı → **3 x (Adım Sayısı)** (D) — ⚠️ görselden küp sayımı kontrol edilmeli
8. 24-30-36-42-48, 50. adım → **318** (C)
9. Kare örüntüsü, hangi ifadeler kural olabilir → **Yalnız I** (A) — ⚠️ görselden kare sayımı kontrol edilmeli
10. Altıgen örüntüsü, 42. adım → **42** (B) — ⚠️ görselden altıgen sayımı kontrol edilmeli
11. Eşkenar üçgen çevre, 5. adım → **22** (C) — ⚠️ görselden şekil sayımı kontrol edilmeli
12. "Adım sayısının 2 katının 1 fazlası" hangi dizi → **3-5-7-9-…** (C)

## Orta — YGT (Test 15, 6 soru)

1. 9 kare sarı-turuncu-mor, sarı kare sayısı → **3** (B)
2. Yoklama listesi 20 bölme, imza sayısı → **10** (B)
3. 234 cm karton, 6 cm kareler, mavi parça sayısı → **16** (D)
4. Kareli L-şekli, kare sayısı kuralı → **3 x (Adım Sayısı)** (A) — ⚠️ görselden kontrol edilmeli
5. Aynı şekil, çevre kuralı → **20 x (Adım Sayısı) + 20** (C) — ⚠️ 6. soruyla tutarlı ama görselden kontrol edilmeli
6. Aynı şekil, 40. adım çevresi → **820** (C) — ⚠️ 5. soruyla aynı kurala dayanıyor

## Zor — BTT (Test 16, 4 soru)

1. "Kurdele örüntüsü" (X şekli, iki dizi birleşimi) → **Cevap belirlenemedi** — ⚠️ şıklardaki sayılar görselden tam netleştirilemedi, öğretmen panelinden görsele bakılarak elle işaretlenmeli
2. Üçgen/daire kesme süresi, 10. adım → **35** (D) — ⚠️ görselden şekil sayımı (adım başına kaç üçgen/daire) kontrol edilmeli
3. Kibrit çöpü ev örüntüsü, hangisi yanlış → **"Her adımda… beşer beşer artmıştır"** (D) — kural 4n+1 olduğundan artış 4'tür, 5 değil. (Yüksek güven — iç tutarlılık kontrolüyle doğrulandı.)
4. Kutu piramidi örüntüsü, 40. adım → **Cevap belirlenemedi** — ⚠️ ilk adımdaki kutu sayısı görselden net sayılamadı

## Sonraki adım önerisi

`5-sinif-extracted.json` dosyasındaki `needsReview: true` işaretli 11 soru, öğretmen panelinden (Soru Bankası → soru düzenle) görselle karşılaştırılıp onaylanmalı veya düzeltilmeli. Onaylandıktan sonra bu veri, `importPatternPdfPack.js` script'ine (ya da doğrudan bir MongoDB seed script'ine) kaynak olarak verilebilir — ancak script'in zorluk atama mantığının "sıraya göre 7-7-7" yerine "kaynak teste göre (KTT/YGT/BTT)" olacak şekilde güncellenmesi gerekiyor.
