> **16 Ekim 2026 güncellemesi:** Aşağıdaki 10 Ekim bulguları tarihsel kayıttır. 95 PDF sorusu yedek alındıktan sonra aynı kimliklerle güncellendi. Son denetimde kaynak paket farkı, inceleme bekleyen soru, tanımlı soru/sınav sorunu ve birebir tekrar sayıları 0. Toplam 480 soru ve 8 sınav korundu. Aktarım ve görsel görüntüleyici ayrıntıları: `docs/image-viewer-and-pdf-import.md`.

# Soru bankası ve sınav tutarlılığı incelemesi — 10 Ekim 2026

Canlı veritabanı yalnızca okunarak 480 soru ve 8 sınav denetlendi. Ayrıntılar `question-exam-audit.json` dosyasındadır. Bu inceleme tüm 480 sorunun matematiksel çözümünü yeniden doğrulamaz; PDF sorularının önceki kaynak incelemesiyle karşılaştırmasını ve kayıt/sınav tutarlılığını kapsar.

## Bulgular

| Konu | Sonuç |
|---|---|
| Birebir tekrar | Sınıf, soru türü, normalize edilmiş metin, şıklar ve görsel adresleri birlikte karşılaştırıldığında 0 tekrar grubu. Kaynak sayfa/soru kimliği tekrarları da 0. Anlamca benzer sorular veya farklı adreslerde aynı görseller bu sonuçla dışlanmaz. |
| Cevap anahtarı | Düzeltilmiş yerel PDF paketiyle canlı kayıt arasında 9 doğru seçenek farkı. |
| İnceleme durumu | 21 canlı soru inceleme bekliyor; bunlar 5, 6 ve 7. sınıf kaynak sınavlarının 3'ünde kullanılıyor. |
| Kaynak görselleri | 35 canlı kayıtta henüz yeni tam soru görseli yok. Bu sayı 35 bozuk görsel anlamına gelmez; önceki bazı kayıtlar metin sorusuydu. |
| Kaynak bilgisi | 9. sınıf 15. sorunun kaynak sayfası canlı kayıtta yanlış. Yerel pakette düzeltildi. İki sorunun seçenek metni de yerel paketle farklı. |
| Otomatik sınav havuzu | 5. sınıfta toplam 6, 6 ve 7. sınıflarda 4'er zor soru var. Bu sayılar tüm derslerin toplamıdır; ders/konu ve inceleme filtresi kullanılabilir havuzu daha da daraltabilir. Her seviyeden 7 soru isteyen 21 soruluk sınav bu sınıflarda mevcut havuzla oluşturulamaz. |

Cevap farkları (PDF sayfası / o sayfadaki soru): 5. sınıf 2/7, 2/10, 4/4, 5/1, 5/2; 6. sınıf 1/5, 2/10; 7. sınıf 2/9, 5/2.

## Yerel projede yapılan düzeltmeler

- Öğretmen → Soru bankası: açılan kartın `col-span-full` ile tüm satırı kaplaması kaldırıldı. Detaylar sayfa düzenini değiştirmeyen, belge gövdesine bağlı ayrı önizleme penceresinde açılıyor. Pencere ekran yüksekliğiyle sınırlı ve kendi içinde kaydırılabilir. Escape, kapatma düğmesi, odak dönüşü ve arka plan kaydırma kilidi eklendi.
- Sınav önizlemesi aynı pencereyi ve ortak soru/şık bileşenlerini kullanıyor; görsel şıklar korunuyor. Uzun seçenekler esnek satır düzenine geçiyor. Tam kaynak görselinde zaten bulunan metin ve şıklar ikinci kez basılmıyor; cevap harfleri sunuluyor.
- Görsel yükleme hatası sessizce kaybolmak yerine açıklamayla gösteriliyor; tam soru görselinde kayıtlı soru metni de yedek olarak gösteriliyor.
- Manuel sınav sunucu tarafında 21 farklı soru, aynı sınıf/ders, 7–7–7 dağılımı, geçerli cevap ve inceleme durumu bakımından doğrulanıyor. Otomatik seçim aynı içerikte tekrarları ve inceleme bekleyen soruları dışlıyor; yetersiz havuzda kullanılabilir sayıları bildiriyor.
- Sınav başlığı, pozitif süre ve tarih sırası doğrulanıyor. Sınav oluşturma listesi 1–12. sınıfları içeriyor; ders seçimi yanlış “Konu / Kazanım” etiketi yerine “Ders” olarak gösteriliyor. Sunucu hata açıklaması öğretmene iletiliyor.

## Önerilen sonraki geliştirmeler

1. Sınav türlerini açıkça ayırın: esnek soru sayılı kaynak PDF testi ve 21 soruluk dengeli sınav. Kaynak testler 22/30/22/21 sorudur; hepsine zorunlu 7–7–7 kuralı uygulanmamalı.
2. Öğretmene soru sayısı ve zorluk dağılımı seçimi, oluşturma öncesinde ders/konu bazında uygun havuz sayıları sunun. Zorluk etiketlerini yalnızca kota doldurmak için değiştirmeyin; uzman değerlendirmesi ve öğrenci yanıtlarıyla doğrulayın.
3. Yayın öncesi taslak/onay akışı ve kaynak düzeltme geçmişi ekleyin. Görsel, cevap ve çözüm kontrolünden geçmiş sorular sınava alınmalı.
4. Benzer soru uyarısı için metin benzerliği ve görsel içerik özeti kullanın; aynı kazanımı ölçen farklı soruları otomatik silmeyin.
5. Kazanım kapsama tablosu, ortak köklü soru gruplarını birlikte seçme ve görsel büyütme seçenekleri ekleyin.

## Yayın durumu

Bu değişiklikler yerel projededir. Canlı soru kayıtları ve mevcut sınavlar değiştirilmedi. PDF paketinin canlı aktarımı önceki denemede Drive OAuth `invalid_grant` hatasıyla ilk görsel yüklemesinde durmuştu; kimlik doğrulaması yenilendikten sonra aktarım tekrar yapılmalıdır.

## Doğrulama

- Kaynak paket ve sınav kompozisyonu: 13 Node testi geçti.
- Soru yerleşimi ve öğretmen sınav sayfası: 16 Vitest testi geçti.
- Öğretmen soru bankası: 375, 768 ve 1440 piksel genişliklerinde 3 Playwright testi geçti. Önizlemenin kart konumlarını değiştirmemesi, ekran sınırları, uzun şıklar, kaydırma kilidi, Escape ve odak dönüşü kontrol edildi. API çağrıları sahte verilerle karşılandı; canlı sınav oluşturulmadı. Yerel kurulu Chromium kullanıldı.
- Üretim derlemesi (`npm run build`) ve sınav rotası JavaScript sözdizimi kontrolü geçti.
