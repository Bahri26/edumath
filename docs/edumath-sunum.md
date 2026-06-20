# EDUMATH SUNUM — Bütünleşik Doküman

**Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi**

| | |
|---|---|
| **Tez araştırmacısı** | Emre İncekalan (2531745000) |
| **Matematik eğitimi** | Emre İncekalan |
| **Yazılım geliştirme** | Bahri KOÇ |
| **Kurum** | Anadolu Üniversitesi · Matematik Eğitimi (Doktora) |
| **Danışman** | Prof. Dr. Hüseyin Bahadır Yanık |
| **Platform** | Edumath — https://github.com/Bahri26/edumath |
| **Jüri sunumu (PDF)** | `docs/sunum-juri.pdf` — **projeksiyonda bunu kullanın** |
| **Hazırlık (sizin)** | `docs/edumath-sunum.md` / `.pdf` — konuşma, S&C, gap; **jüriye vermeyin** |
| **Tam anlatım metni** | `docs/doktora-sunum-anlatim.pdf` — **matematik + yöntem + yazılım** (derin referans; konuşma metni yok) |

---

## Doküman haritası

| Bölüm | İçerik | Sunumda kullanım |
|-------|--------|------------------|
| **I** | Hazırlık, **doktora savunma rehberi**, süre modları | Sunum öncesi |
| **II** | 23 slayt — yalnızca **EKRAN** metinleri | Kaynak; jüriye **`sunum-juri.pdf`** |
| **III** | Konuşma metinleri (5 / 15 / 30 dk) | Provada; PDF’de basılmaz |
| **IV** | Canlı gösterim + jüri soru-cevap | Sunum sırasında |
| **V** | PDF sunum rehberi | Sayfa geçişi, tam ekran |
| **VI** | Tez özeti (giriş, yöntem, bulgular planı) | Jüri derinlemesine sorular |
| **VII** | Gap analizi (taslak vs gerçek proje) | Dürüstlük / metodoloji |
| **VIII** | Teknik detay (mimari, modüller, API, kod) | Yazılım soruları |
| **IX** | **Matematik içeriği** (MEB, formüller, şablonlar, örnekler) | Matematik eğitimi soruları |
| **X** | Öğretmen kullanım kılavuzu (tam) | Pedagojik uygulama |
| **XI** | Öğrenci kullanım kılavuzu (tam) | Pedagojik uygulama |
| **XII** | Literatür sentezi + kaynakça | Teorik çerçeve |
| **XIII** | TIK raporu özeti + ilerleme | Komite sunumu |
| **XIV** | **Analiz, seviye belirleme, YZ soru üretimi** | Jüri teknik soruları |
| **XV** | **Jüri soru-cevap rehberi (bilimsel dil)** | S&C, savunma, prova |

> Eski ayrı dosyalar (`sunum-edumath-tik.md`, `teacher-guide.md` vb.) buraya taşındı. Güncelleme yaparken yalnızca bu dosyayı düzenlemeniz yeterli.

---

## Bu belgeyi nasıl okumalısınız?

Sunumu jüriye **`docs/sunum-juri.pdf`** ile yapın (yalnızca 23 slayt, iç not yok). Bu dosya (`edumath-sunum.md`) sizin hazırlık kitaplığınızdır: konuşma metni, S&C cevapları, gap analizi — **jüriye dağıtmayın veya projeksiyona yansıtmayın**.

**Savunma günü:** Projeksiyon = `sunum-juri.pdf` · Yanınızda = **`doktora-sunum-anlatim.pdf`** (tam metin) veya Bölüm II + Bölüm XV.

**Jüri “TensorFlow var mı?” derse:** Bölüm IV, tablo hazır.

**Tez yazarken:** Bölüm VI (özet), VII (gap), IX (matematik), XII (literatür).

**Öğretmen/öğrenci anlatımı:** Bölüm X–XI — bunlar uygulama kılavuzu; sunumda okumayın, “hazır” deyin.

### Dokümanın bilerek tekrar ettiği yerler

Aynı bilgi birkaç yerde geçiyor; bu kasıtlı. Slaytta bir cümle, arka planda on sayfa detay. Örneğin havuz hattı: Slayt 11’de demo, Bölüm VIII’de adım listesi, Bölüm XIV’te akış şeması. Sunumda üstteki kalır; soru gelince alttaki açılır.

### Hâlâ eksik veya zayıf kalan kısımlar

| Eksik | Durum | Öneri |
|-------|--------|--------|
| Ekran görüntüleri (`docs/sunum/`) | 6 PNG henüz eklenmemiş olabilir | Sunumdan önce canlı ekrandan alın |
| 15–30 dk tam konuşma metni | Bölüm III’te genişletildi | Provada kendi cümlelerinizle birleştirin |
| Pilot veri / KTT tabloları | Yok — bilerek | “Planlanıyor” deyin, rakam uydurmayın |
| Canlı gösterim yedeği | Yok | İnternet kesilirse PDF + ekran görüntüsü |
| Örüntü dışı konular (kesir, geometri…) | Kod altyapısı var, içerik az | Tezde “ilk odak örüntü” diye sınırlayın |
| Türkçe dersi (branş alanı) | Şema düzeyinde | Tez derinliği yalnızca matematik (örüntü) |
| İngilizce arayüz metinleri | TR/EN var | Sunumda TR gösterin |

---

# BÖLÜM I — HAZIRLIK

## Doktora tez savunması — nasıl yapılır?

> **Kaynaklar:** Anadolu Üniversitesi Lisansüstü Eğitim-Öğretim ve Sınav Yönetmeliği (MADDE 37); tez savunma rehberleri ([tezsunumu.com](https://www.tezsunumu.com/tez-sunumu-nasil-hazirlanir-jurinin-bekledigi-etkili-sunum-rehberi/), [mastertezmerkezi.com](https://mastertezmerkezi.com/tez-savunmasi-nedir/)). Aşağıdaki özet, Edumath sunumunu bu çerçeveye uyarlar.

### Resmî süreç (Anadolu Üniversitesi)

| Unsur | Düzenleme |
|-------|-----------|
| **Sınavın bileşeni** | Tez çalışmasının **sunulması** + **soru-cevap** (MADDE 37, f.6) |
| **Jüri** | 5 asıl + 2 yedek öğretim üyesi; en az **2 üye başka üniversiteden** (f.4) |
| **Ön koşul** | En az **3 tez izleme komitesi raporu**; danışman “savunulabilir” görüşü (f.2–3) |
| **Tez teslimi → savunma** | Teslimden sonra en geç **1 ay** içinde (f.1, f.6) |
| **Oturum** | Öğretim elemanları ve dinleyicilere **açık**; karar dinleyicilere **kapalı** (f.6–7) |
| **Sonuç** | Salt çoğunlukla **kabul / ret / düzeltme** (f.7) |

Yönetmelik sunum **dakika** sayısı vermez; pratikte doktora savunmaları **25–40 dk anlatım + 30–60 dk S&C** sürer. Slayt sayısı genelde **25–35**; kural: **~1 slayt ≈ 1 dakika**, metin yığını değil anahtar nokta.

### Jürinin beklediği mantık

Akademik savunma, tezin özetini şu sorulara cevap vererek anlatır:

1. **Neyi, neden** çalıştınız? (problem, boşluk, önem)
2. **Nasıl** çalıştınız? (yöntem, evren, veri, analiz)
3. **Ne buldunuz?** (bulgular — DBR tezlerinde tasarım çıktısı + doğrulama)
4. **Ne anlama geliyor?** (tartışma, katkı, sınırlılık)
5. **Sırada ne var?** (öneriler, pilot)

**Slaytları tezden kopyalamayın;** jüri tezi okumuştur. Sunum, tezin **hikâyesi** ve **özgün katkı** vurgusudur.

### Klasik savunma yapısı ↔ Edumath slaytları

| Klasik bölüm (jüri beklentisi) | Slayt | Süre (25 dk plan) |
|-------------------------------|-------|-------------------|
| Kapak | 1 | 0,5 dk |
| Sunum planı | 2 | 0,5 dk |
| Problem durumu | 3 | 1,5 dk |
| Amaç ve araştırma soruları | 4 | 1,5 dk |
| Kapsam, evren, sınırlılık (erken) | 5 | 1,5 dk |
| Literatür özeti / boşluk | 6 | 2 dk |
| Kuramsal çerçeve | 7 | 2 dk |
| **Yöntem** — içerik (MEB) | 8 | 2 dk |
| **Yöntem** — ölçme döngüsü (DBR artefakt) | 9 | 1,5 dk |
| **Yöntem / tasarım** — mimari | 10 | 1,5 dk |
| **Bulgular (tasarım)** — üretim hattı ⭐ | 11 | 3–4 dk |
| Bulgular — puanlama, analitik | 12–13 | 2 dk |
| Yöntem — ML servis | 14 | 1 dk |
| Uygulama (pedagojik geçerlilik) | 18–21 | 3 dk |
| Tartışma — YZ etiği | 22 | 1,5 dk |
| Bulgular — teknik doğrulama | 15 | 1,5 dk |
| Tamamlanan / planlanan | 16 | 1 dk |
| Sınırlılıklar ve öneriler | 17 | 1,5 dk |
| Sonuç, katkı, teşekkür → **S&C** | 23 | 1 dk |

**DBR notu:** Tezinizde “bulgu” henüz büyük ölçüde **tasarım tabanlı araştırma çıktısı** (Edumath platformu) ve **teknik doğrulama**dır. Empirik pilot (KTT, α) **planlanan** aşamadır — bunu Slayt 4, 20–21’de açık söyleyin; jüri bunu olumsuz değil, **dürüst** bulur.

### Savunma günü — adım adım

| Saat | Ne yapılır |
|------|------------|
| **−15 dk** | Salon, projeksiyon, PDF (Slayt 1), Render hesabı, su |
| **Açılış** | “Sayın jüri üyeleri, değerli dinleyiciler…” → Slayt 1 → kısa teşekkür danışmana |
| **Sunum** | 25–30 dk; slayt **okumayın**, EKRAN’a işaret edip Bölüm III’ten konuşun |
| **Canlı gösterim** | Slayt 11’de isteğe bağlı 3–4 dk; olmazsa ekran görüntüsü |
| **Kapanış** | Slayt 23 → “Dinlediğiniz için teşekkür ederim; sorularınızı memnuniyetle yanıtlarım.” |
| **S&C** | 30–60 dk; kısa cevap, savunma değil diyalog; bilmediğinizi “pilot sonrası ele alacağız” deyin |
| **Kapalı oturum** | Jüri karar verirken siz dışarıda bekleyebilirsiniz |

### S&C’de davranış (özet)

| Durum | Ne yapın |
|-------|----------|
| Anladığım soru | 30–60 sn; Slayt no veya Bölüm XV’ye atıf |
| Agresif / eleştirel soru | Sakin kalın; “Haklı bir nokta; sınırlılık olarak Slayt 17’de de belirttim…” |
| Bilmediğiniz teknik detay | “Tez metninde / Bölüm VIII’de var; özetlersem…” |
| Uydurma istatistik | **Vermeyin** — “Empirik veri henüz yok; pilot planı Slayt 16.” |
| TensorFlow / %97 | Bölüm IV tablosu — kısa, net hayır |

### Yedek slaytlar (PDF’de atlayarak açın)

Jüri derinlemesine sorarsa aynı PDF’den ilgili bölüme gidin; ayrı dosya gerekmez:

| Soru türü | PDF’de aç |
|-----------|-----------|
| Gap / dürüstlük | Bölüm VII |
| Kod, API, mimari | Bölüm VIII |
| MEB formül, örnek | Bölüm IX |
| Puanlama, üretim akışı | Bölüm XIV |
| 40 hazır cevap | Bölüm XV |

### Giyim ve üslup

Resmî–akademik giyim; net ve saygılı Türkçe; **yapay zekâ**, **ölçme-değerlendirme** yazımına dikkat (aşağıdaki tablo). Slayt başına en fazla **5 madde**; arka sıradan okunabilir boyut (PDF Times New Roman 12 pt — projeksiyonda yakınlaştırın).

---

## Sunum süre modları

| Mod | Süre | Slaytlar | Ne zaman |
|-----|------|----------|----------|
| **Doktora savunması** ⭐ | **25–30 dk** + S&C | **1–23** | **Tez savunma sınavı** |
| Kısa (TIK / izleme) | ~5 dk | 1, 3, 5, 8, 9, 11, 20, 21, 23 | Komite, TIK |
| Standart | ~15 dk | 1–17, 20–23 | Ara prova |
| Tam + derinlik | 35–40 dk | 1–23 + Bölüm VII özeti | Danışman provası |
| Teknik derinlik | +10 dk | 10–14, 19 | Yazılım odaklı jüri |
| Matematik odaklı | +10 dk | 8, Bölüm IX | Mat. eğit. jüri |
| Savunma / S&C provası | +30–60 dk | **XV** | Savunma öncesi son prova |

## Kontrol listesi (savunma günü)

- [ ] Tez son hali jüriye iletildi (danışman onayı)
- [ ] Turnitin / intihal raporu tamam
- [ ] En az 3 tez izleme raporu dosyada
- [ ] Render canlı ortam (soğuk başlatma 1–2 dk)
- [ ] Öğretmen gösterim hesabı
- [ ] `docs/sunum/` ekran görüntüleri (6 adet)
- [ ] **`docs/sunum-juri.pdf`** tam ekran (jüriye yalnızca bu)
- [ ] `docs/edumath-sunum.md` hazırlık — jüriye **açmayın**
- [ ] Bölüm III **25–30 dk savunma** metni (kağıt veya ikinci ekran)
- [ ] Bölüm XV S&C — en az bir kez baştan okundu
- [ ] GitHub linki hazır
- [ ] Resmî kıyafet

## Ekran görüntüleri

| Dosya | Slayt | Konu |
|-------|-------|------|
| `01-mimari.png` | 10 | Üç katmanlı mimari |
| `02-soru-bankasi.png` | 18 | Öğretmen soru bankası |
| `03-uretim-hatti.png` | 11 | Havuz tabanlı üretim (canlı gösterim) |
| `04-egzersiz-akisi.png` | 19 | Sınıf+konu+tip |
| `05-ogrenci-sonuc.png` | 12 | Otomatik puanlama |
| `06-ogretmen-rapor.png` | 13 | Konu / zayıf alan |

## Beş ezber cümle

Bunları kendi kelimelerinizle söyleyebilirsiniz; özü aynı kalsın yeter:

1. Edumath bir “web sitesi” değil — ölçme-değerlendirme sürecinin dijital karşılığı.
2. Platform ilkokul–lise matematik için; tez Anadolu Üniversitesi’nde yürütülüyor, hedef kitle K–12.
3. Asıl katkımız: havuzdan esinlenen, şeffaf, sınıf düzeyine duyarlı soru üretim hattı.
4. Bugün psikometrik pilot rakamı sunmuyorum; etik kurul ve okul pilotu sırada.
5. Sinir ağı yok — yerel kural ve şablonlar. “Yapay zekâ” dediğimiz şey aslında deterministik motordur.

## Türkçe yazım (sunumda)

| Tercih | Not |
|--------|-----|
| yapay zekâ | TDK: zekâ (â ile) |
| ölçme-değerlendirme | Birleşik kavram; tireli |
| soğuk başlatma | “Cold-start” yerine (Render gecikmesi) |
| çoktan seçmeli, doğru/yanlış | “MCQ”, “D/Y” yerine slaytta |
| matematik | Orta cümlede küçük harf; “Matematik Eğitimi” özel ad |

Platformda Türkçe **branş alanı** tanımlıdır; tez içerik derinliği **matematik örüntü** kazanımlarıyla sınırlıdır (Slayt 5).

## Sunum günü — ters giderse

- **Render uyanmıyor:** 1–2 dakika bekleyin; giriş ekranında kalın, “soğuk başlatma” deyin — jüri anlar.
- **AI üretim hata verirse:** Havuzdan elle bir soru seçip “üretim hattının çıktısı bu” diye gösterin.
- **İnternet yok:** PDF slaytları + GitHub linki + ekran görüntüleri yeterli; canlı gösterim şart değil.
- **“TensorFlow?” sorusu:** Bölüm IV tablosu — kısa cevap: hayır, NumPy ve kural tabanı.

---

# BÖLÜM II — SUNUM (23 SLAYT · DOKTORA SAVUNMASI)

> Her slayt: **EKRAN** (jüriye gider) · **AÇIKLAMA** (vurgu notu) · **KONUŞMA** (sözlü metin — jüriye gitmez)  
> Jüri PDF: `python scripts/build_juri_sunum.py`

---

## Bölüm A — Giriş (Slayt 1–7)

---

## Slayt 1 — Kapak `[Giriş]`

**EKRAN**
- **Anadolu Üniversitesi** · Lisansüstü Eğitim Enstitüsü · Matematik Eğitimi Anabilim Dalı
- **Tez başlığı:** Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi
- **Tez araştırmacısı:** Emre İncekalan (2531745000)
- **Matematik eğitimi / kuram:** Emre İncekalan
- **Yazılım geliştirme:** Bahri KOÇ
- **Danışman:** Prof. Dr. Hüseyin Bahadır Yanık
- **Artefakt:** Edumath Web Platformu · github.com/Bahri26/edumath

**AÇIKLAMA**  
Kapak slaytı: kurum, tez başlığı, araştırmacı, danışman ve geliştirilen artefakt (Edumath) bir bakışta görülmeli. Jüri tezin resmî kimliğini ve platform adını buradan alır.

**KONUŞMA** *(~30 sn)*  
Sayın jüri başkanı, sayın jüri üyeleri, değerli dinleyiciler. Ben Emre İncekalan. Anadolu Üniversitesi Lisansüstü Eğitim Enstitüsü Matematik Eğitimi doktora programında, danışmanım Prof. Dr. Hüseyin Bahadır Yanık ile yürüttüğüm tez kapsamında geliştirilen Edumath platformunu sunacağım. Platformun yazılımını Bahri KOÇ geliştirmiştir; matematik eğitimi kuramı, MEB müfredat eşlemesi ve ölçme-değerlendirme modeli benim tez çalışmamdır. Tez başlığım, matematik eğitiminde yapay zekâ destekli ölçme-değerlendirme süreçlerinin bütünleşik modellenmesidir. Sunumda önce problemi ve yöntemi, ardından bugüne kadar elde ettiğimiz bulguları paylaşacağım.

*(→ Slayt 2)*

---

## Slayt 2 — Sunum planı (tez savunması) `[Giriş]`

**EKRAN**

**Savunma akışı (≈25–30 dk + S&C)**

| Aşama | Slayt | İçerik |
|-------|-------|--------|
| Giriş | 1–7 | Problem, amaç, literatür, kuram, yöntem özeti |
| Yöntem | 8–14 | MEB içerik, döngü, mimari, üretim hattı, puanlama |
| **Bulgular** | **15–16** | Teknik doğrulama; tamamlanan / planlanan |
| Sınırlılık | 17 | Dürüstlük: pilot henüz yok |
| Uygulama | 18–21 | Öğretmen/öğrenci arayüzü (pedagojik geçerlilik) |
| Tartışma | 22 | YZ etiği |
| Sonuç | 23 | Katkı + teşekkür → **S&C** |

**AÇIKLAMA**  
Jüriye sunumun yol haritasını verin: klasik tez savunması sırası (giriş → yöntem → bulgular → sınırlılık → uygulama → tartışma → sonuç). Toplam süreyi (25–30 dk + S&C) hatırlatın.

**KONUŞMA** *(~45 sn)*  
Sunumu jürinin beklediği akışla ilerleteceğim. Önce problem, amaç ve literatür; ardından yöntem ve Edumath tasarımı; sonrasında bugüne kadar elde edilen bulgular ve sınırlılıklar; en son öğretmen–öğrenci uygulama yüzü ve etik tartışma. Bulguları yöntemden hemen sonra sunuyorum; çünkü tasarım tabanlı araştırmada önce artefaktın ne kanıtladığını, sonra sahadaki kullanım modelini ayırmak istedim. Yaklaşık yirmi beş–otuz dakikalık anlatımın ardından sorularınızı yanıtlamaya hazırım.

*(→ Slayt 3)*

---

## Slayt 3 — Problem durumu

**EKRAN**

| Geleneksel ölçme | Edumath yanıtı |
|------------------|----------------|
| Bireysel geri bildirim gecikir | Anlık otomatik puanlama |
| Konu profili elle tutulur | Konu/kazanım etiketli analitik |
| Madde üretimi zaman alır | Havuz tabanlı algoritmik üretim |
| YZ opaklığı (Meylani, 2025) | Denetlenebilir yerel kurallar |

**AÇIKLAMA**  
Tablodaki dört satır, geleneksel ölçmenin dört zorluğunu ve Edumath’ın her birine verdiği yanıtı özetler. Meylani (2025) atfı etik boyutu güçlendirir.

**KONUŞMA** *(~1,5 dk)*  
Problem durumu şudur: K–12 matematik öğretiminde ölçme-değerlendirme süreci, otuz–kırk kişilik sınıflarda bireyselleştirilmiş geri bildirim üretmekte yetersiz kalabilmektedir. Öğretmen hangi öğrencinin hangi kazanımda zorlandığını sürekli izleyemez; madde üretimi zaman alır; geri bildirim gecikir. Yapay zekâ bu süreci hızlandırma vaadi taşır; ancak Meylani’nin sistematik derlemesi, kapalı ve denetlenemeyen algoritmaların pedagojik güven sorunu yarattığını göstermektedir. Edumath, hız ile şeffaflık arasında denetlenebilir bir denge kurmayı hedefler: otomatik puanlama, konu etiketli analitik, havuz tabanlı madde üretimi — hepsi yerel kurallarla açıklanabilir olmalıdır.

*(→ Slayt 4)*

---

## Slayt 4 — Araştırma amacı ve soruları

**EKRAN**

**Amaç:** MEB (2018) uyumlu, şeffaf YZ destekli ölçme-değerlendirme platformu tasarlamak ve geliştirmek.

| Kod | Araştırma sorusu | Durum |
|-----|------------------|-------|
| AS1 | Bütünleşik YZ platformları ölçmeyi nasıl dönüştürür? | Kuramsal + teknik |
| AS2 | Otomatik puanlama + konu profili formatif değerlendirmeye katkı? | Platform hazır; pilot bekliyor |
| AS3 | Havuz tabanlı üretim vs üretken YZ ayrışması? | Hattı geliştirildi |
| AS4 | Pilot sonrası KTT (p, r, α)? | **Planlanan** |

**AÇIKLAMA**  
Tez amacını tek cümleyle söyleyin; dört araştırma sorusunun hangilerinin bugün yanıtlandığını, AS4’ün neden “planlanan” olduğunu vurgulayın. Psikometrik rakam sunmayın.

**KONUŞMA** *(~1,5 dk)*  
Tezin amacı, MEB (2018) uyumlu, şeffaf yapay zekâ destekli bir ölçme-değerlendirme platformu tasarlamak ve geliştirmektir. Dört araştırma sorumuz vardır. AS1, bütünleşik platformların ölçmeyi nasıl dönüştürdüğünü kuramsal ve teknik düzeyde ele alır — bu çerçeve oturmuştur. AS2, otomatik puanlama ve konu profilinin formatif değerlendirmeye katkısını sorar; platform hazır, okul pilotu bekliyor. AS3, havuz tabanlı üretim ile üretken yapay zekâ ayrışmasını inceler; üretim hattı geliştirilmiştir. AS4, pilot sonrası madde analizi ve güvenirliktir — p, r, α. Bugün AS4 için sayı sunmuyorum; etik kurul onayı sonrası yürütülecek pilotun bilimsel dürüstlük gereği ön koşuludur.

*(→ Slayt 5)*

---

## Slayt 5 — Tez kapsamı ve uygulama evreni

**EKRAN**

| Boyut | Tanım |
|-------|--------|
| Tez yürütüldüğü yer | AU Matematik Eğitimi Doktora |
| Platform hedef kitlesi | 1.–12. sınıf K–12 matematik |
| Branş alanı (platform) | Matematik (tez derinliği); Türkçe, Fen vb. şema düzeyinde |
| Birincil konu odağı | Örüntüler (MEB 2018) |
| Yöntem | Karma yöntem + DBR |
| Pilot | Geliştirme tamam; okul pilotu planlanıyor |

**AÇIKLAMA**  
Tez yürütüldüğü yer (AU) ile platform evreni (K–12) ayrımını netleştirin. Türkçe/Fen şema düzeyinde; tez derinliği örüntüde.

**KONUŞMA** *(~1,5 dk)*  
Burada kritik bir ayrım var: tez Anadolu Üniversitesi’nde yürütülmektedir; platform ise üniversite öğrenci sınav sistemi değil, ilkokul–lise matematik ölçme ortamıdır. Hedef kitle birinci–on ikinci sınıf K–12 öğretmen ve öğrencileridir. Veritabanında Türkçe, Fen Bilgisi gibi branş alanları şema düzeyinde tanımlıdır; tez kapsamında içerik derinliği yalnızca MEB örüntü kazanımlarındadır. Yöntem karma yöntem ve tasarım tabanlı araştırmadır. Platform geliştirme tamamlanmıştır; okul pilotu ve psikometrik analiz planlanmaktadır.

*(→ Slayt 6)*

---

## Slayt 6 — Literatürdeki boşluk

**EKRAN**

| Alan | Literatür | Edumath konumu |
|------|-----------|----------------|
| YZ değerlendirme | Meylani, 2025 — etik gerilim | Bütünleşik + şeffaf |
| Üretken YZ | Seven & Erümit, 2024 | Havuz + öğretmen onayı |
| Otomatik puanlama | Çavuş, 2024 | 5 yapılandırılmış tip |
| Örüntü/cebir | Radford, 2008; Stacey, 1989 | 7 alt kategori |
| LLM puanlama | Henkel, 2025 | Gelecek katman |
| Öğretmen algısı | Tekin & Ciğerci, 2025 | Kılavuz + panel (plan) |

**AÇIKLAMA**  
Literatürün parçalı olduğunu ve Edumath’ın bütünleşik konumunu gösterin. Seven & Erümit ile öğretmen onayı vurgusu önemli.

**KONUŞMA** *(~2 dk)*  
Literatürde yapay zekâ destekli değerlendirme, üretken soru üretimi, otomatik puanlama ve öğrenme analitiği çoğu zaman ayrı çalışmalarda ele alınmaktadır. Biri puanlar, biri soru üretir, biri raporlar — zincir parçalıdır. Meylani, yapay zekâ destekli değerlendirmede etik gerilimi hatırlatır. Seven ve Erümit, üretken yapay zekâda uzman denetimini vurgular. Edumath bu parçaları tek platformda birleştirir. Üretken dil modeline doğrudan bağımlılık yerine havuz tabanlı üretim tercih edilmiş; öğretmen onayı zorunludur. Örüntü ve erken cebir literatürü — Radford, Stacey — pedagojik içeriğe dayanak sağlar.

*(→ Slayt 7)*

---

## Slayt 7 — Kuramsal çerçeve ve araştırma yöntemi `[Giriş / Yöntem]`

**EKRAN**

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

**AÇIKLAMA**  
Üç kuramsal halkayı (KTT, formatif, analitik) ve DBR’yi açıklayın. Yöntem tablosundaki “tamamlanan / planlanan” ayrımını sözlü vurgulayın.

**KONUŞMA** *(~2 dk)*  
Kuramsal çerçevede üç halka birleşir: klasik test teorisinin madde düzeyi analizleri — p, r, α — pilot sonrası uygulanacaktır; formatif değerlendirmenin süreç odaklı anlık geri bildirimi; öğrenme analitiğinin öğretmene karar desteği. Bunlar tasarım tabanlı araştırma ile Edumath artefaktına bağlanır. Yöntem olarak karma desen kullanılmıştır. Tamamlanan veri: teknik doğrulama, yirmi üç test dosyası, canlı ortam. Planlanan veri: okul pilotu, sınav ve egzersiz kayıtları, öğretmen görüşmeleri; analiz KTT ve nitel tema analizi ile yürütülecektir.

*(→ Slayt 8)*

---

## Bölüm B — Yöntem: pedagojik içerik (Slayt 8–9)

---

## Slayt 8 — Matematik içeriği: MEB örüntü (7 alt kategori)

**EKRAN**

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

**AÇIKLAMA**  
Yedi alt kategoriyi “etiket değil, kodda tanımlı içerik” olarak sunun. Bir örnek verin (ör. aritmetik dizi veya 5, 9, 13, 17).

**KONUŞMA** *(~2 dk)*  
Ölçme içeriğimiz MEB Matematik Öğretim Programı’ndaki örüntü kazanımlarına hizalıdır. Yedi alt kategori yalnızca sınıflandırma etiketi değildir: geometrik şekil tekrarı, aritmetik dizi, kare ve üçgensel sayılar, eşleştirme ve sıralama — her birinin kazanım metni, üretim şablonu veya yerel çözücü algoritması kodda tanımlıdır. Örneğin sabit adımlı sayı örüntüsünde aₙ = a₁ + (n−1)d formu hem üretim hem doğrulama için kullanılır. Radford ve Stacey’nin erken cebirsel genelleme vurgusu, bu dikey yapıda izlenebilir.

*(→ Slayt 9)*

---

## Slayt 9 — Edumath ölçme-değerlendirme döngüsü

**EKRAN**

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

**AÇIKLAMA**  
Beş adımlı döngüyü saat yönünde anlatın. Formatif değerlendirme bağlantısını kurun.

**KONUŞMA** *(~1,5 dk)*  
Edumath bir modül yığını değil; kapalı bir ölçme-değerlendirme döngüsüdür. Öğretmen madde üretir veya seçer; sınav veya egzersiz uygular; sistem otomatik puanlar; konu profili ve zayıf alan analitiği çıkarır; Study Hub ve öğretmen raporu ile müdahale planlanır. Döngü formatif değerlendirme perspektifinden, öğrenme sürecine yönelik veri temelli geri bildirim sağlar. Her adım bir sonrakine veri aktarır; kopuk araçlar değildir.

*(→ Slayt 10)*

---

## Bölüm C — Yöntem: tasarım ve geliştirme (Slayt 10–14)

---

## Slayt 10 — Mimari (3 katman)

**EKRAN**

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

**GÖRSEL:** `01-mimari.png`

**AÇIKLAMA**  
Üç katmanı ve endişelerin ayrılmasını anlatın. Varsayılan yerel yapay zekâ (`AI_PROVIDER=local`) vurgusu.

**KONUŞMA** *(~1,5 dk)*  
Mimari, endişelerin ayrılması ilkesine dayanır. React tabanlı web arayüzü sunum katmanıdır; Node.js ve MongoDB iş mantığı ve veriyi taşır; Python FastAPI servisi sayısal üretim ve skorlamayı yapar. Pedagojik parametreler ML kodundan bağımsız güncellenebilir. Canlı ortam Render’da üç servis olarak çalışmaktadır. Varsayılan yapay zekâ sağlayıcısı yerel motordur; dış API zorunlu değildir.

*(→ Slayt 11)*

---

## Slayt 11 — Özgün katkı: havuz tabanlı madde üretimi ⭐ CANLI GÖSTERİM

**EKRAN**

```
MongoDB havuz (≤12 metin örneği)
    → ml-service: generate-from-pool (sayı varyasyon + şablon)
    → JS fallback (gradeAwareQuestionTemplates)
    → Yerel çözücü: anahtar doğrulama
    → Öğretmen önizleme & ONAY
    → Soru bankası / sınav / egzersiz
```

- Birebir kopya yok · Sınıf filtresi · İlkokulda cebir engeli · 8 bağlam teması

**GÖRSEL:** `03-uretim-hatti.png` · **→ CANLI GÖSTERİM (isteğe bağlı)**

**AÇIKLAMA**  
Tezin özgün katkısı. Akışı adım adım izleyin. İsteğe bağlı canlı gösterim: Soru bankası → üret → önizle → onay. Sinir ağı / LLM yok vurgusu.

**KONUŞMA** *(~2–4 dk · canlı gösterim isteğe bağlı)*  
Tezin metodolojik özgünlüğü burada yoğunlaşır. Onaylı madde havuzundan — en fazla on iki metin örneği — esinlenerek yeni soru üretilir; sayılar ve bağlam varyasyonu uygulanır; yerel çözücü cevap anahtarını doğrular; öğretmen önizlemeden geçirmeden madde öğrenciye gitmez. Birebir kopya yoktur; sınıf filtresi vardır; ilkokulda sembolik cebir engellenir. Üretken dil modeline doğrudan bağımlılık yoktur. *(Canlı gösterim: tarayıcıda soru bankası → yapay zekâ destekli üretim → bir madde önizleme. Site uyanmazsa ekran görüntüsü yeterli.)*

*(→ Slayt 12)*

---

## Slayt 12 — Otomatik puanlama (5 yapılandırılmış tip)

**EKRAN**

| Tip | Kod | Puanlama |
|-----|-----|----------|
| Çoktan seçmeli | `multiple-choice` | Metin eşleme |
| Doğru/yanlış | `true-false` | Metin eşleme |
| Boşluk doldurma | `fill-blank` | Metin eşleme |
| Eşleştirme | `matching` | Tam çift eşleşmesi |
| Sıralama | `sequence` | Doğru adım sırası |

**Formül:** Puan = Σ 1(aᵢ = kᵢ) · `questionGrading.js`

**GÖRSEL:** `05-ogrenci-sonuc.png`

**AÇIKLAMA**  
Beş madde tipini sayın. Açık uçlu NLP’nin bilinçli olarak dışarıda bırakılma gerekçesini (Henkel) belirtin. Deterministik puanlama = KTT için tekrarlanabilir veri.

**KONUŞMA** *(~1,5 dk)*  
Otomatik puanlama beş yapılandırılmış madde tipini kapsar: çoktan seçmeli, doğru–yanlış, boşluk doldurma, eşleştirme ve sıralama. Açık uçlu doğal dil puanlaması bilinçli olarak kapsam dışıdır; Henkel ve arkadaşlarının rapor ettiği güvenirlik sorunları nedeniyle yapılandırılmış tipler tercih edilmiştir. Puanlama deterministiktir: aynı yanıt her zaman aynı puanı alır. Bu, pilot sonrası madde analizine girecek verinin tekrarlanabilirliğini destekler.

*(→ Slayt 13)*

---

## Slayt 13 — Konu profili ve zayıf alan analitiği

**EKRAN**

**Veri kaynakları:** Sınav · Egzersiz · Ödev · Ders quiz · Öğrenme olayları

```
accuracy = doğru / toplam
priorityScore = (1 − mastery) × (0,6 + 0,4 × volumeNorm)
isWeak = mastery < 0,55
```

**Soğuk başlatma:** Veri yoksa müfredat konuları öneri listesi

**GÖRSEL:** `06-ogretmen-rapor.png`

**AÇIKLAMA**  
priorityScore ve 0,55 eşiğini sade dille açıklayın. Eşiğin tasarım parametresi olduğunu, pilot sonrası kalibre edileceğini söyleyin.

**KONUŞMA** *(~1,5 dk)*  
Analitik katman, öğrencinin sınav, egzersiz, ödev ve ders quizinden bıraktığı izleri konu bazında birleştirir. Ustalık oranı doğru bölü toplam ile hesaplanır. Öncelik skoru, hem düşük ustalığı hem yeterli deneme hacmini dikkate alır. 0,55 eşiği zayıf konu için tasarım parametresidir; pilot sonrası kalibre edilecektir. Henüz veri yoksa sistem boş kalmaz; sınıf müfredatından öneri sunar — buna soğuk başlatma diyoruz.

*(→ Slayt 14)*

---

## Slayt 14 — ML servis (edumath-local)

**EKRAN**

| Endpoint | İşlev |
|----------|--------|
| `POST /analyze/topics` | Zayıf konu sıralama |
| `POST /questions/generate-from-pool` | Havuz tabanlı üretim |
| `POST /questions/solve` | Örüntü çözümü (7 tip; anahtar doğrulama) |
| `POST /questions/parse-text` | OCR metin ayrıştırma |
| `POST /questions/analyze` | Konu / zorluk / **MEB alt konu** tahmini |
| `POST /questions/enrich` | parse + analyze + solve (tek çağrı) |

**Motor:** edumath-local v0.2.1 — sinir ağı yok; NumPy + kural tabanı

**MEB 7 alt konu — ML kapsamı**

| Alt konu | ML çözücü | ML üretim | Not |
|----------|-----------|-----------|-----|
| Geometrik (şekil) | Kısmen | Evet | SVG şekil örüntüleri Node tarafında |
| Sayı (sabit adım) | Evet | Evet | |
| Sayı (karma kural) | Evet | Evet | two_step |
| Kare sayılar | Evet | Evet | |
| Üçgensel sayılar | Evet | Evet | |
| Eşleştirme | — | — | Etkileşimli; yalnızca Node |
| Sıralama (adımlar) | — | — | Etkileşimli; yalnızca Node |

**AÇIKLAMA**  
“ML servis” adının sinir ağı anlamına gelmediğini net söyleyin. Etkileşimli iki alt konunun Node’da kaldığını ve fallback mekanizmasını kısaca belirtin.

**KONUŞMA** *(~1 dk)*  
ML servis adı teknik bir etikettir; arkada eğitilmiş sinir ağı yoktur. Zayıf konu sıralama, havuz tabanlı üretim, yedi yerel çözücü tipi, OCR ayrıştırma ve MEB alt konu tahmini burada çalışır; temel NumPy ve kural tabanıdır. Eşleştirme ve sıralama gibi etkileşimli maddeler Node şablonlarında kalır. Servis kapalıysa Node.js tarafında eşdeğer yedek devreye girer; platform çalışmaya devam eder.

*(→ Slayt 15)*

---

## Bölüm D — Bulgular (Slayt 15–16)

---

## Slayt 15 — Bulgular: teknik doğrulama `[Bulgular]`

**EKRAN**

| Bulgu | Kanıt |
|-------|-------|
| Deterministik puanlama | `questionGrading.js` testleri |
| Uçtan uca üretim hattı | Canlı Render ortamı |
| Sınıf filtresi | İlkokul cebir engeli doğrulandı |
| Modüler mimari | 18 API, 20+ model |
| Test kapsamı | 23 frontend test dosyası + ml-service pytest (10 test) |
| Açık kaynak | github.com/Bahri26/edumath |

**Not:** DBR aşamasında bulgular **tasarım çıktısı + teknik doğrulama** düzeyindedir.

**AÇIKLAMA**  
Bugün sunulabilir bulgular = teknik doğrulama. Pedagojik etki iddiası yok. Tablodaki her satırı kısaca yorumlayın.

**KONUŞMA** *(~1,5 dk)*  
Bulgular bölümüne geçiyorum. Tasarım tabanlı araştırma aşamasında bugün sunulan bulgular, tasarım çıktısı ve teknik doğrulama düzeyindedir. Deterministik puanlama testlerle doğrulanmıştır; üretim hattı uçtan uca canlı ortamda çalışmaktadır; ilkokulda cebir filtresi test edilmiştir; mimari modülerdir; açık kaynak olarak yayımlanmıştır. Pedagojik etki ve psikometrik geçerlilik iddiasını okul pilotu sonrasına bırakıyoruz — bu bilinçli bir sınırdır.

*(→ Slayt 16)*

---

## Slayt 16 — Bulgular: tamamlanan vs planlanan `[Bulgular]`

**EKRAN**

| Tamamlandı ✓ | Planlanıyor ○ |
|--------------|---------------|
| Edumath platform (3 servis) | Etik kurul izni |
| Havuz tabanlı üretim hattı | Okul pilotu |
| 5 tip otomatik puanlama | KTT: p, r, α |
| 7 örüntü alt kategorisi | Öğretmen görüşmeleri |
| Öğretmen/öğrenci kılavuzları | Hakemli makale |
| Teknik doğrulama | Empirik bulgular bölümü |

**AÇIKLAMA**  
Sol sütun = savunulabilir; sağ sütun = plan. AS4 ile bağlantı kurun.

**KONUŞMA** *(~1 dk)*  
Tamamlanan ve planlanan işleri net ayırıyorum. Sol sütunda platform, üretim hattı, puanlama, yedi örüntü alt kategorisi, kılavuzlar ve teknik doğrulama tamamlanmıştır. Sağ sütunda etik kurul izni, okul pilotu, KTT analizi, öğretmen görüşmeleri, hakemli makale ve empirik bulgular bölümü planlanmaktadır. AS4’ün yanıtı pilot sonrası gelecektir.

*(→ Slayt 17)*

---

## Bölüm E — Tartışma: sınırlılıklar (Slayt 17)

---

## Slayt 17 — Sınırlılıklar ve öneriler `[Tartışma]`

**EKRAN**

1. Empirik pilot ve psikometrik analiz henüz yok  
2. Açık uçlu madde / NLP puanlaması yok  
3. Birincil içerik odağı: örüntü  
4. Render ücretsiz katmanında soğuk başlatma gecikmesi  
5. Zayıf konu eşiği (0,55) henüz kalibre edilmemiş  
6. Genellenebilirlik okul pilotuna bağlı  

**Öneriler:** Etik kurul → okul pilotu → KTT kalibrasyonu → öğretmen görüşmeleri

**AÇIKLAMA**  
Sınırlılıkları gizlemeyin; en kritik olanı sözlü vurgulayın (psikometrik kanıt yok). Öneriler sırasını kısaca okuyun.

**KONUŞMA** *(~1,5 dk)*  
Sınırlılıkları açıkça belirtiyorum. Birincisi, empirik pilot ve psikometrik analiz henüz yoktur — en kritik sınırlılık budur. Açık uçlu madde puanlaması bilinçli olarak kapsam dışıdır. İçerik derinliği örüntü kazanımlarında yoğunlaşmıştır; bu tez kapsamı tercihidir, platformun mutlak sınırı değildir. Zayıf konu eşiği henüz kalibre edilmemiştir. Önerilen yol: etik kurul → okul pilotu → KTT kalibrasyonu → öğretmen görüşmeleri.

*(→ Slayt 18)*

---

## Bölüm F — Uygulama: pedagojik geçerlilik (Slayt 18–21)

---

## Slayt 18 — Öğretmen paneli akışı `[Uygulama]`

**EKRAN**

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

**GÖRSEL:** `02-soru-bankasi.png` · *(Bölüm X)*

**AÇIKLAMA**  
Öğretmen yolculuğunu soldan sağa anlatın. Branş onayının ölçme tutarlılığındaki rolünü vurgulayın.

**KONUŞMA** *(~1 dk)*  
Öğretmen tarafında akış şöyledir: branş onayı sonrası konu filtreleri sabitlenir; soru bankasından veya üretimden madde seçilir; Smart Paste ile kağıt kaynak aktarılabilir; sınav veya egzersiz oluşturulup yayınlanır; sonuç ve zayıf alan raporları incelenir. Branş onayı, ölçme hedefinin tutarlı kalmasını destekler. Öğretmen her aşamada pedagojik kontrolü elinde tutar.

*(→ Slayt 19)*

---

## Slayt 19 — Egzersiz oluşturma (3 adım) `[Uygulama]`

**EKRAN**

| Adım | Seçim | Not |
|------|-------|-----|
| 1 | Yapay zekâ destekli **veya** manuel | Havuzdan veya üretimden |
| 2 | Sınıf + konu | 1.–12.; MEB örüntü alt konuları |
| 3 | Madde tipi | Çoktan seçmeli, doğru/yanlış, boşluk, eşleştirme, sıralama |

Zorluk bandı formdan **kaldırıldı** — ölçme hedefi: konu + tip

**GÖRSEL:** `04-egzersiz-akisi.png`

**AÇIKLAMA**  
Üç adımlı egzersiz akışını formatif ölçme bağlamında açıklayın. Zorluk bandının kaldırılma gerekçesi: hedef = konu + tip.

**KONUŞMA** *(~1 dk)*  
Egzersiz modülü formatif uygulama içindir. Üç adım: kaynak seçimi — yapay zekâ destekli veya manuel; sınıf ve MEB örüntü alt konusu; madde tipi — çoktan seçmeli, doğru–yanlış, boşluk, eşleştirme, sıralama. Paket düzeyinde zorluk bandı zorunluluğu kaldırılmıştır; ölçme hedefi konu ve tip ile netleştirilir. Zorluk bilgisi seçilen maddelerin metadata’sında korunur.

*(→ Slayt 20)*

---

## Slayt 20 — Öğrenci deneyimi `[Uygulama]`

**EKRAN**

```
Ana sayfa → Konu ağacı / ders quiz → Sınav (tek teslim)
    → Sonuç → Study Hub (zayıf konu tekrarı)
```

| Bileşen | İşlev |
|---------|--------|
| Konu ağacı | Sınıf düzeyine uygun ilerleme |
| Study Hub | Eşik altı konular, tekrar |
| Mesajlar | Öğretmen duyuruları |

**AÇIKLAMA**  
Öğrenci döngüsünü anlatın; Study Hub’ı formatif geri bildirimin öğrenci yüzü olarak konumlandırın.

**KONUŞMA** *(~1 dk)*  
Öğrenci ana sayfadan konu ağacı veya ders quize girer; sınavda tek teslim kuralı vardır; sonuç ekranı anında gelir. Study Hub, analitik katmanın tespit ettiği zayıf konulara yönelik tekrar sunar. Böylece ölçme döngüsü öğrenci tarafında geri bildirimle kapanır; formatif değerlendirme zinciri tamamlanır.

*(→ Slayt 21)*

---

## Slayt 21 — Smart Paste ve madde girişi `[Uygulama]`

**EKRAN**

```
Kağıt / PDF / ekran görüntüsü → Tesseract OCR (tur+eng)
    → question_parse.py → Form alanları dolar
    → Öğretmen düzenler → Onay → Havuza eklenir
```

**AÇIKLAMA**  
Smart Paste’in öğretmen yükünü azaltma rolü; otomatik ≠ onay otomatik değil vurgusu.

**KONUŞMA** *(~45 sn)*  
Smart Paste, öğretmenin kağıt, PDF veya ekran görüntüsündeki soruyu OCR ile metne çevirip form alanlarına aktarmasını sağlar. Ayrıştırma otomatiktir; psikometrik ve pedagojik onay otomatik değildir — öğretmen her alanı kontrol eder ve onaylar. Bu modül, havuz tabanlı üretimin beslenmesini hızlandırır.

*(→ Slayt 22)*

---

## Bölüm G — Tartışma ve sonuç (Slayt 22–23)

---

## Slayt 22 — YZ yaklaşımı: şeffaflık ve etik `[Tartışma]`

**EKRAN**

| | Yerel motor (varsayılan) | Opsiyonel Gemini |
|--|--------------------------|------------------|
| Soru üretimi | Havuz + şablon | **Aynı hattı** |
| Puanlama | Deterministik kural | Değişmez |
| Metin analizi | Şablon | LLM özeti |
| Etik | Kod incelenebilir | Fallback yerel |

**AÇIKLAMA**  
Yerel motor vs opsiyonel Gemini tablosunu yorumlayın. “Yapay zekâ destekli” ifadesinin anlamını netleştirin.

**KONUŞMA** *(~1,5 dk)*  
Yapay zekâ yaklaşımına gelince: varsayılan yerel motordur. Soru üretimi havuz ve şablondan; puanlama deterministik kuraldan yapılır; kod incelenebilir. Gemini yalnızca ikincil katmandır — metin özeti gibi görevler için; soru üretim hattını değiştirmez. “Yapay zekâ destekli” ifadesi, kapalı bir dil modeline bağımlılık değil, ölçme sürecinin denetlenebilir algoritmik otomasyonu anlamındadır. Meylani’nin algoritmik opaklık eleştirisine yanıt: kurallar açık, öğretmen onayı zorunlu.

*(→ Slayt 23)*

---

## Slayt 23 — Sonuç, teşekkür ve S&C `[Sonuç]`

**EKRAN**

**Üç katkı:**
1. K–12 ölçme-değerlendirme zincirinin bütünleşik dijital modeli  
2. MEB uyumlu havuz tabanlı, denetlenebilir madde üretim hattı  
3. Kapalı LLM yerine şeffaf yerel algoritmik alternatif  

**Depo:** github.com/Bahri26/edumath  

**Teşekkür:** Danışmanım Prof. Dr. Hüseyin Bahadır Yanık’a, yazılım geliştiricisi Bahri KOÇ’a, jüri üyelerine ve dinleyicilere.  

**Soru-cevap:** Dinlediğiniz için teşekkür ederim; sorularınızı memnuniyetle yanıtlarım.

**AÇIKLAMA**  
Üç katkıyı tek cümleyle özetleyin; teşekkür; S&C daveti. Uzatmayın.

**KONUŞMA** *(~1 dk)*  
Sonuç olarak üç katkı sunuyorum: birincisi, K–12 ölçme-değerlendirme zincirinin bütünleşik dijital modeli; ikincisi, MEB uyumlu havuz tabanlı denetlenebilir madde üretim hattı; üçüncüsü, kapalı büyük dil modeli yerine şeffaf yerel algoritmik alternatif. Platform açık kaynak olarak github.com/Bahri26/edumath adresinde yayımlanmıştır; yazılım Bahri KOÇ tarafından geliştirilmiştir. Danışmanım Prof. Dr. Hüseyin Bahadır Yanık’a, Bahri KOÇ’a, jüri üyelerine ve dinleyicilere teşekkür ederim. Dinlediğiniz için teşekkürler; sorularınızı memnuniyetle yanıtlarım.

*(→ Soru-cevap)*

---

# BÖLÜM III — KONUŞMA METİNLERİ

> **Konuşma metinleri:** Her slayt altında **AÇIKLAMA** (ne vurgulanır) ve **KONUŞMA** (söylenecek metin, süreli) vardır — Bölüm II. Aşağıdaki özet modlar prova içindir.

## 5 dakika (TIK)

Sayın hocam, değerli jüri üyeleri.

Ben Emre İncekalan, Anadolu Üniversitesi Matematik Eğitimi doktora programındayım. Edumath platformunu sunuyorum.

**[Slayt 3]** Ölçme-değerlendirme sürecinde bireyselleştirilmiş geri bildirim, büyük sınıflarda pedagojik bir gerekliliktir; Meylani (2025) kapalı algoritmaların güven sorununu hatırlatır. Edumath denetlenebilir yerel kurallar sunar.

**[Slayt 5]** Tez AU’da yürütülüyor; platform K–12 matematik içindir. Birincil odak MEB örüntü kazanımlarıdır.

**[Slayt 8–9]** Yedi alt kategori kodda formülle tanımlıdır. Edumath, madde üretiminden müdahaleye uzanan bütünleşik bir ölçme döngüsüdür.

**[Slayt 11]** Özgün katkı: havuz tabanlı madde üretim hattı; öğretmen onayı zorunlu.

**[Slayt 15–16]** Platform tamamlandı; pilot ve KTT planlanıyor. Bugün psikometrik rakam sunmuyorum.

Teşekkür ederim.

---

## 15 dakika (standart sunum)

**Slayt 1–2 (1 dk)** — Giriş; savunma planı (Giriş → Yöntem → Bulgular → Uygulama → Sonuç).

**Slayt 3–5 (2,5 dk)** — Problem, AS1–AS4, tez kapsamı.

**Slayt 6–7 (2 dk)** — Literatür; kuram + yöntem özeti (DBR).

**Slayt 8–9 (2,5 dk)** — MEB 7 alt kategori; ölçme döngüsü.

**Slayt 10–11 (2,5 dk + gösterim)** — Mimari; havuz hattı.

**Slayt 12–14 (2 dk)** — Puanlama, analitik, ML servis.

**Slayt 15–17 (2,5 dk)** — Bulgular, tamamlanan/planlanan, sınırlılık.

**Slayt 18–22 (2,5 dk)** — Uygulama (öğretmen/öğrenci), etik.

**Slayt 23 (0,5 dk)** — Sonuç, teşekkür → S&C.

---

## 25–30 dakika (doktora tez savunması) ⭐

> **Hedef süre:** 27 dk anlatım + teşekkür. Prova yaparken kronometre kullanın. Parantez = slayt geçişi.

Sayın jüri başkanı, sayın jüri üyeleri, değerli dinleyiciler.

Ben Emre İncekalan. Anadolu Üniversitesi Matematik Eğitimi doktora programında, danışmanım Prof. Dr. Hüseyin Bahadır Yanık ile yürüttüğüm tez kapsamında geliştirilen Edumath platformunu sunacağım; yazılım Bahri KOÇ, matematik kuramı ve müfredat eşlemesi Emre İncekalan. *(Slayt 1)*

Sunumu klasik tez savunması akışıyla ilerleteceğim: problem ve amaç, literatür ve kuram, yöntem, bulgular, tartışma ve sonuç. *(Slayt 2)*

**(Slayt 3 — Problem, ~1,5 dk)**  
K–12 matematik öğretiminde ölçme-değerlendirme süreci, sınıf ölçeğinde bireyselleştirilmiş geri bildirim üretmekte yetersiz kalabilmektedir. Yapay zekâ hız vaat eder; ancak Meylani’nin sistematik derlemesi, kapalı algoritmaların pedagojik güven sorunu yarattığını göstermektedir. Edumath, hız ile şeffaflık arasında denetlenebilir bir denge kurmayı hedefler.

**(Slayt 4 — Amaç ve sorular, ~1,5 dk)**  
Tezin amacı, MEB (2018) uyumlu, şeffaf yapay zekâ destekli bir ölçme-değerlendirme platformu tasarlamak ve geliştirmektir. Dört araştırma sorumuz vardır. AS1–AS3 için kuramsal çerçeve oturmuş ve platform geliştirilmiştir. AS4 — madde analizi ve güvenirlik — etik kurul onayı sonrası okul pilotu ile yanıtlanacaktır. Bugün AS4 için sayı sunmuyorum; bu bilimsel dürüstlük gereğidir.

**(Slayt 5 — Kapsam, ~1,5 dk)**  
Kritik ayrım: tez Anadolu Üniversitesi’nde yürütülmektedir; platform üniversite sınav sistemi değil, ilkokul–lise matematik ölçme ortamıdır. Birincil içerik odağı MEB örüntü kazanımlarıdır. Veritabanında Türkçe ve diğer branş alanları tanımlıdır; tez derinliği yalnızca matematik örüntüsündedir.

**(Slayt 6–7 — Literatür ve kuram, ~4 dk)**  
Literatür parçalıdır: biri puanlar, biri soru üretir, biri raporlar. Edumath bu zinciri tek platformda birleştirir. Kuramsal olarak klasik test teorisinin madde düzeyi analizleri, formatif değerlendirme ve öğrenme analitiği, tasarım tabanlı araştırma çerçevesinde birleştirilmiştir.

**(Slayt 8–9 — Yöntem: içerik ve döngü, ~3,5 dk)**  
Ölçme içeriğimiz yedi MEB örüntü alt kategorisine hizalıdır; her birinin formülü veya çözücüsü kodda tanımlıdır. Edumath kapalı bir ölçme döngüsüdür: madde üretimi, uygulama, puanlama, analitik, müdahale.

**(Slayt 10–11 — Tasarım ve özgün katkı, ~4 dk)**  
Mimari üç katmandır: web, API, ML servis. Tezin metodolojik özgünlüğü, havuz tabanlı madde üretim hattında yoğunlaşır — onaylı havuzdan esinlenme, yerel çözücü, öğretmen onayı. *(İsteğe bağlı 2–3 dk canlı gösterim veya ekran görüntüsü.)*

**(Slayt 12–14 — Puanlama ve analitik, ~3 dk)**  
Beş yapılandırılmış madde tipi deterministik puanlanır. Konu profili ve zayıf alan analitiği formatif geri bildirimi destekler. ML servis adı teknik bir etikettir; sinir ağı yoktur.

**(Slayt 15–17 — Bulgular ve sınırlılık, ~4 dk)**  
Bugün sunulan bulgular teknik doğrulama düzeyindedir: deterministik puanlama, uçtan uca üretim hattı, modüler mimari. Empirik pilot planlanmaktadır. Sınırlılıkları gizlemiyoruz.

**(Slayt 18–21 — Pedagojik uygulama, ~3 dk)**  
Öğretmen ve öğrenci akışları, egzersiz modülü ve Smart Paste ile platformun sahadaki kullanım modeli özetlenmektedir.

**(Slayt 22 — Tartışma / etik, ~1,5 dk)**  
“Yapay zekâ destekli” ifadesi, kapalı LLM bağımlılığı değil, denetlenebilir algoritmik otomasyon anlamındadır.

**(Slayt 23 — Sonuç, ~1 dk)**  
Üç katkı: bütünleşik dijital ölçme modeli, MEB uyumlu havuz tabanlı üretim hattı, şeffaf yerel algoritmik alternatif. Danışmanıma, jüri üyelerine ve dinleyicilere teşekkür ederim. Sorularınızı memnuniyetle yanıtlarım.

---

## 30 dakika (tam sunum + ek derinlik)

Slayt 1–23 (yukarıdaki 25–30 dk metin) + Slayt 11’de **5–7 dk canlı gösterim** (Bölüm IV tablosu) + isteğe bağlı Bölüm VII gap özeti (2 dk, sözlü).

**S&C provası:** Bölüm XV — en az 10 soruyu yüksek sesle yanıtlayın (30–45 dk).

---

## Bilimsel anlatım — slayt geçiş cümleleri

Sunumda aşağıdaki cümleleri doğrudan veya uyarlayarak kullanabilirsiniz. Amaç: günlük dil ile akademik dil arasında köprü kurmak.

**Problem (Slayt 3):**  
“Ölçme-değerlendirme sürecinde bireyselleştirilmiş geri bildirim, sınıf ölçeğinde pedagojik bir gerekliliktir; ancak geleneksel uygulamalarda öğretmenin bilişsel yükü bu gerekliliği karşılamayı zorlaştırmaktadır.”

**Literatür (Slayt 6):**  
“Literatür, yapay zekâ destekli değerlendirme araçlarının parçalı biçimde geliştiğini; bütünleşik bir ölçme modelinin ise hem metodolojik hem etik açıdan henüz yeterince ele alınmadığını göstermektedir.”

**Kuram (Slayt 7):**  
“Edumath, klasik test teorisinin madde düzeyi analizleri, formatif değerlendirme ilkeleri ve öğrenme analitiğinin karar destek işlevini tek bir tasarım tabanlı araştırma (DBR) çerçevesinde bütünleştirmeyi hedeflemektedir.”

**Özgün katkı (Slayt 11):**  
“Tezin metodolojik özgünlüğü, üretken dil modellerine doğrudan bağımlılık yerine; onaylı madde havuzundan türetilen, sınıf düzeyine duyarlı, denetlenebilir bir madde üretim hattının modellenmesinde yatmaktadır.”

**Sınırlılık (Slayt 17):**  
“Empirik geçerlilik kanıtları — güvenirlik, ayırt edicilik ve etki analizleri — etik kurul onayı sonrası yürütülecek okul pilotu ile elde edilecektir; bugün sunulan bulgular teknik doğrulama düzeyindedir.”

---

# BÖLÜM IV — CANLI GÖSTERİM VE JÜRİ S&C

> **Kapsamlı soru-cevap:** Bölüm XV — 40 soru ve model cevap. Savunma öncesi en az bir tam S&C provası yapın.

## Soru-cevap protokolü (doktora savunması)

| Kural | Uygulama |
|-------|----------|
| **Süre** | Sunumdan sonra **30–60 dk**; jüri başkanı yönetir |
| **Cevap uzunluğu** | 30–90 sn; uzatırsanız “Özetlersem…” deyin |
| **Duruş** | Ayakta veya oturarak; jüriye göz teması |
| **Tezle çelişme** | Sunum = tezin özeti; fark varsa teze sadık kalın |
| **Bilmiyorum** | “Pilot aşamasında ele alacağız” — uydurmayın |
| **Eleştiri** | Savunmacı değil, bilimsel diyalog: “Haklı bir nokta…” |
| **Yedek** | Derin soruda PDF’den Bölüm VII–IX, XIV, XV’ye atlayın |

**Sık jüri odakları (doktora):** özgünlük · yöntem gerekçesi (DBR, karma) · evren–örneklem ayrımı · bulgu–yorum tutarlılığı · etik · genellenebilirlik · sınırlılık dürüstlüğü

## Canlı gösterim (Slayt 11 sonrası, 3–5 dk)

Canlı demo her zaman risklidir. Slayt 11’de anlattıktan hemen sonra geçin.

| # | Ekran | Süre | Ne söylersiniz |
|---|-------|------|----------------|
| 1 | Öğretmen giriş | 30 sn | “Render ücretsiz planda uykuya geçiyor; ilk istek yavaş.” |
| 2 | Soru bankası filtreleri | 45 sn | “Sınıf, konu, zorluk — havuz buradan daralıyor.” |
| 3 | AI üretim → 1 madde (Slayt 11 demo) | 1,5 dk | “Havuzdan esinlenerek; kopya değil; onay şart.” |
| 4 | Egzersiz: sınıf+konu+tip (Slayt 19) | 1 dk | “Formatif uygulama; konu+tip hedefi.” |
| 5 | Öğrenci sonuç (Slayt 12) | 1 dk | “Deterministik puanlama.” |
| 6 | Rapor / zayıf konu (Slayt 13) | 45 sn | “priorityScore; eşik 0,55.” |

**Demo yedek planı:** Canlı site açılmazsa `docs/sunum/` ekran görüntülerini Slayt 10–13 sırasıyla gösterin.

## Jüri soruları — hızlı referans

Ayrıntılı bilimsel cevaplar için **Bölüm XV**’ye bakın.

| Soru | Kısa cevap |
|------|------------|
| TensorFlow / sinir ağı? | Hayır. Deterministik kural tabanı; NumPy ve şablon motoru. |
| %97 doğruluk? | Empirik veri yok; eski taslaktan kaldırıldı. |
| Neden LLM ile soru üretimi yok? | Şeffaflık, MEB uyumu, maliyet; havuz hattı tercih edildi. |
| AU öğrencileri mi? | Uygulama evreni K–12; tez AU Matematik Eğitimi doktora programında. |
| Cronbach otomatik mi? | Hayır; pilot sonrası SPSS/Python ile analiz planlandı. |
| Özgün katkı? | Bütünleşik platform + havuz tabanlı madde hattı + MEB örüntü taksonomisi. |

---

# BÖLÜM V — PDF SUNUM REHBERİ (DOKTORA SAVUNMASI)

Sunumu jüriye **`docs/sunum-juri.pdf`** ile yapın. **25–30 dk** anlatım + **S&C**. Hazırlık dosyası (`edumath-sunum.pdf`) projeksiyona **yansıtmayın**.

## Savunma günü akışı

1. PDF tam ekran → **Slayt 1** (kapak)
2. Bölüm III **“25–30 dk doktora savunması”** metnini ikinci ekranda veya kağıtta tutun
3. Slayt 11’de isteğe bağlı canlı site (3–5 dk); olmazsa `03-uretim-hatti.png`
4. Slayt 23 → teşekkür → jüri soruları
5. S&C’de Bölüm XV’den kısa cevaplar; derin soruda PDF’de Bölüm VII–IX, XIV

## Hazırlık

1. Slayt metnini `edumath-sunum.md` Bölüm II’de güncelleyin
2. Jüri PDF’ini üretin: `python scripts/build_juri_sunum.py`
3. **`sunum-juri.pdf`** tam ekran — Slayt 1’den başlayın
4. Konuşma + S&C: `edumath-sunum.md` Bölüm III ve XV (ikinci ekran veya kağıt)

## Slayt geçişi

| PDF’de ara | Hedef |
|------------|-------|
| `Slayt 1` | Kapak |
| `Slayt 11` | Canlı gösterim (Render açık olmalı) |
| `Slayt 23` | Kapanış → S&C |

Her slayt başlığı (`## Slayt N`) yeni sayfada başlar. Alt slayt numaralarını okuyucunun yer imlerine ekleyebilirsiniz.

## Görsel yerleşimi

- Ekran görüntüleri `docs/sunum/` klasöründe; PDF’te dosya adı referansı vardır
- Canlı site açıksa Slayt 11’de tarayıcıya geçin; açılmazsa `03-uretim-hatti.png` yeterli

## Yazım ve dil

- Sunum metninde **yapay zekâ** (TDK: zekâ), **ölçme-değerlendirme** (tireli) kullanın
- Teknik kod adları (`questionGrading.js`) slaytta kalabilir; jüriye sözlü açıklayın
- Türkçe dersi platform şemasında vardır; tez odak noktası **matematik örüntü**dür — Slayt 5’te belirtilmiştir

## PDF yenileme

```powershell
cd c:\Projects\edumath-main
python scripts/md_to_pdf.py docs/edumath-sunum.md
```

Dosya açıkken “Permission denied” alırsanız PDF’i kapatıp komutu tekrarlayın.

---

# BÖLÜM VI — TEZ ÖZETİ

## Giriş ve amaç

21. yüzyılda dijitalleşme ölçme-değerlendirmeyi dönüştürüyor; geleneksel yöntemler büyük sınıflarda bireysel geri bildirimde yetersiz kalabiliyor (Nayıroğlu & Tutak, 2024). YZ nesnellik ve ölçeklenebilirlik sunarken kapalı LLM bağımlılığı pedagojik ve etik risk taşıyor (Meylani, 2025).

**Tezin amacı:**
1. YZ destekli ölçme-değerlendirmeyi kuramsal ve uygulamalı incelemek
2. MEB (2018) uyumlu şeffaf Edumath platformu geliştirmek
3. Pilot ve psikometrik analizle geçerliliği sınamak *(planlanan)*

## Kavramsal tanımlar

| Kavram | Tanım |
|--------|--------|
| Otomatik puanlama | Yapılandırılmış yanıtların kural tabanlı değerlendirilmesi |
| Havuz tabanlı üretim | Havuzdan esinlenerek birebir kopya olmayan madde |
| Zayıf konu | mastery < 0,55 |
| Öğrenme analitiği | Veriden pedagojik karar desteği |

## Yöntem

**Karma yöntem + DBR.** Nicel (planlanan): sınav/egzersiz, p, r, α. Nicel (tamamlanan): teknik doğrulama, 23 test dosyası. Nitel (planlanan): öğretmen görüşmesi.

**Evren:** K–12 öğretmen/öğrenci. **Etik:** AU Etik Kurulu izni alınacak.

## Bulgular — ne sunulabilir?

**Şimdi (teknik):** Üretim hattı çalışır; grading deterministiktir; sınıf filtresi ilkokulda cebir engeller; Render cold-start iyileştirmesi.

**Pilot sonrası:** p, r, α; öğretmen temaları; performans etkisi.

**Sunulmamalı:** %97 doğruluk, %12 artış, α=0,81 — empirik veri yok.

---

# BÖLÜM VII — GAP ANALİZİ (TASLAK VS GERÇEK PROJE)

## Ana mesaj

Eski `tez_taslak.md` genel bir YZ şablonuydu. Edumath gerçekliği TIK raporu ve kod tabanıyla uyumludur. **Tez yürütüldüğü yer ≠ uygulama evreni:** AU doktora · K–12 platform.

## Yanlış veya abartılı iddialar

| Eski taslak iddiası | Gerçek durum |
|---------------------|--------------|
| TensorFlow.js | **Yok.** FastAPI + NumPy + kural/şablon |
| Karar ağacı / sinir ağı hata analizi | **Yok.** Eşik tabanlı zayıf konu skoru |
| NLP kosinüs açık uçlu puanlama | **Yok.** 5 yapılandırılmış tip |
| Pandas / Scikit-learn analitik | sklearn requirements’ta; **kodda kullanılmıyor** |
| Cronbach α platformda otomatik | **Yok.** Pilot sonrası SPSS/Python |
| %97 doğruluk, %12 artış, α=0,81 | **Uydurma.** Kaldırıldı |
| Etik kurul alındı | **Alınacak** |
| AU öğrencilerinde uygulandı | **Pilot planlanıyor** |
| CSV sınav yükleme ana akış | Web içi sınav + Smart Paste |
| ML model eğitimi | Havuz tabanlı algoritmik üretim |

## Taslakta eksik kalan gerçek çalışmalar

- Üç katmanlı Render deploy (`render.yaml`)
- Havuz tabanlı üretim hattı (özgün katkı)
- Smart Paste / Tesseract OCR
- Egzersiz: sınıf + konu + madde tipi (zorluk bandı kaldırıldı)
- `AI_PROVIDER=local` varsayılan
- `backendWake.js` cold-start
- Öğretmen/öğrenci kılavuzları + uygulama içi GuideDrawer
- 7 MEB örüntü alt kategorisi + kazanım metinleri

## Yapısal düzeltmeler (tez metni için)

1. Yinelenen bölümleri birleştir
2. LaTeX `\text{}` hatalarını düzelt
3. Bulgular: teknik vs empirik ayrımı
4. Kaynakçayı Bölüm XII ile hizala

---

# BÖLÜM VIII — TEKNİK DETAY

> **Yazar:** Bahri KOÇ — platform mimarisi, API, modüller, dağıtım, teknik doğrulama

## 8.1 Teknoloji yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19, Vite, Tailwind, KaTeX, TR/EN |
| Backend | Node.js, Express, Mongoose, JWT |
| Veritabanı | MongoDB (`Edumath`) |
| ML | Python 3, FastAPI, NumPy v0.2.0 |
| OCR | Tesseract.js (tur+eng) |
| Opsiyonel LLM | Gemini (`AI_PROVIDER` ≠ local) |
| Deploy | Render: edumath-api, edumath-ml, edumath-web |

## 8.2 API route modülleri (18)

`auth` · `admin` · `teacher` · `student` · `exam` · `exercise` · `question` · `topic` · `lesson` · `progress` · `assignment` · `survey` · `message` · `notification` · `ai` · `chat` · `patternTemplate` · `user`

## 8.3 Modül — dosya — ölçme işlevi

| Modül | Bileşen | İşlev |
|-------|---------|--------|
| Soru bankası | `QuestionBank.jsx`, `Question` | MEB etiketli havuz, onay |
| Smart Paste | `SmartPasteModal`, Tesseract, `question_parse.py` | OCR → yapılandırılmış madde |
| Sınavlar | `TeacherExamsPage`, `examRoutes.js` | Otomatik puan, konu raporu |
| Egzersiz | `TeacherExerciseCreator.jsx`, `exerciseController.js` | Sınıf+konu+tip paketi |
| Havuz üretim | `poolBasedQuestionGeneratorService.js` | DB → ml → JS şablon |
| Zayıf konu | `weak_topics.py`, `WeakTopicsInsightCard` | priorityScore, eşik 0,55 |
| Raporlar | `TeacherReports.jsx`, `aiController.teacherReport` | Sınıf/konu, ipucu istekleri |
| Study Hub | `StudentStudyHub.jsx` | Zayıf konu tekrarı |
| Admin | `AdminDashboard`, audit log | Yönetim |

## 8.4 ML servis endpoint’leri

| Endpoint | İşlev |
|----------|--------|
| `GET /health` | Durum + yetenek listesi |
| `POST /analyze/topics` | Zayıf konu sıralama |
| `POST /score/topics` | Konu skor detayı |
| `POST /questions/generate-from-pool` | Havuz tabanlı üretim |
| `POST /questions/solve` | Örüntü çözümü |
| `POST /questions/parse` | OCR metni ayrıştırma |
| `POST /questions/enrich` | Madde zenginleştirme |
| `POST /questions/analyze` | Madde analizi |

## 8.5 Madde tipleri ve puanlama

| Tip | `Question.type` | Grading |
|-----|-----------------|---------|
| Çoktan seçmeli | `multiple-choice` | Metin eşleme |
| Doğru/yanlış | `true-false` | Metin eşleme |
| Boşluk doldurma | `fill-blank` | Metin eşleme |
| Eşleştirme | `matching` | `gradeMatchingAnswer` |
| Sıralama | `sequence` | `gradeSequenceAnswer` |

Kaynak: `backend/utils/questionGrading.js`

## 8.6 Havuz üretim hattı (adım adım)

1. `fetchQuestionPoolRows` — MongoDB konu/sınıf filtreli örnekler
2. `POST /questions/generate-from-pool` — Python sayı/kural dönüşümü, 8 tema
3. `gradeAwareQuestionTemplates.js` — sınıf filtresi, ilkokul cebir engeli
4. `isSampleTooAdvancedForGrade` — program dışı içerik filtre
5. Öğretmen onayı → banka / sınav / egzersiz

## 8.7 Örüntü alt kategorileri (MEB)

| # | Etiket | Kazanım özeti |
|---|--------|----------------|
| 1 | Geometrik (şekil) | Tekrar eden şekil örüntüsü |
| 2 | Sayı (sabit adım) | Aritmetik artış |
| 3 | Sayı (karma kural) | Ardışık farklı işlemler |
| 4 | Kare sayılar | Kare sayı dizisi |
| 5 | Üçgensel sayılar | Üçgensel dizi |
| 6 | Eşleştirme | Türlerine göre sınıflama |
| 7 | Sıralama | Çözüm adımları sırası |

Kaynak: `backend/constants/patternTopics.js`

## 8.8 Ortam değişkenleri (Render)

| Değişken | Değer / anlam |
|----------|----------------|
| `AI_PROVIDER` | `local` (prod varsayılan) |
| `ML_WEAK_TOPIC_THRESHOLD` | `0.55` |
| `VITE_AUTH_TIMEOUT_MS` | `60000` (cold start) |
| `JWT` access | 15 dk |
| MongoDB | `Edumath` |

## 8.9 Teknik envanter (sunum rakamları)

| Gösterge | Değer |
|----------|-------|
| Deploy servisi | 3 |
| API modülü | 18 |
| Mongoose modeli | 20+ |
| ML sürüm | 0.2.0 |
| Otomatik puanlanan tip | 5 |
| Örüntü alt kategorisi | 7 |
| Frontend test dosyası | 23 |
| Bağlam teması (üretim) | 8 |

---

# BÖLÜM IX — MATEMATİK İÇERİĞİ VE ÖLÇME MATRİSİ

> **Yazar:** Emre İncekalan — MEB müfredatı, örüntü kazanımları, formüller, sınıf bantları, pedagojik ölçme

Sunumda Slayt 11’i anlatırken elinizin altında olsun diye yazdım. Jüri matematik eğitiminden geliyorsa burası soru yağmurunun düştüğü bölüm — formüller ve sınıf bantları hazır.

## 9.1 Platform matematik kapsamı

Edumath’ın kalbi matematik. Veritabanında başka branş alanları da var ama asıl emek “Örüntüler” konusuna gitti: seed verisi, üretim şablonları, MEB etiketleri hep oraya bağlı.

| Boyut | Kapsam |
|-------|--------|
| Branş | Matematik (ana) |
| Ana konu ailesi | Örüntü oluşturma ve analiz etme |
| Sınıf aralığı | 1.–12. sınıf (`Question.classLevel`) |
| Zorluk | Kolay · Orta · Zor |
| Madde tipi | 5 (MCQ, D/Y, boşluk, eşleştirme, sıralama) |
| MEB referansı | Matematik Öğretim Programı (2018) — `MEB_REF` sabiti |

**Tez bağlantısı:** Platform, K–12 matematik öğretiminde ölçme sürecini modellemek için tasarlanmıştır; doktora çalışması AU Matematik Eğitimi programında yürütülmektedir — platform hedef kitlesi ilkokul–lise öğrencileridir.

---

## 9.2 Sınıf düzeyine göre müfredat eşlemesi (1–12)

Kaynak: `frontend/src/data/curriculumData.js` — her sınıf için başlık, alt konular, kazanımlar ve değerlendirme biçimi tanımlıdır.

| Sınıf | Kademe | Örüntü odağı | Örnek alt konular |
|-------|--------|--------------|-------------------|
| 1 | İlkokul — Başlangıç | Nesne/şekil örüntüsü | Renk örüntüleri, geometrik dizilim |
| 2 | İlkokul — Temel | Artan/azalan | Ritmik sayma, şekil–sayı ilişkisi |
| 3 | İlkokul — Orta | Kural keşfi | İki adımlı kurallar, tablo örüntüsü |
| 4 | İlkokul — İleri | Matematiksel ilişki | En çok iki işlemli diziler, gerçek hayat modeli |
| 5 | Ortaokul — Giriş | Aritmetik dizi | Sabit fark, adım–sayı tablosu |
| 6 | Ortaokul — Temel | Cebirsel ifade | Genel terim (n), harfle kural |
| 7 | Ortaokul — Orta | Doğrusal ilişki | Koordinat, değişim oranı |
| 8 | Ortaokul — LGS | Sayı dizileri | Karesel/üçgensel, yeni nesil |
| 9 | Lise — Mantık | Fonksiyonel modelleme | Veri analizi, tahmin |
| 10 | Lise — Dizi | Aritmetik/geometrik | Terim ilişkileri, model kurma |
| 11 | Lise — AYT | Diziler ve seriler | Genel terim, toplam sembolü (Σ) |
| 12 | Lise — İleri | Limit, sonsuz diziler | Fibonacci, fraktal |

**Kod–müfredat köprüsü:** `gradeAwareQuestionTemplates.js` ve `question_generate.py` içindeki `isSampleTooAdvancedForGrade` / `_is_sample_too_advanced` fonksiyonları, havuz örneklerinin sınıf düzeyine uygunluğunu denetler (ör. 4. sınıfta cebir, cm/çevre, genel terim engellenir).

---

## 9.3 Yedi MEB alt kategorisi — matematiksel tanım

Kaynak: `backend/constants/patternTopics.js` · Üretim: `patternTemplateService.js` · ML: `question_generate.py`

### 9.3.1 Geometrik (şekil) — `repeat`

| Öğe | Açıklama |
|-----|----------|
| **Matematiksel çekirdek** | Periyodik dizilim: elemanlar döngü C = (e₁, e₂, …, eₖ) ile tekrarlanır |
| **Örnek döngü** | △ → □ → ○ → △ → … |
| **Soru tipi** | SVG şekil dizisi + “Soru işareti yerine hangisi gelmelidir?” |
| **Zorluk** | Kolay/Orta: 2 elemanlı döngü · Zor: 3 elemanlı (circle, square, triangle) |
| **Kazanım** | Tekrar eden geometrik örüntüyü oluşturur ve bir sonraki elemana karar verir |
| **Sınıf bandı** | 1.–4. sınıf (adaptif: 1–4) |

**Örnek madde:** Dizide `circle, square, circle, square, ?` → doğru cevap `circle`.

---

### 9.3.2 Sayı (sabit adım) — `arithmetic`

| Öğe | Açıklama |
|-----|----------|
| **Formül** | Aritmetik dizi: **aₙ = a₁ + (n − 1) · d** |
| **d (ortak fark)** | Kolay: d=2 · Orta: d=4 · Zor: d=7 |
| **Soru biçimi** | Eksik terim: `3, 7, 11, 15, ?, 23` |
| **Üretim** | `generateArithmeticTemplate` — SVG sayı dizisi |
| **ML şablonu** | `_generate_arithmetic`: n. terim = first + diff × (ask_step − 1) |
| **Kazanım** | Sabit artış ilişkisini fark eder, eksik terimi bulur |
| **Sınıf bandı** | 3.–8. sınıf |

**Örnek (5. sınıf, Orta):** Dizi 5, 9, 13, 17, … → d=4 → 6. terim = 5 + 4×5 = **25**.

**Çözüm adımları (platform):**
1. Komşu terimler arası farkı bul (d).
2. Eksik konuma d ekle veya çıkar.
3. Seçeneklerle karşılaştır.

---

### 9.3.3 Sayı (karma kural) — `two_step`

| Öğe | Açıklama |
|-----|----------|
| **Kural** | Ardışık iki işlem: çift adımda **+a**, tek adımda **−b** (veya tersi) |
| **Örnek** | Başlangıç x₀=5; x₁=x₀+a, x₂=x₁−b, x₃=x₂+a, … |
| **Zorluk parametreleri** | Kolay: a=2,b=1 · Orta: a=3,b=2 · Zor: a=5,b=4 |
| **Kazanım** | Ardışık farklı işlemlerden oluşan kuralı kullanarak geneller |
| **Sınıf bandı** | 5.–9. sınıf |

**Örnek:** 5, 8, 6, 9, 7, ? → kural +3/−2 → sıradaki **10**.

---

### 9.3.4 Kare sayılar — `square_numbers`

| Öğe | Açıklama |
|-----|----------|
| **Formül** | **aₙ = n²** |
| **Dizi** | 1, 4, 9, 16, 25, … |
| **Görselleştirme** | SVG nokta ızgarası (kare sayı kadar nokta) |
| **Soru** | `4, 9, 16, ?` → doğru: **25** = 5² |
| **Kazanım** | Kare sayı örüntüsünde sıradaki terimi belirler |
| **Sınıf bandı** | 6.–10. sınıf |

---

### 9.3.5 Üçgensel sayılar — `triangular_numbers`

| Öğe | Açıklama |
|-----|----------|
| **Formül** | **Tₙ = n(n + 1) / 2** |
| **Dizi** | 1, 3, 6, 10, 15, 21, … |
| **Görselleştirme** | Üçgen dizilimli nokta ızgarası |
| **Soru** | `1, 3, 6, 10, ?` → T₅ = 5×6/2 = **15** |
| **Kazanım** | Üçgensel sayı düzeninde ilişkiyi görür |
| **Sınıf bandı** | 7.–12. sınıf |

---

### 9.3.6 Eşleştirme — `interactive_matching`

| Öğe | Açıklama |
|-----|----------|
| **Matematiksel görev** | Örüntü türü sınıflandırması |
| **Örnek çiftler** | `2,4,2,4,…` ↔ Tekrarlayan · `5,9,13,…` ↔ Sabit artan (+4) · `1,4,9,16,…` ↔ Kare |
| **Puanlama** | `gradeMatchingAnswer` — tüm çiftler doğru mu |
| **Kazanım** | Örüntüleri türlerine göre sınıflar |
| **Sınıf bandı** | 4.–9. sınıf |

---

### 9.3.7 Sıralama — `interactive_sequence`

| Öğe | Açıklama |
|-----|----------|
| **Pedagojik görev** | Problem çözme adımlarını doğru sıraya koyma |
| **Doğru sıra (Orta)** | Fark kontrol → Kural yaz → Tahmin → Doğrula |
| **Zorluk varyasyonu** | Kolay: kural önce · Zor: tahmin kuraldan önce |
| **Kazanım** | Örüntü problemini çözmek için uygun işlem sırasını kurar |
| **Sınıf bandı** | 5.–10. sınıf |

---

## 9.4 İleri düzey şablonlar (ML üretim hattı)

Kaynak: `ml-service/services/question_generate.py` — havuz örneği yoksa veya varyasyon üretilemezse devreye girer.

### 9.4.1 Altıgen sayı örüntüsü (`hexagon`)

| Öğe | Değer |
|-----|-------|
| **Kural** | n. adımdaki altıgen sayısı = **2n** (her adım 2 katına çıkar) |
| **Örnek** | 3. adım → 3 × 2 = **6** altıgen |
| **Çözücü** | `solve_hexagon_count_pattern` |

### 9.4.2 Eşkenar üçgen çevre örüntüsü (`triangle_perimeter`)

| Öğe | Değer |
|-----|-------|
| **Bağlam** | Kenar uzunluğu s cm olan eşkenar üçgenler yan yana |
| **Formül (birincil)** | Çevre = **4n + 4s** (n = adım, s = kenar cm) |
| **Alternatif formül** | 2s(n + 2) — çözücü her iki modeli dener |
| **Örnek** | s=3 cm, n=4 → 4×4 + 4×3 = **28 cm** |
| **Sınıf filtresi** | 4. sınıf ve altında üretilmez |

### 9.4.3 Cebirsel kural (`algebraic_rule`)

| Öğe | Değer |
|-----|-------|
| **Bağlam** | Birim küp sayıları: 1. adım 2, 2. adım 4, 3. adım 6 → kural? |
| **Doğru kural** | **2x**, **3x**, **4x** (x = adım sayısı) |
| **Çözücü mantığı** | Şıklardaki doğrusal formülleri (ax+b) gözlem dizisiyle eşleştir; en düşük hata |
| **Sınıf filtresi** | ≤6. sınıfta aritmetik şablona düşürülür; ≤4. sınıfta engellenir |

### 9.4.4 İlkokul şablonları (`elementary`)

| Alt tip | Matematik | Örnek |
|---------|-----------|-------|
| **Tekrar (repeat)** | Periyodik sayı/nesne | 2, 4, 2, 4, 2, … → **4** |
| **Artan (increasing)** | Sabit artış +2 veya +5 | 4, 6, 8, 10, … → **12** |
| **Azalan (decreasing)** | Sabit azalış −2 | 14, 12, 10, 8, … → **6** |

Bağlam temaları: renkli boncuklar, meyve tabağı, oyun alanı, sayı doğrusu (`ELEMENTARY_THEMES`).

---

## 9.5 Yerel çözücü — matematiksel algoritmalar

Kaynak: `ml-service/services/question_solver.py` — dış AI yok; deterministik.

| Çözücü | Girdi | Hesaplama | Çıktı |
|--------|-------|-----------|-------|
| `algebraic-rule` | Metin + şıklar (2x, 3x, …) | Her formül için gözlem dizisine hata toplamı | En düşük hatalı şık |
| `hexagon-count` | “n. adımda kaç altıgen” | predicted = n × 2 | Eşleşen şık |
| `triangle-perimeter` | n. adım, s cm kenar | 4n + 4s veya 2s(n+2) | Eşleşen şık |
| `arithmetic-sequence` | n. adım/terim + sayı dizisi veya şıklar | Ortak fark d; a₁ + d(n−1) | Eşleşen şık |
| `square-numbers` | Kare sayı dizisi (4, 9, 16, …) | (n+1)² | Eşleşen şık |
| `triangular-numbers` | Üçgensel dizi (3, 6, 10, …) | T(n) = n(n+1)/2 | Eşleşen şık |
| `two-step` | +a, −b alternatif kural | Eksik terim adım adım | Eşleşen şık |

**Varyasyon üretiminde rol:** Havuz sorusundaki sayılar `_replace_numbers` ile değiştirildiğinde çözücü yeni doğru cevabı yeniden hesaplar. Çözücü eşleşmezse madde **şablona düşer** — yanlış anahtar riski engellenir.

---

## 9.6 Sınıf düzeyi içerik filtresi (pedagojik koruma)

| Sınıf | Engellenen içerik örnekleri |
|-------|----------------------------|
| ≤ 4 | Cebir (2x, kural hangisi), cm/çevre, üçgen/altıgen, genel terim, azalan örüntü metni, şekil sembolleri (▲●◆) |
| ≤ 6 | Cebirsel ifade (2x+3) — aritmetik şablona yönlendirilir |
| ≤ 8 | `algebraic_rule` → `arithmetic` dönüşümü |

Bu filtre hem **üretim** (`resolveTemplateKind`) hem **havuz seçimi** (`filterPoolSamplesForGeneration`) aşamasında uygulanır.

---

## 9.7 Ölçme ve analitik formülleri

### 9.7.1 Madde puanlama (Slayt 8)

**Çoktan seçmeli / D-Y / boşluk:**

```
Doğru_i = 1 (a_i = k_i)    where normalize(a_i) = normalize(k_i)
Puan = Σ Doğru_i
```

**Eşleştirme:** Her prompt–option çifti doğru mu → tam eşleşme gerekir.

**Sıralama:** Öğrenci sırası = `correctOrder` → tam eşleşme.

Kaynak: `backend/utils/questionGrading.js`

### 9.7.2 Konu profili ve zayıf alan (Slayt 9)

```
accuracy_t = doğru_t / toplam_t
mastery_t ≈ accuracy_t (veya ayrı mastery alanı)
volumeNorm_t = min(1, toplam_t / max_toplam)
distanceFromIdeal_t = max(0, 1 − mastery_t)
priorityScore_t = distanceFromIdeal_t × (0,6 + 0,4 × volumeNorm_t)
isWeak_t = mastery_t < 0,55
```

Kaynak: `ml-service/services/weak_topics.py` · Eşik: `ML_WEAK_TOPIC_THRESHOLD=0.55`

**Yorum:** Hem düşük başarı hem yeterli deneme hacmi olan konular önceliklendirilir; az denenen konular cezalandırılmaz (volumeNorm düşükse priority düşer).

---

## 9.8 Bağlam temaları (gerçek hayat modelleme)

Üretimde 8 bağlam teması kullanılır (`CONTEXT_THEMES`):

| Anahtar | Bağlam | Örnek cümle |
|---------|--------|-------------|
| boncuk | Renkli boncuklar | “Renkli boncuklar tablosunda 3, 7, 11, …” |
| kutu | Karton kutular | “Karton kutular diziliminde …” |
| mozaik | Mozaik parçaları | “Mozaik tablosunda …” |
| kitap | Kitap rafları | “Kütüphane raflarında …” |
| kare | Kare fayanslar | “Fayans deseninde …” |
| top | Renkli toplar | “Top sırasında …” |
| çiçek | Çiçek saksıları | “Bahçe düzeninde …” |
| blok | Ahşap bloklar | “Blok kulesinde …” |

Amaç: Aynı matematiksel kuralı farklı bağlamlarda sunarak **transfer** ve **sözel problem** becerisini desteklemek.

---

## 9.9 Sınıf düzeyine göre örnek madde seti

### 1.–2. sınıf
- **Geometrik:** Kırmızı, mavi, kırmızı, mavi, ? → Mavi
- **Sayı (artan):** 2, 4, 6, 8, ? → 10 (+2)

### 3.–4. sınıf
- **Aritmetik:** 5, 10, 15, 20, ? → 25 (+5)
- **Geometrik SVG:** Daire–kare tekrarı

### 5.–6. sınıf
- **Aritmetik:** 7, 11, 15, 19, ? → 23 (+4)
- **İki adımlı:** 8, 11, 9, 12, 10, ? → 13 (+3/−2)

### 7.–8. sınıf
- **Kare:** 9, 16, 25, ? → 36
- **Üçgensel:** 3, 6, 10, 15, ? → 21

### 9.–12. sınıf
- **Cebirsel kural:** Adımlar 3, 6, 9 → kural **3x**
- **Üçgen çevre:** s=4 cm, 5. adım → 4×5 + 4×4 = **36 cm**

---

## 9.10 Sunumda matematik anlatımı (jüri için hazır cümleler)

1. **“Edumath hangi matematiği ölçüyor?”** — MEB 2018 programındaki “örüntü oluşturma ve analiz etme” kazanım ailesi; 7 alt kategori kodda formül ve şablon olarak tanımlı.

2. **“Sinir ağı mı, kural mı?”** — Üretim ve puanlama deterministik: aritmetik diziler, kare/üçgensel formüller, doğrusal kural eşleştirme; sinir ağı veya NLP puanlama yok.

3. **“Sınıf uyumu nasıl sağlanıyor?”** — `isSampleTooAdvancedForGrade` ile ilkokulda cebir/çevre engeli; şablon türü sınıfa göre otomatik düşürülür.

4. **“Özgün katkı matematikte ne?”** — Havuz → sayı varyasyonu → yerel çözücü ile anahtar doğrulama → öğretmen onayı; birebir kopya yok, pedagojik filtre var.

5. **“Zayıf konu nasıl bulunuyor?”** — accuracy/mastery + deneme hacmi ağırlıklı priorityScore; eşik 0,55 altı “zayıf” etiketi.

---

## 9.11 Kod referans özeti

| Matematik bileşeni | Dosya |
|--------------------|-------|
| 7 alt kategori + kazanım | `backend/constants/patternTopics.js` |
| SVG şablon üretimi (7 tip) | `backend/services/patternTemplateService.js` |
| Havuz varyasyon + formül şablonları | `ml-service/services/question_generate.py` |
| Sınıf filtresi (JS) | `backend/services/gradeAwareQuestionTemplates.js` |
| Yerel çözücü | `ml-service/services/question_solver.py` |
| Otomatik puanlama | `backend/utils/questionGrading.js` |
| Zayıf konu skoru | `ml-service/services/weak_topics.py` |
| 1–12 müfredat metni | `frontend/src/data/curriculumData.js` |

---

# BÖLÜM X — ÖĞRETMEN KULLANIM KILAVUZU

**Kaynak kod senkronu:** `frontend/src/data/quickGuideContent.js` · Uygulama: **Hızlı Kılavuz** (GuideDrawer, öğretmen ana sayfası)

**Depo:** https://github.com/Bahri26/edumath · **YZ modu:** `AI_PROVIDER=local` (Gemini opsiyonel)

## Hedef

Paneldeki temel akışları tek yerden hatırlatmak; menüden ilgili sayfaya geçerek uygulamak.

## İlk kurulum

1. Branş onayı ve rol bilgisini kontrol et
2. Branş, sınıf, konu filtrelerini doğrula
3. MEB uyumlu örüntü havuzunu belirle
4. Haftalık sınav/egzersiz planını netleştir

## Temel akış (7 adım)

1. Öğretmen paneline gir
2. Soru bankasında filtre uygula
3. Smart Paste ile gerekirse madde ekle (OCR)
4. Sınav veya egzersiz oluştur
5. Konu dağılımını kontrol et
6. Öğrenci ilerleme + raporları incele
7. Sonraki hafta planını güncelle

## Soru bankası

- Branş, sınıf, zorluk, konu filtreleri + metin araması
- Kendi sorularınız + onaylı branş havuzu aynı ekranda
- LaTeX ve görselleri önizlemede kontrol edin
- **Smart Paste:** Görsel/metin yapıştır → Tesseract + `question_parse.py` → madde taslağı

> Branş onayı sonrası konu filtreleri branşınıza sabitlenir.

## Sınavlar

- **Hızlı sınav:** Sınıf, süre, soru sayısı — tek tık taslak (branş onayı gerekir)
- **7-7-7 stüdyo:** Kolay/orta/zor dağılımı ince ayar
- Öğrenci girişleri sonuçlar sekmesinde

> Tarih ve süre doldurmadan yayınlamayın.

## Egzersizler (güncel üç adım)

1. **Mod:** AI destekli veya manuel
2. **Sınıf + konu:** 1–12; MEB örüntü alt konuları
3. **Madde tipi:** MCQ, D/Y, boşluk, eşleştirme, sıralama

Zorluk bandı (Kolay/Orta/Zor) kaldırıldı — ölçme hedefi **konu + tip**.

**Havuz AI:** MongoDB → ml-service → `gradeAwareQuestionTemplates.js` → onay

## Konu ve ders yapısı

- Konu & ders yapısı: sınıf/derse konu, derse lesson bağla
- Sıra öğrenci konu ağacı ile hizalı olsun
- Ders silince quiz ilerlemesi temizlenir — onaylayın

## Öğrenci ilerleme

- Sınıf listesinden öğrenci seç; ders bazlı doğru/yanlış, XP
- `?student=id` ile doğrudan link

## Raporlar

- Dönem: ortalama, katılım, günlük trend
- **İpucu istekleri:** Zayıf konu planlaması
- Yazdır / PDF

## Kalıp şablonları

MEB uyumlu örüntü paketleri; yedi alt kategori.

## Anketler ve hesap

Profil → Anketler · Şifre, dil TR/EN, tema

## Verimli kullanım

- Sınav öncesi havuzu daraltın
- Sınıf değişince havuzu yeniden filtreleyin
- Raporu planlama için kullanın
- Egzersizde konu+tip = ölçme hedefi

## Sorun giderme

- Branş onayı · Yeniden giriş · Filtre uyumu · Cold start bekleyin (`backendWake.js`)

## Teknik eşleme (tez)

| Bileşen | Görev |
|---------|--------|
| `examRoutes.js` | Teslim, otomatik puan |
| `exerciseController.js` | Konu+tip filtresi |
| `aiController.examResultAnalysis` | Konu geri bildirimi |
| `ml-service /analyze/topics` | Zayıf konu |
| `poolBasedQuestionGeneratorService.js` | Havuz üretim |

---

# BÖLÜM XI — ÖĞRENCİ KULLANIM KILAVUZU

**Senkron:** `quickGuideContent.js` · **Hızlı Kılavuz:** öğrenci ana sayfası

## Hedef

Ders, sınav ve tekrar için kısa yollar; her bölüm menüdeki gerçek sayfaya karşılık gelir.

## İlk giriş

1. Profil ve sınıf düzeyini kontrol et
2. Bekleyen ödev ve sınavları incele
3. Bu haftanın iki hedef konusunu belirle

## Temel akış

Ana sayfa → Konu ağacı → Ödevler → Sınav → Aynı gün tekrar → Hafta sonu takvim

## Ana sayfa

Devam kartları, günlük hedefler. Özet istatistik motivasyon içindir; asıl içerik ders/sınav sayfalarında.

## Sınavlar

Aktif sınavları aç; süre sayacını izle; tek seferde teslim et. Sonuç öğretmen ayarına göre.

> Bağlantı koparsa süre dolmadan yenilemeyin.

## Konu ağacı ve quizler

Sınıfına uygun konular; ders adına tıkla → quiz. XP ve doğru/yanlış öğretmen panelinde.

## Study Hub (AI antrenman)

Zayıf konu alıştırmaları; **WeakTopicsInsightCard** (eşik altı konular). Adım ipuçlarını not al.

## Ödevler ve takvim

Teslim tarihlerini planla; yaklaşan görevler ana sayfada.

## Mesajlar

Öğretmen duyuruları; okunmamışlar vurgulu.

## Liderlik ve profil

Sınıf sıralaması (varsa) · Şifre, dil, karanlık mod

## Verimli kullanım

- Kısa düzenli tekrar
- Odaklı konu çalışması
- Sınav sonrası aynı gün tekrar
- Zayıf konuları aynı hafta Study Hub’da kapat

## Sorun giderme

- Sınıf düzeyi profilde doğru mu?
- Boş liste → yeniden giriş
- “Sunucu geç cevap veriyor” → cold start, birkaç saniye bekle
- Öğretmen/yönetici ile iletişim

## Teknik (tez)

Otomatik puanlama: `gradeQuestionAnswer` (5 tip). Konu performansı: `studentAnalyticsService` + ml-service (eşik 0,55).

---

# BÖLÜM XII — LİTERATÜR VE KAYNAKÇA

## Tematik sentez

### YZ ve ölçme-değerlendirme

Nesnellik, ölçeklenebilirlik, anlık geri bildirim; sınırlayıcılar: opaklık, gizlilik, pedagojik geçerlik (Meylani, 2025; Çavuş, 2024; Hermann, 2021). Türkiye: öğretmenler faydalı buluyor; hazırbulunuşluk ve etik kaygılar sürüyor (Tekin & Ciğerci, 2025; Nayıroğlu & Tutak, 2024).

### Matematik eğitiminde YZ

Üretken YZ: geri bildirim, içerik (Seven & Erümit, 2024; Özkan & Kaplan, 2025; Saralar-Aras, 2025). Edumath: şeffaf yerel algoritmalar — Meylani etik gerilimine yanıt.

### Madde üretimi psikometriği

NEU Ereğli (2025) YZ–LGS psikometrik karşılaştırma. Edumath: pedagojik filtre + öğretmen onayı.

### Açık uçlu puanlama (uluslararası)

Henkel vd. (2025) AMMORE; Zhang vd. (2024) IJAIED. Edumath: yapılandırılmış kural; NLP gelecek.

### Örüntü ve MEB

Radford (2008); Stacey (1989); MEB (2018); YEGİTEK (2026).

### Ölçme kuramı

Kline (2013); Tavşancıl (2014); Mooney (2002).

### Öğrenme analitiği

Siemens & Baker (2012); konu etiketli mastery — Edumath `priorityScore`.

## Literatür — Edumath eşleme tablosu

| Tema | Edumath karşılığı |
|------|-------------------|
| Nesnellik | `gradeQuestionAnswer` |
| Şeffaflık | Açık kaynak, local AI |
| Kişiselleştirme | Zayıf konu, Study Hub |
| Program uyumu | 7 örüntü alt kategorisi |
| Etik | KVKK, planlanan etik kurul |

## Kaynakça (seçilmiş)

### Ulusal

- Çavuş, M. N. (2024). Eğitimde yapay zekâ tabanlı ölçme ve değerlendirme üzerine bir derleme. *Uluslararası Özel Amaçlar İçin İngilizce Dergisi*.
- Cumhur, F. (2024). Matematik eğitiminde yapay zekânın kullanımı. ResearchGate.
- Kara, E. (2024). 21. yüzyıl matematik eğitiminde yapay zekâ. *Çocuk ve Medeniyet Dergisi*.
- Meylani, R. (2025). Matematik eğitiminde yapay zeka destekli değerlendirmeler. *Buca Eğitim Fakültesi Dergisi*, *66*, 3642–3674. https://dergipark.org.tr/tr/pub/befd
- Millî Eğitim Bakanlığı. (2018). *Matematik dersi öğretim programı*. https://mufredat.meb.gov.tr
- MEB/YEGİTEK. (2026). *Yapay zekâ araçları: Öğretmen el kitabı*. https://yegitek.meb.gov.tr
- Nayıroğlu, B., & Tutak, T. (2024). Matematik öğretiminde yapay zekânın rolü. *Turkish Journal of Educational Studies*.
- Özkan, M., & Kaplan, M. S. (2025). Çözümünde yapay zeka. *Matematik Eğitimi Çalışmaları I*.
- Saralar-Aras, H. G. (2025). 21. yüzyılda matematik öğretmeninin sırt çantası. *Kuramdan Uygulamaya Sınıf İçi Uygulamalar*.
- Seven, E. H., & Erümit, A. K. (2024). Matematik eğitiminde üretken yapay zekâ araçları. *Uşak Üniversitesi Eğitim Araştırmaları Dergisi*.
- Tekin, H., & Ciğerci, F. M. (2025). YZ destekli eğitim araçları — ilkokul matematik. *Harran Maarif Dergisi*.
- YZ destekli madde üretimi psikometrik karşılaştırması. (2025). *NEU Ereğli Eğitim Fakültesi Dergisi*. https://dergipark.org.tr/tr/pub/neueefd/article/1775033

### Uluslararası

- Henkel, O., et al. (2025). Learning to love LLMs for answer interpretation. *Journal of Learning Analytics*, *12*(1), 50–64. https://doi.org/10.18608/jla.2025.8621
- Kline, P. (2013). *Handbook of psychological testing*. Routledge.
- Mooney, E. S. (2002). Framework for statistical thinking. *Mathematical Thinking and Learning*, *4*(1), 23–63.
- Radford, L. (2008). Iconicity and consciousness. *Educational Studies in Mathematics*, *70*(3), 219–234.
- Siemens, G., & Baker, R. S. (2012). Learning analytics and educational data mining. *LAK ’12*, 252–254.
- Stacey, K. (1989). Finding and using patterns in algebra. *Australian Mathematics Teacher*, *45*(3), 12–16.
- Tavşancıl, E. (2014). *Tutumların ölçülmesi ve SPSS ile veri analizi*. Nobel.
- Zhang, J., et al. (2024). Automated scoring using LLMs. *IJAIED*, *35*, 559–586. https://doi.org/10.1007/s40593-024-00418-w

### Proje

- Koç, B. (2026). *Edumath* [Kaynak kodu]. GitHub. https://github.com/Bahri26/edumath

---

# BÖLÜM XIII — TIK RAPORU ÖZETİ

## Tez bilgileri

| Alan | Değer |
|------|--------|
| Öğrenci | Emre İncekalan (2531745000) |
| Yazılım | Bahri KOÇ |
| Program | Matematik Eğitimi Doktora, AU |
| Danışman | Prof. Dr. Hüseyin Bahadır Yanık |
| Bitiş (plan) | 01/01/2027 |
| Kaynak | Açık kaynak + Render (BAP/TÜBİTAK yok) |

## Tez başlığı

Matematik Eğitiminde Yapay Zekâ Destekli Ölçme ve Değerlendirme Süreçlerinin Bütünleşik Modellenmesi: Edumath Web Platformunun Tasarımı, Geliştirilmesi ve Uygulanması

## İzleme dönemi bulguları (özet)

- Edumath geliştirildi, modüler mimari olgunlaştı, canlıda test edildi
- Yerel algoritmik madde üretim hattı (havuz → Python → JS → onay)
- Beş madde tipi otomatik puanlama; egzersiz sınıf+konu+tip
- MEB örüntü uyumlu havuz; cold-start optimizasyonu
- Öğretmen/öğrenci kılavuzları hazır

## Planlanan (sonraki dönem)

- Etik kurul · Okul pilotu · p, r, α · Öğretmen görüşmeleri · Hakemli makale

## Tez ilerleme tablosu

| # | Aşama | Durum |
|---|--------|--------|
| 1 | Kuramsal çerçeve, literatür | Tamamlandı |
| 2 | Platform geliştirme (Edumath) | Tamamlandı |
| 3 | Kılavuzlar, teknik doğrulama | Tamamlandı |
| 4 | Pilot veri toplama | Planlanıyor |
| 5 | KTT analizi (p, r, α) | Planlanıyor |
| 6 | Tez bulgular-tartışma (empirik) | Planlanıyor |
| 7 | Hakemli makale | Planlanıyor |

## Literatürle dört bağlantı noktası (TIK)

1. Meylani (2025) etik gerilim → şeffaf yerel algoritmik alternatif
2. Seven & Erümit (2024) üretken YZ → havuz + uzman onayı
3. Radford (2008); Stacey (1989) → sınıf duyarlı örüntü içeriği
4. Henkel vd. (2025) → konu bazlı ustalık izleme

## Toplumsal katkı

Devlet okulu / açık öğretim için açık mimarili ölçme altyapısı; YEGİTEK (2026) ile uyumlu YZ destek aracı konumlandırması.

---

# BÖLÜM XIV — ANALİZ, SEVİYE BELİLEME VE YZ SORU ÜRETİMİ

“Analiz nasıl yapılıyor?”, “Seviyeyi kim belirliyor?”, “YZ soruyu nereden üretiyor?” — jüriden bu üçlü sık geliyor. Cevaplar aşağıda; Slayt 8, 9, 13 ve 16 ile birlikte okuyun.

## 14.1 “YZ” denince ne kastediyoruz?

Canlı ortamda varsayılan ayar `AI_PROVIDER=local`. Yani dışarıya soru yazdırmıyoruz; kendi havuzumuz ve şablonlarımız çalışıyor.

| Ayar | Değer | Anlam |
|------|-------|-------|
| `AI_PROVIDER` | `local` (prod) | Dış LLM yok; havuz + şablon + NumPy/ml-matrix |
| `AI_PROVIDER` | `gemini` + API key | Opsiyonel: metin analizi, ipucu, alıştırma (fallback yerel) |
| Üretim endpoint | `POST /api/ai/generate-quiz` | **Her zaman** havuz hattı (`generateQuestionsFromPool`) |

**Önemli:** Arayüzde “AI ile oluştur” yazıyor; bu, ChatGPT’nin sıfırdan paragraf yazması demek değil. MongoDB’deki onaylı sorulardan yola çıkıp sayıları ve bağlamı değiştiren yerel bir hattır. Sinir ağı yok.

Kaynak: `backend/config/aiProvider.js` · `backend/controllers/aiController.js` → `generateQuiz`

---

## 14.2 Analiz katmanları — ne, nereden, nasıl?

Platformda analiz tek bir sihirli kutu değil. Sınav, egzersiz, ödev ve ders quizi ayrı ayrı veri bırakıyor; backend bunları konu bazında topluyor, sonra skorluyor.

```
┌─────────────────────────────────────────────────────────────┐
│  Öğrenci etkinliği (sınav, egzersiz, ödev, ders quiz)      │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  collectTopicStats — konu bazlı doğru/yanlış/süre toplama   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Skorlama: ml-service weak_topics VEYA ml-matrix (fallback) │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  UI: WeakTopicsInsightCard · Study Hub · Öğretmen raporu   │
└─────────────────────────────────────────────────────────────┘
```

### 14.2.1 Sınav sonucu analizi (anlık)

**Tetikleyici:** Öğrenci sınavı gönderir (`POST /api/exams/:id/submit`).

| Adım | İşlem |
|------|--------|
| 1 | Her soru için `gradeQuestionAnswer` — doğru/yanlış |
| 2 | Yanlış/boş cevapta `learningOutcome` veya `topic` → zayıf alan setine eklenir |
| 3 | `correctCount`, `wrongCount`, `topicStats`, `weakTopics` kaydedilir |
| 4 | Puan = doğru / toplam |

Kaynak: `backend/routes/examRoutes.js`

### 14.2.2 Gelişmiş sınav analizi (AI controller)

**Endpoint:** `POST /api/ai/exam-result-analysis`

| Çıktı | Hesaplama |
|-------|-----------|
| `score` | round(correct/total × 100) |
| `topicReport` | Konu bazlı doğru/toplam/yüzde |
| `slowQuestions` | timeMs > 60.000 ms olan sorular |
| `analysis` | `AI_PROVIDER=local` → `localText.buildExamAnalysis` (şablon metin) |

Gemini açıksa kısa özet metni LLM üretir; hata olursa yine yerel metne düşer.

### 14.2.3 Öğretmen sınıf raporu

**Endpoint:** `POST /api/ai/teacher-report`

Tüm öğrencilerin cevaplarını birleştirir: sınıf geneli konu başarısı, ortalama skorlar, yavaş soru dağılımı. Yerel modda `localText.buildTeacherSummary`.

**UI:** `TeacherReports.jsx` · `06-ogretmen-rapor.png`

### 14.2.4 Öğrenci konu profili (zayıf konu motoru)

**Ana servis:** `backend/services/studentAnalyticsService.js` → `collectTopicStats(studentId)`

**Veri kaynakları (birleştirilir):**

| Kaynak | Model | Ne sayılır? |
|--------|-------|-------------|
| Sınavlar | `Exam.results` | Doğru/yanlış, topicStats, weakTopics |
| Egzersizler | `Exercise.submissions` | Tamamlama, süre |
| Ödevler | `Assignment.submissions` | Tamamlama, not ≥50 |
| Öğrenme olayları | `LearningEvent` | `error`, `hint` → yanlış sayılır |
| Ders ilerlemesi | `UserProgress` + `Lesson` | Quiz doğru/yanlış |

**Cold-start (henüz veri yok):** Öğrencinin sınıf düzeyindeki müfredat konuları (`Topic`) öneri listesi olarak döner — `scoringProvider: curriculum-suggestion`. Study Hub boş kalmaz.

### 14.2.5 Skorlama formülleri

**A) ml-service (tercih edilen)** — `ml-service/services/weak_topics.py`:

```
accuracy = doğru / toplam
mastery ≈ accuracy
volumeNorm = min(1, toplam / max_toplam)
distanceFromIdeal = max(0, 1 − mastery)
priorityScore = distanceFromIdeal × (0,6 + 0,4 × volumeNorm)
isWeak = mastery < 0,55
```

**B) Yerel ml-matrix (fallback)** — `studentAnalyticsService.scoreEntriesWithLocalMatrix`:

Her konu için 3 boyutlu vektör: `[accuracy, 1−norm(süre), norm(deneme)]`  
İdeal vektör: `[1, 1, 1]`  
Öklid mesafesi → `distanceFromIdeal` → `priorityScore`  
Zayıf: `accuracy < 0,55`

**C) Sınav submit (basit):** Yanlış cevap → konu/kazanım doğrudan `weakTopics` listesine.

---

## 14.3 Seviyeler nasıl belirleniyor?

Platformda **üç farklı “seviye” kavramı** vardır; karıştırılmamalıdır:

| Kavram | Alan | Kim belirler? | Değerler |
|--------|------|---------------|----------|
| **Sınıf düzeyi** | `classLevel` | Öğretmen (form) | 1.–12. Sınıf |
| **Zorluk** | `difficulty` | Öğretmen (AI modal) veya mevcut soru etiketi | Kolay · Orta · Zor |
| **Madde tipi** | `type` | Öğretmen (egzersiz) veya soru kaydı | MCQ, D/Y, boşluk, eşleştirme, sıralama |

### 14.3.1 Sınıf düzeyi (`classLevel`)

- **Soru bankası / AI üretim:** Öğretmen `AiGenerateQuizModal` veya soru formunda seçer.
- **Egzersiz:** `TeacherExerciseCreator` — adım 2’de sınıf + konu zorunlu; havuz sorgusu `classLevel` ile filtrelenir.
- **Üretim filtresi:** Havuzdan çekilen örnekler önce aynı sınıfa göre filtrelenir; yoksa gevşetilir (aşağıda).
- **Pedagojik koruma:** `isSampleTooAdvancedForGrade` — seçilen sınıftan ileri içerik üretilmez.

### 14.3.2 Zorluk (`difficulty`)

**Öğretmen seçimi:** AI soru modalında Kolay / Orta / Zor — üretim parametresi olarak gider.

**Otomatik tahmin (Smart Paste / analiz):** `ml-service/question_analyze.py` → `infer_difficulty`:

| Kural | Sonuç |
|-------|-------|
| Metin uzunluğu > 220 karakter veya şık > 4 | Zor |
| Metin < 80 karakter | Kolay |
| Aksi | Orta |

**Şablon parametreleri (üretimde):** Zorluk sayı aralıklarını belirler:

| Zorluk | `_difficulty_params` (Python) | `difficultyRange` (JS) |
|--------|--------------------------------|------------------------|
| Kolay | first ∈ [2,6], diff küçük | step 2–6 |
| Orta | first ∈ [4,12] | step 4–12 |
| Zor | first ∈ [8,18], diff 4–9 | step 8–18, daha uzak terim |

**Egzersiz notu:** Egzersiz oluşturma akışında zorluk bandı **formdan kaldırıldı**; seçilen soruların kendi `difficulty` etiketleri korunur (`Exercise.difficulty` havuzdan türetilir).

### 14.3.3 Şablon → sınıf eşlemesi (`resolveTemplateKind`)

| Sınıf | Cebir şablonu | Geometri şablonu |
|-------|---------------|------------------|
| ≤ 4 | → `elementary` (tekrar/artan/azalan) | SVG şekil |
| ≤ 6 | `algebraic_rule` → `arithmetic` | üçgen/altıgen → `arithmetic` |
| ≤ 8 | `algebraic_rule` → `arithmetic` | tam geometri |
| 9+ | tüm şablonlar | tam geometri |

Kaynak: `gradeAwareQuestionTemplates.js` · `question_generate.py` → `_resolve_template_kind`

### 14.3.4 Havuz gevşetme (örnek bulunamazsa)

`questionPoolSamplesService.fetchPoolQuestionDocs` sırasıyla:

1. Tam eşleşme: subject + topic + classLevel + difficulty  
2. Zorluk gevşet: aynı sınıf, zorluk filtresi kaldır  
3. Sınıf gevşet: aynı zorluk, sınıf filtresi kaldır  
4. Her ikisi gevşet  

Yalnızca **metin tabanlı** sorular havuza girer (görselli sorular hariç).

---

## 14.4 YZ soru hazırlaması — uçtan uca akış

### 14.4.1 Öğretmen arayüzü

1. Soru bankası veya egzersiz ekranı → **“AI ile oluştur”**
2. Modal: konu, sınıf, zorluk, adet (1–15)
3. Önizleme → düzenle / tek tek kaydet / toplu kaydet
4. Kaynak etiketi: `source: 'AI'` — öğretmen onayı zorunlu

Kaynak: `AiGenerateQuizModal.jsx` · `TeacherExerciseCreator.jsx`

### 14.4.2 Backend üretim hattı (3 kademeli)

```
POST /api/ai/generate-quiz
        │
        ▼
generateQuestionsFromPool()  ← poolBasedQuestionGeneratorService.js
        │
        ├─(1) MongoDB: fetchQuestionPoolRows (≤12 metin örneği)
        │
        ├─(2) ml-service: POST /questions/generate-from-pool
        │       • pool-variant: sayıları değiştir + solvePatternQuestion ile anahtar
        │       • template: aritmetik / altıgen / üçgen / cebir / ilkokul
        │
        ├─(3) JS fallback: generateLocalFromPool (ml kapalıysa)
        │
        └─(4) Son çare: generateFallbackPatternQuestions (sabit banka)
```

**Her soru için döngü (ml-service):**

1. Havuz örneği var mı ve sınıfa uygun mu? → `_variant_from_sample` (sayı değiştir, çözücü doğrula)
2. Değilse → `_classify_sample` ile tür belirle → `_template_question`
3. Tekrar eden metin? → yeni şablon seed’i
4. `learningOutcome`, `mebReference`, `generatorMethod` eklenir

**generatorMethod değerleri:** `pool-variant` · `template` · `elementary-template`

### 14.4.3 İkinci üretim yolu: Örüntü şablon oluşturucu

**Endpoint:** `POST /api/pattern-templates/generate`  
**Servis:** `patternTemplateService.js`

Öğretmen `PatternTemplateBuilder` ekranından şablon seçer:

| templateKey | Çıktı |
|-------------|-------|
| `repeat` | SVG geometrik örüntü |
| `arithmetic` | Sabit farklı sayı dizisi |
| `two_step` | +a/−b karma kural |
| `square_numbers` | n² + nokta ızgarası |
| `triangular_numbers` | Tₙ = n(n+1)/2 |
| `interactive_matching` | Eşleştirme sorusu |
| `interactive_sequence` | Adım sıralama sorusu |

Bu yol **görsel SVG** üretir; havuz hattından bağımsızdır.

### 14.4.4 Üçüncü yol: Smart Paste (mevcut sorudan)

**Akış:** Fotoğraf/metin → Tesseract OCR → `question_parse.py` / Gemini (opsiyonel) → form alanları dolar.

- Konu/zorluk boşsa `infer_topic` / `infer_difficulty` devreye girer.
- Öğretmen düzenler ve kaydeder — otomatik bankaya gitmez.

### 14.4.5 Gemini ne zaman devreye girer?

| Özellik | local | gemini |
|---------|-------|--------|
| Soru üretimi (`generate-quiz`) | Havuz hattı | **Yine havuz hattı** (aiController local path) |
| Sınav analizi metni | Şablon | LLM özeti |
| İpucu (`getHint`) | Yerel çözücü | LLM + fallback |
| Alıştırma (`generatePractice`) | `buildFallbackPracticeQuestions` | LLM + fallback |
| Smart Paste | OCR | Gemini JSON parse + OCR fallback |

**Sonuç:** “YZ soru hazırlaması” tez ve sunumda **algoritmik havuz tabanlı üretim** olarak anlatılmalı; LLM opsiyonel katmandır.

---

## 14.5 Öğretmen onay döngüsü (pedagojik güvence)

```
Üretim → Önizleme → [Düzenle] → Kaydet (source: AI)
                              ↓
                    Soru bankası / Sınav / Egzersiz
                              ↓
                    Öğrenci çözüm → Analiz → Zayıf konu
```

- Üretilen madde **doğrudan öğrenciye gitmez**.
- Öğretmen metin, şık, cevap, çözümü kontrol eder.
- Onay sonrası madde havuza girer → gelecek üretimler için örnek olur (pozitif geri besleme).

---

## 14.6 Analiz → kişiselleştirme döngüsü

```
Öğrenci sınav/egzersiz çözer
        ↓
collectTopicStats → priorityScore sıralaması
        ↓
isWeak (mastery < 0,55) konular listelenir
        ↓
Study Hub: zayıf konuya yönelik tekrar egzersizi önerilir
        ↓
Öğretmen raporu: sınıf geneli zayıf konular
        ↓
Öğretmen yeni AI paketi / egzersiz oluşturur (aynı konu + sınıf)
```

**Adaptif band (şablon meta):** `patternTemplateService` her şablonda `adaptiveBand: { minClass, maxClass, estimated }` yazar — analitik ve filtreleme için metadata.

---

## 14.7 Sunumda hazır cevaplar (S&C)

| Soru | Kısa cevap |
|------|------------|
| Analiz nasıl yapılıyor? | Sınav/egzersiz/ödev/quiz cevapları konu bazında toplanır; ml-service veya ml-matrix ile priorityScore; eşik 0,55. |
| Seviye kim belirliyor? | Sınıf ve zorluğu öğretmen seçer; üretimde şablon parametreleri zorluğa göre ayarlanır; ilkokulda ileri içerik kodla engellenir. |
| YZ soru nasıl üretiyor? | MongoDB havuz örneklerinden sayı/kural varyasyonu + matematik şablonları; ml-service veya JS; birebir kopya yok; öğretmen onayı şart. |
| Gemini kullanıyor musunuz? | Canlıda `AI_PROVIDER=local`; Gemini opsiyonel (metin analizi, ipucu). Soru üretimi havuz hattı. |
| Cold-start? | Veri yoksa müfredat konuları öneri listesi; skor “öneri” modunda. |

---

## 14.8 Kod referans özeti

| Bileşen | Dosya |
|---------|-------|
| AI sağlayıcı seçimi | `backend/config/aiProvider.js` |
| Soru üretim endpoint | `backend/controllers/aiController.js` → `generateQuiz` |
| Havuz hattı | `backend/services/poolBasedQuestionGeneratorService.js` |
| Havuz sorgusu | `backend/services/questionPoolSamplesService.js` |
| ML üretim | `ml-service/services/question_generate.py` |
| Zorluk tahmini | `ml-service/services/question_analyze.py` |
| Öğrenci analitik | `backend/services/studentAnalyticsService.js` |
| Zayıf konu skoru | `ml-service/services/weak_topics.py` |
| SVG şablon üretimi | `backend/services/patternTemplateService.js` |
| UI: AI modal | `frontend/src/components/modals/AiGenerateQuizModal.jsx` |

---

# BÖLÜM XV — JÜRİ SORU-CEVAP REHBERİ (BİLİMSEL DİL)

Bu bölüm, sunum ve tez savunmasında jürinin sorabileceği sorulara **akademik ama anlaşılır** cevaplar sunar. Her cevap Edumath’ın gerçek kod tabanı ve tez çerçevesiyle uyumludur; empirik olmayan iddialardan kaçınılmıştır.

**Kullanım:** Provada bir jüri üyesi rolüyle rastgele soru seçin; cevabı yüksek sesle söyleyin; ardından kendi cümlelerinize indirgeyin.

---

## A. Tez kapsamı, evren ve metodoloji

**S1.** Tezinizin problem durumu nedir ve Edumath bu problemi nasıl konumlandırmaktadır?

**C1.** Problem durumu, K–12 matematik öğretiminde ölçme-değerlendirme sürecinin ölçeklenebilir biçimde bireyselleştirilememesi ve yapay zekâ destekli çözümlerde pedagojik şeffaflık ile uzman denetiminin yeterince bütünleştirilememesidir. Edumath, madde üretimi, uygulama, otomatik puanlama ve konu düzeyinde analitik geri bildirimi tek platformda modelleyerek bu boşluğu doldurmayı hedeflemektedir.

---

**S2.** Tez yürütüldüğü kurum ile uygulama evreni arasındaki farkı nasıl gerekçelendiriyorsunuz?

**C2.** Tez, Anadolu Üniversitesi Matematik Eğitimi doktora programında yürütülmektedir; bu, kuramsal ve metodolojik çerçevenin üretildiği bağlamdır. Edumath platformu ise birincil uygulama evreni olarak ilkokul–lise (K–12) matematik öğretimini hedeflemektedir. Bu ayrım, tasarım tabanlı araştırma (DBR) geleneğinde “araştırmacı–tasarımcı” ile “hedef öğrenme ortamı” arasındaki ilişkiyi yansıtır; tez bir üniversite sınav otomasyon sistemi değildir.

---

**S3.** Araştırma deseniniz nedir?

**C3.** Çalışma karma yöntem ve tasarım tabanlı araştırma (DBR) ilkeleriyle yürütülmektedir. Nicel boyutta — pilot aşamasında — madde analizi (p, r), tutarlılık (Cronbach α) ve performans verileri planlanmaktadır. Nitel boyutta öğretmen görüşmeleri öngörülmektedir. Geliştirme aşamasında tamamlanan nicel doğrulama, yazılım düzeyinde teknik testlerle sınırlıdır (23 frontend test dosyası, deterministik puanlama doğrulaması).

---

**S4.** Bugün sunabileceğiniz bulgular ile planlanan bulgular arasındaki sınır nedir?

**C4.** Bugün sunulan bulgular **teknik doğrulama** düzeyindedir: üretim hattının uçtan uca çalışması, puanlama kurallarının deterministikliği, sınıf düzeyi filtrelerinin işlevi ve canlı ortamda modüler mimarinin sürdürülebilirliği. **Empirik bulgular** — güvenirlik, geçerlik, öğrenme kazanımına etki — etik kurul onayı sonrası okul pilotu ile elde edilecektir. Bu ayrım bilinçli olarak korunmaktadır.

---

## B. Kuramsal çerçeve ve literatür

**S5.** Edumath’ı literatürdeki hangi boşluğa konumlandırıyorsunuz?

**C5.** Literatürde otomatik puanlama, üretken madde üretimi ve öğrenme analitiği çoğunlukla ayrı sistemlerde ele alınmaktadır (Meylani, 2025; Seven & Erümit, 2024). Edumath, bu üç işlevi ölçme-değerlendirme zincirinin ardışık halkaları olarak bütünleştirmekte; özellikle üretken yapay zekâ yerine **havuz tabanlı, denetlenebilir üretim** modeli önermektedir.

---

**S6.** Klasik Test Teorisi (KTT) tezinizde ne aşamada devreye girecektir?

**C6.** KTT, pilot uygulama sonrası madde düzeyi analizler (madde güçlük indeksi p, madde ayırt edicilik indeksi r, test genel güvenirliği Cronbach α) için planlanmıştır. Platform şu an KTT istatistiklerini otomatik üretmemektedir; bu bilinçli bir sınırlılıktır. Psikometrik analiz SPSS veya Python ile araştırmacı kontrolünde yürütülecektir.

---

**S7.** Formatif değerlendirme perspektifinden Edumath’ın katkısı nedir?

**C7.** Formatif değerlendirme, öğrenme sürecine yönelik geri bildirimi vurgular. Edumath, sınav ve egzersiz sonrası konu düzeyinde doğruluk profili üreterek öğretmenin müdahale kararını destekler; öğrenci tarafında Study Hub ile zayıf konulara yönelik tekrar önerir. Bu, summatif sonuçların ötesinde süreç odaklı veri sunmaktadır.

---

**S8.** Örüntü konusunu kuramsal olarak nasıl gerekçelendiriyorsunuz?

**C8.** Örüntü, MEB Matematik Öğretim Programı (2018) kapsamında ilkokuldan liseye uzanan dikey bir kazanım alanıdır; Radford (2008) ve Stacey (1989) örüntüyü cebirsel düşüncenin ve genelleme becerisinin erken biçimleri olarak konumlandırır. Edumath’ta yedi alt kategori, bu dikey ilerlemenin ölçülebilir alt bileşenlerine indirgenmiştir.

---

## C. Matematik pedagojisi ve MEB uyumu

**S9.** Platform yalnızca “örüntü” konusuyla mı sınırlıdır?

**C9.** Birincil içerik odağı örüntülerdir; soru bankası seed’i, üretim şablonları ve kazanım etiketleri bu alana yoğunlaşmıştır. Veritabanı şeması ve branş alanları genişletmeye elverişlidir; ancak tez kapsamında derinlik, örüntü taksonomisinin psikometrik ve pedagojik olarak olgunlaştırılmasına verilmiştir. Genişleme, pilot bulguları sonrası planlanabilir.

---

**S10.** Yedi alt kategori MEB programı ile nasıl eşleştirilmiştir?

**C10.** Alt kategoriler — geometrik tekrar, aritmetik dizi, karma kural, kare sayılar, üçgensel sayılar, eşleştirme, sıralama — `patternTopics.js` içinde `LEARNING_OUTCOME_BY_LABEL` ile kazanım metinlerine bağlanmıştır. Her şablon `assessmentMeta.adaptiveBand` ile önerilen sınıf aralığını taşır. Bu, program–ölçme uyumunu veri modeli düzeyinde görünür kılar.

---

**S11.** Sınıf düzeyine uygunluk nasıl garanti edilmektedir?

**C11.** Üç mekanizma vardır: (1) öğretmenin sınıf seçimi ile havuz filtreleme; (2) `isSampleTooAdvancedForGrade` ile program dışı içeriğin üretimden elenmesi — örneğin ilkokulda cebirsel ifade veya çevre problemlerinin engellenmesi; (3) `resolveTemplateKind` ile şablon türünün sınıfa indirgenmesi. Bu, pedagojik geçerliliği algoritmik denetimle destekler.

---

**S12.** Açık uçlu matematik cevaplarını neden puanlamıyorsunuz?

**C12.** Doğal dil işleme tabanlı açık uçlu puanlama, literatürde güvenilirlik ve şeffaflık sorunları barındırmaktadır (Henkel vd., 2025; Zhang vd., 2024). Edumath bilinçli olarak beş **yapılandırılmış** madde tipi (çoktan seçmeli, doğru/yanlış, boşluk doldurma, eşleştirme, sıralama) ile sınırlı kalmıştır. Bu, otomatik puanlamanın denetlenebilirliğini artırır.

---

## D. Psikometri, puanlama ve analitik

**S13.** Otomatik puanlama modeliniz nedir?

**C13.** Yapılandırılmış maddelerde puanlama deterministiktir: öğrenci yanıtı aᵢ ile anahtar kᵢ karşılaştırılır; eşleşme durumunda 1, aksi halde 0 puan. Toplam puan, doğru maddelerin toplamıdır. Eşleştirme ve sıralama tiplerinde tam küme eşleşmesi aranır (`questionGrading.js`). Model, KTT’nin madde düzeyi analizine girdi sağlayacak ham veriyi üretir.

---

**S14.** Zayıf konu eşiği 0,55 nasıl belirlendi?

**C14.** Eşik, `ML_WEAK_TOPIC_THRESHOLD` ortam değişkeni ile tanımlanır; varsayılan 0,55, konu düzeyinde ustalık (mastery) veya doğruluk oranının alt sınırı olarak kullanılır. Bu değer pilot verileri gelene kadar **tasarım parametresi** niteliğindedir; okul pilotu sonrası duyarlılık analizi ile kalibre edilebilir. Önemli olan, eşiğin kodda açık ve değiştirilebilir olmasıdır.

---

**S15.** priorityScore formülünün pedagojik gerekçesi nedir?

**C15.** `priorityScore = (1 − mastery) × (0,6 + 0,4 × volumeNorm)` formülü iki pedagojik kaygıyı birleştirir: düşük ustalık (müdahale gereksinimi) ve yeterli deneme hacmi (karar güvenilirliği). Az denenen konular cezalandırılmaz; volumeNorm düşükse öncelik skoru da düşer. Bu, öğrenme analitiğinde “veri yetersizliğinde aşırı yorumlama” riskini azaltır.

---

**S16.** Henüz veri olmayan öğrencide analiz nasıl çalışır?

**C16.** Cold-start durumunda `buildCurriculumSuggestions` devreye girer: öğrencinin sınıf düzeyindeki müfredat konuları öneri listesi olarak sunulur (`scoringProvider: curriculum-suggestion`). Bu, sistemin boş ekran göstermesini engeller; ancak öneriler performans verisine değil müfredat hizalamasına dayanır — sunumda bu ayrım açıkça belirtilmelidir.

---

## E. Yapay zekâ, algoritma ve etik

**S17.** “Yapay zekâ destekli” ifadesini nasıl savunuyorsunuz? Sinir ağı kullanmıyorsunuz.

**C17.** Yapay zekâ terimi bu tezde **dar anlamda derin öğrenme** ile eş anlamlı kullanılmamaktadır. Edumath, kural tabanlı çıkarım, istatistiksel skorlama (NumPy, ml-matrix) ve algoritmik madde üretimi ile ölçme sürecini otomatikleştirir. Meylani (2025)’nin vurguladığı algoritmik opaklık eleştirisine yanıt olarak, karar kuralları kod düzeyinde incelenebilir durumdadır.

---

**S18.** Arayüzde “AI ile oluştur” ifadesi yanıltıcı değil mi?

**C18.** İfade, öğretmenin manuel giriş yükünü azaltan otomatik üretim modunu tanımlar; arkada `AI_PROVIDER=local` ile havuz tabanlı hattı çalışır. Üretim, onaylı maddelerden türetilen varyasyon ve matematik şablonlarına dayanır; LLM serbest metin üretimi varsayılan değildir. Sunumda “YZ destekli” yerine gerektiğinde “algoritmik–havuz tabanlı üretim” ifadesi tercih edilebilir.

---

**S19.** Gemini veya ChatGPT neden birincil yol değil?

**C19.** Üç gerekçe: (1) **Pedagojik uyum** — MEB kazanımlarına hizalı, sınıf filtreli üretim; (2) **Etik şeffaflık** — dış API’ye bağımlı kapalı kutu yerine denetlenebilir pipeline; (3) **Maliyet ve sürdürülebilirlik** — devlet okulu ölçeğinde API maliyeti. Gemini, `AI_PROVIDER=gemini` ile ipucu ve metin analizi gibi ikincil görevler için opsiyonel bırakılmıştır.

---

**S20.** Meylani (2025) etik eleştirisine Edumath’ın yanıtı nedir?

**C20.** Meylani, otomatik değerlendirmede algoritmik kararların pedagojik gerekçesinin görünür olması gerektiğini savunmaktadır. Edumath, puanlama kurallarını, zayıf konu formülünü ve üretim hattını açık kaynak kod ve dokümantasyonla sunar; öğretmen onayı zorunlu kılınmıştır. Böylece “kara kutu” yerine “denetlenebilir kutu” modeli hedeflenmektedir.

---

## F. Yazılım mimarisi ve teknik doğrulama

**S21.** Üç katmanlı mimarinin gerekçesi nedir?

**C21.** Ayrım, endişelerin ayrılması (separation of concerns) ilkesine dayanır: React/Vite sunum katmanı, Node.js/Express iş mantığı ve yetkilendirme, Python/FastAPI ise sayısal üretim ve skorlama. Bu, matematik eğitimi araştırmacısının ML kodunu pedagojik parametrelerle izole biçimde güncellemesine olanak tanır.

---

**S22.** Havuz tabanlı üretim hattının teknik adımları nelerdir?

**C22.** (1) MongoDB’den metin tabanlı havuz örnekleri çekilir; (2) ml-service `generate-from-pool` ile sayı varyasyonu veya şablon üretimi yapılır; (3) yerel çözücü (`question_solver.py`) doğru cevabı doğrular; (4) JS fallback ml-service kapalıysa devreye girer; (5) öğretmen önizleme ve onay. `generatorMethod` alanı (pool-variant, template, elementary-template) üretim kaynağını izlenebilir kılar.

---

**S23.** Teknik doğrulamayı nasıl belgeliyorsunuz?

**C23.** 23 frontend test dosyası, deterministik grading testleri, uçtan uca üretim hattının canlı Render ortamında doğrulanması ve açık GitHub deposu (https://github.com/Bahri26/edumath). Bu, yazılım mühendisliği düzeyinde tekrarlanabilirliği destekler; pedagojik etki için okul pilotu ayrıca gereklidir.

---

**S24.** TensorFlow, karar ağacı veya sklearn iddiaları doğru mu?

**C24.** Hayır. Eski tez taslağındaki bu ifadeler gerçek kod tabanıyla uyumsuzdu ve kaldırılmıştır. Zayıf konu skorlamasında ml-matrix (Öklid mesafesi) veya NumPy tabanlı `weak_topics.py` kullanılmaktadır. sklearn requirements dosyasında olabilir ancak analitik akışta birincil motor değildir.

---

## G. Pilot, etik kurul ve genellenebilirlik

**S25.** Etik kurul durumu nedir?

**C25.** Anadolu Üniversitesi Etik Kurulu izni **planlanmaktadır**; henüz alınmamıştır. Pilot öncesi veli/onay, veri minimizasyonu ve anonimleştirme protokolleri tez yöntem bölümünde tanımlanacaktır. Bugün sunumda öğrenci verisiyle empirik analiz iddia edilmemelidir.

---

**S26.** Pilot tasarımınız nasıl olacak?

**C26.** Ön-görüşme aşamasında tek grup ön-test–son-test veya eşdeğer grup karşılaştırması değerlendirilecektir. Bağımlı değişkenler: konu düzeyinde doğruluk, tamamlama oranı, öğretmen algısı (nitel). Bağımsız değişken: Edumath destekli formatif ölçme döngüsü. Detay, etik kurul başvurusu ile kesinleşecektir.

---

**S27.** Bulgularınız genellenebilir mi?

**C27.** Teknik mimari açık kaynak olduğundan **transfer edilebilir**; pedagojik genellenebilirlik ise pilot örneklemin temsil gücüne bağlı olacaktır. Tez, genelleme iddiasını pilot sonrası sınırlandıracaktır. Şu an için “platform çalışır durumda” iddiası teknik düzeydedir.

---

**S28.** Eski taslaktaki %97 doğruluk ve %12 performans artışı iddiaları?

**C28.** Bu rakamlar empirik veriye dayanmıyordu; tez metninden ve sunum materyallerinden **bilinçli olarak çıkarılmıştır**. Jüriye dürüstçe: “Pilot öncesi dönemdeyiz; psikometrik ve etki verisi henüz toplanmadı” denmelidir. Bu, bilimsel dürüstlük gereğidir.

---

## H. Özgün katkı, sınırlılıklar ve karşılaştırma

**S29.** Tezinizin özgün katkısını üç cümlede özetleyin.

**C29.** (1) K–12 matematik ölçme-değerlendirme zincirinin — üretim, uygulama, puanlama, analitik — bütünleşik web tabanlı modeli; (2) MEB örüntü kazanımlarına hizalı yedi alt kategorili taksonomi ve sınıf duyarlı havuz tabanlı madde üretim hattı; (3) Kapalı LLM bağımlılığı yerine denetlenebilir yerel algoritmik alternatif.

---

**S30.** Khan Academy, Google Classroom veya benzer platformlardan farkınız nedir?

**C30.** Edumath, genel LMS işlevlerinden ziyade **ölçme-değerlendirme sürecinin modellenmesine** odaklanır. Özellikle Türkiye bağlamında MEB kazanım etiketli madde havuzu, yerel üretim hattı ve zayıf konu analitiği bütünleşiktir. Kapsamlı içerik kütüphanesi veya video ders iddiası yoktur; derinlik ölçme mühendisliğindedir.

---

**S31.** En önemli sınırlılıklarınız nelerdir?

**C31.** (1) Empirik pilot ve psikometrik analiz henüz yok; (2) açık uçlu madde puanlaması yok; (3) birincil içerik odağı örüntü; (4) Render free tier cold-start gecikmesi; (5) zayıf konu eşiği henüz kalibre edilmemiş tasarım parametresi.

---

**S32.** Öğretmen rolünü sistem nasıl koruyor?

**C32.** Üretilen maddeler öğretmen onayı olmadan soru bankasına ve öğrenciye ulaşmaz. Sınav yayınlama, konu seçimi ve rapor yorumu öğretmen kontrolündedir. Seven & Erümit (2024)’ün vurguladığı “uzman denetimi” ilkesi, Edumath’ta zorunlu bir iş akışı adımıdır — opsiyonel değil.

---

## I. Demo ve uygulama soruları

**S33.** Canlı demo başarısız olursa ne yaparsınız?

**C33.** Teknik arıza sunumun bilimsel içeriğini geçersiz kılmaz. Ekran görüntüleri (`docs/sunum/`), mimari slaytı ve GitHub deposu yedek kanıt sunar. “Soğuk başlatma” Render free tier’ın bilinen sınırlılığıdır; bu, pilot öncesi teknik doğrulama bağlamında açıklanabilir.

---

**S34.** Smart Paste (OCR) pedagojik olarak ne işe yarar?

**C34.** Öğretmenin kağıt ortamındaki veya dijital kaynaklardaki mevcut maddeleri platforma aktarma yükünü azaltır. Tesseract OCR + `question_parse.py` ile yapılandırılmış alanlar doldurulur; öğretmen düzenler ve onaylar. Bu, madde bankası zenginleştirmesini hızlandırır; otomatik psikometrik onay anlamına gelmez.

---

**S35.** Egzersiz akışında zorluk bandı neden kaldırıldı?

**C35.** Ölçme hedefi “aynı zorluk düzeyinde paket”ten “belirli konu ve madde tipinde hedeflenmiş ölçme”ye kaydırılmıştır. Zorluk, seçilen soruların metadata’sında korunur; öğretmen havuzdan bilinçli seçim yapabilir. Bu, formatif uygulamada konu–tip hizalamasını önceler.

---

## J. Savunma stratejisi — zor sorular

**S36.** “Bu bir yazılım projesi, tez değil” denirse?

**C36.** Edumath, matematik eğitiminde ölçme-değerlendirme sürecinin kuramsal modelidir; yazılım bu modelin operasyonelleştirilmesidir. DBR geleneğinde tasarım artefaktı, araştırmanın merkezinde yer alır. Empirik pilot, modelin pedagojik geçerliliğini sınamak için planlanmıştır — yazılım tek başına nihai bulgu olarak sunulmamaktadır.

---

**S37.** “YZ dediğiniz şey aslında if–else” denirse?

**C37.** Kabul edilebilir bir tespittir — ve bilinçli tercihtir. Araştırma sorusu, en karmaşık modeli kullanmak değil; **pedagojik olarak savunulabilir ve denetlenebilir** otomasyonu sağlamaktır. Literatürde LLM puanlamasının güvenirlik sorunları rapor edilmektedir; Edumath bu riski yapılandırılmış madde tipi ve açık kurallarla sınırlar.

---

**S38.** “Pilot olmadan tez savunması erken değil mi?”

**C38.** TIK/izleme döneminde teknik olgunluk ve kuramsal çerçevenin sunulması beklenmektedir. Empirik bulgular bir sonraki dönemin hedefidir. Sunumda tamamlanan (platform, kılavuz, teknik doğrulama) ile planlanan (pilot, KTT, makale) net ayrılmaktadır.

---

**S39.** Danışmanınız bu mimariyi nasıl değerlendiriyor?

**C39.** *(Kişisel not — provada kendi deneyiminizi ekleyin.)* Genel çerçeve: danışman Prof. Dr. Hüseyin Bahadır Yanık’ın matematik eğitimi odaklı perspektifi, platformun MEB uyumu ve ölçme odaklı tasarımını desteklemektedir. Spesifik geri bildirimleri sunumda kısa örnekle belirtmek ikna edicidir.

---

**S40.** Bir sonraki yıl ne teslim edeceksiniz?

**C40.** Etik kurul onayı, okul pilotu verileri, madde analizi (p, r), güvenirlik raporu (α), öğretmen görüşme bulguları, tez bulgular–tartışma bölümünün empirik veriyle yazılması ve mümkünse hakemli dergi makalesi taslağı.

---

## XV.1 Hızlı indeks — anahtar kelime → soru no.

| Jüri muhtemel ifadesi | Bakınız |
|------------------------|---------|
| TensorFlow, sinir ağı, deep learning | S17, S24 |
| %97, %12, α=0,81 | S4, S28 |
| ChatGPT, Gemini, LLM | S18, S19 |
| Cronbach, madde analizi, KTT | S6, S13 |
| Etik kurul, pilot | S25, S26, S38 |
| Özgün katkı, fark | S29, S30 |
| Öğretmen onayı | S20, S32 |
| MEB, örüntü, kazanım | S8, S9, S10 |
| Zayıf konu, 0,55 | S14, S15 |
| Açık uçlu, NLP | S12 |
| Genellenebilirlik | S27 |
| Yazılım mı tez mi | S36 |

---

*Edumath Sunum — Matematik: Emre İncekalan · Yazılım: Bahri KOÇ · Son güncelleme: Haziran 2026*

*PDF: `python scripts/md_to_pdf.py docs/edumath-sunum.md`*
