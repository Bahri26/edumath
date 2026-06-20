# Edumath — Öğretmen Kullanım Kılavuzu

**Platform:** Edumath · K–12 matematik ölçme ve değerlendirme  

**Canlı site:** [https://edumath-client.onrender.com](https://edumath-client.onrender.com)  
**Öğretmen tanıtım sayfası:** [/teachers](https://edumath-client.onrender.com/teachers) → «Öğretmen paneline gir»  
**Panel adresi (giriş sonrası):** `/teacher/overview`

> İlk açılış 10–30 saniye sürebilir (ücretsiz sunucu uyanıyor). Sayfa boş kalırsa bir kez yenileyin.

Bu kılavuz, öğretmen panelindeki her bölümü adım adım anlatır. Teknik terimler mümkün olduğunca sade tutulmuştur.

---

## 1. Edumath sizin için ne yapar?

Edumath ile tek yerden şunları yönetebilirsiniz:

- **Soru bankası** — kendi sorularınız + onaylı branş havuzu
- **Sınav** — hızlı otomatik sınav veya 7-7-7 stüdyo ile özel dağılım
- **Egzersiz** — formatif alıştırma paketleri (sınıf + konu + soru tipi)
- **Konu ve ders yapısı** — öğrencinin gördüğü konu ağacı
- **Öğrenci ilerleme ve raporlar** — kim nerede zorlanıyor?

Sistem soruları **otomatik puanlar**; siz üretim ve yayın aşamasında **son sözü söylersiniz**.

---

## 2. İlk giriş ve branş onayı

### 2.1 Giriş

1. [edumath-client.onrender.com](https://edumath-client.onrender.com) adresine gidin **veya** [/teachers](https://edumath-client.onrender.com/teachers) sayfasından «Öğretmen paneline gir»e tıklayın.
2. **Giriş yap** penceresinde e-posta ve şifrenizi girin.
3. Sistem sizi **Öğretmen paneline** (`/teacher/overview`) yönlendirir.

### 2.2 Branş onayı (önemli)

Birçok özellik — soru üretimi, akıllı yapıştır, hızlı sınav, branş havuzu — **branş onayı** olmadan kapalı kalır.

**Ne yapmalısınız?**

1. Sol alttaki **Profil** menüsüne gidin.
2. **Branşınızı** seçin (ör. Matematik).
3. Talebi gönderin; **admin** onaylayana kadar sarı uyarı bandı görürsünüz.
4. Onay gelince Soru Bankası ve Sınavlar tam açılır.

> **İpucu:** Onay beklerken profil ve ayarları düzenleyebilirsiniz; soru ekleyemezsiniz.

---

## 3. Menü haritası

| Menü | Ne işe yarar? |
|------|----------------|
| **Ana Sayfa** | Özet istatistik, son aktiviteler, hızlı kısayollar |
| **Soru Bankası** | Soru ekleme, filtreleme, AI üretim, akıllı yapıştır |
| **Sınavlar** | Sınav listesi, hızlı sınav, 7-7-7 stüdyo |
| **Egzersizler** | Alıştırma paketi oluşturma |
| **Konu & ders yapısı** | Sınıfa göre konu ve ders (quiz) düzenleme |
| **Öğrenci İlerleme** | Öğrenci bazlı doğru/yanlış, XP |
| **Raporlar** | Sınıf ortalaması, katılım, ipucu istekleri |
| **Profil menüsü → Anketler** | Anket oluşturma / yanıtlama |
| **Ayarlar / Profil** | Şifre, dil, tema, branş |

Panel içinde **? / Kılavuz** düğmesi varsa kısa hatırlatmalar orada da bulunur.

---

## 4. Soru Bankası

**Menü:** Soru Bankası

### 4.1 Listeyi daraltma

Üstteki filtreler:

- **Branş** (onay sonrası sabitlenir)
- **Sınıf** (1.–12. Sınıf)
- **Zorluk** (Kolay / Orta / Zor)
- **Konu** — matematikte özellikle **Örüntüler** alt başlıkları:
  - Geometrik (şekil)
  - Sayı (sabit adım)
  - Sayı (karma kural)
  - Kare sayılar
  - Üçgensel sayılar
  - Eşleştirme
  - Çözüm adımları (sıralama)

Metin kutusuna anahtar kelime yazarak arama yapabilirsiniz.

### 4.2 Soru kartını inceleme

- Karta tıklayınca **genişler**: görsel, şıklar, doğru cevap, kazanım metni, çözüm.
- **Düzenle** ve **Sil** simgeleri kartın sağındadır.
- Formüllü metinler **LaTeX** ile gösterilir; genişletmeden kontrol edin.

### 4.3 Elle soru ekleme

1. **+ Yeni Soru** (branş onayı gerekir).
2. Soru metni, şıklar, doğru cevap, sınıf, zorluk, konu doldurun.
3. Madde tipi seçin:
   - Çoktan seçmeli
   - Doğru / Yanlış
   - Boşluk doldurma
   - Eşleştirme
   - Sıralama
4. **Kaydet** — soru bankanıza eklenir.

### 4.4 AI ile Üret

1. **AI ile Üret** düğmesine tıklayın.
2. Sınıf, konu ve zorluk seçin.
3. Sistem **havuzdaki onaylı sorulardan esinlenerek** yeni madde üretir; sayılar değişir, birebir kopya olmaz.
4. **Önizleyin** — beğenmediyseniz yeniden üretin veya düzenleyin.
5. **Onaylayıp kaydedin** — onaysız soru öğrenciye gitmez.

> AI burada kapalı bir ChatGPT kutusu değildir; kurallı, denetlenebilir yerel üretim hattı kullanılır.

### 4.5 Akıllı Yapıştır (Smart Paste)

Kağıt, PDF veya ekran görüntüsündeki soruyu dijitalleştirmek için:

1. **Akıllı Yapıştır**’a tıklayın.
2. Görsel yükleyin **veya** metni yapıştırın (Ctrl+V).
3. Sistem metni okur; soru alanlarını doldurur.
4. **Siz kontrol edip düzeltin**, sonra kaydedin.

Otomatik kayıt yoktur — her madde sizin onayınızla bankaya girer.

---

## 5. Sınavlar

**Menü:** Sınavlar

### 5.1 Sınav listesi

- Tüm sınavlarınız listelenir.
- **Arama** ve **sınıf filtresi** kullanın.
- Bir sınavı açınca **sonuçlar** sekmesinden öğrenci girişlerini izleyebilirsiniz.

### 5.2 Hızlı sınav (otomatik)

Branş onayı gerekir. Sağ üst kartta:

1. **Başlangıç** ve **bitiş** tarih/saat
2. **Süre** (dakika)
3. **Sınıf** ve soru sayısı
4. **Hızlı sınav** düğmesi

Sistem havuzdan uygun soruları seçerek taslak sınav oluşturur. Yayınlamadan önce başlık ve zamanları kontrol edin.

### 5.3 7-7-7 Stüdyo (özel dağılım)

Kolay / Orta / Zor için **her birinden en fazla 7 soru** (toplam 21):

1. Stüdyo moduna girin.
2. Sol havuzdan soruyu **sürükleyip bırakın** veya **tıklayarak** ilgili zorluk sütununa ekleyin.
3. Kutular dolunca sınav metnini kaydedin ve yayınlayın.

Bu yöntem LGS benzeri denge isteyen sınavlar için uygundur.

### 5.4 Öğrenci tarafında ne olur?

- Öğrenci **Sınavlar** menüsünden aktif sınavı görür.
- Süre sayacı işler; genelde **tek teslim** hakkı vardır.
- Teslim sonrası puan **anında** hesaplanır (yapılandırılmış soru tipleri).

---

## 6. Egzersizler (formatif çalışma)

**Menü:** Egzersizler

Egzersiz = öğrencinin tekrar edebileceği **alıştırma paketi**. Sınavdan farkı: baskı az, tekrar ve öğrenme odaklı.

### 6.1 Yeni egzersiz — üç adım

**Adım 1 — Oluşturma yöntemi**

| Seçenek | Açıklama |
|---------|----------|
| **AI ile oluştur** | Sınıf + konu + soru tipine göre havuzdan en fazla **15** soru otomatik seçilir |
| **Manuel seç** | Havuzdan tıklayarak ekleyin; en fazla **30** soru |

**Adım 2 — Sınıf ve konu**

- Sınıf (ör. 5. Sınıf)
- Ders (Matematik)
- Konu (ör. Örüntüler — Sayı sabit adım)

**Adım 3 — Soru çeşidi**

En az bir tip işaretleyin: çoktan seçmeli, doğru/yanlış, boşluk, eşleştirme, sıralama.

Paket adı ve kısa açıklama yazıp **Oluştur**’a basın.

### 6.2 Mevcut egzersizi yönetme

- **Göz (önizle)** — paketteki soruları görün
- **Liste (soruları düzenle)** — soru ekle/çıkar
- **Sil** — paketi kaldırın

Liste üstünden **sınıf filtresi** ile eski paketlerinizi bulabilirsiniz.

---

## 7. Konu ve ders yapısı

**Menü:** Konu & ders yapısı

Öğrencinin **Derslerim** sayfasında gördüğü ağacı siz kurarsınız.

1. **Sınıf** ve **ders** seçin.
2. **Konu ekleyin** (ör. Örüntüler — Kare sayılar).
3. Konuya **ders (lesson)** bağlayın — her ders bir mini quiz olabilir.
4. **Yukarı / aşağı** ile sırayı değiştirin; öğrenci ekranı aynı sırayı görür.

> **Dikkat:** Bir dersi silerseniz o derse ait öğrenci quiz ilerlemesi de silinir. Silmeden önce onaylayın.

---

## 8. Öğrenci İlerleme

**Menü:** Öğrenci İlerleme

1. Sınıf listesinden **öğrenci seçin**.
2. Ders bazında **doğru / yanlış** ve **XP** özetini görün.
3. Belirli bir öğrenciyi paylaşmak için adres çubuğundaki `?student=...` linkini kullanabilirsiniz.

Bu ekran formatif geri bildirim için kullanılır: hangi konuda müdahale gerektiğini gösterir.

---

## 9. Raporlar

**Menü:** Raporlar

- **Dönem** seçerek sınıf ortalaması, katılım oranı ve günlük trend grafiğini görün.
- **İpucu istekleri** — öğrenciler hangi soruda «İpucu al» dedi; zayıf nokta analizi için kullanın.
- **Yazdır / PDF** — tarayıcı yazdırma ile raporu kaydedin.

Veriler canlı API’den gelir; sınav ve egzersiz aktivitesi arttıkça grafikler anlamlılaşır.

---

## 10. Kalıp şablonları (isteğe bağlı)

**Adres:** `/teacher/pattern-builder` (doğrudan URL veya ana sayfa kısayolu)

Örüntü soruları için **SVG şablon** üretimi ve test. İleri düzey kullanım içindir; günlük iş için Soru Bankası yeterlidir.

---

## 11. Anketler, profil ve ayarlar

### Anketler

Profil menüsü → **Anketler** — sınıfa anket gönderme ve sonuçları görme.

### Profil

- Ad, e-posta
- **Branş talebi** ve onay durumu
- Sınıf / okul bilgileri (varsa)

### Ayarlar

- Şifre değiştirme
- **Dil** (Türkçe / İngilizce)
- **Açık / koyu tema**

---

## 12. Sık sorulan sorular

**Soru onaylamadan öğrenci görür mü?**  
Hayır. AI veya akıllı yapıştır sonrası kaydetmeden önce siz onaylarsınız.

**Branş onayı ne kadar sürer?**  
Admin panelinden yapılır; bekleme süresi okul/kurumunuza bağlıdır.

**Öğrenci sınavı yarıda bırakırsa?**  
Süre dolunca veya teslim edilmemişse sonuç oluşmayabilir; sınav ayarlarınızı kontrol edin.

**Egzersiz ile sınav farkı?**  
Sınav: not / ölçme. Egzersiz: tekrar, formatif çalışma; genelde baskı daha düşük.

**Matematik dışı branş?**  
Veritabanında tanımlı olabilir; tez kapsamında içerik derinliği **matematik örüntü** hattındadır.

**İlk açılış yavaş mı?**  
Ücretsiz sunucu (Render) bazen «uyuyor»; birkaç saniye bekleyip sayfayı yenileyin.

---

## 13. Önerilen günlük akış

1. **Sabah:** Ana sayfadan dünkü aktiviteye bakın.
2. **Hazırlık:** Soru Bankası’ndan 2–3 yeni madde (AI veya elle).
3. **Uygulama:** Egzersiz paketi veya sınav yayınlayın.
4. **Takip:** Öğrenci İlerleme + Raporlar — zayıf konuya göre ertesi ders planı.

---

*Edumath Öğretmen Kılavuzu · Platform sürümü ile uyumlu · Matematik pedagojisi: Emre İncekalan · Yazılım: Bahri KOÇ*
