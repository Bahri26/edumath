# EduMath: Yapay Zeka Destekli Uyarlanabilir Öğrenme Platformu  
## Bilimsel Tez Raporu (Teknik ve Operasyonel Değerlendirme)

## Özet
Bu çalışma, ortaöğretim düzeyinde matematik öğrenimini desteklemek amacıyla geliştirilen EduMath platformunun mimari yapısını, işlevsel modüllerini ve eğitim teknolojisi bağlamındaki katkılarını incelemektedir. Sistem; React tabanlı bir istemci katmanı, Node.js/Express tabanlı bir servis katmanı, MySQL veri yönetimi ve Gemini destekli yapay zeka servisleri ile çok katmanlı bir tasarım sunmaktadır. Platformun temel hedefi, öğretmenler için veri-temelli karar desteği sağlarken öğrenciler için uyarlanabilir, geri bildirim odaklı ve oyunlaştırılmış bir öğrenme deneyimi üretmektir. Çalışmada sistemin rol-temelli erişim modeli, API tabanlı servis organizasyonu, AI destekli geribildirim mekanizmaları, DevOps dağıtım yaklaşımı ve araştırma potansiyeli tartışılmaktadır.

## 1. Giriş
Dijital öğrenme platformlarının yaygınlaşması, ölçme-değerlendirme süreçlerinin kişiselleştirilmesi ve öğrenme analitiklerinin öğretim tasarımına entegre edilmesi gereksinimini artırmıştır. EduMath bu gereksinime, klasik "soru çözme" deneyimini veri-odaklı öğretim döngüsüne dönüştürerek yanıt vermeyi amaçlar. Platform yalnızca sınav uygulayan bir sistem değil; aynı zamanda öğretmenin pedagojik kararlarını destekleyen ve öğrencinin öğrenme sürecine anlık geri bildirim sağlayan bütünleşik bir ekosistem olarak tasarlanmıştır.

## 2. Araştırma Problemi ve Amaç
### 2.1 Problem Tanımı
Geleneksel çevrim içi sınav sistemleri çoğunlukla statik içerik sunar, öğrencinin hata örüntüsünü açıklamaz ve öğretmene aksiyon alınabilir analiz üretmez. Bu durum, düşük performans gösteren öğrencilerde erken müdahale fırsatını sınırlar.

### 2.2 Çalışmanın Amaçları
- Öğrenci performansını izleyebilen ve rol bazlı yönetilebilen ölçeklenebilir bir LMS altyapısı oluşturmak.
- Yanlış cevaplara açıklayıcı, Sokratik ve motive edici geri bildirim mekanizmaları eklemek.
- Öğretmen için sınav/soru/anket yönetimini tek panelde toplamak.
- Oyunlaştırma bileşenleri ile öğrenme sürekliliğini artırmak.
- Bulut tabanlı dağıtıma uygun DevOps hattı kurmak.

## 3. Yöntem ve Sistem Mimarisi
### 3.1 Katmanlı Mimari Yaklaşımı
EduMath mimarisi dört ana katmandan oluşur:
1. Sunum Katmanı (Frontend)
2. Servis Katmanı (Backend API)
3. Veri Katmanı (MySQL + Knex)
4. Zekâ Katmanı (Gemini + Python analiz araçları)

Bu yaklaşım, modüller arası gevşek bağlılık (loose coupling) ve bakım kolaylığı sağlamaktadır.

### 3.2 Frontend Mimarisi
Frontend tarafı React + Vite altyapısı üzerine kuruludur. Sayfa yönlendirmesi React Router ile yapılmakta; öğrenci, öğretmen ve yönetici arayüzleri rol tabanlı erişim kontrolü ile ayrıştırılmaktadır. `ProtectedRoute` bileşeni, rol doğrulaması yaparak kullanıcının yetkisi dışındaki sayfalara erişmesini engeller. 

Arayüzde;
- KaTeX ile matematiksel gösterim,
- Recharts ile grafik tabanlı analiz,
- Axios ile API haberleşmesi,
- Yerel oturum yönetimi (token tabanlı) kullanılmaktadır.

### 3.3 Backend Mimarisi
Backend, Express tabanlı REST API biçiminde tasarlanmıştır. `index.js` içinde route dosyaları otomatik mount edilmekte ve servisler `/api/*` altında yayınlanmaktadır. Bu yapı, controller-repo ayrımıyla modülerdir:
- Controller katmanı: iş kuralları ve HTTP yanıtları,
- Repo katmanı: veritabanı erişimi,
- Middleware katmanı: kimlik doğrulama ve yetkilendirme.

Sistemde `authenticate` ve `requireRole` middleware’leri ile JWT doğrulama yapılır; rol denetimi token + veritabanı fallback yaklaşımıyla gerçekleştirilir.

### 3.4 Veri Katmanı
MySQL üzerinde ilişkisel veri modeli kullanılmakta, şema yönetimi için Knex migration/seed komutları işletilmektedir. Bu yaklaşım, sürümler arası şema tutarlılığı ve dağıtım güvenliği için önemlidir.

## 4. Modül Bazlı İşlevsel İnceleme
### 4.1 Kimlik Doğrulama ve Yetkilendirme
- `authController`: kayıt ve giriş işlemleri
- `bcrypt`: parola hashleme
- `jsonwebtoken`: erişim belirteci üretimi
- rol tabanlı erişim: öğrenci (3), öğretmen (2), yönetici (1)

Bu yapı, hem istemci rotalarında hem API seviyesinde çift katmanlı güvenlik sağlar.

### 4.2 Ölçme-Değerlendirme Modülleri
Sınavlar, sorular, seçenekler ve öğrenci cevapları ayrı controller/repo akışlarıyla yönetilir. Öğretmen; soru bankası oluşturma, sınav kurgulama ve anket yayınlama yetkisine sahiptir. Öğrenci; atanmış sınavlara katılır, sonuçlarını inceler ve geri bildirim alır.

### 4.3 Öğrenme Analitiği ve Erken Uyarı
Analitik bileşenler sınıf/öğrenci performansını özetleyerek öğretmene karar desteği sağlar. Uyarı modülleri, düşen başarı eğilimleri için erken müdahale zemini oluşturur.

### 4.4 Oyunlaştırma Katmanı
- günlük görevler,
- puan/ödül mekanizması,
- rozet ve mağaza bileşenleri

bu sistemin davranışsal tasarım yönünü güçlendirir. Amaç, yalnızca performans ölçmek değil; öğrenme motivasyonunu sürdürülebilir hale getirmektir.

### 4.5 Kullanıcı Bazlı Operasyonel Kullanım (Öğretmen ve Öğrenci)
Bu alt bölüm, sistemin sahadaki kullanımını iki temel aktör üzerinden açıklamaktadır.

#### 4.5.1 Öğretmen Kullanım Akışı
1. **Kimlik doğrulama ve panel erişimi:** Öğretmen kullanıcı, giriş ekranı üzerinden sisteme giriş yapar; JWT üretimi sonrası rol doğrulaması tamamlanarak öğretmen paneline yönlendirilir.
2. **Müfredat ve içerik planlama:** Öğretmen, ders/ünite/konu hiyerarşisini oluşturur; ilgili konuya ders materyali ekler.
3. **Soru bankası üretimi:** Öğretmen, soru bankasına yeni sorular ekler; soruları konu ve zorluk düzeyine göre sınıflandırır.
4. **Sınav oluşturma ve yayınlama:** Soru havuzundan seçilen maddelerle sınav kurgulanır; süre, erişim ve yayın parametreleri belirlenir.
5. **Anket ve geri bildirim yönetimi:** Öğretmen, öğrenen deneyimini izlemek için anket oluşturur ve öğrencilere atar.
6. **Analitik izleme ve müdahale:** Öğretmen panelindeki analiz ekranlarından başarı eğrilerini izler; riskli öğrenciler için hedefli telafi aksiyonları planlar.
7. **AI destekli içerik üretimi:** Gerektiğinde AI modülünü kullanarak konu özeti, yeni soru önerisi veya açıklayıcı içerik üretir.

#### 4.5.2 Öğrenci Kullanım Akışı
1. **Kimlik doğrulama ve kişisel panel:** Öğrenci sisteme giriş yapar ve yalnızca kendi rolüne açık ekranlara erişir.
2. **Günlük öğrenme planı:** Öğrenci panelinde günlük görevler, aktif sınavlar ve kişisel ilerleme bileşenleri görüntülenir.
3. **Sınava katılım:** Öğrenci, atanmış sınavı başlatır; sorulara yanıt verirken süre ve sınav kuralları sistem tarafından uygulanır.
4. **AI destekli yönlendirme:** Zorlandığı sorularda ipucu mekanizmasını kullanır; sistem cevabı doğrudan vermeden çözüm yaklaşımını destekler.
5. **Sonuç ve hata analizi:** Sınav sonunda öğrenci, yanlış cevaplarını ve konu bazlı eksiklerini inceler; sistemden açıklayıcı geri bildirim alır.
6. **Kişiselleştirilmiş güçlendirme:** Öğrenci, zayıf konu önerilerini takip ederek tekrar yapar ve yeni öğrenme hedefleri belirler.
7. **Oyunlaştırma etkileşimi:** Görev tamamlama, puan biriktirme, rozet kazanma ve mağaza etkileşimleri ile motivasyon döngüsü sürdürülür.

#### 4.5.3 Rol Ayrımı ve Pedagojik Etki
Öğretmen rolü; içerik tasarımı, ölçme-değerlendirme yönetimi ve veri temelli müdahale sorumluluğunu taşırken, öğrenci rolü; aktif katılım, öz-düzenleme ve geri bildirim temelli öğrenme geliştirme sorumluluğu taşır. Bu görev ayrımı, platformda hem operasyonel netlik hem de pedagojik süreklilik üretmektedir.

### 4.6 Ekran Bazlı Kullanım Açıklamaları
Bu bölüm, sistemde yer alan temel ekranların kullanıcı açısından ne işe yaradığını ve hangi operasyonel çıktıyı ürettiğini açıklar.

#### 4.6.1 Ortak ve Giriş Ekranları
- **Ana Sayfa (`/`, `/home`)**: Platformun genel tanıtımını, yönlendirme bileşenlerini ve temel erişim noktalarını sunar.
- **Giriş Ekranı (`/login`)**: Kullanıcının kimlik bilgilerini doğrular; başarılı girişte rolüne uygun panele yönlendirir.
- **Kayıt Ekranı (`/register`)**: Yeni kullanıcı oluşturma işlemini yürütür; rol bilgisiyle erişim çerçevesi tanımlar.
- **Şifre Sıfırlama (`/forgot-password`)**: Hesap erişimi sorunu yaşayan kullanıcı için güvenli kurtarma akışı başlatır.
- **Profil (`/profile`)**: Kullanıcıya ait kimlik ve hesap bilgilerinin görüntülenmesi/güncellenmesi için kullanılır.
- **Ayarlar (`/settings`)**: Hesap ve uygulama tercihlerini düzenleme ekranıdır.

#### 4.6.2 Öğrenci Ekranları
- **Öğrenci Paneli (`/student-dashboard`)**: Günlük görevler, aktif sınavlar, motivasyon bileşenleri ve kişisel ilerleme özetini tek noktada toplar.
- **Sınav Listesi (`/student-exams`)**: Öğrenciye atanmış sınavları listeler; sınav uygunluk ve erişim durumunu gösterir.
- **Sınav Çözüm Ekranı (`/take-exam/:examId`)**: Soru yanıtlamanın gerçekleştiği ana çalışma alanıdır; süre ve işlem akışı bu ekranda yönetilir.
- **Sınav Sonuç Ekranı (`/exam-result/:examId`)**: Performans özeti, doğru-yanlış dağılımı ve geri bildirim çıktıları gösterilir.
- **Öğrenme Yolu (`/learning-path`)**: Öğrencinin zayıf/öncelikli konularına göre ilerleme rotası sunar.
- **Mağaza (`/shop`)**: Oyunlaştırma puanlarının rozet/özelleştirme etkileşimine dönüştüğü motivasyon ekranıdır.
- **Anket Katılım (`/take-survey/:id`)**: Öğrenci geri bildiriminin toplandığı ölçme ekranıdır.

#### 4.6.3 Öğretmen Ekranları
- **Öğretmen Paneli (`/teacher-dashboard`)**: Sınıf genel durumunu, kritik metrikleri ve yönetim kısayollarını gösterir.
- **Analiz Ekranı (`/teacher-analysis`)**: Öğrenci ve sınıf performansını grafik/rapor düzeyinde inceler; müdahale kararı üretir.
- **Sınav Oluşturma (`/create-exam`)**: Sınav kurgusu, süre ve yayın parametrelerinin belirlendiği yapılandırma ekranıdır.
- **Sınav Yönetimi (`/exams`)**: Sınavların listelendiği, güncellendiği ve takip edildiği operasyon ekranıdır.
- **Soru Bankası (`/question-bank`)**: Soruların merkezi depolandığı, filtrelendiği ve yeniden kullanıldığı içerik yönetim alanıdır.
- **Soru Oluşturma (`/create-question`)**: Yeni soru ve seçenek üretimi ile kazanım/zorluk etiketlemesinin yapıldığı ekrandır.
- **Soru Düzenleme (`/edit-question/:id`)**: Mevcut soruların içerik kalitesini iyileştirmek için revizyon ekranıdır.
- **Sınava Soru Ekleme (`/add-questions/:examId`)**: Sınav-soru eşleştirmesinin yapıldığı bağlama ekranıdır.
- **Anket Oluşturma (`/create-survey`)**: Öğrenci deneyimi ve öğrenme algısı için anket tasarlama ekranıdır.
- **Anket İstatistikleri (`/survey-stats/:surveyId`)**: Anket sonuçlarının özet ve karşılaştırmalı analizinin yapıldığı ekrandır.

#### 4.6.4 Yönetici (Admin) Ekranları
- **Admin Paneli (`/admin-dashboard`)**: Sistem genel sağlığı, yönetsel özetler ve kritik duyuruların toplandığı ana yönetim ekranıdır.
- **Onay Süreçleri (`/admin/approvals`)**: Sistem içi onay mekanizmalarının kontrol edildiği karar ekranıdır.
- **Kullanıcı Yönetimi (`/admin/users`)**: Hesap, rol ve kullanıcı yaşam döngüsü işlemlerinin yürütüldüğü yönetim ekranıdır.
- **Duyurular (`/admin/announcements`)**: Kurumsal iletişim ve sistem içi bilgilendirme yayın ekranıdır.
- **Rapor Yönetimi (`/admin/reports`)**: Operasyonel/akademik raporların izlendiği ve yönetildiği ekrandır.
- **Alarm Yönetimi (`/admin/alerts`)**: Kritik uyarıların izlenmesi ve aksiyon planlarının tetiklendiği ekrandır.
- **Sistem Ayarları (`/admin/settings`)**: Uygulama ölçeğinde konfigürasyon ve politika ayarlarının yönetildiği ekrandır.
- **Denetim Kayıtları (`/admin/logs`)**: İzlenebilirlik ve güvenlik denetimi için işlem kayıtlarının incelendiği ekrandır.

#### 4.6.5 Ekranlar Arası Veri Akışı Özeti
Ekranlar arası akış, kimlik doğrulama sonrası rol-temelli yönlendirme prensibine dayanır. Kullanıcının ekran düzeyindeki her eylemi, API çağrısı üzerinden backend servislerine taşınır; sonuçlar tekrar arayüzde görselleştirilir. Bu yapı, kullanıcı deneyimi ile veri bütünlüğü arasında çift yönlü ve izlenebilir bir operasyonel döngü kurar.

## 5. Yapay Zeka Entegrasyonu
### 5.1 Gemini Tabanlı Servisler
`backend/routes/ai.js` üzerinden Gemini API çağrıları gerçekleştirilmektedir. Mevcut uçlar:
- `analyze-mistake`: yanlışın nedenini açıklama,
- `hint`: cevabı vermeden yönlendirici ipucu üretme,
- `check-code`: kod kalitesi/karmaşıklık değerlendirmesi,
- `generate-material`: öğretmene ders özeti/içerik üretimi,
- `analyze-vision`: görsel analiz için genişletilebilir uç.

Bu tasarım, üretken AI’yı doğrudan pedagojik geri bildirim döngüsüne yerleştirmektedir.

### 5.2 Python Tabanlı Analiz Araçları
`tools` klasöründeki scriptler, araştırma/prototip niteliğinde AI-analitik işlevler sunmaktadır:
- `adaptive_test.py`: kural tabanlı uyarlanabilir soru seçimi,
- `auto_feedback_nlp.py`: NLP ile anahtar kavram odaklı geri bildirim,
- `student_recommendation.py`: zayıf konu önerisi,
- `survey_analysis.py` ve içerik üretim scriptleri: destekleyici analiz/generasyon akışları.

Bu araçlar, ileride servisleştirilerek (ör. FastAPI) backend’e daha sıkı entegre edilebilecek bir araştırma hattı sunar.

## 6. DevOps, Dağıtım ve Operasyon
### 6.1 Konteynerleşme
Frontend ve backend için ayrı Dockerfile’lar kullanılır. Bu sayede ortam bağımsız ve tekrar üretilebilir dağıtım yapılır.

### 6.2 Bulut Dağıtım
`cloudbuild.yaml` dosyası, iki servisin imajlarını üretip registry’ye gönderen ve bulut ortamına dağıtan bir CI/CD akışı tanımlar. Böylece sürümleme ve yayın süreçleri otomasyona bağlanır.

### 6.3 Test ve Kalite
Backend tarafında Jest/Supertest altyapısı bulunur. Bu, kritik API davranışlarının regresyon testleriyle güvence altına alınmasına temel sağlar.

## 7. Bilimsel Katkı Değerlendirmesi
EduMath’in akademik açıdan öne çıkan yönleri:
- Uyarlanabilir öğrenmeyi uygulama seviyesinde somutlaştırması,
- Sokratik AI geri bildirimiyle cevap odaklı değil süreç odaklı öğrenmeyi desteklemesi,
- Öğretmen panelinde analitik + üretken AI birleşimiyle veri temelli öğretim kararı üretmesi,
- Oyunlaştırma ile bilişsel performans yanında davranışsal devamlılığı hedeflemesi.

## 8. Sınırlılıklar
- Python tabanlı bazı modüller halen prototip seviyesindedir; tam üretim entegrasyonu için servisleştirme gerekir.
- Etki analizi (öğrenme kazancı artışı, retention artışı) için kontrollü deneysel çalışma henüz raporlanmamıştır.
- Üretken AI çıktılarında doğruluk/halüsinasyon kontrolü için ek doğrulama katmanları geliştirilebilir.

## 9. Gelecek Çalışmalar
- IRT/BKT tabanlı daha gelişmiş adaptif test motoru,
- Öğretmen için açıklanabilir AI paneli (neden bu öneri verildi?),
- Öğrenci düzeyinde uzunlamasına öğrenme eğrisi modelleme,
- A/B test tasarımları ile oyunlaştırma etkisinin nicel ölçümü,
- KVKK/GDPR uyumlu veri anonimleştirme ve etik denetim modülleri.

## 10. Sonuç
EduMath, eğitim teknolojilerinde "sınav uygulaması" yaklaşımının ötesine geçerek; rol-temelli yönetim, öğrenme analitiği, üretken AI destekli pedagojik geribildirim ve oyunlaştırma bileşenlerini tek bir platformda birleştiren bütünleşik bir sistem sunmaktadır. Mevcut mimari; akademik tez çalışmaları, saha uygulamaları ve ölçeklenebilir ürün geliştirme için güçlü bir temel oluşturmaktadır.

## 11. Araştırma Soruları ve Hipotezler
Tez düzeyinde değerlendirildiğinde çalışmanın bilimsel çerçevesi aşağıdaki araştırma soruları ile netleştirilebilir:

### 11.1 Araştırma Soruları
- **AS1:** AI destekli Sokratik geri bildirim, klasik doğru/yanlış geri bildirimine kıyasla öğrencinin konu kazanımını artırır mı?
- **AS2:** Uyarlanabilir test mekanizması, sabit zorluklu testlere göre ölçme duyarlılığını artırır mı?
- **AS3:** Oyunlaştırma bileşenleri (görev, rozet, mağaza) öğrenci devamlılığı ve platform etkileşimini anlamlı biçimde yükseltir mi?
- **AS4:** Öğretmen panelindeki analitik göstergeler, riskli öğrencilerin erken tespitinde karar kalitesini artırır mı?

### 11.2 Test Edilebilir Hipotezler
- **H1:** Deney grubunda (AI geri bildirimli) son-test puan artışı kontrol grubundan yüksektir.
- **H2:** Uyarlanabilir test modunda soru başına ayırt edicilik ve ölçme verimi daha yüksektir.
- **H3:** Oyunlaştırma açık olduğunda haftalık aktif kullanım süresi ve görev tamamlama oranı artar.
- **H4:** Analitik panel kullanan öğretmenlerin riskli öğrenciye müdahale süresi daha kısadır.

## 12. Deneysel Değerlendirme Tasarımı
Bilimsel geçerliliği güçlendirmek için aşağıdaki deneysel tasarım önerilmektedir.

### 12.1 Çalışma Deseni
- **Yarı deneysel desen (quasi-experimental):** Benzer başlangıç seviyesine sahip iki grup (kontrol/deney).
- **Süre:** 6–8 haftalık uygulama döngüsü.
- **Ölçümler:** Ön-test, ara test, son-test ve gecikmeli kalıcılık testi.

### 12.2 Örneklem ve Gruplama
- Sınıf düzeyi, önceki başarı puanı ve demografik değişkenler dengelenerek gruplar oluşturulur.
- Öğretmen etkisini azaltmak için mümkünse aynı öğretmenin iki grubu paralel yürütmesi önerilir.

### 12.3 Veri Toplama Kaynakları
- Sınav puanları ve konu bazlı doğruluk oranları,
- AI ipucu kullanım sıklığı ve hata analizi etkileşimleri,
- Görev/rozet tamamlama kayıtları,
- Öğretmen müdahale zaman damgaları,
- Anket verileri (algılanan fayda, kullanılabilirlik, motivasyon).

## 13. Başarı Ölçütleri ve İstatistiksel Analiz
### 13.1 Birincil Metrikler
- **Öğrenme Kazancı:** Son-test – ön-test puan farkı.
- **Konu Yetkinliği:** Konu bazlı doğru cevap oranı.
- **Devamlılık (Retention):** Haftalık aktif gün sayısı, platformda kalma süresi.
- **Etkileşim:** AI ipucu kullanım oranı, görev tamamlama oranı.

### 13.2 İkincil Metrikler
- Sınav tamamlama süresi,
- Öğretmen müdahale gecikmesi,
- Anket memnuniyet puanları,
- Sistem güvenilirliği (hata oranı, API başarım süresi).

### 13.3 Analiz Yöntemleri
- Parametrik varsayımlar sağlanırsa bağımsız örneklem t-testi / ANOVA,
- Varsayımlar sağlanmazsa Mann–Whitney U / Kruskal–Wallis,
- Etki büyüklüğü için Cohen’s d veya Cliff’s delta,
- Çok değişkenli etki için doğrusal/lojistik regresyon.

## 14. Geçerlilik Tehditleri ve Azaltım Stratejileri
### 14.1 İç Geçerlilik
- **Seçim yanlılığı:** Gruplar başlangıç puanına göre eşleştirilmelidir.
- **Olgunlaşma etkisi:** Çalışma süresi boyunca harici öğrenme kaynakları kaydedilmelidir.

### 14.2 Dış Geçerlilik
- Tek okul/tek sınıf örneklemi genellenebilirliği sınırlar; çok merkezli uygulama önerilir.

### 14.3 Yapı Geçerliliği
- "Motivasyon" ve "öğrenme kalitesi" gibi soyut kavramlar, geçerli ölçeklerle ölçülmelidir.

### 14.4 Sonuç Geçerliliği
- Çoklu hipotez testlerinde Tip-I hata birikimine karşı düzeltme yöntemleri (ör. Bonferroni) uygulanmalıdır.

## 15. Etik, Gizlilik ve Uyum
### 15.1 Veri Koruma
- Öğrenci verileri minimum gerekli kapsamda tutulmalı, kişisel veriler maskelenmeli/anonimleştirilmelidir.
- Erişim logları ve rol bazlı yetki kontrolleri düzenli denetlenmelidir.

### 15.2 AI Etik İlkeleri
- Üretken AI çıktıları pedagojik öneri olarak konumlandırılmalı, nihai akademik karar öğretmende kalmalıdır.
- Hatalı/uygunsuz AI çıktılarına karşı insan denetimi ve geri çağırma mekanizması tanımlanmalıdır.

### 15.3 Yasal Uyum
- Türkiye bağlamında KVKK; uluslararası kullanımda GDPR ilkeleri gözetilmelidir.
- Bilgilendirilmiş onam, veli onayı (gerektiğinde) ve araştırma etik kurul süreçleri tamamlanmalıdır.

## 16. Gemini Entegrasyonunun Derinleştirilmesi: API ve Algoritmik Tasarım
Bu bölüm, EduMath içinde Gemini tabanlı yapay zekâ katmanının üretim seviyesinde nasıl genişletileceğini tanımlar. Amaç; mevcut ipucu/açıklama işlevinin ötesine geçip öğrenci analitiği, PDF/görselden soru çıkarımı ve havuzdan varyant üretimini tek bir servis mimarisinde birleştirmektir.

### 16.1 Mevcut Durum Analizi
Kod tabanında Gemini kullanımı iki farklı yolla ilerlemektedir: 
- `backend/routes/ai.js` içinde `@google/genai` ile metin üretimi,
- `backend/routes/ai_content.js` içinde REST tabanlı eski endpoint çağrısı (axios).

Bilimsel ve operasyonel tutarlılık için tek SDK (`@google/genai`) altında birleşik bir AI servis katmanı önerilir. Böylece model sürümü, güvenlik, loglama ve hata yönetimi standardize edilir.

### 16.2 Önerilen Mikro-Mimari
AI katmanı aşağıdaki bileşenlere ayrılmalıdır:
1. **AI Gateway (`/api/ai/*`)**: Tüm Gemini çağrılarının tek giriş noktası.
2. **Prompt Builder**: Görev bazlı sistem prompt + güvenlik kuralları + çıktı şeması üretimi.
3. **Validation Layer**: Gemini çıktısını zorunlu JSON şemasına göre doğrulama.
4. **Post-Processor**: Zorluk puanı kalibrasyonu, tekrar/benzerlik filtresi, etiketleme.
5. **Audit Logger**: İstek, model, token, süre, hata, kullanıcı rolü kayıtları.

Bu ayrım, tez kapsamında “yeniden üretilebilir AI deneyleri” için kritik izlenebilirlik sağlar.

### 16.3 Öğrenci Analizi (Student Analytics) Algoritması
Öğrenci analizi sadece tek soru düzeyinde değil, öğrenme oturumu düzeyinde yapılmalıdır.

#### 16.3.1 Girdi Vektörü
- Son N sınavdaki konu bazlı doğruluk oranı,
- Ortalama çözüm süresi,
- İpucu isteme sıklığı,
- Hata türü dağılımı (işlem, kavram, dikkat),
- Görev tamamlama ve giriş devamlılığı.

#### 16.3.2 Çıktı Vektörü
- Risk skoru (0–100),
- Öncelikli eksik kazanımlar,
- Kişiselleştirilmiş önerilen soru seti,
- Öğretmen için müdahale notu.

#### 16.3.3 Önerilen Endpoint
- `POST /api/ai/student-analysis`
- İstek gövdesi: anonimleştirilmiş performans özellikleri
- Yanıt: `{ riskScore, weakTopics[], feedbackPlan, recommendedQuestionIds[] }`

Bu model, erken uyarı sistemiyle entegre edilerek öğretmenin veri temelli aksiyon süresini kısaltır.

### 16.4 PDF ve Görselden Soru Çıkarımı
`frontend/src/services/aiService.js` dosyasında PDF’den soru çıkarımı mantığı mevcut olmakla birlikte, üretim kullanımı için aşağıdaki güvenli akış önerilir.

#### 16.4.1 İş Akışı
1. Dosya yükleme (PDF/JPG/PNG) 
2. MIME doğrulama + boyut sınırı + virüs tarama (opsiyonel)
3. Gemini multimodal analiz
4. Zorunlu JSON şeması doğrulaması
5. Yinelenen soru kontrolü (havuz benzerlik taraması)
6. Öğretmen onayı sonrası havuza yazma

#### 16.4.2 JSON Şema Önerisi
Her soru için zorunlu alanlar:
- `content_text`
- `topic`
- `difficulty_level` (1–5)
- `learning_objective`
- `options[]`
- `correct_option_index`
- `source_confidence` (0–1)

Bu yapı, tezde “otomatik soru çıkarımı doğruluk analizi” için ölçülebilir kalite metrikleri üretir.

### 16.5 Soru Havuzundan Varyant Üretimi (Question Augmentation)
Hedef, mevcut soruların birebir kopyası yerine pedagojik olarak eşdeğer ama metinsel/sayısal olarak farklı yeni sorular üretmektir.

#### 16.5.1 Algoritmik Çerçeve
1. **Seed Question Seçimi:** konu + zorluk + kazanım ile filtreleme
2. **Constraint Prompting:**
	- aynı kazanım korunacak,
	- sayısal parametreler değişecek,
	- çözüm stratejisi benzer kalacak,
	- doğru cevap tekil olacak.
3. **Similarity Check:** metin benzerliği eşiği (ör. cosine/Jaccard < 0.85)
4. **Difficulty Calibration:** öğretmen etiketine göre +1/-1 zorluk ayarı
5. **Human-in-the-loop:** yayın öncesi öğretmen onayı

#### 16.5.2 Önerilen Endpoint
- `POST /api/ai/generate-variants`
- Girdi: `{ baseQuestionId, variantCount, targetDifficulty, constraints }`
- Çıktı: `{ variants:[...], similarityScores:[...], warnings:[...] }`

Bu yaklaşım, soru bankasının sürdürülebilir biçimde genişlemesini sağlar ve sınav güvenliğini artırır.

### 16.6 Üretim Seviyesi Gemini API Kurulumu
### 16.6.1 Konfigürasyon
- `GEMINI_API_KEY` sadece backend’de tutulmalıdır.
- Frontend doğrudan Gemini’ye çıkmamalı, yalnızca backend AI Gateway ile konuşmalıdır.
- Model sürümü merkezi konfigde tanımlanmalıdır (ör. `gemini-1.5-flash`, gerektiğinde `2.5-flash`).

### 16.6.2 Dayanıklılık ve Maliyet
- Oran sınırlama (rate-limit),
- İstek başına token bütçesi,
- Retry + exponential backoff,
- Sonuç önbellekleme (aynı prompt için kısa süreli cache),
- İşlem kuyruğu (büyük PDF işlerken async worker).

### 16.6.3 Güvenlik
- Prompt injection filtreleri,
- HTML/JSON sanitization,
- PII maskeleme,
- Rol bazlı endpoint erişimi (öğrenci/öğretmen/admin ayrı limit).

### 16.7 Tezde Raporlanabilir Deneysel Metrikler (Gemini Özel)
Gemini modüllerinin bilimsel değerlendirmesi için şu metrikler raporlanmalıdır:
- **Extraction Precision/Recall:** PDF’den çıkarılan soru doğruluğu,
- **Variant Novelty Score:** üretilen varyantların özgünlük puanı,
- **Pedagogical Equivalence Rate:** varyantların aynı kazanımı ölçme oranı,
- **Hint Usefulness Score:** öğrencinin ipucu sonrası doğruya ulaşma olasılığı,
- **Teacher Acceptance Rate:** AI üretilen soru/içeriklerin öğretmen tarafından onaylanma oranı,
- **Latency & Cost:** istek başına ortalama süre ve token maliyeti.

### 16.8 Tez Yazımında Kullanım Biçimi
Bu bölüm, tezde "Yapay Zekâ Destek Katmanı" başlığı altında yöntem (method), deney (evaluation) ve bulgu (results) bölümlerine doğrudan bağlanabilir. Özellikle endpoint bazlı algoritmik tanımlar, çalışmanın yeniden üretilebilirliğini (reproducibility) ve savunulabilirliğini artırır.

## 17. Makine Öğrenmesi Yol Haritası: Model Seçimi ve Uygulama Planı
Bu bölüm, EduMath içinde hangi makine öğrenmesi yöntemlerinin hangi amaçla kullanılacağını, model giriş-çıkışlarını ve üretime alma sırasını tanımlar.

### 17.1 Model Portföyü ve Kullanım Amaçları
#### 17.1.1 Knowledge Tracing (BKT/DKT)
- **Amaç:** Öğrencinin her kazanım için ustalık düzeyini zaman içinde tahmin etmek.
- **Girdi:** soru kimliği, konu/kazanım etiketi, doğru-yanlış, çözüm süresi, ipucu sayısı.
- **Çıktı:** kazanım bazında ustalık olasılığı ve önerilen tekrar sırası.
- **Kullanım:** Öğrenme yolu ekranında kişiselleştirilmiş konu sıralaması üretimi.

#### 17.1.2 Item Response Theory (IRT: 2PL/3PL)
- **Amaç:** Soru zorluk ve ayırt edicilik parametrelerinin kalibrasyonu.
- **Girdi:** öğrenci-soru cevap matrisi ve doğru/yanlış sonuçları.
- **Çıktı:** soru parametreleri ve öğrenci yetenek kestirimi.
- **Kullanım:** Adaptif sınavda soruların doğru zorluk seviyesinde seçimi.

#### 17.1.3 Risk Tahminleme (XGBoost/Gradient Boosting)
- **Amaç:** Düşük performans veya sistemden kopma riski taşıyan öğrencileri erken belirlemek.
- **Girdi:** son test puan trendi, oturum sıklığı, görev tamamlama oranı, ipucu yoğunluğu, sınav gecikmesi.
- **Çıktı:** 7/14 günlük risk skoru ve alarm seviyesi.
- **Kullanım:** Öğretmen ve admin panellerinde erken uyarı üretimi.

#### 17.1.4 Hibrit Öneri Sistemi
- **Amaç:** Öğrenciye bir sonraki en uygun soru/konu setini önermek.
- **Yöntem:** içerik tabanlı benzerlik + davranış tabanlı öneri + başarı trendi birleştirme.
- **Çıktı:** önceliklendirilmiş soru/konu listesi.
- **Kullanım:** Öğrenci panelinde "sıradaki en iyi çalışma" önerisi.

#### 17.1.5 NLP Hata Türü Sınıflandırması
- **Amaç:** Yanlış cevapları pedagojik hata sınıflarına ayırmak (kavram/işlem/dikkat).
- **Girdi:** öğrenci açıklaması, soru metni, yanlış-doğru seçenek karşılaştırması.
- **Çıktı:** hata sınıfı + hedefli geri bildirim şablonu.
- **Kullanım:** Hata analizi ekranlarında açıklama kalitesini artırmak.

#### 17.1.6 LLM (Gemini) + Kural Katmanı
- **Amaç:** Sokratik ipucu, ders özeti, soru varyantı üretimi.
- **Not:** LLM çıktısı doğrudan yayımlanmaz; JSON şema doğrulama, benzerlik filtresi ve öğretmen onayı uygulanır.

### 17.2 Veri Şeması ve Özellik Mühendisliği
Makine öğrenmesi için olay tabanlı (event-based) loglama önerilir:
- `student_id`, `question_id`, `topic_id`, `difficulty_level`
- `is_correct`, `response_time_ms`, `hint_count`
- `attempt_order`, `session_id`, `device_type`
- `daily_quest_completion`, `survey_sentiment_score`

Özellik mühendisliğinde özellikle şu türetilmiş değişkenler kritik olacaktır:
- hareketli ortalama başarı (`rolling_accuracy_7d`),
- konu bazlı hız-doğruluk dengesi,
- ardışık yanlış sayısı,
- ipucu sonrası doğruya geçiş oranı,
- platforma geri dönüş aralığı.

### 17.3 Üretime Alma Fazları (Roadmap)
#### Faz 1 — Düşük Riskli Başlangıç
- Risk modeli (XGBoost) + NLP hata etiketleme,
- Öğretmen panelinde alarm ve açıklama üretimi,
- Offline doğrulama + sınırlı pilot.

#### Faz 2 — Ölçme Kalibrasyonu
- IRT parametre kestirimi,
- Soru bankası zorluk güncellemesi,
- Adaptif test seçim motoruna entegrasyon.

#### Faz 3 — Kişiselleştirme Derinliği
- BKT/DKT ile ustalık izleme,
- Öğrenme yolu sıralama modelinin aktif kullanımı,
- Konu bazlı telafi önerilerinin otomasyonu.

#### Faz 4 — Generative AI Ölçekleme
- Soru varyant üretim hattı,
- PDF/görselden soru çıkarımı + kalite kapıları,
- İnsan denetimi ile güvenli yayınlama.

### 17.4 Değerlendirme Metrikleri
#### 17.4.1 Öğrenme ve Pedagoji
- Ön-test/son-test farkı,
- Konu bazlı kazanım artışı,
- İpucu sonrası doğruya ulaşma oranı.

#### 17.4.2 Model Performansı
- Risk modeli için AUC/F1,
- Knowledge tracing için AUC/RMSE,
- IRT için item fit ve ayrım gücü,
- NLP hata sınıflandırması için macro-F1.

#### 17.4.3 Üretim Kalitesi
- Gecikme (p95 latency),
- İstek başına maliyet,
- Öğretmen onay oranı,
- LLM varyantlarının özgünlük/benzerlik skoru.

### 17.5 Tezde Sunum Önerisi
Bu bölüm, tezde "Yöntem" kısmında model mimarisi; "Deneysel Çalışma" kısmında metrik ve karşılaştırmalar; "Bulgular" kısmında öğrenme etkisi ve operasyonel etkiler olarak sunulmalıdır. Böylece çalışma, yalnızca ürün tanıtımı değil, ölçülebilir bilimsel katkı üreten bir araştırma niteliği kazanır.

---

## Ek A — Doğrulanan Bileşenler (Kod Tabanı İncelemesi)
Bu rapor hazırlanırken sistemin aşağıdaki teknik parçaları doğrudan incelenmiştir:
- frontend package bağımlılıkları ve route yapısı,
- backend API başlangıç dosyası ve middleware güvenlik yapısı,
- auth ve AI route/controller akışları,
- Python analiz scriptleri,
- cloud build ve dağıtım yapılandırmaları.

Bu nedenle rapor, genel bir tanıtım metni değil; mevcut proje kodunun davranışına dayalı teknik bir değerlendirme niteliğindedir.

## Ek B — Son Uygulama Degisiklik Gunlugu (2026-03-07)
Bu bolum, son gelistirme oturumlarinda tamamlanan kritik degisiklikleri tez raporu ile senkron tutmak amaciyla eklenmistir.

### B.1 Admin ve Kullanici Yonetimi Iyilestirmeleri
- `backend/routes/admin.js` uzerinde admin tarafi kullanici yonetimi endpointleri genisletildi.
- Eklenen veya netlestirilen akislarda rol guncelleme, kurs atama, sifre guncelleme, hesap durum degistirme, kayit onay/sifre talep onay isleri bulunur.
- `GET /admin/users` ciktilari kurs bilgilerinin gorunurlugu ve hassas alan temizligi acisindan iyilestirildi.
- Kullanici silme akisinda FK bagimliliklari nedeniyle sert silme yerine arsivleme fallback modeli uygulandi.
- `course_enrollments.lesson_id` zorunluluguna uygun sekilde kurs atama akisina `lesson_id` cozumleme mantigi eklendi.

### B.2 Admin Duyuru (Announcements) Modulu
- `backend/routes/admin.js` icine admin duyuru CRUD endpointleri eklendi.
- `frontend/src/pages/admin/AnnouncementsPage.jsx` tarafinda olusturma, guncelleme (edit modal), silme ve listeleme akislarinin endpoint uyumu duzeltildi.
- Hedeflenen sonuc: admin panelinden olusturulan duyurularin tum kullanicilara tutarli ulasmasi.

### B.3 Survey/Anket Modulu Yeniden Hizalama
- `backend/controllers/surveysController.js` dosyasi gercek veritabani semasi ile uyumlu olacak sekilde kapsamli bicimde yeniden duzenlendi.
- Survey CRUD, soru CRUD, submit ve istatistik/export akislarinin sema uyumu saglandi.
- `backend/routes/surveys.js` icine `POST /import-word` endpointi eklendi ve route sirasi (`/stats/:id`) cakisma olmayacak sekilde duzeltildi.
- `frontend/src/pages/teacher/CreateSurveyPage.jsx` ekranina Word dosyasindan (docx/txt) AI destekli otomatik anket olusturma akisi eklendi.
- `frontend/src/pages/common/TakeSurveyPage.jsx` endpointleri backend ile hizalandi (`/surveys/:id`, `/surveys/:id/submit`).

### B.4 Ogretmen Ogrenci Seviye Degerlendirme + AI Analiz
- `backend/repos/reportsRepo.js` teacher-scoped analiz ve kalici degerlendirme (assessment) akislarini kapsayacak sekilde genisletildi.
- `teacher_student_assessments` tablosu icin otomatik olusturma/garanti mekanizmasi eklendi.
- `backend/controllers/reportsController.js` icine AI analiz uretimi, assessment CRUD ve export handlerlari eklendi.
- `backend/routes/reports.js` role guard ile birlikte yeni endpointlerle guncellendi:
	- AI analysis uretimi
	- assessment create/read/update/delete
	- assessment export
- `frontend/src/pages/teacher/TeacherAnalysisPage.jsx` tarafinda:
	- AI analiz uretme,
	- degerlendirme kaydet/guncelle/sil,
	- kayitli degerlendirme listesi,
	- CSV disa aktarma,
	- PDF (print-to-PDF) disa aktarma
	yetenekleri eklendi.

### B.5 Create Exam ve Sinif Filtreleme Duzeltmeleri
- `backend/repos/questionsRepo.js` icinde sinif filtreleme sadece `grade_level` degil, `class_level` alanini da kapsayacak sekilde duzeltildi.
- `frontend/src/pages/teacher/CreateExamPage.jsx` icinde sinif seviyesi cozumlemesinde `class_level` onceliklendirildi, sonrasinda `grade_level` fallback uygulandi.
- Bu duzeltme ile soru bankasinda gorunen 2. ve 3. sinif sorularinin sinav hazirlama ekraninda da gorunurlugu saglandi.
- Sinif dropdown listesi kullanici talebine uygun sekilde 1-12 sabit araliga geri alindi.

### B.6 Auth ve Sifre Sifirlama Akisi
- `backend/controllers/authController.js` icinde `requestPasswordReset` akisi eklendi.
- `backend/routes/auth.js` icine `POST /request-password-reset` endpointi eklendi.
- `frontend/src/pages/admin/UserManagementPage.jsx` tarafinda opsiyonel yeni sifre alani ve ilgili endpoint cagri akisi eklendi.

### B.7 Dogrulama Sonuclari (Son Oturum)
- Duzenlenen hedef dosyalarda editor hata taramalarinda bloklayici hata bulunmamistir.
- Frontend tarafinda coklu kez `npm run build` calistirilmis ve basariyla tamamlanmistir.
- Rota yukleme kontrol testlerinde (ozellikle reports/surveys) import seviyesinde kritik hata gozlenmemistir.

## Ek C — Acik Maddeler ve Teknik Borc
Asagidaki maddeler raporun "eksik varsa yaz" talebine karsilik acik olarak listelenmistir.

### C.1 Backend Runtime Baslatma Durumu
- Bazi terminal kayitlarinda `backend` klasorunde `npm start` komutu `Exit Code: 1` donmektedir.
- Kod seviyesinde bircok duzeltme uygulanmis olsa da bu hatanin canli runtime kok nedeni ayri bir smoke-test oturumu ile yeniden netlestirilmelidir.

### C.2 Uctan Uca Smoke Test Ihtiyaci
- Admin kullanici CRUD,
- Admin duyuru CRUD,
- Survey Word import + submit,
- Teacher assessment CRUD + export
akislari UI+API birlikte uctan uca check-list ile tekrar dogrulanmalidir.

### C.3 Rapor Senkronizasyon Notu
- Bu markdown raporu (`docs/TEZ_RAPORU_EDUMATH.md`) en guncel teknik durumla senkronlanmistir.
- Ayni icerigin `docs/TEZ_RAPORU_EDUMATH.docx` dosyasina da periyodik yansitilmasi onerilir (tez teslim formati icin).
