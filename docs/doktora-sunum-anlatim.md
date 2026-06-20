# DOKTORA TEZ SAVUNMASI — ANLATIM METNİ

**Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi**

| | |
|---|---|
| **Tez araştırmacısı** | Emre İncekalan (2531745000) |
| **Matematik eğitimi** | Emre İncekalan — kuram, MEB müfredatı, örüntü kazanımları, ölçme-değerlendirme modeli |
| **Yazılım geliştirme** | Bahri KOÇ — Edumath platform mimarisi, modüller, teknik uygulama |
| **Kurum** | Anadolu Üniversitesi · Lisansüstü Eğitim Enstitüsü · Matematik Eğitimi |
| **Danışman** | Prof. Dr. Hüseyin Bahadır Yanık |
| **Artefakt** | Edumath — https://github.com/Bahri26/edumath |

---

## Bu belge ne işe yarar?

Bu metin, doktora tez savunmanızda **jüriye anlatırken** yanınızda tutacağınız tam anlatımdır. İki alan **farklı yazarlar** tarafından hazırlanmıştır:

| Alan | Yazar | İçerik |
|------|--------|--------|
| **Matematik eğitimi** | **Emre İncekalan** | MEB müfredatı, örüntü kazanımları, sınıf düzeyi, formüller, ölçme döngüsü |
| **Yazılım / Edumath** | **Bahri KOÇ** | Mimari, modüller, soru üretimi, puanlama, analitik, paneller |

Sunumu **Emre İncekalan** yapar; platform yazılımı **Bahri KOÇ** tarafından geliştirilmiştir. Matematik pedagojisi ve tez kuramı Emre İncekalan’a aittir.

Bu metin, doktora tez savunmanızda **jüriye anlatırken** yanınızda tutacağınız **tam referans anlatımıdır**. Slayt slayt konuşma metni içermez; bunun yerine matematik, yöntem ve yazılım **derinlemesine** açıklanır. Projeksiyonda **`sunum-juri.pdf`** (23 slayt) açık kalır; konuşma metinleri **`edumath-sunum.md` Bölüm II** altındaki KONUŞMA bloklarındadır.

**PDF üretimi:** `python scripts/md_to_pdf.py docs/doktora-sunum-anlatim.md`  
**Yazı tipi:** Times New Roman, 12 punto (PDF çıktısı)

---

# BÖLÜM A — GİRİŞ VE PROBLEM (Slayt 1–7)

## A.1 Açılış (Slayt 1)

Sayın jüri başkanı, sayın jüri üyeleri, değerli dinleyiciler.

Ben Emre İncekalan. Anadolu Üniversitesi Matematik Eğitimi doktora programında, danışmanım Prof. Dr. Hüseyin Bahadır Yanık ile yürüttüğüm tez kapsamında **Edumath** platformunu bugün sizlere sunuyorum. Platformun **yazılımını Bahri KOÇ** geliştirmiştir; **matematik eğitimi kuramı, MEB müfredat eşlemesi ve ölçme-değerlendirme modeli** benim tez çalışmamdır.

Tezimin başlığı: *Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi*. Kısaca: ilkokuldan liseye matematik derslerinde ölçme ve değerlendirme sürecini — soru hazırlamadan puanlamaya, öğrencinin zayıf kaldığı konuyu bulmaya kadar — tek bir dijital sistemde birleştirmeyi ve bunu şeffaf kurallarla yapmayı hedefledim.

## A.2 Sunum planı (Slayt 2)

Sunumu şu sırayla anlatacağım:

- Önce **neden** bu çalışmayı yaptığımı (problem ve amaç)  
- Sonra **nasıl** yaptığımı (bilimsel yöntem ve Edumath tasarımı)  
- Ardından **ne elde ettiğimi** (bugünkü bulgular) ve **nelerin henüz yapılmadığını** (sınırlılıklar)  
- En son platformun **öğretmen ve öğrenci tarafında** nasıl kullanıldığını  

Toplam anlatım yaklaşık yirmi beş–otuz dakika sürecek; ardından sorularınızı yanıtlamaya hazırım.

## A.3 Problem durumu (Slayt 3)

Matematik öğretmenleri çoğu zaman otuz–kırk kişilik sınıflarda ders veriyor. Her öğrencinin hangi konuda zorlandığını tek tek takip etmek, her sınavı elle puanlamak, her öğrenciye kişisel geri bildirim vermek çok zaman alıyor. Geleneksel ölçme-değerlendirme bu yüzden çoğu zaman **gecikmeli** ve **sınıf geneli** odaklı kalıyor.

Son yıllarda yapay zekâ destekli sistemler “hızlı puanlama, otomatik soru üretimi” vaat ediyor. Ancak literatür — özellikle Meylani’nin (2025) derlemesi — şunu gösteriyor: Kapalı kutulara dayanan, içinde ne olduğu belli olmayan algoritmalar öğretmenin güvenini zedeliyor. Öğretmen “Bu puan neden verildi?”, “Bu soru neden üretildi?” diye sorabilmeli.

Edumath’ın temel fikri şu: **Hız ile şeffaflık birlikte olmalı.** Sistem hızlı çalışsın ama kuralları açık olsun, öğretmen son sözü söylesin.

## A.4 Amaç ve araştırma soruları (Slayt 4)

**Tezin amacı:** MEB (2018) Matematik Öğretim Programı ile uyumlu, şeffaf yapay zekâ destekli bir ölçme-değerlendirme platformu tasarlamak ve geliştirmektir.

Dört araştırma sorum var:

| Kod | Soru | Bugünkü durum |
|-----|------|----------------|
| **AS1** | Bütünleşik yapay zekâ platformları ölçmeyi nasıl dönüştürür? | Kuramsal çerçeve + platform tasarımı tamam |
| **AS2** | Otomatik puanlama ve konu profili formatif değerlendirmeye katkı sağlar mı? | Platform hazır; okul pilotu bekliyor |
| **AS3** | Havuz tabanlı üretim ile üretken yapay zekâ (ChatGPT vb.) nasıl ayrışır? | Üretim hattı geliştirildi |
| **AS4** | Pilot sonrası madde analizi (p, r, α) ne gösterir? | **Planlanıyor** — bugün rakam sunmuyorum |

AS4 için etik kurul onayı sonrası okul pilotu yapılacak; madde güçlük ve ayırt edicilik analizleri o aşamada raporlanacak.

## A.5 Kapsam ve evren (Slayt 5)

Burada önemli bir ayrım var:

- **Tez nerede yürütülüyor?** Anadolu Üniversitesi Matematik Eğitimi doktora programında.  
- **Platform kime hizmet ediyor?** Birinci–on ikinci sınıf (K–12) matematik öğretmeni ve öğrencisine. Üniversite sınav sistemi değil.

İçerik derinliği şu an **örüntü** kazanımlarında yoğunlaşıyor. Veritabanında Türkçe, Fen Bilgisi gibi branş alanları tanımlı ama tez kapsamında matematik örüntü hattı detaylandırıldı.

## A.6 Literatürdeki boşluk (Slayt 6)

Literatürde herkes farklı bir parçayı çözmüş: biri otomatik puanlıyor, biri soru üretiyor, biri raporluyor. Ama **madde üretiminden öğrenciye geri bildirime** kadar giden tam zincir az sayıda platformda bir arada.

Edumath bu boşluğu doldurmayı hedefliyor. Üretken yapay zekâ yerine **havuz tabanlı üretim** tercih edildi; çünkü Seven ve Erümit (2024) uzman denetiminin — yani öğretmen onayının — şart olduğunu vurguluyor.

## A.7 Kuramsal çerçeve ve yöntem özeti (Slayt 7)

Teorik olarak üç halka birleşiyor:

1. **Klasik test teorisi (KTT):** Soruların kalitesi — güçlük (p), ayırt edicilik (r), güvenirlik (α). Pilot sonrası uygulanacak.  
2. **Formatif değerlendirme:** Öğrenme sürecinde anlık geri bildirim; sınav sadece not için değil, öğrenme için.  
3. **Öğrenme analitiği:** Veriden öğretmene “hangi konuya müdahale etmeli?” sorusuna cevap.

Bunların hepsi **tasarım tabanlı araştırma (DBR)** ile Edumath platformuna bağlandı. DBR’de siz bir teknoloji ürünü (artefakt) tasarlar, geliştirir, test eder ve pedagojik tartışmayı bu ürün etrafında yürütürsünüz.

---

# BÖLÜM B — BİLİMSEL YÖNTEM (Detaylı)

> **Yazar:** Emre İncekalan — tez araştırma deseni, DBR, karma yöntem, KTT, formatif değerlendirme, etik

## B.1 Tasarım tabanlı araştırma (DBR) nedir?

DBR, eğitim teknolojisi çalışmalarında sık kullanılan bir yöntemdir. Klasik deneysel desen gibi “kontrol grubu–deney grubu” kurmak yerine, **gerçek bir ürünü** geliştirirken aynı anda pedagojik soruları yanıtlarsınız.

Edumath bu üründür. Sorular şunlardır:

- Öğretmen soruyu nasıl üretmeli ve onaylamalı?  
- Sistem nasıl puanlamalı ki tekrarlanabilir olsun?  
- Zayıf konu nasıl hesaplanmalı ki öğretmene anlamlı gelsin?

DBR’de “bulgu” bazen henüz istatistiksel pilot değil; **çalışan, test edilmiş, açıklanabilir bir tasarım çıktısıdır.** Empirik pilot bir sonraki aşamadır.

## B.2 Karma yöntem

Tezde **karma yöntem** kullanılıyor:

| Tür | Ne yapıldı / yapılacak |
|-----|------------------------|
| **Nicel (tamamlanan)** | Teknik doğrulama: puanlama testleri, uçtan uca üretim hattı, 23 frontend test dosyası |
| **Nicel (planlanan)** | Okul pilotu: sınav/egzersiz verileri, p, r, α analizi |
| **Nitel (planlanan)** | Öğretmen görüşmeleri, tema analizi |

Bugün savunmada nicel pilot rakamı sunmuyorum; bu bilinçli bir sınırdır.

## B.3 Klasik test teorisi — kısa sözlük

Jüri sorarsa diye:

- **p (güçlük):** Soruyu kaç kişi doğru yaptı? (0–1 arası)  
- **r (ayırt edicilik):** Üst grupla alt grup arasında soru farkı yaratıyor mu?  
- **α (Cronbach güvenirlik):** Sınavın iç tutarlılığı  

Bunlar platformda otomatik hesaplanmıyor; pilot verisi toplandıktan sonra SPSS veya Python ile analiz edilecek.

## B.4 Formatif değerlendirme ve öğrenme analitiği

**Formatif değerlendirme:** Öğretmen süreç içinde ölçer, hemen geri bildirim verir. Edumath’ta egzersiz modülü ve Study Hub buna hizmet eder.

**Öğrenme analitiği:** Öğrencinin sınav, egzersiz, ödev verileri birleştirilir; hangi konuda zayıf olduğu skorlanır. `priorityScore` hem düşük başarıyı hem yeterli deneme sayısını dikkate alır. 0,55 eşiği “zayıf konu” için tasarım parametresidir; pilot sonrası kalibre edilebilir.

## B.5 Etik

Anadolu Üniversitesi Etik Kurulu izni alınacak. Okul pilotu öncesi veli/okul onayı planlanıyor. Kişisel veriler platformda rol tabanlı erişimle korunuyor (JWT, öğretmen–öğrenci ayrımı).

## B.6 Ölçme-değerlendirme matematik modeli (platformda uygulanan)

Tezde kuramsal çerçeve KTT ile birleşir; platformda şu an **uygulanan** matematiksel modeller aşağıdadır.

### B.6.1 Cevap vektörü ve otomatik puanlama

Yapılandırılmış maddelerde öğrenci cevabı **A** = (a₁, …, aₙ), cevap anahtarı **K** = (k₁, …, kₙ) ile modellenir. Her alt madde için:

**Doğruᵢ = 1** eğer normalize(aᵢ) = normalize(kᵢ); aksi halde **0**.

Sınav yüzdesi: **Puan = round(100 × Σ Doğruᵢ / n)** (`examRoutes.js`).

Eşleştirme ve sıralama tiplerinde tam eşleşme gerekir; kısmi puan yoktur — tekrarlanabilirlik için bilinçli tercihtir.

### B.6.2 Konu profili ve zayıf alan (öğrenme analitiği)

ML servis (`weak_topics.py`) birincil yöntemdir:

| Gösterge | Formül | Anlam |
|----------|--------|-------|
| accuracy | doğru / toplam | Ham başarı |
| mastery | mastery alanı veya accuracy | Konu ustalığı (0–1) |
| volumeNorm | min(1, toplam / max_toplam) | Deneme hacmi |
| distanceFromIdeal | max(0, 1 − mastery) | İdeal ustalıktan uzaklık |
| priorityScore | distance × (0,6 + 0,4 × volumeNorm) | Öncelik sırası |
| isWeak | mastery < 0,55 | Zayıf konu etiketi |

**Eşik:** `ML_WEAK_TOPIC_THRESHOLD = 0,55` (tasarım parametresi; pilot sonrası kalibre edilebilir).

**Yedek yol:** ML kapalıysa `studentAnalyticsService.js` üç boyutlu vektör kullanır: [accuracy, zaman verimi, deneme hacmi]; Öklid mesafesi ile priorityScore hesaplanır.

**Soğuk başlatma:** Öğrencide veri yoksa sınıf müfredatından 6 konu önerilir; priorityScore = 0,85 − indeks×0,05.

### B.6.3 KTT göstergeleri (planlanan — kodda yok)

p, r ve α platformda **otomatik hesaplanmaz**. Okul pilotu sonrası SPSS veya Python ile analiz edilecek; sonuçlar AS4’e yanıt verecek.

---

# BÖLÜM C — MATEMATİK EĞİTİMİ, MEB VE MÜFREDAT (Slayt 8–9)

> **Yazar:** Emre İncekalan — matematik eğitimi, MEB (2018) uyumu, örüntü kazanımları, pedagojik ölçme döngüsü

## C.1 Neden örüntü?

MEB Matematik Öğretim Programı (2018) örüntüyü erken sınıflardan itibaren vurgular. Örüntü, öğrencinin:

- Sayılar arası **ilişki** kurmasını,
- **Genelleme** yapmasını,
- İlerleyen sınıflarda **cebir**e geçiş için zemin hazırlamasını

sağlar. Radford (2008) ve Stacey (1989) bu geçişi matematik eğitimi literatüründe temel gösterir.

Edumath’ta ölçme içeriğinin kalbi **örüntü oluşturma ve analiz etme** kazanım ailesidir. Yedi alt kategori MEB hattına göre kodlandı; her birinin kazanım metni, formülü, soru şablonu veya çözücüsü yazılımda tanımlıdır.

## C.2 MEB (2018) ile uyum

Platformdaki konu etiketleri `backend/constants/patternTopics.js` dosyasından gelir. Kod içinde referans: **MEB Matematik Öğretim Programı (2018)**.

Her alt konunun **kazanım metni** (LEARNING_OUTCOME_BY_LABEL) tanımlıdır:

| Kod | Etiket | Kazanım (özet) |
|-----|--------|----------------|
| GEOMETRIC | Geometrik (şekil) | Tekrar eden şekil örüntüsü, sonraki eleman |
| ARITHMETIC | Sayı (sabit adım) | Sabit artış, eksik terim |
| RULE | Sayı (karma kural) | Ardışık farklı işlemlerden kural |
| SQUARES | Kare sayılar | Kare sayı dizisi |
| TRIANGULAR | Üçgensel sayılar | Üçgensel sayı düzeni |
| MATCHING | Sınıflama (eşleştirme) | Tür sınıflama + eşleştirme |
| SEQUENCE | Çözüm adımları (sıralama) | İşlem sırası kurma |

Bu, “rastgele soru” değil **müfredatla hizalı ölçme** demektir.

## C.3 Sınıf 1–12 müfredat eşlemesi

Kaynak: `frontend/src/data/curriculumData.js` + üretim filtreleri.

| Sınıf | Kademe | Örüntü odağı | Örnek alt konular |
|-------|--------|--------------|-------------------|
| 1 | İlkokul başlangıç | Nesne/şekil örüntüsü | Renk örüntüleri, geometrik dizilim |
| 2 | İlkokul temel | Artan/azalan | Ritmik sayma, şekil–sayı ilişkisi |
| 3 | İlkokul orta | Kural keşfi | İki adımlı kurallar, tablo |
| 4 | İlkokul ileri | Matematiksel ilişki | En çok iki işlemli diziler |
| 5 | Ortaokul giriş | Aritmetik dizi | Sabit fark, adım–sayı tablosu |
| 6 | Ortaokul temel | Cebirsel ifade | Genel terim (n), harfle kural |
| 7 | Ortaokul orta | Doğrusal ilişki | Koordinat, değişim oranı |
| 8 | Ortaokul LGS | Sayı dizileri | Karesel/üçgensel, yeni nesil |
| 9 | Lise mantık | Fonksiyonel modelleme | Veri analizi, tahmin |
| 10 | Lise dizi | Aritmetik/geometrik | Terim ilişkileri |
| 11 | Lise AYT | Diziler ve seriler | Genel terim, toplam (Σ) |
| 12 | Lise ileri | Limit, sonsuz diziler | Fibonacci, fraktal |

**Pedagojik koruma:** `gradeAwareQuestionTemplates.js` ve `question_generate.py` içindeki `isSampleTooAdvancedForGrade` fonksiyonu, havuz örneğinin sınıfa uygunluğunu denetler. Dördüncü sınıfa cebir sembolü, cm/çevre, genel terim içeren soru **üretilmez**.

## C.4 Yedi alt kategori — matematiksel çekirdek (detaylı)

Kaynak: `patternTemplateService.js` (SVG şablon), `question_generate.py` (ML üretim), `question_solver.py` (doğrulama).

### C.4.1 Geometrik (şekil) — `repeat`

**Matematik:** Periyodik dizilim C = (e₁, e₂, …, eₖ); elemanlar döngüyle tekrarlanır.

**Örnek:** △ → □ → ○ → △ → □ → ? → cevap **○**

**Zorluk:** Kolay/Orta 2 elemanlı döngü (circle, square); Zor 3 elemanlı (circle, square, triangle).

**Sınıf bandı:** 1–4 · **Kod:** `repeat`

### C.4.2 Sayı (sabit adım) — aritmetik dizi — `arithmetic`

**Formül:** **aₙ = a₁ + (n − 1) · d**

**Üretim parametreleri:** Kolay d=2, Orta d=4, Zor d=7.

**Örnek:** 3, 7, 11, 15, ?, 23 → d = 4 → eksik terim **19**

**6. terim örneği:** 5, 9, 13, 17, … → 5 + 4×5 = **25**

**Sınıf bandı:** 3–8

### C.4.3 Sayı (karma kural) — `two_step`

**Kural:** Ardışık iki işlem — çift adımda +a, tek adımda −b (veya tersi).

**Parametreler:** Kolay a=2,b=1 · Orta a=3,b=2 · Zor a=5,b=4.

**Örnek:** 5, 8, 6, 9, 7, ? → +3/−2 → cevap **10**

**Sınıf bandı:** 5–9

### C.4.4 Kare sayılar — `square_numbers`

**Formül:** **aₙ = n²**

**Dizi:** 1, 4, 9, 16, 25, …

**Görselleştirme:** SVG nokta ızgarası (kare sayı kadar nokta).

**Örnek:** 4, 9, 16, ? → **25** = 5²

**Sınıf bandı:** 6–10

### C.4.5 Üçgensel sayılar — `triangular_numbers`

**Formül:** **Tₙ = n(n + 1) / 2**

**Dizi:** 1, 3, 6, 10, 15, 21, …

**Örnek:** 1, 3, 6, 10, ? → T₅ = 5×6/2 = **15**

**Sınıf bandı:** 7–12

### C.4.6 Eşleştirme — `interactive_matching`

**Görev:** Örüntü türü sınıflandırması.

| Dizi | Tür |
|------|-----|
| 2, 4, 2, 4, … | Tekrarlayan |
| 5, 9, 13, … | Sabit artan (+4) |
| 1, 4, 9, 16, … | Kare |

**Puanlama:** Tüm çiftler doğru olmalı.

**Sınıf bandı:** 4–9

### C.4.7 Sıralama — `interactive_sequence`

**Görev:** Problem çözme adımlarını doğru sıraya koyma.

**Doğru sıra (Orta):** Fark kontrol → Kural yaz → Tahmin → Doğrula

**Zorluk varyasyonu:** Kolay’da kural önce; Zor’da tahmin kuraldan önce gelir.

**Sınıf bandı:** 5–10

## C.5 İleri düzey şablonlar (ML üretim hattı)

Havuz örneği yoksa veya varyasyon üretilemezse `question_generate.py` devreye girer.

### C.5.1 Altıgen sayı örüntüsü (`hexagon`)

**Kural:** n. adımdaki altıgen sayısı = **2n**

**Örnek:** 3. adım → 3 × 2 = **6** altıgen · **Çözücü:** `hexagon-count`

### C.5.2 Eşkenar üçgen çevre (`triangle_perimeter`)

**Bağlam:** Kenar uzunluğu s cm olan eşkenar üçgenler yan yana.

**Formül (birincil):** Çevre = **4n + 4s** (n = adım, s = kenar cm)

**Alternatif:** **2s(n + 2)** — çözücü her iki modeli dener.

**Örnek:** s=3 cm, n=4 → 4×4 + 4×3 = **28 cm**

**Sınıf filtresi:** 4. sınıf ve altında üretilmez.

### C.5.3 Cebirsel kural (`algebraic_rule`)

**Bağlam:** Birim küp sayıları: 1. adım 2, 2. adım 4, 3. adım 6.

**Doğru kural:** **2x**, **3x**, **4x** (x = adım)

**Çözücü:** Şıklardaki doğrusal formülleri (ax+b) gözlem dizisiyle eşleştirir; en düşük hata kazanır.

**Sınıf filtresi:** ≤6. sınıfta aritmetik şablona düşer; ≤4. sınıfta engellenir.

### C.5.4 İlkokul şablonları (`elementary`)

| Alt tip | Matematik | Örnek |
|---------|-----------|-------|
| Tekrar (repeat) | Periyodik sayı/nesne | 2, 4, 2, 4, … → **4** |
| Artan (increasing) | +2 veya +5 | 4, 6, 8, 10, … → **12** |
| Azalan (decreasing) | Her adım −2 | 14, 12, 10, 8, … → **6** |

**Bağlam temaları (8 adet):** boncuk, kutu, mozaik, kitap, kare fayans, top, çiçek, blok — aynı matematiksel kural farklı gerçek hayat bağlamında sunulur (transfer becerisi).

## C.6 Sınıf düzeyi içerik filtresi

| Sınıf | Engellenen içerik |
|-------|-------------------|
| ≤ 4 | Cebir (2x), cm/çevre, üçgen/altıgen, genel terim, azalan örüntü, semboller (▲●◆) |
| ≤ 6 | Cebirsel ifade → aritmetik şablona yönlendirilir |
| ≤ 8 | `algebraic_rule` → `arithmetic` dönüşümü |
| > 8 | Tam şablon seti |

Filtre hem **üretim** (`resolveTemplateKind`) hem **havuz seçimi** (`filterPoolSamplesForGeneration`) aşamasında uygulanır.

## C.7 Yerel çözücü algoritmaları

Kaynak: `question_solver.py` — sinir ağı yok; deterministik.

| Çözücü | Tetikleyici | Hesaplama |
|--------|-------------|-----------|
| `hexagon-count` | “altıgen” + “n. adım” | predicted = adım × 2 |
| `triangle-perimeter` | eşkenar üçgen + çevre + s cm | 4n+4s veya 2s(n+2) |
| `algebraic-rule` | kural/örüntü + şıklarda ax+b | En düşük hata toplamı; err≤1 kabul |
| `arithmetic-sequence` | ≥3 sayılı şık, sabit fark | a₁ + d(n−1); d = ortalama fark |

**Havuz varyasyonunda rol:** Sayılar `_replace_numbers` ile değiştirildiğinde (ölçek 0,85–1,25) çözücü yeni doğru cevabı yeniden hesaplar — kopya olmayan madde + tutarlı anahtar.

## C.8 Sınıf düzeyine göre örnek madde seti

**1.–2. sınıf:** Kırmızı-mavi tekrar → Mavi; 2, 4, 6, 8, ? → 10 (+2)

**3.–4. sınıf:** 5, 10, 15, 20, ? → 25 (+5); daire–kare SVG tekrarı

**5.–6. sınıf:** 7, 11, 15, 19, ? → 23 (+4); 8, 11, 9, 12, 10, ? → 13 (+3/−2)

**7.–8. sınıf:** 9, 16, 25, ? → 36; 3, 6, 10, 15, ? → 21

**9.–12. sınıf:** Adımlar 3, 6, 9 → kural **3x**; s=4 cm, 5. adım çevre → 36 cm

## C.9 Ölçme döngüsü — pedagojik anlam

Edumath’ta ölçme şu döngüyle işler:

1. **Madde üret veya seç** — Soru bankası, havuz tabanlı üretim, Smart Paste
2. **Uygula** — Sınav, egzersiz, ders quiz
3. **Puanla** — Otomatik, kural tabanlı (Doğru vektörü)
4. **Analiz et** — Konu profili, zayıf alan, priorityScore
5. **Müdahale et** — Study Hub tekrarı, öğretmen raporu

Bu döngü formatif değerlendirme için tasarlandı: ölçme bitince süreç kapanmaz, öğrenmeye geri döner.

---

# BÖLÜM D — YAZILIM, EDUMATH MİMARİSİ VE MODÜLLER (Slayt 10–14, 18–22)

> **Yazar:** Bahri KOÇ — Edumath web platformu (React, Node.js, Python/FastAPI), dağıtım, modüller, teknik doğrulama

## D.1 Genel mimari — üç katman (Slayt 10)

Edumath üç bağımsız servisten oluşur:

```
edumath-web     →  Öğretmen ve öğrenci arayüzü (React 19 / Vite / Tailwind)
edumath-api     →  İş kuralları, veritabanı, güvenlik (Node.js / Express / MongoDB)
edumath-ml      →  Sayısal üretim, çözüm, analitik (Python 3 / FastAPI / NumPy)
```

**Endişelerin ayrılması:** Pedagojik kurallar (hangi sınıfa ne gider) ML kodundan bağımsızdır. Arayüz güncellenince üretim motoru bozulmaz.

**Canlı ortam:** Render üzerinde 3 servis (`render.yaml`). Varsayılan **`AI_PROVIDER=local`** — dış ChatGPT/Gemini zorunlu değil.

**Veritabanı adı:** `Edumath` (MongoDB Atlas veya yerel).

## D.2 Teknoloji yığını (sürümler)

| Katman | Teknoloji | Sürüm / not |
|--------|-----------|-------------|
| Arayüz | React, Vite, Tailwind, KaTeX | 19.2, Vitest 4.0 |
| Sunucu | Express, Mongoose, JWT | Express 5.2, Mongoose 9.0 |
| Görsel/OCR | Sharp, Tesseract.js | tur+eng dil paketi |
| ML servis | FastAPI, Uvicorn, NumPy | ML sürüm **0.2.1** · pytest testleri |
| Matris yedek | ml-matrix | backend analitik yedek |
| Dağıtım | Render (free plan) | edumath-web, edumath-api, edumath-ml |

**Sayısal özet:** 18 API route modülü · 22 Mongoose model · 5 otomatik puanlanan madde tipi · 7 örüntü alt kategorisi · 23 frontend test dosyası · 8 ML endpoint · 8 bağlam teması.

## D.3 API modülleri (18 route)

Kaynak: `backend/server.js` — her modül `/api/...` altında mount edilir.

| Modül | Görev |
|-------|-------|
| auth | Giriş, kayıt, JWT, refresh token |
| questions | Soru bankası CRUD, onay |
| exams | Sınav oluşturma, teslim, puanlama |
| exercises | Formatif egzersiz paketleri |
| assignments | Ödev yönetimi |
| surveys | Anket |
| topics / lessons | Konu ağacı, ders quiz |
| patternTemplate | Örüntü SVG şablon üretimi |
| ai | Smart Paste, yapay zekâ üretim |
| student / teacher / admin | Rol panelleri |
| progress | Öğrenme ilerlemesi |
| notifications / messages / chat | İletişim |

## D.4 Veri modelleri (22 Mongoose model)

Ölçme-değerlendirme için kritik modeller: `Question`, `Exam`, `Exercise`, `Assignment`, `Topic`, `UserProgress`, `LearningEvent`, `Progress`.

Yönetim: `User`, `Student`, `AdminAudit`, `PasswordResetRequest`, `RefreshToken`.

## D.5 Havuz tabanlı madde üretim hattı (Slayt 11)

Kaynak: `poolBasedQuestionGeneratorService.js` + `question_generate.py`

**Pipeline adımları:**

```
1. fetchQuestionPoolRows → en fazla 12 onaylı örnek (konu + sınıf + zorluk)
2. ML açıksa → POST /questions/generate-from-pool  (pipeline: db-ml-js)
3. ML kapalı → generateLocalFromPool (JS şablon)     (pipeline: db-js)
4. Hâlâ boş → generateFallbackPatternQuestions
5. Öğretmen önizleme + onay → onaysız öğrenciye gitmez
```

**ML iç döngü (`question_generate.py`):**

- Havuz filtresi (`filterPoolSamplesForGeneration`)
- `variant_from_sample`: sayı varyasyonu (`_replace_numbers`, ölçek 0,85–1,25)
- Yerel çözücü ile cevap doğrulama
- Yoksa `_template_question` (elementary / hexagon / triangle_perimeter / arithmetic / algebraic)
- Tekrar engeli (`seen_text`) · max **20** soru

**generatorMethod değerleri:** `pool-variant`, `elementary-template`, `template`

**Önemli:** TensorFlow, sinir ağı veya eğitilmiş NLP modeli **yok**. “Yapay zekâ” = kural + şablon + havuz esinlenmesi.

## D.6 Otomatik puanlama — beş tip (Slayt 12)

Kaynak: `backend/utils/questionGrading.js`

| Tip | Kod | Puanlama mantığı |
|-----|-----|------------------|
| Çoktan seçmeli | `multiple-choice` | normalize(seçilen) = normalize(doğru) |
| Doğru/yanlış | `true-false` | Metin eşleşmesi |
| Boşluk doldurma | `fill-blank` | Boşluk metni eşleşmesi |
| Eşleştirme | `matching` | Tüm prompt→option çiftleri doğru |
| Sıralama | `sequence` | order[] = correctOrder[] (tam eşleşme) |

**Bilinçli sınır:** Açık uçlu madde puanlaması yok — Henkel vd. (2025) uzun cevap otomasyonunun güvenilirliğini sorgular.

**Sınav skoru:** `score = round(correctCount / totalQuestions × 100)`

## D.7 Konu profili ve zayıf alan (Slayt 13)

**Veri kaynakları** (`collectTopicStats`): Sınav sonuçları, egzersiz teslimleri, ödev (grade≥50 = doğru), `LearningEvent` (error/hint), ders quiz (`UserProgress`).

**ML birincil yol** — `POST /analyze/topics` → `weak_topics.py`:

```
priorityScore = (1 − mastery) × (0,6 + 0,4 × volumeNorm)
isWeak = mastery < 0,55
```

**Normalizasyon:** `mlServiceClient.js` mastery/accuracy >1 ise ÷100 (UI yüzde ↔ ML 0–1).

**Study Hub:** Zayıf konulara tekrar önerir — formatif müdahale.

## D.8 ML servis — edumath-local (Slayt 14)

Motor adı: **edumath-local** (`ml-service/main.py` v0.2.1)

| Endpoint | İşlev |
|----------|-------|
| `GET /health` | Durum + yetenekler |
| `POST /analyze/topics` | Zayıf konu sıralama |
| `POST /score/topics` | Konu skorları (backend doğrudan kullanmaz) |
| `POST /questions/generate-from-pool` | Havuzdan üretim |
| `POST /questions/solve` | Yerel çözücü (7 tip) |
| `POST /questions/analyze` | Konu / zorluk / MEB alt konu |
| `POST /questions/parse-text` | OCR metin ayrıştırma |
| `POST /questions/enrich` | parse + analyze + solve |

**MEB 7 alt konu — ML kapsam tablosu (v0.2.1)**

| Alt konu | Çözücü | Üretim | Not |
|----------|--------|--------|-----|
| Geometrik (şekil) | Kısmen | Evet | SVG şekil örüntüleri Node |
| Sayı (sabit adım) | Evet | Evet | |
| Sayı (karma kural) | Evet | Evet | two_step |
| Kare sayılar | Evet | Evet | |
| Üçgensel sayılar | Evet | Evet | |
| Eşleştirme | — | — | Etkileşimli; Node only |
| Sıralama (adımlar) | — | — | Etkileşimli; Node only |

**Kalite:** `ml-service/tests/` altında pytest birim testleri. Kullanılmayan bağımlılık yok (yalnızca NumPy). Havuz varyasyonunda çözücü başarısızsa şablona düşülür.

Güvenlik: opsiyonel `X-API-Key` (`ML_SERVICE_API_KEY`). Yerel port: **8100**.

## D.9 AI_PROVIDER modları

Kaynak: `backend/config/aiProvider.js`

| Mod | Koşul | Davranış |
|-----|-------|----------|
| **local** (varsayılan) | `AI_PROVIDER=local` | MongoDB + şablon + Tesseract + ml-service |
| **gemini** | API anahtarı + `AI_PROVIDER=gemini` | Smart Parse JSON schema, vision |
| **ollama** | `AI_PROVIDER=ollama` | Yerel LLM yolu (parse) |

Render varsayılan: **local** — harici LLM bağımlılığı yok.

## D.10 Smart Paste / OCR (Slayt 21)

**Akış:**

1. Öğretmen görsel veya metin yapıştırır → `POST /api/ai/smart-parse`
2. Tesseract **tur+eng** OCR (`extractTextFromImageWithOcr`)
3. Sharp ile diyagram/şık kırpma (`questionImageCropService.js`)
4. ML zenginleştirme → `/questions/enrich` (parse + analyze + solve)
5. Form alanları dolar; öğretmen düzenler ve **onaylar**

**parseMode:** `ai` → `ocr` → `manual` (Gemini modunda zincir).

Otomatik onay **yok** — öğretmen denetimi zorunlu.

## D.11 Öğretmen paneli (Slayt 18)

1. Branş onayı (Matematik)
2. Soru bankası — sınıf, konu, zorluk filtresi
3. Madde ekle: elle · Smart Paste · havuz tabanlı üretim
4. Sınav veya egzersiz oluştur, yayınla
5. Sonuç, zayıf alan ve öğrenci raporları

Admin paneli: kullanıcı onayı, şifre talepleri, aktivite takibi, denetim günlüğü.

## D.12 Egzersiz modülü (Slayt 19)

Formatif uygulama — üç adım:

1. **Kaynak:** yapay zekâ veya manuel
2. **Hedef:** sınıf + MEB örüntü alt konusu
3. **Tip:** çoktan seçmeli, doğru/yanlış, boşluk, eşleştirme, sıralama

Paket düzeyinde zorluk bandı zorunluluğu kaldırıldı; hedef **konu + tip** ile netleşir.

## D.13 Öğrenci deneyimi (Slayt 20)

- Konu ağacı (`StudentCourses`) ve ders quiz
- Sınav: genelde tek teslim hakkı; anında puan
- **Study Hub:** zayıf konulara tekrar önerisi
- Mesajlaşma ve bildirimler

## D.14 Yapay zekâ etiği (Slayt 22)

| Görev | Varsayılan (local) | Opsiyonel Gemini |
|-------|-------------------|------------------|
| Soru üretimi | Havuz + şablon + çözücü | Aynı hattı destekler |
| Puanlama | Kural tabanlı | Değişmez |
| Metin özeti | Şablon | LLM |

**Tez yanıtı (Meylani, 2025):** Algoritmik opaklık yerine **açık kural**, incelenebilir kod, öğretmen onayı.

## D.15 Teknik doğrulama ve testler

| Kapsam | Kanıt |
|--------|-------|
| Frontend | 23 Vitest dosyası (`*.test.jsx`, `*.test.js`) |
| Puanlama | Deterministik `questionGrading.js` |
| ML servis | `npm run verify:ml-service` |
| Uçtan uca | Canlı Render: 3 servis health check |
| Depo | github.com/Bahri26/edumath (açık kaynak) |

Pedagojik etki için okul pilotu ayrıca gereklidir — yazılım testi pedagojik geçerliliğin yerine geçmez.

## D.16 Kod referans haritası

| Konu | Dosya |
|------|-------|
| 7 kategori + kazanımlar | `backend/constants/patternTopics.js` |
| SVG şablon | `backend/services/patternTemplateService.js` |
| Sınıf filtresi | `backend/services/gradeAwareQuestionTemplates.js` |
| ML üretim | `ml-service/services/question_generate.py` |
| ML çözücü | `ml-service/services/question_solver.py` |
| Zayıf konu | `ml-service/services/weak_topics.py` |
| Analitik yedek | `backend/services/studentAnalyticsService.js` |
| Havuz hattı | `backend/services/poolBasedQuestionGeneratorService.js` |
| Puanlama | `backend/utils/questionGrading.js` |
| Deploy | `render.yaml` |

---

# BÖLÜM E — BULGULAR, SINIRLILIKLAR VE SONUÇ (Slayt 15–17, 23)

## E.1 Bugün sunulan bulgular (Slayt 15–16)

**Tamamlanan:**

- Edumath platformu (3 servis) canlı — **yazılım: Bahri KOÇ**
- Havuz tabanlı üretim hattı uçtan uca çalışıyor
- Beş tip deterministik puanlama test edildi
- Yedi örüntü alt kategorisi kodlandı — **pedagojik eşleme: Emre İncekalan**
- Öğretmen ve öğrenci kılavuzları hazır  
- Açık kaynak: github.com/Bahri26/edumath  

**Planlanan:**

- Etik kurul izni  
- Okul pilotu  
- KTT: p, r, α  
- Öğretmen görüşmeleri  
- Hakemli makale  

## E.2 Sınırlılıklar (Slayt 17)

1. Empirik pilot ve psikometrik analiz henüz yok — en kritik sınır  
2. Açık uçlu madde puanlaması yok (bilinçli tercih)  
3. İçerik derinliği örüntüde; diğer konular şema düzeyinde  
4. Render ücretsiz planda ilk istek yavaş (soğuk başlatma)  
5. Zayıf konu eşiği henüz kalibre edilmedi  
6. Genellenebilirlik okul pilotuna bağlı  

## E.3 Sonuç — üç katkı (Slayt 23)

1. K–12 ölçme-değerlendirme zincirinin **bütünleşik dijital modeli**  
2. MEB uyumlu **havuz tabanlı, denetlenebilir** madde üretim hattı  
3. Kapalı büyük dil modeli yerine **şeffaf yerel algoritmik** alternatif  

Danışmanım Prof. Dr. Hüseyin Bahadır Yanık’a, platform yazılımını geliştiren **Bahri KOÇ**’a, jüri üyelerine ve dinleyicilere teşekkür ederim. Sorularınızı memnuniyetle yanıtlarım.

---

# BÖLÜM G — JÜRİDEN SIK GELEN SORULAR (Kısa cevap)

| Soru | Cevabınız |
|------|-----------|
| TensorFlow / sinir ağı var mı? | Hayır. NumPy, kural, şablon, yerel çözücü. |
| ChatGPT soru mu üretiyor? | Hayır; varsayılan havuz hattı (`AI_PROVIDER=local`). Gemini opsiyonel. |
| Pilot yapıldı mı? | Henüz değil; etik kurul sonrası planlanıyor. |
| Neden örüntü? | MEB 2018 hattı, erken cebir köprüsü, kodda 7 alt kategori derinliği. |
| AU öğrencileri mi? | Hayır; K–12 matematik platformu. Tez AU’da yürütülüyor. |
| α platformda otomatik mi? | Hayır; pilot sonrası SPSS/Python ile AS4. |
| Kim yazılımı geliştirdi? | Bahri KOÇ. Matematik kuramı ve müfredat: Emre İncekalan. |
| priorityScore nasıl hesaplanır? | (1−mastery)×(0,6+0,4×volumeNorm); eşik 0,55. |
| İlkokulda cebir sorusu çıkar mı? | Hayır; `isSampleTooAdvancedForGrade` filtreler. |
| Havuz üretimi kopya mı? | Hayır; sayı varyasyonu + çözücü doğrulama; birebir kopya engellenir. |
| ML servis kapalıysa ne olur? | JS yedek şablon (`db-js` pipeline) devreye girer. |
| ML tüm örüntü tiplerini kapsar mı? | 7 alt konunun 5’i ML’de; eşleştirme ve sıralama etkileşimli → Node. |
| Açık uçlu neden yok? | Deterministik puanlama ve KTT için yapılandırılmış tip tercihi. |

Ayrıntılı cevaplar: `edumath-sunum.md` Bölüm XV · Konuşma metinleri: Bölüm II KONUŞMA blokları.

---

*Belge sürümü: Edumath kod tabanı ve `edumath-sunum.md` ile uyumlu · Matematik: Emre İncekalan · Yazılım: Bahri KOÇ*
