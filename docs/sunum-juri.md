# EDUMATH — Tez Savunma Sunumu

**Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi**

Emre İncekalan · Anadolu Üniversitesi Lisansüstü Eğitim Enstitüsü  
Matematik eğitimi: Emre İncekalan · Yazılım: Bahri KOÇ

---

## Slayt 1 — Kapak

- **Anadolu Üniversitesi** · Lisansüstü Eğitim Enstitüsü · Matematik Eğitimi Anabilim Dalı
- **Tez başlığı:** Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi
- **Tez araştırmacısı:** Emre İncekalan (2531745000)
- **Matematik eğitimi / kuram:** Emre İncekalan
- **Yazılım geliştirme:** Bahri KOÇ
- **Danışman:** Prof. Dr. Hüseyin Bahadır Yanık
- **Artefakt:** Edumath Web Platformu · github.com/Bahri26/edumath

---

## Slayt 2 — Sunum planı (tez savunması)

**Savunma akışı (≈25–30 dk + S&C)**

| Aşama | Slayt | İçerik |
|-------|-------|--------|
| Giriş | 1–7 | Problem, amaç, literatür, kuram, yöntem özeti |
| Yöntem | 8–14 | MEB içerik, döngü, mimari, üretim hattı, puanlama |
| **Bulgular** | **15–16** | Teknik doğrulama; tamamlanan / planlanan |
| Sınırlılık | 17 | Empirik pilot planlanıyor |
| Uygulama | 18–21 | Öğretmen/öğrenci arayüzü (pedagojik geçerlilik) |
| Tartışma | 22 | YZ etiği |
| Sonuç | 23 | Katkı + teşekkür → **S&C** |

---

## Slayt 3 — Problem durumu

| Geleneksel ölçme | Edumath yanıtı |
|------------------|----------------|
| Bireysel geri bildirim gecikir | Anlık otomatik puanlama |
| Konu profili elle tutulur | Konu/kazanım etiketli analitik |
| Madde üretimi zaman alır | Havuz tabanlı algoritmik üretim |
| YZ opaklığı (Meylani, 2025) | Denetlenebilir yerel kurallar |

---

## Slayt 4 — Araştırma amacı ve soruları

**Amaç:** MEB (2018) uyumlu, şeffaf YZ destekli ölçme-değerlendirme platformu tasarlamak ve geliştirmek.

| Kod | Araştırma sorusu | Durum |
|-----|------------------|-------|
| AS1 | Bütünleşik YZ platformları ölçmeyi nasıl dönüştürür? | Kuramsal + teknik |
| AS2 | Otomatik puanlama + konu profili formatif değerlendirmeye katkı? | Platform hazır; pilot bekliyor |
| AS3 | Havuz tabanlı üretim vs üretken YZ ayrışması? | Hattı geliştirildi |
| AS4 | Pilot sonrası KTT (p, r, α)? | **Planlanan** |

---

## Slayt 5 — Tez kapsamı ve uygulama evreni

| Boyut | Tanım |
|-------|--------|
| Tez yürütüldüğü yer | AU Matematik Eğitimi Doktora |
| Platform hedef kitlesi | 1.–12. sınıf K–12 matematik |
| Branş alanı (platform) | Matematik (tez derinliği); Türkçe, Fen vb. şema düzeyinde |
| Birincil konu odağı | Örüntüler (MEB 2018) |
| Yöntem | Karma yöntem + DBR |
| Pilot | Geliştirme tamam; okul pilotu planlanıyor |

---

## Slayt 6 — Literatürdeki boşluk

| Alan | Literatür | Edumath konumu |
|------|-----------|----------------|
| YZ değerlendirme | Meylani, 2025 — etik gerilim | Bütünleşik + şeffaf |
| Üretken YZ | Seven & Erümit, 2024 | Havuz + öğretmen onayı |
| Otomatik puanlama | Çavuş, 2024 | 5 yapılandırılmış tip |
| Örüntü/cebir | Radford, 2008; Stacey, 1989 | 7 alt kategori |
| LLM puanlama | Henkel, 2025 | Gelecek katman |
| Öğretmen algısı | Tekin & Ciğerci, 2025 | Kılavuz + panel (plan) |

---

## Slayt 7 — Kuramsal çerçeve ve araştırma yöntemi

**Kuram:**

```
KTT (pilot)  +  Formatif değerlendirme  +  Öğrenme analitiği  →  EDUMATH
                              ↑
                    Design-Based Research (DBR)
```

**Yöntem (özet):**

| Boyut | Tanım |
|-------|--------|
| Desen | Karma yöntem + **DBR** (artefakt: Edumath) |
| Evren | K–12 matematik öğretmen/öğrenci (pilot planlanıyor) |
| Veri (tamamlanan) | Teknik doğrulama, 23 test dosyası, canlı ortam |
| Veri (planlanan) | Sınav/egzersiz, öğretmen görüşmesi |
| Analiz (planlanan) | KTT: p, r, α · nitel tema analizi |

---

## Slayt 8 — Matematik içeriği: MEB örüntü (7 alt kategori)

| # | Alt konu | Matematiksel çekirdek | Sınıf |
|---|----------|----------------------|-------|
| 1 | Geometrik (şekil) | Periyodik döngü △□○ | 1–4 |
| 2 | Sayı (sabit adım) | aₙ = a₁ + (n−1)d | 3–8 |
| 3 | Sayı (karma kural) | +a / −b dönüşümlü | 5–9 |
| 4 | Kare sayılar | n² | 6–10 |
| 5 | Üçgensel sayılar | Tₙ = n(n+1)/2 | 7–12 |
| 6 | Eşleştirme | Tür sınıflandırma | 4–9 |
| 7 | Sıralama | Çözüm adım sırası | 5–10 |

Her alt konu: kazanım metni + üretim şablonu + yerel çözücü (`patternTopics.js`)

---

## Slayt 9 — Edumath ölçme-değerlendirme döngüsü

```
[1] Madde üret / seç  →  [2] Sınav / egzersiz uygula
         ↑                              ↓
[5] Müdahale planla  ←  [4] Zayıf konu analizi  ←  [3] Otomatik puanlama
```

| Adım | Modül | Çıktı |
|------|-------|-------|
| 1 | Soru bankası, yapay zekâ destekli üretim, Smart Paste | Onaylı madde havuzu |
| 2 | Sınav, egzersiz, ders quiz | Öğrenci yanıtları |
| 3 | `questionGrading.js` | Doğru/yanlış, puan |
| 4 | `studentAnalyticsService`, ML | priorityScore, isWeak |
| 5 | Study Hub, öğretmen raporu | Tekrar / müdahale |

---

## Slayt 10 — Mimari (3 katman)

```
edumath-web (React 19 / Vite / Tailwind)
        ↓ REST
edumath-api (Node.js / Express / MongoDB)
        ↓ HTTP
edumath-ml (Python / FastAPI / NumPy v0.2.0)
```

| Gösterge | Değer |
|----------|-------|
| Deploy servisi | 3 (Render) |
| API modülü | 18 |
| Mongoose modeli | 20+ |
| Varsayılan YZ | `AI_PROVIDER=local` |

---

## Slayt 11 — Özgün katkı: havuz tabanlı madde üretimi

```
MongoDB havuz (≤12 metin örneği)
    → ml-service: generate-from-pool (sayı varyasyon + şablon)
    → JS fallback (gradeAwareQuestionTemplates)
    → Yerel çözücü: anahtar doğrulama
    → Öğretmen önizleme & ONAY
    → Soru bankası / sınav / egzersiz
```

- Birebir kopya yok · Sınıf filtresi · İlkokulda cebir engeli · 8 bağlam teması

---

## Slayt 12 — Otomatik puanlama (5 yapılandırılmış tip)

| Tip | Kod | Puanlama |
|-----|-----|----------|
| Çoktan seçmeli | `multiple-choice` | Metin eşleme |
| Doğru/yanlış | `true-false` | Metin eşleme |
| Boşluk doldurma | `fill-blank` | Metin eşleme |
| Eşleştirme | `matching` | Tam çift eşleşmesi |
| Sıralama | `sequence` | Doğru adım sırası |

**Formül:** Puan = Σ 1(aᵢ = kᵢ) · `questionGrading.js`

---

## Slayt 13 — Konu profili ve zayıf alan analitiği

**Veri kaynakları:** Sınav · Egzersiz · Ödev · Ders quiz · Öğrenme olayları

```
accuracy = doğru / toplam
priorityScore = (1 − mastery) × (0,6 + 0,4 × volumeNorm)
isWeak = mastery < 0,55
```

**Soğuk başlatma:** Veri yoksa müfredat konuları öneri listesi

---

## Slayt 14 — ML servis (edumath-local)

| Endpoint | İşlev |
|----------|--------|
| `POST /analyze/topics` | Zayıf konu sıralama |
| `POST /questions/generate-from-pool` | Havuz tabanlı üretim |
| `POST /questions/solve` | Örüntü çözümü (7 tip) |
| `POST /questions/parse-text` | OCR metin ayrıştırma |
| `POST /questions/analyze` | Konu / zorluk / MEB alt konu |
| `POST /questions/enrich` | parse + analyze + solve |

**Motor:** edumath-local v0.2.1 — sinir ağı yok; NumPy + kural tabanı

**MEB 7 alt konu:** 5’i ML’de (geometrik kısmen); eşleştirme ve sıralama etkileşimli → Node.

---

## Slayt 15 — Bulgular: teknik doğrulama

| Bulgu | Kanıt |
|-------|-------|
| Deterministik puanlama | `questionGrading.js` testleri |
| Uçtan uca üretim hattı | Canlı Render ortamı |
| Sınıf filtresi | İlkokul cebir engeli doğrulandı |
| Modüler mimari | 18 API, 20+ model |
| Test kapsamı | 23 frontend test dosyası + ml-service pytest |
| Açık kaynak | github.com/Bahri26/edumath |

**Not:** DBR aşamasında bulgular **tasarım çıktısı + teknik doğrulama** düzeyindedir.

---

## Slayt 16 — Bulgular: tamamlanan vs planlanan

| Tamamlandı ✓ | Planlanıyor ○ |
|--------------|---------------|
| Edumath platform (3 servis) | Etik kurul izni |
| Havuz tabanlı üretim hattı | Okul pilotu |
| 5 tip otomatik puanlama | KTT: p, r, α |
| 7 örüntü alt kategorisi | Öğretmen görüşmeleri |
| Öğretmen/öğrenci kılavuzları | Hakemli makale |
| Teknik doğrulama | Empirik bulgular bölümü |

---

## Slayt 17 — Sınırlılıklar ve öneriler

1. Empirik pilot ve psikometrik analiz henüz yok
2. Açık uçlu madde / NLP puanlaması yok
3. Birincil içerik odağı: örüntü
4. Render ücretsiz katmanında soğuk başlatma gecikmesi
5. Zayıf konu eşiği (0,55) henüz kalibre edilmemiş
6. Genellenebilirlik okul pilotuna bağlı

**Öneriler:** Etik kurul → okul pilotu → KTT kalibrasyonu → öğretmen görüşmeleri

---

## Slayt 18 — Öğretmen paneli akışı

```
Branş onayı → Soru bankası (filtre) → Smart Paste / yapay zekâ destekli üretim
    → Sınav veya egzersiz oluştur → Yayınla → Rapor & ipucu istekleri
```

| Modül | İşlev |
|-------|--------|
| Soru bankası | MEB etiketli havuz, onay |
| Smart Paste | Tesseract OCR → madde taslağı |
| Sınavlar | Otomatik puan, konu raporu |
| Raporlar | Sınıf/konu, zayıf alan |

---

## Slayt 19 — Egzersiz oluşturma (3 adım)

| Adım | Seçim | Not |
|------|-------|-----|
| 1 | Yapay zekâ destekli **veya** manuel | Havuzdan veya üretimden |
| 2 | Sınıf + konu | 1.–12.; MEB örüntü alt konuları |
| 3 | Madde tipi | Çoktan seçmeli, doğru/yanlış, boşluk, eşleştirme, sıralama |

Zorluk bandı formdan **kaldırıldı** — ölçme hedefi: konu + tip

---

## Slayt 20 — Öğrenci deneyimi

```
Ana sayfa → Konu ağacı / ders quiz → Sınav (tek teslim)
    → Sonuç → Study Hub (zayıf konu tekrarı)
```

| Bileşen | İşlev |
|---------|--------|
| Konu ağacı | Sınıf düzeyine uygun ilerleme |
| Study Hub | Eşik altı konular, tekrar |
| Mesajlar | Öğretmen duyuruları |

---

## Slayt 21 — Smart Paste ve madde girişi

```
Kağıt / PDF / ekran görüntüsü → Tesseract OCR (tur+eng)
    → question_parse.py → Form alanları dolar
    → Öğretmen düzenler → Onay → Havuza eklenir
```

---

## Slayt 22 — YZ yaklaşımı: şeffaflık ve etik

| | Yerel motor (varsayılan) | Opsiyonel Gemini |
|--|--------------------------|------------------|
| Soru üretimi | Havuz + şablon | **Aynı hattı** |
| Puanlama | Deterministik kural | Değişmez |
| Metin analizi | Şablon | LLM özeti |
| Etik | Kod incelenebilir | Fallback yerel |

---

## Slayt 23 — Sonuç, teşekkür ve S&C

**Üç katkı:**
1. K–12 ölçme-değerlendirme zincirinin bütünleşik dijital modeli
2. MEB uyumlu havuz tabanlı, denetlenebilir madde üretim hattı
3. Kapalı LLM yerine şeffaf yerel algoritmik alternatif

**Depo:** github.com/Bahri26/edumath

**Teşekkür:** Danışmanım Prof. Dr. Hüseyin Bahadır Yanık’a, yazılım geliştiricisi Bahri KOÇ’a, jüri üyelerine ve dinleyicilere.

**Soru-cevap:** Dinlediğiniz için teşekkür ederim; sorularınızı memnuniyetle yanıtlarım.

---
