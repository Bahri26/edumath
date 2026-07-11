/** Gizlilik, KVKK, kullanım ve çerez metinleri (TR / EN). */

export const LEGAL_DOC_TYPES = ['privacy', 'terms', 'cookies'];

export const LEGAL_DOCS = {
  privacy: {
    tr: {
      title: 'Gizlilik Politikası ve KVKK Aydınlatma Metni',
      updated: '24 Mayıs 2026',
      intro:
        'Matova (“Platform”), Anadolu Üniversitesi matematik eğitimi araştırma kapsamında geliştirilen bir öğrenme ve ölçme-değerlendirme hizmetidir. 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan çerçevede işler.',
      sections: [
        {
          title: '1. Veri sorumlusu ve iletişim',
          paragraphs: [
            'Veri sorumlusu: Matova platformu işletmesi.',
            'KVKK kapsamındaki talepleriniz için: info@matova.app — konu satırına “KVKK Başvurusu” yazmanız yeterlidir.',
          ],
        },
        {
          title: '2. İşlenen veri kategorileri',
          paragraphs: [
            'Kimlik ve hesap: ad soyad, e-posta, kullanıcı adı, rol (öğrenci/öğretmen), okul kademesi ve sınıf bilgisi.',
            'Eğitim içeriği: soru metinleri, şıklar, görseller/diyagramlar, sınav ve egzersiz tanımları, öğretmen tarafından yüklenen dosyalar.',
            'Performans verileri: quiz/sınav cevapları, puanlar, süreler, konu bazlı analiz sonuçları, ilerleme kayıtları.',
            'Teknik veriler: oturum kimlikleri, IP adresi, tarayıcı türü, hata günlükleri (yalnızca güvenlik ve hizmet kalitesi için).',
          ],
        },
        {
          title: '3. İşleme amaçları',
          paragraphs: [
            'Hesap oluşturma, kimlik doğrulama ve rol bazlı erişim sağlama.',
            'Ders, egzersiz, sınav ve soru bankası hizmetlerinin sunulması.',
            'Otomatik puanlama, konu analitiği ve öğretmene öğrenci ilerleme raporları üretme.',
            'Platform güvenliği, kötüye kullanımın önlenmesi ve teknik destek.',
            'Yasal yükümlülüklerin yerine getirilmesi.',
          ],
        },
        {
          title: '4. Yapay zeka kullanımı — model eğitimi yapılmaz',
          paragraphs: [
            'Matova, yüklediğiniz soru görsellerini, soru metinlerini, sınav içeriklerini veya öğrenci cevaplarını üçüncü taraf yapay zeka modellerini eğitmek (“fine-tune”, “model besleme”) amacıyla kullanmaz. Platformda otomatik model eğitimi veya veri seti oluşturma pipeline’ı bulunmaz.',
            'Varsayılan yapılandırmada (AI_PROVIDER=local) metin tanıma ve soru çözümü sunucu üzerinde yerel OCR (Tesseract), kural tabanlı çözücüler ve dahili ml-service ile yapılır; içerik harici AI sağlayıcılarına gönderilmez.',
            'Kurulumda isteğe bağlı olarak etkinleştirilen Google Gemini veya Ollama entegrasyonları yalnızca anlık çıkarım (inference) için kullanılır — örneğin görselden metin okuma veya soru varyasyonu üretme. Bu çağrılar tek seferlik API istekleridir; Matova tarafında model eğitimi yapılmaz.',
            '“AI ile Üret” özelliği, yalnızca aynı kurum/öğretmen soru havuzundaki metin tabanlı örnekleri referans alarak yeni soru varyasyonları oluşturur; görselli sorular bu havuza dahil edilmez. Bu süreç platform içi üretimdir, dış model eğitimi değildir.',
            'Öğrenci sınav sonuçları zayıf konu analizi için yerel istatistiksel yöntemlerle işlenir; sinir ağı eğitimi yapılmaz.',
          ],
        },
        {
          title: '5. Hukuki sebepler (KVKK m.5–6)',
          paragraphs: [
            'Sözleşmenin kurulması ve ifası (hesap ve eğitim hizmeti).',
            'Veri sorumlusunun meşru menfaati (platform güvenliği, hizmet iyileştirme — kişisel veriler model eğitiminde kullanılmaz).',
            'Açık rıza: zorunlu olmayan iletişim veya araştırma kapsamındaki gönüllü katılımlarda.',
          ],
        },
        {
          title: '6. Verilerin aktarımı ve saklanması',
          paragraphs: [
            'Veriler güvenli sunucularda (ör. MongoDB Atlas, Render barındırma) ve yapılandırılmış dosya depolama alanlarında (yerel disk, Google Drive, Cloudinary veya Cloudflare R2 — kuruluma göre) saklanır.',
            'İsteğe bağlı hata izleme (Sentry) yalnızca teknik hata bilgisi içerebilir; eğitim içeriği kasıtlı olarak gönderilmez.',
            'Gemini/Ollama etkinse, ilgili istek kapsamındaki metin veya görsel o sağlayıcıya iletilir; sağlayıcının kendi gizlilik politikası geçerlidir.',
            'Veriler Türkiye dışındaki sunucularda barındırılabilir; bu durumda KVKK m.9 kapsamında gerekli teknik ve idari tedbirler alınır.',
          ],
        },
        {
          title: '7. Saklama süresi',
          paragraphs: [
            'Hesap verileri hesabınız aktif olduğu sürece; silme talebinizden sonra makul süre içinde silinir veya anonimleştirilir.',
            'Sınav ve ilerleme kayıtları eğitim ve ölçme amacıyla öğretim dönemi boyunca saklanır; arşivleme politikası kurumunuzla uyumlu şekilde yönetilir.',
          ],
        },
        {
          title: '8. KVKK kapsamındaki haklarınız (m.11)',
          paragraphs: [
            'Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, düzeltme, silme, itiraz etme ve zararın giderilmesini talep etme haklarına sahipsiniz.',
            'Başvurularınıza en geç 30 gün içinde yanıt verilir.',
          ],
        },
        {
          title: '9. Güvenlik',
          paragraphs: [
            'HTTPS, kimlik doğrulama, rol bazlı yetkilendirme ve rate limiting uygulanır. Şifreler hash’lenerek saklanır; düz metin şifre tutulmaz.',
          ],
        },
      ],
    },
    en: {
      title: 'Privacy Policy & KVKK Notice',
      updated: '24 May 2026',
      intro:
        'Matova (“Platform”) is a learning and assessment service developed in the context of mathematics education research. As data controller under Turkish Law No. 6698 on Protection of Personal Data (KVKK), we process your personal data as described below.',
      sections: [
        {
          title: '1. Data controller & contact',
          paragraphs: [
            'Data controller: Matova platform operator.',
            'For KVKK requests: info@matova.app — subject line “KVKK Request”.',
          ],
        },
        {
          title: '2. Categories of data processed',
          paragraphs: [
            'Identity & account: name, email, username, role (student/teacher), school level and grade.',
            'Educational content: question text, options, images/diagrams, exam and exercise definitions, files uploaded by teachers.',
            'Performance data: quiz/exam answers, scores, timing, topic-level analytics, progress records.',
            'Technical data: session identifiers, IP address, browser type, error logs (security and service quality only).',
          ],
        },
        {
          title: '3. Purposes of processing',
          paragraphs: [
            'Account creation, authentication, and role-based access.',
            'Delivering lessons, exercises, exams, and the question bank.',
            'Automatic scoring, topic analytics, and student progress reports for teachers.',
            'Platform security, abuse prevention, and technical support.',
            'Compliance with legal obligations.',
          ],
        },
        {
          title: '4. Artificial intelligence — no model training',
          paragraphs: [
            'Matova does not use uploaded question images, question text, exam content, or student answers to train third-party AI models (fine-tuning or “feeding” datasets). There is no automated model-training pipeline in the platform.',
            'In the default configuration (AI_PROVIDER=local), text recognition and question solving run on the server using local OCR (Tesseract), rule-based solvers, and the internal ml-service; content is not sent to external AI providers.',
            'Optional Google Gemini or Ollama integrations, when enabled, are used only for one-time inference — e.g. reading text from an image or generating question variations. These are single API calls; Matova does not train models on your data.',
            'The “Generate with AI” feature references text-only samples from the same institution/teacher question pool; image-based questions are excluded. This is in-platform generation, not external model training.',
            'Student exam results are analyzed with local statistical methods for weak-topic reports; no neural network training is performed.',
          ],
        },
        {
          title: '5. Legal bases (KVKK Arts. 5–6)',
          paragraphs: [
            'Performance of a contract (account and educational service).',
            'Legitimate interests of the controller (platform security and service improvement — personal data is not used for model training).',
            'Explicit consent: where required for optional communications or voluntary research participation.',
          ],
        },
        {
          title: '6. Transfers & storage',
          paragraphs: [
            'Data is stored on secure servers (e.g. MongoDB Atlas, Render hosting) and configured file storage (local disk, Google Drive, Cloudinary, or Cloudflare R2 — depending on deployment).',
            'Optional error monitoring (Sentry) may include technical error data only; educational content is not intentionally transmitted.',
            'If Gemini/Ollama is enabled, relevant text or images for that request are sent to that provider; the provider’s privacy policy applies.',
            'Data may be hosted outside Turkey; appropriate safeguards under KVKK Art. 9 are applied.',
          ],
        },
        {
          title: '7. Retention',
          paragraphs: [
            'Account data is kept while your account is active; deleted or anonymized within a reasonable period after a deletion request.',
            'Exam and progress records are retained for educational and assessment purposes during the academic period.',
          ],
        },
        {
          title: '8. Your rights (KVKK Art. 11)',
          paragraphs: [
            'You may request information, correction, deletion, object to processing, and compensation for damage.',
            'We respond to requests within 30 days at the latest.',
          ],
        },
        {
          title: '9. Security',
          paragraphs: [
            'HTTPS, authentication, role-based authorization, and rate limiting are applied. Passwords are stored hashed; plain-text passwords are never kept.',
          ],
        },
      ],
    },
  },
  terms: {
    tr: {
      title: 'Kullanım Şartları',
      updated: '24 Mayıs 2026',
      intro:
        'Matova platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız. Hizmet eğitim ve ölçme-değerlendirme amacıyla sunulur.',
      sections: [
        {
          title: '1. Hizmet kapsamı',
          paragraphs: [
            'Platform; öğrenci, öğretmen ve yönetici rollerine göre ders, egzersiz, sınav, soru bankası ve analitik araçları sağlar.',
            'Beta ve araştırma modülleri önceden haber verilmeksizin güncellenebilir.',
          ],
        },
        {
          title: '2. Hesap ve sorumluluk',
          paragraphs: [
            'Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz kullanımı derhal bildirmelisiniz.',
            'Öğretmenler yükledikleri içeriklerin telif ve kişisel veri uyumluluğundan sorumludur.',
          ],
        },
        {
          title: '3. Kabul edilebilir kullanım',
          paragraphs: [
            'Platformun güvenliğini tehdit eden, zararlı yazılım yayan veya başkalarının verilerine izinsiz erişen davranışlar yasaktır.',
            'Otomatik veri kazıma (scraping) ve hizmeti aşırı yükleyen istekler engellenebilir.',
          ],
        },
        {
          title: '4. Yapay zeka özellikleri',
          paragraphs: [
            'AI destekli özellikler (Akıllı Yapıştır, otomatik çözüm, soru üretimi) yardımcı araçtır; nihai pedagojik doğrulama öğretmene aittir.',
            'Platform, kullanıcı içeriğini genel amaçlı AI model eğitiminde kullanmaz (ayrıntılar Gizlilik Politikası’nda).',
          ],
        },
        {
          title: '5. Fikri mülkiyet',
          paragraphs: [
            'Platform yazılımı ve arayüzü Matova’ya aittir. Öğretmenlerin yüklediği soru ve materyallerin hakları içerik sahibinde kalır.',
          ],
        },
        {
          title: '6. Sorumluluk sınırı',
          paragraphs: [
            'Hizmet “olduğu gibi” sunulur. Kesinti, veri kaybı veya AI çıktısındaki hatalardan doğan dolaylı zararlardan yasal çerçevede izin verilen ölçüde sorumluluk kabul edilmez.',
          ],
        },
        {
          title: '7. Uyuşmazlık',
          paragraphs: [
            'Uyuşmazlıklarda Türkiye Cumhuriyeti kanunları uygulanır; yetkili mahkeme ve icra daireleri Türkiye’deki genel kurallara tabidir.',
          ],
        },
      ],
    },
    en: {
      title: 'Terms of Use',
      updated: '24 May 2026',
      intro:
        'By using Matova you agree to these terms. The service is provided for educational and assessment purposes.',
      sections: [
        {
          title: '1. Scope of service',
          paragraphs: [
            'The platform provides lessons, exercises, exams, a question bank, and analytics depending on your role (student, teacher, admin).',
            'Beta and research modules may change without prior notice.',
          ],
        },
        {
          title: '2. Account & responsibility',
          paragraphs: [
            'You are responsible for keeping your credentials secure and reporting unauthorized use.',
            'Teachers are responsible for copyright and personal-data compliance of content they upload.',
          ],
        },
        {
          title: '3. Acceptable use',
          paragraphs: [
            'Actions that threaten security, distribute malware, or access others’ data without permission are prohibited.',
            'Automated scraping and requests that overload the service may be blocked.',
          ],
        },
        {
          title: '4. AI features',
          paragraphs: [
            'AI-assisted features (Smart Paste, auto-solve, question generation) are aids; final pedagogical verification belongs to the teacher.',
            'The platform does not use user content for general-purpose AI model training (see Privacy Policy).',
          ],
        },
        {
          title: '5. Intellectual property',
          paragraphs: [
            'Platform software and UI belong to Matova. Rights to teacher-uploaded questions and materials remain with the content owner.',
          ],
        },
        {
          title: '6. Limitation of liability',
          paragraphs: [
            'The service is provided “as is”. Indirect damages from outages, data loss, or AI output errors are excluded to the extent permitted by law.',
          ],
        },
        {
          title: '7. Governing law',
          paragraphs: [
            'Turkish law applies; courts and enforcement offices in Turkey have jurisdiction as per general rules.',
          ],
        },
      ],
    },
  },
  cookies: {
    tr: {
      title: 'Çerez Politikası',
      updated: '24 Mayıs 2026',
      intro:
        'Matova, oturumunuzun güvenli şekilde sürdürülmesi ve tercihlerinizin hatırlanması için sınırlı çerez ve yerel depolama kullanır.',
      sections: [
        {
          title: '1. Kullanılan teknolojiler',
          paragraphs: [
            'Zorunlu oturum: giriş yaptıktan sonra kimlik doğrulama jetonu (JWT) tarayıcıda saklanır; oturum kapatılınca silinir.',
            'Tercih: tema (açık/koyu) ve dil seçimi localStorage üzerinde tutulabilir.',
            'Matova reklam veya üçüncü taraf izleme çerezi kullanmaz.',
          ],
        },
        {
          title: '2. Üçüncü taraf çerezleri',
          paragraphs: [
            'Barındırma veya hata izleme (Sentry) etkinse, bu hizmetlerin kendi çerezleri teknik amaçla devreye girebilir.',
          ],
        },
        {
          title: '3. Yönetim',
          paragraphs: [
            'Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz; oturum çerezlerini engellemek giriş yapmanızı engelleyebilir.',
            'Sorularınız için: info@matova.app',
          ],
        },
      ],
    },
    en: {
      title: 'Cookie Policy',
      updated: '24 May 2026',
      intro:
        'Matova uses limited cookies and local storage to keep your session secure and remember your preferences.',
      sections: [
        {
          title: '1. Technologies used',
          paragraphs: [
            'Essential session: after sign-in, an authentication token (JWT) is stored in the browser and cleared on sign-out.',
            'Preferences: theme (light/dark) and language may be stored in localStorage.',
            'Matova does not use advertising or third-party tracking cookies.',
          ],
        },
        {
          title: '2. Third-party cookies',
          paragraphs: [
            'If hosting or error monitoring (Sentry) is enabled, those services may set technical cookies.',
          ],
        },
        {
          title: '3. Control',
          paragraphs: [
            'You can delete or block cookies in browser settings; blocking session cookies may prevent sign-in.',
            'Questions: info@matova.app',
          ],
        },
      ],
    },
  },
};

export function getLegalDoc(docType, langKey = 'tr') {
  const doc = LEGAL_DOCS[docType];
  if (!doc) return null;
  return doc[langKey === 'en' ? 'en' : 'tr'] || doc.tr;
}
