const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/User');
const Student = require('../models/Student');
const Topic = require('../models/Topic');
const Lesson = require('../models/Lesson');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function getMongoConfig() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${dbName}`;
  return { uri, dbName };
}

function uniqueOptions(correct, distractors) {
  return [String(correct), ...distractors.map(String)]
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 4)
    .map((text) => ({ text }));
}

function arithmeticNth(start, diff, n) {
  return start + ((n - 1) * diff);
}

function geometricNth(start, ratio, n) {
  return start * (ratio ** (n - 1));
}

function sumGeometric(start, ratio, count) {
  return start * (((ratio ** count) - 1) / (ratio - 1));
}

function normalizeQuestionText(text) {
  return String(text || '')
    .replace(/^\d+\. Sınıf\s+(kolay|orta|zor)\s+örüntü\s+\d+:\s*/iu, '')
    .trim();
}

async function upsertUser({ email, password, name, role, extra = {} }) {
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email, password, name, role, ...extra });
  } else {
    user.name = name;
    user.role = role;
    user.password = password;
    Object.assign(user, extra);
  }

  await user.save();
  return user;
}

function makeQuestion(text, correctAnswer, distractors, solution) {
  return {
    text: normalizeQuestionText(text),
    correctAnswer: String(correctAnswer),
    options: uniqueOptions(correctAnswer, distractors),
    solution,
  };
}

const MEB_REFERENCE = 'MEB Matematik Öğretim Programı (2018) - mufredat.meb.gov.tr ProgramDetay.aspx?PID=329';

const curriculumMetadata = {
  '1. Sınıf': {
    learningOutcome: 'Tekrarlayan nesne, şekil ve sayı örüntülerini fark eder; örüntüyü aynı kuralla sürdürür.',
    curriculumNote: 'Somut materyallerle tekrar eden örüntüyü bulma ve eksik öğeyi tamamlama odaklıdır.',
    examDuration: 30,
  },
  '2. Sınıf': {
    learningOutcome: 'Sayı ve şekil örüntülerinde kuralı açıklar, eksik veya sonraki öğeyi belirler.',
    curriculumNote: 'Ritmik sayma ile şekil örüntüsünü ilişkilendirir; artış miktarını sözel ifade eder.',
    examDuration: 30,
  },
  '3. Sınıf': {
    learningOutcome: 'Artan ve azalan örüntülerde değişim miktarını belirler ve kuralı sözel olarak ifade eder.',
    curriculumNote: 'Doğal sayılarla kurulan örüntülerde terimler arası farkı yorumlar.',
    examDuration: 35,
  },
  '4. Sınıf': {
    learningOutcome: 'Sayı örüntülerinin kuralını tablo, sözel ifade ve örnek terimler üzerinden geneller.',
    curriculumNote: 'Kural bulma ve istenen terimi belirleme becerisi güçlendirilir.',
    examDuration: 35,
  },
  '5. Sınıf': {
    learningOutcome: 'Sabit fark içeren sayı örüntülerinde istenen terimi bulur ve örüntüyü yorumlar.',
    curriculumNote: 'Adım sayısı ile terim arasında ilişki kurma ve aritmetik ilerlemeyi fark etme öne çıkar.',
    examDuration: 40,
  },
  '6. Sınıf': {
    learningOutcome: 'Şekil örüntülerinden sayısal kurala ulaşır; adım sayısına göre terim hesabı yapar.',
    curriculumNote: 'Somut modelden cebirsel düşünmeye geçiş için genel terim fikri yapılandırılır.',
    examDuration: 40,
  },
  '7. Sınıf': {
    learningOutcome: 'Doğrusal örüntülerin genel terimini cebirsel ifade ile gösterir ve istenen terimi hesaplar.',
    curriculumNote: 'n harfi kullanılarak örüntü kuralı genellenir ve farklı gösterimler arasında geçiş yapılır.',
    examDuration: 45,
  },
  '8. Sınıf': {
    learningOutcome: 'Lineer örüntülerde tablo, kural ve cebirsel gösterim arasındaki ilişkiyi kurar.',
    curriculumNote: 'LGS tarzı soru yapısına uygun olarak genel terim ve örüntü analizi bir arada ele alınır.',
    examDuration: 45,
  },
  '9. Sınıf': {
    learningOutcome: 'Aritmetik dizilerde ortak farkı, n. terimi ve terimler arası ilişkiyi belirler.',
    curriculumNote: 'Örüntü kavramı dizilere bağlanır; formül kullanımı ve yorumlama birlikte değerlendirilir.',
    examDuration: 45,
  },
  '10. Sınıf': {
    learningOutcome: 'Geometrik dizilerde ortak oranı, n. terimi ve temel toplam ilişkilerini çözümler.',
    curriculumNote: 'Artış-azalış modelleri ve geometrik örüntüler üzerinden cebirsel işlem becerisi ölçülür.',
    examDuration: 45,
  },
  '11. Sınıf': {
    learningOutcome: 'Özel tanımlı dizilerde genel terimi, ardışık fark düzenini ve bileşik terim hesaplarını yapar.',
    curriculumNote: 'İleri düzey örüntü türleri arasında karşılaştırma ve çok adımlı işlem çözümü beklenir.',
    examDuration: 50,
  },
  '12. Sınıf': {
    learningOutcome: 'Fonksiyonel ve karmaşık dizi kurallarını analiz eder; hedef terim ve toplam problemlerini çözer.',
    curriculumNote: 'YKS tarzı üst düzey yorum, denklem kurma ve işlem soruları ile örüntü bilgisi pekiştirilir.',
    examDuration: 50,
  },
};

const scenarioContext = {
  '2. Sınıf': {
    Kolay: ['Renkli boncuk şeridinde', 'Desenli sayı kartlarında', 'Mavi-kırmızı blok dizisinde', 'Sınıf panosundaki ritmik sayı şeridinde', 'Puantiyeli adım taşlarında', 'Renkli küplerin üzerine yazılan sayılarda', 'Bahçedeki sayı halkalarında'],
    Orta: ['Şekil kartları sıralanırken', 'Renkli bayrak dizisinde', 'Desenli çıkartma şeridinde', 'Oyuncak rafındaki düzenlemede', 'Boya kalemleri dizilirken', 'Gökyüzü figürleri sıralanırken', 'Hayvan kartları panosunda'],
    Zor: ['Renkli merdiven basamaklarında', 'Desenli kutuların üzerindeki sayılarda', 'Parkurdaki adım kartlarında', 'Boncuk abaküsünde', 'Şerit halı deseninde', 'Sayı pulları dizilirken', 'Çıkartma albümündeki numaralarda'],
  },
  '3. Sınıf': {
    Kolay: ['Renkli kare taşlarda', 'Desenli bileklik boncuklarında', 'Sayı balonları sıralanırken', 'Mozaik şeridindeki sayılarda', 'Tahta blok kulesinde', 'Sınıf oyun kartlarında', 'Park zeminindeki sayı dizisinde'],
    Orta: ['Azalan koltuk numaralarında', 'Renkli karton şeritlerde', 'Geriye doğru sayan sayaçta', 'Desenli raf etiketlerinde', 'Sıra numaraları inerken', 'Mozaik taş sayılarında', 'Adım adım eksilen pul sayısında'],
    Zor: ['Renkli kare örüntüsünde', 'Desenli halı bordüründe', 'Küp blok modelinde', 'Boncuk kule sayılarında', 'Süsleme dizisinde', 'Sıralı taş modelinde', 'Artan çizgi deseninde'],
  },
  '4. Sınıf': {
    Kolay: ['Renkli bayrak sayılarında', 'Desenli adım kartlarında', 'Boncuk dizisinin sayı etiketlerinde', 'Mozaik şeritte', 'Sıra numarası kartlarında', 'Küp blok etiketlerinde', 'Ritmik sayma panosunda'],
    Orta: ['Desenli masa örtüsü sıralarında', 'Renkli kare tablosunda', 'Mozaik sütunlarında', 'Boncuk gruplarında', 'Karton kutu dizisinde', 'Sınıf rafı düzeninde', 'Blok kule tablosunda'],
    Zor: ['Renkli taş bordüründe', 'Desenli pencere süslemesinde', 'Boncuk çerçevesinde', 'Küp adımlarında', 'Mozaik modelinde', 'Işık dizisindeki sayılarda', 'Kare kart örüntüsünde'],
  },
  '5. Sınıf': {
    Kolay: ['Desenli bileklik tasarımında', 'Renkli karo yolunda', 'Kütüphane sıra etiketlerinde', 'Basamak numaralarında', 'Mozaik şerit modelinde', 'Sayı kartı panosunda', 'Atölye parça dizisinde'],
    Orta: ['Azalan depo kutularında', 'Renkli dolap numaralarında', 'Basamak basamak eksilen pul dizisinde', 'Desenli pano etiketlerinde', 'Koltuk sıralamasında', 'Atölye paket sayılarında', 'Sayaç ekranında'],
    Zor: ['Kare taş avlusunda', 'Desenli yer karolarında', 'Mozaik kare modelinde', 'Bahçe düzenindeki kare adımlarda', 'Küp yüzey deseninde', 'Renkli pano karesinde', 'Matematik atölyesi tahtasında'],
  },
  '6. Sınıf': {
    Kolay: ['Renkli LED şeritte', 'Desenli kart dizisinde', 'Karo taş modelinde', 'Boncuk panosunda', 'Atölye sayı etiketlerinde', 'Adım kartlarında', 'Küp blok rafında'],
    Orta: ['Mozaik deseninde', 'Desenli çubuk modelinde', 'Renkli taş örüntüsünde', 'Kart şeridindeki artışlarda', 'Kule modelinde', 'Kare tahta oyununda', 'Süsleme şablonunda'],
    Zor: ['Kibrit çöpü şekil modelinde', 'Renkli kare sıralarında', 'Desenli çerçeve tasarımında', 'Boncuk halkalarında', 'Mozaik kenar sayısında', 'Parke taş dizisinde', 'Atölye kare modelinde'],
  },
  '7. Sınıf': {
    Kolay: ['Desenli bileklik modelinde', 'Renkli LED lambalarda', 'Mozaik karo şeridinde', 'Kodlu kart sıralamasında', 'Koltuk etiketlerinde', 'Akıllı tahta deseninde', 'Afiş tasarımındaki sayı dizisinde'],
    Orta: ['Basamaklı ışık panelinde', 'Azalan sıcaklık tablosunda', 'Depo kutu numaralarında', 'Renkli pano etiketlerinde', 'Kademeli fiyat kartlarında', 'Mozaik dizilimde', 'Atölye ölçü çizelgesinde'],
    Zor: ['Kare motifli tasarımda', 'Desenli zemin kaplamasında', 'Mozaik büyüme modelinde', 'Kodlanan görsel şeritte', 'Renkli dizi panosunda', 'Matematik afişinde', 'Süsleme modelinde'],
  },
  '8. Sınıf': {
    Kolay: ['LED panel örüntüsünde', 'Desenli karo yolunda', 'Renkli vitrin etiketlerinde', 'Dijital sayaç tasarımında', 'Kodlu ışık dizisinde', 'Mozaik pano modelinde', 'Şerit afiş düzeninde'],
    Orta: ['Renkli tablo şemasında', 'Desenli kart düzeninde', 'Kodlanmış sayı panelinde', 'Mozaik modelde', 'Dijital desen şeridinde', 'Atölye hesap tablosunda', 'Grafik kartlarında'],
    Zor: ['Kareli zemin tasarımında', 'Desenli pencere düzeninde', 'Mozaik basamak modelinde', 'LED kare panelinde', 'Kodlu sayısal desenlerde', 'Süsleme modelinde', 'Matematik sergi panosunda'],
  },
  '9. Sınıf': {
    Kolay: ['Desenli koltuk numaralarında', 'Renkli yarış parkuru tabelalarında', 'Bilet sıra kodlarında', 'Mozaik şerit sayılarında', 'Atölye etiketlerinde', 'Kademeli pano numaralarında', 'Işık paneli kodlarında'],
    Orta: ['Azalan stok etiketlerinde', 'Sıcaklık ölçüm tablosunda', 'Renkli raf düzeninde', 'Basamaklı puan çizelgesinde', 'Geriye giden sayı şeridinde', 'Desenli sayaç panelinde', 'Kademeli maliyet planında'],
    Zor: ['Mozaik dizi modelinde', 'Desenli oturma planında', 'Renkli koltuk sıralarında', 'Atölye parça dizisinde', 'Sınav salonu numaralarında', 'Akıllı tahta örüntüsünde', 'Kademeli kod şeridinde'],
  },
  '10. Sınıf': {
    Kolay: ['Renkli ışık panellerinde', 'Desenli çoğalan karo modelinde', 'Bakteri koloni şemasında', 'Katlanarak artan bilet sayısında', 'LED çoğalma deseninde', 'Mozaik büyüme modelinde', 'Geometrik tasarım çiziminde'],
    Orta: ['Azalan parlaklık tablosunda', 'Desenli cam süslemesinde', 'Renkli kare panelinde', 'Katlanarak küçülen modelde', 'Dijital sinyal örüntüsünde', 'Kademeli bölmeli rafta', 'Mozaik oran deseninde'],
    Zor: ['Geometrik tasarım toplamında', 'Desenli pul koleksiyonunda', 'Katlanarak büyüyen ışık modelinde', 'Renkli kare panelinin toplamında', 'Mozaik karo sayısında', 'Dijital gösterge modelinde', 'Atölye çoğalma planında'],
  },
  '11. Sınıf': {
    Kolay: ['Desenli parabol panosunda', 'Renkli kare kodlarında', 'Dijital tasarım modelinde', 'Mozaik sütun düzeninde', 'Atölye ölçüm çizelgesinde', 'LED güç tablosunda', 'Grafik afişindeki dizide'],
    Orta: ['Artan ışık seviyelerinde', 'Desenli büyüme modelinde', 'Renkli blok çizelgesinde', 'Mozaik fark tablosunda', 'Atölye üretim planında', 'Dijital desen akışında', 'Sayısal model panosunda'],
    Zor: ['Kodlu dizi tasarımında', 'Desenli veri modelinde', 'Renkli ölçüm tablosunda', 'Mozaik hesap planında', 'Sınav hazırlık çizelgesinde', 'Atölye üretim raporunda', 'Grafik modelinde'],
  },
  '12. Sınıf': {
    Kolay: ['Desenli fonksiyon panosunda', 'Renkli şerit tasarımında', 'LED kod dizisinde', 'Mozaik hesap modelinde', 'Atölye planlama tablosunda', 'Grafik afiş düzeninde', 'Sayı kodu şeridinde'],
    Orta: ['Geometrik tasarım toplamında', 'Desenli üretim planında', 'Renkli büyüme modelinde', 'Mozaik maliyet tablosunda', 'Katlanarak artan paket sayısında', 'LED panel toplamında', 'Atölye hesap çizelgesinde'],
    Zor: ['Hedef terim tasarımında', 'Desenli formül modelinde', 'Renkli dizi kodunda', 'Mozaik hesap planında', 'Fonksiyonel desen çözümünde', 'Atölye üretim denkleminde', 'Grafik modelleme sorusunda'],
  },
};

function enrichQuestionText(text, classLevel, difficulty, index) {
  const contextPrefix = scenarioContext[classLevel]?.[difficulty]?.[index];
  if (!contextPrefix) {
    return normalizeQuestionText(text);
  }

  return `${contextPrefix} ${normalizeQuestionText(text)}`;
}

const questionVisuals = {
  '1. Sınıf': {
    Kolay: '/uploads/patterns/grade1-easy.svg',
    Orta: '/uploads/patterns/grade1-medium.svg',
    Zor: '/uploads/patterns/grade1-hard.svg',
  },
  '2. Sınıf': { default: '/uploads/patterns/grade2-4-patterns.svg' },
  '3. Sınıf': { default: '/uploads/patterns/grade2-4-patterns.svg' },
  '4. Sınıf': { default: '/uploads/patterns/grade4-step3.svg' },
  '5. Sınıf': { default: '/uploads/patterns/grade5-step5.svg' },
  '6. Sınıf': { default: '/uploads/patterns/grade5-6-tiles.svg' },
  '7. Sınıf': { default: '/uploads/patterns/grade7-8-linear.svg' },
  '8. Sınıf': { default: '/uploads/patterns/grade7-8-linear.svg' },
  '9. Sınıf': { default: '/uploads/patterns/grade9-arithmetic.svg' },
  '10. Sınıf': { default: '/uploads/patterns/grade10-geometric.svg' },
  '11. Sınıf': { default: '/uploads/patterns/grade11-12-formula.svg' },
  '12. Sınıf': { default: '/uploads/patterns/grade11-12-formula.svg' },
};

const questionImageRules = {
  '1. Sınıf': [
    { match: /2, 4, 2, 4|1, 3, 1, 3|5, 7, 5, 7/u, image: '/uploads/patterns/grade1-number-alt.svg' },
    { match: /▲, ○, ▲, ○|○, ▲, ○, ▲/u, image: '/uploads/patterns/grade1-triangle-circle.svg' },
    { match: /Elma, armut, elma, armut/u, image: '/uploads/patterns/grade1-fruit-alt.svg' },
    { match: /Kırmızı top, mavi top/u, image: '/uploads/patterns/grade1-easy.svg' },
    { match: /▲, ■, ▲, ■/u, image: '/uploads/patterns/grade1-easy.svg' },
    { match: /2, 2, 5, 2, 2, 5/u, image: '/uploads/patterns/grade1-number-cycle.svg' },
    { match: /▲, ■, ■|Kırmızı, mavi, mavi|●, ●, ○|Güneş, bulut, bulut/u, image: '/uploads/patterns/grade1-medium.svg' },
    { match: /3, 6, 3, 6|4, 8, 4, 8|5, 9, 5, 9|2, 7, 2, 7/u, image: '/uploads/patterns/grade1-number-position.svg' },
    { match: /3, 6, 3, 6|4, 8, 4, 8|5, 9, 5, 9|2, 7, 2, 7|■, ●, ■, ●/u, image: '/uploads/patterns/grade1-hard.svg' },
  ],
  '2. Sınıf': [
    { match: /Üçgen, Kare, Beşgen|Daire, Kare, Üçgen/u, image: '/uploads/patterns/grade2-three-cycle.svg' },
    { match: /Elma, Armut, Muz/u, image: '/uploads/patterns/grade2-fruit-cycle.svg' },
  ],
  '3. Sınıf': [
    { match: /30, 27, 24, 21|32, 29, 26, 23|34, 31, 28, 25/u, image: '/uploads/patterns/grade3-descending.svg' },
    { match: /4, 7, 12, 18|5, 8, 13, 19|6, 9, 14, 20/u, image: '/uploads/patterns/grade3-growing-gaps.svg' },
  ],
  '4. Sınıf': [
    { match: /12, 15, 18, 21|13, 16, 19, 22|14, 17, 20, 23|15, 18, 21, 24|16, 19, 22, 25|17, 20, 23, 26|18, 21, 24, 27/u, image: '/uploads/patterns/grade4-step3.svg' },
    { match: /şeklinde giden örüntüde/u, image: '/uploads/patterns/grade4-multiples.svg' },
    { match: /2, 5, 10, 17|3, 6, 11, 18|4, 7, 12, 19|5, 8, 13, 20|6, 9, 14, 21|7, 10, 15, 22|8, 11, 16, 23/u, image: '/uploads/patterns/grade4-growing-odd.svg' },
  ],
  '5. Sınıf': [
    { match: /4, 9, 14, 19|5, 10, 15, 20|6, 11, 16, 21|7, 12, 17, 22|8, 13, 18, 23|9, 14, 19, 24|10, 15, 20, 25/u, image: '/uploads/patterns/grade5-step5.svg' },
    { match: /60, 55, 50, 45|63, 58, 53, 48|66, 61, 56, 51|69, 64, 59, 54|72, 67, 62, 57|75, 70, 65, 60|78, 73, 68, 63/u, image: '/uploads/patterns/grade5-descending-step.svg' },
    { match: /kare sayı örüntüsünde/u, image: '/uploads/patterns/grade5-square-numbers.svg' },
  ],
};

function getQuestionImage(classLevel, difficulty, text) {
  const specificRules = questionImageRules[classLevel] || [];
  const normalizedText = normalizeQuestionText(text);
  const matchedRule = specificRules.find((rule) => rule.match.test(normalizedText));
  if (matchedRule) {
    return matchedRule.image;
  }

  const visualConfig = questionVisuals[classLevel];
  if (!visualConfig) {
    return '';
  }

  return visualConfig[difficulty] || visualConfig.default || '';
}

const optionImageMap = {
  '▲': '/uploads/patterns/option-triangle.svg',
  'Üçgen': '/uploads/patterns/option-triangle.svg',
  '■': '/uploads/patterns/option-square.svg',
  'Kare': '/uploads/patterns/option-square.svg',
  '●': '/uploads/patterns/option-circle.svg',
  '○': '/uploads/patterns/option-circle.svg',
  'Daire': '/uploads/patterns/option-circle.svg',
  '★': '/uploads/patterns/option-star.svg',
  'Yıldız': '/uploads/patterns/option-star.svg',
  'Kırmızı': '/uploads/patterns/option-red.svg',
  'Mavi': '/uploads/patterns/option-blue.svg',
  'Sarı': '/uploads/patterns/option-yellow.svg',
  'Yeşil': '/uploads/patterns/option-green.svg',
  'Bulut': '/uploads/patterns/option-cloud.svg',
  'Güneş': '/uploads/patterns/option-sun.svg',
  'Ay': '/uploads/patterns/option-moon.svg',
  'Elma': '/uploads/patterns/option-apple.svg',
  'Armut': '/uploads/patterns/option-pear.svg',
  'Muz': '/uploads/patterns/option-banana.svg',
  'Çilek': '/uploads/patterns/option-strawberry.svg',
  'Kiraz': '/uploads/patterns/option-strawberry.svg',
  'Kalem': '/uploads/patterns/option-pencil.svg',
  'Silgi': '/uploads/patterns/option-eraser.svg',
  'Defter': '/uploads/patterns/option-notebook.svg',
  'Kuş': '/uploads/patterns/option-bird.svg',
  'Balık': '/uploads/patterns/option-fish.svg',
  'Kedi': '/uploads/patterns/option-cat.svg',
  'Top': '/uploads/patterns/option-ball.svg',
  'Araba': '/uploads/patterns/option-car.svg',
};

function enrichOptionsWithImages(options) {
  return (options || []).map((option) => ({
    ...option,
    image: option.image || optionImageMap[option.text] || '',
  }));
}

const curriculum = [
  {
    classLevel: '1. Sınıf',
    lessonTitle: 'Örüntülerle İlk Adım',
    content: 'Tekrarlayan renk, şekil ve sayı dizilerini fark etmeye odaklanılır. Öğrenci eksik parçayı bulur ve aynı kuralı devam ettirir.',
    quiz: {
      question: 'Kırmızı, mavi, kırmızı, mavi dizisinde sıradaki renk nedir?',
      options: ['Kırmızı', 'Yeşil', 'Sarı', 'Mor'],
      correctAnswer: 'Kırmızı',
      explanation: 'Renkler sırayla kırmızı ve mavi olarak tekrar ediyor.',
    },
    nextTopics: ['Renk örüntüleri', 'Geometrik şekil dizilimleri', 'Tekrarlayan nesne grupları'],
    generators: {
      Kolay: (index) => {
        const easyQuestions = [
          makeQuestion(
            '2, 4, 2, 4, 2, ... örüntüsünde sıradaki sayı kaçtır?',
            4,
            [2, 5, 6],
            'Örüntü 2 ve 4 sayılarının sırayla tekrarından oluşur. 2 sayısından sonra 4 gelir.'
          ),
          makeQuestion(
            'Kırmızı top, mavi top, kırmızı top, mavi top, ... örüntüsünde sıradaki topun rengi nedir?',
            'Kırmızı',
            ['Mavi', 'Sarı', 'Yeşil'],
            'Renkler sırayla kırmızı ve mavi olarak tekrar ediyor. Mavi renkten sonra kırmızı gelir.'
          ),
          makeQuestion(
            '▲, ■, ▲, ■, ▲, ... örüntüsünde sıradaki şekil hangisidir?',
            '■',
            ['▲', '●', '★'],
            'Şekiller üçgen ve kare olarak sırayla tekrar ediyor. Üçgenden sonra kare gelir.'
          ),
          makeQuestion(
            '1, 3, 1, 3, 1, ... örüntüsünde boş yere hangi sayı gelmelidir?',
            3,
            [1, 4, 5],
            'Örüntü 1 ve 3 sayılarının sırayla tekrarından oluşur. 1 sayısından sonra 3 gelir.'
          ),
          makeQuestion(
            'Elma, armut, elma, armut, elma, ... örüntüsünde sıradaki meyve hangisidir?',
            'Armut',
            ['Elma', 'Muz', 'Çilek'],
            'Meyveler elma ve armut olarak sırayla tekrar ediyor. Elmadan sonra armut gelir.'
          ),
          makeQuestion(
            '●, ○, ●, ○, ●, ... örüntüsünde sıradaki şekil hangisidir?',
            '○',
            ['●', '■', '▲'],
            'Dolu daire ve boş daire sırayla tekrar ediyor. Dolu daireden sonra boş daire gelir.'
          ),
          makeQuestion(
            '5, 7, 5, 7, 5, ... örüntüsünde sıradaki sayı kaçtır?',
            7,
            [5, 8, 9],
            'Örüntü 5 ve 7 sayılarının sırayla tekrarından oluşur. 5 sayısından sonra 7 gelir.'
          ),
        ];
        return easyQuestions[index];
      },
      Orta: (index) => {
        const mediumQuestions = [
          makeQuestion(
            '▲, ■, ■, ▲, ■, ■, ... örüntüsünde sıradaki şekil hangisidir?',
            '▲',
            ['■', '●', '★'],
            'Kural üç adımda tekrar ediyor: ▲, ■, ■. Yeni döngü üçgen ile başlar.'
          ),
          makeQuestion(
            'Kırmızı, mavi, mavi, kırmızı, mavi, mavi, ... örüntüsünde sıradaki renk nedir?',
            'Kırmızı',
            ['Mavi', 'Sarı', 'Yeşil'],
            'Renk kuralı üç adımda tekrar eder: kırmızı, mavi, mavi. Yeni grup kırmızı ile başlar.'
          ),
          makeQuestion(
            '●, ●, ○, ●, ●, ○, ... örüntüsünde sıradaki şekil hangisidir?',
            '●',
            ['○', '■', '▲'],
            'Örüntü iki dolu daire ve bir boş daireden oluşur. Boş daireden sonra yine dolu daire gelir.'
          ),
          makeQuestion(
            'Elma, armut, armut, elma, armut, armut, ... örüntüsünde sıradaki meyve hangisidir?',
            'Elma',
            ['Armut', 'Muz', 'Kiraz'],
            'Kural üç adımda tekrar eder: elma, armut, armut. Yeni grup elma ile başlar.'
          ),
          makeQuestion(
            '2, 2, 5, 2, 2, 5, ... örüntüsünde sıradaki sayı kaçtır?',
            2,
            [5, 3, 7],
            'Kural 2, 2, 5 şeklinde tekrar eder. 5 sayısından sonra tekrar 2 gelir.'
          ),
          makeQuestion(
            '■, ▲, ●, ■, ▲, ●, ... örüntüsünde sıradaki şekil hangisidir?',
            '■',
            ['▲', '●', '★'],
            'Şekiller kare, üçgen ve daire olarak sırayla tekrar ediyor. Yeni grup kare ile başlar.'
          ),
          makeQuestion(
            'Güneş, bulut, bulut, güneş, bulut, bulut, ... örüntüsünde sıradaki şekil hangisidir?',
            'Güneş',
            ['Bulut', 'Ay', 'Yıldız'],
            'Kural güneş, bulut, bulut şeklinde tekrar ediyor. Yeni grup güneş ile başlar.'
          ),
        ];
        return mediumQuestions[index];
      },
      Zor: (index) => {
        const hardQuestions = [
          makeQuestion(
            '3, 6, 3, 6, 3, 6, ... örüntüsünde 8. sıradaki sayı kaçtır?',
            6,
            [3, 8, 9],
            'Tek sıralarda 3, çift sıralarda 6 vardır. 8. sıra çift olduğu için cevap 6 olur.'
          ),
          makeQuestion(
            '▲, ○, ▲, ○, ▲, ○, ... örüntüsünde 9. sıradaki şekil hangisidir?',
            '▲',
            ['○', '■', '★'],
            'Tek sıralarda üçgen, çift sıralarda daire vardır. 9. sıra tek olduğu için üçgen gelir.'
          ),
          makeQuestion(
            '4, 8, 4, 8, 4, 8, ... örüntüsünde 10. sıradaki sayı kaçtır?',
            8,
            [4, 6, 12],
            'Tek sıralarda 4, çift sıralarda 8 vardır. 10. sıra çift olduğu için cevap 8 olur.'
          ),
          makeQuestion(
            '■, ●, ■, ●, ■, ●, ... örüntüsünde 7. sıradaki şekil hangisidir?',
            '■',
            ['●', '▲', '○'],
            'Tek sıralarda kare, çift sıralarda daire vardır. 7. sıra tek olduğu için kare gelir.'
          ),
          makeQuestion(
            '5, 9, 5, 9, 5, 9, ... örüntüsünde 11. sıradaki sayı kaçtır?',
            5,
            [9, 7, 11],
            'Tek sıralarda 5, çift sıralarda 9 vardır. 11. sıra tek olduğu için cevap 5 olur.'
          ),
          makeQuestion(
            '○, ▲, ○, ▲, ○, ▲, ... örüntüsünde 12. sıradaki şekil hangisidir?',
            '▲',
            ['○', '■', '●'],
            'Tek sıralarda boş daire, çift sıralarda üçgen vardır. 12. sıra çift olduğu için üçgen gelir.'
          ),
          makeQuestion(
            '2, 7, 2, 7, 2, 7, ... örüntüsünde 13. sıradaki sayı kaçtır?',
            2,
            [7, 5, 9],
            'Tek sıralarda 2, çift sıralarda 7 vardır. 13. sıra tek olduğu için cevap 2 olur.'
          ),
        ];
        return hardQuestions[index];
      },
    },
  },
  {
    classLevel: '2. Sınıf',
    lessonTitle: 'Şekil ve Sayı Örüntüleri',
    content: 'İkişer ve üçer artan örüntüler ile temel şekil dizileri çalışılır. Öğrenci artış miktarını fark ederek devam ettirir.',
    quiz: {
      question: '5, 8, 11, 14 örüntüsünde artış kaçtır?',
      options: ['1', '2', '3', '4'],
      correctAnswer: '3',
      explanation: 'Her adımda 3 eklenmektedir.',
    },
    nextTopics: ['Ritmik saymalar', 'Artan sayı dizileri', 'Şekil-sayı ilişkisi'],
    generators: {
      Kolay: (index) => {
        const start = 5 + index;
        const diff = 5;
        const correct = start + (4 * diff);
        return makeQuestion(
          `2. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + diff}, ${start + 2 * diff}, ${start + 3 * diff}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 5],
          `Her adımda ${diff} artıyor. Son terime ${diff} eklenince ${correct} bulunur.`
        );
      },
      Orta: (index) => {
        const cycles = [
          ['Üçgen', 'Kare', 'Beşgen'],
          ['Daire', 'Kare', 'Üçgen'],
          ['Elma', 'Armut', 'Muz'],
          ['Kalem', 'Defter', 'Silgi'],
          ['Kırmızı', 'Sarı', 'Mavi'],
          ['Ay', 'Yıldız', 'Bulut'],
          ['Kuş', 'Balık', 'Kedi'],
        ];
        const tokens = cycles[index];
        const ask = 8 + index;
        const correct = tokens[(ask - 1) % 3];
        return makeQuestion(
          `2. Sınıf orta örüntü ${index + 1}: ${tokens.join(', ')}, ${tokens.join(', ')}, ... örüntüsünde ${ask}. adımda hangi öğe vardır?`,
          correct,
          [tokens[0], tokens[1], tokens[2], 'Dikdörtgen'],
          `Örüntü 3 adımda tekrar eder. ${ask}. adım döngüde ${((ask - 1) % 3) + 1}. öğeye denk gelir; bu da ${correct} olur.`
        );
      },
      Zor: (index) => {
        const start = 1 + index;
        const seq = [start, start + 2, start + 5, start + 9];
        const correct = seq[3] + 5;
        return makeQuestion(
          `2. Sınıf zor örüntü ${index + 1}: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 3],
          'Artışlar sırasıyla 2, 3, 4 şeklindedir. Sonraki artış 5 olacağı için son terime 5 eklenir.'
        );
      },
    },
  },
  {
    classLevel: '3. Sınıf',
    lessonTitle: 'Artan ve Azalan Örüntüler',
    content: 'Doğal sayılarla kurulan artan ve azalan örüntüler çözülür. Öğrenci farkı ve tekrar eden kuralı sözel olarak ifade eder.',
    quiz: {
      question: '18, 16, 14, 12 dizisinde kural nedir?',
      options: ['2 artıyor', '2 azalıyor', '3 artıyor', '3 azalıyor'],
      correctAnswer: '2 azalıyor',
      explanation: 'Her adımda 2 eksiltilmiştir.',
    },
    nextTopics: ['İki adımlı kurallar', 'Sayı tablolarında örüntü', 'Şekil modelleri'],
    generators: {
      Kolay: (index) => {
        const start = 7 + index;
        const correct = start + 8;
        return makeQuestion(
          `3. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + 2}, ${start + 4}, ${start + 6}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 2],
          'Her adımda 2 artmaktadır. Son terime 2 eklenir.'
        );
      },
      Orta: (index) => {
        const start = 30 + (index * 2);
        const ask = 6 + index;
        const correct = start - ((ask - 1) * 3);
        return makeQuestion(
          `3. Sınıf orta örüntü ${index + 1}: ${start}, ${start - 3}, ${start - 6}, ${start - 9}, ... örüntüsünde ${ask}. terim kaçtır?`,
          correct,
          [correct - 3, correct + 1, correct + 3],
          `Örüntü her adımda 3 azalır. ${ask}. terim için ${ask - 1} kez 3 çıkarılır.`
        );
      },
      Zor: (index) => {
        const start = 4 + index;
        const seq = [start, start + 3, start + 7, start + 12];
        const correct = seq[3] + 6;
        return makeQuestion(
          `3. Sınıf zor örüntü ${index + 1}: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 3],
          'Artışlar 3, 4, 5 şeklindedir. Sonraki artış 6 olur ve son terime eklenir.'
        );
      },
    },
  },
  {
    classLevel: '4. Sınıf',
    lessonTitle: 'Kural Bulma ve Genelleme',
    content: 'Örüntünün kuralı tablo ve sözel ifadelerle yazılır. Basit terim bulma çalışmaları yapılır.',
    quiz: {
      question: '6, 12, 18, 24 örüntüsünün kuralı nedir?',
      options: ['Her seferinde 3 ekle', 'Her seferinde 6 ekle', 'Her seferinde 4 çıkar', 'İkiye böl'],
      correctAnswer: 'Her seferinde 6 ekle',
      explanation: 'Terimler arasında sabit fark 6’dır.',
    },
    nextTopics: ['Sayı dizilerinde mantık', 'Tablo ve grafik örüntüleri', 'Gerçek hayat modelleri'],
    generators: {
      Kolay: (index) => {
        const start = 12 + index;
        const correct = start + 12;
        return makeQuestion(
          `4. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + 3}, ${start + 6}, ${start + 9}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 3],
          'Her adımda 3 artmaktadır. Son terime 3 eklenir.'
        );
      },
      Orta: (index) => {
        const base = 9 + index;
        const ask = 7 + index;
        const correct = base * ask;
        return makeQuestion(
          `4. Sınıf orta örüntü ${index + 1}: ${base}, ${base * 2}, ${base * 3}, ${base * 4} şeklinde giden örüntüde ${ask}. terim kaç olur?`,
          correct,
          [correct - base, correct + base, correct + 2],
          `Örüntü ${base} sayısının katlarından oluşur. ${ask}. terim ${base} x ${ask} = ${correct} olur.`
        );
      },
      Zor: (index) => {
        const start = 2 + index;
        const seq = [start, start + 3, start + 8, start + 15];
        const correct = seq[3] + 9;
        return makeQuestion(
          `4. Sınıf zor örüntü ${index + 1}: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 1, correct + 1, correct + 3],
          'Artışlar 3, 5, 7 şeklindedir. Sonraki artış 9 olur ve son terime eklenir.'
        );
      },
    },
  },
  {
    classLevel: '5. Sınıf',
    lessonTitle: 'Sayı Örüntülerinde Terim Bulma',
    content: 'Sabit fark içeren örüntülerde istenen terim bulunur. Kural cebirsel olmayan ama düzenli yapılarla ifade edilir.',
    quiz: {
      question: '4, 9, 14, 19 örüntüsünde ortak artış kaçtır?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '5',
      explanation: 'Ardışık her terim arasında 5 fark vardır.',
    },
    nextTopics: ['Sabit farkla artan diziler', 'Adım-Sayı tabloları', 'Sözelden sayıya aktarım'],
    generators: {
      Kolay: (index) => {
        const start = 4 + index;
        const ask = 6 + index;
        const correct = arithmeticNth(start, 5, ask);
        return makeQuestion(
          `5. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + 5}, ${start + 10}, ${start + 15}, ... örüntüsünde ${ask}. terim kaçtır?`,
          correct,
          [correct - 5, correct + 5, correct + 2],
          `${ask}. terim için ilk terime ${ask - 1} kez 5 eklenir.`
        );
      },
      Orta: (index) => {
        const start = 60 + (index * 3);
        const correct = arithmeticNth(start, -5, 10);
        return makeQuestion(
          `5. Sınıf orta örüntü ${index + 1}: ${start}, ${start - 5}, ${start - 10}, ${start - 15}, ... örüntüsünde 10. terim kaçtır?`,
          correct,
          [correct - 5, correct + 5, correct + 10],
          'Her adımda 5 azalır. 10. terim için 9 kez 5 çıkarılır.'
        );
      },
      Zor: (index) => {
        const n = 5 + index;
        const correct = n * n;
        return makeQuestion(
          `5. Sınıf zor örüntü ${index + 1}: 1, 4, 9, 16, ... kare sayı örüntüsünde ${n}. terim kaçtır?`,
          correct,
          [((n - 1) ** 2), ((n + 1) ** 2), correct + 2],
          'Bu örüntü kare sayılardan oluşur. n. terim n² olduğundan sonuç hesaplanır.'
        );
      },
    },
  },
  {
    classLevel: '6. Sınıf',
    lessonTitle: 'Doğal Sayı ve Şekil Örüntüleri',
    content: 'Şekil örüntülerinden sayısal genellemelere geçilir. Öğrenci her adımda eklenen birim sayısını yorumlar.',
    quiz: {
      question: '3, 6, 10, 15 dizisinde artışlar nasıl değişir?',
      options: ['Sabit 3', 'Sabit 4', '1 er artan artışlar', '2 şer azalan artışlar'],
      correctAnswer: '1 er artan artışlar',
      explanation: 'Artışlar 3, 4, 5 şeklindedir.',
    },
    nextTopics: ['Genel terim kavramı', 'n harfinin kullanımı', 'Sayısal örüntülerin analizi'],
    generators: {
      Kolay: (index) => {
        const start = 8 + index;
        const correct = arithmeticNth(start, 4, 9);
        return makeQuestion(
          `6. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + 4}, ${start + 8}, ${start + 12}, ... örüntüsünde 9. terim kaçtır?`,
          correct,
          [correct - 4, correct + 2, correct + 4],
          'Her adımda 4 artar. 9. terim için ilk terime 8 kez 4 eklenir.'
        );
      },
      Orta: (index) => {
        const start = 2 + index;
        const seq = [start, start + 4, start + 10, start + 18];
        const correct = seq[3] + 10;
        return makeQuestion(
          `6. Sınıf orta örüntü ${index + 1}: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ... örüntüsünde sıradaki sayı kaçtır?`,
          correct,
          [correct - 2, correct + 2, correct + 4],
          'Artışlar 4, 6, 8 şeklindedir. Sonraki artış 10 olur.'
        );
      },
      Zor: (index) => {
        const step = 12 + index;
        const correct = (2 * step) + 1;
        return makeQuestion(
          `6. Sınıf zor örüntü ${index + 1}: Bir şekil örüntüsünde 1. adımda 3 kare, 2. adımda 5 kare, 3. adımda 7 kare kullanılıyor. ${step}. adımda kaç kare kullanılır?`,
          correct,
          [correct - 2, correct + 2, correct + 4],
          `Kural tek sayılar örüntüsüdür. n. adımda 2n + 1 kare vardır. ${step}. adım için sonuç ${correct} olur.`
        );
      },
    },
  },
  {
    classLevel: '7. Sınıf',
    lessonTitle: 'Cebirsel İfade ile Örüntü',
    content: 'Örüntünün genel terimi sözel ve cebirsel olarak ifade edilir. Basit doğrusal ilişkiler kurulur.',
    quiz: {
      question: '5, 9, 13, 17 örüntüsünün n. terimi hangi yapıya uygundur?',
      options: ['4n', '4n + 1', '4n - 1', '5n'],
      correctAnswer: '4n + 1',
      explanation: '1. terimde 5 verdiği için 4n + 1 kuralı uygundur.',
    },
    nextTopics: ['Doğrusal örüntüler', 'Grafik çizimi', 'Değişim oranı'],
    generators: {
      Kolay: (index) => {
        const add = 4 + index;
        const start = add + 1;
        const constant = start - add;
        const correct = `${add}n + ${constant}`;
        return makeQuestion(
          `7. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + add}, ${start + 2 * add}, ${start + 3 * add}, ... örüntüsünün genel terimi aşağıdakilerden hangisidir?`,
          correct,
          [`${add}n`, `${add}n + ${constant + 2}`, `${add + 1}n + ${constant}`],
          `Örüntü sabit ${add} artıyor. İlk terim ${start} olduğundan a_n = ${correct} olur.`
        );
      },
      Orta: (index) => {
        const start = 18 + index;
        const correct = arithmeticNth(start, -3, 11);
        return makeQuestion(
          `7. Sınıf orta örüntü ${index + 1}: ${start}, ${start - 3}, ${start - 6}, ${start - 9}, ... örüntüsünün 11. terimi kaçtır?`,
          correct,
          [correct - 3, correct + 3, correct + 6],
          'Her adımda 3 azalır. 11. terim için 10 kez 3 çıkarılır.'
        );
      },
      Zor: (index) => {
        const offset = 1 + index;
        const correct = `n² + ${offset}`;
        return makeQuestion(
          `7. Sınıf zor örüntü ${index + 1}: ${1 + offset}, ${4 + offset}, ${9 + offset}, ${16 + offset}, ... örüntüsünün genel kuralı aşağıdakilerden hangisidir?`,
          correct,
          [`n² - ${offset}`, `n² + n + ${offset}`, `2n + ${offset}`],
          'Terimler kare sayılara sabit bir sayı eklenerek elde edilir. Bu nedenle genel kural n² + sabit olur.'
        );
      },
    },
  },
  {
    classLevel: '8. Sınıf',
    lessonTitle: 'Lineer Örüntüler ve Genel Terim',
    content: 'Lineer örüntülerde genel terim, tablo üzerinden keşfedilir. Yeni nesil soru mantığıyla ilişki kurulur.',
    quiz: {
      question: '7, 12, 17, 22 örüntüsünün genel terimi nedir?',
      options: ['5n + 2', '5n + 7', '7n + 5', '5n - 2'],
      correctAnswer: '5n + 2',
      explanation: '1. terimde 7 verdiği için 5n + 2 kuralı uygundur.',
    },
    nextTopics: ['Geometrik artan modeller', 'Karesel sayılar', 'Üçgensel sayılar'],
    generators: {
      Kolay: (index) => {
        const diff = 5 + index;
        const start = 7 + index;
        const constant = start - diff;
        const correct = `${diff}n + ${constant}`;
        return makeQuestion(
          `8. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + diff}, ${start + 2 * diff}, ${start + 3 * diff}, ... örüntüsünün genel terimi hangisidir?`,
          correct,
          [`${diff}n`, `${diff + 1}n + ${constant}`, `${diff}n + ${constant + 2}`],
          `Sabit fark ${diff} tir. a_n = ${start} + (n - 1) x ${diff} düzenlenince ${correct} elde edilir.`
        );
      },
      Orta: (index) => {
        const a = 3 + index;
        const b = 4 + index;
        const n = 10 + index;
        const correct = (a * n) + b;
        return makeQuestion(
          `8. Sınıf orta örüntü ${index + 1}: a_n = ${a}n + ${b} kuralına göre ${n}. terim kaçtır?`,
          correct,
          [correct - a, correct + a, correct + 2],
          `n yerine ${n} yazılır: ${a} x ${n} + ${b} = ${correct}.`
        );
      },
      Zor: (index) => {
        const shift = 2 + index;
        const ask = 20;
        const correct = (ask + shift) ** 2;
        return makeQuestion(
          `8. Sınıf zor örüntü ${index + 1}: ${shift ** 2}, ${(shift + 1) ** 2}, ${(shift + 2) ** 2}, ${(shift + 3) ** 2} şeklinde giden örüntüde ${ask}. terim kaçtır?`,
          correct,
          [((ask + shift - 1) ** 2), ((ask + shift + 1) ** 2), correct + 4],
          'Örüntü ardışık kare sayılardan oluşur. İstenen sıradaki kare sayı hesaplanır.'
        );
      },
    },
  },
  {
    classLevel: '9. Sınıf',
    lessonTitle: 'Aritmetik Diziler',
    content: 'Örüntü kavramı dizilere bağlanır. Aritmetik dizide ortak fark ve n. terim formülü üzerinde durulur.',
    quiz: {
      question: '3, 8, 13, 18 dizisinin ortak farkı kaçtır?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '5',
      explanation: 'Her ardışık iki terim arasında 5 fark vardır.',
    },
    nextTopics: ['Fonksiyonel örüntüler', 'Veri analizi', 'Tahminleme'],
    generators: {
      Kolay: (index) => {
        const start = 3 + index;
        const diff = 5 + index;
        const correct = arithmeticNth(start, diff, 12);
        return makeQuestion(
          `9. Sınıf kolay örüntü ${index + 1}: ${start}, ${start + diff}, ${start + 2 * diff}, ${start + 3 * diff}, ... aritmetik dizisinin 12. terimi kaçtır?`,
          correct,
          [correct - diff, correct + diff, correct + 2],
          `a_12 = ${start} + 11 x ${diff} = ${correct} olur.`
        );
      },
      Orta: (index) => {
        const start = 10 + index;
        const diff = -(2 + index);
        const correct = arithmeticNth(start, diff, 15);
        return makeQuestion(
          `9. Sınıf orta örüntü ${index + 1}: İlk terimi ${start}, ortak farkı ${diff} olan aritmetik dizinin 15. terimi kaçtır?`,
          correct,
          [correct - Math.abs(diff), correct + Math.abs(diff), correct + 2],
          `a_15 = ${start} + 14 x (${diff}) = ${correct} bulunur.`
        );
      },
      Zor: (index) => {
        const a1 = 4 + index;
        const d = 3 + index;
        const a10 = a1 + (9 * d);
        return makeQuestion(
          `9. Sınıf zor örüntü ${index + 1}: Bir aritmetik dizide a1 = ${a1} ve a10 = ${a10} ise ortak fark kaçtır?`,
          d,
          [d - 1, d + 1, d + 2],
          `a10 = a1 + 9d olduğundan ${a10} = ${a1} + 9d olur. Buradan d = ${d} bulunur.`
        );
      },
    },
  },
  {
    classLevel: '10. Sınıf',
    lessonTitle: 'Dizilerde Örüntü Analizi',
    content: 'Aritmetik ve özel örüntüler birlikte incelenir. Öğrenci kuralı denkleme dönüştürüp terim hesabı yapar.',
    quiz: {
      question: '2, 6, 18, 54 dizisi hangi örüntüye örnektir?',
      options: ['Aritmetik', 'Geometrik', 'Azalan lineer', 'Sabit'],
      correctAnswer: 'Geometrik',
      explanation: 'Her terim bir öncekinin 3 katıdır.',
    },
    nextTopics: ['Geometrik artış ve azalış', 'Dizilerde terim ilişkileri', 'Gerçek hayat modelleme soruları'],
    generators: {
      Kolay: (index) => {
        const start = 2 + index;
        const ratio = 2 + (index % 3);
        const correct = geometricNth(start, ratio, 6);
        return makeQuestion(
          `10. Sınıf kolay örüntü ${index + 1}: ${start}, ${start * ratio}, ${start * (ratio ** 2)}, ${start * (ratio ** 3)}, ... geometrik dizisinin 6. terimi kaçtır?`,
          correct,
          [geometricNth(start, ratio, 5), geometricNth(start, ratio, 7), correct + ratio],
          `Oran ${ratio} tür. a_6 = ${start} x ${ratio}^5 = ${correct} olur.`
        );
      },
      Orta: (index) => {
        const start = 81 * (index + 1);
        return makeQuestion(
          `10. Sınıf orta örüntü ${index + 1}: ${start}, ${start / 3}, ${start / 9}, ${start / 27}, ... geometrik dizisinin ortak oranı kaçtır?`,
          '1/3',
          ['1/2', '3', '1/9'],
          'Her terim bir öncekinin üçte biridir. Ortak oran 1/3 tür.'
        );
      },
      Zor: (index) => {
        const start = 5 + index;
        const correct = sumGeometric(start, 2, 5);
        return makeQuestion(
          `10. Sınıf zor örüntü ${index + 1}: a_n = ${start} x 2^(n-1) geometrik dizisinde ilk 5 terimin toplamı kaç eder?`,
          correct,
          [correct - start, correct + start, correct + 2],
          `Toplam formülü kullanılır: S_5 = ${start} x (2^5 - 1) = ${correct}.`
        );
      },
    },
  },
  {
    classLevel: '11. Sınıf',
    lessonTitle: 'İleri Düzey Diziler ve Kurallar',
    content: 'Dizilerde genel terim, toplam ve farklı örüntü türleri karşılaştırılır. Öğrenci verilen kurala göre ileri-geri yorum yapar.',
    quiz: {
      question: 'a_n = 2n² - 1 kuralına göre a_3 kaçtır?',
      options: ['11', '13', '15', '17'],
      correctAnswer: '17',
      explanation: '2 x 3² - 1 = 18 - 1 = 17 bulunur.',
    },
    nextTopics: ['Aritmetik Diziler', 'Geometrik Diziler', 'Toplam Sembolü (Σ)'],
    generators: {
      Kolay: (index) => {
        const coef = 2 + index;
        const constant = 1 + index;
        const correct = (coef * 16) - constant;
        return makeQuestion(
          `11. Sınıf kolay örüntü ${index + 1}: a_n = ${coef}n² - ${constant} kuralına göre 4. terim kaçtır?`,
          correct,
          [correct - 2, correct + 2, correct + 4],
          `n yerine 4 yazılır: ${coef} x 4² - ${constant} = ${correct}.`
        );
      },
      Orta: (index) => {
        const start = 6 + index;
        const seq = [start, start + 5, start + 12, start + 21];
        const correct = seq[3] + 11;
        return makeQuestion(
          `11. Sınıf orta örüntü ${index + 1}: ${seq[0]}, ${seq[1]}, ${seq[2]}, ${seq[3]}, ... dizisinin artış düzeni incelendiğinde sıradaki terim kaç olur?`,
          correct,
          [correct - 2, correct + 2, correct + 4],
          'Artışlar 5, 7, 9 şeklindedir. Sonraki artış 11 olur.'
        );
      },
      Zor: (index) => {
        const n1 = 5 + index;
        const n2 = 6 + index;
        const correct = (n1 ** 2 + (3 * n1)) + (n2 ** 2 + (3 * n2));
        return makeQuestion(
          `11. Sınıf zor örüntü ${index + 1}: Bir dizinin genel terimi a_n = n² + 3n ise a_${n1} + a_${n2} toplamı kaçtır?`,
          correct,
          [correct - 4, correct + 4, correct + 8],
          `Önce a_${n1} ve a_${n2} hesaplanır, ardından toplanır. Sonuç ${correct} olur.`
        );
      },
    },
  },
  {
    classLevel: '12. Sınıf',
    lessonTitle: 'Fonksiyonel ve Karmaşık Örüntüler',
    content: 'Üst düzey örüntüler, diziler ve fonksiyon ilişkisiyle değerlendirilir. Sınav tipi yorum ve işlem soruları çözülür.',
    quiz: {
      question: 'a_n = 3n - 2 dizisinin 10. terimi kaçtır?',
      options: ['26', '28', '30', '32'],
      correctAnswer: '28',
      explanation: 'a_10 = 3 x 10 - 2 = 28 bulunur.',
    },
    nextTopics: ['Yakınsak diziler', 'Fibonacci Dizisi ve Altın Oran', 'Fraktallar'],
    generators: {
      Kolay: (index) => {
        const a = 3 + index;
        const b = 2 + index;
        const correct = (a * 25) - b;
        return makeQuestion(
          `12. Sınıf kolay örüntü ${index + 1}: a_n = ${a}n - ${b} kuralına göre 25. terim kaçtır?`,
          correct,
          [correct - a, correct + a, correct + 2],
          `n yerine 25 yazılır: ${a} x 25 - ${b} = ${correct}.`
        );
      },
      Orta: (index) => {
        const start = 2 + index;
        const correct = sumGeometric(start, 2, 8);
        return makeQuestion(
          `12. Sınıf orta örüntü ${index + 1}: İlk terimi ${start} ve ortak oranı 2 olan geometrik dizinin ilk 8 teriminin toplamı kaçtır?`,
          correct,
          [correct - start, correct + start, correct + 2],
          `S_8 = ${start} x (2^8 - 1) = ${correct} bulunur.`
        );
      },
      Zor: (index) => {
        const c = 2 + index;
        const n = 5 + index;
        const target = (n ** 2) + n + c;
        return makeQuestion(
          `12. Sınıf zor örüntü ${index + 1}: a_n = n² + n + ${c} dizisinde a_n = ${target} olması için n kaçtır?`,
          n,
          [n - 1, n + 1, n + 2],
          `n² + n + ${c} = ${target} denklemi çözülür. Doğal sayı kök olarak n = ${n} elde edilir.`
        );
      },
    },
  },
];

async function seedUsers() {
  const admin = await upsertUser({
    email: process.env.SEED_ADMIN_EMAIL || 'admin@edumath.local',
    password: process.env.SEED_ADMIN_PASSWORD || 'change-admin-password',
    name: 'Edumath Admin',
    role: 'admin',
    extra: {
      status: 'active',
      mustChangePassword: true,
      emailVerified: true,
      language: 'TR',
    },
  });

  const teacher = await upsertUser({
    email: process.env.SEED_TEACHER_EMAIL || 'teacher@edumath.local',
    password: process.env.SEED_TEACHER_PASSWORD || 'change-teacher-password',
    name: 'Edumath Matematik Öğretmeni',
    role: 'teacher',
    extra: {
      branch: 'Matematik',
      branchApproval: 'approved',
      status: 'active',
      mustChangePassword: true,
      emailVerified: true,
      language: 'TR',
    },
  });

  const student = await upsertUser({
    email: process.env.SEED_STUDENT_EMAIL || 'student@edumath.local',
    password: process.env.SEED_STUDENT_PASSWORD || 'change-student-password',
    name: 'Edumath Demo Öğrenci',
    role: 'student',
    extra: {
      grade: '5. Sınıf',
      schoolType: 'ortaokul',
      status: 'active',
      mustChangePassword: true,
      emailVerified: true,
      language: 'TR',
    },
  });

  await Student.updateOne(
    { userId: student._id, teacherId: teacher._id },
    {
      $set: {
        grade: '5. Sınıf',
        schoolNumber: '1001',
        averageScore: 82,
      },
    },
    { upsert: true }
  );

  return { admin, teacher, student };
}

async function seedCurriculum(teacherId) {
  let topicsTouched = 0;
  let lessonsTouched = 0;
  let examsTouched = 0;

  const seededExtraTopicNames = Array.from(new Set(curriculum.flatMap((item) => item.nextTopics || [])));
  const extraTopics = await Topic.find({
    name: { $in: seededExtraTopicNames },
    subject: 'Matematik',
  }).select('_id');
  const extraTopicIds = extraTopics.map((topic) => topic._id);

  if (extraTopicIds.length > 0) {
    await Lesson.deleteMany({ topic: { $in: extraTopicIds } });
    await Topic.deleteMany({ _id: { $in: extraTopicIds } });
  }

  await Question.deleteMany({
    topic: 'Örüntüler',
    subject: 'Matematik',
    createdBy: teacherId,
  });

  await Exam.deleteMany({
    topic: 'Örüntüler',
    subject: 'Matematik',
    createdBy: teacherId,
    examType: 'meb-patterns-screening',
  });

  for (const item of curriculum) {
    const metadata = curriculumMetadata[item.classLevel];
    const topic = await Topic.findOneAndUpdate(
      { name: 'Örüntüler', classLevel: item.classLevel, subject: 'Matematik' },
      { $set: { order: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    topicsTouched += 1;

    const lesson = await Lesson.findOneAndUpdate(
      { title: item.lessonTitle, topic: topic._id },
      {
        $set: {
          order: 1,
          content: `${item.content}\n\nMEB kazanım odağı: ${metadata.learningOutcome}\nProgram notu: ${metadata.curriculumNote}`,
          quiz: [
            {
              question: item.quiz.question,
              options: item.quiz.options.map((text) => ({ text })),
              correctAnswer: item.quiz.correctAnswer,
              explanation: item.quiz.explanation,
            },
          ],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    lessonsTouched += 1;

    await Topic.updateOne({ _id: topic._id }, { $set: { lessons: [lesson._id] } });

    const docs = [];
    for (const difficulty of ['Kolay', 'Orta', 'Zor']) {
      for (let index = 0; index < 7; index += 1) {
        const question = item.generators[difficulty](index);
        docs.push({
          ...question,
          text: enrichQuestionText(question.text, item.classLevel, difficulty, index),
          image: getQuestionImage(item.classLevel, difficulty, question.text),
          options: enrichOptionsWithImages(question.options),
          subject: 'Matematik',
          topic: 'Örüntüler',
          learningOutcome: metadata.learningOutcome,
          mebReference: MEB_REFERENCE,
          curriculumNote: metadata.curriculumNote,
          classLevel: item.classLevel,
          difficulty,
          type: 'multiple-choice',
          source: 'Manuel',
          createdBy: teacherId,
        });
      }
    }
    await Question.insertMany(docs);

    const examQuestions = await Question.find({
      topic: 'Örüntüler',
      subject: 'Matematik',
      classLevel: item.classLevel,
      createdBy: teacherId,
    })
      .sort({ difficulty: 1, createdAt: 1, _id: 1 })
      .select('_id learningOutcome');

    const learningOutcomes = Array.from(new Set(examQuestions.map((question) => question.learningOutcome).filter(Boolean)));

    await Exam.findOneAndUpdate(
      {
        title: `${item.classLevel} Matematik - Örüntüler MEB Kazanım Tarama Sınavı`,
        classLevel: item.classLevel,
        subject: 'Matematik',
        topic: 'Örüntüler',
        createdBy: teacherId,
      },
      {
        $set: {
          description: `${item.classLevel} düzeyinde yalnızca Örüntüler konusu için hazırlanmış, 7 kolay 7 orta 7 zor sorudan oluşan MEB kazanım tarama sınavı.`,
          duration: metadata.examDuration,
          questions: examQuestions.map((question) => question._id),
          status: 'active',
          examType: 'meb-patterns-screening',
          learningOutcomes,
          mebReference: MEB_REFERENCE,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    examsTouched += 1;
  }

  const patternQuestions = await Question.countDocuments({ topic: 'Örüntüler', subject: 'Matematik', createdBy: teacherId });
  const mebTaggedQuestions = await Question.countDocuments({
    topic: 'Örüntüler',
    subject: 'Matematik',
    createdBy: teacherId,
    learningOutcome: { $ne: '' },
    mebReference: { $ne: '' },
  });
  const totalTopics = await Topic.countDocuments({ subject: 'Matematik' });
  const totalLessons = await Lesson.countDocuments({});
  const totalExams = await Exam.countDocuments({ topic: 'Örüntüler', subject: 'Matematik', createdBy: teacherId });

  return { topicsTouched, lessonsTouched, examsTouched, patternQuestions, mebTaggedQuestions, totalTopics, totalLessons, totalExams };
}

async function main() {
  const { uri, dbName } = getMongoConfig();
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const { admin, teacher, student } = await seedUsers();
    const stats = await seedCurriculum(teacher._id);

    console.log(JSON.stringify({
      db: dbName,
      users: {
        admin: { email: admin.email, mustChangePassword: admin.mustChangePassword },
        teacher: { email: teacher.email, mustChangePassword: teacher.mustChangePassword },
        student: { email: student.email, mustChangePassword: student.mustChangePassword },
      },
      seeded: stats,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
