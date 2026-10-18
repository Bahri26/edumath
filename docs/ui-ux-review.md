# UI/UX ve soru düzenleme incelemesi — 11 Ekim 2026

Bu değerlendirme mevcut kaynak koduna ve yerel PDF soru verisine dayanır. Bu incelemede canlı soru kayıtları değiştirilmedi; tüm sistem uçtan uca test edilmiş sayılmaz. Önceki modal yerleşim kontrolleri yalnızca soru düzenleme/önizleme için geçerlidir.

## Öncelikli işlevsel bulgular

| Öncelik | Bulgu ve etkisi | Kaynak |
|---|---|---|
| P1 | Düzenleyici yalnızca A–D ve dört seçenek destekliyor. 9. sınıf kaynak dosyasındaki 21 sorunun tamamı beş seçenekli; 2, 3, 12 ve 14. soruların cevabı E. Düzenleme sırasında E kesiliyor ve seçilemiyor. | `frontend/src/components/exams/QuestionFormModal.jsx`: 136, 180, 258; `backend/data/pattern-pdf-import/9-sinif-extracted.json` |
| P1 | Resimli modda kaydetme seçenekleri doğrudan A/B/C/D yapıyor. Sadece şekil içeren, seçenekleri ayrı metin olan bir soruda seçenek metinleri kaybolabilir. Şekil görseli ile bütün soruyu içeren görsel ayrı türler olmalı; kayıtlı seçenek metinleri korunmalı. | `QuestionFormModal.jsx`: 305, 375 |
| P1 | Geliştirme ortamındaki PDF görsel eşlemesi, soru üzerinde yeni görsel yüklenmiş veya görsel kaldırılmış olsa da kaynak işaretleri korunuyorsa eski PDF görselini geri gösteriyor. Bu, localhost üzerinde başarılı güncellemenin görünmemesine neden olabilir. | `frontend/src/utils/localPatternSource.js`: 3–11; `QuestionFormModal.jsx`: 391 |
| P1 | Çoklu soruda doğrulama ve kayıt aynı döngüde yapılıyor. İkinci soru hatalıysa birinci soru zaten kaydedilmiş oluyor; tekrar deneme mükerrer kayıt oluşturabilir. Önce tüm sorular doğrulanmalı; ardından toplu kayıt, idempotency veya açık kısmi başarı takibi uygulanmalı. | `QuestionFormModal.jsx`: 322–365 |
| P2 | Çözüm, kazanım ve konu gibi alanları temizlemek eski değere geri düşüyor. Sunucu da yalnızca truthy değerleri atadığı için boş metin güncellemelerini kabul etmiyor. Boş değer ile gönderilmemiş alan ayrılmalı. | `QuestionFormModal.jsx`: 384–388; `backend/controllers/questionController.js`: 589–590 |
| P2 | Boş seçenekler harflerle dolduruluyor; en az iki dolu seçenek kontrolü, doğru cevabın dolu bir seçeneğe bağlı olduğunu garanti etmiyor. Dinamik 2–5 seçenek ve her seçenek için doğrulama gerekli. | `QuestionFormModal.jsx`: 307–309, 377 |
| P2 | Uzman doğrulama kutusu gerçek bir inceleme durumu kaydetmiyor. Kayıt gövdesi zaten her durumda `source: 'Manuel'` oluşturuyor. Kaynak ve uzman onayı ayrı alanlar olmalı. | `QuestionFormModal.jsx`: 252, 263, 599–601 |
| P2 | Mod değişikliği görsel/seçenek taslağını silebiliyor. Escape/kapatma değişiklik uyarısı vermiyor; kayıt sürerken iptal/kapatma açık. Taslak koruması ve kayıt durumuna uygun kontroller gerekli. | `QuestionFormModal.jsx`: mod geçişleri, kapanma ve kayıt akışı |

## Tasarım değerlendirmesi

Renk, kart, tipografi ve buton dili genel olarak tutarlı. Öğretmenin hızlı içerik üretmesi açısından büyük kartlar ve boşluklar, küçük etiketler, içerik türünü iki moda indirgeme ve uzun modal formu verimliliği düşürüyor.

- Soru bankası kare kartlarında soru cümlesi veya görsel küçük önizlemesi bulunmaması benzer soruları ayırt etmeyi zorlaştırıyor. Liste/kart görünümü seçimi; kısa metin, küçük görsel, sınıf, konu, zorluk ve inceleme durumu önerilir.
- Soru düzenleme modalının portal ve ekran yüksekliği sınırı iyileştirilmiş. Aynı ortak modal davranışı sınav oluşturma ve AI soru üretme ekranlarında da uygulanmalı. Sınav modalında portal, yükseklik sınırı ve odak kapanı bulunmaması özellikle kısa ekranlarda taşma riskini sürdürüyor.
- Alan etiketleri `htmlFor`/`id` ile bağlanmalı. Küçük, büyük harfli etiketler büyütülmeli; klavye odağı, hata alanına yönlendirme ve yakın hata mesajları standartlaştırılmalı.
- Otomatik sınav hazırlama, oluşturma isteğinden önce uygun soru sayısını ve eksik zorluk gruplarını göstermeli. Konu/kazanım kapsamı, seçilen sorular ve inceleme gerektiren kayıtlar görülebilmeli.

## Önerilen soru hazırlama/güncelleme akışı

1. Soru içeriği türü: metin, metin + şekil, tam soru görseli. Tek soru ve ortak köklü soru seçimi ayrı olmalı.
2. Masaüstünde solda düzenleme, sağda canlı öğrenci önizlemesi; mobilde düzenleme/önizleme sekmeleri. Büyük başlık ve süs yerine içerik alanı öncelenmeli.
3. 2–5 seçenek, açık doğru cevap seçimi; görsel kullanan sorularda da seçeneklerin kayıtlı metni korunmalı. Kaynak PDF görseli ve öğretmenin yeni görseli birbirinden ayrılmalı.
4. Kaydetmeden önce tüm alanları doğrulama; boş/tekrar seçenek, eksik cevap ve görsel hatasını ilgili alanda gösterme. Çoklu kayıt durumunu soru bazında belirtme.
5. Güncellemede mevcut içerik eksiksiz açılmalı. Değişiklik özeti, taslak koruması, uzman inceleme durumu ve sürüm geçmişi eklenmeli.

Öncelik: önce seçenek ve güncelleme doğruluğu, ardından ortak modal altyapısı, sonra soru bankası ve form düzeni. Görsel yeniden tasarım tek başına içerik kaybını çözmez.


## Uygulanan düzeltmeler

11 Ekim 2026 tarihinde seçenek sayısı 2–5 olarak düzenlendi; E cevabı ve resimli soruların kayıtlı seçenek metinleri korunuyor. Şekil/tam soru görseli ayrımı, açık yerel kaynak devre dışı bırakma işareti, alan temizleme, bütün çoklu soruları önce doğrulama, açık kısmi başarı takibi ve aynı formda yeniden denemede tamamlanan kayıtları atlama eklendi. Sunucu da güncellemelerde boş/tekrar seçenek ve şık dışı cevabı reddediyor. Ortak köklü kayıtlarda sabit grup/madde kimliğiyle kayıp HTTP cevabından sonraki tekrar isteği mevcut kaydı döndürüyor; bu kontrol eşzamanlı istekler için veritabanı düzeyinde benzersizlik garantisi değildir.

Güncelleme formunda masaüstünde yan yana canlı önizleme, dar ekranda tek kolon, kapanmadan önce değişiklik uyarısı ve kayıt sırasında kontrolleri kilitleme eklendi. Sınav ve AI pencereleri ortak portal/odak/ekran yüksekliği altyapısına taşındı. Kartlara kısa metin ve küçük görsel eklendi. Uzman onayı kaynak alanından ayrılarak metadata içinde tutuluyor; Manuel kaynak etiketi tek başına uzman onayı anlamına gelmiyor.

Otomatik sınav öncesi havuz özeti, gerçek seçimle aynı hazır olma ve tekrar kurallarını kullanıyor. Eksik seviyelerde oluşturma engelleniyor. Yerel API kontrolünde özet uç noktası 200 döndü; öğretmen test oturumu kapatıldı. Canlı soru veya sınav oluşturulmadı/değiştirilmedi.

Kontroller: frontend üretim derlemesi başarılı; ilgili 31 frontend ve 12 backend testi başarılı. 1280×720 ve 375×667 test görünümünde yatay taşma yok, kaydet düğmesi görünür. ESLint hata vermedi; QuestionBank içindeki önceden mevcut `t` hook bağımlılığı uyarısı sürüyor.

Kalıcı sürüm geçmişi, tarayıcı kapandıktan sonra taslak kurtarma ve kazanım kapsamını otomatik dengeleme sonraki geliştirmelerdir; bu düzeltmelerde uygulanmadı.
