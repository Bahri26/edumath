# Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi: Edumath Web Platformunun Tasarımı, Geliştirilmesi ve Uygulanması

**Araştırmacı:** Emre İncekalan (2531745000)  
**Matematik eğitimi:** Emre İncekalan  
**Yazılım geliştirme:** Bahri KOÇ  
**Kurum:** Anadolu Üniversitesi Lisansüstü Eğitim Enstitüsü — Matematik Eğitimi (Doktora)  
**Platform:** Edumath — https://github.com/Bahri26/edumath  
**Güncelleme:** 24 Mayıs 2026

---

# 1. GİRİŞ

## 1.1. Araştırmanın Gerekçesi ve Önemi

21. yüzyılda dijitalleşme, eğitimde ölçme-değerlendirme, içerik üretimi ve kişiselleştirilmiş öğrenme alanlarında köklü dönüşümlere yol açmıştır. Matematik eğitimi, analitik düşünme ve problem çözme becerilerinin gelişiminde kritik bir disiplindir; ancak geleneksel ölçme-değerlendirme yöntemleri büyük sınıflarda bireysel geri bildirim, zamanında müdahale ve nesnellik açısından sınırlılıklar taşımaktadır (Nayıroğlu & Tutak, 2024; Kara, 2024).

Yapay zekâ (YZ) destekli sistemler otomatik puanlama, konu bazlı performans analizi ve formatif geri bildirim imkânları sunmaktadır (Çavuş, 2024; Meylani, 2025). Bununla birlikte literatür, tamamen kapalı kutu büyük dil modellerine bağımlılığın pedagojik geçerlik, şeffaflık ve veri güvenliği açısından risk oluşturduğunu vurgulamaktadır (Meylani, 2025; Hermann, 2021).

Bu doktora tez çalışması, **Anadolu Üniversitesi Matematik Eğitimi programında** yürütülmekte olup uygulama ortamı **1–12. sınıf K–12 matematik ölçme-değerlendirmesi**dir. Geliştirilen **Edumath** web platformu, öğretmen ve öğrenci kılavuzları (`docs/teacher-guide.md`, `docs/student-guide.md`) ile birlikte bu amaca hizmet eder.

## 1.2. Tezin Amacı ve Kapsamı

Tezin amacı:

1. Matematik eğitiminde YZ destekli ölçme-değerlendirme süreçlerini kuramsal ve uygulamalı düzeyde incelemek;
2. MEB Matematik Öğretim Programı (2018) ile uyumlu, **şeffaf ve yerel algoritmik** bir web platformu (Edumath) tasarlamak ve geliştirmek;
3. Pilot uygulama ve psikometrik analizlerle sistemin pedagojik geçerliliğini değerlendirmek (planlanan aşama).

Kapsam: literatür taraması, design-based research (DBR) mantığıyla sistem geliştirme, teknik doğrulama bulguları, öğretmen/öğrenci kullanım kılavuzları ve planlanan deneysel analizler.

## 1.3. Problem Durumu ve Araştırma Soruları

Geleneksel ölçme-değerlendirme; bireysel öğrenme eksikliklerinin zamanında tespiti, konu bazlı geri bildirim ve ölçeklenebilir madde yönetimi konularında yetersiz kalabilmektedir (Seven & Erümit, 2024). Bu bağlamda:

- **AS1:** YZ destekli bütünleşik ölçme-değerlendirme platformları, matematik eğitiminde ölçme süreçlerini nasıl dönüştürmektedir?
- **AS2:** Yapılandırılmış maddelerde otomatik puanlama ve konu etiketli hata profili çıkarımı, formatif değerlendirmeye nasıl katkı sağlar?
- **AS3:** Edumath’ın yerel algoritmik madde üretim hattı ve MEB uyumlu içerik sunumu, literatürdeki üretken YZ araçlarından hangi yönlerle ayrışmaktadır?
- **AS4:** Pilot uygulama sonrasında KTT göstergeleri ($p$, $r$, Cronbach $\alpha$) ve nitel bulgular sistemin sınırlılıklarını nasıl ortaya koyacaktır? *(planlanan)*

## 1.4. Tezin Yapısı

Tez; giriş, literatür taraması, yöntem, sistem tasarımı, geliştirme bulguları, sonuç ve öneriler ile eklerden (öğretmen/öğrenci kılavuzları, teknik ekler) oluşmaktadır.

## 1.5. Kavramsal Tanımlar

### Tablo 1.1. Temel Kavramlar

| Kavram | Tanım |
|--------|--------|
| Yapay zekâ (YZ) | Öğrenme, akıl yürütme ve problem çözme yeteneklerini simüle eden bilgisayar sistemleri |
| Ölçme-değerlendirme | Öğrenci bilgi/becerilerinin sistematik belirlenmesi ve yorumlanması |
| Otomatik puanlama | Yapılandırılmış öğrenci yanıtlarının kural tabanlı sistemlerle değerlendirilmesi |
| Öğrenme analitiği | Öğrenme verilerinin toplanması, analizi ve pedagojik karar desteği |
| Havuz tabanlı üretim | Mevcut madde havuzundan esinlenerek birebir kopya olmayan yeni madde üretimi |
| Zayıf konu | Ustalık (mastery) skoru eşik değerin (0,55) altında kalan konu başlığı |

---

# 2. LİTERATÜR TARAMASI

## 2.1. YZ Kavramı ve Eğitimdeki Yeri

YZ uygulamaları kişiselleştirilmiş öğrenme, otomatik puanlama ve öğrenme analitiği alanlarında avantajlar sunmaktadır (Cumhur, 2024; Seven & Erümit, 2024). Meylani (2025) sistematik derlemede nesnellik–etik gerilimini; Çavuş (2024) otomatik puanlama derlemesinde hız ve ölçeklenebilirliği vurgular.

## 2.2. Matematik Eğitiminde YZ Tabanlı Ölçme-Değerlendirme

### 2.2.1. Otomatik puanlama

Yapılandırılmış maddelerde kural tabanlı puanlama nesnel ve tekrarlanabilirdir. Açık uçlu matematik yanıtlarında LLM tabanlı yorumlama uluslararası literatürde gelişmektedir (Henkel vd., 2025; Zhang vd., 2024). Edumath şu an **yapılandırılmış madde tiplerinde** otomatik puanlama sunar; serbest metin NLP puanlaması **gelecek entegrasyon** olarak planlanmıştır.

### 2.2.2. Madde üretimi ve psikometrik geçerlik

YZ destekli madde üretiminin psikometrik karşılaştırmaları Türkiye bağlamında yeni bir alandır (NEU Ereğli, 2025). Seven & Erümit (2024) ve Özkan & Kaplan (2025) üretken YZ araçlarının pedagojik potansiyelini tartışır. Edumath, **havuz tabanlı yerel üretim + öğretmen onayı** modeli ile uzman denetimine açık bir alternatif sunar.

### 2.2.3. Örüntü ve erken cebirsel düşünme

MEB programı örüntü oluşturma ve analiz kazanımlarını tanımlar (MEB, 2018). Radford (2008) ve Stacey (1989) örüntü genellemesinin cebirsel düşünmenin temelini oluşturduğunu gösterir. Edumath’ta yedi örüntü alt kategorisi `patternTopics.js` ile programla hizalanmıştır.

## 2.3. Türkiye ve Dünyada Uygulamalar

Ulusal: Tekin & Ciğerci (2025), Saralar-Aras (2025), Nayıroğlu & Tutak (2024).  
Uluslararası: Xu & Ouyang (2022), Lye (2024), Agarwal (2024); öğrenme analitiği (Siemens & Baker, 2012).

## 2.4. Kavramsal Çerçeve

Tez; **KTT** (Kline, 2013; Tavşancıl, 2014), **formatif değerlendirme** ve **öğrenme analitiği** perspektiflerini Edumath mimarisinde birleştirir. YEGİTEK (2026) YZ’yi öğretmen destek aracı olarak konumlandırır.

## 2.5. Eleştirel Değerlendirme

Güçlü yönler: hız, ölçeklenebilirlik, kişiselleştirme. Sınırlılıklar: veri gizliliği, algoritmik opaklık, öğretmen hazırbulunuşluğu (Meylani, 2025; Hermann, 2021).

### Tablo 2.1. Literatür Temaları

| Tema | Edumath karşılığı |
|------|-------------------|
| Nesnellik | Kural tabanlı `gradeQuestionAnswer` |
| Şeffaflık | `AI_PROVIDER=local`, açık kaynak kod |
| Kişiselleştirme | Zayıf konu skorlama, Study Hub |
| Program uyumu | MEB 2018, örüntü alt konuları |
| Etik | KVKK, planlanan etik kurul |

---

# 3. YÖNTEM

## 3.1. Araştırma Modeli

Çalışma **karma yöntem** ve **design-based research (DBR)** desenine sahiptir:

- **Nicel (planlanan):** Sınav/egzersiz sonuçları, madde analizi ($p$, $r$), Cronbach $\alpha$
- **Nicel (tamamlanan):** Teknik doğrulama, birim testler, sistem metrikleri
- **Nitel (planlanan):** Öğretmen görüşmeleri, kullanım logları yorumu

## 3.2. Evren ve Örneklem

**Evren:** K–12 matematik öğretmenleri ve öğrencileri.  
**Geliştirme ortamı:** Edumath açık kaynak deposu; Render.com üzerinde üç servis (`render.yaml`):

| Servis | Tür | Görev |
|--------|-----|--------|
| `edumath-api` | Node.js web | REST API, MongoDB |
| `edumath-ml` | Python web | Yerel ML mikroservisi |
| `edumath-web` | Statik site | React/Vite frontend |

**Pilot örneklem:** Belirlenecek okul/sınıf düzeyi (etik kurul onayı sonrası). *Henüz tamamlanmamıştır.*

## 3.3. Veri Toplama Araçları

- Platform içi sınav ve egzersiz teslim kayıtları (`Exam`, `Exercise`, `LearningEvent`)
- Öğretmen rapor ekranı verileri (`TeacherReports.jsx`)
- Öğrenci konu istatistikleri (`studentAnalyticsService.js`)
- Planlanan: öğretmen görüşme formu, öğrenci anket formu

## 3.4. Etik Süreç

İnsan katılımcılardan veri toplanması öncesinde **Anadolu Üniversitesi Etik Kurulu** izni alınacaktır. KVKK ve bilimsel araştırma etiği ilkelerine uyum sağlanacaktır.

## 3.5. Veri Analizi Planı

### 3.5.1. Klasik test teorisi (pilot sonrası)

Madde güçlüğü:
$$p = \frac{\text{Doğru cevaplayan öğrenci sayısı}}{\text{Toplam öğrenci sayısı}}$$

Madde ayırt ediciliği: Pearson $r$ (madde puanı × test toplam puanı).

Güvenirlik:
$$\alpha = \frac{k}{k-1}\left(1 - \frac{\sum_{i=1}^{k}\sigma_i^2}{\sigma_T^2}\right)$$

### 3.5.2. Platform içi analitik (uygulanmakta)

Konu bazlı doğruluk: $\text{accuracy} = \text{correct}/\text{total}$

Zayıf konu öncelik skoru (`weak_topics.py`):
$$\text{priorityScore} = (1 - \text{mastery}) \times (0{,}6 + 0{,}4 \times \text{volumeNorm})$$

Varsayılan zayıf konu eşiği: **0,55** (`ML_WEAK_TOPIC_THRESHOLD`, `render.yaml`).

### 3.5.3. Teknik doğrulama (tamamlanan)

- Frontend birim test dosyaları: **23** adet (`*.test.jsx`, `*.test.js`)
- Otomatik puanlama: yapılandırılmış maddelerde deterministik sonuç
- ML servis sürümü: **0.2.0**; yetenekler: `weak-topics`, `question-solve`, `question-parse`, `question-analyze`, `question-enrich`, `question-generate-from-pool`

---

# 4. EDUMATH SİSTEM TASARIMI VE GELİŞTİRME

## 4.1. Kullanılan Teknolojiler

### Tablo 4.1. Teknoloji Yığını (Gerçek Uygulama)

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Frontend | React 19, Vite, Tailwind, KaTeX | TR/EN dil desteği |
| Backend | Node.js, Express, Mongoose | JWT kimlik doğrulama |
| Veritabanı | MongoDB (`Edumath`) | 20+ koleksiyon modeli |
| ML servis | Python 3, FastAPI, NumPy | Harici AI yok (local mod) |
| OCR | Tesseract.js (tur+eng) | Smart Paste |
| Opsiyonel LLM | Google Gemini | `AI_PROVIDER` ≠ local |
| Barındırma | Render.com | `AI_PROVIDER=local` prod varsayılan |

**Projede bulunmayan teknolojiler (taslak hataları giderildi):** TensorFlow.js, karar ağacı/sinir ağı eğitimi, Pandas tabanlı analitik katman, açık uçlu NLP kosinüs benzerliği puanlaması.

## 4.2. Sistem Mimarisi

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  edumath-web    │ ──────────────►│  edumath-api     │
│  React/Vite     │                │  Express/MongoDB │
└─────────────────┘                └────────┬─────────┘
                                            │ REST
                                            ▼
                                   ┌──────────────────┐
                                   │  edumath-ml      │
                                   │  FastAPI/NumPy   │
                                   └──────────────────┘
```

**API route modülleri (18):** `auth`, `admin`, `teacher`, `student`, `exam`, `exercise`, `question`, `topic`, `lesson`, `progress`, `assignment`, `survey`, `message`, `notification`, `ai`, `chat`, `patternTemplate`, `user`.

## 4.3. Ana Modüller

### Tablo 4.2. Modül Envanteri

| Modül | Bileşen | Ölçme-değerlendirme işlevi |
|-------|---------|----------------------------|
| Soru bankası | `QuestionBank.jsx`, `Question` modeli | Madde havuzu, filtre, Smart Paste |
| Sınavlar | `TeacherExamsPage`, `examRoutes.js` | Otomatik puanlama, konu raporu |
| Egzersizler | `TeacherExerciseCreator.jsx` | Sınıf+konu+madde tipi paketi |
| Öğrenci ilerleme | `StudentProgressDashboard.jsx` | XP, doğru/yanlış |
| Raporlar | `TeacherReports.jsx` | Sınıf ortalaması, ipucu istekleri |
| Study Hub | `StudentStudyHub.jsx` | Zayıf konu alıştırmaları |
| Admin | `AdminDashboard` | Kullanıcı, audit log |
| Kılavuzlar | `GuideDrawer`, `quickGuideContent.js` | Öğretmen/öğrenci pedagojik destek |

### 4.3.1. Desteklenen madde tipleri

| Tip | `Question.type` | Otomatik puanlama |
|-----|-----------------|-------------------|
| Çoktan seçmeli | `multiple-choice` | Metin karşılaştırma |
| Doğru/yanlış | `true-false` | Metin karşılaştırma |
| Boşluk doldurma | `fill-blank` | Metin karşılaştırma |
| Eşleştirme | `matching` | `gradeMatchingAnswer` |
| Sıralama | `sequence` | `gradeSequenceAnswer` |

### 4.3.2. Otomatik puanlama (gerçek kod)

```js
function gradeQuestionAnswer(question, userAnswer) {
  if (ca === '__interactive_matching__' || question.type === 'matching') {
    return gradeMatchingAnswer(question, userAnswer);
  }
  if (ca === '__interactive_sequence__' || question.type === 'sequence') {
    return gradeSequenceAnswer(question, userAnswer);
  }
  return normalizeMcAnswer(userAnswer).trim() === normalizeMcAnswer(ca).trim();
}
```
Kaynak: `backend/utils/questionGrading.js`

### 4.3.3. Havuz tabanlı madde üretim hattı (özgün katkı)

1. `fetchQuestionPoolRows` — MongoDB’den konu/sınıf filtreli örnekler  
2. `POST /questions/generate-from-pool` — Python `question_generate.py` (8 bağlam teması, sınıf filtresi)  
3. `gradeAwareQuestionTemplates.js` — JS şablon motoru, ilkokulda cebir engeli  
4. Öğretmen onayı → soru bankası / sınav / egzersiz  

### 4.3.4. Zayıf konu analizi

`studentAnalyticsService.js` sınav, egzersiz ve ödev verilerinden konu istatistikleri toplar; `ml-service` `/analyze/topics` uç noktası `priorityScore` ile sıralama yapar.

### 4.3.5. MEB örüntü alt konuları (7 kategori)

Geometrik, aritmetik, karma kural, kare sayılar, üçgensel sayılar, eşleştirme, sıralama — `backend/constants/patternTopics.js`, her biri için `LEARNING_OUTCOME_BY_LABEL` kazanım metni tanımlıdır.

## 4.4. Öğretmen ve Öğrenci Kullanım Kılavuzları

Platform pedagojik kullanılabilirlik için iki resmi kılavuz içerir. Uygulama içi **Hızlı Kılavuz** (`GuideDrawer`) ile `docs/` dosyaları senkron tutulmuştur.

### 4.4.1. Öğretmen kılavuzu özeti

Tam metin: `docs/teacher-guide.md`

| Bölüm | İçerik |
|-------|--------|
| Soru bankası | Branş/sınıf/konu filtreleri, Smart Paste OCR |
| Sınavlar | Hızlı sınav, 7-7-7 stüdyo |
| Egzersizler | AI/manuel → sınıf+konu → madde tipi |
| Konu & ders | Konu ağacı sıralama |
| Raporlar | Dönem grafikleri, ipucu istekleri, PDF |
| Kalıp şablonları | MEB örüntü paketleri |

### 4.4.2. Öğrenci kılavuzu özeti

Tam metin: `docs/student-guide.md`

| Bölüm | İçerik |
|-------|--------|
| Ana sayfa | Devam kartları, günlük hedefler |
| Sınavlar | Süre sayacı, teslim |
| Konu ağacı | Ders quizleri, XP |
| Study Hub | Zayıf konu alıştırmaları |
| Ödevler/takvim | Teslim planlama |
| Mesajlar | Öğretmen duyuruları |

## 4.5. Güvenlik ve Erişilebilirlik

- JWT: erişim tokeni 15 dk, yenileme 30 gün (`render.yaml`)
- Auth rate limit: 20 istek / 15 dk
- Soğuk başlatma: `backendWake.js`, auth timeout 60 sn (`VITE_AUTH_TIMEOUT_MS`)
- Mobil uyum: `DashboardLayout` hamburger menü, route değişiminde kapanma

---

# 5. GELİŞTİRME BULGULARI VE TEKNİK DOĞRULAMA

> **Not:** Bu bölüm **empirik pilot bulgularını değil**, tamamlanan yazılım geliştirme ve teknik doğrulama bulgularını raporlar. Psikometrik pilot analizler (AS4) etik kurul sonrası Bölüm 5.2’ye eklenecektir.

## 5.1. Platform Geliştirme Bulguları

### Tablo 5.1. Edumath Teknik Envanter (Gerçek Veriler)

| Gösterge | Değer | Kaynak |
|----------|-------|--------|
| Deploy servis sayısı | 3 | `render.yaml` |
| API route modülü | 18 | `backend/routes/` |
| Mongoose modeli | 20+ | `backend/models/` |
| ML servis sürümü | 0.2.0 | `ml-service/main.py` |
| ML endpoint yetenekleri | 6 | `/health` capabilities |
| Otomatik puanlanan madde tipi | 5 | `questionTypesUi.js` |
| Örüntü alt kategorisi | 7 | `patternTopics.js` |
| Frontend test dosyası | 23 | `frontend/src/**/*.test.*` |
| Zayıf konu eşiği | 0,55 | `ML_WEAK_TOPIC_THRESHOLD` |
| Varsayılan AI modu | local | `AI_PROVIDER=local` |
| Bağlam teması (üretim) | 8 | `question_generate.py` |
| Sınıf aralığı | 1–12 | `gradeAwareQuestionTemplates.js` |

### 5.1.1. Otomatik puanlama tutarlılığı

Yapılandırılmış maddelerde `gradeQuestionAnswer` deterministiktir: aynı soru ve yanıt için tekrarlanan puanlama sonucu değişmez. Eşleştirme ve sıralama maddelerinde JSON etkileşim yükü doğrulanır.

### 5.1.2. Havuz tabanlı üretim

Üretim hattı uçtan uca çalışır: havuz örnekleme → Python dönüşüm → JS şablon → API yanıtı. İlkokul düzeyinde (`grade ≤ 4`) cebirsel sembol ve ileri geometri içeren havuz örnekleri `isSampleTooAdvancedForGrade` ile filtrelenir.

### 5.1.3. Konu analitiği

`examResultAnalysis` (`aiController.js`) konu bazlı doğru/yanlış, yavaş çözülen sorular (>60 sn) ve skor yüzdesini üretir. `AI_PROVIDER=local` iken metin analizi `localTextService` ile yapılır.

### 5.1.4. Bulut barındırma

Render free tier soğuk başlatma gecikmesi login akışında gözlemlenmiş; `backendWake.js` ve 60 sn auth timeout ile kullanıcı deneyimi iyileştirilmiştir.

## 5.2. Planlanan Pilot ve Psikometrik Bulgular

Etik kurul onayı ve okul pilotu tamamlandığında aşağıdaki analizler raporlanacaktır:

- Madde güçlüğü ($p$) ve ayırt edicilik ($r$) dağılımları  
- Test güvenirliği (Cronbach $\alpha$)  
- Öğretmen görüşmeleri: geri bildirim hızı, pedagojik uygunluk, etik algı  
- Klasik manuel değerlendirme ile otomatik puanlama uyumu  

*Bu aşamada raporlanacak sayısal bulgu bulunmamaktadır.*

## 5.3. Klasik Yöntemlerle Karşılaştırma (Kuramsal)

### Tablo 5.2. Karşılaştırma Çerçevesi

| Kriter | Klasik (kağıt/Excel) | Edumath |
|--------|----------------------|---------|
| Puanlama hızı | Manuel, sınırlı ölçek | Anlık, web tabanlı |
| Konu profili | Elle tablo | Otomatik konu etiketli |
| Madde üretimi | Tek tek yazım | Havuz tabanlı + onay |
| Şeffaflık | — | Açık kaynak, local AI |
| Psikometrik analiz | SPSS (harici) | Planlanan pilot export |

---

# 6. SONUÇ VE ÖNERİLER

## 6.1. Sentez

Edumath, matematik eğitiminde ölçme-değerlendirme süreçlerini **madde bankası — otomatik puanlama — konu analitiği — geri bildirim** zincirinde bütünleşik bir web platformu olarak modellemektedir. Tezin özgün katkısı, tam LLM bağımlılığı yerine **MEB uyumlu, şeffaf, havuz tabanlı yerel madde üretim hattı** ve beş yapılandırılmış madde tipinde otomatik puanlamadır.

Geliştirme aşamasında 3 katmanlı mimari, 18 API modülü, 7 örüntü alt kategorisi ve öğretmen/öğrenci kılavuzları tamamlanmıştır. Psikometrik pilot, tezin deneysel geçerliliğini sağlayacak bir sonraki adımdır.

## 6.2. Öneriler

- Pilot okul uygulaması ve etik kurul sürecinin tamamlanması  
- KTT analiz modülünün platforma veya dışa aktarım raporuna entegrasyonu  
- Açık uçlu NLP puanlama için literatür uyumlu pilot (Henkel vd., 2025)  
- Öğretmen hizmet içi eğitim: `docs/teacher-guide.md` temelli atölyeler  
- Hakemli dergi makalesi: “MEB uyumlu algoritmik madde üretimi” ekseni

## 6.3. Sınırlılıklar

- Pilot verisi ve psikometrik bulgular henüz yok  
- Serbest metin açık uçlu puanlama uygulanmamıştır  
- Render free tier kaynak sınırları performansı etkileyebilir  
- Örneklem genellenebilirliği pilot tasarıma bağlıdır

## 6.4. Gelecek Çalışmalar

- Derin öğrenme tabanlı açık uçlu puanlama (etik kurul + uzman kalibrasyonu ile)  
- Uzun dönem etki analizi (formatif geri bildirim → sonraki sınav performansı)  
- Farklı illerde çoklu okul karşılaştırması

---

# EK A — ÖĞRETMEN KULLANIM KILAVUZU

*(Tam metin: `docs/teacher-guide.md`)*

Öğretmen paneli akışları: soru bankası → sınav/egzersiz oluşturma → uygulama → rapor/ilerleme. Egzersiz oluşturucu **AI veya manuel mod → sınıf + konu → madde tipi** sırasını izler. Smart Paste ile OCR destekli madde girişi yapılır. Rapor ekranında ipucu istekleri zayıf konu planlaması için kullanılır.

---

# EK B — ÖĞRENCİ KULLANIM KILAVUZU

*(Tam metin: `docs/student-guide.md`)*

Öğrenci paneli akışları: ana sayfa → konu ağacı/quiz → sınav → Study Hub tekrar. Zayıf konu kartı mastery eşiği altındaki konuları gösterir. Sınavlarda süre sayacına dikkat edilmeli; sonuçlar öğretmen ayarına göre açılır.

---

# EK C — ML SERVİS UÇ NOKTALARI

| Endpoint | İşlev |
|----------|--------|
| `GET /health` | Sağlık + yetenek listesi |
| `POST /analyze/topics` | Zayıf konu sıralama |
| `POST /score/topics` | Konu skor detayı |
| `POST /questions/solve` | Örüntü sorusu çözümü |
| `POST /questions/parse` | OCR metni ayrıştırma |
| `POST /questions/enrich` | Madde zenginleştirme |
| `POST /questions/generate-from-pool` | Havuz tabanlı üretim |

---

# KAYNAKÇA

### Ulusal

Çavuş, M. N. (2024). Eğitimde yapay zekâ tabanlı ölçme ve değerlendirme üzerine bir derleme. *Uluslararası Özel Amaçlar İçin İngilizce Dergisi*.

Cumhur, F. (2024). Matematik eğitiminde yapay zekânın kullanımı. ResearchGate.

Kara, E. (2024). 21. yüzyıl matematik eğitiminde yapay zekâ: Teknolojik dönüşümde global stratejiler. *Çocuk ve Medeniyet Dergisi*.

Meylani, R. (2025). Matematik eğitiminde yapay zeka destekli değerlendirmeler: Çağdaş araştırma literatürünün sistematik biçimde incelenmesi. *Buca Eğitim Fakültesi Dergisi*, *66*, 3642–3674. https://dergipark.org.tr/tr/pub/befd

Millî Eğitim Bakanlığı. (2018). *Matematik dersi öğretim programı*. https://mufredat.meb.gov.tr

MEB/YEGİTEK. (2026). *Yapay zekâ araçları: Öğretmen el kitabı*. https://yegitek.meb.gov.tr

Nayıroğlu, B., & Tutak, T. (2024). Matematik öğretiminde yapay zekânın rolü: Eğitimde kullanılan araçların incelenmesi. *Turkish Journal of Educational Studies*.

Özkan, M., & Kaplan, M. S. (2025). Çözümünde yapay zeka. *Matematik Eğitimi Çalışmaları I*.

Saralar-Aras, H. G. (2025). 21. yüzyılda matematik öğretmeninin sırt çantası: Yapay zekâ ile web araçlarının matematik öğretiminde kullanımı. *Kuramdan Uygulamaya Sınıf İçi Uygulamalar*.

Seven, E. H., & Erümit, A. K. (2024). Matematik eğitiminde üretken yapay zekâ araçlarının incelenmesi. *Uşak Üniversitesi Eğitim Araştırmaları Dergisi*.

Tekin, H., & Ciğerci, F. M. (2025). Yapay zekâ destekli eğitim araçlarının ilkokul matematik öğretiminde kullanımına ilişkin öğretmen görüşleri. *Harran Maarif Dergisi*.

Yapay zekâ destekli madde üretimi psikometrik karşılaştırması. (2025). *Necmettin Erbakan Üniversitesi Ereğli Eğitim Fakültesi Dergisi*. https://dergipark.org.tr/tr/pub/neueefd/article/1775033

### Uluslararası

Agarwal, A. (2024). Artificial intelligence in educational assessment. *(Tam künye doğrulanacak.)*

Henkel, O., Horne-Robinson, H., Dyshel, M., Thompson, G., Abboud, R., Ch, N. A. N., Moreau-Pernet, B., & Vanacore, K. (2025). Learning to love LLMs for answer interpretation. *Journal of Learning Analytics*, *12*(1), 50–64. https://doi.org/10.18608/jla.2025.8621

Hermann, Z. (2021). Algorithmic opacity in AI-driven assessment. *(Tam künye doğrulanacak.)*

Kline, P. (2013). *Handbook of psychological testing* (2nd ed.). Routledge.

Lye, S. Y. (2024). Adaptive learning environments in mathematics education. *(Tam künye doğrulanacak.)*

Mooney, E. S. (2002). A framework for characterizing middle school students’ statistical thinking. *Mathematical Thinking and Learning*, *4*(1), 23–63.

Radford, L. (2008). Iconicity and consciousness. *Educational Studies in Mathematics*, *70*(3), 219–234.

Siemens, G., & Baker, R. S. (2012). Learning analytics and educational data mining. *LAK ’12*, 252–254.

Stacey, K. (1989). Finding and using patterns in algebra. *Australian Mathematics Teacher*, *45*(3), 12–16.

Tavşancıl, E. (2014). *Tutumların ölçülmesi ve SPSS ile veri analizi* (6. baskı). Nobel.

Xu, X., & Ouyang, F. (2022). AI in adaptive learning: A systematic review. *(Tam künye doğrulanacak.)*

Zhang, J., Wang, Y., Liu, H., & Chen, X. (2024). Automated scoring of constructed response items in math assessment using LLMs. *International Journal of Artificial Intelligence in Education*, *35*, 559–586. https://doi.org/10.1007/s40593-024-00418-w

### Proje kaynağı

Koç, B. (2026). *Edumath* [Kaynak kodu]. GitHub. https://github.com/Bahri26/edumath
