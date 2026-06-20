# Edumath — Öğrenci Kullanım Kılavuzu

**Platform:** Edumath · K–12 matematik dersleri ve çalışma  

**Canlı site:** [https://edumath-client.onrender.com](https://edumath-client.onrender.com)  
**Öğrenci tanıtım sayfası:** [/students](https://edumath-client.onrender.com/students) → «Öğrenci paneline gir»  
**Panel adresi (giriş sonrası):** `/student/home`

> İlk açılış biraz yavaş olabilir; «Yükleniyor…» görürsen 15–20 saniye bekleyip sayfayı yenile.

Bu kılavuz, öğrenci panelindeki her bölümü sade bir dille anlatır. Takıldığın yerde öğretmenine veya okul yöneticine sorabilirsin.

---

## 1. Edumath senin için ne?

Edumath ile:

- **Derslerini** ve konularını takip edersin
- **Sınav** ve **quiz** çözersin; sonuç çoğu zaman **hemen** gelir
- **Ödev** teslim tarihlerini görürsün
- **Çalışma Merkezi**’nde zayıf kaldığın konulara tekrar yaparsın
- **Mesaj** ve **anket** ile sınıf iletişimine katılırsın

Sistem seni otomatik puanlar; öğretmen hangi sınavın ne zaman açık olduğuna karar verir.

---

## 2. İlk giriş

1. [edumath-client.onrender.com](https://edumath-client.onrender.com) **veya** [/students](https://edumath-client.onrender.com/students) sayfasına git; «Öğrenci paneline gir»e tıkla.
2. **Giriş yap** ile okulunun verdiği e-posta ve şifreyi gir.
3. Seni **Öğrenci paneline** (`/student/home`) yönlendirir.

**İlk kez mi?** Kayıt linki okuluna göre değişir; hesabın yoksa öğretmenine veya admin’e başvur.

**Şifreni mi unuttun?** Giriş ekranındaki «Şifremi unuttum» veya öğretmen / admin şifre sıfırlama.

---

## 3. Menü haritası

| Menü | Ne yaparsın? |
|------|----------------|
| **Ana Sayfa** | Günlük özet, son dersler, zayıf konu kartı |
| **Derslerim** | Sınıfına uygun konu listesi |
| **Ödevler** | Bekleyen ve tamamlanan ödevler |
| **Çalışma Merkezi** | Quiz, tekrar, kişisel öneriler |
| **Sınavlar** | Öğretmenin açtığı sınavlar |
| **Takvim** | Teslim tarihleri ve etkinlikler |
| **Profil menüsü → Mesajlar** | Öğretmen / sınıf mesajları |
| **Profil menüsü → Anketler** | Anketleri doldurma |
| **Ayarlar / Profil** | Şifre, dil, karanlık mod |

---

## 4. Ana Sayfa

**Menü:** Ana Sayfa

Burada görebileceklerin:

- **Son kaldığın ders** veya hızlı devam kartları
- **İlerleme özeti** (motivasyon için)
- **Geliştirmen gereken konular** kartı — sınav ve çalışmalarına göre sistem öneri sunar

> Asıl ders içeriği **Derslerim** ve **Sınavlar** sayfalarındadır; ana sayfa bir « kontrol paneli » gibidir.

---

## 5. Derslerim

**Menü:** Derslerim

1. Sınıfına uygun **matematik konuları** listelenir (örüntü konuları ayrı bölümde olabilir).
2. Üstte **arama** kutusu ile konu arayabilirsin.
3. Konu kartına tıklayınca **Çalışma Merkezi**’ne yönlendirilirsin — oradan quiz ve tekrara geçersin.

**Konu yok mu?** Öğretmen henüz «Konu & ders yapısı» ekranından eklemediyse liste boş kalır. Öğretmenine haber ver.

**İlerleme çubuğu:** Tamamladığın konular yeşile yakın; devam edenler kısmen dolu görünür.

---

## 6. Sınavlar

**Menü:** Sınavlar

### 6.1 Sınava girme

1. Listede **aktif** sınavları görürsün (tarih ve süre öğretmen tarafından ayarlanır).
2. Sınava tıkla — **süre sayacı** başlar.
3. Soruları cevapla:
   - Çoktan seçmeli: bir şık işaretle
   - Doğru/yanlış
   - Boşluk doldurma: kutuya yaz
   - Eşleştirme: çiftleri eşle
   - Sıralama: adımları doğru sıraya koy
4. Bitince **Gönder / Teslim et** — genelde **bir kez** gönderebilirsin.

### 6.2 Süre ve bağlantı

- Sayacı **üst köşeden** takip et.
- İnternet koparsa panik yapma; önce sürenin dolup dolmadığına bak, sonra gerekirse sayfayı yenile (öğretmenin sınav ayarına bağlı).

### 6.3 Sonuç

- Teslimden sonra **puan** ve doğru/yanlış özeti görünür (öğretmen ayarına göre).
- Yanlış yaptığın konular **Çalışma Merkezi** önerilerine yansıyabilir.

---

## 7. Çalışma Merkezi

**Menü:** Çalışma Merkezi

Formatif çalışma alanın — sınav baskısı olmadan tekrar.

### 7.1 Zayıf konu kartı

Üstte **«Geliştirmen gereken konular»** bölümü:

- Sistem sınav, egzersiz ve quiz verilerini birleştirir.
- Henüz yeterli verin yoksa sınıfına uygun **başlangıç önerileri** listelenir.
- Bir konunun yanında **Önerilen alıştırma** veya **Başla** varsa tıkla.

### 7.2 Çalışma türleri

| Kart | Durum |
|------|--------|
| **Quiz Çöz** | Aktif — Sınavlar / quiz akışına gider |
| **Flashcard** | Yakında |
| **Eğitsel Oyunlar** | Yakında |

### 7.3 Ders quizleri

Öğretmenin eklediği **ders (lesson)** için quiz:

- Konu ağacından veya öğretmenin verdiği linkten `/student/lesson/...` adresine gidebilirsin.
- Quiz bitince **XP** ve doğru/yanlış sayın öğretmen panelinde görünür.

---

## 8. Ödevler

**Menü:** Ödevler

1. **Hepsi / Bekleyenler / Tamamlanan** sekmeleri ile filtrele.
2. Her ödev kartında **son teslim tarihi** yazar; yaklaşanlar vurgulanır.
3. **Detaylar** ile açıklamayı oku; teslim yöntemi öğretmenin belirlediği gibidir (platform içi veya sınıfta).

Ödevleri erken bitirmek ana sayfadaki «yaklaşan görev» uyarılarını azaltır.

---

## 9. Takvim

**Menü:** Takvim

- Sınav, ödev ve etkinlik tarihlerini **ay görünümünde** takip et.
- Yoğun haftaları önceden görüp plan yap.

---

## 10. Mesajlar

**Profil menüsü → Mesajlar**

- Öğretmeninden veya sınıftan gelen duyuruları oku.
- **Okunmamış** mesajlar vurgulanır; düzenli kontrol et.

---

## 11. Anketler

**Profil menüsü → Anketler**

- Öğretmenin gönderdiği anketleri doldur.
- Süresi dolmadan gönder; genelde bir kez yanıtlanır.

---

## 12. Profil ve ayarlar

### Profil

- Adın, e-postan, sınıf bilgin (varsa)
- Fotoğraf veya ek alanlar okul ayarına bağlı

### Ayarlar

- **Şifre değiştir**
- **Dil:** Türkçe veya İngilizce
- **Karanlık mod** — gece çalışırken göz yormaz

---

## 13. Sınavda soru tipleri — kısa rehber

| Tip | Ne yapmalısın? |
|-----|----------------|
| Çoktan seçmeli | Tek doğru şıkkı işaretle |
| Doğru / Yanlış | Doğru veya yanlış seç |
| Boşluk doldurma | Eksik sayı veya kelimeyi yaz |
| Eşleştirme | Sol ve sağ öğeleri doğru eşle |
| Sıralama | Çözüm adımlarını sürükleyerek sırala |

Eşleştirme ve sıralamada **tam doğru** yapman gerekir; kısmi puan olmayabilir.

---

## 14. Sık sorulan sorular

**Puanım neden hemen çıkmadı?**  
Öğretmen sonuçları geciktirmiş olabilir veya sınav hâlâ açıktır.

**«Zayıf konu» ne demek?**  
Bir konuda başarı oranın düşük ve yeterince deneme yaptıysan sistem o konuyu tekrar önerir. Kötü hissetme — tekrar için fırsat.

**Aynı sınavı iki kez çözebilir miyim?**  
Çoğu sınavda **hayır**; egzersizlerde tekrar olabilir.

**Telefondan kullanabilir miyim?**  
Evet; menü mobilde hamburger simgesiyle açılır. Yine de uzun sınav için bilgisayar daha rahattır.

**Site yavaş açılıyor**  
Sunucu uyanıyor olabilir; 10–20 saniye bekle, tekrar dene.

**Hesabım yanlış sınıfta**  
Profil veya öğretmenine yaz; admin düzeltir.

---

## 15. İyi çalışma alışkanlıkları

1. **Her gün kısa tekrar** — Çalışma Merkezi’nden 10–15 dakika.
2. **Sınavdan önce** — Derslerim’de ilgili konuyu gözden geçir.
3. **Sınav sırasında** — Önce kolay sorular, sayaca dikkat.
4. **Sınavdan sonra** — Yanlışları not al; önerilen alıştırmayı dene.
5. **Ödevleri son güne bırakma** — Takvim’i haftalık kontrol et.

---

## 16. Yardım

- **Teknik sorun:** Öğretmenin veya okul IT sorumlusuna yaz.
- **Ders içeriği:** Sınıf öğretmenine sor.
- **Şifre / giriş:** Admin veya «Şifremi unuttum» akışı.

---

*Edumath Öğrenci Kılavuzu · Platform sürümü ile uyumlu · Matematik pedagojisi: Emre İncekalan · Yazılım: Bahri KOÇ*
